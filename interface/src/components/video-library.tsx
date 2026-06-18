import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clapperboard, Lock, Pencil, Trash2 } from "lucide-react";
import { api, type VideoListItem } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function formatDuration(seconds: number) {
  const s = Math.max(0, Math.round(seconds));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

export function VideoLibrary() {
  const videos = useQuery({ queryKey: ["videos"], queryFn: api.listVideos });
  const [openId, setOpenId] = useState<string | null>(null);

  if (videos.isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  if (!videos.data || videos.data.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          No videos yet. Record your first one to build your library.
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {videos.data.map((video) => (
          <VideoCard key={video.id_video} video={video} onOpen={() => setOpenId(video.id_video)} />
        ))}
      </div>

      <VideoDetailDialog
        videoId={openId}
        onOpenChange={(open) => !open && setOpenId(null)}
      />
    </>
  );
}

function VideoCard({ video, onOpen }: { video: VideoListItem; onOpen: () => void }) {
  return (
    <Card className="flex flex-col transition-shadow hover:shadow-md">
      <CardContent className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Clapperboard className="size-3.5" /> {formatDuration(video.duration_seconds)}
          </span>
          {video.private && (
            <span className="inline-flex items-center gap-1">
              <Lock className="size-3" /> Private
            </span>
          )}
        </div>
        <p className="line-clamp-3 flex-1 text-sm">
          {video.answer || <span className="text-muted-foreground">No transcript</span>}
        </p>
        <Button variant="outline" size="sm" className="self-start" onClick={onOpen}>
          Open
        </Button>
      </CardContent>
    </Card>
  );
}

function VideoDetailDialog({
  videoId,
  onOpenChange,
}: {
  videoId: string | null;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const detail = useQuery({
    queryKey: ["video", videoId],
    queryFn: () => api.getVideo(videoId!),
    enabled: Boolean(videoId),
  });

  const deleteQuestion = useMutation({
    mutationFn: (questionId: number) => api.deleteVideoQuestion(videoId!, questionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["video", videoId] });
      void queryClient.invalidateQueries({ queryKey: ["videos"] });
      void queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
  });

  return (
    <Dialog open={Boolean(videoId)} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Recorded video</DialogTitle>
          <DialogDescription>Preview, edit, or remove this clip.</DialogDescription>
        </DialogHeader>

        {detail.isLoading ? (
          <Skeleton className="aspect-video w-full" />
        ) : detail.data ? (
          <div className="space-y-4">
            <div className="overflow-hidden rounded-lg border bg-black">
              <video
                key={detail.data.videoURL}
                src={detail.data.videoURL}
                className="aspect-video w-full"
                controls
                playsInline
              />
            </div>

            {detail.data.answer && (
              <div>
                <p className="text-xs font-medium text-muted-foreground">Transcript</p>
                <p className="text-sm">{detail.data.answer}</p>
              </div>
            )}

            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">
                Questions this answers
              </p>
              {detail.data.questions.length > 0 ? (
                <ul className="divide-y rounded-md border">
                  {detail.data.questions.map((q) => (
                    <li key={q.id_question} className="flex items-center justify-between gap-3 p-2.5">
                      <span className="text-sm">{q.question}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                        title="Remove this question"
                        disabled={deleteQuestion.isPending}
                        onClick={() => deleteQuestion.mutate(q.id_question)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No linked questions.</p>
              )}
              {deleteQuestion.isError && (
                <p className="mt-1 text-sm text-destructive">Could not remove that question.</p>
              )}
            </div>

            {detail.data.streams.length > 0 && (
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">In streams</p>
                <div className="flex flex-wrap gap-1.5">
                  {detail.data.streams.map((s) => (
                    <span
                      key={s.id_stream}
                      className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground"
                    >
                      {s.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button asChild>
                <Link to={`/record?edit=${detail.data.id_video}`}>
                  <Pencil /> Edit / re-record
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-destructive">Could not load this video.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
