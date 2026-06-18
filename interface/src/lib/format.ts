/**
 * Format a number of seconds as a `m:ss` clock (e.g. 83 → "1:23").
 * Fractional seconds are floored and negatives clamp to "0:00".
 */
export function formatClock(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(total / 60);
  const secs = total % 60;
  return `${minutes}:${String(secs).padStart(2, "0")}`;
}
