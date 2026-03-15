const assert = require('assert').strict;

const {
  applySubmissionUpdate,
  createSubmissionRecord,
  filterSubmissions,
  findRecentDuplicate,
  removeSubmission,
  submissionsToCsv,
  summarizeSubmissions,
  validateSubmission,
  validateSubmissionUpdate
} = require('../lib/interest-submissions');

function runTest(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    console.error(error);
    process.exitCode = 1;
  }
}

runTest('validateSubmission accepts a valid lead', () => {
  const result = validateSubmission({
    firstName: 'Jordan',
    lastName: 'Rivera',
    email: 'Jordan@example.com',
    phone: '(850) 555-1234',
    age: '18-24',
    background: 'student',
    interest: 'Programming autonomous systems',
    wioa: true,
    virtual: false
  });

  assert.equal(result.valid, true);
  assert.equal(result.submission.email, 'jordan@example.com');
  assert.equal(result.submission.phone, '(850) 555-1234');
});

runTest('validateSubmission rejects missing or invalid fields', () => {
  const result = validateSubmission({
    firstName: '',
    lastName: 'Rivera',
    email: 'not-an-email',
    age: '12-15',
    background: 'unknown'
  });

  assert.equal(result.valid, false);
  assert.deepEqual(result.errors, [
    'First name is required.',
    'Email must be valid.',
    'Age group is invalid.',
    'Current situation is invalid.'
  ]);
});

runTest('findRecentDuplicate matches recent submissions by email', () => {
  const duplicate = findRecentDuplicate(
    [
      {
        email: 'jordan@example.com',
        phone: '(850) 555-1234',
        submittedAt: new Date().toISOString()
      }
    ],
    {
      email: 'jordan@example.com',
      phone: '',
      submittedAt: new Date().toISOString()
    }
  );

  assert.ok(duplicate);
});

runTest('summarizeSubmissions aggregates lead preferences', () => {
  const summary = summarizeSubmissions([
    {
      age: '18-24',
      background: 'student',
      archivedAt: '',
      submittedAt: '2026-03-10T00:00:00.000Z',
      status: 'new',
      followUpDate: '2026-03-09',
      wioa: true,
      virtual: false
    },
    {
      age: '18-24',
      archivedAt: '2026-03-12T00:00:00.000Z',
      background: '',
      submittedAt: '2026-03-11T00:00:00.000Z',
      status: 'qualified',
      wioa: false,
      virtual: true
    }
  ]);

  assert.equal(summary.total, 2);
  assert.equal(summary.active, 1);
  assert.equal(summary.archived, 1);
  assert.equal(summary.wioaInterested, 1);
  assert.equal(summary.virtualPreferred, 1);
  assert.equal(summary.byAge['18-24'], 2);
  assert.equal(summary.byBackground.unspecified, 1);
  assert.equal(summary.byStatus.new, 1);
  assert.equal(summary.byStatus.qualified, 1);
  assert.equal(summary.followUpDue, 1);
  assert.equal(summary.newestSubmissionAt, '2026-03-11T00:00:00.000Z');
});

runTest('validateSubmissionUpdate accepts valid admin updates', () => {
  const result = validateSubmissionUpdate({
    status: 'contacted',
    notes: 'Called and left voicemail.',
    followUpDate: '2026-03-20'
  });

  assert.equal(result.valid, true);
  assert.deepEqual(result.updates, {
    status: 'contacted',
    notes: 'Called and left voicemail.',
    followUpDate: '2026-03-20'
  });
});

runTest('validateSubmissionUpdate accepts archive toggles', () => {
  const result = validateSubmissionUpdate({
    archived: true
  });

  assert.equal(result.valid, true);
  assert.deepEqual(result.updates, {
    archived: true
  });
});

runTest('validateSubmissionUpdate rejects invalid admin updates', () => {
  const result = validateSubmissionUpdate({
    status: 'pending',
    followUpDate: '03/20/2026'
  });

  assert.equal(result.valid, false);
  assert.deepEqual(result.errors, [
    'Status is invalid.',
    'Follow-up date must use YYYY-MM-DD format.'
  ]);
});

runTest('applySubmissionUpdate merges updates and timestamps the record', () => {
  const before = {
    id: 'abc',
    archivedAt: '',
    status: 'new',
    notes: '',
    followUpDate: '',
    updatedAt: '2026-03-01T00:00:00.000Z'
  };

  const after = applySubmissionUpdate(before, {
    status: 'qualified',
    notes: 'Booked an info session.',
    followUpDate: '2026-03-18'
  });

  assert.equal(after.status, 'qualified');
  assert.equal(after.notes, 'Booked an info session.');
  assert.equal(after.followUpDate, '2026-03-18');
  assert.notEqual(after.updatedAt, before.updatedAt);
});

runTest('applySubmissionUpdate archives and restores records', () => {
  const archived = applySubmissionUpdate({
    id: 'abc',
    archivedAt: '',
    updatedAt: '2026-03-01T00:00:00.000Z'
  }, {
    archived: true
  });

  assert.ok(archived.archivedAt);

  const restored = applySubmissionUpdate(archived, {
    archived: false
  });

  assert.equal(restored.archivedAt, '');
});

runTest('filterSubmissions searches name, email, and notes', () => {
  const filtered = filterSubmissions([
    {
      id: '1',
      archivedAt: '',
      firstName: 'Jordan',
      lastName: 'Rivera',
      email: 'jordan@example.com',
      phone: '',
      interest: 'Automation',
      notes: 'Scholarship question',
      status: 'new'
    },
    {
      id: '2',
      archivedAt: '',
      firstName: 'Taylor',
      lastName: 'Nguyen',
      email: 'taylor@example.com',
      phone: '',
      interest: 'Robotics',
      notes: '',
      status: 'closed'
    }
  ], {
    status: 'new',
    search: 'scholarship'
  });

  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].id, '1');
});

runTest('filterSubmissions defaults to active leads only', () => {
  const filtered = filterSubmissions([
    { id: '1', archivedAt: '', status: 'new' },
    { id: '2', archivedAt: '2026-03-12T00:00:00.000Z', status: 'closed' }
  ], {});

  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].id, '1');
});

runTest('filterSubmissions can return archived leads', () => {
  const filtered = filterSubmissions([
    { id: '1', archivedAt: '', status: 'new' },
    { id: '2', archivedAt: '2026-03-12T00:00:00.000Z', status: 'closed' }
  ], { archived: 'archived' });

  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].id, '2');
});

runTest('removeSubmission deletes one lead by id', () => {
  const remaining = removeSubmission([
    { id: '1' },
    { id: '2' }
  ], '1');

  assert.deepEqual(remaining, [{ id: '2' }]);
});

runTest('submissionsToCsv includes expected columns', () => {
  const record = createSubmissionRecord({
    firstName: 'Jordan',
    lastName: 'Rivera',
    email: 'jordan@example.com',
    phone: '',
    age: '18-24',
    background: 'student',
    interest: 'Robotics',
    wioa: true,
    virtual: false,
    website: ''
  });

  const csv = submissionsToCsv([record]);

  assert.match(csv, /^id,submittedAt,status,firstName,lastName,email,phone,age,background,interest,wioa,virtual,source/m);
  assert.match(csv, /jordan@example\.com/);
});
