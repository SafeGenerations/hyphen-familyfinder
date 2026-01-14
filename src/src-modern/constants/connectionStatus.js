// Connection status constants for family finding
export const ConnectionStatus = {
  CONFIRMED: 'confirmed',
  POTENTIAL: 'potential',
  EXPLORING: 'exploring',
  RULED_OUT: 'ruled-out'
};

// Placement status for child welfare case planning
export const PlacementStatus = {
  NOT_APPLICABLE: 'not_applicable',
  POTENTIAL_TEMPORARY: 'potential_temporary',
  POTENTIAL_PERMANENT: 'potential_permanent',
  CURRENT_TEMPORARY: 'current_temporary',
  CURRENT_PERMANENT: 'current_permanent',
  RULED_OUT: 'ruled_out'
};

// Care status for children in the child welfare system
export const CareStatus = {
  NOT_APPLICABLE: 'not_applicable',
  AT_RISK: 'at_risk',
  NEEDS_PLACEMENT: 'needs_placement',
  IN_CARE: 'in_care'
};

// Case goals for children in care (permanency planning)
export const CaseGoal = {
  REUNIFICATION: 'reunification',
  ADOPTION: 'adoption',
  GUARDIANSHIP: 'guardianship',
  APPLA: 'appla', // Another Planned Permanent Living Arrangement
  EMANCIPATION: 'emancipation'
};

// Foster care status for potential caregivers
export const FosterCareStatus = {
  NOT_APPLICABLE: 'not_applicable',
  INTERESTED: 'interested',
  IN_PROCESS: 'in_process',
  LICENSED: 'licensed',
  ACTIVE: 'active',
  INACTIVE: 'inactive'
};

// License types for foster caregivers
export const LicenseType = {
  FOSTER: 'foster',
  FOST_ADOPT: 'fost_adopt',
  RESPITE: 'respite',
  KINSHIP: 'kinship',
  THERAPEUTIC: 'therapeutic'
};

export const DiscoverySource = {
  WORKER_INTERVIEW: 'worker_interview',
  DOCUMENT_SEARCH: 'document_search',
  EXTERNAL_SEARCH: 'external_search',
  FAMILY_SUGGESTION: 'family_suggestion',
  PUBLIC_RECORDS: 'public_records',
  SOCIAL_MEDIA: 'social_media',
  OTHER: 'other'
};

export const CONNECTION_STATUS_CONFIG = {
  [ConnectionStatus.CONFIRMED]: {
    label: 'Confirmed',
    color: '#10b981', // green
    lineStyle: 'solid',
    description: 'Verified family connection'
  },
  [ConnectionStatus.POTENTIAL]: {
    label: 'Potential',
    color: '#f59e0b', // orange
    lineStyle: 'dashed',
    description: 'Possible connection requiring verification'
  },
  [ConnectionStatus.EXPLORING]: {
    label: 'Exploring',
    color: '#8b5cf6', // purple
    lineStyle: 'dotted',
    description: 'Actively investigating this connection'
  },
  [ConnectionStatus.RULED_OUT]: {
    label: 'Ruled Out',
    color: '#9ca3af', // gray
    lineStyle: 'dashed',
    description: 'Connection determined not viable'
  }
};

export const DISCOVERY_SOURCE_OPTIONS = [
  { value: DiscoverySource.WORKER_INTERVIEW, label: 'Worker Interview' },
  { value: DiscoverySource.DOCUMENT_SEARCH, label: 'Document Search' },
  { value: DiscoverySource.EXTERNAL_SEARCH, label: 'External Search' },
  { value: DiscoverySource.FAMILY_SUGGESTION, label: 'Family Suggestion' },
  { value: DiscoverySource.PUBLIC_RECORDS, label: 'Public Records' },
  { value: DiscoverySource.SOCIAL_MEDIA, label: 'Social Media' },
  { value: DiscoverySource.OTHER, label: 'Other' }
];

export const PLACEMENT_STATUS_CONFIG = {
  [PlacementStatus.NOT_APPLICABLE]: {
    label: 'Not a Placement Option',
    color: '#6b7280', // gray
    icon: '—',
    description: 'Not being considered for placement'
  },
  [PlacementStatus.POTENTIAL_TEMPORARY]: {
    label: 'Potential Temporary',
    color: '#3b82f6', // blue
    icon: '⏱️',
    description: 'Being evaluated for temporary placement'
  },
  [PlacementStatus.POTENTIAL_PERMANENT]: {
    label: 'Potential Permanent',
    color: '#8b5cf6', // purple
    icon: '🏠',
    description: 'Being evaluated for permanent placement'
  },
  [PlacementStatus.CURRENT_TEMPORARY]: {
    label: 'Current Temporary',
    color: '#06b6d4', // cyan
    icon: '📍',
    description: 'Child currently in temporary placement here'
  },
  [PlacementStatus.CURRENT_PERMANENT]: {
    label: 'Current Permanent',
    color: '#10b981', // green
    icon: '✓',
    description: 'Child currently in permanent placement here'
  },
  [PlacementStatus.RULED_OUT]: {
    label: 'Ruled Out for Placement',
    color: '#ef4444', // red
    icon: '✗',
    description: 'Determined unsuitable for placement'
  }
};

