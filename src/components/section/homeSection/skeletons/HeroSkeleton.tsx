import { Skeleton } from "@/components/ui/skeleton";

export function HeroSkeleton() {
    return (
        <section className="bg-muted-foreground pt-38 pb-14">
            <div className="mx-auto max-w-7xl">
                <div className="flex items-stretch gap-4">
                    {/* LEFT SLIDER SKELETON */}
                    <div className="relative w-3/4 overflow-hidden rounded-2xl">
                        <Skeleton className="aspect-16/6 w-full rounded-2xl" />
                    </div>

                    {/* RIGHT CARD SKELETON */}
                    <div className="w-1/4">
                        <Skeleton className="h-full w-full rounded-2xl" />
                    </div>
                </div>
            </div>
        </section>
    );
}
