import { v4 as uuidv4 } from "uuid";
import { Alert, Borrower } from "../types";
import { scoreBorrower, getRecommendedAction } from "./riskScorer";
import { generateAlertExplanation } from "./llmService";
import { BORROWERS } from "../data/mockData";

// In-memory alert store: Map of borrowerId to Alert.
const alertStore: Map<string, Alert> = new Map();

export async function generateAlertForBorrower(
  borrower: Borrower,
): Promise<Alert> {
  const { score, category, signals } = scoreBorrower(borrower);
  const recommendedAction = getRecommendedAction(category, signals);

  // Call LLM for explanation (non-blocking; gracefully handles failure)
  const llmExplanation = await generateAlertExplanation(
    borrower,
    signals,
    category,
    score,
    recommendedAction,
  );

  const alert: Alert = {
    alertId: uuidv4(),
    borrowerId: borrower.borrowerId,
    borrowerName: borrower.name,
    generatedAt: new Date().toISOString(),
    riskCategory: category,
    riskScore: score,
    signals,
    recommendedAction,
    llmExplanation,
  };

  alertStore.set(borrower.borrowerId, alert);
  return alert;
}

export async function generateAllAlerts(): Promise<Alert[]> {
  const promises = BORROWERS.map((b) => generateAlertForBorrower(b));
  return Promise.all(promises);
}

export async function getAlertForBorrower(
  borrowerId: string,
): Promise<Alert | null> {
  const borrower = BORROWERS.find((b) => b.borrowerId === borrowerId);
  if (!borrower) return null;

  if (alertStore.has(borrowerId)) {
    return alertStore.get(borrowerId)!;
  }

  return generateAlertForBorrower(borrower);
}

export function getCachedAlerts(): Alert[] {
  return Array.from(alertStore.values());
}

// Scenario simulation: "What if next EMI is missed?"

export function simulateMissedNextEMI(borrowerId: string): {
  current: { score: number; category: string };
  simulated: { score: number; category: string };
  delta: number;
} | null {
  const borrower = BORROWERS.find((b) => b.borrowerId === borrowerId);
  if (!borrower) return null;

  const current = scoreBorrower(borrower);

  // Clone borrower and inject a missed EMI at the front of emiHistory
  const simulatedBorrower: Borrower = {
    ...borrower,
    emiHistory: [
      {
        dueDate: borrower.nextDueDate,
        paidDate: null,
        amount: borrower.emiAmount,
        status: "missed",
        daysLate: 1,
      },
      ...borrower.emiHistory,
    ],
    recentTransactions: [
      {
        date: borrower.nextDueDate,
        type: "auto_debit_failed",
        amount: borrower.emiAmount,
        description: "Auto-debit failed (simulated)",
      },
      ...borrower.recentTransactions,
    ],
  };

  const simulated = scoreBorrower(simulatedBorrower);

  return {
    current: { score: current.score, category: current.category },
    simulated: { score: simulated.score, category: simulated.category },
    delta: simulated.score - current.score,
  };
}
