import "./settings.css";

import logo from "../assets/logo.png";
import { checkForUpdates, installAndRestart, SELF_UPDATES, updateState } from "./updater";
import { AGENTS } from "./agent-catalog";
import { FONTS, WEIGHTS, type FontPref, type FontWeightPref } from "./fonts";
import { icons } from "./icons";
import { t } from "./lang";
import { NOTIFY_AFTER_MS, notificationsEnabled, setNotificationsEnabled } from "./notify";
import { showMenu } from "./menu";
import { miniWindow } from "./mini-window";
import { IS_WINDOWS, SYSTEM_NAME } from "./platform";
import type { ShellInfo } from "./pty";
import { DEFAULT_SPACE, normalizeSpace, type Space } from "./space";

export type ThemePref = "light" | "dark" | "system";
export type EffectPref = "acrylic" | "mica" | "none";
export type CursorPref = "bar" | "block" | "underline";
export type TabLayoutPref = "vertical" | "horizontal";

export type TerminalBgPref = "solid" | "soft" | "glass";
export type { FontPref, FontWeightPref };

export const TERMINAL_FONTS = Object.fromEntries(FONTS.map((f) => [f.id, f.family])) as Record<FontPref, string>;

export interface Settings {
  theme: ThemePref;
  effect: EffectPref;
  glass: number;
  terminalBg: TerminalBgPref;

  terminalOpacity: number;
  fontSize: number;
  fontFamily: FontPref;
  fontWeight: FontWeightPref;
  lineHeight: number;
  shell: string;
  restore: boolean;
  cursorStyle: CursorPref;
  cursorBlink: boolean;
  copyOnSelect: boolean;

  suggestions: boolean;
  scrollback: number;
  sidebarPinned: boolean;
  sidebarWidth: number;

  tabLayout: TabLayoutPref;

  space: Space;
}

export const DEFAULT_FONT_SIZE = 13;

const KEY = "vidrio.settings";

const DEFAULTS: Settings = {
  theme: "light",

  effect: IS_WINDOWS ? "acrylic" : "none",
  glass: 0.75,
  terminalBg: "solid",
  terminalOpacity: 0.72,
  fontSize: DEFAULT_FONT_SIZE,
  fontFamily: "jetbrains",
  fontWeight: "regular",
  lineHeight: 1,

  shell: IS_WINDOWS ? "pwsh" : "",
  restore: true,
  cursorStyle: "bar",
  cursorBlink: true,
  copyOnSelect: false,
  suggestions: true,
  scrollback: 10000,
  sidebarPinned: true,
  sidebarWidth: 260,
  tabLayout: "vertical",
  space: DEFAULT_SPACE,
};

export function loadSettings(): Settings {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? "{}");

    if (!saved.terminalBg && saved.terminalGlass) saved.terminalBg = "glass";
    delete saved.terminalGlass;
    const loaded: Settings = { ...DEFAULTS, ...saved, space: normalizeSpace(saved.space) };
    if (!IS_WINDOWS) loaded.effect = "none";
    return loaded;
  } catch {
    return { ...DEFAULTS, space: normalizeSpace(undefined) };
  }
}

export function saveSettings(settings: Settings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
  }
}

export const clampFontSize = (n: number) => Math.min(28, Math.max(9, n));

export const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

const SCROLLBACK_STEPS = [1000, 2000, 5000, 10000, 25000, 50000, 100000];
const scrollbackIndex = (n: number) => {
  const i = SCROLLBACK_STEPS.findIndex((step) => step >= n);
  return i < 0 ? SCROLLBACK_STEPS.length - 1 : i;
};
const thousands = (n: number) => `${n / 1000}k`;

type Option = [value: string, label: string, style?: string, title?: string];

const seg = (key: keyof Settings, current: string, options: Option[], extra = "") =>
  `<div class="seg ${extra}" data-key="${key}" role="radiogroup"><span class="seg-thumb" aria-hidden="true"></span>${options
    .map(
      ([v, label, style, title]) =>
        `<button data-v="${v}" class="${v === current ? "on" : ""}" role="radio" aria-checked="${v === current}"${style ? ` style="${style}"` : ""}${title ? ` title="${title}" aria-label="${title}"` : ""}>${label}</button>`,
    )
    .join("")}</div>`;

const select = (key: keyof Settings, current: string, options: [value: string, label: string, style?: string][]) => {
  const [, label, style] = options.find(([v]) => v === current) ?? [current, current];
  return `<button class="popup" data-popup="${key}" data-v="${esc(current)}" data-options="${esc(JSON.stringify(options))}" aria-haspopup="menu"><span${style ? ` style="${esc(style)}"` : ""}>${esc(label)}</span>${icons.down}</button>`;
};

const toggle = (key: keyof Settings, on: boolean) =>
  `<input type="checkbox" class="switch" data-key="${key}" ${on ? "checked" : ""}>`;

const filled = (min: number, max: number, value: number) => `${((value - min) / (max - min)) * 100}%`;

const slider = (key: string, min: number, max: number, step: number, value: number, label: string) =>
  `<div class="range"><input type="range" data-key="${key}" min="${min}" max="${max}" step="${step}" value="${value}" style="--filled: ${filled(min, max, value)}"><output>${label}</output></div>`;

