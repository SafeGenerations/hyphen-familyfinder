// Shared helpers for engagement and contact activity metrics
export const DAY_MS = 24 * 60 * 60 * 1000;

export const CONTACT_ENTRY_TYPES = new Set([
  'phone',
  'phone_call',
  'call',
  'email',
  'visit',
  'home_visit',
  'home visit',
  'meeting',
  'assessment',
  'sms',
  'text',
  'message',
  'contact',
  'in_person',
  'in-person',
  'outreach',
  'virtual'
]);

const dateSources = [
  'lastContactAt',
  'lastContactDate',
  'last_contact_at',
  'last_contact_date',
  'lastContactedAt'
];

const nestedDateSources = [
  ['engagement', 'lastContactAt'],
  ['engagement', 'lastContactDate'],
  ['contactSummary', 'lastContactAt'],
  ['contactSummary', 'lastContactDate']
];

const asNumber = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  const date = parseContactDate(value);
  return date ? date.getTime() : null;
};

export const parseContactDate = (value) => {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    const time = value.getTime();
    return Number.isNaN(time) ? null : value;
  }

  const direct = new Date(value);
  if (!Number.isNaN(direct.getTime())) {
    return direct;
  }

  if (typeof value === 'string') {
    const normalized = value.includes('T') ? value : `${value}T00:00:00`;
    const normalizedDate = new Date(normalized);
    if (!Number.isNaN(normalizedDate.getTime())) {
      return normalizedDate;
    }
  }

  return null;
};

export const collectContactTimestamps = (person) => {
  if (!person) {
    return [];
  }

  const timestamps = new Set();

  dateSources.forEach((key) => {
    const numeric = asNumber(person[key]);
    if (numeric) {
      timestamps.add(numeric);
    }
  });

  nestedDateSources.forEach(([scope, key]) => {
    const value = person?.[scope]?.[key];
    const numeric = asNumber(value);
    if (numeric) {
      timestamps.add(numeric);
    }
  });

  if (Array.isArray(person.caseLog)) {
    person.caseLog.forEach((entry) => {
      if (!entry) {
        return;
      }

      const type = typeof entry.type === 'string' ? entry.type.trim().toLowerCase() : '';
      if (!type || !CONTACT_ENTRY_TYPES.has(type)) {
        return;
      }

      [entry.timestamp, entry.completedAt, entry.at, entry.date].forEach((value) => {
        const numeric = asNumber(value);
        if (numeric) {
          timestamps.add(numeric);
        }
      });
    });
  }

  if (Array.isArray(person.contactEvents)) {
    person.contactEvents.forEach((event) => {
      if (!event) {
        return;
      }

      const numeric = asNumber(event.at || event.timestamp || event.date);
      if (numeric) {
        timestamps.add(numeric);
      }
    });
  }

  return Array.from(timestamps).sort((a, b) => a - b);
};

export const getLatestContactTimestamp = (person) => {
  const timestamps = collectContactTimestamps(person);
  if (timestamps.length === 0) {
    return null;
  }
  return timestamps[timestamps.length - 1];
};

export const getDaysSinceLastContact = (person, now = Date.now()) => {
  const latestTimestamp = getLatestContactTimestamp(person);
  if (!latestTimestamp) {
    return null;
  }

  if (latestTimestamp > now) {
    return 0;
  }

  const diffMs = now - latestTimestamp;
  return Math.floor(diffMs / DAY_MS);
};

export const countContactsWithinWindow = (timestamps, days, now = Date.now()) => {
  if (!Array.isArray(timestamps) || timestamps.length === 0 || !Number.isFinite(days)) {
    return 0;
  }

  const windowMs = days * DAY_MS;
  return timestamps.filter((ts) => now - ts <= windowMs && ts <= now).length;
};
