// Default theme colors
export const DEFAULT_THEME = {
  bg: '#FAF7F2',
  ink: '#1A1A1A',
  accent: '#C4473A',
  accentWarm: '#D4B896',
  surface: '#FFFFFF',
};

export interface ColorTheme {
  bg: string;
  ink: string;
  accent: string;
  accentWarm: string;
  surface: string;
}

// Parse a stored color_theme JSON string, falling back to defaults
export function parseTheme(colorThemeJson: string | null): ColorTheme {
  if (!colorThemeJson) return DEFAULT_THEME;
  try {
    const parsed = JSON.parse(colorThemeJson);
    return { ...DEFAULT_THEME, ...parsed };
  } catch {
    return DEFAULT_THEME;
  }
}

// Apply theme to CSS variables on the document root
export function applyTheme(theme: ColorTheme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.style.setProperty('--bg', theme.bg);
  root.style.setProperty('--ink', theme.ink);
  root.style.setProperty('--accent', theme.accent);
  root.style.setProperty('--accent-warm', theme.accentWarm);
  root.style.setProperty('--surface', theme.surface);
}

// Reset to default theme
export function resetTheme() {
  applyTheme(DEFAULT_THEME);
}

// Format volume number to roman numeral
export function toRoman(num: number): string {
  const lookup: [number, string][] = [
    [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
    [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
  ];
  let result = '';
  for (const [value, numeral] of lookup) {
    while (num >= value) {
      result += numeral;
      num -= value;
    }
  }
  return result;
}

// Format date for invite card: "Saturday, the 22nd of March"
export function formatInviteDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const dayName = days[date.getDay()];
  const day = date.getDate();
  const month = months[date.getMonth()];

  const suffix = getOrdinalSuffix(day);
  return `${dayName}, the ${day}${suffix} of ${month}`;
}

function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

// Get dietary emoji string for a user
export function getDietaryEmoji(restrictions: string[]): string {
  const emojiMap: Record<string, string> = {
    'vegetarian': '🥦',
    'vegan': '🌱',
    'pescatarian': '🐟',
    'gluten-free': '🌾',
    'dairy-free': '🥛',
    'nut-allergy': '🥜',
    'egg-free': '🍳',
    'halal': '🐄',
    'kosher': '✡️',
    'no-restrictions': '🚫',
  };

  if (!restrictions || restrictions.length === 0) return '';
  return restrictions.map(r => emojiMap[r] || '').join('');
}
