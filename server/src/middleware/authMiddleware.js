const { supabase, clientForToken } = require('../services/supabaseClient');

// Verifies the Supabase JWT on the Authorization header, loads the user's
// profile (for role checks), and attaches { id, email, role, profile } to req.user.
async function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, error: 'Missing bearer token' });
  }

  try {
    const { data, error } = await clientForToken(token).auth.getUser(token);
    if (error || !data?.user) {
      return res.status(401).json({ success: false, error: 'Invalid or expired token' });
    }

    // Pull role from the profile table (service client bypasses RLS for this read).
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id, full_name, role, department')
      .eq('id', data.user.id)
      .single();

    req.user = {
      id: data.user.id,
      email: data.user.email,
      role: profile?.role || 'viewer',
      profile: profile || null,
    };
    next();
  } catch (err) {
    next(err);
  }
}

// Guard a route by role. Usage: requireRole('quality_engineer', 'admin')
function requireRole(...allowed) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }
    if (!allowed.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Requires role: ${allowed.join(' or ')}`,
      });
    }
    next();
  };
}

module.exports = { authMiddleware, requireRole };
