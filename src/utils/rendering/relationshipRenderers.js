// src/utils/rendering/relationshipRenderers.js
import React from 'react';

// Render basic line styles
export const renderBasicLineStyles = (x1, y1, x2, y2, lineStyle, strokeColor, strokeWidth, strokeDasharray) => {
  const lines = [];
  
  switch (lineStyle) {
    case 'double-line':
      const spacing = 8;
      const angle = Math.atan2(y2 - y1, x2 - x1);
      const perpX = Math.cos(angle + Math.PI/2) * spacing/2;
      const perpY = Math.sin(angle + Math.PI/2) * spacing/2;
      
      lines.push(
        <line key="line1" x1={x1 + perpX} y1={y1 + perpY} x2={x2 + perpX} y2={y2 + perpY} 
              stroke={strokeColor} strokeWidth={strokeWidth} style={{ pointerEvents: 'none' }} />
      );
      lines.push(
        <line key="line2" x1={x1 - perpX} y1={y1 - perpY} x2={x2 - perpX} y2={y2 - perpY} 
              stroke={strokeColor} strokeWidth={strokeWidth} style={{ pointerEvents: 'none' }} />
      );
      return lines;
      
    case 'toxic-zigzag':
      const segments = 10;
      const amplitude = 12;
      let pathData = `M ${x1} ${y1}`;
      for (let i = 1; i <= segments; i++) {
        const t = i / segments;
        const x = x1 + (x2 - x1) * t;
        const y = y1 + (y2 - y1) * t + (i % 2 === 0 ? amplitude : -amplitude);
        pathData += ` L ${x} ${y}`;
      }
      lines.push(<path key="zigzag" d={pathData} stroke={strokeColor} strokeWidth={strokeWidth} 
                       fill="none" style={{ pointerEvents: 'none' }} />);
      return lines;
      
    case 'wavy':
      const waveAmplitude = 8;
      const frequency = 3;
      const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
      const steps = Math.max(30, length / 8);
      let wavePath = `M ${x1} ${y1}`;
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const baseX = x1 + (x2 - x1) * t;
        const baseY = y1 + (y2 - y1) * t;
        const waveAngle = Math.atan2(y2 - y1, x2 - x1) + Math.PI/2;
        const waveOffset = Math.sin(t * Math.PI * frequency) * waveAmplitude;
        const x = baseX + Math.cos(waveAngle) * waveOffset;
        const y = baseY + Math.sin(waveAngle) * waveOffset;
        wavePath += ` L ${x} ${y}`;
      }
      lines.push(<path key="wave" d={wavePath} stroke={strokeColor} strokeWidth={strokeWidth} 
                       fill="none" style={{ pointerEvents: 'none' }} />);
      return lines;
      
    case 'triple-line':
      const depAngle = Math.atan2(y2 - y1, x2 - x1);
      const depPerpX = Math.cos(depAngle + Math.PI/2) * 4;
      const depPerpY = Math.sin(depAngle + Math.PI/2) * 4;
      lines.push(<line key="dep1" x1={x1 + depPerpX} y1={y1 + depPerpY} x2={x2 + depPerpX} y2={y2 + depPerpY} 
                       stroke={strokeColor} strokeWidth="1" style={{ pointerEvents: 'none' }} />);
      lines.push(<line key="dep2" x1={x1} y1={y1} x2={x2} y2={y2} 
                       stroke={strokeColor} strokeWidth="3" style={{ pointerEvents: 'none' }} />);
      lines.push(<line key="dep3" x1={x1 - depPerpX} y1={y1 - depPerpY} x2={x2 - depPerpX} y2={y2 - depPerpY} 
                       stroke={strokeColor} strokeWidth="1" style={{ pointerEvents: 'none' }} />);
      return lines;
      
    default:
      lines.push(
        <line key="default" x1={x1} y1={y1} x2={x2} y2={y2} 
              stroke={strokeColor} strokeWidth={strokeWidth} strokeDasharray={strokeDasharray}
              style={{ pointerEvents: 'none' }} />
      );
      return lines;
  }
};

