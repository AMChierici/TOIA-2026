import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { VoiceIndicator } from "./voice-indicator";

describe("VoiceIndicator", () => {
  it("renders nothing when inactive", () => {
    const { container } = render(<VoiceIndicator active={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows an accessible listening status when active", () => {
    render(<VoiceIndicator active />);
    const status = screen.getByRole("status");
    expect(status).toBeInTheDocument();
    expect(status).toHaveAccessibleName(/listening/i);
  });

  it("renders animated bars to reassure the user audio is being captured", () => {
    const { container } = render(<VoiceIndicator active />);
    // The equalizer is made of several animated bars.
    expect(container.querySelectorAll("[data-bar]").length).toBeGreaterThan(2);
  });

  it("uses a custom label when provided", () => {
    render(<VoiceIndicator active label="Processing your question" />);
    expect(screen.getByRole("status")).toHaveAccessibleName("Processing your question");
  });
});
