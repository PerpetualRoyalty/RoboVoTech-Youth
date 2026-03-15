const { randomUUID } = require('crypto');

const AGE_GROUPS = new Set(['16-18', '18-24', '25-34', '35+']);
const STATUSES = ['new', 'contacted', 'qualified', 'enrolled', 'closed'];
const STATUS_SET = new Set(STATUSES);
const BACKGROUNDS = new Set([
  'student',
  'recent-grad',
  'career-change',
  'veteran',
  'unemployed',
  'other',
  ''
]);

function cleanString(value, maxLength = 250) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function normalizePhone(value) {
  const raw = cleanString(value, 40);
  return raw.replace(/[^\d+()\-.\s]/g, '');
}

function normalizeEmail(value) {
  return cleanString(value, 120).toLowerCase();
}

function normalizeDate(value) {
  const raw = cleanString(value, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : '';
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizeSubmission(input) {
  const firstName = cleanString(input.firstName, 60);
  const lastName = cleanString(input.lastName, 60);
  const email = normalizeEmail(input.email);
  const phone = normalizePhone(input.phone);
  const age = cleanString(input.age, 20);
  const background = cleanString(input.background, 40);
  const interest = cleanString(input.interest, 300);
  const website = cleanString(input.website, 120);

  return {
    firstName,
    lastName,
    email,
    phone,
    age,
    background,
    interest,
    wioa: Boolean(input.wioa),
    virtual: Boolean(input.virtual),
    website
  };
}

function validateSubmission(input) {
  const submission = normalizeSubmission(input);
  const errors = [];

  if (!submission.firstName) errors.push('First name is required.');
  if (!submission.lastName) errors.push('Last name is required.');
  if (!submission.email) errors.push('Email is required.');
  if (submission.email && !isValidEmail(submission.email)) errors.push('Email must be valid.');
  if (!submission.age) errors.push('Age group is required.');
  if (submission.age && !AGE_GROUPS.has(submission.age)) errors.push('Age group is invalid.');
  if (!BACKGROUNDS.has(submission.background)) errors.push('Current situation is invalid.');
  if (submission.website) errors.push('Spam check failed.');

  return {
    valid: errors.length === 0,
    errors,
    submission
  };
}

function findRecentDuplicate(submissions, submission, windowMs = 1000 * 60 * 60 * 24 * 14) {
  const now = Date.now();

  return submissions.find((entry) => {
    if (!entry || !entry.email) {
      return false;
    }

    const sameEmail = entry.email === submission.email;
    const samePhone = submission.phone && entry.phone && entry.phone === submission.phone;
    if (!sameEmail && !samePhone) {
      return false;
    }

    const submittedAt = Date.parse(entry.submittedAt);
    if (Number.isNaN(submittedAt)) {
      return false;
    }

    return now - submittedAt <= windowMs;
  }) || null;
}

function createSubmissionRecord(submission) {
  const now = new Date().toISOString();

  return {
    id: randomUUID(),
    status: 'new',
    archivedAt: '',
    submittedAt: now,
    updatedAt: now,
    followUpDate: '',
    notes: '',
    source: 'landing-page',
    ...submission
  };
}

function summarizeSubmissions(submissions) {
  const summary = {
    total: submissions.length,
    active: 0,
    archived: 0,
    wioaInterested: 0,
    virtualPreferred: 0,
    byAge: {},
    byStatus: {},
    byBackground: {},
    followUpDue: 0,
    newestSubmissionAt: null
  };

  for (const submission of submissions) {
    if (submission.archivedAt) {
      summary.archived += 1;
    } else {
      summary.active += 1;
    }

    if (submission.wioa) summary.wioaInterested += 1;
    if (submission.virtual) summary.virtualPreferred += 1;

    summary.byAge[submission.age] = (summary.byAge[submission.age] || 0) + 1;
    const statusKey = submission.status || 'new';
    summary.byStatus[statusKey] = (summary.byStatus[statusKey] || 0) + 1;

    const backgroundKey = submission.background || 'unspecified';
    summary.byBackground[backgroundKey] = (summary.byBackground[backgroundKey] || 0) + 1;

    if (
      submission.followUpDate &&
      submission.followUpDate <= new Date().toISOString().slice(0, 10) &&
      submission.status !== 'enrolled' &&
      submission.status !== 'closed'
    ) {
      summary.followUpDue += 1;
    }

    if (!summary.newestSubmissionAt || submission.submittedAt > summary.newestSubmissionAt) {
      summary.newestSubmissionAt = submission.submittedAt;
    }
  }

  return summary;
}

function escapeCsv(value) {
  const raw = value == null ? '' : String(value);
  if (/[",\n]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }

  return raw;
}

function submissionsToCsv(submissions) {
  const headers = [
    'id',
    'submittedAt',
    'status',
    'firstName',
    'lastName',
    'email',
    'phone',
    'age',
    'background',
    'interest',
    'wioa',
    'virtual',
    'source'
  ];

  const rows = submissions.map((submission) =>
    headers.map((header) => escapeCsv(submission[header])).join(',')
  );

  return [headers.join(','), ...rows].join('\n');
}

function validateSubmissionUpdate(input) {
  const errors = [];
  const updates = {};

  if (Object.prototype.hasOwnProperty.call(input, 'status')) {
    const status = cleanString(input.status, 40);
    if (!STATUS_SET.has(status)) {
      errors.push('Status is invalid.');
    } else {
      updates.status = status;
    }
  }

  if (Object.prototype.hasOwnProperty.call(input, 'notes')) {
    updates.notes = cleanString(input.notes, 2000);
  }

  if (Object.prototype.hasOwnProperty.call(input, 'followUpDate')) {
    const followUpDate = normalizeDate(input.followUpDate);
    if (input.followUpDate && !followUpDate) {
      errors.push('Follow-up date must use YYYY-MM-DD format.');
    } else {
      updates.followUpDate = followUpDate;
    }
  }

  if (Object.prototype.hasOwnProperty.call(input, 'archived')) {
    if (typeof input.archived !== 'boolean') {
      errors.push('Archived flag is invalid.');
    } else {
      updates.archived = input.archived;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    updates
  };
}

function applySubmissionUpdate(submission, updates) {
  const { archived, ...restUpdates } = updates;
  const archivedAt = Object.prototype.hasOwnProperty.call(updates, 'archived')
    ? (archived ? new Date().toISOString() : '')
    : submission.archivedAt || '';

  return {
    ...submission,
    ...restUpdates,
    archivedAt,
    updatedAt: new Date().toISOString()
  };
}

function filterSubmissions(submissions, options = {}) {
  const search = cleanString(options.search, 120).toLowerCase();
  const status = cleanString(options.status, 40);
  const archived = cleanString(options.archived, 20) || 'active';

  return submissions.filter((submission) => {
    const isArchived = Boolean(submission.archivedAt);
    if (archived === 'active' && isArchived) {
      return false;
    }
    if (archived === 'archived' && !isArchived) {
      return false;
    }

    if (status && status !== 'all' && submission.status !== status) {
      return false;
    }

    if (!search) {
      return true;
    }

    const haystack = [
      submission.firstName,
      submission.lastName,
      submission.email,
      submission.phone,
      submission.interest,
      submission.notes
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return haystack.includes(search);
  });
}

function removeSubmission(submissions, submissionId) {
  return submissions.filter((submission) => submission.id !== submissionId);
}

module.exports = {
  applySubmissionUpdate,
  createSubmissionRecord,
  filterSubmissions,
  findRecentDuplicate,
  removeSubmission,
  STATUSES,
  submissionsToCsv,
  summarizeSubmissions,
  validateSubmission,
  validateSubmissionUpdate
};
