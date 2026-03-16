const { ensureJson, readJson, writeJson } = require('./json-store');

async function ensureStorage() {
  await ensureJson('interest-submissions.json', []);
}

async function readSubmissions() {
  const submissions = await readJson('interest-submissions.json', []);
  return Array.isArray(submissions) ? submissions : [];
}

async function writeSubmissions(submissions) {
  await writeJson('interest-submissions.json', Array.isArray(submissions) ? submissions : []);
}

module.exports = {
  ensureStorage,
  readSubmissions,
  writeSubmissions
};
