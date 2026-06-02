# ============================================================================
# connect_supabase.R
# Thin helpers to pull Caliper data from the Supabase REST (PostgREST) API.
# Reads credentials from environment variables (set these in ~/.Renviron):
#   SUPABASE_URL=https://your-project-ref.supabase.co
#   SUPABASE_ANON_KEY=your-anon-key
# ============================================================================

library(httr)
library(jsonlite)

SUPABASE_URL <- Sys.getenv("SUPABASE_URL")
SUPABASE_KEY <- Sys.getenv("SUPABASE_ANON_KEY")

if (SUPABASE_URL == "" || SUPABASE_KEY == "") {
  stop("Set SUPABASE_URL and SUPABASE_ANON_KEY in your ~/.Renviron before running.")
}

# Generic GET against a PostgREST table with arbitrary query params.
.qms_get <- function(table, query = list()) {
  response <- GET(
    paste0(SUPABASE_URL, "/rest/v1/", table),
    add_headers(
      "apikey" = SUPABASE_KEY,
      "Authorization" = paste("Bearer", SUPABASE_KEY)
    ),
    query = query
  )
  if (http_error(response)) {
    stop("Supabase request failed: ", status_code(response), " — ",
         content(response, "text", encoding = "UTF-8"))
  }
  fromJSON(content(response, "text", encoding = "UTF-8"))
}

# Defects detected in the last `days_back` days.
fetch_defects <- function(days_back = 30) {
  since <- format(Sys.time() - days_back * 86400, "%Y-%m-%dT%H:%M:%SZ")
  .qms_get("defects", list(
    select = "detected_at,quantity_affected,defect_type,severity,supplier_id",
    detected_at = paste0("gte.", since),
    order = "detected_at.asc"
  ))
}

# Suppliers with their current quality score.
fetch_suppliers <- function() {
  .qms_get("suppliers", list(
    select = "id,name,code,quality_score,status,country",
    order = "quality_score.desc"
  ))
}

# Supplier quality events in the rolling window (for trend analysis).
fetch_supplier_events <- function(days_back = 90) {
  since <- format(Sys.time() - days_back * 86400, "%Y-%m-%dT%H:%M:%SZ")
  .qms_get("supplier_quality_events", list(
    select = "supplier_id,event_type,impact_score,created_at",
    created_at = paste0("gte.", since),
    order = "created_at.asc"
  ))
}
