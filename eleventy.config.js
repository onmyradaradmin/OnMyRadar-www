import {readEventPreviewConfig} from "./config/event-preview-config.js";

export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({"src/assets": "assets"});
  eleventyConfig.addPassthroughCopy({"src/icon-192.png": "icon-192.png"});
  eleventyConfig.addPassthroughCopy({"src/icon-512.png": "icon-512.png"});
  eleventyConfig.addPassthroughCopy({"src/favicon.ico": "favicon.ico"});
  eleventyConfig.addPassthroughCopy({
    "src/.well-known/apple-app-site-association": ".well-known/apple-app-site-association",
  });
  eleventyConfig.addGlobalData("isProduction", process.env.SITE_ENV === "production");
  const eventPreviewConfig = readEventPreviewConfig(process.env);
  eleventyConfig.addGlobalData("eventPreviewConfig", eventPreviewConfig);
  return {
    dir: {input: "src", includes: "_includes", output: "_site"},
    htmlTemplateEngine: "njk",
    pathPrefix: process.env.SITE_PATH_PREFIX ?? "/",
  };
}
