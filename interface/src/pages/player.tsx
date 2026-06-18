import { useRef, useState, type FormEvent } from "react";
import { useParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Send } from "lucide-react";
import { api, type NextVideo } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

export function PlayerPage() {
  const { id } = useParams<{ id: string }>();
  const [question, setQuestion] = useState("");
  const [current, setCurrent] = useState<NextVideo | null>(null);
  const [history, setHistory] = useState<{ q: string; a: string }[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);

  const ask = useMutation({
    mutationFn: (q: string) => api.nextVideo(id!, q),
    onSuccess: (res, q) => {
      setCurrent(res);
      setHistory((h) => [...h, { q, a: res.answer }]);
      // Autoplay the new clip.
      requestAnimationFrame(() => videoRef.current?.load());
    },
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const q = question.trim();
    if (!q || ask.isPending) return;
    ask.mutate(q);
    setQuestion("");
  }

  return (
    <div className="container grid gap-6 py-8 lg:grid-cols-[1.4fr_1fr]">
      <div className="space-y-4">
        <div className="overflow-hidden rounded-xl border bg-black">
          <div className="aspect-video">
            {current ? (
              <video
                ref={videoRef}
                key={current.url}
                className="size-full"
                controls
                autoPlay
                playsInline
              >
                <source src={current.url} />
                {current.vtt_url && (
                  <track default kind="captions" src={current.vtt_url} srcLang="en" label="English" />
                )}
              </video>
            ) : (
              <div className="flex size-full items-center justify-center text-sm text-white/60">
                Ask a question to start the conversation
              </div>
            )}
          </div>
        </div>

        <form onSubmit={onSubmit} className="flex gap-2">
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask something…"
            aria-label="Your question"
          />
          <Button type="submit" disabled={ask.isPending}>
            <Send /> {ask.isPending ? "Thinking…" : "Ask"}
          </Button>
        </form>
        {ask.isError && (
          <p className="text-sm text-destructive">Something went wrong. Please try again.</p>
        )}
      </div>

      <Card className="h-fit">
        <CardContent className="p-4">
          <h2 className="mb-3 font-semibold">Conversation</h2>
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">Your conversation will appear here.</p>
          ) : (
            <ul className="space-y-4">
              {history.map((turn, i) => (
                <li key={i} className="space-y-1">
                  <p className="text-sm font-medium">{turn.q}</p>
                  <p className="text-sm text-muted-foreground">{turn.a}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
