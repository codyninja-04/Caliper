require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const { authMiddleware } = require('./middleware/authMiddleware');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const defectsRouter = require('./routes/defects');
const ncrRouter = require('./routes/ncr');
const capaRouter = require('./routes/capa');
const suppliersRouter = require('./routes/suppliers');
const auditRouter = require('./routes/audit');

const app = express();
const PORT = process.env.PORT || 3001;

// ---- Global middleware ----
app.use(helmet());
app.use(express.json({ limit: '1mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Normalize by trimming whitespace and stripping any trailing slash, so a
// configured "https://x.app/" matches the browser's "https://x.app" Origin.
const stripSlash = (s) => s.trim().replace(/\/+$/, '');
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map(stripSlash)
  .filter(Boolean);

// This app's frontend lives on Vercel as caliper-*.vercel.app (production +
// preview deploys get different subdomains) and on localhost in dev. Matching
// these in code means a correct CORS_ORIGINS env var is a bonus, not a
// single point of failure for the deployment.
const CALIPER_VERCEL = /^https:\/\/caliper[a-z0-9-]*\.vercel\.app$/i;
const LOCALHOST = /^http:\/\/localhost(:\d+)?$/i;

function isAllowedOrigin(origin) {
  const o = stripSlash(origin);
  return allowedOrigins.includes(o) || CALIPER_VERCEL.test(o) || LOCALHOST.test(o);
}

app.use(
  cors({
    origin(origin, cb) {
      // Allow same-origin / curl (no origin) and any recognized origin.
      if (!origin || isAllowedOrigin(origin)) return cb(null, true);
      // Disallowed origin: respond without CORS headers rather than throwing a
      // 500. The browser still blocks the request, but we avoid a misleading
      // server error and noisy logs.
      cb(null, false);
    },
    credentials: true,
  })
);

// ---- Health check (public, no auth) — also used by the cold-start banner ----
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'caliper-api', timestamp: new Date().toISOString() });
});

// ---- API v1 (all routes require a valid Supabase JWT) ----
const api = express.Router();
api.use(authMiddleware);
api.use('/defects', defectsRouter);
api.use('/ncrs', ncrRouter);
api.use('/capas', capaRouter);
api.use('/suppliers', suppliersRouter);
api.use('/audit', auditRouter);

app.use('/api/v1', api);

// ---- Fallthrough + error handling (must be last) ----
app.use(notFound);
app.use(errorHandler);

// Only listen when run directly (so tests can import the app).
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Caliper API listening on :${PORT} (${process.env.NODE_ENV || 'development'})`);
  });
}

module.exports = app;
