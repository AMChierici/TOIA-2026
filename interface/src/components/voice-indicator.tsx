import { cn } from "@/lib/utils";

const BARS = [0, 1, 2, 3, 4];

/**
 * Animated equalizer shown while the app is capturing/processing microphone
 * audio, so the user is reassured the system is listening. Renders nothing when
 * inactive.
 */
export function VoiceIndicator({
  active,
  label = "Listening…",
  className,
}: {
  active: boolean;
  label?: string;
  className?: string;
}) {
  if (!active) return null;

  return (
    <div
      role="status"
      aria-label={label}
      className={cn("flex items-center gap-2 text-sm text-primary", className)}
    >
      <span className="flex h-5 items-end gap-0.5" aria-hidden="true">
        {BARS.map((i) => (
          <span
            key={i}
            data-bar
            className="w-1 origin-bottom animate-voice-bar rounded-full bg-primary"
            style={{ animationDelay: `${i * 120}ms`, height: "100%" }}
          />
        ))}
      </span>
      <span>{label}</span>
    </div>
  );
}
