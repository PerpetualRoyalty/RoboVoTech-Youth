const crypto = require('crypto');
const {
  buildClearSessionCookie,
  buildSessionCookie,
  cleanString,
  createSessionToken,
  getSessionFromRequest,
  hashPassword,
  sanitizeUser,
  validateLogin,
  validateRegistration,
  verifyPassword
} = require('./auth');
const {
  ensureAppStorage,
  readCertificationOrders,
  readUsers,
  writeCertificationOrders,
  writeUsers
} = require('./app-store');
const { buildCertificationProducts, loadCurriculum } = require('./curriculum');

const MAX_BODY_SIZE = 1024 * 1024;

function sendJson(res, statusCode, payload, extraHeaders = {}) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...extraHeaders
  });
  res.end(JSON.stringify(payload));
}

function sendNoContent(res, extraHeaders = {}) {
  res.writeHead(204, {
    'Cache-Control': 'no-store',
    ...extraHeaders
  });
  res.end();
}

function parseBody(req) {
  if (req.body && typeof req.body === 'object') {
    return Promise.resolve(req.body);
  }

  return new Promise((resolve, reject) => {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk;

      if (body.length > MAX_BODY_SIZE) {
        reject(new Error('Request body too large.'));
        req.destroy();
      }
    });

    req.on('end', () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error('Request body must be valid JSON.'));
      }
    });

    req.on('error', reject);
  });
}

function readRawBody(req) {
  if (typeof req.body === 'string') {
    return Promise.resolve(req.body);
  }

  return new Promise((resolve, reject) => {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk;

      if (body.length > MAX_BODY_SIZE) {
        reject(new Error('Request body too large.'));
        req.destroy();
      }
    });

    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

function getRequestUrl(req) {
  return new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
}

function getOrigin(req) {
  const host = req.headers.host || 'localhost:3000';
  const protocol = req.headers['x-forwarded-proto'] || (host.includes('localhost') ? 'http' : 'https');
  return `${protocol}://${host}`;
}

function calculateProgress(curriculum, completedModuleIds) {
  const moduleIds = curriculum.coreCertification.modules.map((module) => module.id);
  const completed = moduleIds.filter((moduleId) => completedModuleIds.includes(moduleId));
  const totalModules = moduleIds.length;

  return {
    completedCount: completed.length,
    totalCount: totalModules,
    completionRate: totalModules ? Math.round((completed.length / totalModules) * 100) : 0
  };
}

async function getAuthenticatedUser(req) {
  await ensureAppStorage();

  const session = getSessionFromRequest(req);
  if (!session) {
    return null;
  }

  const users = await readUsers();
  return users.find((user) => user.id === session.sub) || null;
}

async function requireAuth(req, res) {
  const user = await getAuthenticatedUser(req);

  if (!user) {
    sendJson(res, 401, {
      ok: false,
      error: 'Authentication required.'
    });
    return null;
  }

  return user;
}

function validateModuleProgress(moduleId, curriculum) {
  const validModuleIds = new Set([
    ...curriculum.coreCertification.modules.map((module) => module.id),
    ...curriculum.youthTrack.modules.map((module) => module.id)
  ]);

  return validModuleIds.has(moduleId);
}

async function handleRegister(req, res) {
  let body;

  try {
    body = await parseBody(req);
  } catch (error) {
    sendJson(res, 400, { ok: false, error: error.message });
    return;
  }

  const { valid, errors, user, password } = validateRegistration(body);

  if (!valid) {
    sendJson(res, 422, {
      ok: false,
      error: 'Please correct the highlighted fields and try again.',
      details: errors
    });
    return;
  }

  await ensureAppStorage();
  const users = await readUsers();

  if (users.some((entry) => entry.email === user.email)) {
    sendJson(res, 409, {
      ok: false,
      error: 'An account with that email already exists.'
    });
    return;
  }

  const now = new Date().toISOString();
  const passwordData = hashPassword(password);
  const record = {
    id: crypto.randomUUID(),
    ...user,
    ...passwordData,
    createdAt: now,
    lastLoginAt: now,
    completedModuleIds: []
  };

  users.unshift(record);
  await writeUsers(users);

  const token = createSessionToken(record.id);
  sendJson(res, 201, {
    ok: true,
    user: sanitizeUser(record)
  }, {
    'Set-Cookie': buildSessionCookie(token, req)
  });
}

async function handleLogin(req, res) {
  let body;

  try {
    body = await parseBody(req);
  } catch (error) {
    sendJson(res, 400, { ok: false, error: error.message });
    return;
  }

  const { valid, errors, email, password } = validateLogin(body);

  if (!valid) {
    sendJson(res, 422, {
      ok: false,
      error: 'Please correct the highlighted fields and try again.',
      details: errors
    });
    return;
  }

  await ensureAppStorage();
  const users = await readUsers();
  const user = users.find((entry) => entry.email === email);

  if (!user || !verifyPassword(password, user.passwordSalt, user.passwordHash)) {
    sendJson(res, 401, {
      ok: false,
      error: 'Email or password is incorrect.'
    });
    return;
  }

  user.lastLoginAt = new Date().toISOString();
  await writeUsers(users);

  const token = createSessionToken(user.id);
  sendJson(res, 200, {
    ok: true,
    user: sanitizeUser(user)
  }, {
    'Set-Cookie': buildSessionCookie(token, req)
  });
}

async function handleLogout(req, res) {
  sendNoContent(res, {
    'Set-Cookie': buildClearSessionCookie(req)
  });
}

async function handleSession(req, res) {
  const user = await getAuthenticatedUser(req);

  sendJson(res, 200, {
    ok: true,
    authenticated: Boolean(user),
    user: sanitizeUser(user)
  });
}

async function handleCurriculum(req, res) {
  const [curriculum, user] = await Promise.all([
    loadCurriculum(),
    getAuthenticatedUser(req)
  ]);

  const completedModuleIds = Array.isArray(user && user.completedModuleIds)
    ? user.completedModuleIds
    : [];

  sendJson(res, 200, {
    ok: true,
    curriculum,
    products: buildCertificationProducts(curriculum),
    user: sanitizeUser(user),
    progress: calculateProgress(curriculum, completedModuleIds)
  });
}

async function handleDashboard(req, res) {
  const user = await requireAuth(req, res);

  if (!user) {
    return;
  }

  const [curriculum, orders] = await Promise.all([
    loadCurriculum(),
    readCertificationOrders()
  ]);

  const userOrders = orders
    .filter((order) => order.userId === user.id)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));

  sendJson(res, 200, {
    ok: true,
    user: sanitizeUser(user),
    curriculum,
    products: buildCertificationProducts(curriculum),
    progress: calculateProgress(curriculum, user.completedModuleIds || []),
    orders: userOrders
  });
}

