export const DECEASED_SYMBOL_GROUPS = [
  {
    id: 'minimal-outline',
    label: 'Gentle Treatments',
    description: 'Subtle ways to acknowledge without adding an emblem.',
    options: [
      {
        id: 'none',
        label: 'Standard',
        description: 'Use the usual look without adding a gentle treatment.',
        renderType: 'none'
      },
      {
        id: 'soft-outline',
        label: 'Soft Outline',
        description: 'Light, dashed outline around the existing shape.',
        renderType: 'outline'
      },
      // Soft fade removed because it did not produce a meaningful visual change
    ]
  },
  {
    id: 'light-celestial',
    label: 'Light & Celestial',
    description: 'Symbols that float above the person to honor their memory.',
    options: [
      {
        id: 'halo',
        label: 'Halo',
        description: 'Gentle ring placed above the person icon.',
        renderType: 'above'
      },
      {
        id: 'star',
        label: 'Star',
        description: 'A guiding star above the person.',
        renderType: 'above'
      },
      {
        id: 'sparkle',
        label: 'Sparkle',
        description: 'Small spark of light above the person.',
        renderType: 'above'
      }
    ]
  },
  {
    id: 'remembrance-badges',
    label: 'Remembrance Badges',
    description: 'Small emblems placed in the corner of the shape.',
    options: [
      {
        id: 'classic-x',
        label: 'X',
        description: 'Traditional genogram X through the symbol.',
        renderType: 'badge'
      },
      {
        id: 'heart',
        label: 'Heart',
        description: 'Heart badge to mark remembrance.',
        renderType: 'badge'
      },
      {
        id: 'flower',
        label: 'Flower',
        description: 'Gentle blossom to honor their life.',
        renderType: 'badge'
      },
      {
        id: 'butterfly',
        label: 'Butterfly',
        description: 'Symbol of transformation and remembrance.',
        renderType: 'badge'
      },
      {
        id: 'ribbon',
        label: 'Ribbon',
        description: 'Awareness ribbon badge to mark remembrance.',
        renderType: 'badge'
      },
      {
        id: 'candle',
        label: 'Candle',
        description: 'Remembrance candle shown as a small badge.',
        renderType: 'badge'
      },
      {
        id: 'angel',
        label: 'Angel',
        description: 'Soft angel wings badge for honoring the person.',
        renderType: 'badge'
      },
      {
        id: 'infinity',
        label: 'Infinity',
        description: 'Infinity loop symbolizing enduring connection.',
        renderType: 'badge'
      }
    ]
  },
  {
    id: 'faith-spiritual',
    label: 'Faith & Spirituality (Optional)',
    description: 'Faith-based symbols for families who wish to include them.',
    options: [
      {
        id: 'cross',
        label: 'Cross',
        description: 'Christian cross remembrance badge.',
        renderType: 'badge'
      },
      {
        id: 'praying-hands',
        label: 'Praying Hands',
        description: 'Hands in prayer to mark remembrance.',
        renderType: 'badge'
      },
      {
        id: 'crescent-star',
        label: 'Crescent & Star',
        description: 'Islamic crescent and star emblem.',
        renderType: 'badge'
      },
      {
        id: 'star-of-david',
        label: 'Star of David',
        description: 'Jewish Star of David emblem.',
        renderType: 'badge'
      },
      {
        id: 'dharma-wheel',
        label: 'Dharma Wheel',
        description: 'Buddhist dharma wheel badge.',
        renderType: 'badge'
      }
    ]
  }
];

export const DECEASED_SYMBOL_OPTIONS = DECEASED_SYMBOL_GROUPS.flatMap(group =>
  group.options.map(option => ({ ...option, groupId: group.id }))
);

export const DECEASED_SYMBOL_RENDER_MAP = DECEASED_SYMBOL_OPTIONS.reduce((acc, option) => {
  acc[option.id] = option.renderType;
  return acc;
}, {});

export const DECEASED_SYMBOLS_BY_TYPE = DECEASED_SYMBOL_OPTIONS.reduce((acc, option) => {
  const type = option.renderType || 'none';
  if (!acc[type]) acc[type] = [];
  acc[type].push(option.id);
  return acc;
}, {});
