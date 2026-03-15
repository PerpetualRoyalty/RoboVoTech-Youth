const {
  getRequestUrl,
  handleCreateSubmission,
  handleListSubmissions,
  sendJson,
  sendNoContent
} = require('../../lib/interest-api');

module.exports = async (req, res) => {
  try {
    if (req.method === 'OPTIONS') {
      sendNoContent(res);
      return;
    }

    if (req.method === 'POST') {
      await handleCreateSubmission(req, res);
      return;
    }

    if (req.method === 'GET') {
      await handleListSubmissions(req, res, getRequestUrl(req));
      return;
    }

    sendJson(res, 405, { ok: false, error: 'Method not allowed.' });
  } catch (error) {
    sendJson(res, 500, { ok: false, error: 'Unexpected server error.' });
  }
};