const slug = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const settingRow = (name: string, desc: string, control: string, id = slug(name)) => `
  <div class="st-row" data-row="${id}">
    <div class="st-row-text"><span class="st-row-name">${name}</span>${desc ? `<span class="st-row-desc">${desc}</span>` : ""}</div>
    <div class="st-row-control">${control}</div>
  </div>`;

const collapsible = (when: string, open: boolean, content: string) =>
  `<div class="st-collapsible ${open ? "open" : ""}" data-when="${when}" ${open ? "" : "inert"}><div class="st-collapsible-in">${content}</div></div>`;

const blockSection = (name: string, content: string) =>
  `<div class="st-block" data-row="${slug(name)}" data-name="${name}">${content}</div>`;

const settingGroup = (title: string, desc: string, body: string, aside = "") => `
  <section class="st-group">
    <header class="st-group-head"><h2>${title}</h2>${aside}</header>
    ${desc ? `<p class="st-group-desc">${desc}</p>` : ""}
    <div class="st-card">${body}</div>
  </section>`;

const minis = (key: keyof Settings, current: string, items: [value: string, label: string, drawing: string][]) =>
  `<div class="st-minis" data-key="${key}" role="radiogroup">${items
    .map(
      ([v, label, drawing]) => `
    <button class="st-mini ${v === current ? "on" : ""}" data-v="${v}" role="radio" aria-checked="${v === current}">
      <span class="st-mini-frame">${drawing}<span class="st-check">${icons.check}</span></span>
      <span class="st-mini-name">${label}</span>
    </button>`,
    )
    .join("")}</div>`;

const keys = (combo: string) =>
  combo
    .split(" / ")
    .map((alt) => `<span class="combo">${alt.split(" ").map((k) => `<kbd>${esc(k)}</kbd>`).join("")}</span>`)
    .join(`<span class="combo-or">${t("o", "or")}</span>`);

type SectionId = "appearance" | "terminal" | "agents" | "shortcuts" | "about";

interface Section {
  id: SectionId;
  name: string;
  icon: string;
  lead: string;
}

const SECTIONS: Section[] = [
  { id: "appearance", name: t("Apariencia", "Appearance"), icon: icons.palette, lead: t("El tema, el vidrio de la ventana, las pestañas y el texto.", "The theme, the window glass, the tabs and the text.") },
  { id: "terminal", name: "Terminal", icon: icons.terminal, lead: t("La shell que abre Beauty Shell y cómo se comporta adentro.", "The shell Beauty Shell opens and how it behaves inside.") },
  { id: "agents", name: t("Agentes", "Agents"), icon: icons.bot, lead: t("Los agentes de código que tenés instalados y cómo se hablan entre sesiones.", "The coding agents you have installed and how they talk across sessions.") },
  { id: "shortcuts", name: t("Atajos", "Shortcuts"), icon: icons.keyboard, lead: t("Los mismos que Chrome, más los propios de una terminal.", "The same as Chrome, plus the ones a terminal needs.") },
  {
    id: "about",
    name: t("Acerca de", "About"),
    icon: icons.info,
    lead: !SELF_UPDATES
      ? t("La versión de Beauty Shell.", "The Beauty Shell version.")
      : t("La versión de Beauty Shell y sus actualizaciones.", "The Beauty Shell version and its updates."),
  },
];

let section: SectionId = "appearance";

const tile = (sec: Section, size = "") =>
  `<span class="st-tile ${size}">${sec.icon}</span>`;

const hero = (sec: Section) => `
  <header class="st-hero">
    ${tile(sec, "large")}
    <div><h1>${sec.name}</h1><p>${sec.lead}</p></div>
  </header>`;

const SHORTCUTS: { title: string; desc?: string; items: [string, string][] }[] = [
  {
    title: t("Pestañas", "Tabs"),
    items: [
      [t("Nueva terminal en la misma carpeta", "New terminal in the same folder"), "Ctrl T"],
      [t("Cerrar pestaña", "Close tab"), "Ctrl Shift W"],
      [t("Reabrir lo último cerrado", "Reopen what you last closed"), "Ctrl Shift T"],
      [t("Pestaña siguiente", "Next tab"), t("Ctrl Tab / Ctrl AvPág", "Ctrl Tab / Ctrl PgDn")],
      [t("Pestaña anterior", "Previous tab"), t("Ctrl Shift Tab / Ctrl RePág", "Ctrl Shift Tab / Ctrl PgUp")],
      [t("Ir a la pestaña 1…8", "Go to tab 1…8"), "Ctrl 1…8"],
      [t("Ir a la última pestaña", "Go to the last tab"), "Ctrl 9"],
    ],
  },
  {
    title: t("Paneles", "Panes"),
    items: [
      [t("Dividir a la derecha", "Split right"), "Ctrl Shift D"],
      [t("Dividir abajo", "Split down"), "Ctrl Shift E"],
      [t("Agrandar o achicar el panel", "Zoom the pane in or out"), "Ctrl Shift Z"],
      [t("Cerrar panel", "Close pane"), "Ctrl W"],
      [t("Moverse entre paneles", "Move between panes"), "Alt ← ↑ → ↓"],
    ],
  },
  {
    title: "Terminal",
    desc: t(
      "Ctrl+W y Ctrl+F los toma Beauty Shell, así que no le llegan al programa que corre en la terminal. Saltar entre comandos funciona en PowerShell.",
      "Beauty Shell takes Ctrl+W and Ctrl+F, so they don't reach the program running in the terminal. Jumping between commands works in PowerShell.",
    ),
    items: [
      [t("Buscar", "Find"), "Ctrl F"],
      [t("Ir al comando anterior o siguiente", "Go to the previous or next command"), "Ctrl ↑ / Ctrl ↓"],
      [t("Copiar la selección", "Copy the selection"), "Ctrl C / Ctrl Shift C"],
      [t("Pegar", "Paste"), "Ctrl V / Ctrl Shift V"],
      [t("Abrir enlace", "Open link"), t("Ctrl Clic", "Ctrl Click")],
      [t("Agrandar la letra", "Bigger text"), "Ctrl +"],
      [t("Achicar la letra", "Smaller text"), "Ctrl −"],
      [t("Tamaño original", "Original size"), "Ctrl 0"],
    ],
  },
  {
    title: t("Ventana", "Window"),
    items: [
      [t("Paleta de comandos", "Command palette"), "Ctrl Shift P"],
      [t("Mostrar u ocultar la barra lateral", "Show or hide the sidebar"), "Ctrl Shift B"],
      [t("Modo Quake, desde cualquier programa", "Quake mode, from any program"), "Win `"],
      [t("Pantalla completa", "Full screen"), "F11"],
      [t("Ajustes", "Settings"), "Ctrl ,"],
      [t("Buscar en los ajustes", "Search settings"), "Ctrl F"],
      [t("Cerrar ajustes o menús", "Close settings or menus"), "Esc"],
    ],
  },
];

