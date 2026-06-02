const { supabase } = require('./supabaseClient');

// Weighting model for the rolling 90-day supplier quality score.
// Negative events erode the score; positive events recover it.
const SCORE_WEIGHTS = {
  defect_critical: -15,
  defect_major: -8,
  defect_minor: -3,
  ncr_raised: -5,
  capa_overdue: -10,
  audit_fail: -20,
  audit_pass: +10,
  on_time_delivery: +2,
  late_delivery: -4,
};

const ROLLING_WINDOW_DAYS = 90;

function statusForScore(score) {
  if (score < 40) return 'disqualified';
  if (score < 60) return 'probation';
  return 'active';
}

// Recompute and persist a single supplier's score from its recent events.
async function recalculateSupplierScore(supplierId) {
  const since = new Date();
  since.setDate(since.getDate() - ROLLING_WINDOW_DAYS);

  const { data: events, error } = await supabase
    .from('supplier_quality_events')
    .select('event_type, impact_score')
    .eq('supplier_id', supplierId)
    .gte('created_at', since.toISOString());

  if (error) throw error;

  const totalImpact = (events || []).reduce(
    (sum, e) => sum + Number(e.impact_score),
    0
  );
  const newScore = Math.max(0, Math.min(100, 100 + totalImpact));

  const { error: updateError } = await supabase
    .from('suppliers')
    .update({
      quality_score: newScore,
      status: statusForScore(newScore),
    })
    .eq('id', supplierId);

  if (updateError) throw updateError;

  return { supplierId, score: newScore, status: statusForScore(newScore) };
}

// Full breakdown for the scorecard endpoint: grouped event contributions.
async function buildScorecard(supplierId) {
  const since = new Date();
  since.setDate(since.getDate() - ROLLING_WINDOW_DAYS);

  const { data: events, error } = await supabase
    .from('supplier_quality_events')
    .select('event_type, impact_score, notes, created_at, reference_id')
    .eq('supplier_id', supplierId)
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: false });

  if (error) throw error;

  const breakdown = {};
  let totalImpact = 0;
  for (const e of events || []) {
    const impact = Number(e.impact_score);
    totalImpact += impact;
    if (!breakdown[e.event_type]) {
      breakdown[e.event_type] = { count: 0, totalImpact: 0 };
    }
    breakdown[e.event_type].count += 1;
    breakdown[e.event_type].totalImpact += impact;
  }

  const score = Math.max(0, Math.min(100, 100 + totalImpact));

  return {
    supplierId,
    windowDays: ROLLING_WINDOW_DAYS,
    score,
    status: statusForScore(score),
    totalImpact,
    breakdown,
    events: events || [],
  };
}

module.exports = {
  SCORE_WEIGHTS,
  ROLLING_WINDOW_DAYS,
  statusForScore,
  recalculateSupplierScore,
  buildScorecard,
};
