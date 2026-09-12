import {readFile} from "node:fs/promises";
import {describe, expect, it} from "vitest";

describe("generated site", () => {
  it.each([
    ["English home", "_site/index.html", 'lang="en"'],
    ["German home", "_site/de/index.html", 'lang="de"'],
    ["English privacy", "_site/privacy/index.html", "pre-launch placeholder"],
    ["German privacy", "_site/de/datenschutz/index.html", "Platzhalter"],
  ])("contains required %s content", async (_name, path, content) => {
    await expect(readFile(path, "utf8")).resolves.toContain(content);
  });

  it("publishes robots and sitemap files", async () => {
    await expect(readFile("_site/robots.txt", "utf8")).resolves.toContain("Sitemap:");
    await expect(readFile("_site/sitemap.xml", "utf8")).resolves.toContain("<urlset");
  });
});
