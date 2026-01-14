import {
  Activity,
  AlertCircle,
  Ambulance,
  Apple,
  Baby,
  Backpack,
  Book,
  BookOpen,
  Brain,
  Briefcase,
  Building,
  Building2,
  Bus,
  Car,
  Caravan,
  Castle,
  Church,
  CircleDot,
  CloudRain,
  Construction,
  DollarSign,
  DoorOpen,
  FileText,
  Flame,
  Flower2,
  Gavel,
  Globe,
  HandHeart,
  Handshake,
  Heart,
  HeartHandshake,
  Home,
  Hospital,
  Hotel,
  Info,
  Key,
  Landmark,
  GraduationCap,
  LifeBuoy,
  MapPin,
  Megaphone,
  MessageCircle,
  Moon,
  Mountain,
  PartyPopper,
  Phone,
  Pill,
  Podcast,
  Puzzle,
  Radio,
  Scale,
  School,
  Shield,
  ShieldCheck,
  Shirt,
  ShoppingBasket,
  Sofa,
  Sparkles,
  Stethoscope,
  Star,
  Target,
  Tent,
  Trees,
  Users,
  UsersRound,
  UtensilsCrossed,
  Wallet,
  Warehouse,
  XCircle,
  PiggyBank,
  House
} from 'lucide-react';

