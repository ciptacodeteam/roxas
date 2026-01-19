import { Skeleton } from "@/components/ui/skeleton";

export function HeroSkeleton() {
    return (
        <section className="bg-muted-foreground pt-38 pb-14">
            <div className="mx-auto lg:max-w-7xl w-11/12">
                <div className="flex items-stretch gap-4">
                    {/* LEFT SLIDER SKELETON */}
                    <div className="relative lg:w-3/4 w-full overflow-hidden rounded-2xl">
                        <Skeleton className="aspect-16/6 w-full rounded-2xl" />
                    </div>

                    {/* RIGHT CARD SKELETON */}
                    <div className="w-1/4 lg:block hidden">
                        <Skeleton className="h-full w-full rounded-2xl" />
                    </div>
                </div>
            </div>
        </section>
    );
}
