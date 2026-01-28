import { Skeleton } from "@/components/ui/skeleton";

export function InformationSectionSkeleton() {
    return (
        <section className="relative">
            <div className="mx-auto max-w-7xl mb-16">
                <div className="bg-card relative overflow-visible rounded-2xl px-10 py-16">
                    {/* TEXT SECTION SKELETON */}
                    <div className="relative z-10 max-w-3xl">
                        <Skeleton className="h-8 w-64 mb-4" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                        </div>
                    </div>

                    {/* CARDS SKELETON */}
                    <div className="mt-10">
                        <div className="relative z-20 grid grid-cols-3 gap-4">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="bg-muted-foreground rounded-lg p-5">
                                    <div className="flex items-center gap-6">
                                        <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                                        <div className="flex-1">
                                            <Skeleton className="h-5 w-24 mb-2" />
                                            <Skeleton className="h-4 w-full" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
