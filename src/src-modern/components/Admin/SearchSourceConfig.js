// src/src-modern/components/Admin/SearchSourceConfig.js
import React from 'react';
import {
  fetchSearchSources,
  updateSearchSource
} from '../../services/searchSources';

const getSourceId = (source) => source?.id ?? source?._id ?? source?.slug;

const tableContainerStyle = {
  marginTop: '24px',
  border: '1px solid #e5e7eb',
  borderRadius: '12px',
  overflow: 'hidden',
  background: '#ffffff',
  boxShadow: '0 16px 30px rgba(15, 23, 42, 0.08)'
};

const headerCellStyle = {
  textAlign: 'left',
  fontSize: '13px',
  fontWeight: 600,
  color: '#475569',
  padding: '14px 16px',
  background: '#f8fafc',
  borderBottom: '1px solid #e2e8f0'
};

const bodyCellStyle = {
  fontSize: '13px',
  color: '#1f2937',
  padding: '14px 16px',
  borderBottom: '1px solid #f1f5f9',
  verticalAlign: 'middle'
};

const badgeStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '4px 8px',
  borderRadius: '999px',
  fontSize: '12px',
  fontWeight: 600,
  background: '#eef2ff',
  color: '#4338ca'
};

const actionButtonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '10px 14px',
  borderRadius: '8px',
  border: '1px solid #cbd5f5',
  background: 'white',
  color: '#4338ca',
  fontSize: '13px',
  fontWeight: 600,
  cursor: 'pointer'
};

const statusStyle = {
  marginTop: '12px',
  fontSize: '12px',
  color: '#475569'
};

const loadingStyle = {
  fontSize: '13px',
  color: '#64748b',
  marginTop: '18px'
};

const errorStyle = {
  marginTop: '18px',
  padding: '14px 16px',
  borderRadius: '10px',
  border: '1px solid #fca5a5',
  background: '#fef2f2',
  color: '#b91c1c',
  fontSize: '13px'
};

const labelStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  marginTop: '24px'
};

