const { ensureJson, readJson, writeJson } = require('./json-store');

const USERS_FILE = 'users.json';
const CERTIFICATION_ORDERS_FILE = 'certification-orders.json';

async function ensureAppStorage() {
  await Promise.all([
    ensureJson(USERS_FILE, []),
    ensureJson(CERTIFICATION_ORDERS_FILE, [])
  ]);
}

async function readUsers() {
  const users = await readJson(USERS_FILE, []);
  return Array.isArray(users) ? users : [];
}

async function writeUsers(users) {
  await writeJson(USERS_FILE, Array.isArray(users) ? users : []);
}

async function readCertificationOrders() {
  const orders = await readJson(CERTIFICATION_ORDERS_FILE, []);
  return Array.isArray(orders) ? orders : [];
}

async function writeCertificationOrders(orders) {
  await writeJson(CERTIFICATION_ORDERS_FILE, Array.isArray(orders) ? orders : []);
}

module.exports = {
  ensureAppStorage,
  readCertificationOrders,
  readUsers,
  writeCertificationOrders,
  writeUsers
};
