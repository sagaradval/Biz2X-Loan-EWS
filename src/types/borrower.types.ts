export interface Transaction {
  date: string;
  type: "credit" | "debit" | "emi_payment" | "auto_debit_failed";
  amount: number;
  description: string;
}

export interface EMIRecord {
  dueDate: string;
  paidDate: string | null;
  amount: number;
  status: "paid_on_time" | "paid_late" | "missed" | "upcoming";
  daysLate: number;
}

export interface Borrower {
  borrowerId: string;
  name: string;
  loanId: string;
  loanAmount: number;
  emiAmount: number;
  outstandingBalance: number;
  loanStartDate: string;
  nextDueDate: string;
  creditUtilizationPercent: number;
  emiHistory: EMIRecord[];
  recentTransactions: Transaction[];
  assignedAnalystId: string;
}
