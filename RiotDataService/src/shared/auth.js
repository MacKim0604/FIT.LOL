const jwksRsa = require('jwks-rsa');
const jwt = require('jsonwebtoken');
const axios = require('axios');

let jwksClient;
let discoveredJwksUri;

async function getJwksClient() {
  if (jwksClient) return jwksClient;
  let jwksUri = process.env.OIDC_JWKS_URI;
  const issuer = process.env.OIDC_ISSUER_URL;
  if (!jwksUri && issuer) {
    try {
      const wellKnown = `${issuer}/.well-known/openid-configuration`;
      const { data } = await axios.get(wellKnown, { timeout: 5000 });
      discoveredJwksUri = data.jwks_uri;
      jwksUri = discoveredJwksUri;
    } catch (e) {
      console.warn('Failed to discover JWKS URI; please set OIDC_JWKS_URI');
    }
  }
  jwksClient = jwksRsa({ jwksUri });
  return jwksClient;
}

function getValueByPath(obj, path) {
  try {
    return path.split('.').reduce((acc, k) => (acc && acc[k] !== undefined ? acc[k] : undefined), obj);
  } catch {
    return undefined;
  }
}

async function getKey(header, callback) {
  try {
    const client = await getJwksClient();
    client.getSigningKey(header.kid, (err, key) => {
      if (err) return callback(err);
      const signingKey = key.getPublicKey();
      callback(null, signingKey);
    });
  } catch (e) {
    callback(e);
  }
}

function authenticate(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) {
    return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Missing token' } });
  }
  const verifyOptions = { algorithms: ['RS256'], issuer: process.env.OIDC_ISSUER_URL };
  if (process.env.OIDC_AUDIENCE) verifyOptions.audience = process.env.OIDC_AUDIENCE;

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
    const roles = getValueByPath(req.user || {}, process.env.OIDC_ROLE_PATH || 'realm_access.roles') || [];
    if (!Array.isArray(roles) || !roles.includes(role)) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Insufficient role' } });
    }
    next();
  };
}

module.exports = { authenticate, requireRole };
