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

export type TabKey = 'food' | 'travel' | 'fun';
