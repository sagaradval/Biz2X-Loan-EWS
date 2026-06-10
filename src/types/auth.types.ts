export type UserRole = "analyst" | "borrower";

export interface MockUser {
  userId: string;
  role: UserRole;
  name: string;
  linkedBorrowerIds: string[];
}
