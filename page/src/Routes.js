import { DOCS } from "./DocsNav.js";

const pages = import.meta.glob("./pages/**/*.{vue,md}");

const spanishSlugs = {
  terms: "terminos",
  privacy: "privacidad",
  ...Object.fromEntries(
    Object.values(DOCS)
      .flat()
      .flatMap((group) => group.pages)
      .map((page) => [page.slug.en, page.slug.es]),
  ),
};

const toSlug = (name) => name.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();

const toPath = (file) => {
  const path = file.replace(/^\.\/pages/, "").replace(/\.(vue|md)$/, "").replace(/\/Index$/, "");
  const slash = path.lastIndexOf("/") + 1;
  const slug = toSlug(path.slice(slash));
  const isEnglish = /^\/en(\/|$)/.test(path);
  return (path.slice(0, slash) + (isEnglish ? slug : spanishSlugs[slug] ?? slug)) || "/";
};

export const routes = Object.entries(pages).map(([file, component]) => ({
  path: toPath(file),
  component,
}));
