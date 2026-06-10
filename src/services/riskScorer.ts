import {
  Borrower,
  RiskCategory,
  RiskScore,
  RiskSignal,
  RecommendedAction,
} from "../types";

// Scoring Thresholds
// Category cutoffs:
//   0-24   → Low
//   25-49  → Watchlist
//   50-74  → High Risk
//   75-100 → Critical
//
// Signal weights (capped at 100):
//   Consecutive missed EMIs           : +35 per miss (max +70)
//   Any missed EMI (non-consecutive)  : +25
//   Failed auto-debits (last 30 days) : +15 per failure (max +30)
//   Days-past-due trend (worsening)   : +20
//   High credit utilization (>75%)    : +20
//   High credit utilization (50-75%)  : +10
//   Declining income (>30% drop)      : +20
//   Insufficient history (<3 EMIs)    : +10 (uncertainty penalty)
//   Partial payment                   : +15
//   Late payment trend (3+ of last 5) : +10

const CATEGORY_THRESHOLDS: { max: number; category: RiskCategory }[] = [
  { max: 24, category: "Low" },
  { max: 49, category: "Watchlist" },
  { max: 74, category: "High Risk" },
  { max: 100, category: "Critical" },
];

function getCategory(score: number): RiskCategory {
  for (const t of CATEGORY_THRESHOLDS) {
    if (score <= t.max) return t.category;
  }
  return "Critical";
}

function detectMissedEMIs(borrower: Borrower, signals: RiskSignal[]): number {
  const missed = borrower.emiHistory.filter((e) => e.status === "missed");
  if (missed.length === 0) return 0;

  // Check for consecutive misses
  let consecutive = 0;
  for (let i = 0; i < borrower.emiHistory.length; i++) {
    if (borrower.emiHistory[i].status === "missed") consecutive++;
    else break;
  }

  if (consecutive >= 2) {
    const weight = Math.min(consecutive * 35, 70);
    signals.push({
      signal: "Consecutive missed EMIs",
      weight,
      detail: `${consecutive} consecutive EMI(s) missed. Latest due: ${borrower.emiHistory[0].dueDate}`,
    });
    return weight;
  }

  const weight = 25;
  signals.push({
    signal: "Missed EMI",
    weight,
    detail: `${missed.length} missed EMI(s) in history. Most recent missed: ${missed[0].dueDate}`,
  });
  return weight;
}

function detectFailedAutoDebits(
  borrower: Borrower,
  signals: RiskSignal[],
): number {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);

  const failed = borrower.recentTransactions.filter(
    (t) => t.type === "auto_debit_failed" && new Date(t.date) >= cutoff,
  );

  if (failed.length === 0) return 0;

  const weight = Math.min(failed.length * 15, 30);
  signals.push({
    signal: "Failed auto-debit attempts",
    weight,
    detail: `${failed.length} auto-debit failure(s) in the last 30 days, indicating low account balance`,
  });
  return weight;
}

function detectDPDTrend(borrower: Borrower, signals: RiskSignal[]): number {
  const paid = borrower.emiHistory.filter(
    (e) =>
      e.status === "paid_late" ||
      e.status === "paid_on_time" ||
      e.status === "missed",
  );

  if (paid.length < 3) return 0;

  // Check if days late is increasing over recent payments
  const recentDelays = paid
    .slice(0, 3)
    .map((e) => (e.status === "missed" ? 30 : e.daysLate));
  const isWorsening =
    recentDelays[0] > recentDelays[1] && recentDelays[1] >= recentDelays[2];

  if (isWorsening) {
    signals.push({
      signal: "Worsening days-past-due trend",
      weight: 20,
      detail: `Payment delays are increasing: ${recentDelays[2]}d → ${recentDelays[1]}d → ${recentDelays[0]}d`,
    });
    return 20;
  }
  return 0;
}

