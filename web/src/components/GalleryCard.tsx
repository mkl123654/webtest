interface Props {
  badge: string;
  emoji: string;
  name: string;
  desc: string;
  index: number;
}

export function GalleryCard({ badge, emoji, name, desc, index }: Props) {
  return (
    <div className="gallery-card">
      <div className="img" style={{ '--i': index } as React.CSSProperties}>
        <span className="badge">{badge}</span>
        {emoji}
      </div>
      <div className="caption">
        {name}
        <small>{desc}</small>
      </div>
    </div>
  );
}
