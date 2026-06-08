import { GalleryCard } from './GalleryCard';

interface Props {
  title: string;
  items: {
    badge: string;
    emoji: string;
    name: string;
    desc: string;
    postId: number;
    category: string;
    isFavorited?: boolean;
    favoriteId?: number;
  }[];
}

export function GallerySection({ title, items }: Props) {
  return (
    <div className="gallery-section">
      <h3 className="section-title">{title}</h3>
      <div className="gallery">
        {items.map((item, i) => (
          <GalleryCard
            key={item.postId}
            badge={item.badge}
            emoji={item.emoji}
            name={item.name}
            desc={item.desc}
            index={i}
            postId={item.postId}
            category={item.category}
            isFavorited={item.isFavorited}
            favoriteId={item.favoriteId}
          />
        ))}
      </div>
    </div>
  );
}
