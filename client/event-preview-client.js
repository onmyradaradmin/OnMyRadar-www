import {initializeApp} from "firebase/app";
import {initializeAppCheck, ReCaptchaEnterpriseProvider} from "firebase/app-check";
import {getFunctions, httpsCallable} from "firebase/functions";
import {
  parseEventPreviewRoute,
  parsePublicEventPreview,
  preferredPreviewLocale,
} from "./event-preview-contract.js";

const root = document.querySelector("[data-event-preview]");

const copy = {
  "en-US": {
    unavailableTitle: "Event unavailable",
    unavailableBody: "This event cannot be displayed. The link may be invalid, expired, or no longer public.",
    loadingTitle: "Loading event…",
    loadingBody: "Checking the latest verified event information.",
    starts: "Starts",
    ends: "Ends",
    verified: "Last verified",
    attribution: "Event information from",
  },
  "de-DE": {
    unavailableTitle: "Event nicht verfügbar",
    unavailableBody: "Dieses Event kann nicht angezeigt werden. Der Link ist möglicherweise ungültig, abgelaufen oder nicht mehr öffentlich.",
    loadingTitle: "Event wird geladen…",
    loadingBody: "Die zuletzt geprüften Eventinformationen werden abgerufen.",
    starts: "Beginn",
    ends: "Ende",
    verified: "Zuletzt geprüft",
    attribution: "Eventinformationen von",
  },
};

const setText = (selector, value) => {
  const element = root?.querySelector(selector);
  if (element) element.textContent = value;
};

const renderUnavailable = (messages) => {
  setText("[data-preview-title]", messages.unavailableTitle);
  setText("[data-preview-summary]", messages.unavailableBody);
  root?.querySelector("[data-preview-details]")?.setAttribute("hidden", "");
  root?.removeAttribute("aria-busy");
};

const renderAvailable = (event, locale, messages) => {
  const date = new Intl.DateTimeFormat(locale, {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: event.sourceTimeZone,
  });
  setText("[data-preview-title]", event.title);
  setText("[data-preview-summary]", event.summary ?? "");
  setText("[data-preview-start]", `${messages.starts}: ${date.format(event.startsAtMillis)}`);
  setText("[data-preview-end]", event.endsAtMillis === null ? "" :
    `${messages.ends}: ${date.format(event.endsAtMillis)}`);
  setText("[data-preview-categories]", event.categories.join(" · "));
  setText("[data-preview-attribution]", `${messages.attribution}: ${event.attributionLabel}`);
  setText("[data-preview-verified]", `${messages.verified}: ${date.format(event.lastVerifiedAtMillis)}`);
  root?.querySelector("[data-preview-details]")?.removeAttribute("hidden");
  root?.removeAttribute("aria-busy");
};

async function loadPreview() {
  if (!root) return;
  const route = parseEventPreviewRoute(location.pathname, location.search);
  if (!route && root.dataset.fallback === "true") return;
  root.removeAttribute("hidden");
  document.querySelector("[data-standard-not-found]")?.setAttribute("hidden", "");
  const locale = preferredPreviewLocale(navigator.languages ?? [navigator.language]);
  const messages = copy[locale];
  document.documentElement.lang = locale.slice(0, 2);
  setText("[data-preview-title]", messages.loadingTitle);
  setText("[data-preview-summary]", messages.loadingBody);

  const enabled = root.dataset.enabled === "true";
  if (!route || !enabled) {
    renderUnavailable(messages);
    return;
  }

  try {
    const app = initializeApp({
      apiKey: root.dataset.apiKey,
      appId: root.dataset.appId,
      projectId: root.dataset.projectId,
    });
    initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(root.dataset.appCheckSiteKey),
      isTokenAutoRefreshEnabled: true,
    });
    const callable = httpsCallable(
      getFunctions(app, root.dataset.functionsRegion),
      "v1GetPublicEventPreview",
    );
    const response = await callable(route);
    const preview = parsePublicEventPreview(response.data, route.signalId);
    if (preview?.availability !== "AVAILABLE") {
      renderUnavailable(messages);
      return;
    }
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.href = `${location.origin}/events/${encodeURIComponent(route.signalId)}`;
    renderAvailable(preview.event, locale, messages);
  } catch {
    renderUnavailable(messages);
  }
}

void loadPreview();
