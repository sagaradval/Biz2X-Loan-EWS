export type RiskCategory = "Low" | "Watchlist" | "High Risk" | "Critical";

export interface RiskSignal {
  signal: string;
  weight: number;
  detail: string;
}

export interface RiskScore {
  score: number;
  category: RiskCategory;
  signals: RiskSignal[];
}