export const PLACEMENT_STATUS_OPTIONS = [
  { value: PlacementStatus.NOT_APPLICABLE, label: 'Not a Placement Option' },
  { value: PlacementStatus.POTENTIAL_TEMPORARY, label: 'Potential Temporary Placement' },
  { value: PlacementStatus.POTENTIAL_PERMANENT, label: 'Potential Permanent Placement' },
  { value: PlacementStatus.CURRENT_TEMPORARY, label: 'Current Temporary Placement' },
  { value: PlacementStatus.CURRENT_PERMANENT, label: 'Current Permanent Placement' },
  { value: PlacementStatus.RULED_OUT, label: 'Ruled Out for Placement' }
];

export const CARE_STATUS_CONFIG = {
  [CareStatus.NOT_APPLICABLE]: {
    label: 'Not Applicable',
    color: '#9ca3af', // gray
    icon: '—',
    description: 'Not involved in child welfare system'
  },
  [CareStatus.AT_RISK]: {
    label: 'At Risk',
    color: '#f59e0b', // orange
    icon: '⚠️',
    description: 'Child at risk, receiving preventive services'
  },
  [CareStatus.NEEDS_PLACEMENT]: {
    label: 'Needs Placement',
    color: '#ef4444', // red
    icon: '🔍',
    description: 'Child requires immediate placement'
  },
  [CareStatus.IN_CARE]: {
    label: 'In Care',
    color: '#3b82f6', // blue
    icon: '📋',
    description: 'Child currently in state custody'
  }
};

export const CARE_STATUS_OPTIONS = [
  { value: CareStatus.NOT_APPLICABLE, label: 'Not Applicable' },
  { value: CareStatus.AT_RISK, label: 'At Risk' },
  { value: CareStatus.NEEDS_PLACEMENT, label: 'Needs Placement' },
  { value: CareStatus.IN_CARE, label: 'In Care' }
];

export const CASE_GOAL_OPTIONS = [
  { value: CaseGoal.REUNIFICATION, label: 'Reunification' },
  { value: CaseGoal.ADOPTION, label: 'Adoption' },
  { value: CaseGoal.GUARDIANSHIP, label: 'Guardianship' },
  { value: CaseGoal.APPLA, label: 'APPLA (Another Planned Permanent Living Arrangement)' },
  { value: CaseGoal.EMANCIPATION, label: 'Emancipation' }
];

export const FOSTER_CARE_STATUS_CONFIG = {
  [FosterCareStatus.NOT_APPLICABLE]: {
    label: 'Not Applicable',
    color: '#9ca3af',
    icon: '—',
    description: 'Not a foster care resource'
  },
  [FosterCareStatus.INTERESTED]: {
    label: 'Interested',
    color: '#f59e0b',
    icon: '💭',
    description: 'Expressed interest in becoming foster parent'
  },
  [FosterCareStatus.IN_PROCESS]: {
    label: 'In Process',
    color: '#3b82f6',
    icon: '📋',
    description: 'Licensing application in progress'
  },
  [FosterCareStatus.LICENSED]: {
    label: 'Licensed',
    color: '#10b981',
    icon: '✓',
    description: 'Licensed and available for placement'
  },
  [FosterCareStatus.ACTIVE]: {
    label: 'Active',
    color: '#8b5cf6',
    icon: '🏠',
    description: 'Currently caring for foster child(ren)'
  },
  [FosterCareStatus.INACTIVE]: {
    label: 'Inactive',
    color: '#6b7280',
    icon: '⏸️',
    description: 'License inactive or expired'
  }
};

export const FOSTER_CARE_STATUS_OPTIONS = [
  { value: FosterCareStatus.NOT_APPLICABLE, label: 'Not Applicable' },
  { value: FosterCareStatus.INTERESTED, label: 'Interested in Fostering' },
  { value: FosterCareStatus.IN_PROCESS, label: 'Licensing In Process' },
  { value: FosterCareStatus.LICENSED, label: 'Licensed (Available)' },
  { value: FosterCareStatus.ACTIVE, label: 'Active Foster Parent' },
  { value: FosterCareStatus.INACTIVE, label: 'Inactive/Expired' }
];

export const LICENSE_TYPE_OPTIONS = [
  { value: LicenseType.FOSTER, label: 'Standard Foster Care' },
  { value: LicenseType.FOST_ADOPT, label: 'Foster-to-Adopt' },
  { value: LicenseType.RESPITE, label: 'Respite Care' },
  { value: LicenseType.KINSHIP, label: 'Kinship/Relative Care' },
  { value: LicenseType.THERAPEUTIC, label: 'Therapeutic Foster Care' }
];

export const getConnectionStatusConfig = (status) => {
  return CONNECTION_STATUS_CONFIG[status] || CONNECTION_STATUS_CONFIG[ConnectionStatus.CONFIRMED];
};

export const getPlacementStatusConfig = (status) => {
  return PLACEMENT_STATUS_CONFIG[status] || PLACEMENT_STATUS_CONFIG[PlacementStatus.NOT_APPLICABLE];
};

export const getCareStatusConfig = (status) => {
  return CARE_STATUS_CONFIG[status] || CARE_STATUS_CONFIG[CareStatus.NOT_APPLICABLE];
};

export const getFosterCareStatusConfig = (status) => {
  return FOSTER_CARE_STATUS_CONFIG[status] || FOSTER_CARE_STATUS_CONFIG[FosterCareStatus.NOT_APPLICABLE];
};
