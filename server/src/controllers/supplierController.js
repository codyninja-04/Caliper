const { supabase } = require('../services/supabaseClient');
const { recalculateSupplierScore, buildScorecard } = require('../services/supplierScorer');

// GET /suppliers
async function listSuppliers(req, res) {
  const { status } = req.query;
  let query = supabase.from('suppliers').select('*').order('quality_score', { ascending: false });
  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) throw error;
  res.json({ success: true, data });
}

// GET /suppliers/:id — detail + recent quality event history
async function getSupplier(req, res) {
  const { data: supplier, error } = await supabase
    .from('suppliers')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (error || !supplier) return res.status(404).json({ success: false, error: 'Supplier not found' });

  const { data: events } = await supabase
    .from('supplier_quality_events')
    .select('*')
    .eq('supplier_id', req.params.id)
    .order('created_at', { ascending: false })
    .limit(50);

  res.json({ success: true, data: { ...supplier, events: events || [] } });
}

// POST /suppliers — register a new supplier (admin only, guarded at the route)
async function createSupplier(req, res) {
  const { name, code, contact_email, country } = req.body;
  const insert = { name, code, contact_email: contact_email ?? null, country: country ?? null };

  const { data, error } = await supabase.from('suppliers').insert(insert).select().single();
  if (error) throw error;
  res.status(201).json({ success: true, data });
}

// GET /suppliers/:id/scorecard — full scoring breakdown
async function getScorecard(req, res) {
  const card = await buildScorecard(req.params.id);
  res.json({ success: true, data: card });
}

// POST /suppliers/:id/recalculate-score
async function recalculate(req, res) {
  const result = await recalculateSupplierScore(req.params.id);
  res.json({ success: true, data: result });
}

module.exports = { listSuppliers, getSupplier, createSupplier, getScorecard, recalculate };
