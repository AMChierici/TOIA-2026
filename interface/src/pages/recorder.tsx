import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Circle, Square, RotateCcw, Upload } from "lucide-react";
import videoTypes from "@/configs/VideoTypes.json";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useRecorder } from "@/lib/use-recorder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

interface VideoType {
  type: string;
  displayText: string;
}

export function RecorderPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const recorder = useRecorder();
  const editId = searchParams.get("edit");
  const isEditing = Boolean(editId);

  const [question, setQuestion] = useState(searchParams.get("question") ?? "");
  const [answer, setAnswer] = useState("");
  const [videoType, setVideoType] = useState("answer");
  const [streamId, setStreamId] = useState<string>("");
  const [prefilled, setPrefilled] = useState(false);

  const streams = useQuery({
    queryKey: ["user-streams", user?.id],
    queryFn: () => api.listUserStreams(user!.id),
    enabled: Boolean(user),
  });

  // In edit mode, load the existing video and prefill its metadata once.
  const editing = useQuery({
    queryKey: ["video", editId],
    queryFn: () => api.getVideo(editId!),
    enabled: isEditing,
  });

  useEffect(() => {
    if (prefilled || !editing.data) return;
    const v = editing.data;
    const firstQuestion = v.questions[0];
    setQuestion(firstQuestion?.question ?? "");
    setAnswer(v.answer ?? "");
    setVideoType(firstQuestion?.suggested_type || "answer");
    if (v.streams[0]) setStreamId(String(v.streams[0].id_stream));
    setPrefilled(true);
  }, [editing.data, prefilled]);

  useEffect(() => {
    void recorder.setupCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!streamId && streams.data && streams.data.length > 0) {
      setStreamId(String(streams.data[0].id_stream));
    }
  }, [streams.data, streamId]);

  const previewUrl = useMemo(
    () => (recorder.blob ? URL.createObjectURL(recorder.blob) : null),
    [recorder.blob],
  );
  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const save = useMutation({
    mutationFn: () => {
      const form = new FormData();
      form.append("video", recorder.blob!, "recording.webm");
      form.append("answer", answer || question);
      form.append("private", "false");
      form.append("streams", JSON.stringify(streamId ? [Number(streamId)] : []));
      form.append("questions", JSON.stringify([{ question }]));
      form.append("video_duration", String(recorder.durationSeconds));
      form.append("language", user?.language ?? "en-US");
      form.append("videoType", videoType);
      form.append("results", "[]");
      return isEditing ? api.updateVideo(editId!, form) : api.createVideo(form);
    },
    onSuccess: () => navigate("/mytoia"),
  });

  const canSave = Boolean(recorder.blob && question.trim() && streamId && !save.isPending);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (canSave) save.mutate();
  }

  return (
    <div className="container grid gap-6 py-8 lg:grid-cols-[1.4fr_1fr]">
      <div className="space-y-4">
        <div className="overflow-hidden rounded-xl border bg-black">
          <div className="aspect-video">
            {previewUrl ? (
              <video className="size-full" src={previewUrl} controls playsInline />
            ) : (
              <video ref={recorder.videoRef} className="size-full" playsInline muted />
            )}
          </div>
        </div>

        {recorder.error && <p className="text-sm text-destructive">{recorder.error}</p>}

        <div className="flex flex-wrap gap-2">
          {recorder.state === "recording" ? (
            <Button variant="destructive" onClick={recorder.stop}>
              <Square /> Stop
            </Button>
          ) : recorder.state === "recorded" ? (
            <Button variant="outline" onClick={recorder.reset}>
              <RotateCcw /> Re-record
            </Button>
          ) : (
            <Button onClick={recorder.start} disabled={recorder.state !== "ready"}>
              <Circle className="fill-current text-destructive" /> Record
            </Button>
          )}
          {recorder.state === "recorded" && (
            <span className="self-center text-sm text-muted-foreground">
              {recorder.durationSeconds}s recorded
            </span>
          )}
        </div>
      </div>

      <Card className="h-fit">
        <CardContent className="p-6">
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="question" className="text-sm font-medium">Question</label>
              <Input
                id="question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="What question does this answer?"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="answer" className="text-sm font-medium">
                Transcript <span className="text-muted-foreground">(used for matching)</span>
              </label>
              <textarea
                id="answer"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                rows={3}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="What you say in the video…"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="videoType" className="text-sm font-medium">Type</label>
              <select
                id="videoType"
                value={videoType}
                onChange={(e) => setVideoType(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {(videoTypes as VideoType[]).map((t) => (
                  <option key={t.type} value={t.type}>
                    {t.displayText}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="stream" className="text-sm font-medium">Stream</label>
              <select
                id="stream"
                value={streamId}
                onChange={(e) => setStreamId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {streams.data?.map((s) => (
                  <option key={s.id_stream} value={s.id_stream}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {isEditing && (
              <p className="text-sm text-muted-foreground">
                Editing replaces the clip — record a new take before saving.
              </p>
            )}

            {save.isError && (
              <p className="text-sm text-destructive">Upload failed. Please try again.</p>
            )}

            <Button type="submit" className="w-full" disabled={!canSave}>
              <Upload />{" "}
              {save.isPending
                ? isEditing
                  ? "Saving…"
                  : "Uploading…"
                : isEditing
                  ? "Save changes"
                  : "Save video"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
