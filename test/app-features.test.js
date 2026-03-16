const assert = require('assert').strict;

const {
  hashPassword,
  validateLogin,
  validateRegistration,
  verifyPassword
} = require('../lib/auth');
const { buildCertificationProducts, loadCurriculum } = require('../lib/curriculum');

function runTest(name, fn) {
  Promise.resolve()
    .then(fn)
    .then(() => {
      console.log(`PASS ${name}`);
    })
    .catch((error) => {
      console.error(`FAIL ${name}`);
      console.error(error);
      process.exitCode = 1;
    });
}

runTest('validateRegistration accepts valid learner input', () => {
  const result = validateRegistration({
    firstName: 'Ava',
    lastName: 'Jordan',
    email: 'Ava@example.com',
    password: 'supersecure'
  });

  assert.equal(result.valid, true);
  assert.equal(result.user.email, 'ava@example.com');
});

runTest('validateLogin rejects invalid email input', () => {
  const result = validateLogin({
    email: 'not-an-email',
    password: 'secret123'
  });

  assert.equal(result.valid, false);
  assert.ok(result.errors.includes('Email must be valid.'));
});

runTest('hashPassword and verifyPassword round-trip correctly', () => {
  const credentials = hashPassword('certification-ready');

  assert.equal(verifyPassword('certification-ready', credentials.passwordSalt, credentials.passwordHash), true);
  assert.equal(verifyPassword('wrong-password', credentials.passwordSalt, credentials.passwordHash), false);
});

runTest('loadCurriculum returns the integrated track structure', async () => {
  const curriculum = await loadCurriculum();

  assert.equal(curriculum.coreCertification.modules.length >= 7, true);
  assert.equal(curriculum.microCredentials.length >= 5, true);
  assert.equal(curriculum.advancedPathways.length >= 2, true);
});

runTest('buildCertificationProducts creates paid testing options', async () => {
  const curriculum = await loadCurriculum();
  const products = buildCertificationProducts(curriculum);

  assert.ok(products.some((product) => product.id === 'core-certification-exam'));
  assert.ok(products.some((product) => product.category === 'micro'));
  assert.ok(products.every((product) => product.feeCents > 0));
});
