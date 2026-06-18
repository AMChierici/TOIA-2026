import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Clapperboard, Clock, Layers, Plus, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateStreamDialog } from "@/components/create-stream-dialog";
import { EditStreamDialog } from "@/components/edit-stream-dialog";
import { VideoLibrary } from "@/components/video-library";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "videos", label: "Videos" },
] as const;
type TabId = (typeof TABS)[number]["id"];

function formatDuration(seconds: number) {
  if (!seconds) return "0m";
  const m = Math.round(seconds / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

export function DashboardPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<TabId>("overview");

  const stats = useQuery({ queryKey: ["stats"], queryFn: api.getStats });
  const streams = useQuery({
    queryKey: ["user-streams", user?.id],
    queryFn: () => api.listUserStreams(user!.id),
    enabled: Boolean(user),
  });
  const suggestions = useQuery({ queryKey: ["suggestions"], queryFn: api.listSuggestions });

  const statCards = [
    { label: "Videos", icon: Clapperboard, value: stats.data?.totalVideosCount },
    { label: "Streams", icon: Layers, value: stats.data?.totalStreamCounts },
    {
      label: "Recorded",
      icon: Clock,
      value: stats.data ? formatDuration(stats.data.totalVideoDuration) : undefined,
    },
  ];

  return (
    <div className="container space-y-8 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My TOIA</h1>
          <p className="text-muted-foreground">Welcome back, {user?.first_name}.</p>
        </div>
        <div className="flex gap-2">
          <CreateStreamDialog />
          <Button asChild>
            <Link to="/record">
              <Plus /> Record a video
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex gap-1 border-b">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors",
              tab === t.id
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "videos" ? (
        <VideoLibrary />
      ) : (
      <>
      <div className="grid gap-4 sm:grid-cols-3">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-4 p-6">
              <span className="flex size-11 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                <s.icon className="size-5" />
              </span>
              <div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                {s.value === undefined ? (
                  <Skeleton className="mt-1 h-6 w-12" />
                ) : (
                  <p className="text-2xl font-semibold">{s.value}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Your streams</h2>
        {streams.isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-36 w-full" />
            ))}
          </div>
        ) : streams.data && streams.data.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {streams.data.map((stream) => (
              <Card key={stream.id_stream} className="transition-shadow hover:shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {stream.name}
                    {stream.private && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">
                        Private
                      </span>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{stream.videos_count ?? 0} videos</span>
                  <div className="flex items-center gap-1">
                    <EditStreamDialog stream={stream} />
                    <Button asChild variant="ghost" size="sm">
                      <Link to={`/stream/${stream.id_stream}`}>Open</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No streams yet. Record your first video to get started.
            </CardContent>
          </Card>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-xl font-semibold">
          <Sparkles className="size-5 text-primary" /> Suggested questions
        </h2>
        {suggestions.isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : suggestions.data && suggestions.data.length > 0 ? (
          <Card>
            <CardContent className="divide-y p-0">
              {suggestions.data.map((q) => (
                <div key={q.id_question} className="flex items-center justify-between gap-4 p-4">
                  <span className="text-sm">{q.question}</span>
                  <Button asChild variant="outline" size="sm">
                    <Link to={`/record?question=${encodeURIComponent(q.question)}`}>Answer</Link>
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No suggestions right now.
            </CardContent>
          </Card>
        )}
      </section>
      </>
      )}
    </div>
  );
}
