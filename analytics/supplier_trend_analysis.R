# ============================================================================
# supplier_trend_analysis.R
# Visualises how supplier quality scores trend over the rolling 90-day window
# by replaying quality events cumulatively from a baseline of 100.
#
# Usage:
#   cd analytics
#   Rscript supplier_trend_analysis.R
# ============================================================================

library(ggplot2)
library(dplyr)
source("connect_supabase.R")

dir.create("output", showWarnings = FALSE)

events <- fetch_supplier_events(days_back = 90)
suppliers <- fetch_suppliers()

if (length(events) == 0 || nrow(events) == 0) {
  stop("No supplier events returned — seed the database first.")
}

# Map supplier_id -> code for readable legend labels.
code_lookup <- setNames(suppliers$code, suppliers$id)

# Reconstruct a running score per supplier: start at 100, add each event's
# impact in chronological order.
trend <- events %>%
  mutate(
    date = as.Date(created_at),
    supplier = ifelse(supplier_id %in% names(code_lookup),
                      code_lookup[supplier_id], substr(supplier_id, 1, 8))
  ) %>%
  arrange(supplier, date) %>%
  group_by(supplier) %>%
  mutate(running_score = pmin(100, pmax(0, 100 + cumsum(impact_score)))) %>%
  ungroup()

p <- ggplot(trend, aes(x = date, y = running_score, color = supplier)) +
  geom_step(linewidth = 0.8) +
  geom_point(size = 1.5) +
  geom_hline(yintercept = 60, linetype = "dashed", color = "#f59e0b") +
  geom_hline(yintercept = 40, linetype = "dashed", color = "#dc2626") +
  scale_y_continuous(limits = c(0, 100)) +
  labs(
    title = "Supplier Quality Score Trend (rolling 90-day replay)",
    subtitle = "Dashed lines: probation (60) and disqualification (40) thresholds",
    x = "Date", y = "Quality Score", color = "Supplier"
  ) +
  theme_minimal(base_size = 12)

ggsave("output/supplier_trend.png", p, width = 10, height = 6, dpi = 150)

cat("Final reconstructed scores:\n")
print(trend %>% group_by(supplier) %>% summarise(final = last(running_score), .groups = "drop"))
cat("Wrote output/supplier_trend.png\n")
