import { CareStatus, PlacementStatus } from '../constants/connectionStatus';
import { NodeType } from '../constants/nodeTypes';
import {
  DAY_MS,
  collectContactTimestamps,
  countContactsWithinWindow,
  getDaysSinceLastContact
} from './activityMetrics';

const CONFLICT_RELATIONSHIP_TYPES = new Set([
  'conflict',
  'discord',
  'hostile',
  'distant-hostile',
  'close-hostile',
  'violence',
  'physical-abuse',
  'emotional-abuse',
  'sexual-abuse',
  'abuse',
  'neglect',
  'neglect-abuse'
]);

const DEFAULT_CHILD_MAX_AGE = 21;
const WEEKS_TO_TRACK = 13;
const ACTIVE_PLACEMENT_STATUSES = new Set([
  PlacementStatus.CURRENT_PERMANENT,
  PlacementStatus.CURRENT_TEMPORARY
]);
const POTENTIAL_PLACEMENT_STATUSES = new Set([
  PlacementStatus.POTENTIAL_PERMANENT,
  PlacementStatus.POTENTIAL_TEMPORARY
]);
const FLAG_SEVERITY_WEIGHT = {
  high: 3,
  medium: 2,
  low: 1
};

const ensureNumber = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const toStartOfWeek = (timestamp) => {
  const date = new Date(timestamp);
  const day = date.getDay();
  const diff = date.getDate() - day; // Start the week on Sunday
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
};

const formatWeekLabel = (timestamp) => {
  const date = new Date(timestamp);
  const month = date.toLocaleString('en-US', { month: 'short' });
  const day = date.getDate();
  return `${month} ${day}`;
};

const getDiscoveryDate = (entity) => {
  const value = entity?.discoveryMetadata?.discoveryDate || entity?.discoveryDate || entity?.createdAt;
  if (!value) {
    return null;
  }
  const asDate = new Date(value);
  const time = asDate.getTime();
  return Number.isNaN(time) ? null : time;
};

const isConflictRelationship = (relationship) => {
  if (!relationship) {
    return false;
  }
  return CONFLICT_RELATIONSHIP_TYPES.has(relationship.type);
};

const getRelationshipsInvolvingChild = (state, childId) => {
  if (!state?.relationships) {
    return [];
  }
  return state.relationships.filter((rel) => rel.from === childId || rel.to === childId || (rel.type === 'child' && rel.to === childId));
};

const getConnectedPersonIds = (state, childId) => {
  const ids = new Set();

  state.relationships.forEach((rel) => {
    if (rel.type === 'child' && rel.to === childId) {
      const parentRel = state.relationships.find((parent) => parent.id === rel.from);
      if (parentRel) {
        ids.add(parentRel.from);
        ids.add(parentRel.to);
      }
      return;
    }

    if (rel.from === childId) {
      ids.add(rel.to);
    }
    if (rel.to === childId) {
      ids.add(rel.from);
    }
  });

  state.placements.forEach((placement) => {
    if (placement?.childId === childId && placement.caregiverId) {
      ids.add(placement.caregiverId);
    }
  });

  ids.delete(childId);
  return ids;
};

const resolvePeopleByIds = (state, ids) => {
  if (!state?.people || !ids) {
    return [];
  }
  const lookup = new Map(state.people.map((person) => [person.id, person]));
  const people = [];
  ids.forEach((id) => {
    const person = lookup.get(id);
    if (person) {
      people.push(person);
    }
  });
  return people;
};

const deriveRole = (person) => {
  if (!person) {
    return 'Unassigned';
  }
  if (person.role && typeof person.role === 'string' && person.role.trim().length > 0) {
    return person.role.trim();
  }
  const nestedRole = person?.typeData?.role;
  if (nestedRole && typeof nestedRole === 'string' && nestedRole.trim().length > 0) {
    return nestedRole.trim();
  }
  return 'Unassigned';
};

const buildRoleDistribution = (members, total) => {
  const map = new Map();
  members.forEach(({ member }) => {
    const role = deriveRole(member);
    map.set(role, (map.get(role) || 0) + 1);
  });

  return Array.from(map.entries())
    .map(([role, count]) => ({
      key: role,
      label: role,
      count,
      percentage: total ? Math.round((count / total) * 100) : 0
    }))
    .sort((a, b) => b.count - a.count);
};

