export const NodeType = {
  PERSON: 'person',
  ORGANIZATION: 'organization',
  SERVICE_RESOURCE: 'service_resource',
  PLACE_LOCATION: 'place_location',
  CUSTOM: 'custom'
};

export const NODE_TYPE_CONFIG = {
  [NodeType.PERSON]: {
    type: NodeType.PERSON,
    label: 'Person',
    icon: 'user',
    defaultShape: 'person-gendered',
    availableFields: [
      'name',
      'gender',
      'sexualOrientation',
      'birthDate',
      'age',
      'deathDate',
      'isDeceased',
      'deceasedSymbol',
      'deceasedGentleTreatment',
      'specialStatus',
      'isPregnant',
      'dueDate',
      'gestationalWeeks',
      'pregnancyNotes',
      'networkMember',
      'role'
    ],
    attributeCategories: []
  },
  [NodeType.ORGANIZATION]: {
    type: NodeType.ORGANIZATION,
    label: 'Organization / Agency',
    icon: 'users',
    defaultShape: 'rounded-rect',
    availableFields: [
      'name',
      'organizationType',
      'address',
      'phone',
      'hours',
      'contactPerson'
    ],
    attributeCategories: [
      'active_service',
      'referral_source',
      'collaborative_partner',
      'funding_source'
    ]
  },
  [NodeType.SERVICE_RESOURCE]: {
    type: NodeType.SERVICE_RESOURCE,
    label: 'Service / Resource',
    icon: 'heart',
    defaultShape: 'rounded-rect',
    availableFields: [
      'name',
      'serviceType',
      'eligibility',
      'cost',
      'availability'
    ],
    attributeCategories: [
      'financial',
      'food',
      'housing',
      'healthcare',
      'transportation',
      'mental_health',
      'legal',
      'employment'
    ]
  },
  [NodeType.PLACE_LOCATION]: {
    type: NodeType.PLACE_LOCATION,
    label: 'Place / Location',
    icon: 'map-pin',
    defaultShape: 'circle',
    availableFields: [
      'name',
      'address',
      'locationType',
      'accessibilityFeatures'
    ],
    attributeCategories: [
      'frequent',
      'occasional',
      'barrier',
      'accessible',
      'modified',
      'unsafe'
    ]
  },
  [NodeType.CUSTOM]: {
    type: NodeType.CUSTOM,
    label: 'Custom',
    icon: 'star',
    defaultShape: 'circle',
    availableFields: [
      'name',
      'description',
      'customFields'
    ],
    attributeCategories: []
  }
};

export const NODE_TYPE_OPTIONS = Object.values(NodeType).map((typeKey) => {
  const config = NODE_TYPE_CONFIG[typeKey];
  return {
    value: config.type,
    label: config.label,
    icon: config.icon
  };
});

export const getNodeTypeConfig = (type) => NODE_TYPE_CONFIG[type] || NODE_TYPE_CONFIG[NodeType.PERSON];
