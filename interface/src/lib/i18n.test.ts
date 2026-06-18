import { describe, it, expect } from "vitest";
import { translate, dirFor, LANGUAGES, type Translations } from "./i18n-core";

const sample: Translations = {
  en: { hello: "Hello", bye: "Goodbye" },
  fr: { hello: "Bonjour" },
  ar: { hello: "مرحبا" },
  es: {},
};

describe("translate", () => {
  it("returns the string for the active language", () => {
    expect(translate(sample, "fr", "hello")).toBe("Bonjour");
  });

  it("falls back to English when the key is missing in the language", () => {
    expect(translate(sample, "fr", "bye")).toBe("Goodbye");
  });

  it("falls back to the key itself when missing everywhere", () => {
    expect(translate(sample, "fr", "missing")).toBe("missing");
  });

  it("supports interpolation of {{name}} placeholders", () => {
    const t: Translations = { en: { greet: "Hi, {{name}}!" }, fr: {}, ar: {}, es: {} };
    expect(translate(t, "en", "greet", { name: "Sam" })).toBe("Hi, Sam!");
  });
});

describe("dirFor", () => {
  it("is rtl for Arabic", () => {
    expect(dirFor("ar")).toBe("rtl");
  });

  it("is ltr for other languages", () => {
    expect(dirFor("en")).toBe("ltr");
    expect(dirFor("fr")).toBe("ltr");
  });
});

describe("LANGUAGES", () => {
  it("offers the four supported languages", () => {
    expect(LANGUAGES.map((l) => l.code).sort()).toEqual(["ar", "en", "es", "fr"]);
  });
});