export interface AgentSettings {
  port: number;

  status: string;
  busy: boolean;

  found: Record<string, string | null> | null;
  claudeConnected: boolean;
  version: string;
  onConnect(): void;
  onRescan(): void;
}

const THEMES: [string, string, string][] = [
  ["light", t("Claro", "Light"), miniWindow("light")],
  ["dark", t("Oscuro", "Dark"), miniWindow("dark")],
  ["system", IS_WINDOWS ? t("Como Windows", "Like Windows") : t("Como el sistema", "Like the system"), `${miniWindow("light")}<span class="ob-half">${miniWindow("dark")}</span>`],
];

const TAB_LAYOUTS: [string, string, string][] = [
  ["vertical", t("Al costado", "On the side"), `<span class="st-drawing"><i class="d-side"><b></b><b></b><b></b></i><i class="d-main"><b class="pr"></b><b></b></i></span>`],
  ["horizontal", t("Arriba", "On top"), `<span class="st-drawing on-top"><i class="d-strip"><b></b><b></b><b></b></i><i class="d-main"><b class="pr"></b><b></b></i></span>`],
];

const weightOf = (s: Settings) => WEIGHTS[s.fontWeight]?.value ?? 400;
const cssFamily = (family: string) => family.replace(/"/g, "'");

const sampleStyle = (s: Settings) =>
  `font-family: ${cssFamily(TERMINAL_FONTS[s.fontFamily] ?? TERMINAL_FONTS.jetbrains)}; font-size: ${s.fontSize}px; font-weight: ${weightOf(s)}; line-height: ${(1.25 * s.lineHeight).toFixed(3)}`;

const sample = (s: Settings) => `
  <div class="st-sample" data-sample style="${sampleStyle(s)}">
    <div><span class="m-ps">PS</span> <span class="m-path">C:\\Users\\${t("vos", "you")}</span>&gt; claude<i class="m-cursor ${s.cursorStyle}${s.cursorBlink ? " blinking" : ""}"></i></div>
    <div class="m-dim">✻ Welcome to Claude Code!</div>
  </div>`;

let stepDir = "";

function appearance(s: Settings) {
  return [
    settingGroup(t("Tema", "Theme"), "", blockSection(t("Tema", "Theme"), minis("theme", s.theme, THEMES))),
    settingGroup(t("Fondo", "Background"), "", [
      IS_WINDOWS ? settingRow(t("Ventana", "Window"), "", seg("effect", s.effect, [
        ["acrylic", t("Acrílico", "Acrylic")],
        ["mica", "Mica"],
        ["none", t("Sólido", "Solid")],
      ]), "fondo-de-la-ventana") : "",
      collapsible("effect!=none", s.effect !== "none", settingRow(t("Vidrio", "Glass"), "",
        slider("glass", 0, 1, 0.01, s.glass, `${Math.round(s.glass * 100)}%`), "intensidad-del-vidrio")),
      settingRow("Terminal", "", seg("terminalBg", s.terminalBg, [
        ["solid", t("Puro", "Pure")],
        ["soft", t("Gris", "Gray")],
        ["glass", t("Vidrio", "Glass")],
      ]), "fondo-de-la-terminal"),
      collapsible("terminalBg=glass", s.terminalBg === "glass", settingRow(t("Opacidad", "Opacity"), "",
        slider("terminalOpacity", 0.3, 1, 0.01, s.terminalOpacity, `${Math.round(s.terminalOpacity * 100)}%`), "opacidad-de-la-terminal")),
    ].join("")),
    settingGroup(t("Pestañas", "Tabs"), t("Al costado, agrupadas por carpeta, o arriba, como en Chrome.", "On the side, grouped by folder, or on top, like in Chrome."),
      blockSection(t("Ubicación de las pestañas", "Tab position"), minis("tabLayout", s.tabLayout, TAB_LAYOUTS))),
    settingGroup(t("Texto", "Text"), t("En las terminales. El tamaño también cambia con Ctrl + y Ctrl −.", "In the terminals. The size also changes with Ctrl + and Ctrl −."), [
      blockSection(t("Vista previa del texto", "Text preview"), sample(s)),
      settingRow(t("Fuente", "Font"), "", select("fontFamily", s.fontFamily, FONTS.filter((f) => IS_WINDOWS || !("windowsOnly" in f)).map((f) => [f.id, f.name, `font-family: ${cssFamily(f.family)}`]))),
      settingRow(t("Tamaño de letra", "Font size"), "", `
        <div class="stepper">
          <button class="icon-btn" data-step="-1" title="${t("Más chica", "Smaller")}">${icons.minus}</button>
          <output><span class="${stepDir}">${s.fontSize}</span></output>
          <button class="icon-btn" data-step="1" title="${t("Más grande", "Bigger")}">${icons.plus}</button>
        </div>`),
      settingRow(t("Grosor", "Weight"), t("Con vidrio va un punto más grueso: se dibuja sin ClearType.", "With glass it goes one step bolder: it's drawn without ClearType."), seg("fontWeight", s.fontWeight,
        Object.entries(WEIGHTS).map(([key, w]) => [key, w.label, `font-weight: ${w.value}`]))),
      settingRow(t("Interlineado", "Line height"), t("El aire entre una línea y la siguiente.", "The room between one line and the next."),
        slider("lineHeight", 1, 1.6, 0.05, s.lineHeight, s.lineHeight.toFixed(2))),
    ].join("")),
  ];
}

function terminal(s: Settings, shells: ShellInfo[]) {
  return [
    settingGroup("Shell", t("Cada terminal nueva abre esta shell en la carpeta de la pestaña actual. Con clic derecho en «Nueva terminal» elegís otra.", "Every new terminal opens this shell in the current tab's folder. Right-click “New terminal” to pick another one."),
      settingRow(t("Predeterminada", "Default"), "", select("shell", s.shell, shells.map((sh) => [sh.id, sh.name])), "shell-predeterminada")),
    settingGroup("Cursor", "", [
      settingRow(t("Forma", "Shape"), "", seg("cursorStyle", s.cursorStyle, [
        ["bar", `<i class="ob-glyph bar"></i>`, "", t("Barra", "Bar")],
        ["block", `<i class="ob-glyph block"></i>`, "", t("Bloque", "Block")],
        ["underline", `<i class="ob-glyph underline"></i>`, "", t("Subrayado", "Underline")],
      ], "glyphs"), "forma-del-cursor"),
      settingRow(t("Parpadeo", "Blink"), "", toggle("cursorBlink", s.cursorBlink), "parpadeo-del-cursor"),
    ].join("")),
    settingGroup(t("Escritura", "Typing"), "", [
      settingRow(t("Copiar al seleccionar", "Copy on select"), t("El texto que seleccionás se copia al portapapeles.", "The text you select is copied to the clipboard."), toggle("copyOnSelect", s.copyOnSelect)),
      settingRow(
        t("Sugerir al escribir", "Suggest as you type"),
        t(
          "En PowerShell, el resto del comando en gris: los que usaste en esta carpeta primero, y un cd solo si esa carpeta existe acá. Tab o → lo aceptan.",
          "In PowerShell, the rest of the command in gray: the ones you used in this folder first, and a cd only if that folder exists here. Tab or → accepts it.",
        ),
        toggle("suggestions", s.suggestions),
      ),
    ].join("")),
    settingGroup(t("Historial y sesiones", "History and sessions"), "", [
      settingRow(t("Líneas de historial", "Scrollback lines"), t("Las que se guardan por encima de la pantalla visible, en cada terminal.", "The ones kept above the visible screen, in each terminal."),
        slider("scrollback", 0, SCROLLBACK_STEPS.length - 1, 1, scrollbackIndex(s.scrollback), thousands(s.scrollback))),
      settingRow(t("Restaurar al abrir", "Restore on launch"), t("Vuelven las pestañas, los paneles divididos, las carpetas y los nombres.", "Tabs, split panes, folders and names come back."), toggle("restore", s.restore)),
    ].join("")),
    settingGroup(t("Avisos", "Notifications"), "",
      settingRow(
        t("Avisar al terminar", "Notify when done"),
        t(
          `Si un comando tarda más de ${NOTIFY_AFTER_MS / 1000} s y Beauty Shell no está al frente, ${SYSTEM_NAME} te avisa y la barra de tareas parpadea.`,
          `If a command takes longer than ${NOTIFY_AFTER_MS / 1000} s and Beauty Shell isn't in front, ${SYSTEM_NAME} lets you know and the taskbar flashes.`,
        ),
        `<input type="checkbox" class="switch" data-notify ${notificationsEnabled() ? "checked" : ""}>`)),
  ];
}

function agentsSection(agents: AgentSettings) {
  const found = agents.found;
  const list = [...AGENTS].sort((a, b) => Number(!found?.[a.id]) - Number(!found?.[b.id])).map((agent) => {
    const path = found?.[agent.id];

    const install = agent.install
      ? `<button class="btn compact" data-install="${agent.id}" title="${esc(agent.install)}">${icons.download}<span>${t("Instalar", "Install")}</span></button>`
      : agent.docs
        ? `<button class="btn compact" data-install="${agent.id}" title="${esc(agent.docs)}">${icons.external}<span>${t("Cómo instalarlo", "How to install it")}</span></button>`
        : `<span class="st-agent-where muted">${t("No instalado", "Not installed")}</span>`;
    const where = !found ? `<span class="st-agent-where muted">${t("Buscando…", "Searching…")}</span>`
      : path ? `<span class="st-agent-where" title="${esc(path)}">${esc(path)}</span>`
      : `<span class="st-agent-end">${install}</span>`;
    return `<div class="st-agent ${path ? "" : "missing"}" data-row="${slug(agent.name)}"><span class="st-agent-icon">${agent.icon}</span><span class="st-agent-name">${agent.name}</span>${where}</div>`;
  }).join("");
  const count = found ? AGENTS.filter((a) => found[a.id]).length : 0;

  const claudePath = found?.claude;
  const connectLabel = agents.busy
    ? t("Conectando…", "Connecting…")
    : agents.claudeConnected ? t("Volver a conectar", "Reconnect") : t("Conectar", "Connect");
  const claudeState = agents.claudeConnected
    ? `<span class="badge on">${t("Conectado", "Connected")}</span>`
    : `<span class="badge">${t("Sin conectar", "Not connected")}</span>`;

  return [
    settingGroup(
      t("Instalados", "Installed"),
      found
        ? `${count ? t(`Encontré ${count} de ${AGENTS.length}.`, `Found ${count} of ${AGENTS.length}.`) : t("No encontré ninguno.", "Found none.")} ${t("Escribí cualquiera de estos en una terminal y Beauty Shell sigue su estado en la barra lateral.", "Type any of these in a terminal and Beauty Shell follows its status in the sidebar.")}`
        : t("Buscando en el PATH y en las carpetas donde suelen instalarse…", "Searching the PATH and the folders where they usually get installed…"),
      list,
      `<button class="link-btn" data-rescan ${found ? "" : "disabled"}>${icons.refresh}${t("Volver a buscar", "Search again")}</button>`,
    ),
    settingGroup(
      t("Mensajes entre sesiones", "Messages between sessions"),
      t(
        "Los agentes que corren en una terminal pueden ver las demás sesiones, leer su pantalla y escribirles. Después de conectar, reiniciá las sesiones de Claude Code que estaban abiertas.",
        "Agents running in a terminal can see the other sessions, read their screen and write to them. After connecting, restart the Claude Code sessions that were open.",
      ),
      [
        settingRow(
          "Claude Code",
          claudePath === null
            ? t("No está instalado.", "It isn't installed.")
            : t("Registra Beauty Shell como servidor MCP en tu configuración de usuario.", "Registers Beauty Shell as an MCP server in your user configuration."),
          `${claudeState}<button class="btn ${agents.claudeConnected ? "" : "primary"}" data-connect ${agents.busy || !agents.port || claudePath === null ? "disabled" : ""}>${connectLabel}</button>`,
          "conectar-claude-code",
        ),
        settingRow(
          t("Servidor MCP local", "Local MCP server"),
          agents.port
            ? t("Herramientas list_sessions, send_to_session y read_screen.", "Tools list_sessions, send_to_session and read_screen.")
            : t("No se pudo abrir un puerto.", "Couldn't open a port."),
          agents.port ? `<code>127.0.0.1:${agents.port}</code>` : `<span class="badge">${t("Apagado", "Off")}</span>`,
        ),
        agents.status ? `<div class="st-note">${esc(agents.status)}</div>` : "",
      ].join(""),
    ),
  ];
}

function shortcuts() {
  return SHORTCUTS.map(({ title, desc, items }) =>
    settingGroup(title, desc ?? "", items.map(([what, combo]) => settingRow(what, "", `<div class="keys">${keys(combo)}</div>`)).join("")),
  );
}

function about(agents: AgentSettings) {
  const sections = [
    `<section class="st-about">
      <img src="${logo}" alt="">
      <h1>Beauty Shell</h1>
      ${agents.version ? `<span class="st-version">${t("Versión", "Version")} ${esc(agents.version)}</span>` : ""}
    </section>`,
  ];
  if (SELF_UPDATES) {
    sections.push(settingGroup(
      t("Actualizaciones", "Updates"),
      t("Beauty Shell busca versiones nuevas sola y las baja sin interrumpirte; reiniciar es cosa tuya.", "Beauty Shell looks for new versions on its own and downloads them without interrupting you; restarting is up to you."),
      updateRow(),
    ));
  }
  return sections;
}

function updateRow() {
  const u = updateState();
  const search = (label: string, busy = false) =>
    `<button class="btn" data-act="buscar" ${busy ? "disabled" : ""}>${busy ? icons.spinner : icons.refresh}<span>${label}</span></button>`;
  switch (u.status) {
    case "checking": return settingRow(t("Buscando…", "Checking…"), "", search(t("Buscar", "Check"), true), "actualizaciones");
    case "downloading":
      return settingRow(t(`Bajando la versión ${esc(u.version ?? "")}…`, `Downloading version ${esc(u.version ?? "")}…`), t("Cuando termine te avisamos.", "We'll let you know when it's done."), search(t("Buscar", "Check"), true), "actualizaciones");
    case "ready":
      return settingRow(
        t(`La versión ${esc(u.version ?? "")} está lista`, `Version ${esc(u.version ?? "")} is ready`),
        t("Al reiniciar se cierran las terminales; las pestañas vuelven al abrir.", "Restarting closes the terminals; the tabs come back when it opens."),
        `<button class="btn primary" data-act="instalar">${t("Reiniciar", "Restart")}</button>`,
        "actualizaciones",
      );
    case "latest": return settingRow(t("Tenés la última versión", "You have the latest version"), "", search(t("Buscar de nuevo", "Check again")), "actualizaciones");
    case "error": return settingRow(t("No se pudo buscar", "Couldn't check"), `<span title="${esc(u.error ?? "")}">${t("Probá de nuevo en un rato.", "Try again in a while.")}</span>`, search(t("Buscar de nuevo", "Check again")), "actualizaciones");
    default: return settingRow(t("Buscar actualizaciones", "Check for updates"), "", search(t("Buscar", "Check")), "actualizaciones");
  }
}

function body(id: SectionId, s: Settings, shells: ShellInfo[], agents: AgentSettings): string[] {
  switch (id) {
    case "appearance": return appearance(s);
    case "terminal": return terminal(s, shells);
    case "agents": return agentsSection(agents);
    case "shortcuts": return shortcuts();
    case "about": return about(agents);
  }
}

function placeThumb(seg: HTMLElement, animate: boolean) {
  const on = seg.querySelector<HTMLElement>("button.on");
  const thumb = seg.querySelector<HTMLElement>(".seg-thumb");
  if (!on || !thumb) return;
  seg.classList.toggle("still", !animate);
  thumb.style.setProperty("--x", `${on.offsetLeft}px`);
  thumb.style.setProperty("--w", `${on.offsetWidth}px`);
  if (!animate) requestAnimationFrame(() => seg.classList.remove("still"));
}

const placeThumbs = (root: ParentNode) =>
  requestAnimationFrame(() => root.querySelectorAll<HTMLElement>(".seg").forEach((seg) => placeThumb(seg, false)));

export function renderSettings(
  el: HTMLElement,
  s: Settings,
  shells: ShellInfo[],
  agents: AgentSettings,
  onChange: (patch: Partial<Settings>) => void,
  onClose: () => void,
) {
  const prev = el.querySelector<HTMLElement>(".settings-scroll");
  const keepScroll = prev?.dataset.section === section ? prev.scrollTop : 0;
  const current = SECTIONS.find((sec) => sec.id === section)!;

  if (!prev) {
    el.innerHTML = `
      <nav class="settings-nav" data-tauri-drag-region>
        <div class="st-nav-top" data-tauri-drag-region>
          <button class="st-back" data-close title="${t("Volver a las terminales (Esc)", "Back to the terminals (Esc)")}" aria-label="${t("Volver a las terminales", "Back to the terminals")}">${icons.back}</button>
          <label class="st-search">${icons.search}<input type="search" data-search placeholder="${t("Buscar", "Search")}" spellcheck="false" autocomplete="off" aria-label="${t("Buscar en los ajustes", "Search settings")}"></label>
        </div>
        <div class="st-list" role="tablist" aria-label="${t("Secciones", "Sections")}">
          <span class="st-highlight" aria-hidden="true"></span>
          ${SECTIONS.map((sec) => `<button class="st-item" data-section="${sec.id}" role="tab">${tile(sec)}<span>${sec.name}</span></button>`).join("")}
        </div>
        <div class="st-results" hidden></div>
        <footer class="st-foot" data-tauri-drag-region></footer>
      </nav>
      <div class="settings-panel"><div class="settings-scroll"></div></div>`;
  }
  const index = SECTIONS.indexOf(current);
  const list = el.querySelector<HTMLElement>(".st-list")!;
  list.style.setProperty("--i", String(index));
  el.querySelectorAll<HTMLElement>(".st-item").forEach((item, i) => {
    item.classList.toggle("on", i === index);
    item.setAttribute("aria-selected", String(i === index));
  });
  const foot = `<img src="${logo}" alt=""><b>Beauty Shell</b>${agents.version ? `<span>${esc(agents.version)}</span>` : ""}`;
  const footEl = el.querySelector<HTMLElement>(".st-foot")!;
  if (footEl.innerHTML !== foot) footEl.innerHTML = foot;

  const scroller = el.querySelector<HTMLElement>(".settings-scroll")!;
  const sameSection = scroller.dataset.section === section;
  scroller.dataset.section = section;
  const blocks = section === "about" ? body(section, s, shells, agents) : [hero(current), ...body(section, s, shells, agents)];
  const content = `<div class="settings-content">${blocks.join("")}</div>`;

  if (content !== lastContent) {
    lastContent = content;
    if (sameSection) {
      el.classList.remove("entering");
      scroller.classList.remove("switching");
    } else if (prev) {
      scroller.classList.remove("switching");
      void scroller.offsetWidth;
      scroller.classList.add("switching");
      clearTimeout(switchTimer);
      switchTimer = window.setTimeout(() => scroller.classList.remove("switching"), 1100);
    }
    scroller.innerHTML = content;
    scroller.querySelectorAll<HTMLElement>(".settings-content > *").forEach((b, i) => b.style.setProperty("--n", String(i)));
    scroller.scrollTop = keepScroll;
    placeThumbs(scroller);
  }

  ctx = { el, s, shells, agents, onChange, onClose };
  if (!prev) bindEvents(el);
}

let lastContent = "";
let switchTimer = 0;
let ctx: {
  el: HTMLElement;
  s: Settings;
  shells: ShellInfo[];
  agents: AgentSettings;
  onChange: (patch: Partial<Settings>) => void;
  onClose: () => void;
} | null = null;

export function focusSettingsSearch(el: HTMLElement) {
  const input = el.querySelector<HTMLInputElement>("[data-search]");
  input?.focus();
  input?.select();
}

const normalize = (t: string) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

interface Hit {
  section: Section;

  id: string;
  name: string;

  extra: string;
}

function buildIndex(): Hit[] {
  if (!ctx) return [];
  const hits: Hit[] = [];
  const tpl = document.createElement("template");
  for (const sec of SECTIONS) {
    hits.push({ section: sec, id: "", name: sec.name, extra: sec.lead });
    tpl.innerHTML = body(sec.id, ctx.s, ctx.shells, ctx.agents).join("");
    tpl.content.querySelectorAll<HTMLElement>("[data-row]").forEach((row) => {
      if (row.closest(".st-collapsible:not(.open)")) return;
      const name = row.dataset.name ?? row.querySelector(".st-row-name, .st-agent-name")?.textContent ?? "";
      const group = row.closest(".st-group")?.querySelector("h2")?.textContent ?? "";
      const desc = row.querySelector(".st-row-desc")?.textContent ?? "";
      hits.push({ section: sec, id: row.dataset.row!, name, extra: `${group} ${desc}` });
    });
  }
  return hits;
}

function mark(text: string, query: string) {
  const i = normalize(text).indexOf(query);
  if (i < 0) return esc(text);
  return `${esc(text.slice(0, i))}<mark>${esc(text.slice(i, i + query.length))}</mark>${esc(text.slice(i + query.length))}`;
}

function search(el: HTMLElement, raw: string) {
  const list = el.querySelector<HTMLElement>(".st-list")!;
  const results = el.querySelector<HTMLElement>(".st-results")!;
  const query = normalize(raw.trim());
  list.hidden = !!query;
  results.hidden = !query;
  if (!query) {
    results.innerHTML = "";
    return;
  }

  const hits = buildIndex()
    .filter((h) => normalize(h.name).includes(query) || normalize(h.extra).includes(query))
    .sort((a, b) => Number(!normalize(a.name).includes(query)) - Number(!normalize(b.name).includes(query)))
    .slice(0, 14);
  results.innerHTML = hits.length
    ? hits.map((h, i) => `
        <button class="st-result" data-jump="${h.section.id}" data-row-go="${h.id}" style="--i: ${i}">
          ${tile(h.section, "compact")}
          <span class="st-result-text"><b>${mark(h.name, query)}</b><small>${h.id ? h.section.name : t("Sección", "Section")}</small></span>
        </button>`).join("")
    : `<p class="st-no-results">${t(`No hay ajustes que coincidan con «${esc(raw.trim())}».`, `No settings match “${esc(raw.trim())}”.`)}</p>`;
}

const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

function highlight(el: HTMLElement, id: string) {
  requestAnimationFrame(() => {
    const row = el.querySelector<HTMLElement>(`.settings-scroll [data-row="${CSS.escape(id)}"]`);
    if (!row) return;
    row.scrollIntoView({ block: "center", behavior: reducedMotion.matches ? "auto" : "smooth" });
    row.classList.remove("featured");
    void row.offsetWidth;
    row.classList.add("featured");
    window.setTimeout(() => row.classList.remove("featured"), 1700);
  });
}

function holds(when: string, s: Settings) {
  const [key, value] = when.split(/!?=/);
  const equal = String(s[key as keyof Settings]) === value;
  return when.includes("!=") ? !equal : equal;
}

function bindEvents(el: HTMLElement) {
  const redraw = () => ctx && renderSettings(ctx.el, ctx.s, ctx.shells, ctx.agents, ctx.onChange, ctx.onClose);
  const rerender = (patch: Partial<Settings>) => {
    ctx?.onChange(patch);
    redraw();
  };
  const refreshSample = () => {
    const sampleEl = el.querySelector<HTMLElement>("[data-sample]");
    if (!sampleEl || !ctx) return;
    sampleEl.setAttribute("style", sampleStyle(ctx.s));
    sampleEl.querySelector(".m-cursor")?.setAttribute("class", `m-cursor ${ctx.s.cursorStyle}${ctx.s.cursorBlink ? " blinking" : ""}`);
  };

  const apply = (patch: Partial<Settings>) => {
    ctx?.onChange(patch);
    refreshSample();
    if (!ctx) return;
    const s = ctx.s;
    el.querySelectorAll<HTMLElement>(".st-collapsible[data-when]").forEach((box) => {
      const open = holds(box.dataset.when!, s);
      box.classList.toggle("open", open);
      box.toggleAttribute("inert", !open);
    });
  };
  const choose = (group: HTMLElement, picked: HTMLElement) =>
    group.querySelectorAll<HTMLElement>("[data-v]").forEach((b) => {
      b.classList.toggle("on", b === picked);
      b.setAttribute("aria-checked", String(b === picked));
    });

  el.addEventListener("click", (e) => {
    if (!ctx) return;
    const target = e.target as HTMLElement;
    if (target.closest("[data-close]")) return ctx.onClose();
    const item = target.closest<HTMLElement>(".st-item[data-section]");
    if (item) {
      section = item.dataset.section as SectionId;
      return redraw();
    }
    const result = target.closest<HTMLElement>(".st-result");
    if (result) {
      section = result.dataset.jump as SectionId;
      redraw();
      if (result.dataset.rowGo) highlight(el, result.dataset.rowGo);
      return;
    }
    const popup = target.closest<HTMLElement>("[data-popup]");
    if (popup) {
      const box = popup.getBoundingClientRect();
      const options = JSON.parse(popup.dataset.options!) as [string, string, string?][];
      showMenu(box.left, box.bottom + 6, options.map(([v, label, style]) => ({
        label,
        style,
        checked: v === popup.dataset.v,
        action: () => rerender({ [popup.dataset.popup!]: v } as Partial<Settings>),
      })), box.width);
      return;
    }
    const installBtn = target.closest<HTMLElement>("[data-install]");
    if (installBtn) {
      const agent = AGENTS.find((a) => a.id === installBtn.dataset.install);
      if (agent) window.dispatchEvent(new CustomEvent("beauty:install-agent", { detail: { command: agent.install, url: agent.install ? undefined : agent.docs } }));
      return;
    }
    const act = target.closest<HTMLElement>("[data-act]");
    if (act) return void (act.dataset.act === "instalar" ? installAndRestart() : checkForUpdates());
    if (target.closest("[data-connect]")) return ctx.agents.onConnect();
    if (target.closest("[data-rescan]")) return ctx.agents.onRescan();
    const option = target.closest<HTMLButtonElement>(".seg button");
    if (option) {
      if (option.classList.contains("on")) return;
      const group = option.parentElement!;
      choose(group, option);
      placeThumb(group, !reducedMotion.matches);
      return apply({ [group.dataset.key!]: option.dataset.v } as Partial<Settings>);
    }
    const mini = target.closest<HTMLElement>(".st-mini");
    if (mini) {
      if (mini.classList.contains("on")) return;
      const group = mini.parentElement!;
      const key = group.dataset.key as keyof Settings;
      apply({ [key]: mini.dataset.v } as Partial<Settings>);

      if (key === "theme") window.setTimeout(() => choose(group, mini), 60);
      else choose(group, mini);
      return;
    }
    const step = target.closest<HTMLElement>("[data-step]");
    if (step) {
      const next = clampFontSize(ctx.s.fontSize + Number(step.dataset.step));
      if (next === ctx.s.fontSize) return;
      stepDir = Number(step.dataset.step) > 0 ? "up" : "down";
      rerender({ fontSize: next });
      stepDir = "";
    }
  });

  el.addEventListener("change", (e) => {
    const target = e.target as HTMLElement;
    if (target instanceof HTMLSelectElement) {
      rerender({ [target.dataset.key!]: target.value } as Partial<Settings>);
    } else if (target instanceof HTMLInputElement && target.hasAttribute("data-notify")) {
      setNotificationsEnabled(target.checked);
    } else if (target instanceof HTMLInputElement && target.classList.contains("switch")) {
      apply({ [target.dataset.key!]: target.checked } as Partial<Settings>);
    }
  });

  el.addEventListener("input", (e) => {
    const input = e.target as HTMLInputElement;
    if (input.hasAttribute("data-search")) return search(el, input.value);
    const label = input.nextElementSibling;
    if (input.type === "range") {
      input.style.setProperty("--filled", filled(Number(input.min), Number(input.max), Number(input.value)));
    }
    if (input.dataset.key === "glass") {
      if (label) label.textContent = `${Math.round(Number(input.value) * 100)}%`;
      ctx?.onChange({ glass: Number(input.value) });
    } else if (input.dataset.key === "terminalOpacity") {
      if (label) label.textContent = `${Math.round(Number(input.value) * 100)}%`;
      ctx?.onChange({ terminalOpacity: Number(input.value) });
    } else if (input.dataset.key === "lineHeight") {
      if (label) label.textContent = Number(input.value).toFixed(2);
      apply({ lineHeight: Number(input.value) });
    } else if (input.dataset.key === "scrollback") {
      const lines = SCROLLBACK_STEPS[Number(input.value)];
      if (label) label.textContent = thousands(lines);
      ctx?.onChange({ scrollback: lines });
    }
  });

  el.addEventListener("keydown", (e) => {
    const input = e.target as HTMLInputElement;
    if (!input.hasAttribute?.("data-search")) return;
    if (e.key === "Escape" && input.value) {
      e.preventDefault();
      e.stopPropagation();
      input.value = "";
      search(el, "");
    } else if (e.key === "Enter") {
      el.querySelector<HTMLElement>(".st-result")?.click();
    }
  });

  new ResizeObserver(() => el.querySelectorAll<HTMLElement>(".settings-scroll .seg").forEach((seg) => placeThumb(seg, false))).observe(el);
}
