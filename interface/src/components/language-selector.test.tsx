import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LanguageProvider } from "@/lib/i18n";
import { LanguageSelector } from "./language-selector";

function renderSelector() {
  return render(
    <LanguageProvider>
      <LanguageSelector />
    </LanguageProvider>,
  );
}

beforeEach(() => {
  window.localStorage.clear();
  document.documentElement.dir = "ltr";
});

describe("LanguageSelector", () => {
  it("lists the four supported languages", () => {
    renderSelector();
    const select = screen.getByRole("combobox");
    const options = Array.from(select.querySelectorAll("option")).map((o) => o.textContent);
    expect(options).toEqual(["English", "العربية", "Français", "Español"]);
  });

  it("persists the chosen language and flips direction to RTL for Arabic", async () => {
    const user = userEvent.setup();
    renderSelector();
    await user.selectOptions(screen.getByRole("combobox"), "ar");

    expect(window.localStorage.getItem("toia.lang")).toBe("ar");
    expect(document.documentElement.dir).toBe("rtl");
  });

  it("returns to LTR for a left-to-right language", async () => {
    const user = userEvent.setup();
    renderSelector();
    await user.selectOptions(screen.getByRole("combobox"), "ar");
    await user.selectOptions(screen.getByRole("combobox"), "fr");

    expect(document.documentElement.dir).toBe("ltr");
  });
});
