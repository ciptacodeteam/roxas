import { Skeleton } from "@/components/ui/skeleton";

export function FlashSaleSectionSkeleton() {
    return (
        <section>
            <div className="mx-auto mt-12 max-w-7xl mb-16">
                <div className="bg-card rounded-xl">
                    <div className="flex items-center justify-between p-8">
                        <div>
                            <div className="mb-2 flex gap-2 text-3xl">
                                <Skeleton className="w-8 h-8" />
                                <Skeleton className="h-8 w-40" />
                            </div>
                            <Skeleton className="h-5 w-64" />
                        </div>

                        {/* COUNTDOWN BOX SKELETON */}
                        <div className="flex gap-2">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <Skeleton
                                    key={i}
                                    className="w-14 h-16 rounded-lg"
                                />
                            ))}
                        </div>
                    </div>

                    {/* CAROUSEL SKELETON */}
                    <div className="border-t border-white/10">
                        <div className="p-8">
                            <Skeleton className="h-32 w-full rounded-lg" />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
