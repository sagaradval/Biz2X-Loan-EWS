# Loan Default Risk Early Warning System

A backend service that evaluates borrower repayment behaviour, generates risk alerts, and exposes APIs for analysts to review potentially risky accounts.

The scoring engine is rule-based for transparency and explainability. LLM-generated explanations are used only to provide additional context around generated alerts.

---

## Getting Started

```bash
npm install

cp .env.example .env

npm run dev
```

Server runs on:

```text
http://localhost:3000
```

---

## Overview

The system evaluates borrowers using repayment history, transaction activity, and credit utilization patterns.

Based on detected signals, a risk score is calculated and mapped to one of the following categories:

- Low
- Watchlist
- High Risk
- Critical

Generated alerts can then be reviewed by analysts through the API.

---

## Authentication

For simplicity, the project uses static bearer tokens.

Example:

```http
Authorization: Bearer token-analyst-neha
```

Available tokens are defined in the mock user data.

### Access Rules

- Analysts can access only borrowers assigned to them.
- Borrowers can access only their own alert.
- Borrower responses are sanitised and do not expose internal risk scores or scoring signals.

In a production system, static tokens should be replaced with JWT authentication and proper audit logging.

---

## API Endpoints

### Health Check

```http
GET /health
```

### Generate Alerts

```http
POST /alerts/generate
```

### List Alerts

```http
GET /alerts
GET /alerts?category=Critical
```

### Get Alert

```http
GET /alerts/:borrowerId
```

### Analyst Query

```http
POST /alerts/:borrowerId/query
```

### Risk Simulation

```http
GET /alerts/:borrowerId/simulate
```

### Portfolio Summary

```http
GET /portfolio/summary
```

### Portfolio Borrowers

```http
GET /portfolio/borrowers
```

---

## Risk Scoring

The system uses deterministic business rules instead of an ML model.

### Signals

| Signal | Weight |
|----------|----------|
| Consecutive missed EMIs | +35 |
| Missed EMI | +25 |
| Failed auto-debit | +15 |
| Worsening repayment trend | +20 |
| Credit utilization > 75% | +20 |
| Credit utilization 50–75% | +10 |
| Income decline | +20 |
| Insufficient history | +10 |
| Partial payment | +15 |
| Late payment trend | +10 |

### Risk Categories

| Score | Category |
|---------|---------|
| 0-24 | Low |
| 25-49 | Watchlist |
| 50-74 | High Risk |
| 75-100 | Critical |

---

## LLM Usage

The LLM is used for:

- Generating alert explanations
- Answering analyst questions about alerts

Risk scores themselves are generated entirely by the rule engine.

If an LLM request fails, alert generation still succeeds and the alert remains available.

---

## Project Structure

```text
src/
├── alert/
├── auth/
├── borrower/
├── portfolio/
├── risk/
├── llm/
├── middleware/
├── data/
└── shared/
```

---

## LLM Grounding Safeguards

The LLM is given:
1. A strict system prompt forbidding speculation or invented facts
2. Only the specific borrower data relevant to the alert
3. The exact signals detected (not raw data)

This ensures:
- Explanations are **auditable** — each claim traces to a signal
- No hallucination of borrower facts
- Borrower-facing explanations are separate from analyst-facing ones (no internal scores leaked)

---

## Future Improvements

- Persist alerts in a database
- JWT-based authentication
- Audit logging
- Rate limiting
- Historical score tracking and ynamic tuning of risk weights
