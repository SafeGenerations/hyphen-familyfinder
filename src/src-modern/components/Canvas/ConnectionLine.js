// ===== ConnectionLine.js - COMPLETE FILE =====
// src/src-modern/components/Canvas/ConnectionLine.js
import React from 'react';

const ConnectionLine = ({ from, to, type, people }) => {
  if (!from || !to) return null;
  
  // If from is a person ID, find the person
  let fromX, fromY;
  if (typeof from === 'string') {
    const fromPerson = people.find(p => p.id === from);
    if (!fromPerson) return null;
    fromX = fromPerson.x + 30; // Center of person shape
    fromY = fromPerson.y + 30;
  } else if (from.x !== undefined && from.y !== undefined) {
    // Direct coordinates
    fromX = from.x;
    fromY = from.y;
  } else {
    return null;
  }
  
  // To is always coordinates from mouse position
  const toX = to.x;
  const toY = to.y;
  
  // Determine line style based on connection type
  let strokeColor = '#6366f1';
  let strokeDasharray = '5,5';
  let strokeWidth = 2;
  
  switch (type) {
    case 'marriage':
    case 'partner':
      strokeColor = '#ec4899';
      strokeDasharray = '0';
      break;
    case 'child':
      strokeColor = '#8b5cf6';
      strokeDasharray = '3,3';
      break;
    case 'sibling':
      strokeColor = '#3b82f6';
      strokeDasharray = '5,3';
      break;
    case 'dating':
    case 'engagement':
      strokeColor = '#f59e0b';
      strokeDasharray = '5,5';
      break;
    case 'cohabitation':
      strokeColor = '#10b981';
      strokeDasharray = '3,3';
      break;
    case 'separation':
    case 'divorce':
      strokeColor = '#ef4444';
      strokeDasharray = '10,5';
      break;
    case 'hostile':
    case 'cutoff':
      strokeColor = '#dc2626';
      strokeDasharray = '2,2';
      break;
    case 'friendship':
      strokeColor = '#06b6d4';
      strokeDasharray = '8,4';
      break;
    default:
      strokeColor = '#6b7280';
      strokeDasharray = '5,5';
  }
  
  return (
    <g style={{ pointerEvents: 'none' }}>
      {/* Main connection line */}
      <line
        x1={fromX}
        y1={fromY}
        x2={toX}
        y2={toY}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeDasharray={strokeDasharray}
        opacity="0.6"
      />
      
      {/* Connection type indicator at cursor */}
      <circle
        cx={toX}
        cy={toY}
        r="8"
        fill="white"
        stroke={strokeColor}
        strokeWidth="2"
      />
      
      {/* Type symbol */}
      <text
        x={toX}
        y={toY + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="10"
        fill={strokeColor}
        fontWeight="bold"
      >
        {type === 'marriage' && '♥'}
        {type === 'partner' && '♥'}
        {type === 'child' && 'C'}
        {type === 'sibling' && 'S'}
        {type === 'dating' && 'D'}
        {type === 'engagement' && 'E'}
        {type === 'cohabitation' && 'H'}
        {type === 'separation' && 'X'}
        {type === 'divorce' && 'X'}
        {type === 'hostile' && '!'}
        {type === 'cutoff' && '||'}
        {type === 'friendship' && 'F'}
        {!['marriage', 'partner', 'child', 'sibling', 'dating', 'engagement', 
          'cohabitation', 'separation', 'divorce', 'hostile', 'cutoff', 'friendship'].includes(type) && '?'}
      </text>
      
      {/* Hint text */}
      <text
        x={toX + 15}
        y={toY - 15}
        fontSize="12"
        fill="#64748b"
        style={{ userSelect: 'none' }}
      >
        Click person to connect
      </text>
    </g>
  );
};

export default ConnectionLine;  