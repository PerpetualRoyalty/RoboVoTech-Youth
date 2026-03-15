const assert = require('assert').strict;

const {
  applySubmissionUpdate,
  createSubmissionRecord,
  filterSubmissions,
  findRecentDuplicate,
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
      submittedAt: '2026-03-10T00:00:00.000Z',
      status: 'new',
      followUpDate: '2026-03-09',
      wioa: true,
      virtual: false
    },
    {
      age: '18-24',
      background: '',
      submittedAt: '2026-03-11T00:00:00.000Z',
      status: 'qualified',
      wioa: false,
      virtual: true
    }
  ]);

  assert.equal(summary.total, 2);
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

runTest('filterSubmissions searches name, email, and notes', () => {
  const filtered = filterSubmissions([
    {
      id: '1',
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
