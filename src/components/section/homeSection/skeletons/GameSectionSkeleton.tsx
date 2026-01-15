import { Skeleton } from "@/components/ui/skeleton";

export function GameSectionSkeleton() {
    return (
        <section className="mx-auto max-w-7xl mb-16">
            {/* TABS SKELETON */}
            <div className="flex gap-2 mb-6">
                {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-32 rounded-lg" />
                ))}
            </div>

            {/* GRID SKELETON */}
            <div className="grid grid-cols-6 gap-4">
                {Array.from({ length: 12 }).map((_, i) => (
                    <Skeleton key={i} className="aspect-square rounded-lg" />
                ))}
            </div>
        </section>
    );
}
