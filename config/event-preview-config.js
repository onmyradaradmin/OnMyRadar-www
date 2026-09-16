const patterns = {
  apiKey: /^[A-Za-z0-9_-]{20,200}$/,
  appId: /^\d{1,20}:\d{1,20}:web:[a-f0-9]{10,64}$/,
  projectId: /^[a-z][a-z0-9-]{4,28}[a-z0-9]$/,
  appCheckSiteKey: /^[A-Za-z0-9_-]{20,200}$/,
  functionsRegion: /^[a-z]+-[a-z]+\d$/,
};

export function readEventPreviewConfig(environment) {
  const enabled = environment.EVENT_PREVIEW_ENABLED === "true";
  const values = {
    apiKey: environment.PUBLIC_FIREBASE_API_KEY ?? "",
    appId: environment.PUBLIC_FIREBASE_APP_ID ?? "",
    projectId: environment.PUBLIC_FIREBASE_PROJECT_ID ?? "",
    appCheckSiteKey: environment.PUBLIC_FIREBASE_APP_CHECK_SITE_KEY ?? "",
    functionsRegion: environment.PUBLIC_FIREBASE_FUNCTIONS_REGION ?? "us-west1",
  };
  if (!enabled) {
    return {enabled: false, apiKey: "", appId: "", projectId: "",
      appCheckSiteKey: "", functionsRegion: "us-west1"};
  }
  for (const [key, pattern] of Object.entries(patterns)) {
    if (!pattern.test(values[key])) {
      throw new Error(`Enabled event previews require a valid public ${key} value.`);
    }
  }
  return {enabled: true, ...values};
}
