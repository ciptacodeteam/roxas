import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export function FavoriteSectionSkeleton() {
    return (
        <section>
            <div className="mx-auto mb-16 max-w-7xl">
                <div>
                    <div className="mb-2 flex gap-2 text-3xl">
                        <span>
                            <Skeleton className="w-8 h-8" />
                        </span>
                        <Skeleton className="h-8 w-48" />
                    </div>
                    <Skeleton className="h-5 w-64" />
                </div>

                <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Card
                            key={i}
                            className="border-background relative cursor-pointer overflow-hidden rounded-xl bg-card"
                        >
                            <CardContent className="flex items-center gap-4 p-4">
                                <Skeleton className="h-20 w-20 rounded-lg" />
                                <div className="flex flex-1 flex-col gap-2">
                                    <Skeleton className="h-5 w-full" />
                                    <Skeleton className="h-4 w-3/4" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
}
