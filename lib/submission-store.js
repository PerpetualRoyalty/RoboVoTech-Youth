const fs = require('fs').promises;
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const SUBMISSIONS_FILE = path.join(DATA_DIR, 'interest-submissions.json');
const SUBMISSIONS_BLOB_PATH = 'interest-submissions.json';

function useBlobStorage() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

async function ensureStorage() {
  if (useBlobStorage()) {
    return;
  }

  await fs.mkdir(DATA_DIR, { recursive: true });

  try {
    await fs.access(SUBMISSIONS_FILE);
  } catch {
    await fs.writeFile(SUBMISSIONS_FILE, '[]\n', 'utf8');
  }
}

async function readBlobSubmissions() {
  try {
    const { get } = require('@vercel/blob');
    const blob = await get(SUBMISSIONS_BLOB_PATH, {
      access: 'private',
      token: process.env.BLOB_READ_WRITE_TOKEN
    });

    if (!blob || !blob.stream) {
      return [];
    }

    const text = typeof Response === 'function'
      ? await new Response(blob.stream).text()
      : '';

    if (!text) {
      return [];
    }

    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error && (error.name === 'BlobNotFoundError' || error.code === 'not_found')) {
      return [];
    }

    throw error;
  }
}

async function writeBlobSubmissions(submissions) {
  const { put } = require('@vercel/blob');

  await put(
    SUBMISSIONS_BLOB_PATH,
    `${JSON.stringify(submissions, null, 2)}\n`,
    {
      access: 'private',
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: 0,
      contentType: 'application/json; charset=utf-8',
      token: process.env.BLOB_READ_WRITE_TOKEN
    }
  );
}

async function readSubmissions() {
  if (useBlobStorage()) {
    return readBlobSubmissions();
  }

  await ensureStorage();
  const contents = await fs.readFile(SUBMISSIONS_FILE, 'utf8');

  try {
    const parsed = JSON.parse(contents);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeSubmissions(submissions) {
  if (useBlobStorage()) {
    await writeBlobSubmissions(submissions);
    return;
  }

  await ensureStorage();
  const payload = `${JSON.stringify(submissions, null, 2)}\n`;
  await fs.writeFile(SUBMISSIONS_FILE, payload, 'utf8');
}

module.exports = {
  ensureStorage,
  readSubmissions,
  writeSubmissions
};
