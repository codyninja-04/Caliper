const { supabase } = require('../services/supabaseClient');

// Application-level audit logging. The DB triggers already capture row diffs,
// but this middleware enriches the trail with request context (IP, user agent,
// authenticated actor) that the database alone cannot see.
//
// Attach to mutating routes. It wraps res.json so that, on a 2xx response that
// carries a record id, it appends an audit_log row. Best-effort — a logging
// failure never blocks the response.
function auditLogger(tableName) {
  return (req, res, next) => {
    const action =
      req.method === 'POST' ? 'INSERT' : req.method === 'DELETE' ? 'DELETE' : 'UPDATE';

    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const recordId = body?.data?.id || req.params?.id || null;
        if (recordId) {
          supabase
            .from('audit_log')
            .insert({
              table_name: tableName,
              record_id: recordId,
              action,
              new_values: body?.data ?? null,
              changed_by: req.user?.id ?? null,
              ip_address: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || null,
              user_agent: req.headers['user-agent'] || null,
            })
            .then(({ error }) => {
              if (error) console.error('[auditLogger] insert failed:', error.message);
            });
        }
      }
      return originalJson(body);
    };

    next();
  };
}

module.exports = { auditLogger };
