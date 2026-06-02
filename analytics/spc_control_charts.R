# ============================================================================
# spc_control_charts.R
# Statistical Process Control (SPC) charts for daily defect counts.
# Generates an X-bar (individuals) control chart — the industry-standard view
# for monitoring whether a process is in statistical control.
#
# Usage:
#   cd analytics
#   Rscript spc_control_charts.R
# Charts are written to analytics/output/ as PNG.
# ============================================================================

library(qcc)
library(dplyr)
source("connect_supabase.R")

dir.create("output", showWarnings = FALSE)

defects <- fetch_defects(days_back = 30)

if (length(defects) == 0 || nrow(defects) == 0) {
  stop("No defect data returned — seed the database or widen days_back.")
}

# Aggregate to daily total defect quantity.
daily_counts <- defects %>%
  mutate(date = as.Date(detected_at)) %>%
  group_by(date) %>%
  summarise(total = sum(quantity_affected), .groups = "drop") %>%
  arrange(date)

# X-bar control chart for individual daily observations.
png("output/spc_xbar_chart.png", width = 1200, height = 600, res = 150)
xbar <- qcc(
  data = daily_counts$total,
  type = "xbar.one",
  title = "Daily Defect Count - X-bar Control Chart",
  xlab = "Day",
  ylab = "Defect Count",
  plot = TRUE
)
dev.off()

cat("Center line (process mean):", round(xbar$center, 2), "\n")
cat("Control limits:", round(xbar$limits[1], 2), "to", round(xbar$limits[2], 2), "\n")
if (length(xbar$violations$beyond.limits) > 0) {
  cat("Out-of-control points at indices:",
      paste(xbar$violations$beyond.limits, collapse = ", "), "\n")
} else {
  cat("Process is in statistical control (no points beyond limits).\n")
}

cat("Wrote output/spc_xbar_chart.png\n")
