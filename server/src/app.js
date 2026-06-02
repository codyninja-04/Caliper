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

const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim());

app.use(
  cors({
    origin(origin, cb) {
      // Allow same-origin / curl (no origin) and any explicitly whitelisted origin.
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error(`CORS blocked for origin: ${origin}`));
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
