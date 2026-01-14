import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useGenogram } from '../../contexts/GenogramContext';
import { calculateCaseloadAnalytics } from '../../utils/analytics';
import {
  CareStatus,
  getCareStatusConfig,
  getPlacementStatusConfig
} from '../../constants/connectionStatus';
import { downloadCSV, downloadJSON, copyTextToClipboard } from '../../utils/downloads';

const sectionCardStyle = {
  background: 'white',
  borderRadius: '12px',
  border: '1px solid #e2e8f0',
  padding: '18px',
  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.05)',
  display: 'flex',
  flexDirection: 'column',
  gap: '14px'
};

const badgeStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '4px 10px',
  borderRadius: '999px',
  fontSize: '12px',
  fontWeight: 600
};

const severityPalette = {
  high: { background: '#fee2e2', color: '#b91c1c' },
  medium: { background: '#fef3c7', color: '#b45309' },
  low: { background: '#dcfce7', color: '#047857' }
};

const getHealthColor = (score) => {
  if (score >= 80) {
    return '#10b981';
  }
  if (score >= 60) {
    return '#0ea5e9';
  }
  if (score >= 40) {
    return '#f59e0b';
  }
  return '#ef4444';
};

const formatDaysSinceContact = (days) => {
  if (typeof days !== 'number') {
    return 'No contact logged';
  }
  if (days === 0) {
    return 'Today';
  }
  if (days === 1) {
    return '1 day ago';
  }
  if (days < 30) {
    return `${days} days ago`;
  }
  const approxWeeks = Math.ceil(days / 7);
  if (approxWeeks < 8) {
    return `${approxWeeks} week${approxWeeks === 1 ? '' : 's'} ago`;
  }
  const approxMonths = Math.round(days / 30);
  return `${approxMonths} month${approxMonths === 1 ? '' : 's'} ago`;
};

const renderSummaryCard = ({ title, value, subtitle, accent, highlight }) => (
  <div
    style={{
      ...sectionCardStyle,
      gap: '6px',
      background: highlight ? 'linear-gradient(135deg, #eef2ff 0%, #ffffff 50%)' : 'white'
    }}
  >
    <div style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>{title}</div>
    <div style={{ fontSize: '28px', fontWeight: 700, color: accent || '#1e293b' }}>{value}</div>
    {subtitle && (
      <div style={{ fontSize: '12px', color: '#94a3b8' }}>{subtitle}</div>
    )}
  </div>
);

const getPlacementLabel = (summary) => {
  if (summary.activePlacement) {
    return getPlacementStatusConfig(summary.activePlacement.placementStatus).label;
  }
  if (summary.potentialPlacements.length > 0) {
    const first = summary.potentialPlacements[0];
    const additional = summary.potentialPlacements.length - 1;
    const label = getPlacementStatusConfig(first.placementStatus).label;
    return additional > 0 ? `${label} (+${additional})` : label;
  }
  return summary.needsPlacement ? 'No placement options identified' : '—';
};

