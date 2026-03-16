const crypto = require('crypto');

const SESSION_COOKIE_NAME = 'robovotech_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14;

function cleanString(value, maxLength = 200) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function normalizeEmail(value) {
  return cleanString(value, 120).toLowerCase();
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validateRegistration(input) {
  const firstName = cleanString(input.firstName, 60);
  const lastName = cleanString(input.lastName, 60);
  const email = normalizeEmail(input.email);
  const password = typeof input.password === 'string' ? input.password : '';
  const errors = [];

  if (!firstName) errors.push('First name is required.');
  if (!lastName) errors.push('Last name is required.');
  if (!email) errors.push('Email is required.');
  if (email && !isValidEmail(email)) errors.push('Email must be valid.');
  if (!password) errors.push('Password is required.');
  if (password && password.length < 8) errors.push('Password must be at least 8 characters.');

  return {
    valid: errors.length === 0,
    errors,
    user: {
      firstName,
      lastName,
      email
    },
    password
  };
}

function validateLogin(input) {
  const email = normalizeEmail(input.email);
  const password = typeof input.password === 'string' ? input.password : '';
  const errors = [];

  if (!email) errors.push('Email is required.');
  if (email && !isValidEmail(email)) errors.push('Email must be valid.');
  if (!password) errors.push('Password is required.');

  return {
    valid: errors.length === 0,
    errors,
    email,
    password
  };
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
  return {
    passwordSalt: salt,
    passwordHash: derivedKey
  };
}

function verifyPassword(password, passwordSalt, passwordHash) {
  const derivedKey = crypto.scryptSync(password, passwordSalt, 64);
  const storedKey = Buffer.from(passwordHash, 'hex');

  if (derivedKey.length !== storedKey.length) {
    return false;
  }

  return crypto.timingSafeEqual(derivedKey, storedKey);
}

function toBase64Url(value) {
  return Buffer.from(value).toString('base64url');
}

function getSessionSecret() {
  return process.env.SESSION_SECRET || process.env.AUTH_SESSION_SECRET || 'robovotech-dev-session-secret';
}

function signSessionPayload(payload) {
  return crypto.createHmac('sha256', getSessionSecret()).update(payload).digest('base64url');
}

function createSessionToken(userId) {
  const payload = toBase64Url(JSON.stringify({
    sub: userId,
    exp: Date.now() + (SESSION_TTL_SECONDS * 1000)
  }));

  return `${payload}.${signSessionPayload(payload)}`;
}

function verifySessionToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) {
    return null;
  }

  const [payload, signature] = token.split('.');
  const expectedSignature = signSessionPayload(payload);

  if (!signature || signature.length !== expectedSignature.length) {
    return null;
  }

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (!parsed || !parsed.sub || !parsed.exp || parsed.exp < Date.now()) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function parseCookies(req) {
  const cookieHeader = req.headers && req.headers.cookie;
  const cookies = {};

  if (!cookieHeader) {
    return cookies;
  }

  cookieHeader.split(';').forEach((part) => {
    const separatorIndex = part.indexOf('=');
    if (separatorIndex === -1) {
      return;
    }

    const key = part.slice(0, separatorIndex).trim();
    const value = part.slice(separatorIndex + 1).trim();
    cookies[key] = decodeURIComponent(value);
  });

  return cookies;
}

function getSessionFromRequest(req) {
  const cookies = parseCookies(req);
  return verifySessionToken(cookies[SESSION_COOKIE_NAME]);
}

function isSecureRequest(req) {
  const forwardedProto = req.headers && req.headers['x-forwarded-proto'];
  return forwardedProto === 'https' || process.env.NODE_ENV === 'production';
}

function buildSessionCookie(token, req) {
  const parts = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${SESSION_TTL_SECONDS}`
  ];

  if (isSecureRequest(req)) {
    parts.push('Secure');
  }

  return parts.join('; ');
}

function buildClearSessionCookie(req) {
  const parts = [
    `${SESSION_COOKIE_NAME}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0'
  ];

  if (isSecureRequest(req)) {
    parts.push('Secure');
  }

  return parts.join('; ');
}

function sanitizeUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt || '',
    completedModuleIds: Array.isArray(user.completedModuleIds) ? user.completedModuleIds : []
  };
}

module.exports = {
  buildClearSessionCookie,
  buildSessionCookie,
  cleanString,
  createSessionToken,
  getSessionFromRequest,
  hashPassword,
  normalizeEmail,
  sanitizeUser,
  validateLogin,
  validateRegistration,
  verifyPassword
};
