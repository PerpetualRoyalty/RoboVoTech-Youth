const {
  applySubmissionUpdate,
  createSubmissionRecord,
  filterSubmissions,
  findRecentDuplicate,
  removeSubmission,
  STATUSES,
  submissionsToCsv,
  summarizeSubmissions,
  validateSubmission,
  validateSubmissionUpdate
} = require('./interest-submissions');
const { readSubmissions, writeSubmissions } = require('./submission-store');

const MAX_BODY_SIZE = 1024 * 1024;

function sendJson(res, statusCode, payload, extraHeaders = {}) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...extraHeaders
  });
  res.end(JSON.stringify(payload));
}

function sendText(res, statusCode, payload, contentType = 'text/plain; charset=utf-8') {
  res.writeHead(statusCode, {
    'Content-Type': contentType,
    'Cache-Control': 'no-store'
  });
  res.end(payload);
}

function sendNoContent(res) {
  res.writeHead(204, {
    'Cache-Control': 'no-store'
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

function isAuthorized(req) {
  const apiKey = process.env.ADMIN_API_KEY || '';
  return Boolean(apiKey) && req.headers['x-admin-key'] === apiKey;
}

function getRequestUrl(req) {
  return new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
}

async function handleCreateSubmission(req, res) {
  let body;

  try {
    body = await parseBody(req);
  } catch (error) {
    sendJson(res, 400, { ok: false, error: error.message });
    return;
  }

  const { valid, errors, submission } = validateSubmission(body);
  if (!valid) {
    sendJson(res, 422, {
      ok: false,
      error: 'Please correct the highlighted fields and try again.',
      details: errors
    });
    return;
  }

  const submissions = await readSubmissions();
  const duplicate = findRecentDuplicate(submissions, submission);

  if (duplicate) {
    sendJson(res, 200, {
      ok: true,
      duplicate: true,
      message: 'We already have a recent submission for this contact.'
    });
    return;
  }

  const record = createSubmissionRecord(submission);
  submissions.unshift(record);
  await writeSubmissions(submissions);

  sendJson(res, 201, {
    ok: true,
    duplicate: false,
    submissionId: record.id,
    message: 'Interest submitted successfully.'
  });
}

async function handleListSubmissions(req, res, url = getRequestUrl(req)) {
  if (!isAuthorized(req)) {
    sendJson(res, 401, {
      ok: false,
      error: 'Admin API key required.'
    });
    return;
  }

  const submissions = await readSubmissions();
  const filtered = filterSubmissions(submissions, {
    archived: url.searchParams.get('archived') || 'active',
    status: url.searchParams.get('status') || '',
    search: url.searchParams.get('search') || ''
  });
  const limit = Number.parseInt(url.searchParams.get('limit') || '100', 10);
  const trimmed = filtered.slice(0, Number.isNaN(limit) ? 100 : Math.max(1, Math.min(limit, 1000)));

  sendJson(res, 200, {
    ok: true,
    summary: summarizeSubmissions(submissions),
    statuses: STATUSES,
    filters: {
      archived: url.searchParams.get('archived') || 'active',
      status: url.searchParams.get('status') || 'all',
      search: url.searchParams.get('search') || ''
    },
    totalFiltered: filtered.length,
    submissions: trimmed
  });
}

async function handleUpdateSubmission(req, res, submissionId) {
  if (!isAuthorized(req)) {
    sendJson(res, 401, {
      ok: false,
      error: 'Admin API key required.'
    });
    return;
  }

  let body;

  try {
    body = await parseBody(req);
  } catch (error) {
    sendJson(res, 400, { ok: false, error: error.message });
    return;
  }

  const { valid, errors, updates } = validateSubmissionUpdate(body);
  if (!valid) {
    sendJson(res, 422, {
      ok: false,
      error: 'Please correct the update and try again.',
      details: errors
    });
    return;
  }

  const submissions = await readSubmissions();
  const index = submissions.findIndex((submission) => submission.id === submissionId);

  if (index === -1) {
    sendJson(res, 404, {
      ok: false,
      error: 'Submission not found.'
    });
    return;
  }

  const updatedSubmission = applySubmissionUpdate(submissions[index], updates);
  submissions[index] = updatedSubmission;
  await writeSubmissions(submissions);

  sendJson(res, 200, {
    ok: true,
    submission: updatedSubmission,
    summary: summarizeSubmissions(submissions)
  });
}

async function handleExportSubmissions(req, res) {
  if (!isAuthorized(req)) {
    sendJson(res, 401, {
      ok: false,
      error: 'Admin API key required.'
    });
    return;
  }

  const submissions = await readSubmissions();
  sendText(res, 200, submissionsToCsv(submissions), 'text/csv; charset=utf-8');
}

async function handleDeleteSubmission(req, res, submissionId) {
  if (!isAuthorized(req)) {
    sendJson(res, 401, {
      ok: false,
      error: 'Admin API key required.'
    });
    return;
  }

  const submissions = await readSubmissions();
  const submission = submissions.find((entry) => entry.id === submissionId);

  if (!submission) {
    sendJson(res, 404, {
      ok: false,
      error: 'Submission not found.'
    });
    return;
  }

  const remaining = removeSubmission(submissions, submissionId);
  await writeSubmissions(remaining);

  sendJson(res, 200, {
    ok: true,
    deletedId: submissionId,
    summary: summarizeSubmissions(remaining)
  });
}

async function handleHealth(req, res) {
  const submissions = await readSubmissions();
  sendJson(res, 200, {
    ok: true,
    service: 'robovotech-interest-api',
    summary: summarizeSubmissions(submissions)
  });
}

module.exports = {
  getRequestUrl,
  handleCreateSubmission,
  handleDeleteSubmission,
  handleExportSubmissions,
  handleHealth,
  handleListSubmissions,
  handleUpdateSubmission,
  sendJson,
  sendNoContent,
  sendText
};
