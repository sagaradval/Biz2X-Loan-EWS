import { Router, Request, Response } from "express";
import { authenticate, requireRole } from "../middleware/auth";
import { getCachedAlerts, generateAllAlerts } from "../services/alertService";
import { BORROWERS } from "../data/mockData";
import { scoreBorrower } from "../services/riskScorer";
import { PortfolioSummary, RiskCategory } from "../types";

const router = Router();

// GET /portfolio/summary
// Analyst only. Portfolio-level risk summary.

router.get(
  "/summary",
  authenticate,
  requireRole("analyst"),
  async (req: Request, res: Response) => {
    try {
      let alerts = getCachedAlerts();

      if (alerts.length === 0) {
        alerts = await generateAllAlerts();
      }

      alerts = alerts.filter((a) =>
        req.user!.linkedBorrowerIds.includes(a.borrowerId),
      );

      const byCategory = {
        Low: 0,
        Watchlist: 0,
        "High Risk": 0,
        Critical: 0,
      } as Record<RiskCategory, number>;

      for (const alert of alerts) {
        byCategory[alert.riskCategory]++;
      }

      const criticalBorrowers = alerts
        .filter(
          (a) =>
            a.riskCategory === "Critical" || a.riskCategory === "High Risk",
        )
        .sort((a, b) => b.riskScore - a.riskScore)
        .map((a) => ({
          borrowerId: a.borrowerId,
          name: a.borrowerName,
          score: a.riskScore,
          category: a.riskCategory,
          recommendedAction: a.recommendedAction,
        }));

      const summary: PortfolioSummary = {
        total: alerts.length,
        byCategory,
        criticalBorrowers,
      };

      res.json({ success: true, data: summary });
    } catch (err) {
      res
        .status(500)
        .json({
          success: false,
          error: "Failed to generate portfolio summary",
        });
    }
  },
);

// GET /portfolio/borrowers
// Quick list of all borrowers with their current score.

router.get(
  "/borrowers",
  authenticate,
  requireRole("analyst"),
  (req: Request, res: Response) => {
    const assignedBorrowers = BORROWERS.filter((b) =>
      req.user!.linkedBorrowerIds.includes(b.borrowerId),
    );

    const scored = assignedBorrowers.map((b) => {
      const { score, category } = scoreBorrower(b);
      return {
        borrowerId: b.borrowerId,
        name: b.name,
        loanId: b.loanId,
        emiAmount: b.emiAmount,
        nextDueDate: b.nextDueDate,
        creditUtilizationPercent: b.creditUtilizationPercent,
        riskScore: score,
        riskCategory: category,
      };
    });

    // Sort by risk score descending
    scored.sort((a, b) => b.riskScore - a.riskScore);

    res.json({ success: true, data: scored });
  },
);

export default router;