async function handleUpdateProgress(req, res) {
  const user = await requireAuth(req, res);

  if (!user) {
    return;
  }

  let body;

  try {
    body = await parseBody(req);
  } catch (error) {
    sendJson(res, 400, { ok: false, error: error.message });
    return;
  }

  const curriculum = await loadCurriculum();
  const moduleId = cleanString(body.moduleId, 120);
  const completed = Boolean(body.completed);

  if (!moduleId || !validateModuleProgress(moduleId, curriculum)) {
    sendJson(res, 422, {
      ok: false,
      error: 'Module selection is invalid.'
    });
    return;
  }

  const users = await readUsers();
  const userIndex = users.findIndex((entry) => entry.id === user.id);

  if (userIndex === -1) {
    sendJson(res, 404, {
      ok: false,
      error: 'User record was not found.'
    });
    return;
  }

  const completedModuleIds = new Set(users[userIndex].completedModuleIds || []);
  if (completed) {
    completedModuleIds.add(moduleId);
  } else {
    completedModuleIds.delete(moduleId);
  }

  users[userIndex].completedModuleIds = Array.from(completedModuleIds).sort();
  await writeUsers(users);

  sendJson(res, 200, {
    ok: true,
    user: sanitizeUser(users[userIndex]),
    progress: calculateProgress(curriculum, users[userIndex].completedModuleIds)
  });
}

function getStripeSecretKey() {
  return process.env.STRIPE_SECRET_KEY || '';
}

function getStripeWebhookSecret() {
  return process.env.STRIPE_WEBHOOK_SECRET || '';
}

