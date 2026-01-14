// Relationship Attributes/Tags for multi-faceted relationships
// These can be combined with any relationship type (e.g., "marriage" + "violent")

export const RELATIONSHIP_ATTRIBUTES = {
  // Safety & Risk Attributes
  safety: {
    label: '⚠️ Safety & Risk',
    attributes: [
      { id: 'violent', label: 'Violent', color: '#dc2626', icon: '⚡' },
      { id: 'abusive', label: 'Abusive', color: '#991b1b', icon: '⚠️' },
      { id: 'controlling', label: 'Controlling', color: '#9f1239', icon: '🔒' },
      { id: 'manipulative', label: 'Manipulative', color: '#be123c', icon: '🎭' },
      { id: 'neglectful', label: 'Neglectful', color: '#c2410c', icon: '👁️' }
    ]
  },

  // Positive/Supportive Attributes
  positive: {
    label: '💚 Positive Dynamics',
    attributes: [
      { id: 'supportive', label: 'Supportive', color: '#059669', icon: '🤝' },
      { id: 'protective', label: 'Protective', color: '#0d9488', icon: '🛡️' },
      { id: 'nurturing', label: 'Nurturing', color: '#10b981', icon: '💚' },
      { id: 'loving', label: 'Loving', color: '#ec4899', icon: '❤️' },
      { id: 'close', label: 'Close', color: '#8b5cf6', icon: '🤗' }
    ]
  },

  // Negative/Toxic Attributes (non-violent)
  negative: {
    label: '⚠️ Negative Dynamics',
    attributes: [
      { id: 'toxic', label: 'Toxic', color: '#ca8a04', icon: '☠️' },
      { id: 'conflictual', label: 'Conflictual', color: '#d97706', icon: '💥' },
      { id: 'distant', label: 'Distant', color: '#64748b', icon: '↔️' },
      { id: 'hostile', label: 'Hostile', color: '#dc2626', icon: '😠' },
      { id: 'codependent', label: 'Codependent', color: '#a855f7', icon: '🔗' }
    ]
  },

  // Power & Control Attributes
  power: {
    label: '⚖️ Power Dynamics',
    attributes: [
      { id: 'dominant', label: 'Dominant', color: '#7c3aed', icon: '👑' },
      { id: 'submissive', label: 'Submissive', color: '#9333ea', icon: '🙇' },
      { id: 'financial-control', label: 'Financial Control', color: '#0891b2', icon: '💰' },
      { id: 'emotional-dependency', label: 'Emotional Dependency', color: '#8b5cf6', icon: '💔' }
    ]
  },

  // Communication Attributes
  communication: {
    label: '💬 Communication',
    attributes: [
      { id: 'poor-communication', label: 'Poor Communication', color: '#737373', icon: '🚫' },
      { id: 'open', label: 'Open Communication', color: '#14b8a6', icon: '💬' },
      { id: 'avoidant', label: 'Avoidant', color: '#6b7280', icon: '🙈' }
    ]
  },

  // Professional/Supervised Attributes
  professional: {
    label: '👨‍⚕️ Professional/Supervised',
    attributes: [
      { id: 'supervised', label: 'Supervised Contact', color: '#0284c7', icon: '👁️' },
      { id: 'court-ordered', label: 'Court Ordered', color: '#1e40af', icon: '⚖️' },
      { id: 'therapeutic', label: 'Therapeutic', color: '#0891b2', icon: '🩺' }
    ]
  }
};

// Get all attributes as a flat array
export const getAllAttributes = () => {
  const allAttrs = [];
  Object.keys(RELATIONSHIP_ATTRIBUTES).forEach(categoryKey => {
    RELATIONSHIP_ATTRIBUTES[categoryKey].attributes.forEach(attr => {
      allAttrs.push(attr);
    });
  });
  return allAttrs;
};

// Get attribute by ID (supports both built-in and custom)
export const getAttributeById = (id, customAttributes = []) => {
  // Check if it's a custom attribute (custom attributes have format "custom-xxx")
  if (id.startsWith('custom-')) {
    return customAttributes.find(attr => attr.id === id);
  }

  // Otherwise, look in built-in attributes
  const allAttrs = getAllAttributes();
  return allAttrs.find(attr => attr.id === id);
};

// Get attribute color (supports custom)
export const getAttributeColor = (id, customAttributes = []) => {
  const attr = getAttributeById(id, customAttributes);
  return attr ? attr.color : '#64748b';
};

// Get attribute icon (supports custom)
export const getAttributeIcon = (id, customAttributes = []) => {
  const attr = getAttributeById(id, customAttributes);
  return attr ? attr.icon : '•';
};

// Common emoji/symbols for quick selection
export const COMMON_ATTRIBUTE_ICONS = [
  '•', '⚠️', '❤️', '💚', '💙', '💛', '🧡', '💜',
  '⚡', '🔒', '🎭', '🤝', '🛡️', '☠️', '💥', '↔️',
  '😠', '🔗', '👑', '🙇', '💰', '💔', '🚫', '💬',
  '🙈', '👁️', '⚖️', '🩺', '✨', '🌟', '⭐', '💫',
  '🔥', '❄️', '🌊', '🌈', '☀️', '🌙', '⚠', '✓',
  '✗', '?', '!', '♥', '★', '◆', '●', '■'
];
