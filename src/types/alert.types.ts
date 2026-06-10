import { RiskCategory, RiskSignal } from "./risk.types";

export type RecommendedAction =
  | "no_action"
  | "soft_reminder"
  | "payment_plan_offer"
  | "proactive_call"
  | "restructuring_review"
  | "manual_analyst_review";

export interface Alert {
  alertId: string;
  borrowerId: string;
  borrowerName: string;
  generatedAt: string;
  riskCategory: RiskCategory;
  riskScore: number;
  signals: RiskSignal[];
  recommendedAction: RecommendedAction;
  llmExplanation: string | null;
}