function verifyStripeWebhookSignature(payload, header, secret) {
  if (!header || !secret) {
    return false;
  }

  const segments = header.split(',').reduce((accumulator, part) => {
    const [key, value] = part.split('=');
    accumulator[key] = value;
    return accumulator;
  }, {});

  if (!segments.t || !segments.v1) {
    return false;
  }

  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${segments.t}.${payload}`)
    .digest('hex');

  if (expected.length !== segments.v1.length) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(segments.v1));
}

async function createStripeCheckoutSession({ origin, product, user, orderId }) {
  const secretKey = getStripeSecretKey();

  if (!secretKey) {
    throw new Error('Stripe is not configured. Set STRIPE_SECRET_KEY before enabling certification checkout.');
  }

  const body = new URLSearchParams({
    mode: 'payment',
    success_url: `${origin}/dashboard?checkout=success&order=${orderId}`,
    cancel_url: `${origin}/dashboard?checkout=cancelled`,
    customer_email: user.email,
    client_reference_id: user.id,
    'metadata[orderId]': orderId,
    'metadata[userId]': user.id,
    'metadata[productId]': product.id,
    'line_items[0][quantity]': '1',
    'line_items[0][price_data][currency]': 'usd',
    'line_items[0][price_data][unit_amount]': String(product.feeCents),
    'line_items[0][price_data][product_data][name]': product.title,
    'line_items[0][price_data][product_data][description]': product.description,
    allow_promotion_codes: 'true'
  });

  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body
  });

  const payload = await response.json();

  if (!response.ok) {
    const message = payload && payload.error && payload.error.message
      ? payload.error.message
      : 'Stripe checkout session could not be created.';

    throw new Error(message);
  }

  return payload;
}

async function handleCertificationCheckout(req, res) {
  const user = await requireAuth(req, res);

  if (!user) {
    return;
  }

  let body;

  try {
    body = await parseBody(req);
  } catch (error) {
    sendJson(res, 400, { ok: false, error: error.message });
    return;
  }

  const curriculum = await loadCurriculum();
  const products = buildCertificationProducts(curriculum);
  const productId = cleanString(body.productId, 160);
  const product = products.find((entry) => entry.id === productId);

  if (!product) {
    sendJson(res, 404, {
      ok: false,
      error: 'Certification product not found.'
    });
    return;
  }

  const orders = await readCertificationOrders();
  const now = new Date().toISOString();
  const order = {
    id: crypto.randomUUID(),
    userId: user.id,
    productId: product.id,
    title: product.title,
    category: product.category,
    amountCents: product.feeCents,
    amountUsd: product.feeUsd,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
    paidAt: '',
    stripeSessionId: '',
    stripePaymentIntentId: ''
  };

  try {
    const stripeSession = await createStripeCheckoutSession({
      origin: getOrigin(req),
      product,
      user,
      orderId: order.id
    });

    order.stripeSessionId = stripeSession.id || '';
    orders.unshift(order);
    await writeCertificationOrders(orders);

    sendJson(res, 200, {
      ok: true,
      orderId: order.id,
      checkoutUrl: stripeSession.url
    });
  } catch (error) {
    sendJson(res, 503, {
      ok: false,
      error: error.message
    });
  }
}

async function handleStripeWebhook(req, res) {
  const secret = getStripeWebhookSecret();

  if (!secret) {
    sendJson(res, 503, {
      ok: false,
      error: 'Stripe webhook secret is not configured.'
    });
    return;
  }

  let rawBody;

  try {
    rawBody = await readRawBody(req);
  } catch (error) {
    sendJson(res, 400, {
      ok: false,
      error: error.message
    });
    return;
  }

  const signature = req.headers['stripe-signature'];
  if (!verifyStripeWebhookSignature(rawBody, signature, secret)) {
    sendJson(res, 400, {
      ok: false,
      error: 'Stripe signature verification failed.'
    });
    return;
  }

  let event;

  try {
    event = JSON.parse(rawBody);
  } catch {
    sendJson(res, 400, {
      ok: false,
      error: 'Webhook payload must be valid JSON.'
    });
    return;
  }

  if (event.type !== 'checkout.session.completed') {
    sendJson(res, 200, { ok: true, ignored: true });
    return;
  }

  const session = event.data && event.data.object;
  const orderId = session && session.metadata && session.metadata.orderId;

  if (!orderId) {
    sendJson(res, 200, { ok: true, ignored: true });
    return;
  }

  const orders = await readCertificationOrders();
  const orderIndex = orders.findIndex((entry) => entry.id === orderId);

  if (orderIndex !== -1) {
    orders[orderIndex] = {
      ...orders[orderIndex],
      status: 'paid',
      paidAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      stripeSessionId: session.id || orders[orderIndex].stripeSessionId,
      stripePaymentIntentId: session.payment_intent || ''
    };
    await writeCertificationOrders(orders);
  }

  sendJson(res, 200, { ok: true });
}

module.exports = {
  getRequestUrl,
  handleCertificationCheckout,
  handleCurriculum,
  handleDashboard,
  handleLogin,
  handleLogout,
  handleRegister,
  handleSession,
  handleStripeWebhook,
  handleUpdateProgress,
  sendJson,
  sendNoContent
};
