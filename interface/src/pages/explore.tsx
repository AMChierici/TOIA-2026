import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { api, type Stream } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ExplorePage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["streams"],
    queryFn: api.listStreams,
  });

  return (
    <div className="container py-10">
      <div className="mb-8 space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Explore avatars</h1>
        <p className="text-muted-foreground">Browse public streams and start a conversation.</p>
      </div>

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      )}

      {isError && (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Couldn't load avatars right now. Please try again later.
          </CardContent>
        </Card>
      )}

      {data && data.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 p-12 text-center text-muted-foreground">
            <Users className="size-8" />
            <p>No public avatars yet.</p>
          </CardContent>
        </Card>
      )}

      {data && data.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((stream: Stream) => (
            <Card key={stream.id_stream} className="overflow-hidden transition-shadow hover:shadow-md">
              <div className="aspect-video bg-accent">
                {stream.pic && (
                  <img
                    src={stream.pic}
                    alt={stream.name}
                    loading="lazy"
                    className="size-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                  />
                )}
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold">{stream.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {stream.videos_count ?? 0} videos · {stream.views} views
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