// Render special line styles with decorations
export const renderSpecialLineStyles = (x1, y1, x2, y2, lineStyle, strokeColor, strokeWidth) => {
  const lines = [];
  
  switch (lineStyle) {
    case 'curved-arrow':
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2 - 25;
      
      lines.push(
        <path key="curve" d={`M ${x1} ${y1} Q ${midX} ${midY} ${x2} ${y2}`}
              stroke={strokeColor} strokeWidth={strokeWidth} fill="none"
              style={{ pointerEvents: 'none' }} />
      );
      
      const arrowAngle = Math.atan2(y2 - midY, x2 - midX);
      const arrowSize = 8;
      lines.push(
        <polygon key="arrow"
          points={`${x2 - Math.cos(arrowAngle - 0.5) * arrowSize},${y2 - Math.sin(arrowAngle - 0.5) * arrowSize} ${x2},${y2} ${x2 - Math.cos(arrowAngle + 0.5) * arrowSize},${y2 - Math.sin(arrowAngle + 0.5) * arrowSize}`}
          fill={strokeColor} style={{ pointerEvents: 'none' }} />
      );
      return lines;
      
    case 'shield':
      const protectMidX = (x1 + x2) / 2;
      const protectMidY = (y1 + y2) / 2;
      
      lines.push(
        <line key="protect" x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={strokeColor} strokeWidth={strokeWidth + 1}
              style={{ pointerEvents: 'none' }} />
      );
      
      lines.push(
        <path key="shield"
          d={`M ${protectMidX-6} ${protectMidY-8} L ${protectMidX+6} ${protectMidY-8} L ${protectMidX+6} ${protectMidY+2} L ${protectMidX} ${protectMidY+8} L ${protectMidX-6} ${protectMidY+2} Z`}
          fill="#10b981" stroke="#ffffff" strokeWidth="1"
          style={{ pointerEvents: 'none' }} />
      );
      return lines;
      
    case 'heart-arrow':
      lines.push(
        <line key="care" x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={strokeColor} strokeWidth={strokeWidth}
              style={{ pointerEvents: 'none' }} />
      );
      
      const careAngle = Math.atan2(y2 - y1, x2 - x1);
      const careArrowSize = 10;
      lines.push(
        <polygon key="carearrow"
          points={`${x2 - Math.cos(careAngle - 0.3) * careArrowSize},${y2 - Math.sin(careAngle - 0.3) * careArrowSize} ${x2},${y2} ${x2 - Math.cos(careAngle + 0.3) * careArrowSize},${y2 - Math.sin(careAngle + 0.3) * careArrowSize}`}
          fill={strokeColor} style={{ pointerEvents: 'none' }} />
      );
      
      const heartX = x1 + (x2 - x1) * 0.3;
      const heartY = y1 + (y2 - y1) * 0.3;
      lines.push(
        <text key="heart" x={heartX} y={heartY} textAnchor="middle"
              style={{ fontSize: '12px', fill: '#ec4899', pointerEvents: 'none' }}>
          ♥
        </text>
      );
      return lines;
      
    case 'dollar-signs':
      lines.push(
        <line key="financial" x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={strokeColor} strokeWidth={strokeWidth} strokeDasharray="8,4"
              style={{ pointerEvents: 'none' }} />
      );
      
      for (let i = 1; i <= 2; i++) {
        const t = i / 3;
        const dollarX = x1 + (x2 - x1) * t;
        const dollarY = y1 + (y2 - y1) * t;
        
        lines.push(
          <text key={`dollar-${i}`} x={dollarX} y={dollarY - 5} textAnchor="middle"
                style={{ fontSize: '10px', fill: '#10b981', fontWeight: 'bold', pointerEvents: 'none' }}>
            $
          </text>
        );
      }
      return lines;
      
    case 'supervision-eye':
      lines.push(
        <line key="supervised" x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={strokeColor} strokeWidth={strokeWidth} strokeDasharray="6,6"
              style={{ pointerEvents: 'none' }} />
      );
      
      const supervisionMidX = (x1 + x2) / 2;
      const supervisionMidY = (y1 + y2) / 2;
      
      lines.push(
        <ellipse key="eye" cx={supervisionMidX} cy={supervisionMidY} rx="8" ry="5"
                 fill="#ffffff" stroke={strokeColor} strokeWidth="1"
                 style={{ pointerEvents: 'none' }} />
      );
      lines.push(
        <circle key="pupil" cx={supervisionMidX} cy={supervisionMidY} r="3"
                fill={strokeColor} style={{ pointerEvents: 'none' }} />
      );
      return lines;
      
    default:
      return [];
  }
};

