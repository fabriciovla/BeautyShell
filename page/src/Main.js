import { ViteSSG } from "vite-ssg";
import App from "./App.vue";
import Article from "./layouts/Article.vue";
import Docs from "./layouts/Docs.vue";
import { routes } from "./Routes.js";
import "./assets/styles/Base.css";
import "./assets/styles/Content.css";
import "./assets/styles/Utilities.css";

export const createApp = ViteSSG(
  App,
  {
    routes,

    scrollBehavior(to, from, saved) {
      if (saved) return saved;
      const wait = (pos) => new Promise((resolve) => setTimeout(() => resolve({ ...pos, behavior: "instant" }), 170));
      return to.hash ? wait({ el: to.hash, top: 80 }) : wait({ top: 0 });
    },
  },
  ({ app }) => {
    app.component("DocsLayout", Docs);
    app.component("ArticleLayout", Article);
  },
  { hydration: import.meta.env.PROD },
);
