/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
import GameCard from "./GameCard";

export default function GameGrid({ items }: any) {
  return (
    <div className="grid grid-cols-6 gap-4 mt-6">
      {items.map((item: any, index: number) => (
        <GameCard key={index} item={item} />
      ))}
    </div>
  );
}
