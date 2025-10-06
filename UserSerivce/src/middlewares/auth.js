const jwksRsa = require('jwks-rsa');
const jwt = require('jsonwebtoken');

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

module.exports = { authenticate, requireRole, getValueByPath };
