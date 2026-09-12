export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({"src/assets": "assets"});
  return {
    dir: {input: "src", includes: "_includes", output: "_site"},
    htmlTemplateEngine: "njk",
    pathPrefix: process.env.SITE_PATH_PREFIX ?? "/",
  };
}
