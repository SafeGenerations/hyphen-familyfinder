import React from 'react';
import { DECEASED_SYMBOL_GROUPS } from '../../constants/deceasedSymbols';

const SYMBOL_COLORS = {
  none: '#d1d5db',
  'soft-outline': '#9ca3af',
  star: '#facc15',
  sparkle: '#fef3c7',
  'classic-x': '#6b7280',
  halo: '#fbbf24',
  candle: '#f59e0b',
  ribbon: '#ec4899',
  angel: '#60a5fa',
  heart: '#f87171',
  flower: '#f472b6',
  butterfly: '#60a5fa',
  infinity: '#38bdf8',
  cross: '#ef4444',
  'praying-hands': '#8b5cf6',
  'crescent-star': '#22c55e',
  'star-of-david': '#0ea5e9',
  'dharma-wheel': '#f59e0b'
};

const SymbolPreview = ({ symbol, size = 56 }) => {
  const stroke = SYMBOL_COLORS[symbol] || '#6b7280';

  switch (symbol) {
    case 'classic-x':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
          <rect x="14" y="20" width="36" height="32" rx="10" fill="#f3f4f6" stroke="#cbd5f5" strokeWidth="2" />
          <line x1="20" y1="26" x2="56" y2="58" stroke={stroke} strokeWidth="4" strokeLinecap="round" />
          <line x1="20" y1="58" x2="56" y2="26" stroke={stroke} strokeWidth="4" strokeLinecap="round" />
        </svg>
      );
    case 'soft-outline':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
          <rect
            x="16"
            y="20"
            width="32"
            height="32"
            rx="8"
            fill="#fff"
            stroke={stroke}
            strokeWidth="3"
            strokeDasharray="6 4"
          />
        </svg>
      );
    case 'halo':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
          <rect x="14" y="28" width="36" height="26" rx="8" fill="#f3f4f6" stroke="#cbd5f5" strokeWidth="2" />
          <ellipse cx="32" cy="12" rx="20" ry="6" fill="none" stroke={stroke} strokeWidth="3" />
          <line x1="16" y1="40" x2="48" y2="40" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'star':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
          <rect x="14" y="28" width="36" height="26" rx="8" fill="#f3f4f6" stroke="#cbd5f5" strokeWidth="2" />
          <polygon
            points="32,8 36.9,20.5 50.5,20.5 39.2,28.8 43.9,41.2 32,32.8 20.1,41.2 24.8,28.8 13.5,20.5 27.1,20.5"
            fill={stroke}
            stroke="#f59e0b"
            strokeWidth="1.2"
          />
        </svg>
      );
    case 'sparkle':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
          <rect x="14" y="28" width="36" height="26" rx="8" fill="#f3f4f6" stroke="#cbd5f5" strokeWidth="2" />
          <g stroke="#fbbf24" strokeWidth="2" strokeLinecap="round">
            <line x1="32" y1="8" x2="32" y2="20" />
            <line x1="26" y1="14" x2="38" y2="14" />
            <line x1="28.5" y1="10.5" x2="35.5" y2="17.5" />
            <line x1="35.5" y1="10.5" x2="28.5" y2="17.5" />
          </g>
        </svg>
      );
    case 'candle':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
          <circle cx="44" cy="18" r="12" fill="#fff" stroke="#d1d5db" strokeWidth="2" />
          <rect x="12" y="24" width="40" height="28" rx="10" fill="#f9fafb" stroke="#cbd5f5" strokeWidth="2" />
          <rect x="39" y="14" width="10" height="12" rx="3" fill="#fde68a" stroke={stroke} strokeWidth="1.5" />
          <path d="M44 9 C46 12 46 15 44 18 C42 15 42 12 44 9" fill="#f97316" stroke="#fb923c" strokeWidth="1" />
        </svg>
      );
    case 'ribbon':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
          <rect x="14" y="26" width="36" height="28" rx="10" fill="#f9fafb" stroke="#cbd5f5" strokeWidth="2" />
          <path
            d="M32 10 C42 12 44 24 32 36 C20 24 22 12 32 10"
            fill="none"
            stroke={stroke}
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M26 32 L38 44"
            stroke={stroke}
            strokeWidth="4"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'heart':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
          <rect x="14" y="26" width="36" height="28" rx="10" fill="#f9fafb" stroke="#cbd5f5" strokeWidth="2" />
          <path
            d="M32 22 C26 13 12 22 20 32 C26 40 32 44 32 44 C32 44 38 40 44 32 C52 22 38 13 32 22"
            fill="#f472b6"
            stroke="#ec4899"
            strokeWidth="1.5"
          />
        </svg>
      );
    case 'flower':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
          <rect x="14" y="26" width="36" height="28" rx="10" fill="#f9fafb" stroke="#cbd5f5" strokeWidth="2" />
          <g fill="#fb7185" opacity="0.85">
            <circle cx="32" cy="18" r="5" />
            <circle cx="20" cy="30" r="5" />
            <circle cx="44" cy="30" r="5" />
            <circle cx="26" cy="44" r="5" />
            <circle cx="38" cy="44" r="5" />
          </g>
          <circle cx="32" cy="32" r="4" fill="#fef3c7" stroke="#f59e0b" strokeWidth="1" />
        </svg>
      );
    case 'butterfly':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
          <rect x="14" y="26" width="36" height="28" rx="10" fill="#f9fafb" stroke="#cbd5f5" strokeWidth="2" />
          <g fill="#60a5fa" opacity="0.85">
            <ellipse cx="26" cy="32" rx="8" ry="10" />
            <ellipse cx="38" cy="32" rx="8" ry="10" />
          </g>
          <rect x="30" y="26" width="4" height="12" rx="2" fill="#1d4ed8" />
          <path d="M32 26 L28 20" stroke="#1d4ed8" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M32 26 L36 20" stroke="#1d4ed8" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case 'infinity':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
          <rect x="14" y="26" width="36" height="28" rx="10" fill="#f9fafb" stroke="#cbd5f5" strokeWidth="2" />
          <path
            d="M20 36 C24 24 34 24 38 34 C42 44 52 44 56 34 C52 46 42 46 38 36 C34 26 24 26 20 36"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'cross':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
          <rect x="14" y="26" width="36" height="28" rx="10" fill="#f9fafb" stroke="#cbd5f5" strokeWidth="2" />
          <path
            d="M32 16 L32 46 M20 28 L44 28"
            stroke="#ef4444"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'praying-hands':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
          <rect x="14" y="26" width="36" height="28" rx="10" fill="#f9fafb" stroke="#cbd5f5" strokeWidth="2" />
          <path
            d="M30 18 C30 12 34 12 34 18 L34 30 C34 34 38 38 42 40 L42 44 C38 42 34 40 32 36 C30 40 26 42 22 44 L22 40 C26 38 30 34 30 30 Z"
            fill="#8b5cf6"
            stroke="#6d28d9"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'crescent-star':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
          <rect x="14" y="26" width="36" height="28" rx="10" fill="#f9fafb" stroke="#cbd5f5" strokeWidth="2" />
          <path
            d="M36 18 A12 12 0 1 0 36 42 A10 10 0 1 1 36 18"
            fill="#22c55e"
          />
          <polygon
            points="44,26 46.2,31.8 52.4,32 47.2,35.8 48.8,41.8 44,38.4 39.2,41.8 40.8,35.8 35.6,32 41.8,31.8"
            fill="#22c55e"
          />
        </svg>
      );
    case 'star-of-david':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
          <rect x="14" y="26" width="36" height="28" rx="10" fill="#f9fafb" stroke="#cbd5f5" strokeWidth="2" />
          <polygon
            points="32,16 40,30 24,30"
            fill="#0ea5e9"
            opacity="0.85"
          />
          <polygon
            points="32,44 24,30 40,30"
            fill="#0ea5e9"
            opacity="0.85"
          />
          <polygon
            points="32,21 36.5,29 27.5,29"
            fill="none"
            stroke="#0284c7"
            strokeWidth="1.6"
          />
          <polygon
            points="32,39 27.5,31 36.5,31"
            fill="none"
            stroke="#0284c7"
            strokeWidth="1.6"
          />
        </svg>
      );
    case 'dharma-wheel':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
          <rect x="14" y="26" width="36" height="28" rx="10" fill="#f9fafb" stroke="#cbd5f5" strokeWidth="2" />
          <circle cx="32" cy="30" r="10" fill="none" stroke="#f59e0b" strokeWidth="2.2" />
          <circle cx="32" cy="30" r="4" fill="#f59e0b" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
            const rad = (angle * Math.PI) / 180;
            const x1 = 32 + Math.cos(rad) * 4;
            const y1 = 30 + Math.sin(rad) * 4;
            const x2 = 32 + Math.cos(rad) * 10;
            const y2 = 30 + Math.sin(rad) * 10;
            const xOuter = 32 + Math.cos(rad) * 14;
            const yOuter = 30 + Math.sin(rad) * 14;
            return (
              <g key={`spoke-${angle}`}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#f59e0b" strokeWidth="1.8" />
                <circle cx={xOuter} cy={yOuter} r="2.3" fill="#f59e0b" />
              </g>
            );
          })}
        </svg>
      );
    case 'angel':
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
          <circle cx="44" cy="18" r="12" fill="#fff" stroke="#d1d5db" strokeWidth="2" />
          <rect x="14" y="28" width="36" height="26" rx="8" fill="#f3f4f6" stroke="#cbd5f5" strokeWidth="2" />
          <circle cx="44" cy="18" r="4" fill="#bfdbfe" stroke={stroke} strokeWidth="1.5" />
          <path
            d="M36 18 C24 8 24 28 36 26"
            fill="none"
            stroke={stroke}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d="M52 18 C64 8 64 28 52 26"
            fill="none"
            stroke={stroke}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'none':
    default:
      return (
        <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
          <rect x="14" y="20" width="36" height="32" rx="12" fill="#f9fafb" stroke="#d1d5db" strokeDasharray="4 4" strokeWidth="2" />
        </svg>
      );
  }
};