function detectHighUtilization(
  borrower: Borrower,
  signals: RiskSignal[],
): number {
  const util = borrower.creditUtilizationPercent;
  if (util > 75) {
    signals.push({
      signal: "Critical credit utilization",
      weight: 20,
      detail: `Credit utilization at ${util}% (threshold: 75%)`,
    });
    return 20;
  }
  if (util > 50) {
    signals.push({
      signal: "Elevated credit utilization",
      weight: 10,
      detail: `Credit utilization at ${util}% (elevated threshold: 50%)`,
    });
    return 10;
  }
  return 0;
}

function detectDecliningIncome(
  borrower: Borrower,
  signals: RiskSignal[],
): number {
  const salaryCredits = borrower.recentTransactions
    .filter((t) => t.type === "credit" && t.amount > 5000) // filter noise
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (salaryCredits.length < 2) return 0;

  const recentIncome = salaryCredits[0].amount;
  const previousIncome = salaryCredits[1].amount;
  const dropPercent = ((previousIncome - recentIncome) / previousIncome) * 100;

  if (dropPercent > 30) {
    signals.push({
      signal: "Significant income decline",
      weight: 20,
      detail: `Income dropped by ${dropPercent.toFixed(0)}% (₹${previousIncome.toLocaleString("en-IN")} → ₹${recentIncome.toLocaleString("en-IN")})`,
    });
    return 20;
  }
  return 0;
}

function detectInsufficientHistory(
  borrower: Borrower,
  signals: RiskSignal[],
): number {
  if (borrower.emiHistory.length < 3) {
    signals.push({
      signal: "Insufficient repayment history",
      weight: 10,
      detail: `Only ${borrower.emiHistory.length} EMI(s) on record — risk assessment carries higher uncertainty`,
    });
    return 10;
  }
  return 0;
}

function detectPartialPayment(
  borrower: Borrower,
  signals: RiskSignal[],
): number {
  // Detect partial EMI payments
  const partials = borrower.emiHistory.filter(
    (e) => e.amount < borrower.emiAmount && e.status !== "upcoming",
  );
  if (partials.length > 0) {
    signals.push({
      signal: "Partial EMI payment(s) detected",
      weight: 15,
      detail: `${partials.length} payment(s) below full EMI amount (₹${borrower.emiAmount.toLocaleString("en-IN")}), suggesting cash flow stress`,
    });
    return 15;
  }
  return 0;
}

function detectLateTrend(borrower: Borrower, signals: RiskSignal[]): number {
  const last5 = borrower.emiHistory.slice(0, 5);
  const lateCount = last5.filter(
    (e) => e.status === "paid_late" || e.status === "missed",
  ).length;

  if (lateCount >= 3 && last5.length >= 3) {
    signals.push({
      signal: "Persistent late payment pattern",
      weight: 10,
      detail: `${lateCount} of last ${last5.length} EMIs were late or missed`,
    });
    return 10;
  }
  return 0;
}

function getRecommendedAction(
  category: RiskCategory,
  signals: RiskSignal[],
): RecommendedAction {
  const hasConsecutiveMiss = signals.some(
    (s) => s.signal === "Consecutive missed EMIs",
  );
  const hasIncomeDrop = signals.some(
    (s) => s.signal === "Significant income decline",
  );

  switch (category) {
    case "Low":
      return "no_action";
    case "Watchlist":
      return "soft_reminder";
    case "High Risk":
      if (hasIncomeDrop) return "payment_plan_offer";
      return "proactive_call";
    case "Critical":
      if (hasConsecutiveMiss) return "restructuring_review";
      return "manual_analyst_review";
  }
}

export function scoreBorrower(borrower: Borrower): RiskScore {
  const signals: RiskSignal[] = [];
  let score = 0;

  score += detectMissedEMIs(borrower, signals);
  score += detectFailedAutoDebits(borrower, signals);
  score += detectDPDTrend(borrower, signals);
  score += detectHighUtilization(borrower, signals);
  score += detectDecliningIncome(borrower, signals);
  score += detectInsufficientHistory(borrower, signals);
  score += detectPartialPayment(borrower, signals);
  score += detectLateTrend(borrower, signals);

  score = Math.min(score, 100); // cap at 100

  return {
    score,
    category: getCategory(score),
    signals,
  };
}

export { getRecommendedAction };
