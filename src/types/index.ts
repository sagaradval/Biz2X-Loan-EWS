// // ─── Enums ────────────────────────────────────────────────────────────────────

// export type RiskCategory = "Low" | "Watchlist" | "High Risk" | "Critical";
// export type UserRole = "analyst" | "borrower";

// export type RecommendedAction =
//   | "no_action"
//   | "soft_reminder"
//   | "payment_plan_offer"
//   | "proactive_call"
//   | "restructuring_review"
//   | "manual_analyst_review";

// // ─── Mock Data Shapes ─────────────────────────────────────────────────────────

// export interface Transaction {
//   date: string; // ISO date
//   type: "credit" | "debit" | "emi_payment" | "auto_debit_failed";
//   amount: number;
//   description: string;
// }

// export interface EMIRecord {
//   dueDate: string;
//   paidDate: string | null; // null = not paid yet
//   amount: number;
//   status: "paid_on_time" | "paid_late" | "missed" | "upcoming";
//   daysLate: number; // 0 if on time
// }

// export interface Borrower {
//   borrowerId: string;
//   name: string;
//   loanId: string;
//   loanAmount: number;
//   emiAmount: number;
//   outstandingBalance: number;
//   loanStartDate: string;
//   nextDueDate: string;
//   creditUtilizationPercent: number; // 0-100
//   emiHistory: EMIRecord[];
//   recentTransactions: Transaction[]; // last 90 days
//   assignedAnalystId: string; // which analyst owns this borrower
// }

// // ─── Risk Scoring ─────────────────────────────────────────────────────────────

// export interface RiskSignal {
//   signal: string;
//   weight: number; // contribution to risk score
//   detail: string;
// }

// export interface RiskScore {
//   score: number; // 0-100
//   category: RiskCategory;
//   signals: RiskSignal[];
// }

// // ─── Alert ────────────────────────────────────────────────────────────────────

// export interface Alert {
//   alertId: string;
//   borrowerId: string;
//   borrowerName: string;
//   generatedAt: string;
//   riskCategory: RiskCategory;
//   riskScore: number;
//   signals: RiskSignal[];
//   recommendedAction: RecommendedAction;
//   llmExplanation: string | null; // null if LLM call failed or not yet generated
// }

// // ─── Auth (mocked) ────────────────────────────────────────────────────────────

// export interface MockUser {
//   userId: string;
//   role: UserRole;
//   name: string;
//   // for analysts: list of borrowerIds they manage
//   // for borrowers: their own borrowerId
//   linkedBorrowerIds: string[];
// }

// // ─── API response types ───────────────────────────────────────────────────────

// export interface ApiResponse<T> {
//   success: boolean;
//   data?: T;
//   error?: string;
// }

// export interface PortfolioSummary {
//   total: number;
//   byCategory: Record<RiskCategory, number>;
//   criticalBorrowers: { borrowerId: string; name: string; score: number }[];
// }

export * from "./borrower.types";
export * from "./risk.types";
export * from "./alert.types";
export * from "./auth.types";
export * from "./common.types";