const SearchSourceConfig = () => {
  const [sources, setSources] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [statusMessage, setStatusMessage] = React.useState('');
  const [savingId, setSavingId] = React.useState(null);
  const [previewSource, setPreviewSource] = React.useState(null);

  const loadSources = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchSearchSources();
      setSources(result);
    } catch (err) {
      setError(err?.message || 'Unable to load search sources');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadSources();
  }, [loadSources]);

  const handleRefresh = async () => {
    await loadSources();
    setStatusMessage('Search sources refreshed');
  };

  const updateSourceState = (sourceId, updater) => {
    setSources((prev) => prev.map((source) => {
      const id = getSourceId(source);
      if (id !== sourceId) return source;
      return { ...source, ...updater(source) };
    }));
  };

  const handleToggle = async (source) => {
    const sourceId = getSourceId(source);
    if (!sourceId) return;

    const nextEnabled = !source.enabled;
    setSavingId(sourceId);
    updateSourceState(sourceId, () => ({ enabled: nextEnabled }));

    try {
      await updateSearchSource(sourceId, { enabled: nextEnabled });
      setStatusMessage(`${source.name || 'Source'} ${nextEnabled ? 'enabled' : 'disabled'}`);
    } catch (err) {
      updateSourceState(sourceId, () => ({ enabled: source.enabled }));
      setError(err?.message || 'Unable to update source');
    } finally {
      setSavingId(null);
    }
  };

  const handlePriorityChange = (sourceId, value) => {
    updateSourceState(sourceId, () => ({ priority: value }));
  };

  const commitPriority = async (source, rawValue) => {
    const sourceId = getSourceId(source);
    if (!sourceId) return;

    const parsed = Number(rawValue);
    if (!Number.isFinite(parsed)) {
      setError('Priority must be a number');
      return;
    }

    setSavingId(sourceId);
    try {
      await updateSearchSource(sourceId, { priority: parsed });
      setStatusMessage(`Updated priority for ${source.name || 'source'}`);
    } catch (err) {
      setError(err?.message || 'Unable to update priority');
    } finally {
      setSavingId(null);
      await loadSources();
    }
  };

  const handleEdit = (source) => {
    setStatusMessage(`Edit panel for ${source.name || 'source'} coming soon`);
  };

  const handlePreview = (source) => {
    if (!source?.sampleData) {
      setStatusMessage('No sample data available for this source yet');
      return;
    }
    setPreviewSource(source);
  };

  const closePreview = () => {
    setPreviewSource(null);
  };

  const renderEmptyState = () => (
    <div style={{
      padding: '32px',
      textAlign: 'center',
      color: '#94a3b8',
      fontSize: '14px'
    }}>
      No search sources configured yet.
    </div>
  );

  return (
    <div style={{
      maxWidth: '960px',
      margin: '0 auto',
      padding: '40px 24px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <h1 style={{
            margin: 0,
            fontSize: '24px',
            fontWeight: 700,
            color: '#1e293b'
          }}>
            Search Source Configuration
          </h1>
          <p style={{
            marginTop: '6px',
            marginBottom: 0,
            fontSize: '14px',
            color: '#64748b'
          }}>
            Toggle and prioritize the external discovery providers that power Family Finder search.
          </p>
        </div>
        <button
          type="button"
          style={actionButtonStyle}
          onClick={handleRefresh}
        >
          Refresh
        </button>
      </div>

      {loading && (
        <div style={loadingStyle}>Loading search sources…</div>
      )}

      {error && (
        <div style={errorStyle}>
          {error}
          <div style={{ marginTop: '8px' }}>
            <button
              type="button"
              style={{ ...actionButtonStyle, padding: '8px 12px', fontSize: '12px' }}
              onClick={loadSources}
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {!loading && !error && (
        <div style={tableContainerStyle}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...headerCellStyle, width: '10%' }}>Enabled</th>
                <th style={{ ...headerCellStyle, width: '20%' }}>Source</th>
                <th style={{ ...headerCellStyle, width: '15%' }}>Type</th>
                <th style={{ ...headerCellStyle, width: '15%' }}>Priority</th>
                <th style={{ ...headerCellStyle, width: '15%' }}>Cost / Search</th>
                <th style={{ ...headerCellStyle, width: '15%' }}>Terms</th>
                <th style={{ ...headerCellStyle, width: '10%' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sources.length === 0 && (
                <tr>
                  <td colSpan="7">{renderEmptyState()}</td>
                </tr>
              )}
              {sources.map((source) => {
                const sourceId = getSourceId(source);
                const priorityValue = source.priority ?? '';
                const cost = typeof source.costPerSearch === 'number'
                  ? `$${source.costPerSearch.toFixed(2)}`
                  : 'Included';

                return (
                  <tr key={sourceId || source.name}>
                    <td style={bodyCellStyle}>
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="checkbox"
                          checked={Boolean(source.enabled)}
                          onChange={() => handleToggle(source)}
                          disabled={savingId === sourceId}
                        />
                        <span style={{ fontSize: '12px', color: '#475569' }}>
                          {source.enabled ? 'Active' : 'Paused'}
                        </span>
                      </label>
                    </td>
                    <td style={bodyCellStyle}>
                      <div style={{ fontWeight: 600 }}>{source.name}</div>
                      {source.description && (
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                          {source.description}
                        </div>
                      )}
                    </td>
                    <td style={bodyCellStyle}>
                      <span style={{ ...badgeStyle, background: '#f0f9ff', color: '#0369a1' }}>
                        {source.type || 'Custom'}
                      </span>
                    </td>
                    <td style={bodyCellStyle}>
                      <input
                        type="number"
                        value={priorityValue}
                        onChange={(event) => handlePriorityChange(sourceId, event.target.value)}
                        onBlur={(event) => commitPriority(source, event.target.value)}
                        style={{
                          width: '80px',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5f5',
                          fontSize: '13px'
                        }}
                        disabled={savingId === sourceId}
                        aria-label={`Priority for ${source.name}`}
                      />
                    </td>
                    <td style={bodyCellStyle}>{cost}</td>
                    <td style={bodyCellStyle}>
                      {source.termsUrl ? (
                        <a
                          href={source.termsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: '#4338ca', textDecoration: 'none', fontSize: '13px' }}
                        >
                          View terms
                        </a>
                      ) : (
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>—</span>
                      )}
                    </td>
                    <td style={bodyCellStyle}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {source.sampleData && (
                          <button
                            type="button"
                            style={{ ...actionButtonStyle, padding: '8px 12px', fontSize: '12px' }}
                            onClick={() => handlePreview(source)}
                          >
                            Preview data
                          </button>
                        )}
                        <button
                          type="button"
                          style={{ ...actionButtonStyle, padding: '8px 12px', fontSize: '12px' }}
                          onClick={() => handleEdit(source)}
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div style={labelStyle}>
        <div style={{ fontSize: '13px', color: '#475569', fontWeight: 600 }}>How priorities work</div>
        <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
          Lower numbers are searched first. A provider with priority 1 will run before providers with higher numbers.
          Adjust these values to balance cost, data quality, and typical response time.
        </p>
      </div>

      {statusMessage && (
        <div style={statusStyle}>{statusMessage}</div>
      )}

      {previewSource && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${previewSource.name || 'Search source'} sample data`}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(15, 23, 42, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            zIndex: 9999
          }}
          onClick={closePreview}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              width: 'min(720px, 100%)',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 28px 60px rgba(15, 23, 42, 0.25)',
              padding: '32px',
              position: 'relative'
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={closePreview}
              style={{
                position: 'absolute',
                top: '18px',
                right: '18px',
                border: 'none',
                background: 'none',
                fontSize: '18px',
                fontWeight: 600,
                color: '#475569',
                cursor: 'pointer'
              }}
              aria-label="Close preview"
            >
              ×
            </button>
            <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#1e293b' }}>
              {previewSource.name}
            </h2>
            <p style={{ marginTop: '8px', fontSize: '14px', color: '#64748b' }}>
              Representative sample result returned when this provider finds a match. Values mirror what Family Finder
              operators will see in live searches.
            </p>

            <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {renderSampleEntries(previewSource.sampleData)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchSourceConfig;

const renderSampleEntries = (data) => {
  if (!data) {
    return <div style={{ fontSize: '14px', color: '#94a3b8' }}>No sample data available.</div>;
  }

  if (typeof data !== 'object') {
    return <div style={{ fontSize: '14px', color: '#1f2937' }}>{String(data)}</div>;
  }

  return Object.entries(data).map(([key, value]) => (
    <div
      key={key}
      style={{
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '16px',
        background: '#f8fafc'
      }}
    >
      <div style={{ fontSize: '12px', fontWeight: 600, color: '#4338ca', textTransform: 'uppercase' }}>
        {formatKeyLabel(key)}
      </div>
      <div style={{ marginTop: '8px', fontSize: '14px', color: '#1f2937' }}>
        {renderSampleValue(value)}
      </div>
    </div>
  ));
};

const renderSampleValue = (value, depth = 0) => {
  if (value === null || value === undefined) {
    return <span style={{ color: '#94a3b8' }}>—</span>;
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return <span>{String(value)}</span>;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span style={{ color: '#94a3b8' }}>No items</span>;
    }
    return (
      <ul style={{ margin: '8px 0', paddingLeft: depth > 0 ? '18px' : '20px', color: '#1f2937' }}>
        {value.map((item, index) => (
          <li key={index} style={{ marginBottom: '6px' }}>
            {renderSampleValue(item, depth + 1)}
          </li>
        ))}
      </ul>
    );
  }

  if (typeof value === 'object') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {Object.entries(value).map(([childKey, childValue]) => (
          <div key={childKey}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
              {formatKeyLabel(childKey)}
            </div>
            <div style={{ marginTop: '4px' }}>
              {renderSampleValue(childValue, depth + 1)}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return <span>{String(value)}</span>;
};

const formatKeyLabel = (key) => {
  return key
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^(.)/, (match) => match.toUpperCase());
};
