// Updated relationship constants with all new types
// src/utils/relationshipConstants.js

export const REL_ABBREVIATIONS = {
  // Romantic Relationships
  'marriage': 'M',
  'engagement': 'E',
  'cohabitation': 'C',
  'partner': 'P',
  'dating': 'D',
  'love-affair': 'LA',
  'secret-affair': 'SA',
  'single-encounter': 'SE',
  
  // Ended Relationships
  'separation': 'S',
  'divorce': 'D',
  'nullity': 'N',
  'widowed': 'W',
  
  // Family Relationships
  'sibling': 'Sib',
  'adoption': 'A',
  'step-relationship': 'Step',
  'child': 'Ch',
  
  // Emotional Relationships
  'close': 'Close',
  'distant': 'Dist',
  'conflict': 'Conf',
  'cutoff': 'CO',
  'fused': 'F',
  'indifferent': 'Ind',
  'hostile': 'Host',
  'hate': 'H',
  'best-friends': 'BF',
  'love': '❤',
  
  // Complex Dynamics
  'toxic': 'Tox',
  'on-off': 'O/O',
  'complicated': 'Comp',
  'dependency': 'Dep',
  'codependent': 'CoDep',
  'manipulative': 'Manip',
  'supportive': 'Supp',
  'competitive': 'Comp',
  
  // Social Services Specific
  'abusive': '⚠',
  'protective': '🛡',
  'caregiver': 'Care',
  'financial-dependency': '$',
  'supervised-contact': '👁'
};

export const RELATIONSHIP_TYPES = [
  {
    group: '💕 Romantic',
    types: [
      'marriage',
      'engagement',
      'cohabitation',
      'partner',
      'dating',
      'love-affair',
      'secret-affair',
      'single-encounter'
    ]
  },
  {
    group: '💔 Ended', 
    types: [
      'separation',
      'divorce',
      'nullity', 
      'widowed'
    ]
  },
  {
    group: '👨‍👩‍👧‍👦 Family',
    types: [
      'sibling',
      'adoption',
      'step-relationship'
    ]
  },
  {
    group: '🧠 Emotional',
    types: [
      'close',
      'distant', 
      'conflict',
      'cutoff',
      'fused',
      'indifferent',
      'hostile',
      'hate',
      'best-friends',
      'love'
    ]
  },
  {
    group: '⚡ Complex Dynamics',
    types: [
      'toxic',
      'on-off',
      'complicated',
      'dependency',
      'codependent', 
      'manipulative',
      'supportive',
      'competitive'
    ]
  },
  {
    group: '🚨 Social Services',
    types: [
      'abusive',
      'protective',
      'caregiver',
      'financial-dependency',
      'supervised-contact'
    ]
  }
];

export const RELATIONSHIP_COLORS = {
  // Positive relationships
  'marriage': '#ec4899',
  'love': '#ec4899',
  'single-encounter': '#d946ef',
  'best-friends': '#10b981',
  'supportive': '#06d6a0',
  'close': '#3b82f6',
  'protective': '#10b981',
  'caregiver': '#ec4899',
  
  // Negative relationships  
  'conflict': '#dc2626',
  'toxic': '#7c2d12',
  'hate': '#991b1b',
  'hostile': '#dc2626',
  'manipulative': '#9333ea',
  'abusive': '#dc2626',
  
  // Neutral/Complex
  'complicated': '#f59e0b',
  'on-off': '#f97316', 
  'competitive': '#8b5cf6',
  'dependency': '#6366f1',
  'codependent': '#6366f1',
  'indifferent': '#6b7280',
  'distant': '#9ca3af',
  'financial-dependency': '#10b981',
  'supervised-contact': '#f59e0b',
  
  // Family
  'sibling': '#3b82f6',
  'adoption': '#06b6d4',
  'step-relationship': '#0891b2',
  
  // Status changes
  'cutoff': '#dc2626',
  'separation': '#f59e0b',
  'divorce': '#dc2626'
};

export const RELATIONSHIP_DESCRIPTIONS = {
  // Romantic
  'marriage': 'Legal marriage or committed partnership',
  'engagement': 'Engaged to be married',
  'cohabitation': 'Living together unmarried',
  'partner': 'Romantic partner',
  'dating': 'Dating relationship',
  'love-affair': 'Romantic affair',
  'secret-affair': 'Secret romantic relationship',
  'single-encounter': 'One-time romantic or intimate encounter',
  
  // Ended
  'separation': 'Separated but not divorced',
  'divorce': 'Legally divorced',
  'nullity': 'Marriage annulled',
  'widowed': 'Spouse deceased',
  
  // Family
  'sibling': 'Brother or sister relationship',
  'adoption': 'Adopted child relationship',
  'step-relationship': 'Step-family relationship',
  'child': 'Parent-child relationship',
  
  // Emotional
  'close': 'Very close emotional bond',
  'distant': 'Emotionally distant or estranged',
  'conflict': 'Frequent conflict or tension',
  'cutoff': 'No contact or communication',
  'fused': 'Enmeshed or overly close',
  'indifferent': 'Apathetic or neutral',
  'hostile': 'Openly hostile or aggressive',
  'hate': 'Strong negative feelings',
  'best-friends': 'Very close friendship',
  'love': 'Strong loving bond',
  
  // Complex Dynamics
  'toxic': 'Harmful or destructive relationship',
  'on-off': 'Unstable, breaks up and reunites',
  'complicated': 'Complex, hard to define',
  'dependency': 'One person dependent on other',
  'codependent': 'Mutually dependent in unhealthy way',
  'manipulative': 'One person manipulates the other',
  'supportive': 'Healthy supportive relationship',
  'competitive': 'Competitive dynamic between parties',
  
  // Social Services
  'abusive': 'Physical, emotional, or other abuse',
  'protective': 'One person protects the other',
  'caregiver': 'Caregiving relationship',
  'financial-dependency': 'Financial dependence',
  'supervised-contact': 'Contact requires supervision'
};