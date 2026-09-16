import {describe, expect, it} from "vitest";
import {readEventPreviewConfig} from "../config/event-preview-config.js";

const valid = {
  EVENT_PREVIEW_ENABLED: "true",
  PUBLIC_FIREBASE_API_KEY: "AIza-validPublicBrowserKey12345",
  PUBLIC_FIREBASE_APP_ID: "1:94792445174:web:abcdef1234567890",
  PUBLIC_FIREBASE_PROJECT_ID: "onmyradar-web-508414",
  PUBLIC_FIREBASE_APP_CHECK_SITE_KEY: "public_site_key_1234567890",
  PUBLIC_FIREBASE_FUNCTIONS_REGION: "us-west1",
};

describe("event preview build configuration", () => {
  it("keeps the client disabled and strips dormant values by default", () => {
    expect(readEventPreviewConfig({...valid, EVENT_PREVIEW_ENABLED: "false"}))
      .toEqual({enabled: false, apiKey: "", appId: "", projectId: "",
        appCheckSiteKey: "", functionsRegion: "us-west1"});
  });

  it("accepts a complete validated public configuration", () => {
    expect(readEventPreviewConfig(valid)).toEqual({
      enabled: true,
      apiKey: valid.PUBLIC_FIREBASE_API_KEY,
      appId: valid.PUBLIC_FIREBASE_APP_ID,
      projectId: valid.PUBLIC_FIREBASE_PROJECT_ID,
      appCheckSiteKey: valid.PUBLIC_FIREBASE_APP_CHECK_SITE_KEY,
      functionsRegion: "us-west1",
    });
  });

  it.each([
    ["PUBLIC_FIREBASE_API_KEY", "<script>"],
    ["PUBLIC_FIREBASE_APP_ID", "wrong"],
    ["PUBLIC_FIREBASE_PROJECT_ID", "UPPER_CASE"],
    ["PUBLIC_FIREBASE_APP_CHECK_SITE_KEY", "short"],
    ["PUBLIC_FIREBASE_FUNCTIONS_REGION", "https://evil.example"],
  ])("fails closed for invalid %s", (key, value) => {
    expect(() => readEventPreviewConfig({...valid, [key]: value})).toThrow(/require a valid/);
  });
});
