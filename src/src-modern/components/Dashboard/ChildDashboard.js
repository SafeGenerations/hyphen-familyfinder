import React, { useMemo } from 'react';
import { useGenogram } from '../../contexts/GenogramContext';
import { calculateChildAnalytics } from '../../utils/analytics';
import { CareStatus, getCareStatusConfig } from '../../constants/connectionStatus';

const cardStyle = {
  background: 'white',
  borderRadius: '12px',
  border: '1px solid #e2e8f0',
  padding: '18px',
  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.05)',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px'
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

const getAgeDisplay = (person) => {
  if (!person) {
    return null;
  }
  if (person.age) {
    return `${person.age}`;
  }
  if (person.birthDate) {
    const birth = new Date(person.birthDate);
    if (!Number.isNaN(birth.getTime())) {
      const diff = new Date().getFullYear() - birth.getFullYear();
      return `${diff}`;
    }
  }
  return null;
};

const renderMetricCard = (title, value, subtitle, accentColor) => (
  <div style={cardStyle}>
    <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>{title}</div>
    <div style={{ fontSize: '26px', fontWeight: 700, color: accentColor || '#1e293b' }}>{value}</div>
    {subtitle && (
      <div style={{ fontSize: '12px', color: '#94a3b8' }}>{subtitle}</div>
    )}
  </div>
);

const renderActivityChart = (activity) => {
  const maxCount = activity.reduce((max, item) => Math.max(max, item.count), 0);
  const fallbackMax = maxCount === 0 ? 1 : maxCount;

  return (
    <div style={{ ...cardStyle, gap: '16px' }}>
      <div>
        <div style={{ fontSize: '15px', fontWeight: 600, color: '#1e293b' }}>Contact Activity (Last 13 Weeks)</div>
        <div style={{ fontSize: '12px', color: '#94a3b8' }}>Includes calls, visits, emails, and logged outreach</div>
      </div>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', height: '160px' }}>
        {activity.map((item) => {
          const heightPercent = Math.min(100, Math.round((item.count / fallbackMax) * 100));
          return (
            <div key={item.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '100%', background: '#e0e7ff', borderRadius: '8px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', height: '120px' }}>
                <div
                  style={{
                    width: '100%',
                    height: `${heightPercent}%`,
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                    borderRadius: '8px'
                  }}
                />
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', textAlign: 'center' }}>{item.label}</div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>{item.count}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const renderRoleDistribution = (roles) => (
  <div style={{ ...cardStyle, gap: '14px' }}>
    <div>
      <div style={{ fontSize: '15px', fontWeight: 600, color: '#1e293b' }}>Network Diversity</div>
      <div style={{ fontSize: '12px', color: '#94a3b8' }}>Breakdown of roles across the child&apos;s network</div>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {roles.length === 0 && (
        <div style={{ fontSize: '12px', color: '#94a3b8' }}>No roles assigned to network members yet.</div>
      )}
      {roles.map((role) => (
        <div key={role.key} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#475569', fontWeight: 600 }}>
            <span>{role.label}</span>
            <span>{role.count} ({role.percentage}%)</span>
          </div>
          <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
            <div style={{ width: `${role.percentage}%`, height: '100%', background: '#0ea5e9' }} />
          </div>
        </div>
      ))}
    </div>
  </div>
);

const renderFlags = (flags) => (
  <div style={{ ...cardStyle, gap: '14px' }}>
    <div style={{ fontSize: '15px', fontWeight: 600, color: '#1e293b' }}>Flags &amp; Follow-ups</div>
    {flags.length === 0 && (
      <div style={{ fontSize: '12px', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span role="img" aria-label="check">✅</span>
        All engagement benchmarks look good.
      </div>
    )}
    {flags.map((flag) => {
      const colorMap = {
        high: { background: '#fee2e2', color: '#b91c1c' },
        medium: { background: '#fef3c7', color: '#b45309' },
        low: { background: '#dcfce7', color: '#047857' }
      };
      const palette = colorMap[flag.severity] || colorMap.low;
      return (
        <div key={flag.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '12px', borderRadius: '10px', background: palette.background }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: palette.color }}>{flag.message}</div>
          <div style={{ fontSize: '12px', color: palette.color }}>{flag.description}</div>
        </div>
      );
    })}
  </div>
);

const ChildDashboard = ({ childId }) => {
  const { state } = useGenogram();

  const analytics = useMemo(() => calculateChildAnalytics(state, childId), [state, childId]);

  if (!analytics) {
    return (
      <div style={{ ...cardStyle, alignItems: 'center', textAlign: 'center', color: '#94a3b8' }}>
        Select a child to see engagement analytics.
      </div>
    );
  }

  const {
    child,
    totalMembers,
    activeMembersCount,
    inactiveMembersCount,
    activePercentage,
    totalContactsLast30Days,
    avgDaysToFirstContact,
    contactActivityByWeek,
    roleDistribution,
    networkHealthScore,
    networkHealthDescription,
    flags,
    childDaysSinceContact
  } = analytics;

  const careStatusConfig = getCareStatusConfig(child.careStatus || CareStatus.NOT_APPLICABLE);
  const ageDisplay = getAgeDisplay(child);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div style={{ ...cardStyle, gap: '14px', background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 60%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#6366f1', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Child Profile</div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#1e293b' }}>{child.name || 'Unnamed Child'}</div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>
              {ageDisplay ? `${ageDisplay} years old` : 'Age not documented'}
              {child.caseData?.caseNumber ? ` • Case ${child.caseData.caseNumber}` : ''}
            </div>
          </div>
          <span style={{
            ...badgeStyle,
            background: `${careStatusConfig.color}20`,
            color: careStatusConfig.color
          }}>
            {careStatusConfig.icon} {careStatusConfig.label}
          </span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ ...badgeStyle, background: '#e0f2fe', color: '#0369a1' }}>
            Last documented contact {typeof childDaysSinceContact === 'number' ? `${childDaysSinceContact} day${childDaysSinceContact === 1 ? '' : 's'} ago` : 'not recorded'}
          </div>
          <div style={{ ...badgeStyle, background: '#ede9fe', color: '#7c3aed' }}>
            Network size {totalMembers}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '14px' }}>
        {renderMetricCard('Network Health', `${networkHealthScore}`, networkHealthDescription, '#6366f1')}
        {renderMetricCard('Active Members', `${activeMembersCount}/${totalMembers}`, `${activePercentage}% engaged in last 30 days`, '#0ea5e9')}
        {renderMetricCard('Inactive Members', `${inactiveMembersCount}`, 'No contact in 90+ days', '#f59e0b')}
        {renderMetricCard('Contacts Logged', `${totalContactsLast30Days}`, 'Last 30 days', '#10b981')}
        {renderMetricCard('Avg Days to First Contact', avgDaysToFirstContact !== null ? `${avgDaysToFirstContact}` : '—', 'From discovery to first outreach', '#ec4899')}
      </div>

      {renderActivityChart(contactActivityByWeek)}
      {renderRoleDistribution(roleDistribution)}
      {renderFlags(flags)}
    </div>
  );
};

export default ChildDashboard;
