import { RiskCategory } from "./risk.types";

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PortfolioSummary {
  total: number;
  byCategory: Record<RiskCategory, number>;
  criticalBorrowers: {
    borrowerId: string;
    name: string;
    score: number;
  }[];
}