// Render relationship type-specific styles
export const renderRelationshipTypeStyles = (x1, y1, x2, y2, relationshipType, strokeColor, strokeWidth, strokeDasharray) => {
  const lines = [];
  
  switch (relationshipType) {
    case 'best-friends':
    case 'hate':
      const spacing = 8;
      const angle = Math.atan2(y2 - y1, x2 - x1);
      const perpX = Math.cos(angle + Math.PI/2) * spacing/2;
      const perpY = Math.sin(angle + Math.PI/2) * spacing/2;
      
      lines.push(
        <line key="line1" x1={x1 + perpX} y1={y1 + perpY} x2={x2 + perpX} y2={y2 + perpY} 
              stroke={strokeColor} strokeWidth={strokeWidth} strokeDasharray={strokeDasharray} 
              style={{ pointerEvents: 'none' }} />
      );
      lines.push(
        <line key="line2" x1={x1 - perpX} y1={y1 - perpY} x2={x2 - perpX} y2={y2 - perpY} 
              stroke={strokeColor} strokeWidth={strokeWidth} strokeDasharray={strokeDasharray} 
              style={{ pointerEvents: 'none' }} />
      );
      break;
      
    case 'toxic':
      const segments = 10;
      const amplitude = 12;
      let pathData = `M ${x1} ${y1}`;
      
      for (let i = 1; i <= segments; i++) {
        const t = i / segments;
        const x = x1 + (x2 - x1) * t;
        const y = y1 + (y2 - y1) * t + (i % 2 === 0 ? amplitude : -amplitude);
        pathData += ` L ${x} ${y}`;
      }
      
      lines.push(
        <path key="zigzag" d={pathData} stroke={strokeColor} strokeWidth={strokeWidth} 
              fill="none" style={{ pointerEvents: 'none' }} />
      );
      break;
      
    case 'manipulative':
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2 - 25;
      
      lines.push(
        <path key="curve" d={`M ${x1} ${y1} Q ${midX} ${midY} ${x2} ${y2}`}
              stroke={strokeColor} strokeWidth={strokeWidth} fill="none"
              style={{ pointerEvents: 'none' }} />
      );
      
      const arrowAngle = Math.atan2(y2 - midY, x2 - midX);
      const arrowSize = 8;
      lines.push(
        <polygon key="arrow"
          points={`${x2 - Math.cos(arrowAngle - 0.5) * arrowSize},${y2 - Math.sin(arrowAngle - 0.5) * arrowSize} ${x2},${y2} ${x2 - Math.cos(arrowAngle + 0.5) * arrowSize},${y2 - Math.sin(arrowAngle + 0.5) * arrowSize}`}
          fill={strokeColor} style={{ pointerEvents: 'none' }} />
      );
      break;
      
    case 'abusive':
      const abusiveSegments = 6;
      const harshness = 15;
      let abusivePath = `M ${x1} ${y1}`;
      
      for (let i = 1; i <= abusiveSegments; i++) {
        const t = i / abusiveSegments;
        const x = x1 + (x2 - x1) * t;
        const y = y1 + (y2 - y1) * t + (Math.random() - 0.5) * harshness;
        abusivePath += ` L ${x} ${y}`;
      }
      
      lines.push(
        <path key="abusive" d={abusivePath} stroke="#dc2626" strokeWidth={strokeWidth + 1} 
              fill="none" style={{ pointerEvents: 'none' }} />
      );
      
      const midAbusiveX = (x1 + x2) / 2;
      const midAbusiveY = (y1 + y2) / 2;
      lines.push(
        <polygon key="warning"
          points={`${midAbusiveX},${midAbusiveY-8} ${midAbusiveX-6},${midAbusiveY+4} ${midAbusiveX+6},${midAbusiveY+4}`}
          fill="#dc2626" stroke="#ffffff" strokeWidth="1"
          style={{ pointerEvents: 'none' }} />
      );
      lines.push(
        <text key="exclamation" x={midAbusiveX} y={midAbusiveY + 2} textAnchor="middle"
              style={{ fontSize: '8px', fill: '#ffffff', fontWeight: 'bold', pointerEvents: 'none' }}>
          !
        </text>
      );
      break;
      
    default:
      lines.push(
        <line key="default" x1={x1} y1={y1} x2={x2} y2={y2} 
              stroke={strokeColor} strokeWidth={strokeWidth} strokeDasharray={strokeDasharray}
              style={{ pointerEvents: 'none' }} />
      );
      break;
  }
  
  return lines;
};

