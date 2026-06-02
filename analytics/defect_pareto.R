# ============================================================================
# defect_pareto.R
# Pareto analysis of defects by type — the classic "vital few" 80/20 view used
# in ISO 9001 quality reviews to prioritise corrective action.
#
# Usage:
#   cd analytics
#   Rscript defect_pareto.R
# ============================================================================

library(qcc)
library(dplyr)
source("connect_supabase.R")

dir.create("output", showWarnings = FALSE)

defects <- fetch_defects(days_back = 90)

if (length(defects) == 0 || nrow(defects) == 0) {
  stop("No defect data returned — seed the database or widen days_back.")
}

# Count defects by type (weighted by quantity affected).
defect_by_type <- defects %>%
  group_by(defect_type) %>%
  summarise(n = sum(quantity_affected), .groups = "drop") %>%
  arrange(desc(n))

png("output/pareto_chart.png", width = 1200, height = 600, res = 150)
pareto.chart(
  setNames(defect_by_type$n, defect_by_type$defect_type),
  main = "Defect Pareto Analysis (last 90 days)",
  ylab = "Quantity Affected",
  col = heat.colors(nrow(defect_by_type))
)
dev.off()

cat("Defect breakdown by type:\n")
print(defect_by_type)
cat("Wrote output/pareto_chart.png\n")
