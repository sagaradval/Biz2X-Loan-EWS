import { Request, Response, NextFunction } from "express";
import { MockUser, UserRole } from "../types";
import { MOCK_USERS, TOKEN_MAP } from "../data/mockData";

declare global {
  namespace Express {
    interface Request {
      user?: MockUser;
    }
  }
}

// Authentication Middleware
// In production we will be using JWT and fetching user info from DB if needed. Currently we're using a hardcoded map for simplicity.

export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      error:
        "Missing or malformed Authorization header. Expected: Bearer <token>",
    });
    return;
  }

  const token = authHeader.slice(7).trim();
  const userId = TOKEN_MAP[token];

  if (!userId) {
    res.status(401).json({ success: false, error: "Invalid token" });
    return;
  }

  const user = MOCK_USERS.find((u) => u.userId === userId);
  if (!user) {
    res.status(401).json({ success: false, error: "User not found" });
    return;
  }

  req.user = user;
  next();
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: "Unauthenticated" });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: `Access denied. Required role: ${roles.join(" or ")}`,
      });
      return;
    }
    next();
  };
}

export function canAccessBorrower(user: MockUser, borrowerId: string): boolean {
  // Analysts can only see their assigned borrowers
  // Borrowers can only see themselves
  return user.linkedBorrowerIds.includes(borrowerId);
}
