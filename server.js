const http = require('http');
const fs = require('fs').promises;
const path = require('path');
const {
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
} = require('./lib/interest-api');
const { ensureStorage } = require('./lib/submission-store');

const HOST = process.env.HOST || '0.0.0.0';
const PORT = Number.parseInt(process.env.PORT || '3000', 10);
const LANDING_PAGE = path.join(__dirname, 'robovotech-youth.html');
const ADMIN_PAGE = path.join(__dirname, 'admin.html');

async function serveLandingPage(res) {
  try {
    const html = await fs.readFile(LANDING_PAGE, 'utf8');
    sendText(res, 200, html, 'text/html; charset=utf-8');
  } catch (error) {
    sendJson(res, 500, { ok: false, error: 'Landing page could not be loaded.' });
  }
}

async function serveAdminPage(res) {
  try {
    const html = await fs.readFile(ADMIN_PAGE, 'utf8');
    sendText(res, 200, html, 'text/html; charset=utf-8');
  } catch (error) {
    sendJson(res, 500, { ok: false, error: 'Admin page could not be loaded.' });
  }
}

const server = http.createServer(async (req, res) => {
  const url = getRequestUrl(req);
  const submissionMatch = url.pathname.match(/^\/api\/interest-submissions\/([a-f0-9-]+)$/i);

  if (req.method === 'OPTIONS') {
    sendNoContent(res);
    return;
  }

  try {
    if (req.method === 'GET' && url.pathname === '/') {
      await serveLandingPage(res);
      return;
    }

    if (req.method === 'GET' && (url.pathname === '/admin' || url.pathname === '/admin/')) {
      await serveAdminPage(res);
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/health') {
      await handleHealth(req, res);
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/interest-submissions') {
      await handleCreateSubmission(req, res);
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/interest-submissions') {
      await handleListSubmissions(req, res, url);
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/interest-submissions.csv') {
      await handleExportSubmissions(req, res);
      return;
    }

    if (req.method === 'PATCH' && submissionMatch) {
      await handleUpdateSubmission(req, res, submissionMatch[1]);
      return;
    }

    if (req.method === 'DELETE' && submissionMatch) {
      await handleDeleteSubmission(req, res, submissionMatch[1]);
      return;
    }

    sendJson(res, 404, { ok: false, error: 'Route not found.' });
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      error: 'Unexpected server error.'
    });
  }
});

async function startServer(options = {}) {
  const host = options.host || HOST;
  const port = options.port || PORT;

  await ensureStorage();

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, () => {
      server.removeListener('error', reject);
      console.log(`RoboVoTech server listening on http://${host}:${port}`);
      resolve(server);
    });
  });
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = {
  server,
  startServer
};
