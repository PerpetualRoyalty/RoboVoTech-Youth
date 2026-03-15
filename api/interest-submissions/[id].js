const {
  handleDeleteSubmission,
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

    const submissionId = req.query && req.query.id;
    const normalizedId = Array.isArray(submissionId) ? submissionId[0] : submissionId;

    if (req.method === 'PATCH') {
      await handleUpdateSubmission(req, res, normalizedId);
      return;
    }

    if (req.method === 'DELETE') {
      await handleDeleteSubmission(req, res, normalizedId);
      return;
    }

    sendJson(res, 405, { ok: false, error: 'Method not allowed.' });
  } catch (error) {
    sendJson(res, 500, { ok: false, error: 'Unexpected server error.' });
  }
};
