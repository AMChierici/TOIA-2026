import { useCallback, useRef, useState, type FormEvent } from "react";
import { useParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { Mic, Send, ThumbsDown, ThumbsUp } from "lucide-react";
import { api, type NextVideo } from "@/lib/api";
import { useSpeechToText } from "@/lib/use-speech";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function PlayerPage() {
  const { id } = useParams<{ id: string }>();
  const [question, setQuestion] = useState("");
  const [current, setCurrent] = useState<NextVideo | null>(null);
  const [lastQuestion, setLastQuestion] = useState("");
  const [rated, setRated] = useState(false);
  const [history, setHistory] = useState<{ q: string; a: string }[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);

  const ask = useMutation({
    mutationFn: (q: string) => api.nextVideo(id!, q),
    onSuccess: (res, q) => {
      setCurrent(res);
      setLastQuestion(q);
      setRated(false);
      setHistory((h) => [...h, { q, a: res.answer }]);
      // Autoplay the new clip.
      requestAnimationFrame(() => videoRef.current?.load());
    },
  });

  const submitQuestion = useCallback(
    (q: string) => {
      const trimmed = q.trim();
      if (!trimmed || ask.isPending) return;
      ask.mutate(trimmed);
      setQuestion("");
    },
    [ask],
  );

  const speech = useSpeechToText(submitQuestion);

  const feedback = useMutation({
    mutationFn: (rating: number) =>
      api.saveFeedback({ video_id: current!.id_video, question: lastQuestion, rating }),
    onSuccess: () => setRated(true),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    submitQuestion(question);
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
            placeholder={speech.listening ? "Listening…" : "Ask something…"}
            aria-label="Your question"
          />
          {speech.supported && (
            <Button
              type="button"
              variant={speech.listening ? "destructive" : "outline"}
              size="icon"
              onClick={speech.toggle}
              aria-label="Ask by voice"
            >
              <Mic className={cn(speech.listening && "animate-pulse")} />
            </Button>
          )}
          <Button type="submit" disabled={ask.isPending}>
            <Send /> {ask.isPending ? "Thinking…" : "Ask"}
          </Button>
        </form>
        {ask.isError && (
          <p className="text-sm text-destructive">Something went wrong. Please try again.</p>
        )}

        {current && (
          <div className="flex items-center gap-3 text-sm">
            {rated ? (
              <span className="text-muted-foreground">Thanks for the feedback!</span>
            ) : (
              <>
                <span className="text-muted-foreground">Was this helpful?</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => feedback.mutate(1)}
                  disabled={feedback.isPending}
                  aria-label="Helpful"
                >
                  <ThumbsUp />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => feedback.mutate(-1)}
                  disabled={feedback.isPending}
                  aria-label="Not helpful"
                >
                  <ThumbsDown />
                </Button>
              </>
            )}
          </div>
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
