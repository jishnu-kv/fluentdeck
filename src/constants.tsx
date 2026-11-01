// Interfaces for emoji data from JSON
export interface EmojiStyle {
  '3D'?: string;
  'Color'?: string;
  'Flat'?: string;
  'High Contrast'?: string;
  'Animated'?: string;
}

export interface EmojiData {
  glyph: string;
  group: string;
  keywords: string[];
  unicode: string;
  styles?: EmojiStyle;
}

export interface EmojiMap {
  [name: string]: EmojiData;
}

// Interfaces for emoji data from JSON
export const emojiCategories = [
  { value: 'All', label: 'All Categories', icon: '🌐' },
  { value: 'Smileys & Emotion', label: 'Smileys', icon: '😀' },
  { value: 'People & Body', label: 'People', icon: '🧑' },
  { value: 'Animals & Nature', label: 'Animals', icon: '🐻' },
  { value: 'Food & Drink', label: 'Food', icon: '🍔' },
  { value: 'Activities', label: 'Activity', icon: '⚽' },
  { value: 'Travel & Places', label: 'Travel', icon: '🚀' },
  { value: 'Objects', label: 'Objects', icon: '💡' },
  { value: 'Symbols', label: 'Symbols', icon: '❤️' },
  { value: 'Flags', label: 'Flags', icon: '🏳️' },
];

// Interfaces for emoji data from JSON
export const emojiStyles: { value: keyof EmojiStyle; label: string; tooltip: string }[] = [
  { value: '3D', label: '3D', tooltip: 'Emojis with a modern, three-dimensional look' },
  { value: 'Animated', label: 'Animated', tooltip: 'Animated versions of the emojis' },
  { value: 'Color', label: 'Modern', tooltip: 'Classic, vibrant, and detailed two-dimensional style' },
  { value: 'Flat', label: 'Flat', tooltip: 'Minimalist, simplified two-dimensional style' },
  { value: 'High Contrast', label: 'Mono', tooltip: 'Black and white or single-color outline style' },
];

export interface IconsStyle {
  'Filled'?: string;
  'Regular'?: string;
  'Color'?: string;
}

// Interfaces for icon data from JSON
export const iconStyles: { value: string; label: string; tooltip: string }[] = [
  { value: 'Filled', label: 'Filled', tooltip: 'Solid, bold shapes ideal for UI emphasis' },
  { value: 'Regular', label: 'Regular', tooltip: 'Lightweight outlines designed for general UI usage' },
  { value: 'Color', label: 'Color', tooltip: 'Full-color icons meant for expressive visuals' },
];

// App Filter Options
export const priceOptions = [
  { value: 'All Pricing', label: 'All Pricing', tooltip: 'Show all apps regardless of price' },
  { value: 'Free', label: 'Free', tooltip: 'Apps that cost nothing' },
  { value: 'FOSS', label: 'FOSS', tooltip: 'Free and open-source software' },
  { value: 'Paid', label: 'Paid', tooltip: 'Apps that require payment' },
];

export const tagOptions = [
  { value: 'All tags', label: 'All tags', tooltip: 'Show apps from every category' },
  { value: 'WD', label: 'WD', tooltip: 'WinUI 3 design language' },
  { value: 'WDM', label: 'WDM', tooltip: 'Uses Mica material' },
  { value: 'WDA', label: 'WDA', tooltip: 'Uses Acrylic material' },
];

// Local data paths
export const APPS_LOCAL_URL = '/data/apps-data.json';
export const CATEGORY_METADATA_URL = '/data/category-metadata.json';
export const CHANGELOG_LOCAL_URL = '/data/changelog.json';
export const CONTRIBUTORS_LOCAL_URL = '/data/contributors.json';

// Consolidated emoji and icon metadata paths
export const EMOJI_METADATA_URL = '/data/emoji_metadata.json';
export const ICON_METADATA_URL = '/data/icon_metadata.json';

// Consolidated emoji and icon metadata paths
export const EMOJI_URL = '/data/emoji_url.json';
export const ICON_URL = '/data/icon_url.json';

// Asset URLs
export const DECK_ASSETS_BASE_URL = '/';
export const EMOJI_ASSET_URL_BASE = 'https://fluentdeck.vercel.app/';

// Social & Support URLs
export const GITHUB_PROFILE_URL = 'https://github.com/jishnu-kv/';
export const BEHANCE_URL = 'https://www.behance.net/jishnukv1';
export const LINKEDIN_URL = 'https://www.linkedin.com/in/jishnu-kv-b7a4232aa/?trk=opento_sprofile_details';
export const GUMROAD_URL = 'https://jishnukv.gumroad.com/';
export const SOURCE_CODE_URL = 'https://github.com/jishnu-kv/fluentdeck';
export const BUY_ME_A_COFFEE_URL = 'https://buymeacoffee.com/jishnujithu';
export const NEW_PULL_REQUEST_URL = 'https://github.com/jishnu-kv/WinUI-Apps-List/pulls';