const computeNetworkHealthScore = (state, childId, memberStats) => {
  const activeMembersCount = memberStats.filter((stat) => stat.isActive).length;
  const uniqueRoles = new Set(memberStats.map((stat) => deriveRole(stat.member)));

  const relationships = getRelationshipsInvolvingChild(state, childId);
  const conflictCount = relationships.reduce((count, rel) => {
    if (rel.type === 'child') {
      const parentRel = state.relationships.find((candidate) => candidate.id === rel.from);
      return count + (isConflictRelationship(parentRel) ? 1 : 0);
    }
    return count + (isConflictRelationship(rel) ? 1 : 0);
  }, 0);

  let score = 0;
  score += Math.min(activeMembersCount, 10);
  score += Math.min(uniqueRoles.size, 5);
  score -= Math.min(conflictCount, 3);

  const normalized = Math.max(0, Math.min(100, (score / 12) * 100));
  return Math.round(normalized);
};

const describeNetworkHealth = (score) => {
  if (score >= 80) {
    return 'Strong, active network';
  }
  if (score >= 60) {
    return 'Healthy network engagement';
  }
  if (score >= 40) {
    return 'Developing connections';
  }
  if (score > 0) {
    return 'Network needs attention';
  }
  return 'No active network';
};

const generateFlags = (state, child, memberStats, metrics, now) => {
  const flags = [];
  const { totalMembers, activeMembersCount } = metrics;
  const inactiveCount = memberStats.filter((stat) => !stat.isActive).length;

  if (totalMembers === 0) {
    flags.push({
      id: 'no-members',
      severity: 'high',
      message: 'No network members identified',
      description: 'Add family or support connections to begin tracking engagement.'
    });
    return flags;
  }

  if (activeMembersCount === 0) {
    flags.push({
      id: 'no-recent-contact',
      severity: 'high',
      message: 'No recent contact activity',
      description: 'Reconnect with the child\'s supports. No contacts logged within the past 30 days.'
    });
  }

  if (inactiveCount > 0) {
    flags.push({
      id: 'inactive-members',
      severity: inactiveCount >= totalMembers / 2 ? 'medium' : 'low',
      message: `${inactiveCount} inactive network member${inactiveCount === 1 ? '' : 's'}`,
      description: 'Schedule outreach to re-engage network members who have been inactive for 90+ days.'
    });
  }

  if (metrics.roleDistribution.length <= 2 && totalMembers >= 5) {
    flags.push({
      id: 'low-diversity',
      severity: 'low',
      message: 'Limited role diversity',
      description: 'Add varied roles (kin, mentors, community supports) to strengthen the child\'s network.'
    });
  }

  const childCareStatus = child?.careStatus;
  const potentialPlacements = state.placements.filter((placement) =>
    placement.childId === child?.id &&
    (placement.placementStatus === PlacementStatus.POTENTIAL_PERMANENT ||
      placement.placementStatus === PlacementStatus.POTENTIAL_TEMPORARY)
  );

  if ((childCareStatus === CareStatus.IN_CARE || childCareStatus === CareStatus.NEEDS_PLACEMENT) && potentialPlacements.length === 0) {
    flags.push({
      id: 'no-placement-options',
      severity: 'high',
      message: 'No placement options identified',
      description: 'Identify caregivers or family resources to meet placement requirements.'
    });
  }

  const stalePlacements = potentialPlacements.filter((placement) => {
    const discoveryDate = getDiscoveryDate(placement);
    if (!discoveryDate) {
      return false;
    }
    return now - discoveryDate > 14 * DAY_MS;
  });

  if (stalePlacements.length > 0) {
    flags.push({
      id: 'stale-placements',
      severity: 'medium',
      message: 'Follow up on placement leads',
      description: 'Placement options identified more than two weeks ago need follow-up activity.'
    });
  }

  return flags;
};

const buildActivityByWeek = (memberStats, now) => {
  const results = [];
  const maxWeeks = WEEKS_TO_TRACK;
  const startWeek = toStartOfWeek(now - (maxWeeks - 1) * 7 * DAY_MS);

  for (let i = 0; i < maxWeeks; i += 1) {
    const weekStart = startWeek + i * 7 * DAY_MS;
    const weekEnd = weekStart + 7 * DAY_MS;

    const count = memberStats.reduce((total, stat) => {
      return total + stat.timestamps.filter((ts) => ts >= weekStart && ts < weekEnd).length;
    }, 0);

    results.push({
      key: `${weekStart}-${weekEnd}`,
      label: formatWeekLabel(weekStart),
      count,
      weekStart,
      weekEnd
    });
  }

  return results;
};

const calculateMemberStats = (members, now) => {
  return members.map((member) => {
    const timestamps = collectContactTimestamps(member);
    const lastTimestamp = timestamps.length > 0 ? timestamps[timestamps.length - 1] : null;
    const daysSince = lastTimestamp ? Math.floor((now - lastTimestamp) / DAY_MS) : null;
    const firstTimestamp = timestamps.length > 0 ? timestamps[0] : null;
    const discoveryTimestamp = getDiscoveryDate(member);

    const baseline = discoveryTimestamp && firstTimestamp
      ? Math.max(Math.min(firstTimestamp, discoveryTimestamp), 0)
      : discoveryTimestamp || firstTimestamp;

    const daysToFirstContact = baseline && firstTimestamp
      ? Math.max(0, Math.floor((firstTimestamp - baseline) / DAY_MS))
      : null;

    return {
      member,
      timestamps,
      lastTimestamp,
      firstTimestamp,
      daysSince,
      daysToFirstContact,
      isActive: typeof daysSince === 'number' && daysSince <= 30
    };
  });
};

