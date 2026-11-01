import { EmojiData, EmojiStyle } from '@/constants';

export type NavItem = 'Home' | 'Apps' | 'Emoji' | 'Icons' | 'Contribute';

export type Price = 'Free' | 'FOSS' | 'Paid';
export type Tag = 'WD' | 'WDM' | 'WDA' | 'WM';

export interface AppData {
  tag: Tag | string;
  tags?: (Tag | string)[];
  name: string;
  link: string;
  price: Price;
  logo_url?: string;
  original_logo_url?: string;
}

export type Emoji = EmojiData & { name: string };

export type IconStyleType = 'Filled' | 'Regular' | 'Color';

export type IconType = {
  filename: any;
  svgFileName: any;
  name: string;
  styles: {
    filled?: { [size: string]: string };
    regular?: { [size:string]: string };
    color?: { [size: string]: string };
  };
};

export interface CategoryNode {
  id: string;
  label: string;
  icon?: string;
  children: CategoryNode[];
}

export type SubSection = {
  heading: string;
  icon_url?: string | null;
  apps: AppData[];
};

export type SubGroup = {
  subheading: string;
  apps: AppData[];
  icon_url?: string | null;
  sections?: SubSection[];
};

export type ContentGroup = {
  heading: string;
  subgroups: SubGroup[];
};

// ──────────────────────── Collection Types ────────────────────────

export type CollectionItemType = 'emoji' | 'icon' | 'app';

export interface CollectionEmoji extends EmojiData {
  name: string;
  style: keyof EmojiStyle;
}

export interface CollectionIcon extends IconType {
  style: IconStyleType;
}

export interface CollectionApp extends AppData {}

export type CollectionItem =
  | (CollectionEmoji & { itemType: 'emoji' })
  | (CollectionIcon & { itemType: 'icon' })
  | (CollectionApp & { itemType: 'app' });

export interface Collections {
  [collectionName: string]: CollectionItem[];
}

/* --------------------------------------------------------------
   Helper used by the context functions.
   It keeps the `style` field for icons while removing `itemType`.
   -------------------------------------------------------------- */
export type CollectionItemPayload =
  Omit<CollectionItem, "itemType">;