// Render relationship decorations
export const renderRelationshipDecorations = (relationship, bubbleX, bubbleY, strokeColor) => {
  const decorations = [];
  
  switch (relationship.type) {
    case 'separation':
      decorations.push(
        <line key="separation" 
          x1={bubbleX - 5} y1={bubbleY - 5} 
          x2={bubbleX + 5} y2={bubbleY + 5} 
          stroke="#000000" strokeWidth="3" />
      );
      break;
      
    case 'divorce':
      decorations.push(
        <line key="divorce1" 
          x1={bubbleX - 8} y1={bubbleY - 8} 
          x2={bubbleX + 8} y2={bubbleY + 8} 
          stroke="#000" strokeWidth="3" />
      );
      decorations.push(
        <line key="divorce2" 
          x1={bubbleX - 8} y1={bubbleY + 8} 
          x2={bubbleX + 8} y2={bubbleY - 8} 
          stroke="#000" strokeWidth="3" />
      );
      break;
      
    case 'cutoff':
      decorations.push(
        <line key="cutoff1" 
          x1={bubbleX - 6} y1={bubbleY - 10} 
          x2={bubbleX - 6} y2={bubbleY + 10} 
          stroke="#dc2626" strokeWidth="3" />
      );
      decorations.push(
        <line key="cutoff2" 
          x1={bubbleX + 6} y1={bubbleY - 10} 
          x2={bubbleX + 6} y2={bubbleY + 10} 
          stroke="#dc2626" strokeWidth="3" />
      );
      break;
      
    case 'love':
      decorations.push(
        <text key="love" x={bubbleX} y={bubbleY - 4} textAnchor="middle" 
              style={{ fontSize: '14px', fill: strokeColor, pointerEvents: 'none' }}>
          ❤
        </text>
      );
      break;
      
    case 'fused':
      decorations.push(
        <circle key="fused" cx={bubbleX} cy={bubbleY} r="8" 
                fill={strokeColor} style={{ pointerEvents: 'none' }} />
      );
      break;
      
    case 'adoption':
      decorations.push(
        <polygon key="adoption" 
          points={`${bubbleX},${bubbleY} ${bubbleX - 8},${bubbleY - 8} ${bubbleX - 8},${bubbleY + 8}`} 
          fill={strokeColor} style={{ pointerEvents: 'none' }} />
      );
      break;
  }
  
  return decorations;
};