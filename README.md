# Caliper — Manufacturing Quality Management System

> A full-stack Quality Management System built to simulate real-world manufacturing workflows — defect tracking, NCR management, CAPA lifecycle, supplier scoring, and audit trails. Built with zero monthly cost and deployed publicly.

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen)](https://caliper.vercel.app)
[![Backend](https://img.shields.io/badge/API-Render-blue)](https://caliper-api.onrender.com)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)
[![Node](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org)

---

## What This Is

Caliper simulates the software used inside manufacturing plants to track product
quality failures, escalate non-conformance reports, manage corrective actions,
and score supplier reliability.

It demonstrates: relational database design with audit trails, multi-step
workflow state machines, automated email escalation, statistical process control
charting in R, and BI reporting via Power BI — all on a completely free stack
(Vercel + Render + Supabase + Power BI Desktop + R + Power Automate free tier).

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS + Recharts |
| Backend | Node.js + Express |
| Database | Supabase (PostgreSQL) + Row Level Security |
| Auth | Supabase Auth (JWT) |
| BI Reports | Power BI Desktop (free) |
| SPC Charts | R + qcc + ggplot2 |
| Automation | Power Automate (free HTTP webhook) |
| Hosting | Vercel (frontend) + Render (backend) — both free tier |

## Repository Layout

```
caliper/
├── client/        # React frontend (Vite + Tailwind)
├── server/        # Express API + DB schema/seed
├── analytics/     # R scripts for SPC / Pareto / supplier trend
├── powerbi/       # Power BI build instructions + .pbix
└── .github/       # CI: backend tests + Vercel deploy
```

See `server/src/db/schema.sql` for the full normalized schema (7 tables,
foreign keys, indexes, `updated_at` triggers, an append-only `audit_log` with
DB-level triggers, and Row Level Security policies per role).

## Local Setup

**Prerequisites:** Node.js 18+, npm, R 4.x (optional, for analytics).

```bash
# 1. Backend
cd server
npm install
cp .env.example .env        # fill in SUPABASE_URL, SUPABASE_SERVICE_KEY, etc.
npm run dev                 # http://localhost:3001

# 2. Frontend (new terminal)
cd client
npm install
cp .env.example .env        # fill in VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_API_URL
npm run dev                 # http://localhost:5173

# 3. Database
# Supabase dashboard → SQL Editor → paste server/src/db/schema.sql → run
# Then paste server/src/db/seed.sql for sample manufacturing data

# 4. Analytics (optional)
cd analytics
cp .Renviron.example ~/.Renviron   # set SUPABASE_URL + SUPABASE_ANON_KEY
# install.packages(c("httr","jsonlite","qcc","ggplot2","dplyr"))
Rscript spc_control_charts.R       # writes PNGs to analytics/output/
```

### Environment variables

`server/.env`
```env
PORT=3001
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
SUPABASE_ANON_KEY=your-anon-key
POWER_AUTOMATE_WEBHOOK_URL=https://prod-xx.westus.logic.azure.com/workflows/...
CORS_ORIGINS=http://localhost:5173,https://caliper.vercel.app
```

`client/.env`
```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=http://localhost:3001/api/v1
```

## REST API

Base URL: `/api/v1`. All routes (except `/health`) require
`Authorization: Bearer <supabase_jwt>`.

| Resource | Endpoints |
|---|---|
| Defects | `GET /defects` · `GET /defects/:id` · `POST /defects` · `PATCH /defects/:id` · `GET /defects/stats/summary` |
| NCRs | `GET /ncrs` · `GET /ncrs/:id` · `POST /ncrs` · `PATCH /ncrs/:id/status` · `POST /ncrs/:id/escalate` |
| CAPA | `GET /capas` · `GET /capas/:id` · `POST /capas` · `PATCH /capas/:id` · `POST /capas/:id/verify` |
| Suppliers | `GET /suppliers` · `GET /suppliers/:id` · `POST /suppliers` · `GET /suppliers/:id/scorecard` · `POST /suppliers/:id/recalculate-score` |
| Audit | `GET /audit` · `GET /audit/:record_id` |

## Key Engineering Details

- **Workflow state machines** — NCR and CAPA status transitions are validated
  server-side (`ncrController.js`, `capaController.js`). Invalid transitions
  return HTTP 422, not just a disabled UI button.
- **Supplier scoring** — rolling 90-day weighted event model in
  `supplierScorer.js`; scores clamp to 0–100 and map to active / probation /
  disqualified tiers.
- **Audit trail** — append-only. Enforced by both an `auditLogger` Express
  middleware (adds request IP / user agent / actor) and DB triggers that block
  `UPDATE`/`DELETE` on `audit_log`.
- **Escalation isolation** — the Power Automate webhook call is best-effort; a
  failure is caught and logged and never turns into a 500 for the client.
- **Render cold start** — the frontend pings `/health` on load and shows a
  "backend waking up" banner if it takes more than 5 seconds.
- **Row Level Security** — viewers read-only; engineers write defects/NCRs/CAPAs;
  only admins manage suppliers and delete records.

## Deployment

- **Frontend → Vercel**: connect repo, root `client/`, set the `VITE_*` env
  vars. `vercel.json` rewrites all routes to `index.html` for the SPA router.
- **Backend → Render**: New Web Service, root `server/`, build `npm install`,
  start `node src/app.js`, add the `server/.env` vars. Free tier sleeps after
  15 min — first request takes ~30s (handled by the cold-start banner).
- **CI** — `.github/workflows/backend-test.yml` runs `npm test` on PRs touching
  `server/`; `frontend-deploy.yml` builds and deploys `client/` to Vercel on
  push to `main`.

## Tests

```bash
cd server && npm test    # state-machine + scoring unit tests (node:test)
```

## License

MIT — use this however you want.

> Built by Anand as a portfolio project to demonstrate full-stack engineering,
> system design, and real-world QMS domain knowledge. Deployed with zero
> monthly cost.
