const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwksRsa = require('jwks-rsa');
const jwt = require('jsonwebtoken');
const { helloRouter } = require('./routes/hello.route');
const { riotRouter } = require('./routes/riot.route');

function createServer() {
  const app = express();

  const ISSUER = process.env.OIDC_ISSUER_URL;
  const JWKS_URI = process.env.OIDC_JWKS_URI;
  const AUDIENCE = process.env.OIDC_AUDIENCE;
  const ROLE_PATH = process.env.OIDC_ROLE_PATH || 'realm_access.roles';

  const jwksClient = jwksRsa({ jwksUri: JWKS_URI });

  function getKey(header, callback) {
    jwksClient.getSigningKey(header.kid, (err, key) => {
      if (err) return callback(err);
      const signingKey = key.getPublicKey();
      callback(null, signingKey);
    });
  }

  function getValueByPath(obj, path) {
    try {
      return path.split('.').reduce((acc, k) => (acc && acc[k] !== undefined ? acc[k] : undefined), obj);
    } catch {
      return undefined;
    }
  }

  function authenticate(req, res, next) {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Missing token' } });
    }

    const verifyOptions = { algorithms: ['RS256'], issuer: ISSUER };
    if (AUDIENCE) verifyOptions.audience = AUDIENCE;

    jwt.verify(token, getKey, verifyOptions, (err, payload) => {
      if (err) {
        const code = err.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'UNAUTHORIZED';
        return res.status(401).json({ success: false, error: { code, message: 'Invalid token' } });
      }
      req.user = payload;
      next();
    });
  }

  function requireRole(role) {
    return (req, res, next) => {
      const roles = getValueByPath(req.user || {}, ROLE_PATH) || [];
      if (!Array.isArray(roles) || !roles.includes(role)) {
        return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Insufficient role' } });
      }
      next();
    };
  }

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
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  });
  app.use('/api/v1', apiLimiter);

  app.get('/api/v1/health', (_req, res) => {
    /* #swagger.tags = ['Health'] */
    /* #swagger.summary = 'Health check' */
    /* #swagger.responses[200] = { description: 'OK' } */
    res.status(200).json({ success: true, data: { status: 'ok' } });
  });

  app.use('/api/v1', helloRouter);
  app.use('/api/v1/riot', authenticate, requireRole('MEMBER'), riotRouter);

  // basic error handler
  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'Internal Server Error' } });
  });

  return app;
}

module.exports = { createServer };
