// src/constants/relationshipStyles.js

// Color overrides for specific relationship types
export const COLOR_OVERRIDES = {
  'toxic': '#7c2d12',
  'abusive': '#dc2626',
  'conflict': '#dc2626',
  'cutoff': '#dc2626',
  'hostile': '#dc2626',
  'hate': '#b91c1c',
  'manipulative': '#9333ea',
  'best-friends': '#10b981',
  'supportive': '#06d6a0',
  'love': '#ec4899',
  'protective': '#10b981',
  'caregiver': '#ec4899',
  'financial-dependency': '#10b981',
  'supervised-contact': '#f59e0b',
  'dependency': '#6366f1',
  'codependent': '#6366f1',
  'complicated': '#f59e0b',
  'on-off': '#f97316',
  'competitive': '#8b5cf6',
  'indifferent': '#6b7280'
};

// Width overrides for certain types
export const WIDTH_OVERRIDES = {
  'marriage': 3,
  'separation': 3,
  'divorce': 3,
  'conflict': 3,
  'cutoff': 3,
  'fused': 4,
  'hate': 3,
  'widowed': 3,
  'toxic': 3,
  'abusive': 4
};

// Default styles based on relationship type
export const TYPE_DASH_STYLES = {
  'engagement': '5,5',
  'dating': '5,5',
  'cohabitation': '3,3',
  'distant': '10,5',
  'separation': '10,5',
  'cutoff': '2,2'
};

// Basic stroke patterns
export const LINE_STYLES = {
  'solid': '',
  'dashed': '6,4',
  'dotted': '2,2',
  'long-dash': '12,6',
  'dash-dot': '8,4,2,4',
  'dash-dot-dot': '8,4,2,4,2,4',
  'long-short': '12,3,3,3',
  'sparse-dots': '2,8',
  'dense-dots': '1,3'
};

// Enhanced line styles that override the main rendering
export const ENHANCED_LINE_STYLES = [
  'double-line', 'toxic-zigzag', 'wavy', 'on-off-segments', 
  'triple-line', 'curved-arrow', 'gentle-curve', 'parallel',
  'angular-warning', 'shield', 'heart-arrow', 'dollar-signs', 
  'supervision-eye'
];

// Helper function to get stroke color
export const getStrokeColor = (relationship) => {
  if (relationship.color) return relationship.color;
  return COLOR_OVERRIDES[relationship.type] || '#000000';
};

// Helper function to get stroke width
export const getStrokeWidth = (relationship, isSelected) => {
  let width = WIDTH_OVERRIDES[relationship.type] || 2;
  if (isSelected) width = Math.max(width, 3);
  return width;
};

// Helper function to get dash array
export const getDashArray = (relationship, lineStyle) => {
  if (lineStyle !== 'default' && !ENHANCED_LINE_STYLES.includes(lineStyle)) {
    return LINE_STYLES[lineStyle] || '';
  }
  return TYPE_DASH_STYLES[relationship.type] || '';
};

// Parent relationship types that can have children
export const PARENT_RELATIONSHIP_TYPES = [
  'marriage', 'partner', 'cohabitation', 'adoption'
];

// Directional relationship types
export const DIRECTIONAL_RELATIONSHIP_TYPES = [
  'manipulative', 'caregiver', 'protective', 
  'financial-dependency', 'abusive', 'dependency'
];

// High-risk relationship types
export const HIGH_RISK_RELATIONSHIP_TYPES = [
  'abusive', 'toxic', 'manipulative'
];

// Professional involvement relationship types
export const PROFESSIONAL_RELATIONSHIP_TYPES = [
  'supervised-contact', 'protective', 'caregiver'
];