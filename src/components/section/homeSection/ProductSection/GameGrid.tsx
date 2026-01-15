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
    <div className="grid grid-cols-6 gap-4 mt-6">
      {items.map((item) => (
        <GameCard key={item.id} item={item} />
      ))}
    </div>
  );
}