const SupervisorDashboard = () => {
  const { state } = useGenogram();
  const analytics = useMemo(() => calculateCaseloadAnalytics(state), [state]);
  const [copyState, setCopyState] = useState('Copy Summary');
  const resetTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  if (!analytics || analytics.totalChildren === 0) {
    return (
      <div
        style={{
          ...sectionCardStyle,
          alignItems: 'center',
          textAlign: 'center',
          color: '#94a3b8'
        }}
      >
        Load a genogram with children to see caseload analytics.
      </div>
    );
  }

  const generatedDate = analytics.generatedAt ? new Date(analytics.generatedAt) : new Date();
  const formattedDate = generatedDate.toLocaleString();

  const priorityChildren = analytics.priorityChildren || [];
  const priorityScoreById = new Map(priorityChildren.map((child) => [child.id, child.priorityScore]));

  const roster = analytics.childSummaries
    .map((summary) => ({
      ...summary,
      priorityScore: priorityScoreById.get(summary.id) || 0
    }))
    .sort((a, b) => {
      if (b.priorityScore !== a.priorityScore) {
        return b.priorityScore - a.priorityScore;
      }
      const aDays = typeof a.childDaysSinceContact === 'number' ? a.childDaysSinceContact : 9999;
      const bDays = typeof b.childDaysSinceContact === 'number' ? b.childDaysSinceContact : 9999;
      if (aDays === bDays) {
        return a.name.localeCompare(b.name);
      }
      return bDays - aDays;
    });

  const contactPercent = analytics.totalChildren
    ? Math.round((analytics.withRecentContact / analytics.totalChildren) * 100)
    : 0;

  const placementCoverage = analytics.needsPlacementCount > 0
    ? Math.round((analytics.withPlacementOptions / analytics.needsPlacementCount) * 100)
    : 0;

  const summaryCards = [
    {
      title: 'Children on Caseload',
      value: analytics.totalChildren,
      subtitle: `${analytics.flagDetails.length} total flags logged across the caseload`,
      accent: '#1e293b',
      highlight: true
    },
    {
      title: 'Recent Contact (30 days)',
      value: `${analytics.withRecentContact}/${analytics.totalChildren}`,
      subtitle: `${contactPercent}% with documented contact`,
      accent: '#6366f1'
    },
    {
      title: 'Average Network Health',
      value: analytics.averageNetworkHealth,
      subtitle: `${analytics.averageContactsLast30} contacts logged per child (30 days)`,
      accent: getHealthColor(analytics.averageNetworkHealth)
    },
    {
      title: 'Placement Coverage',
      value: analytics.needsPlacementCount > 0 ? `${placementCoverage}%` : '—',
      subtitle: analytics.needsPlacementCount > 0
        ? `${analytics.withPlacementOptions}/${analytics.needsPlacementCount} children needing placement have options`
        : 'No children currently flagged for placement',
      accent: '#8b5cf6'
    }
  ];

  const flagSummary = analytics.aggregatedFlagSummary.slice(0, 4);

  const actionButtonStyle = {
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #cbd5f5',
    background: 'white',
    color: '#4338ca',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    transition: 'all 0.2s'
  };

  const exportCaseloadRoster = () => {
    const filename = `caseload-roster-${generatedDate.toISOString().split('T')[0]}.csv`;
    const columns = [
      { key: 'name', label: 'Child' },
      { key: 'careStatus', label: 'Care Status' },
      { key: 'lastContact', label: 'Last Contact' },
      { key: 'activeSupports', label: 'Active Supports' },
      { key: 'networkHealth', label: 'Network Health' },
      { key: 'placement', label: 'Placement' }
    ];
    const rows = roster.map((summary) => {
      const careConfig = getCareStatusConfig(summary.careStatus || CareStatus.NOT_APPLICABLE);
      return {
        name: summary.name,
        careStatus: careConfig.label,
        lastContact: formatDaysSinceContact(summary.childDaysSinceContact),
        activeSupports: `${summary.activeMembers}/${summary.totalMembers}`,
        networkHealth: summary.networkHealthScore,
        placement: getPlacementLabel(summary)
      };
    });
    downloadCSV(filename, columns, rows);
  };

  const exportFlagSummary = () => {
    const filename = `caseload-flags-${generatedDate.toISOString().split('T')[0]}.csv`;
    const columns = [
      { key: 'message', label: 'Flag' },
      { key: 'description', label: 'Description' },
      { key: 'severity', label: 'Severity' },
      { key: 'count', label: 'Affected Children' }
    ];
    const rows = analytics.aggregatedFlagSummary.map((flag) => ({
      message: flag.message,
      description: flag.description,
      severity: flag.severity,
      count: flag.count
    }));
    downloadCSV(filename, columns, rows);
  };

  const exportSnapshot = () => {
    const safeTimestamp = generatedDate.toISOString().replace(/[:]/g, '-');
    const filename = `caseload-snapshot-${safeTimestamp}.json`;
    downloadJSON(filename, {
      generatedAt: generatedDate.toISOString(),
      totals: {
        totalChildren: analytics.totalChildren,
        recentContact: analytics.withRecentContact,
        averageNetworkHealth: analytics.averageNetworkHealth,
        needsPlacement: analytics.needsPlacementCount,
        withPlacementOptions: analytics.withPlacementOptions
      },
      priorityChildren,
      flagSummary: analytics.aggregatedFlagSummary,
      roster: analytics.childSummaries
    });
  };

  const copySummary = async () => {
    const summaryLines = [
      `Caseload snapshot (${formattedDate})`,
      `Children on caseload: ${analytics.totalChildren}`,
      `Recent contact (30 days): ${analytics.withRecentContact}/${analytics.totalChildren} (${contactPercent}%)`,
      `Average network health: ${analytics.averageNetworkHealth}`,
      `Children needing placement with options: ${analytics.withPlacementOptions}/${analytics.needsPlacementCount}`,
      flagSummary.length > 0
        ? `Top flag: ${flagSummary[0].message} (${flagSummary[0].count} affected)`
        : 'No active flags in this snapshot.'
    ];

    const success = await copyTextToClipboard(summaryLines.join('\n'));
    setCopyState(success ? 'Copied!' : 'Copy Failed');

    if (resetTimerRef.current) {
      clearTimeout(resetTimerRef.current);
    }

    resetTimerRef.current = setTimeout(() => {
      setCopyState('Copy Summary');
      resetTimerRef.current = null;
    }, 2400);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
        {summaryCards.map((card) => (
          <React.Fragment key={card.title}>{renderSummaryCard(card)}</React.Fragment>
        ))}
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          gap: '10px',
          alignItems: 'center'
        }}
      >
        <div style={{ fontSize: '12px', color: '#94a3b8' }}>Snapshot generated {formattedDate}</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            style={actionButtonStyle}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#eef2ff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; }}
            onClick={exportCaseloadRoster}
          >
            📄 Download Caseload CSV
          </button>
          <button
            type="button"
            style={actionButtonStyle}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#eef2ff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; }}
            onClick={exportFlagSummary}
          >
            ⚠️ Export Flag Trends
          </button>
          <button
            type="button"
            style={actionButtonStyle}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#eef2ff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; }}
            onClick={exportSnapshot}
          >
            💾 Save Snapshot
          </button>
          <button
            type="button"
            style={{
              ...actionButtonStyle,
              color: copyState === 'Copied!' ? '#16a34a' : copyState === 'Copy Failed' ? '#dc2626' : '#4338ca'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#eef2ff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; }}
            onClick={copySummary}
          >
            📋 {copyState}
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
        <div style={{ ...sectionCardStyle }}>
          <div style={{ fontSize: '15px', fontWeight: 600, color: '#1e293b' }}>Priority Follow-ups</div>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>Top cases needing action based on placement, engagement, and flags</div>
          {priorityChildren.length === 0 && (
            <div style={{ fontSize: '12px', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span role="img" aria-label="check">✅</span>
              No children are currently flagged as urgent.
            </div>
          )}
          {priorityChildren.map((child) => {
            const careConfig = getCareStatusConfig(child.careStatus || CareStatus.NOT_APPLICABLE);
            return (
              <div
                key={child.id}
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>{child.name}</div>
                  <span style={{ ...badgeStyle, background: `${careConfig.color}20`, color: careConfig.color }}>
                    {careConfig.icon} {careConfig.label}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Last contact {formatDaysSinceContact(child.childDaysSinceContact)}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  <span style={{ ...badgeStyle, background: '#e0f2fe', color: '#0369a1' }}>
                    Network health {child.networkHealthScore}
                  </span>
                  {child.needsPlacement && (
                    <span style={{ ...badgeStyle, background: '#fee2e2', color: '#b91c1c' }}>
                      Needs placement
                    </span>
                  )}
                  {!child.hasAnyPlacementOption && child.needsPlacement && (
                    <span style={{ ...badgeStyle, background: '#fef3c7', color: '#b45309' }}>
                      No placement options identified
                    </span>
                  )}
                </div>
                {child.flags.length > 0 && (
                  <ul
                    style={{
                      margin: 0,
                      padding: '0 0 0 16px',
                      fontSize: '12px',
                      color: '#64748b',
                      display: 'grid',
                      gap: '4px'
                    }}
                  >
                    {child.flags.slice(0, 3).map((flag) => (
                      <li key={flag.id}>{flag.message}</li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ ...sectionCardStyle }}>
          <div style={{ fontSize: '15px', fontWeight: 600, color: '#1e293b' }}>Flag Trends</div>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>Recurring needs across the caseload</div>
          {flagSummary.length === 0 && (
            <div style={{ fontSize: '12px', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span role="img" aria-label="check">✅</span>
              No outstanding flags.
            </div>
          )}
          {flagSummary.map((flag) => {
            const palette = severityPalette[flag.severity] || severityPalette.low;
            return (
              <div
                key={flag.id}
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  background: palette.background,
                  color: palette.color,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: 700 }}>{flag.message}</div>
                <div style={{ fontSize: '12px' }}>{flag.description}</div>
                <div style={{ fontSize: '12px', fontWeight: 600 }}>{flag.count} child{flag.count === 1 ? '' : 'ren'} affected</div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ ...sectionCardStyle, gap: '18px' }}>
        <div>
          <div style={{ fontSize: '15px', fontWeight: 600, color: '#1e293b' }}>Caseload Roster</div>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>Snapshot of every child with network and placement indicators</div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', color: '#475569' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>Child</th>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>Care Status</th>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>Last Contact</th>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>Active Supports</th>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>Network Health</th>
                <th style={{ padding: '8px 12px', fontWeight: 600 }}>Placement</th>
              </tr>
            </thead>
            <tbody>
              {roster.map((summary) => {
                const careConfig = getCareStatusConfig(summary.careStatus || CareStatus.NOT_APPLICABLE);
                const placementLabel = getPlacementLabel(summary);
                return (
                  <tr key={summary.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: '#1e293b' }}>{summary.name}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ ...badgeStyle, background: `${careConfig.color}20`, color: careConfig.color }}>
                        {careConfig.icon} {careConfig.label}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px' }}>{formatDaysSinceContact(summary.childDaysSinceContact)}</td>
                    <td style={{ padding: '10px 12px' }}>{summary.activeMembers}/{summary.totalMembers}</td>
                    <td style={{ padding: '10px 12px', color: getHealthColor(summary.networkHealthScore), fontWeight: 600 }}>{summary.networkHealthScore}</td>
                    <td style={{ padding: '10px 12px' }}>{placementLabel}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SupervisorDashboard;
