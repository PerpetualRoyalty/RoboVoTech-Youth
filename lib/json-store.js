const fs = require('fs').promises;
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

function useBlobStorage() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

async function ensureLocalFile(filename, initialValue) {
  await fs.mkdir(DATA_DIR, { recursive: true });

  const filePath = path.join(DATA_DIR, filename);

  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, `${JSON.stringify(initialValue, null, 2)}\n`, 'utf8');
  }

  return filePath;
}

async function readBlobJson(filename, fallbackValue) {
  try {
    const { get } = require('@vercel/blob');
    const blob = await get(filename, {
      access: 'private',
      token: process.env.BLOB_READ_WRITE_TOKEN
    });

    if (!blob || !blob.stream || typeof Response !== 'function') {
      return fallbackValue;
    }

    const text = await new Response(blob.stream).text();
    if (!text) {
      return fallbackValue;
    }

    return JSON.parse(text);
  } catch (error) {
    if (error && (error.name === 'BlobNotFoundError' || error.code === 'not_found')) {
      return fallbackValue;
    }

    throw error;
  }
}

async function writeBlobJson(filename, value) {
  const { put } = require('@vercel/blob');

  await put(filename, `${JSON.stringify(value, null, 2)}\n`, {
    access: 'private',
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 0,
    contentType: 'application/json; charset=utf-8',
    token: process.env.BLOB_READ_WRITE_TOKEN
  });
}

async function readJson(filename, fallbackValue) {
  if (useBlobStorage()) {
    return readBlobJson(filename, fallbackValue);
  }

  const filePath = await ensureLocalFile(filename, fallbackValue);
  const raw = await fs.readFile(filePath, 'utf8');

  try {
    return JSON.parse(raw);
  } catch {
    return fallbackValue;
  }
}

async function writeJson(filename, value) {
  if (useBlobStorage()) {
    await writeBlobJson(filename, value);
    return;
  }

  const filePath = await ensureLocalFile(filename, value);
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function ensureJson(filename, initialValue) {
  if (useBlobStorage()) {
    await readBlobJson(filename, initialValue);
    return;
  }

  await ensureLocalFile(filename, initialValue);
}

module.exports = {
  ensureJson,
  readJson,
  writeJson
};
