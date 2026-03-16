const { handleLogout, sendJson, sendNoContent } = require('../../lib/app-api');

module.exports = async (req, res) => {
  try {
    if (req.method === 'OPTIONS') {
      sendNoContent(res);
      return;
    }

    if (req.method !== 'POST') {
      sendJson(res, 405, { ok: false, error: 'Method not allowed.' });
      return;
    }

    await handleLogout(req, res);
  } catch (error) {
    sendJson(res, 500, { ok: false, error: 'Unexpected server error.' });
  }
};
