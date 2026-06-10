import { Borrower, MockUser } from "../types";

// ─── Mock Borrowers ───────────────────────────────────────────────────────────
// To trigger different risk categories

export const BORROWERS: Borrower[] = [
  // ── B001: LOW RISK — consistent payments, healthy cash flow ──────────────
  {
    borrowerId: "B001",
    name: "Arjun Mehta",
    loanId: "L001",
    loanAmount: 500000,
    emiAmount: 12500,
    outstandingBalance: 320000,
    loanStartDate: "2023-01-15",
    nextDueDate: "2026-06-25",
    creditUtilizationPercent: 22,
    assignedAnalystId: "A001",
    emiHistory: [
      {
        dueDate: "2026-05-25",
        paidDate: "2026-05-24",
        amount: 12500,
        status: "paid_on_time",
        daysLate: 0,
      },
      {
        dueDate: "2026-04-25",
        paidDate: "2026-04-25",
        amount: 12500,
        status: "paid_on_time",
        daysLate: 0,
      },
      {
        dueDate: "2026-03-25",
        paidDate: "2026-03-23",
        amount: 12500,
        status: "paid_on_time",
        daysLate: 0,
      },
      {
        dueDate: "2026-02-25",
        paidDate: "2026-02-26",
        amount: 12500,
        status: "paid_on_time",
        daysLate: 1,
      },
      {
        dueDate: "2026-01-25",
        paidDate: "2026-01-25",
        amount: 12500,
        status: "paid_on_time",
        daysLate: 0,
      },
    ],
    recentTransactions: [
      {
        date: "2026-06-01",
        type: "credit",
        amount: 85000,
        description: "Salary credit - TechCorp",
      },
      {
        date: "2026-05-28",
        type: "debit",
        amount: 15000,
        description: "Grocery & utilities",
      },
      {
        date: "2026-05-24",
        type: "emi_payment",
        amount: 12500,
        description: "Loan L001 EMI",
      },
      {
        date: "2026-05-01",
        type: "credit",
        amount: 85000,
        description: "Salary credit - TechCorp",
      },
      {
        date: "2026-04-25",
        type: "emi_payment",
        amount: 12500,
        description: "Loan L001 EMI",
      },
    ],
  },

  // ── B002: WATCHLIST — 2 late payments, slightly high utilization ──────────
  {
    borrowerId: "B002",
    name: "Priya Sharma",
    loanId: "L002",
    loanAmount: 300000,
    emiAmount: 9000,
    outstandingBalance: 245000,
    loanStartDate: "2023-06-10",
    nextDueDate: "2026-06-18",
    creditUtilizationPercent: 61,
    assignedAnalystId: "A001",
    emiHistory: [
      {
        dueDate: "2026-05-18",
        paidDate: "2026-05-25",
        amount: 9000,
        status: "paid_late",
        daysLate: 7,
      },
      {
        dueDate: "2026-04-18",
        paidDate: "2026-04-29",
        amount: 9000,
        status: "paid_late",
        daysLate: 11,
      },
      {
        dueDate: "2026-03-18",
        paidDate: "2026-03-18",
        amount: 9000,
        status: "paid_on_time",
        daysLate: 0,
      },
      {
        dueDate: "2026-02-18",
        paidDate: "2026-02-18",
        amount: 9000,
        status: "paid_on_time",
        daysLate: 0,
      },
      {
        dueDate: "2026-01-18",
        paidDate: "2026-01-21",
        amount: 9000,
        status: "paid_late",
        daysLate: 3,
      },
    ],
    recentTransactions: [
      {
        date: "2026-06-01",
        type: "credit",
        amount: 45000,
        description: "Salary credit",
      },
      {
        date: "2026-05-25",
        type: "emi_payment",
        amount: 9000,
        description: "Loan L002 EMI (late)",
      },
      {
        date: "2026-05-15",
        type: "debit",
        amount: 22000,
        description: "Credit card payment",
      },
      {
        date: "2026-05-01",
        type: "credit",
        amount: 45000,
        description: "Salary credit",
      },
      {
        date: "2026-04-29",
        type: "emi_payment",
        amount: 9000,
        description: "Loan L002 EMI (late)",
      },
    ],
  },

  // ── B003: HIGH RISK — missed payment, failed auto-debit, declining income ─
  {
    borrowerId: "B003",
    name: "Rohit Verma",
    loanId: "L003",
    loanAmount: 750000,
    emiAmount: 18500,
    outstandingBalance: 698000,
    loanStartDate: "2025-09-01",
    nextDueDate: "2026-06-15",
    creditUtilizationPercent: 78,
    assignedAnalystId: "A002",
    emiHistory: [
      {
        dueDate: "2026-05-15",
        paidDate: null,
        amount: 18500,
        status: "missed",
        daysLate: 26,
      },
      {
        dueDate: "2026-04-15",
        paidDate: "2026-04-28",
        amount: 18500,
        status: "paid_late",
        daysLate: 13,
      },
      {
        dueDate: "2026-03-15",
        paidDate: "2026-03-22",
        amount: 18500,
        status: "paid_late",
        daysLate: 7,
      },
      {
        dueDate: "2026-02-15",
        paidDate: "2026-02-18",
        amount: 18500,
        status: "paid_late",
        daysLate: 3,
      },
      {
        dueDate: "2026-01-15",
        paidDate: "2026-01-15",
        amount: 18500,
        status: "paid_on_time",
        daysLate: 0,
      },
    ],
    recentTransactions: [
      {
        date: "2026-05-15",
        type: "auto_debit_failed",
        amount: 18500,
        description: "Auto-debit failed - insufficient funds",
      },
      {
        date: "2026-05-10",
        type: "auto_debit_failed",
        amount: 18500,
        description: "Auto-debit failed - insufficient funds",
      },
      {
        date: "2026-05-01",
        type: "credit",
        amount: 32000,
        description: "Freelance payment",
      },
      {
        date: "2026-04-28",
        type: "emi_payment",
        amount: 18500,
        description: "Loan L003 EMI (late)",
      },
      {
        date: "2026-04-01",
        type: "credit",
        amount: 55000,
        description: "Salary credit",
      }, // income dropped
      {
        date: "2026-03-01",
        type: "credit",
        amount: 72000,
        description: "Salary credit",
      },
    ],
  },

  // ── B004: CRITICAL — multiple missed EMIs, failed debits, near zero balance
  {
    borrowerId: "B004",
    name: "Sunita Patel",
    loanId: "L004",
    loanAmount: 200000,
    emiAmount: 6500,
    outstandingBalance: 192000,
    loanStartDate: "2025-11-01",
    nextDueDate: "2026-06-10",
    creditUtilizationPercent: 92,
    assignedAnalystId: "A002",
    emiHistory: [
      {
        dueDate: "2026-05-10",
        paidDate: null,
        amount: 6500,
        status: "missed",
        daysLate: 31,
      },
      {
        dueDate: "2026-04-10",
        paidDate: null,
        amount: 6500,
        status: "missed",
        daysLate: 61,
      },
      {
        dueDate: "2026-03-10",
        paidDate: "2026-03-28",
        amount: 3250,
        status: "paid_late",
        daysLate: 18,
      }, // partial payment
      {
        dueDate: "2026-02-10",
        paidDate: "2026-02-20",
        amount: 6500,
        status: "paid_late",
        daysLate: 10,
      },
      {
        dueDate: "2026-01-10",
        paidDate: "2026-01-18",
        amount: 6500,
        status: "paid_late",
        daysLate: 8,
      },
    ],
    recentTransactions: [
      {
        date: "2026-06-05",
        type: "auto_debit_failed",
        amount: 6500,
        description: "Auto-debit failed",
      },
      {
        date: "2026-05-10",
        type: "auto_debit_failed",
        amount: 6500,
        description: "Auto-debit failed",
      },
      {
        date: "2026-05-05",
        type: "credit",
        amount: 8000,
        description: "Misc credit",
      },
      {
        date: "2026-04-10",
        type: "auto_debit_failed",
        amount: 6500,
        description: "Auto-debit failed",
      },
      {
        date: "2026-04-01",
        type: "credit",
        amount: 10000,
        description: "Partial salary",
      },
      {
        date: "2026-03-28",
        type: "emi_payment",
        amount: 3250,
        description: "Partial EMI payment",
      },
    ],
  },

  // ── B005: WATCHLIST — new borrower, insufficient history edge case ─────────
  {
    borrowerId: "B005",
    name: "Karan Singh",
    loanId: "L005",
    loanAmount: 150000,
    emiAmount: 5500,
    outstandingBalance: 142000,
    loanStartDate: "2026-04-01",
    nextDueDate: "2026-06-20",
    creditUtilizationPercent: 55,
    assignedAnalystId: "A001",
    emiHistory: [
      {
        dueDate: "2026-05-20",
        paidDate: "2026-05-22",
        amount: 5500,
        status: "paid_late",
        daysLate: 2,
      },
      {
        dueDate: "2026-04-20",
        paidDate: "2026-04-20",
        amount: 5500,
        status: "paid_on_time",
        daysLate: 0,
      },
    ],
    recentTransactions: [
      {
        date: "2026-06-01",
        type: "credit",
        amount: 38000,
        description: "Salary credit",
      },
      {
        date: "2026-05-22",
        type: "emi_payment",
        amount: 5500,
        description: "Loan L005 EMI",
      },
      {
        date: "2026-05-15",
        type: "debit",
        amount: 12000,
        description: "Rent payment",
      },
      {
        date: "2026-05-01",
        type: "credit",
        amount: 38000,
        description: "Salary credit",
      },
    ],
  },
];

