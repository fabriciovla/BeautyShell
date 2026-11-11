import { routes } from "./I18n.js";

const page = (id, es, en, titleEs, titleEn) => ({
  id,
  slug: { es, en },
  title: { es: titleEs, en: titleEn },
});

export const DOCS_HOME = page("home", "", "", "Documentación", "Documentation");

const SHELL_DOCS = [
  {
    icon: "rocket_launch",
    title: { es: "Empezar", en: "Get started" },
    pages: [
      page("install", "instalacion", "installation", "Instalación", "Installation"),
      page("first-steps", "primeros-pasos", "first-steps", "Primeros pasos", "First steps"),
    ],
  },
  {
    icon: "widgets",
    title: { es: "Uso", en: "Using it" },
    pages: [
      page("tabs", "pestanas", "tabs", "Pestañas y carpetas", "Tabs and folders"),
      page("panes", "paneles", "panes", "Paneles divididos", "Split panes"),
      page("browser", "navegador", "browser", "Navegador integrado", "Built-in browser"),
      page("tools", "herramientas", "tools", "Paleta, espacios y más", "Palette, workspaces and more"),
      page("keys", "atajos", "keybindings", "Atajos de teclado", "Keybindings"),
    ],
  },
  {
    icon: "terminal",
    title: { es: "Shells", en: "Shells" },
    pages: [
      page("shells", "shells", "shells", "Shells compatibles", "Supported shells"),
      page("suggestions", "sugerencias", "suggestions", "Sugerencias", "Suggestions"),
    ],
  },
  {
    icon: "smart_toy",
    title: { es: "Agentes", en: "Agents" },
    pages: [
      page("agents", "agentes", "agents", "Agentes de código", "Coding agents"),
      page("mcp", "mcp", "mcp", "Servidor MCP", "MCP server"),
    ],
  },
  {
    icon: "tune",
    title: { es: "Configuración", en: "Configuration" },
    pages: [
      page("appearance", "apariencia", "appearance", "Apariencia", "Appearance"),
      page("settings", "ajustes", "settings", "Referencia de ajustes", "Settings reference"),
    ],
  },
  {
    icon: "code",
    title: { es: "Terminal API (VT)", en: "Terminal API (VT)" },
    pages: [
      page("sequences", "secuencias", "escape-sequences", "Secuencias de escape", "Escape sequences"),
      page("architecture", "arquitectura", "architecture", "Arquitectura", "Architecture"),
    ],
  },
  {
    icon: "help",
    title: { es: "Ayuda", en: "Help" },
    pages: [page("troubleshooting", "problemas", "troubleshooting", "Problemas frecuentes", "Troubleshooting")],
  },
];

const SCREENSHOT_DOCS = [
  {
    icon: "rocket_launch",
    title: { es: "Empezar", en: "Get started" },
    pages: [page("install", "instalacion", "installation", "Instalación", "Installation")],
  },
  {
    icon: "widgets",
    title: { es: "Uso", en: "Using it" },
    pages: [
      page("capture", "capturar", "capturing", "Capturar", "Capturing"),
      page("settings", "ajustes", "settings", "Ajustes", "Settings"),
    ],
  },
  {
    icon: "help",
    title: { es: "Ayuda", en: "Help" },
    pages: [page("troubleshooting", "problemas", "troubleshooting", "Problemas frecuentes", "Troubleshooting")],
  },
];

export const DOCS = { shell: SHELL_DOCS, screenshot: SCREENSHOT_DOCS };

const all = (app) => [DOCS_HOME, ...DOCS[app].flatMap((g) => g.pages)];

export const docHref = (app, id, lang) => {
  const p = all(app).find((x) => x.id === id);
  if (!p) throw new Error(`No hay una página de documentación "${id}" en ${app}`);
  const base = routes[lang].docs[app];
  return p.slug[lang] ? `${base}${p.slug[lang]}/` : base;
};

export function neighbors(app, id, lang) {
  const pages = all(app);
  const i = pages.findIndex((x) => x.id === id);
  const link = (p) => (p ? { title: p.title[lang], href: docHref(app, p.id, lang) } : null);
  return { prev: link(pages[i - 1]), next: link(pages[i + 1]) };
}

export const docTitle = (app, id, lang) => all(app).find((x) => x.id === id)?.title[lang] ?? "";

export function docFromPath(path) {
  const clean = path.replace(/\/?$/, "/");
  for (const app of Object.keys(DOCS)) {
    for (const lang of ["es", "en"]) {
      for (const p of all(app)) if (docHref(app, p.id, lang) === clean) return { app, lang, id: p.id };
    }
  }
  return null;
}
