import { Alert, Borrower, RiskSignal } from "../types";

const LLM_URL = process.env.LLM_WRAPPER_URL || "";
const LLM_TOKEN = process.env.LLM_API_TOKEN || "";

// Grounding rule: LLM must only use data passed in — no hallucination of
// facts about the borrower. System prompt enforces this explicitly.

function buildSystemPrompt(): string {
  return `You are a credit risk analyst assistant at a fintech lending company.
Your role is to generate clear, concise, and factual risk alert explanations for the credit monitoring team.

STRICT GROUNDING RULES:
1. Only reference facts explicitly provided in the borrower data below.
2. Do NOT speculate, infer, or add information not present in the data.
3. Do NOT use language like "likely", "probably", or "may be experiencing" unless the data supports it.
4. Keep explanations under 150 words.
5. Structure: 1-2 sentences on what signals were detected, 1 sentence on why this matters, 1 sentence on recommended action.
6. Use professional, neutral tone suitable for a credit analyst reading a dashboard.`;
}

function buildBorrowerPrompt(
  borrower: Borrower,
  signals: RiskSignal[],
  riskCategory: string,
  riskScore: number,
  recommendedAction: string,
): string {
  const signalList = signals
    .map((s) => `- ${s.signal} (weight: ${s.weight}): ${s.detail}`)
    .join("\n");

  const recentEMISummary = borrower.emiHistory
    .slice(0, 3)
    .map(
      (e) =>
        `  ${e.dueDate}: ${e.status}${e.daysLate > 0 ? ` (${e.daysLate} days late)` : ""}`,
    )
    .join("\n");

  return `Generate a risk alert explanation for borrower ${borrower.borrowerId} based ONLY on the following data:

BORROWER DATA:
- Name: ${borrower.name}
- Loan Amount: ₹${borrower.loanAmount.toLocaleString("en-IN")}
- Outstanding Balance: ₹${borrower.outstandingBalance.toLocaleString("en-IN")}
- Monthly EMI: ₹${borrower.emiAmount.toLocaleString("en-IN")}
- Credit Utilization: ${borrower.creditUtilizationPercent}%
- Next Due Date: ${borrower.nextDueDate}

RISK SCORE: ${riskScore}/100
RISK CATEGORY: ${riskCategory}
RECOMMENDED ACTION: ${recommendedAction.replace(/_/g, " ")}

DETECTED SIGNALS:
${signalList}

RECENT EMI HISTORY (last 3):
${recentEMISummary}

Write a concise alert explanation (max 150 words) for the credit analyst. Use only the data above.`;
}

function buildAnalystQueryPrompt(
  borrower: Borrower,
  alert: Alert,
  question: string,
): string {
  const signalList = alert.signals
    .map((s) => `- ${s.signal}: ${s.detail}`)
    .join("\n");

  return `An analyst is asking about borrower ${borrower.borrowerId} (${borrower.name}).

ANALYST QUESTION: "${question}"

AVAILABLE DATA ONLY (answer using only this):
Risk Score: ${alert.riskScore}/100
Risk Category: ${alert.riskCategory}
Recommended Action: ${alert.recommendedAction}

Detected Signals:
${signalList}

EMI History:
${borrower.emiHistory
  .map(
    (e) =>
      `- ${e.dueDate}: ${e.status}${e.daysLate > 0 ? ` (${e.daysLate}d late)` : ""}, amount: ₹${e.amount}`,
  )
  .join("\n")}

Recent Transactions (last 6):
${borrower.recentTransactions
  .slice(0, 6)
  .map((t) => `- ${t.date}: ${t.type} ₹${t.amount} — ${t.description}`)
  .join("\n")}

STRICT RULE: Answer ONLY using the data above. If the question cannot be answered from this data, say so explicitly. Keep answer under 200 words.`;
}

async function callLLM(
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  if (!LLM_URL || !LLM_TOKEN) {
    return "[LLM service not configured — set LLM_WRAPPER_URL and LLM_API_TOKEN in .env]";
  }

  try {
    const response = await fetch(`${LLM_URL}/llm/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LLM_TOKEN}`,
      },
      body: JSON.stringify({
        prompt: `${systemPrompt}\n\n${userPrompt}`,
        metadata: {
          client: "loan-ews",
          traceId: `ews-${Date.now()}`,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("LLM API error:", response.status, errText);
      return `[LLM call failed: HTTP ${response.status}]`;
    }

    const data = (await response.json()) as Record<string, unknown>;
    const text: string =
      (data?.content as string | undefined) ??
      (data?.response as string | undefined) ??
      (data?.text as string | undefined) ??
      JSON.stringify(data);
    return text.trim();
  } catch (err) {
    console.error("LLM fetch error:", err);
    return "[LLM service unavailable]";
  }
}

export async function generateAlertExplanation(
  borrower: Borrower,
  signals: RiskSignal[],
  riskCategory: string,
  riskScore: number,
  recommendedAction: string,
): Promise<string> {
  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildBorrowerPrompt(
    borrower,
    signals,
    riskCategory,
    riskScore,
    recommendedAction,
  );
  return callLLM(systemPrompt, userPrompt);
}

export async function answerAnalystQuery(
  borrower: Borrower,
  alert: Alert,
  question: string,
): Promise<string> {
  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildAnalystQueryPrompt(borrower, alert, question);
  return callLLM(systemPrompt, userPrompt);
}

export async function generateBorrowerExplanation(
  borrower: Borrower,
  signals: RiskSignal[],
): Promise<string> {
  const systemPrompt = `You are a helpful customer support assistant for a lending company. 
Explain to a borrower why they received a payment reminder, using simple and non-alarming language.
Do NOT mention internal risk scores or categories. Focus on actionable advice. Max 100 words.`;

  const signalList = signals.map((s) => `- ${s.detail}`).join("\n");

  const userPrompt = `Explain to borrower ${borrower.name} why they received a payment reminder.

Observations from their account:
${signalList}

Next EMI due: ${borrower.nextDueDate} — ₹${borrower.emiAmount.toLocaleString("en-IN")}

Keep it friendly and helpful. Do not reveal risk scores or internal categories.`;

  return callLLM(systemPrompt, userPrompt);
}
