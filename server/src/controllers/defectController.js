const { supabase } = require('../services/supabaseClient');
const { nextCode } = require('../services/codeGenerator');
const { recalculateSupplierScore, SCORE_WEIGHTS } = require('../services/supplierScorer');

// GET /defects — list with optional filters + pagination
async function listDefects(req, res) {
  const { status, severity, supplier_id, defect_type, page = 1, limit = 20 } = req.query;
  const from = (Number(page) - 1) * Number(limit);
  const to = from + Number(limit) - 1;

  let query = supabase
    .from('defects')
    .select('*, suppliers(name, code)', { count: 'exact' })
    .order('detected_at', { ascending: false })
    .range(from, to);

  if (status) query = query.eq('status', status);
  if (severity) query = query.eq('severity', severity);
  if (supplier_id) query = query.eq('supplier_id', supplier_id);
  if (defect_type) query = query.eq('defect_type', defect_type);

  const { data, error, count } = await query;
  if (error) throw error;

  res.json({
    success: true,
    data,
    pagination: { page: Number(page), limit: Number(limit), total: count },
  });
}

// GET /defects/:id
async function getDefect(req, res) {
  const { data, error } = await supabase
    .from('defects')
    .select('*, suppliers(id, name, code)')
    .eq('id', req.params.id)
    .single();

  if (error) return res.status(404).json({ success: false, error: 'Defect not found' });
  res.json({ success: true, data });
}

// POST /defects — log a new defect, emit a supplier quality event, rescore
async function createDefect(req, res) {
  const body = req.body;
  const defect_code = await nextCode('defects', 'defect_code', 'DEF');

  const insert = {
    defect_code,
    product_line: body.product_line,
    batch_number: body.batch_number,
    defect_type: body.defect_type,
    severity: body.severity,
    quantity_affected: body.quantity_affected ?? 1,
    detected_at: body.detected_at || new Date().toISOString(),
    detected_by: req.user?.id ?? null,
    supplier_id: body.supplier_id ?? null,
    description: body.description ?? null,
    status: 'open',
  };

  const { data, error } = await supabase.from('defects').insert(insert).select().single();
  if (error) throw error;

  // Record the quality event so the supplier score reflects this defect.
  if (data.supplier_id) {
    const impact = SCORE_WEIGHTS[`defect_${data.severity}`] ?? 0;
    await supabase.from('supplier_quality_events').insert({
      supplier_id: data.supplier_id,
      event_type: 'defect',
      impact_score: impact,
      reference_id: data.id,
      notes: `${data.severity} ${data.defect_type} defect ${data.defect_code}`,
    });
    await recalculateSupplierScore(data.supplier_id).catch((e) =>
      console.error('[createDefect] rescore failed:', e.message)
    );
  }

  res.status(201).json({ success: true, data });
}

// PATCH /defects/:id
async function updateDefect(req, res) {
  const allowed = ['product_line', 'batch_number', 'defect_type', 'severity', 'quantity_affected', 'description', 'root_cause', 'status', 'supplier_id'];
  const update = {};
  for (const k of allowed) if (k in req.body) update[k] = req.body[k];

  const { data, error } = await supabase
    .from('defects')
    .update(update)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) throw error;
  res.json({ success: true, data });
}

// GET /defects/stats/summary — counts by type / severity / status + 30-day trend
async function defectStats(req, res) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data, error } = await supabase
    .from('defects')
    .select('defect_type, severity, status, quantity_affected, detected_at')
    .gte('detected_at', thirtyDaysAgo.toISOString());

  if (error) throw error;

  const byType = {};
  const bySeverity = {};
  const byStatus = {};
  const byDay = {};

  for (const d of data) {
    byType[d.defect_type] = (byType[d.defect_type] || 0) + 1;
    bySeverity[d.severity] = (bySeverity[d.severity] || 0) + 1;
    byStatus[d.status] = (byStatus[d.status] || 0) + 1;
    const day = d.detected_at.slice(0, 10);
    byDay[day] = (byDay[day] || 0) + d.quantity_affected;
  }

  const trend = Object.entries(byDay)
    .map(([date, total]) => ({ date, total }))
    .sort((a, b) => a.date.localeCompare(b.date));

  res.json({
    success: true,
    data: { total: data.length, byType, bySeverity, byStatus, trend },
  });
}

module.exports = { listDefects, getDefect, createDefect, updateDefect, defectStats };