export const calculateChildAnalytics = (state, childId, nowOverride) => {
  if (!state || !childId) {
    return null;
  }

  const child = state.people.find((person) => person.id === childId);
  if (!child) {
    return null;
  }

  const now = nowOverride || Date.now();

  const connectedIds = getConnectedPersonIds(state, childId);
  let members = resolvePeopleByIds(state, connectedIds).filter((person) => person.type === NodeType.PERSON);

  const networkMembers = members.filter((person) => person.networkMember);
  if (networkMembers.length > 0) {
    members = networkMembers;
  }

  if (members.length === 0) {
    members = state.people.filter((person) => person.networkMember && person.id !== childId);
  }

  const memberStats = calculateMemberStats(members, now);
  const totalMembers = memberStats.length;
  const activeMembersCount = memberStats.filter((stat) => stat.isActive).length;
  const contactsLast30 = memberStats.reduce((total, stat) => total + countContactsWithinWindow(stat.timestamps, 30, now), 0);

  const daysToFirst = memberStats
    .map((stat) => stat.daysToFirstContact)
    .filter((value) => typeof value === 'number');

  const avgDaysToFirstContact = daysToFirst.length > 0
    ? Math.round(daysToFirst.reduce((sum, value) => sum + value, 0) / daysToFirst.length)
    : null;

  const roleDistribution = buildRoleDistribution(memberStats, totalMembers);
  const networkHealthScore = computeNetworkHealthScore(state, childId, memberStats);
  const contactActivityByWeek = buildActivityByWeek(memberStats, now);
  const flags = generateFlags(state, child, memberStats, {
    totalMembers,
    activeMembersCount,
    roleDistribution
  }, now);

  const childDaysSinceContact = getDaysSinceLastContact(child, now);

  return {
    child,
    totalMembers,
    activeMembersCount,
    inactiveMembersCount: totalMembers - activeMembersCount,
    activePercentage: totalMembers ? Math.round((activeMembersCount / totalMembers) * 100) : 0,
    totalContactsLast30Days: contactsLast30,
    avgDaysToFirstContact,
    roleDistribution,
    contactActivityByWeek,
    networkHealthScore,
    networkHealthDescription: describeNetworkHealth(networkHealthScore),
    flags,
    memberStats,
    childDaysSinceContact,
    generatedAt: now
  };
};

