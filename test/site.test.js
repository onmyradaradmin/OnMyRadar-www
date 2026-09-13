import {readFile} from "node:fs/promises";
import {describe, expect, it} from "vitest";

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
  ])("contains required %s content", async (_name, path, content) => {
    await expect(readFile(path, "utf8")).resolves.toContain(content);
  });

  it("publishes robots and sitemap files", async () => {
    const robots = await readFile("_site/robots.txt", "utf8");
    expect(robots).toContain(process.env.SITE_ENV === "production" ?
      "Sitemap: https://onmyradar.pro/sitemap.xml" : "Disallow: /");
    await expect(readFile("_site/sitemap.xml", "utf8")).resolves.toContain("<urlset");
  });

  it("supports the GitHub Pages project path", async () => {
    const home = await readFile("_site/index.html", "utf8");
    const prefix = process.env.SITE_PATH_PREFIX ?? "/";
    expect(home).toContain(`href="${prefix}assets/styles.css"`);
    expect(home).toContain(`src="${prefix}icon-192.png"`);
  });
});