export const NODE_ICON_CATEGORIES = [
  {
    id: 'organizations',
    label: 'Organizations & Agencies',
    icons: [
      { id: 'organizations-radio', value: 'radio', label: 'Agency / Program', Icon: Radio, tags: ['organization', 'program', 'broadcast'] },
      { id: 'organizations-podcast', value: 'podcast', label: 'Community Program', Icon: Podcast, tags: ['community', 'program'] },
      { id: 'organizations-building2', value: 'building2', label: 'Organization', Icon: Building2, tags: ['organization', 'agency'] },
      { id: 'organizations-landmark', value: 'landmark', label: 'Institution', Icon: Landmark, tags: ['institution', 'government'] },
      { id: 'organizations-shield', value: 'shield', label: 'Protective Services', Icon: Shield, tags: ['safety', 'protection'] }
    ]
  },
  {
    id: 'healthcare',
    label: 'Healthcare',
    icons: [
      { id: 'healthcare-hospital', value: 'hospital', label: 'Hospital', Icon: Hospital, tags: ['health', 'hospital'] },
      { id: 'healthcare-stethoscope', value: 'stethoscope', label: 'Medical Care', Icon: Stethoscope, tags: ['medical', 'clinic'] },
      { id: 'healthcare-heart', value: 'heart', label: 'Health Services', Icon: Heart, tags: ['health', 'care'] },
      { id: 'healthcare-pill', value: 'pill', label: 'Pharmacy / Medication', Icon: Pill, tags: ['pharmacy', 'medication'] },
      { id: 'healthcare-ambulance', value: 'ambulance', label: 'Emergency Services', Icon: Ambulance, tags: ['emergency', 'response'] },
      { id: 'healthcare-activity', value: 'activity', label: 'Health Monitoring', Icon: Activity, tags: ['monitoring', 'vitals'] }
    ]
  },
  {
    id: 'mentalHealth',
    label: 'Mental Health & Therapy',
    icons: [
      { id: 'mental-brain', value: 'brain', label: 'Mental Health', Icon: Brain, tags: ['mental-health', 'neuro'] },
      { id: 'mental-sparkles', value: 'sparkles', label: 'Therapy / Counseling', Icon: Sparkles, tags: ['therapy', 'support'] },
  { id: 'mental-heart-handshake', value: 'hearthandshake', label: 'Support Services', Icon: HeartHandshake, tags: ['support', 'relationship'] },
      { id: 'mental-message-circle', value: 'messagecircle', label: 'Talk Therapy', Icon: MessageCircle, tags: ['talk', 'therapy'] }
    ]
  },
  {
    id: 'education',
    label: 'Education',
    icons: [
      { id: 'education-school', value: 'school', label: 'School', Icon: School, tags: ['education', 'school'] },
      { id: 'education-graduation', value: 'graduationcap', label: 'Education Program', Icon: GraduationCap, tags: ['graduation', 'program'] },
      { id: 'education-book-open', value: 'bookopen', label: 'Learning / Tutoring', Icon: BookOpen, tags: ['learning', 'tutoring'] },
      { id: 'education-apple', value: 'apple', label: 'Early Childhood', Icon: Apple, tags: ['early-childhood', 'nutrition'] },
      { id: 'education-backpack', value: 'backpack', label: 'Youth Program', Icon: Backpack, tags: ['youth', 'program'] }
    ]
  },
  {
    id: 'legal',
    label: 'Legal & Court',
    icons: [
      { id: 'legal-scale', value: 'scale', label: 'Court / Legal', Icon: Scale, tags: ['legal', 'court'] },
      { id: 'legal-gavel', value: 'gavel', label: 'Judge / Judiciary', Icon: Gavel, tags: ['judge', 'court'] },
      { id: 'legal-file-text', value: 'filetext', label: 'Legal Services', Icon: FileText, tags: ['legal', 'services'] },
      { id: 'legal-shield-check', value: 'shieldcheck', label: 'Guardian Ad Litem', Icon: ShieldCheck, tags: ['guardian', 'advocate'] }
    ]
  },
  {
    id: 'religious',
    label: 'Religious & Spiritual',
    icons: [
      { id: 'religious-church', value: 'church', label: 'Church / Christian', Icon: Church, tags: ['religion', 'church'] },
      { id: 'religious-moon', value: 'moon', label: 'Mosque / Islamic', Icon: Moon, tags: ['religion', 'islam'] },
      { id: 'religious-star', value: 'star', label: 'Jewish / Synagogue', Icon: Star, tags: ['religion', 'synagogue'] },
      { id: 'religious-flower2', value: 'flower2', label: 'Hindu / Temple', Icon: Flower2, tags: ['religion', 'hindu'] },
      { id: 'religious-flame', value: 'flame', label: 'Spiritual Practice', Icon: Flame, tags: ['spiritual', 'practice'] },
      { id: 'religious-mountain', value: 'mountain', label: 'Buddhist / Meditation', Icon: Mountain, tags: ['meditation', 'buddhist'] },
      { id: 'religious-tent', value: 'tent', label: 'Indigenous / Cultural', Icon: Tent, tags: ['cultural', 'indigenous'] },
      { id: 'religious-hand-heart', value: 'handheart', label: 'Faith Community', Icon: HandHeart, tags: ['faith', 'community'] },
  { id: 'religious-heart-handshake', value: 'hearthandshake', label: 'Spiritual Support', Icon: HeartHandshake, tags: ['support', 'spiritual'] },
      { id: 'religious-book', value: 'book', label: 'Religious Education', Icon: Book, tags: ['education', 'faith'] },
      { id: 'religious-users', value: 'users', label: 'Congregation', Icon: Users, tags: ['community', 'group'] }
    ]
  },
  {
    id: 'employment',
    label: 'Employment & Financial',
    icons: [
      { id: 'employment-briefcase', value: 'briefcase', label: 'Employment / Work', Icon: Briefcase, tags: ['work', 'employment'] },
      { id: 'employment-wallet', value: 'wallet', label: 'Financial Services', Icon: Wallet, tags: ['financial', 'services'] },
      { id: 'employment-dollar', value: 'dollarsign', label: 'Financial Assistance', Icon: DollarSign, tags: ['assistance', 'financial'] },
      { id: 'employment-piggybank', value: 'piggybank', label: 'Benefits / Aid', Icon: PiggyBank, tags: ['benefits', 'aid'] }
    ]
  },
  {
    id: 'housing',
    label: 'Housing',
    icons: [
      { id: 'housing-home', value: 'home', label: 'Stable Housing', Icon: Home, tags: ['housing', 'stable'] },
      { id: 'housing-house', value: 'house', label: 'Residence / Household', Icon: House, tags: ['housing', 'residence'] },
      { id: 'housing-building', value: 'building', label: 'Apartment / Complex', Icon: Building, tags: ['housing', 'apartment'] },
  { id: 'housing-building2', value: 'building2', label: 'Shelter / Facility', Icon: Building2, tags: ['shelter', 'facility'] },
  { id: 'housing-tent', value: 'tent', label: 'Temporary Shelter', Icon: Tent, tags: ['temporary', 'shelter'] },
      { id: 'housing-hotel', value: 'hotel', label: 'Transitional Housing', Icon: Hotel, tags: ['transitional', 'housing'] },
      { id: 'housing-warehouse', value: 'warehouse', label: 'Group Home', Icon: Warehouse, tags: ['group-home', 'housing'] },
      { id: 'housing-castle', value: 'castle', label: 'Foster Home', Icon: Castle, tags: ['foster', 'home'] },
      { id: 'housing-trees', value: 'trees', label: 'Rural / Land-based', Icon: Trees, tags: ['rural', 'land'] },
      { id: 'housing-caravan', value: 'caravan', label: 'Mobile / RV Housing', Icon: Caravan, tags: ['mobile', 'rv'] },
      { id: 'housing-key', value: 'key', label: 'Housing Access Program', Icon: Key, tags: ['access', 'housing'] },
      { id: 'housing-door-open', value: 'dooropen', label: 'Housing Navigation', Icon: DoorOpen, tags: ['navigation', 'housing'] },
      { id: 'housing-construction', value: 'construction', label: 'Unstable Housing', Icon: Construction, tags: ['unstable', 'housing'] },
      { id: 'housing-cloud-rain', value: 'cloudrain', label: 'Homeless / Unhoused', Icon: CloudRain, tags: ['homeless', 'unhoused'] },
  { id: 'housing-users', value: 'users', label: 'Kinship Care Home', Icon: Users, tags: ['kinship', 'care'] },
      { id: 'housing-sofa', value: 'sofa', label: 'Couch Surfing', Icon: Sofa, tags: ['temporary', 'housing'] }
    ]
  },
  {
    id: 'community',
    label: 'Community & Social',
    icons: [
  { id: 'community-users', value: 'users', label: 'Support Group', Icon: Users, tags: ['support', 'group'] },
      { id: 'community-users-round', value: 'usersround', label: 'Community Hub', Icon: UsersRound, tags: ['community', 'hub'] },
      { id: 'community-handshake', value: 'handshake', label: 'Mentorship', Icon: Handshake, tags: ['mentorship', 'support'] },
      { id: 'community-megaphone', value: 'megaphone', label: 'Advocacy', Icon: Megaphone, tags: ['advocacy', 'voice'] },
      { id: 'community-party-popper', value: 'partypopper', label: 'Recreation', Icon: PartyPopper, tags: ['recreation', 'celebration'] }
    ]
  },
  {
    id: 'recovery',
    label: 'Substance Abuse & Recovery',
    icons: [
      { id: 'recovery-circle-dot', value: 'circledot', label: 'Recovery Program', Icon: CircleDot, tags: ['recovery', 'program'] },
      { id: 'recovery-lifebuoy', value: 'lifebuoy', label: 'Crisis Support', Icon: LifeBuoy, tags: ['crisis', 'support'] },
      { id: 'recovery-target', value: 'target', label: 'Treatment Program', Icon: Target, tags: ['treatment', 'program'] }
    ]
  },
  {
    id: 'transportation',
    label: 'Transportation',
    icons: [
      { id: 'transport-car', value: 'car', label: 'Transportation', Icon: Car, tags: ['transport', 'vehicle'] },
      { id: 'transport-bus', value: 'bus', label: 'Public Transit', Icon: Bus, tags: ['transit', 'bus'] }
    ]
  },
  {
    id: 'basicNeeds',
    label: 'Food & Basic Needs',
    icons: [
      { id: 'basic-utensils', value: 'utensilscrossed', label: 'Food Services', Icon: UtensilsCrossed, tags: ['food', 'services'] },
      { id: 'basic-shopping', value: 'shoppingbasket', label: 'Food Bank', Icon: ShoppingBasket, tags: ['food', 'bank'] },
      { id: 'basic-shirt', value: 'shirt', label: 'Clothing / Basic Needs', Icon: Shirt, tags: ['clothing', 'needs'] }
    ]
  },
  {
    id: 'childServices',
    label: 'Child Specific',
    icons: [
      { id: 'child-baby', value: 'baby', label: 'Childcare', Icon: Baby, tags: ['childcare', 'infant'] },
  { id: 'child-heart', value: 'heart', label: 'Foster Care', Icon: Heart, tags: ['foster', 'care'] },
      { id: 'child-puzzle', value: 'puzzle', label: 'Developmental Services', Icon: Puzzle, tags: ['development', 'services'] }
    ]
  },
  {
    id: 'general',
    label: 'General & Other',
    icons: [
      { id: 'general-mappin', value: 'mappin', label: 'Location / Place', Icon: MapPin, tags: ['location', 'place'] },
      { id: 'general-phone', value: 'phone', label: 'Hotline / Contact', Icon: Phone, tags: ['contact', 'hotline'] },
      { id: 'general-globe', value: 'globe', label: 'Online Resource', Icon: Globe, tags: ['online', 'resource'] },
      { id: 'general-info', value: 'info', label: 'Information / Resource', Icon: Info, tags: ['information', 'resource'] },
  { id: 'general-star', value: 'star', label: 'Positive Resource', Icon: Star, tags: ['positive', 'highlight'] },
      { id: 'general-alert', value: 'alertcircle', label: 'Concern / Risk', Icon: AlertCircle, tags: ['risk', 'concern'] },
      { id: 'general-xcircle', value: 'xcircle', label: 'Barrier / Negative', Icon: XCircle, tags: ['barrier', 'negative'] }
    ]
  }
];

export const NODE_ICON_LIBRARY = NODE_ICON_CATEGORIES.flatMap((category) =>
  category.icons.map((icon) => ({ ...icon, category: category.id }))
);

export const NODE_ICON_MAP = NODE_ICON_LIBRARY.reduce((acc, entry) => {
  acc[entry.value] = entry.Icon;
  return acc;
}, {});
