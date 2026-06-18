import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useStopwatch } from "./use-stopwatch";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("useStopwatch", () => {
  it("starts at zero", () => {
    const { result } = renderHook(() => useStopwatch(false));
    expect(result.current).toBe(0);
  });

  it("counts up roughly once per second while running", () => {
    const { result } = renderHook(({ running }) => useStopwatch(running), {
      initialProps: { running: true },
    });
    expect(result.current).toBe(0);
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current).toBe(3);
  });

  it("freezes the value when stopped", () => {
    const { result, rerender } = renderHook(({ running }) => useStopwatch(running), {
      initialProps: { running: true },
    });
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current).toBe(5);
    rerender({ running: false });
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(result.current).toBe(5);
  });

  it("resets to zero when restarted", () => {
    const { result, rerender } = renderHook(({ running }) => useStopwatch(running), {
      initialProps: { running: true },
    });
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    rerender({ running: false });
    rerender({ running: true });
    expect(result.current).toBe(0);
  });
});
