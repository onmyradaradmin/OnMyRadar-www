const signalIdPattern = /^[A-Za-z0-9_-]{20,128}$/;
const campaignTokenPattern = /^[A-Za-z0-9_-]{22,64}$/;
const allowedResponseKeys = new Set(["availability", "event"]);
const allowedEventKeys = new Set([
  "id",
  "title",
  "summary",
  "categories",
  "startsAtMillis",
  "endsAtMillis",
  "sourceTimeZone",
  "attributionLabel",
  "lastVerifiedAtMillis",
]);

const hasExactKeys = (value, allowed) =>
  Object.keys(value).every((key) => allowed.has(key));

const isSafeText = (value, maximum) =>
  typeof value === "string" && value.trim().length > 0 && value.length <= maximum;

const isSafeInstant = (value) =>
  Number.isSafeInteger(value) && value >= 0 && value <= 8_640_000_000_000_000;

const isIanaTimeZone = (value) => {
  if (typeof value !== "string" || value.length > 100) return false;
  try {
    new Intl.DateTimeFormat("en-US", {timeZone: value}).format();
    return true;
  } catch {
    return false;
  }
};

export function parseEventPreviewRoute(pathname, search) {
  const match = /^\/events\/([A-Za-z0-9_-]+)\/?$/.exec(pathname);
  if (!match || !signalIdPattern.test(match[1])) return null;
  const parameters = new URLSearchParams(search);
  if ([...parameters.keys()].some((key) => key !== "c") || parameters.getAll("c").length > 1) {
    return null;
  }
  const campaignToken = parameters.get("c");
  if (campaignToken !== null && !campaignTokenPattern.test(campaignToken)) return null;
  return campaignToken === null ? {signalId: match[1]} : {signalId: match[1], campaignToken};
}

export function parsePublicEventPreview(raw, expectedSignalId) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw) ||
      !hasExactKeys(raw, allowedResponseKeys)) return null;
  if (raw.availability === "UNAVAILABLE" && Object.keys(raw).length === 1) {
    return {availability: "UNAVAILABLE"};
  }
  const event = raw.event;
  if (raw.availability !== "AVAILABLE" || !event || typeof event !== "object" ||
      Array.isArray(event) || !hasExactKeys(event, allowedEventKeys) ||
      event.id !== expectedSignalId || !signalIdPattern.test(event.id) ||
      !isSafeText(event.title, 300) ||
      !(event.summary === null || (typeof event.summary === "string" && event.summary.length <= 2000)) ||
      !Array.isArray(event.categories) || event.categories.length > 20 ||
      !event.categories.every((item) => isSafeText(item, 100)) ||
      !isSafeInstant(event.startsAtMillis) ||
      !(event.endsAtMillis === null || (isSafeInstant(event.endsAtMillis) &&
        event.endsAtMillis >= event.startsAtMillis)) ||
      !isIanaTimeZone(event.sourceTimeZone) ||
      !isSafeText(event.attributionLabel, 200) ||
      !isSafeInstant(event.lastVerifiedAtMillis)) return null;
  return {availability: "AVAILABLE", event: {...event, categories: [...event.categories]}};
}

export function preferredPreviewLocale(languages = []) {
  for (const language of languages) {
    if (/^de(?:-|$)/i.test(language)) return "de-DE";
    if (/^en(?:-|$)/i.test(language)) return "en-US";
  }
  return "en-US";
}
