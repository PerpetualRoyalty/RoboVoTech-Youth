const {
  handleUpdateSubmission,
  sendJson,
  sendNoContent
} = require('../../lib/interest-api');

module.exports = async (req, res) => {
  try {
    if (req.method === 'OPTIONS') {
      sendNoContent(res);
      return;
    }

    if (req.method !== 'PATCH') {
      sendJson(res, 405, { ok: false, error: 'Method not allowed.' });
      return;
    }

    const submissionId = req.query && req.query.id;
    await handleUpdateSubmission(req, res, Array.isArray(submissionId) ? submissionId[0] : submissionId);
  } catch (error) {
    sendJson(res, 500, { ok: false, error: 'Unexpected server error.' });
  }
};
