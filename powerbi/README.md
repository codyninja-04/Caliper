# Power BI Report — Caliper

`Caliper_Report.pbix` is built in **Power BI Desktop** (free) and connects to
Supabase Postgres via the built-in PostgreSQL connector.

> The `.pbix` binary is created in Power BI Desktop and committed here. This
> folder documents how to (re)build it from scratch so the repo is reproducible
> without shipping a large binary.

## Connect

1. Power BI Desktop → **Get Data → PostgreSQL database**
2. Server: `db.<your-project-ref>.supabase.co:5432`
3. Database: `postgres`
4. Data Connectivity mode: **Import**
5. Authenticate with the database password from Supabase → Project Settings → Database

## Tables to import

| Table | Role |
|---|---|
| `defects` | fact |
| `ncrs` | fact |
| `capas` | fact |
| `supplier_quality_events` | fact |
| `suppliers` | dimension |
| `user_profiles` | dimension |
| `audit_log` | compliance reporting |

## Model relationships

```
suppliers[id] -> defects[supplier_id]   (1:*)
suppliers[id] -> ncrs[supplier_id]      (1:*)
defects[id]   -> ncrs[defect_id]        (1:*)
ncrs[id]      -> capas[ncr_id]          (1:*)
```

## Key DAX measures

```dax
Open NCR Count = CALCULATE(COUNTROWS(ncrs), ncrs[status] <> "closed")

Critical Defect Rate =
  DIVIDE(
    CALCULATE(SUM(defects[quantity_affected]), defects[severity] = "critical"),
    SUM(defects[quantity_affected])
  )

Avg CAPA Closure Days =
  AVERAGEX(
    FILTER(capas, capas[status] = "closed"),
    DATEDIFF(capas[created_at], capas[verified_at], DAY)
  )
```

## Suggested report pages

1. **Executive overview** — KPI cards (open NCRs, critical defect rate, avg CAPA closure days) + defect trend line.
2. **Supplier scorecard** — score by supplier, status breakdown, event contribution.
3. **Compliance** — audit_log table with slicers on table/action/date.
