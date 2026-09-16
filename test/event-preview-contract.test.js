import {describe, expect, it} from "vitest";
import {
  parseEventPreviewRoute,
  parsePublicEventPreview,
  preferredPreviewLocale,
} from "../client/event-preview-contract.js";

const signalId = "signal_12345678901234567890";
const campaignToken = "campaign_1234567890123456789012";
const event = {
  id: signalId,
  title: "Verified event",
  summary: "Public summary",
  categories: ["Community"],
  startsAtMillis: 1_800_000_000_000,
  endsAtMillis: 1_800_003_600_000,
  sourceTimeZone: "America/Los_Angeles",
  attributionLabel: "Example source",
  lastVerifiedAtMillis: 1_799_999_000_000,
};

describe("public event preview browser boundary", () => {
  it("accepts only the canonical path and optional singular campaign token", () => {
    expect(parseEventPreviewRoute(`/events/${signalId}`, "")).toEqual({signalId});
    expect(parseEventPreviewRoute(`/events/${signalId}/`, `?c=${campaignToken}`))
      .toEqual({signalId, campaignToken});
    for (const [path, query] of [
      ["/events/short", ""],
      [`/events/${signalId}/extra`, ""],
      [`/events/${signalId}`, "?x=value"],
      [`/events/${signalId}`, `?c=${campaignToken}&c=${campaignToken}`],
      [`/events/${signalId}`, "?c=unsafe%2Ftoken"],
    ]) expect(parseEventPreviewRoute(path, query)).toBeNull();
  });

  it("accepts only the strict privacy-minimal response projection", () => {
    expect(parsePublicEventPreview({availability: "AVAILABLE", event}, signalId))
      .toEqual({availability: "AVAILABLE", event});
    expect(parsePublicEventPreview({availability: "UNAVAILABLE"}, signalId))
      .toEqual({availability: "UNAVAILABLE"});
    for (const unsafe of [
      {...event, sourceUrl: "https://example.com"},
      {...event, venue: "Private venue"},
      {...event, latitude: 36.9},
      {...event, id: "signal_09876543210987654321"},
      {...event, endsAtMillis: event.startsAtMillis - 1},
      {...event, sourceTimeZone: "Not/AZone"},
    ]) expect(parsePublicEventPreview({availability: "AVAILABLE", event: unsafe}, signalId))
      .toBeNull();
  });

  it("uses German only for a supported German browser preference", () => {
    expect(preferredPreviewLocale(["fr-FR", "de-DE"])).toBe("de-DE");
    expect(preferredPreviewLocale(["en-US", "de-DE"])).toBe("en-US");
    expect(preferredPreviewLocale(["fr-FR", "en-US"])).toBe("en-US");
  });
});
