import React from 'react';
import { useGenogram } from '../../contexts/GenogramContext';
import { summarizeFilters } from '../../utils/filterSummary';

const SearchHistoryPanel = ({ onApplyFilters, currentFilters }) => {
  const { state, actions } = useGenogram();
  const { searchHistory } = state;

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const formatFilters = (filters = {}) => summarizeFilters(filters);

  const isCurrentFilters = (historyFilters) => {
    return JSON.stringify(historyFilters) === JSON.stringify(currentFilters);
  };

  if (searchHistory.length === 0) {
    return (
      <div style={styles.emptyState}>
        <div style={styles.emptyIcon}>🕒</div>
        <div style={styles.emptyText}>No recent searches</div>
        <div style={styles.emptySubtext}>
          Your search history will appear here
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.title}>Recent Searches</div>
        <button
          onClick={actions.clearSearchHistory}
          style={styles.clearButton}
          title="Clear history"
        >
          Clear All
        </button>
      </div>

      <div style={styles.list}>
        {searchHistory.map((item) => (
          <div
            key={item.id}
            style={{
              ...styles.historyItem,
              ...(isCurrentFilters(item.filters) ? styles.historyItemActive : {})
            }}
            onClick={() => onApplyFilters(item.filters)}
          >
            <div style={styles.historyContent}>
              <div style={styles.historyFilters}>
                {formatFilters(item.filters)}
              </div>
              <div style={styles.historyTime}>
                {formatTimestamp(item.timestamp)}
              </div>
            </div>
            {isCurrentFilters(item.filters) && (
              <div style={styles.activeIndicator}>✓</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '16px',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '8px',
    borderBottom: '1px solid #e5e7eb',
  },
  title: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#111827',
  },
  clearButton: {
    padding: '4px 8px',
    fontSize: '12px',
    color: '#6b7280',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    maxHeight: '300px',
    overflowY: 'auto',
  },
  historyItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 12px',
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  historyItemActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  historyContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  historyFilters: {
    fontSize: '13px',
    color: '#374151',
    fontWeight: '500',
  },
  historyTime: {
    fontSize: '11px',
    color: '#9ca3af',
  },
  activeIndicator: {
    fontSize: '16px',
    color: '#3b82f6',
    marginLeft: '8px',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    textAlign: 'center',
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '16px',
    opacity: 0.5,
  },
  emptyText: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: '4px',
  },
  emptySubtext: {
    fontSize: '12px',
    color: '#9ca3af',
  },
};

export default SearchHistoryPanel;
