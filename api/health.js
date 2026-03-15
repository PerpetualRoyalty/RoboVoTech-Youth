const { handleHealth, sendJson, sendNoContent } = require('../lib/interest-api');

module.exports = async (req, res) => {
  try {
    if (req.method === 'OPTIONS') {
      sendNoContent(res);
      return;
    }

    if (req.method !== 'GET') {
      sendJson(res, 405, { ok: false, error: 'Method not allowed.' });
      return;
    }

    await handleHealth(req, res);
  } catch (error) {
    sendJson(res, 500, { ok: false, error: 'Unexpected server error.' });
  }
};
