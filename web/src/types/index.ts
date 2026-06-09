export interface GalleryItem {
  badge: string;
  emoji: string;
  name: string;
  desc: string;
}

export interface GallerySectionData {
  title: string;
  items: GalleryItem[];
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface CategoryData {
  id: number;
  key: string;
  label: string;
  icon: string;
  sortOrder: number;
  group: { id: number; key: string; label: string };
}

export interface CategoryGroupData {
  id: number;
  key: string;
  label: string;
  categories: CategoryData[];
}
