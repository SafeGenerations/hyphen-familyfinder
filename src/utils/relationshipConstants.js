// src/src-modern/utils/relationshipConstants.js
export const REL_ABBREVIATIONS = {
  // Romantic Relationships
  'marriage': 'M',
  'engagement': 'E',
  'cohabitation': 'C',
  'legal-cohabitation': 'LC',
  'partner': 'P',
  'dating': 'D',
  'casual-relationship': 'CR',
  'love-affair': 'LA',
  'secret-affair': 'SA',
  
  // Ended Relationships
  'separation': 'S',
  'separation-in-fact': 'SIF',
  'legal-separation': 'LS',
  'divorce': 'D',
  'nullity': 'N',
  'widowed': 'W',
  
  // Family Relationships
  'sibling': 'Sib',
  'adoption': 'A',
  'step-relationship': 'Step',
  'child': 'Ch',
  
  // Emotional Relationships - Positive
  'harmony': 'H',
  'close': 'Close',
  'friendship-close': 'FC',
  'best-friends': 'BF',
  'very-close': 'VC',
  'love': '❤',
  'in-love': 'IL',
  'fused': 'F',
  'fused-hostile': 'FH',
  
  // Emotional Relationships - Negative
  'distant': 'Dist',
  'distant-poor': 'DP',
  'indifferent': 'Ind',
  'discord': 'Disc',
  'conflict': 'Conf',
  'cutoff': 'CO',
  'estranged': 'Est',
  'hostile': 'Host',
  'distant-hostile': 'DH',
  'close-hostile': 'CH',
  'hate': 'H',
  
  // Focused Relationships
  'focused-on': 'FO',
  'focused-on-negatively': 'FON',
  'fan-admirer': 'FA',
  'limerence': 'L',
  
  // Abuse & Violence
  'violence': 'V',
  'distant-violence': 'DV',
  'close-violence': 'CV',
  'abuse': 'Ab',
  'physical-abuse': 'PA',
  'emotional-abuse': 'EA',
  'sexual-abuse': 'SA',
  'neglect': 'N',
  'neglect-abuse': 'NA',
  
  // Control & Manipulation
  'manipulative': 'M',
  'controlling': 'C',
  
  // Other
  'distrust': 'DT',
  'never-met': 'NM'
};

// Relationship configuration for special rendering
export const RELATIONSHIP_CONFIG = {
  // One-directional relationships (need arrows)
  oneDirectional: [
    'focused-on',
    'focused-on-negatively',
    'fan-admirer',
    'limerence',
    'neglect',
    'neglect-abuse',
    'abuse',
    'physical-abuse',
    'emotional-abuse',
    'sexual-abuse'
  ],
  
  // Relationships with special line styles
  lineStyles: {
    // Dotted lines
    dotted: ['indifferent', 'distant-poor'],
    
    // Dashed lines
    dashed: ['engagement', 'dating', 'casual-relationship', 'cohabitation', 'distant', 'separation'],
    
    // Double lines
    double: ['best-friends', 'very-close', 'hate'],
    
    // Triple lines
    triple: ['fused', 'fused-hostile'],
    
    // Wavy/zigzag lines
    wavy: ['violence', 'distant-violence', 'close-violence', 'abuse', 'physical-abuse', 'emotional-abuse', 'sexual-abuse'],
    
    // Jagged lines
    jagged: ['discord', 'conflict', 'hostile', 'distant-hostile', 'close-hostile']
  },
  
  // Default colors for relationship types
  colors: {
    // Positive relationships - blues and greens
    'harmony': '#10b981',
    'close': '#3b82f6',
    'friendship-close': '#06b6d4',
    'best-friends': '#10b981',
    'very-close': '#3b82f6',
    'love': '#ec4899',
    'in-love': '#ec4899',
    
    // Negative relationships - reds
    'conflict': '#dc2626',
    'discord': '#ef4444',
    'hostile': '#dc2626',
    'violence': '#991b1b',
    'abuse': '#991b1b',
    'physical-abuse': '#991b1b',
    'emotional-abuse': '#b91c1c',
    'sexual-abuse': '#991b1b',
    'hate': '#991b1b',
    
    // Neutral/distant - grays
    'indifferent': '#6b7280',
    'distant': '#9ca3af',
    'cutoff': '#dc2626',
    'estranged': '#f87171',
    
    // Control - oranges
    'manipulative': '#ea580c',
    'controlling': '#dc2626',
    
    // Focused - purples
    'focused-on': '#7c3aed',
    'focused-on-negatively': '#dc2626',
    'fan-admirer': '#a855f7',
    'limerence': '#c084fc'
  }
};