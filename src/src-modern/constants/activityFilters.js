export const ACTIVITY_FILTERS = Object.freeze({
  ALL: 'all',
  ACTIVE_30: 'active_30',
  ACTIVE_60: 'active_60',
  ACTIVE_90: 'active_90',
  INACTIVE_90: 'inactive_90'
});

export const ACTIVITY_FILTER_ORDER = [
  ACTIVITY_FILTERS.ALL,
  ACTIVITY_FILTERS.ACTIVE_30,
  ACTIVITY_FILTERS.ACTIVE_60,
  ACTIVITY_FILTERS.ACTIVE_90,
  ACTIVITY_FILTERS.INACTIVE_90
];

export const ACTIVITY_FILTER_META = {
  [ACTIVITY_FILTERS.ALL]: {
    key: ACTIVITY_FILTERS.ALL,
    label: 'All Network Members',
    description: 'Show every network member regardless of contact recency.',
    color: '#6b7280'
  },
  [ACTIVITY_FILTERS.ACTIVE_30]: {
    key: ACTIVITY_FILTERS.ACTIVE_30,
    label: 'Active (last 30 days)',
    description: 'Last documented contact within the past 30 days.',
    color: '#22c55e'
  },
  [ACTIVITY_FILTERS.ACTIVE_60]: {
    key: ACTIVITY_FILTERS.ACTIVE_60,
    label: 'Moderate (30-60 days)',
    description: 'Last documented contact between 30 and 60 days ago.',
    color: '#f59e0b'
  },
  [ACTIVITY_FILTERS.ACTIVE_90]: {
    key: ACTIVITY_FILTERS.ACTIVE_90,
    label: 'Low Activity (60-90 days)',
    description: 'Last documented contact between 60 and 90 days ago.',
    color: '#f97316'
  },
  [ACTIVITY_FILTERS.INACTIVE_90]: {
    key: ACTIVITY_FILTERS.INACTIVE_90,
    label: 'Inactive (90+ days)',
    description: 'No documented contact in the past 90 days.',
    color: '#dc2626'
  }
};

export const getActivityFilterLabel = (key) => ACTIVITY_FILTER_META[key]?.label || 'Activity filter';
