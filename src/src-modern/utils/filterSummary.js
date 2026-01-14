import { ACTIVITY_FILTERS, ACTIVITY_FILTER_META } from '../constants/activityFilters';

const toTitle = (value) => {
  if (typeof value !== 'string') {
    return value;
  }

  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

export const summarizeFilters = (filters = {}) => {
  if (!filters || typeof filters !== 'object') {
    return 'No filters';
  }

  const parts = [];

  if (filters.nodeType && filters.nodeType !== 'all') {
    parts.push(`Type: ${toTitle(filters.nodeType)}`);
  }

  if (filters.networkMembers?.length > 0) {
    parts.push(`Network: ${filters.networkMembers.length} selected`);
  } else if (filters.networkMember === 'yes') {
    parts.push('Network: Members only');
  } else if (filters.networkMember === 'no') {
    parts.push('Network: Non-members');
  }

  if (filters.careStatuses?.length > 0) {
    parts.push(`Child Welfare: ${filters.careStatuses.map(toTitle).join(', ')}`);
  } else if (filters.careStatus && filters.careStatus !== 'all') {
    parts.push(`Child Welfare: ${toTitle(filters.careStatus)}`);
  }

  if (filters.fosterCareStatuses?.length > 0) {
    parts.push(`Foster Status: ${filters.fosterCareStatuses.map(toTitle).join(', ')}`);
  } else if (filters.fosterCareStatus && filters.fosterCareStatus !== 'all') {
    parts.push(`Foster Status: ${toTitle(filters.fosterCareStatus)}`);
  }

  const ageRange = filters.ageRange || filters.ageRanges?.[0];
  if (ageRange && (ageRange.min !== '' || ageRange.max !== '')) {
    const minLabel = ageRange.min !== undefined && ageRange.min !== '' ? ageRange.min : '0';
    const maxLabel = ageRange.max !== undefined && ageRange.max !== '' ? ageRange.max : '∞';
    if (minLabel !== '0' || maxLabel !== '∞') {
      parts.push(`Age: ${minLabel}-${maxLabel}`);
    }
  }

  if (filters.gender && filters.gender !== 'all') {
    parts.push(`Gender: ${toTitle(filters.gender)}`);
  }

  if (filters.showDeceased === false) {
    parts.push('Hide deceased');
  }

  if (filters.tags?.length > 0) {
    parts.push(`Tags: ${filters.tags.length}`);
  }

  if (filters.hasOpenPlacements) {
    parts.push('Open placements');
  }

  if (filters.connectionStatus && filters.connectionStatus !== 'all') {
    parts.push(`Connection: ${toTitle(filters.connectionStatus)}`);
  }

  const activityKey = filters.activity ?? ACTIVITY_FILTERS.ALL;
  if (activityKey && activityKey !== ACTIVITY_FILTERS.ALL) {
    parts.push(`Activity: ${ACTIVITY_FILTER_META[activityKey]?.label || toTitle(activityKey)}`);
  }

  return parts.length > 0 ? parts.join(' • ') : 'No filters';
};

export const compareFilterSummaries = (currentFilters = {}, nextFilters = {}) => {
  const currentSummary = summarizeFilters(currentFilters);
  const nextSummary = summarizeFilters(nextFilters);

  const toParts = (summary) => {
    if (!summary || summary === 'No filters') {
      return [];
    }
    return summary.split(' • ');
  };

  const currentParts = toParts(currentSummary);
  const nextParts = toParts(nextSummary);

  const additions = nextParts.filter((part) => !currentParts.includes(part));
  const removals = currentParts.filter((part) => !nextParts.includes(part));

  return {
    additions,
    removals,
    currentSummary,
    nextSummary
  };
};
