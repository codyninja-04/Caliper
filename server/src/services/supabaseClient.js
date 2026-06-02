const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  // Warn rather than crash so unit tests (and `--check` style boots without a
  // configured .env) can still import controllers. Live queries will fail fast.
  console.warn(
    '[supabaseClient] SUPABASE_URL or SUPABASE_SERVICE_KEY missing — ' +
      'set them in server/.env before serving requests.'
  );
}

// Placeholders keep createClient from throwing at import time when env is unset
// (e.g. in CI running pure-logic tests). They are never used for real traffic.
const url = SUPABASE_URL || 'https://placeholder.supabase.co';
const serviceKey = SUPABASE_SERVICE_KEY || 'placeholder-service-key';

// Service-role client: bypasses RLS. Used by the API after our own
// authMiddleware has already verified the caller and their role.
const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Verifies a user JWT and returns the auth user. Uses the anon key because
// getUser(token) only needs to validate the token, not elevate privileges.
function clientForToken(token) {
  return createClient(url, SUPABASE_ANON_KEY || serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

module.exports = { supabase, clientForToken };
