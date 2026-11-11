import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import markdown from "unplugin-vue-markdown/vite";
import anchor from "markdown-it-anchor";
import { slug } from "github-slugger";

export default defineConfig({
  build: {
    assetsDir: "_assets",
  },
  plugins: [
    vue({
      include: [/\.vue$/, /\.md$/],
      template: { compilerOptions: { whitespace: "preserve" } },
    }),
    markdown({
      headEnabled: false,
      wrapperDiv: false,
      wrapperComponent: (id) => (id.includes("/docs/") ? "DocsLayout" : "ArticleLayout"),
      markdownOptions: { html: true, typographer: true },
      markdownSetup(md) {
        md.disable("replacements");
        md.use(anchor, { slugify: slug, tabIndex: false });
      },
    }),
    {
      name: "dev-favicon",
      apply: "serve",
      configureServer(server) {
        server.middlewares.use("/favicon.ico", (_req, res) => {
          res.statusCode = 302;
          res.setHeader("Location", "/BeautyAppsFavicon.png");
          res.end();
        });
      },
    },
  ],
  ssgOptions: {
    entry: "src/Main.js",
    dirStyle: "nested",
  },
});