const GENTLE_OPTIONS = new Set(['soft-outline']);

const DeceasedSymbolPicker = ({ value, symbolValue, gentleValue = 'none', onChange, size = 56 }) => {
  const incomingSymbol = symbolValue ?? value ?? 'halo';
  const safeSymbolValue = GENTLE_OPTIONS.has(incomingSymbol) ? 'none' : incomingSymbol;
  const safeGentleValue = GENTLE_OPTIONS.has(gentleValue) ? gentleValue : 'none';

  const emitChange = (nextSymbol, nextGentle = safeGentleValue) => {
    if (!onChange) return;
    const sanitizedSymbol = GENTLE_OPTIONS.has(nextSymbol) ? 'none' : nextSymbol;
    const sanitizedGentle = GENTLE_OPTIONS.has(nextGentle) ? nextGentle : 'none';
    onChange(sanitizedSymbol, sanitizedGentle);
  };

  const handleSymbolSelect = (optionId) => {
    if (optionId === safeSymbolValue) {
      emitChange('none', safeGentleValue);
      return;
    }

    emitChange(optionId, safeGentleValue);
  };

  const handleGentleSelect = (optionId) => {
    if (optionId === 'none') {
      emitChange(safeSymbolValue, 'none');
      return;
    }

    const nextGentle = optionId === safeGentleValue ? 'none' : optionId;
    emitChange(safeSymbolValue, nextGentle);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {DECEASED_SYMBOL_GROUPS.map((group) => (
        <div key={group.id} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#1f2937' }}>{group.label}</span>
            {group.description && (
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#6b7280' }}>{group.description}</p>
            )}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            {group.options.map((option) => {
              let isSelected = false;
              if (group.id === 'minimal-outline') {
                if (option.id === 'none') {
                  isSelected = safeSymbolValue === 'none' && safeGentleValue === 'none';
                } else {
                  isSelected = safeGentleValue === option.id;
                }
              } else {
                isSelected = safeSymbolValue === option.id;
              }

              const handleClick = () => {
                if (group.id === 'minimal-outline') {
                  handleGentleSelect(option.id);
                } else {
                  handleSymbolSelect(option.id);
                }
              };

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={handleClick}
                  aria-pressed={isSelected}
                  title={option.description}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: isSelected ? '2px solid #6366f1' : '1px solid #d1d5db',
                    backgroundColor: isSelected ? '#eef2ff' : '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    width: size + 24,
                    boxShadow: isSelected ? '0 0 0 4px rgba(99,102,241,0.15)' : 'none'
                  }}
                >
                  <SymbolPreview symbol={option.id} size={size} />
                  <span style={{ fontSize: '13px', fontWeight: isSelected ? 600 : 500, color: '#374151', textAlign: 'center' }}>
                    {option.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default DeceasedSymbolPicker;
