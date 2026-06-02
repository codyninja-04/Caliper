const { supabase } = require('../services/supabaseClient');
const { nextCode } = require('../services/codeGenerator');
const { triggerEscalation } = require('../services/ncrEscalation');

// Allowed NCR workflow transitions — enforced server-side, not just in the UI.
const NCR_TRANSITIONS = {
  draft: ['open'],
  open: ['under_review', 'escalated'],
  under_review: ['awaiting_supplier', 'capa_required', 'escalated', 'closed'],
  awaiting_supplier: ['under_review', 'capa_required', 'escalated'],
  capa_required: ['under_review', 'closed', 'escalated'],
  escalated: ['under_review', 'capa_required', 'closed'],
  closed: [], // terminal
};

function canTransition(from, to) {
  if (from === to) return true; // idempotent no-op
  return (NCR_TRANSITIONS[from] || []).includes(to);
}

// GET /ncrs
async function listNCRs(req, res) {
  const { status, supplier_id, severity, page = 1, limit = 20 } = req.query;
  const from = (Number(page) - 1) * Number(limit);
  const to = from + Number(limit) - 1;

  let query = supabase
    .from('ncrs')
    .select('*, suppliers(name, code), defects(defect_code)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (status) query = query.eq('status', status);
  if (supplier_id) query = query.eq('supplier_id', supplier_id);
  if (severity) query = query.eq('severity', severity);

  const { data, error, count } = await query;
  if (error) throw error;
  res.json({ success: true, data, pagination: { page: Number(page), limit: Number(limit), total: count } });
}

// GET /ncrs/:id — with linked defect and CAPAs
async function getNCR(req, res) {
  const { data, error } = await supabase
    .from('ncrs')
    .select('*, suppliers(id, name, code, contact_email), defects(*), capas(*)')
    .eq('id', req.params.id)
    .single();

  if (error) return res.status(404).json({ success: false, error: 'NCR not found' });
  res.json({ success: true, data });
}

// POST /ncrs — auto-links defect, generates NCR number
async function createNCR(req, res) {
  const body = req.body;
  const ncr_number = await nextCode('ncrs', 'ncr_number', 'NCR');

  const insert = {
    ncr_number,
    defect_id: body.defect_id ?? null,
    supplier_id: body.supplier_id ?? null,
    title: body.title,
    description: body.description,
    severity: body.severity,
    status: body.status === 'open' ? 'open' : 'draft',
    raised_by: req.user?.id ?? null,
    assigned_to: body.assigned_to ?? null,
    due_date: body.due_date ?? null,
  };

  const { data, error } = await supabase.from('ncrs').insert(insert).select().single();
  if (error) throw error;

  // Emit supplier quality event for the raised NCR.
  if (data.supplier_id) {
    await supabase.from('supplier_quality_events').insert({
      supplier_id: data.supplier_id,
      event_type: 'ncr',
      impact_score: -5,
      reference_id: data.id,
      notes: `NCR ${data.ncr_number} raised`,
    });
  }

  res.status(201).json({ success: true, data });
}

// PATCH /ncrs/:id/status — workflow transition with validation
async function updateNCRStatus(req, res) {
  const { status: nextStatus, notes } = req.body;

  const { data: current, error: fetchErr } = await supabase
    .from('ncrs')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (fetchErr || !current) return res.status(404).json({ success: false, error: 'NCR not found' });

  if (!canTransition(current.status, nextStatus)) {
    return res.status(422).json({
      success: false,
      error: `Invalid transition: ${current.status} → ${nextStatus}`,
      allowed: NCR_TRANSITIONS[current.status] || [],
    });
  }

  const update = { status: nextStatus };
  if (nextStatus === 'closed') update.closed_at = new Date().toISOString();
  if (nextStatus === 'escalated') update.escalated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from('ncrs')
    .update(update)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) throw error;

  // Persist the transition note into the audit trail.
  if (notes) {
    await supabase.from('audit_log').insert({
      table_name: 'ncrs',
      record_id: data.id,
      action: 'UPDATE',
      new_values: { status: nextStatus, notes },
      changed_by: req.user?.id ?? null,
    });
  }

  res.json({ success: true, data });
}

// POST /ncrs/:id/escalate — manual escalation via Power Automate webhook
async function escalateNCR(req, res) {
  const { data: ncr, error } = await supabase
    .from('ncrs')
    .select('*, suppliers(name, contact_email)')
    .eq('id', req.params.id)
    .single();

  if (error || !ncr) return res.status(404).json({ success: false, error: 'NCR not found' });

  const daysOverdue = ncr.due_date
    ? Math.max(0, Math.floor((Date.now() - new Date(ncr.due_date).getTime()) / 86400000))
    : 0;

  const payload = {
    ncr_number: ncr.ncr_number,
    title: ncr.title,
    severity: ncr.severity,
    supplier_name: ncr.suppliers?.name ?? 'Unknown',
    assignee_email: req.body.assignee_email ?? null,
    manager_email: req.body.manager_email ?? null,
    days_overdue: daysOverdue,
    ncr_url: `https://caliper-lake.vercel.app/ncrs/${ncr.id}`,
  };

  // Best-effort — webhook failure does not fail the request.
  const result = await triggerEscalation(payload);

  // Mark escalated regardless of webhook delivery.
  await supabase
    .from('ncrs')
    .update({ status: 'escalated', escalated_at: new Date().toISOString() })
    .eq('id', ncr.id);

  res.json({ success: true, data: { escalated: true, webhook: result } });
}

module.exports = { listNCRs, getNCR, createNCR, updateNCRStatus, escalateNCR, NCR_TRANSITIONS, canTransition };
