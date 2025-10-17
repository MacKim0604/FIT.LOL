const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { authenticate, requireRole } = require('./shared/auth');
const { ingestionRouter } = require('./routes/ingestion.route');

function createServer() {
  const app = express();

  const allowedOrigins = (process.env.CORS_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean);
  const corsOptions = {
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  };

  app.use(helmet());
  app.use(cors(corsOptions));
  app.use(express.json());

  const apiLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '60', 10),
  });
  app.use('/api/v1', apiLimiter);

  app.get('/api/v1/health', (_req, res) => {
    res.status(200).json({ success: true, data: { status: 'ok' } });
  });

  // Admin-only ingestion routes
  app.use('/api/v1/ingestion', authenticate, requireRole('LEADER'), ingestionRouter);

  // basic error handler
  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal Server Error' } });
  });

  return app;
}

module.exports = { createServer };
