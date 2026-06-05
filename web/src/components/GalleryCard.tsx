import Link from 'next/link';

interface Props {
  badge: string;
  emoji: string;
  name: string;
  desc: string;
  index: number;
  postId: number;
  category: string;
}

export function GalleryCard({ badge, emoji, name, desc, index, postId, category }: Props) {
  return (
    <Link href={`/${category}/${postId}`} className="gallery-card" style={{ textDecoration: 'none' }}>
      <div className="img" style={{ '--i': index } as React.CSSProperties}>
        <span className="badge">{badge}</span>
        {emoji}
      </div>
      <div className="caption">
        {name}
        <small>{desc}</small>
      </div>
    </Link>
  );
}
