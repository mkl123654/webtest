import { GalleryCard } from './GalleryCard';

interface Item {
  badge: string;
  emoji: string;
  name: string;
  desc: string;
  postId: number;
  category: string;
}

interface Props {
  title: string;
  items: Item[];
}

export function GallerySection({ title, items }: Props) {
  return (
    <div className="gallery-section">
      <h3 className="section-title">{title}</h3>
      <div className="gallery">
        {items.map((item, i) => (
          <GalleryCard key={item.postId} {...item} index={i} />
        ))}
      </div>
    </div>
  );
}
