// ─── Database Types ─────────────────────────────────────

export type UserRole = 'super_admin' | 'admin' | 'member';

export type RSVPStatus = 'attending' | 'declined';

export type Course = 'appetizer' | 'main' | 'side' | 'dessert';

export type Allergen = 'nuts' | 'dairy' | 'gluten' | 'eggs' | 'shellfish' | 'soy';

export interface Profile {
  id: string;
  name: string;
  avatar_url: string | null;
  dietary_restrictions: string[];
  role: UserRole;
  created_at: string;
}

export interface Event {
  id: string;
  title: string;
  volume_number: number;
  date: string;
  event_time: string | null;
  location: string | null;
  cookbook_id: string | null;
  color_theme: string | null; // JSON string of color overrides
  lock_time: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Cookbook {
  id: string;
  name: string;
  cover_url: string | null;
  pdf_url: string | null;
  event_id: string;
  created_at: string;
}

export interface Recipe {
  id: string;
  cookbook_id: string;
  name: string;
  page_number: number | null;
  course: Course;
  allergens: Allergen[];
  is_vegetarian: boolean;
  is_vegan: boolean;
  created_at: string;
}

export interface RSVP {
  id: string;
  event_id: string;
  user_id: string;
  status: RSVPStatus;
  course_preference: Course | null;
  partner_ids: string[];
  created_at: string;
}

export interface Claim {
  id: string;
  event_id: string;
  recipe_id: string | null;
  user_id: string;
  is_suggestion: boolean;
  suggestion_name: string | null;
  suggestion_course: Course | null;
  suggestion_allergens: Allergen[] | null;
  suggestion_is_vegetarian: boolean | null;
  created_at: string;
}

// ─── Joined / View Types ────────────────────────────────

export interface ClaimWithDetails extends Claim {
  recipe?: Recipe;
  profile?: Profile;
}

export interface RecipeWithClaim extends Recipe {
  claim?: ClaimWithDetails | null;
}

export interface EventWithCookbook extends Event {
  cookbook?: Cookbook;
}

export interface GuestInfo {
  profile: Profile;
  rsvp: RSVP;
  claim?: ClaimWithDetails;
}

// ─── Dietary Emoji Map ──────────────────────────────────

export const DIETARY_OPTIONS: { label: string; emoji: string; value: string }[] = [
  { label: 'Vegetarian', emoji: '🥦', value: 'vegetarian' },
  { label: 'Vegan', emoji: '🌱', value: 'vegan' },
  { label: 'Pescatarian', emoji: '🐟', value: 'pescatarian' },
  { label: 'Gluten-Free', emoji: '🌾', value: 'gluten-free' },
  { label: 'Dairy-Free', emoji: '🥛', value: 'dairy-free' },
  { label: 'Nut Allergy', emoji: '🥜', value: 'nut-allergy' },
  { label: 'Egg-Free', emoji: '🍳', value: 'egg-free' },
  { label: 'Halal', emoji: '🐄', value: 'halal' },
  { label: 'Kosher', emoji: '✡️', value: 'kosher' },
  { label: 'No Restrictions', emoji: '🚫', value: 'no-restrictions' },
];

export const ALLERGEN_EMOJI: Record<Allergen, string> = {
  nuts: '🥜',
  dairy: '🥛',
  gluten: '🌾',
  eggs: '🍳',
  shellfish: '🦐',
  soy: '🫘',
};

export const COURSE_ORDER: Course[] = ['appetizer', 'main', 'side', 'dessert'];

export const COURSE_QUOTAS: Record<Course, number> = {
  appetizer: 3,
  main: 3,
  side: 3,
  dessert: 1,
};

export const COURSE_LABELS: Record<Course, string> = {
  appetizer: 'Appetizers',
  main: 'Mains',
  side: 'Sides',
  dessert: 'Desserts',
};

// ─── Recipe JSON Import Format ──────────────────────────

export interface RecipeImport {
  name: string;
  page_number: number | null;
  course: Course;
  allergens: Allergen[];
  is_vegetarian: boolean;
  is_vegan: boolean;
}

export interface EventImport {
  title: string;
  volume_number: number;
  date: string; // YYYY-MM-DD
  cookbook_name: string;
  cookbook_cover_url?: string;
  recipes: RecipeImport[];
}
