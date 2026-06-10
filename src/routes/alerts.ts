import { Router, Request, Response } from "express";
import {
  authenticate,
  requireRole,
  canAccessBorrower,
} from "../middleware/auth";
import {
  generateAllAlerts,
  getAlertForBorrower,
  getCachedAlerts,
  simulateMissedNextEMI,
} from "../services/alertService";
import {
  answerAnalystQuery,
  generateBorrowerExplanation,
} from "../services/llmService";
import { BORROWERS } from "../data/mockData";
import { scoreBorrower } from "../services/riskScorer";
import { Alert, ApiResponse, PortfolioSummary, RiskCategory } from "../types";

const router = Router();

// POST /alerts/generate
// Analyst only.

router.post(
  "/generate",
  authenticate,
  requireRole("analyst"),
  async (_req: Request, res: Response) => {
    try {
      const alerts = await generateAllAlerts();
      const response: ApiResponse<Alert[]> = { success: true, data: alerts };
      res.json(response);
    } catch (err) {
      res
        .status(500)
        .json({ success: false, error: "Failed to generate alerts" });
    }
  },
);

// GET /alerts
// Analyst only. Lists all cached alerts for their assigned borrowers, sorted by risk score descending.

router.get(
  "/",
  authenticate,
  requireRole("analyst"),
  async (req: Request, res: Response) => {
    try {
      let alerts = getCachedAlerts();

      alerts = alerts.filter((a) => canAccessBorrower(req.user!, a.borrowerId));

      if (alerts.length === 0) {
        const all = await generateAllAlerts();
        alerts = all.filter((a) => canAccessBorrower(req.user!, a.borrowerId));
      }

      alerts.sort((a, b) => b.riskScore - a.riskScore);

      const categoryFilter = req.query.category as string | undefined;
      if (categoryFilter) {
        alerts = alerts.filter(
          (a) => a.riskCategory.toLowerCase() === categoryFilter.toLowerCase(),
        );
      }

      res.json({ success: true, data: alerts });
    } catch (err) {
      res.status(500).json({ success: false, error: "Failed to fetch alerts" });
    }
  },
);

// GET /alerts/:borrowerId
// Analysts: can access their assigned borrowers
// Borrowers: can only access their own alert (with reduced internal details)

router.get(
  "/:borrowerId",
  authenticate,
  async (req: Request, res: Response) => {
    const { borrowerId } = req.params;

    if (!canAccessBorrower(req.user!, borrowerId)) {
      res.status(403).json({
        success: false,
        error: "Access denied to this borrower's data",
      });
      return;
    }

    try {
      const alert = await getAlertForBorrower(borrowerId);
      if (!alert) {
        res.status(404).json({ success: false, error: "Borrower not found" });
        return;
      }

      if (req.user!.role === "borrower") {
        const borrower = BORROWERS.find((b) => b.borrowerId === borrowerId)!;
        const sanitised = {
          borrowerId: alert.borrowerId,
          borrowerName: alert.borrowerName,
          nextDueDate: borrower.nextDueDate,
          emiAmount: borrower.emiAmount,
          recommendedAction: alert.recommendedAction,
          explanation: await generateBorrowerExplanation(
            borrower,
            alert.signals,
          ),
        };
        res.json({ success: true, data: sanitised });
        return;
      }

      res.json({ success: true, data: alert });
    } catch (err) {
      res.status(500).json({ success: false, error: "Failed to fetch alert" });
    }
  },
);

// POST /alerts/:borrowerId/query
// Analyst only. "Why was borrower B123 flagged?" — answers from available data.

router.post(
  "/:borrowerId/query",
  authenticate,
  requireRole("analyst"),
  async (req: Request, res: Response) => {
    const { borrowerId } = req.params;
    const { question } = req.body as { question?: string };

    if (!question || question.trim().length === 0) {
      res
        .status(400)
        .json({
          success: false,
          error: "question field is required in request body",
        });
      return;
    }

    if (!canAccessBorrower(req.user!, borrowerId)) {
      res.status(403).json({ success: false, error: "Access denied" });
      return;
    }

    try {
      const alert = await getAlertForBorrower(borrowerId);
      if (!alert) {
        res.status(404).json({ success: false, error: "Borrower not found" });
        return;
      }

      const borrower = BORROWERS.find((b) => b.borrowerId === borrowerId)!;
      const answer = await answerAnalystQuery(borrower, alert, question);

      res.json({
        success: true,
        data: {
          borrowerId,
          question,
          answer,
          groundedOn: alert.signals.map((s) => s.signal),
        },
      });
    } catch (err) {
      res.status(500).json({ success: false, error: "Query failed" });
    }
  },
);

// GET /alerts/:borrowerId/simulate
// Analyst only "Simulate missing the next EMI, This might change the alert status/risk score"

router.get(
  "/:borrowerId/simulate",
  authenticate,
  requireRole("analyst"),
  (req: Request, res: Response) => {
    const { borrowerId } = req.params;

    if (!canAccessBorrower(req.user!, borrowerId)) {
      res.status(403).json({ success: false, error: "Access denied" });
      return;
    }

    const result = simulateMissedNextEMI(borrowerId);
    if (!result) {
      res.status(404).json({ success: false, error: "Borrower not found" });
      return;
    }

    res.json({ success: true, data: result });
  },
);

export default router;
