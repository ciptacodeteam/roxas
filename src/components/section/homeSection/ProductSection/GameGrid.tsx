import GameCard from "./GameCard";

interface GameItem {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  slug: string;
}

interface GameGridProps {
  items: GameItem[];
}

export default function GameGrid({ items }: GameGridProps) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <div className="grid lg:grid-cols-6 grid-cols-3 lg:gap-4 gap-3 mt-6">
      {items.map((item) => (
        <GameCard key={item.id} item={item} />
      ))}
    </div>
  );
}
