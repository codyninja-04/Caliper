const { supabase } = require('../services/supabaseClient');
const { nextCode } = require('../services/codeGenerator');

// CAPA lifecycle state machine — enforced server-side.
const CAPA_TRANSITIONS = {
  open: ['in_progress'],
  in_progress: ['pending_verification', 'open'],
  pending_verification: ['verified', 'in_progress'],
  verified: ['closed', 'in_progress'],
  closed: [], // terminal
};

function canTransition(from, to) {
  if (from === to) return true;
  return (CAPA_TRANSITIONS[from] || []).includes(to);
}

// GET /capas
async function listCAPAs(req, res) {
  const { status, owner_id, ncr_id, page = 1, limit = 20 } = req.query;
  const from = (Number(page) - 1) * Number(limit);
  const to = from + Number(limit) - 1;

  let query = supabase
    .from('capas')
    .select('*, ncrs(ncr_number, title)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (status) query = query.eq('status', status);
  if (owner_id) query = query.eq('owner', owner_id);
  if (ncr_id) query = query.eq('ncr_id', ncr_id);

  const { data, error, count } = await query;
  if (error) throw error;
  res.json({ success: true, data, pagination: { page: Number(page), limit: Number(limit), total: count } });
}

// GET /capas/:id
async function getCAPA(req, res) {
  const { data, error } = await supabase
    .from('capas')
    .select('*, ncrs(ncr_number, title, severity, suppliers(name, code))')
    .eq('id', req.params.id)
    .single();

  if (error) return res.status(404).json({ success: false, error: 'CAPA not found' });
  res.json({ success: true, data });
}

// POST /capas — create CAPA linked to an NCR
async function createCAPA(req, res) {
  const body = req.body;
  const capa_number = await nextCode('capas', 'capa_number', 'CAPA');

  const insert = {
    capa_number,
    ncr_id: body.ncr_id ?? null,
    title: body.title,
    problem_statement: body.problem_statement,
    root_cause_analysis: body.root_cause_analysis ?? null,
    corrective_action: body.corrective_action ?? null,
    preventive_action: body.preventive_action ?? null,
    owner: body.owner ?? req.user?.id ?? null,
    status: 'open',
    target_date: body.target_date ?? null,
  };

  const { data, error } = await supabase.from('capas').insert(insert).select().single();
  if (error) throw error;

  // Creating a CAPA moves the linked NCR into capa_required if not already past it.
  if (data.ncr_id) {
    await supabase
      .from('ncrs')
      .update({ status: 'capa_required' })
      .eq('id', data.ncr_id)
      .in('status', ['open', 'under_review', 'awaiting_supplier']);
  }

  res.status(201).json({ success: true, data });
}

// PATCH /capas/:id — update fields and/or transition status
async function updateCAPA(req, res) {
  const allowed = ['title', 'problem_statement', 'root_cause_analysis', 'corrective_action', 'preventive_action', 'owner', 'target_date', 'status'];
  const update = {};
  for (const k of allowed) if (k in req.body) update[k] = req.body[k];

  if (update.status) {
    const { data: current } = await supabase.from('capas').select('status').eq('id', req.params.id).single();
    if (current && !canTransition(current.status, update.status)) {
      return res.status(422).json({
        success: false,
        error: `Invalid transition: ${current.status} → ${update.status}`,
        allowed: CAPA_TRANSITIONS[current.status] || [],
      });
    }
  }

  const { data, error } = await supabase
    .from('capas')
    .update(update)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) throw error;
  res.json({ success: true, data });
}

// POST /capas/:id/verify — mark verified + log effectiveness score
async function verifyCAPA(req, res) {
  const { effectiveness_score } = req.body;
  if (effectiveness_score == null || effectiveness_score < 1 || effectiveness_score > 10) {
    return res.status(400).json({ success: false, error: 'effectiveness_score must be 1–10' });
  }

  const { data: current } = await supabase.from('capas').select('status').eq('id', req.params.id).single();
  if (!current) return res.status(404).json({ success: false, error: 'CAPA not found' });
  if (!canTransition(current.status, 'verified')) {
    return res.status(422).json({
      success: false,
      error: `Cannot verify from status ${current.status}`,
      allowed: CAPA_TRANSITIONS[current.status] || [],
    });
  }

  const { data, error } = await supabase
    .from('capas')
    .update({
      status: 'verified',
      verified_by: req.user?.id ?? null,
      verified_at: new Date().toISOString(),
      effectiveness_score,
    })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) throw error;
  res.json({ success: true, data });
}

module.exports = { listCAPAs, getCAPA, createCAPA, updateCAPA, verifyCAPA, CAPA_TRANSITIONS, canTransition };
