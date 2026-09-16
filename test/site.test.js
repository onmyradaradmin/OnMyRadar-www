import {readFile} from "node:fs/promises";
import {describe, expect, it} from "vitest";

const pathPrefix = process.env.SITE_PATH_PREFIX ?? "/";

describe("generated site", () => {
  it.each([
    ["English home", "_site/index.html", 'lang="en"'],
    ["German home", "_site/de/index.html", 'lang="de"'],
    ["English privacy", "_site/privacy/index.html", "Your data, your control"],
    ["German privacy", "_site/de/privacy/index.html", "Deine Daten, deine Kontrolle"],
    ["English terms", "_site/terms/index.html", "Terms of Service"],
    ["German terms", "_site/de/terms/index.html", "Nutzungsbedingungen"],
    ["English support", "_site/support/index.html", "We’re here to help"],
    ["German support", "_site/de/hilfe/index.html", "Wir helfen weiter"],
    ["English account deletion", "_site/delete-account/index.html", "Delete your account"],
    ["German account deletion", "_site/de/konto-loeschen/index.html", "Konto löschen"],
    ["Private app-link fallback", "_site/app/index.html", "Continue in the OnMyRadar app"],
    ["Public event preview shell", "_site/events/index.html", "Loading event"],
  ])("contains required %s content", async (_name, path, content) => {
    await expect(readFile(path, "utf8")).resolves.toContain(content);
  });

  it("keeps private communication fallbacks out of search results", async () => {
    const fallback = await readFile("_site/app/index.html", "utf8");
    expect(fallback).toContain('name="robots" content="noindex,nofollow"');
    expect(fallback).toContain("is not displayed on the public website");
    expect(fallback).not.toMatch(/match_[A-Za-z0-9_-]+|notification_[A-Za-z0-9_-]+/);

    const notFound = await readFile("_site/404.html", "utf8");
    expect(notFound).toContain("its destination is private");
    expect(notFound).toContain(`href="${pathPrefix}app/"`);
  });

  it("keeps public preview configuration fail-closed and privacy-minimal", async () => {
    const preview = await readFile("_site/events/index.html", "utf8");
    const enabled = process.env.EVENT_PREVIEW_ENABLED === "true";
    expect(preview).toContain('data-event-preview');
    expect(preview).toContain(`data-enabled="${enabled}"`);
    expect(preview).toContain('name="robots" content="noindex,nofollow"');
    expect(preview).toContain(`src="${pathPrefix}assets/event-preview.js"`);
    expect(preview).not.toMatch(/ownerId|matchId|radarId|sourceUrl|latitude|longitude|address/);
    if (enabled) {
      expect(preview).toContain("https://firebaseappcheck.googleapis.com");
      expect(preview).toContain("https://us-west1-onmyradar-dev-508414.cloudfunctions.net");
      expect(preview).toContain('data-project-id="onmyradar-dev-508414"');
    } else {
      expect(preview).toContain("connect-src 'none'");
      expect(preview).toContain('data-project-id=""');
    }

    const fallback = await readFile("_site/404.html", "utf8");
    expect(fallback).toContain('data-fallback="true"');
    expect(fallback).toContain('data-standard-not-found');
  });

  it("publishes robots and sitemap files", async () => {
    const robots = await readFile("_site/robots.txt", "utf8");
    expect(robots).toContain(process.env.SITE_ENV === "production" ?
      "Sitemap: https://onmyradar.pro/sitemap.xml" : "Disallow: /");
    await expect(readFile("_site/sitemap.xml", "utf8")).resolves.toContain("<urlset");
  });

  it("disables Jekyll filtering so security and app-association files remain public", async () => {
    await expect(readFile("_site/.nojekyll", "utf8"))
      .resolves.toContain("Publish the Eleventy artifact verbatim");
    await expect(readFile("_site/.well-known/security.txt", "utf8"))
      .resolves.toContain("Contact: mailto:info@onmyradar.pro");
    await expect(readFile("_site/.well-known/apple-app-site-association", "utf8"))
      .resolves.toContain("AH26GKFR55.pro.onmyradar.app");
    await expect(readFile(".github/workflows/pages.yml", "utf8"))
      .resolves.toContain("include-hidden-files: true");
  });

  it("publishes only the verified production Apple association", async () => {
    const association = JSON.parse(await readFile(
      "_site/.well-known/apple-app-site-association",
      "utf8",
    ));
    expect(association).toEqual({
      applinks: {
        apps: [],
        details: [{
          appIDs: ["AH26GKFR55.pro.onmyradar.app"],
          components: [
            {"/": "/events/*", comment: "Canonical public event-share links"},
            {"/": "/app/matches/*", comment: "Authenticated Match email links"},
            {"/": "/app/events/*", comment: "Authenticated event-change email links"},
            {"/": "/app/notifications/*", comment: "Authenticated cancellation email links"},
          ],
        }],
      },
    });
    await expect(readFile("_site/.well-known/assetlinks.json", "utf8"))
      .rejects.toMatchObject({code: "ENOENT"});
  });

  it("supports the GitHub Pages project path", async () => {
    const home = await readFile("_site/index.html", "utf8");
    expect(home).toContain(`href="${pathPrefix}assets/styles.css"`);
    expect(home).toContain(`src="${pathPrefix}icon-192.png"`);
  });

  it("only upgrades subresources when the site is served over production HTTPS", async () => {
    const home = await readFile("_site/index.html", "utf8");
    if (process.env.SITE_ENV === "production") {
      expect(home).toContain("upgrade-insecure-requests");
    } else {
      expect(home).not.toContain("upgrade-insecure-requests");
    }
  });
});