export const calculateCaseloadAnalytics = (state, nowOverride) => {
  if (!state) {
    return null;
  }

  const children = findChildCandidates(state.people);
  if (children.length === 0) {
    return {
      totalChildren: 0,
      withRecentContact: 0,
      withoutRecentContact: 0,
      averageNetworkHealth: 0,
      averageContactsLast30: 0,
      needsPlacementCount: 0,
      withPlacementOptions: 0,
      withoutPlacementOptions: 0,
      priorityChildren: [],
      flagDetails: [],
      childSummaries: [],
      generatedAt: nowOverride || Date.now()
    };
  }

  const now = nowOverride || Date.now();
  const childSummaries = [];
  const flagDetails = [];

  children.forEach((child) => {
    const analytics = calculateChildAnalytics(state, child.id, now);
    if (!analytics) {
      return;
    }

    const placements = Array.isArray(state.placements)
      ? state.placements.filter((placement) => placement.childId === child.id)
      : [];

    const potentialPlacements = placements.filter((placement) =>
      POTENTIAL_PLACEMENT_STATUSES.has(placement.placementStatus)
    );

    const activePlacement = placements.find((placement) =>
      ACTIVE_PLACEMENT_STATUSES.has(placement.placementStatus)
    );

    const summary = {
      id: child.id,
      name: child.name || 'Unnamed Child',
      careStatus: child.careStatus,
      caseGoal: child.caseData?.caseGoal || null,
      networkHealthScore: analytics.networkHealthScore,
      networkHealthDescription: analytics.networkHealthDescription,
      childDaysSinceContact: analytics.childDaysSinceContact,
      totalMembers: analytics.totalMembers,
      activeMembers: analytics.activeMembersCount,
      totalContactsLast30: analytics.totalContactsLast30Days,
      avgDaysToFirstContact: analytics.avgDaysToFirstContact,
      flags: analytics.flags,
      placements,
      potentialPlacements,
      activePlacement,
      hasAnyPlacementOption: potentialPlacements.length > 0 || Boolean(activePlacement),
      hasPermanentPlacement: placements.some((placement) => placement.placementStatus === PlacementStatus.CURRENT_PERMANENT),
      needsPlacement:
        child.careStatus === CareStatus.NEEDS_PLACEMENT || child.careStatus === CareStatus.IN_CARE
    };

    analytics.flags.forEach((flag) => {
      flagDetails.push({
        ...flag,
        childId: child.id,
        childName: summary.name
      });
    });

    childSummaries.push(summary);
  });

  const totalChildren = childSummaries.length;
  const withRecentContact = childSummaries.filter((summary) =>
    typeof summary.childDaysSinceContact === 'number' && summary.childDaysSinceContact <= 30
  ).length;

  const withoutRecentContact = childSummaries.filter((summary) =>
    summary.childDaysSinceContact === null || summary.childDaysSinceContact > 30
  ).length;

  const needsPlacementCount = childSummaries.filter((summary) => summary.needsPlacement).length;
  const withPlacementOptions = childSummaries.filter((summary) => summary.hasAnyPlacementOption).length;
  const withoutPlacementOptions = childSummaries.filter((summary) => summary.needsPlacement && !summary.hasAnyPlacementOption).length;

  const averageNetworkHealth = totalChildren
    ? Math.round(childSummaries.reduce((sum, summary) => sum + summary.networkHealthScore, 0) / totalChildren)
    : 0;

  const averageContactsLast30 = totalChildren
    ? Math.round(childSummaries.reduce((sum, summary) => sum + summary.totalContactsLast30, 0) / totalChildren)
    : 0;

  const priorityChildren = childSummaries
    .map((summary) => {
      const highSeverity = summary.flags.some((flag) => flag.severity === 'high');
      const mediumSeverity = summary.flags.some((flag) => flag.severity === 'medium');

      let score = 0;
      if (highSeverity) {
        score += 6;
      }
      if (mediumSeverity) {
        score += 3;
      }
      if (summary.childDaysSinceContact === null || summary.childDaysSinceContact > 45) {
        score += 2;
      }
      if (summary.needsPlacement && !summary.hasAnyPlacementOption) {
        score += 5;
      }
      if (summary.networkHealthScore < 50) {
        score += 1;
      }

      return {
        ...summary,
        priorityScore: score
      };
    })
    .filter((summary) => summary.priorityScore > 0)
    .sort((a, b) => b.priorityScore - a.priorityScore)
    .slice(0, 6);

  const flagSummaryMap = new Map();
  flagDetails.forEach((flag) => {
    const existing = flagSummaryMap.get(flag.id);
    if (existing) {
      existing.count += 1;
      existing.severityScore += FLAG_SEVERITY_WEIGHT[flag.severity] || 0;
    } else {
      flagSummaryMap.set(flag.id, {
        id: flag.id,
        message: flag.message,
        severity: flag.severity,
        description: flag.description,
        count: 1,
        severityScore: FLAG_SEVERITY_WEIGHT[flag.severity] || 0
      });
    }
  });

  const aggregatedFlagSummary = Array.from(flagSummaryMap.values()).sort((a, b) => {
    if (b.severityScore === a.severityScore) {
      return b.count - a.count;
    }
    return b.severityScore - a.severityScore;
  });

  return {
    totalChildren,
    withRecentContact,
    withoutRecentContact,
    averageNetworkHealth,
    averageContactsLast30,
    needsPlacementCount,
    withPlacementOptions,
    withoutPlacementOptions,
    priorityChildren,
    flagDetails,
    aggregatedFlagSummary,
    childSummaries,
    generatedAt: now
  };
};

const looksLikeChild = (person) => {
  if (!person || person.type !== NodeType.PERSON) {
    return false;
  }

  if (person.careStatus && person.careStatus !== CareStatus.NOT_APPLICABLE) {
    return true;
  }

  if (person.role && /child|youth|teen/i.test(person.role)) {
    return true;
  }

  const age = ensureNumber(person.age);
  if (age !== null && age <= DEFAULT_CHILD_MAX_AGE) {
    return true;
  }

  if (person.birthDate) {
    const birth = new Date(person.birthDate);
    const time = birth.getTime();
    if (!Number.isNaN(time)) {
      const diff = new Date().getFullYear() - birth.getFullYear();
      if (diff <= DEFAULT_CHILD_MAX_AGE) {
        return true;
      }
    }
  }

  return false;
};

export const findChildCandidates = (people) => {
  if (!Array.isArray(people)) {
    return [];
  }
  return people
    .filter((person) => looksLikeChild(person))
    .sort((a, b) => {
      const nameA = (a.name || '').toLowerCase();
      const nameB = (b.name || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });
};