// ─── Mock Users ───────────────────────────────────────────────────────────────
// Using static Bearer tokens in headers for ease, in production JWT would be assigned upon login/registration.

export const MOCK_USERS: MockUser[] = [
  {
    userId: "A001",
    role: "analyst",
    name: "Neha Kapoor",
    linkedBorrowerIds: ["B001", "B002", "B005"],
  },
  {
    userId: "A002",
    role: "analyst",
    name: "Vijay Nair",
    linkedBorrowerIds: ["B003", "B004"],
  },
  {
    userId: "B001",
    role: "borrower",
    name: "Arjun Mehta",
    linkedBorrowerIds: ["B001"],
  },
  {
    userId: "B002",
    role: "borrower",
    name: "Priya Sharma",
    linkedBorrowerIds: ["B002"],
  },
  {
    userId: "B003",
    role: "borrower",
    name: "Rohit Verma",
    linkedBorrowerIds: ["B003"],
  },
  {
    userId: "B004",
    role: "borrower",
    name: "Sunita Patel",
    linkedBorrowerIds: ["B004"],
  },
  {
    userId: "B005",
    role: "borrower",
    name: "Karan Singh",
    linkedBorrowerIds: ["B005"],
  },
];

export const TOKEN_MAP: Record<string, string> = {
  "token-analyst-neha": "A001",
  "token-analyst-vijay": "A002",
  "token-borrower-arjun": "B001",
  "token-borrower-priya": "B002",
  "token-borrower-rohit": "B003",
  "token-borrower-sunita": "B004",
  "token-borrower-karan": "B005",
};
