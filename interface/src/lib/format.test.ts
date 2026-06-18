import { describe, it, expect } from "vitest";
import { formatClock } from "./format";

describe("formatClock", () => {
  it("formats zero as 0:00", () => {
    expect(formatClock(0)).toBe("0:00");
  });

  it("pads seconds under ten", () => {
    expect(formatClock(5)).toBe("0:05");
  });

  it("formats whole minutes", () => {
    expect(formatClock(60)).toBe("1:00");
  });

  it("formats minutes and seconds", () => {
    expect(formatClock(83)).toBe("1:23");
  });

  it("handles durations over ten minutes", () => {
    expect(formatClock(605)).toBe("10:05");
  });

  it("floors fractional seconds", () => {
    expect(formatClock(9.8)).toBe("0:09");
  });

  it("clamps negatives to 0:00", () => {
    expect(formatClock(-3)).toBe("0:00");
  });
});
