const { supabase } = require('../services/supabaseClient');

// GET /audit — full trail with optional filters
async function listAudit(req, res) {
  const { table, action, from, to, page = 1, limit = 50 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  let query = supabase
    .from('audit_log')
    .select('*', { count: 'exact' })
    .order('changed_at', { ascending: false })
    .range(offset, offset + Number(limit) - 1);

  if (table) query = query.eq('table_name', table);
  if (action) query = query.eq('action', action);
  if (from) query = query.gte('changed_at', from);
  if (to) query = query.lte('changed_at', to);

  const { data, error, count } = await query;
  if (error) throw error;
  res.json({ success: true, data, pagination: { page: Number(page), limit: Number(limit), total: count } });
}

// GET /audit/:record_id — all changes to a specific record
async function getRecordHistory(req, res) {
  const { data, error } = await supabase
    .from('audit_log')
    .select('*')
    .eq('record_id', req.params.record_id)
    .order('changed_at', { ascending: false });

  if (error) throw error;
  res.json({ success: true, data });
}

module.exports = { listAudit, getRecordHistory };
