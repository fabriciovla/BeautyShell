import "@xterm/xterm/css/xterm.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/400-italic.css";
import "@fontsource/jetbrains-mono/700.css";
import "@fontsource/jetbrains-mono/700-italic.css";

import "@fontsource/jetbrains-mono/500.css";
import "@fontsource/jetbrains-mono/500-italic.css";
import "@fontsource/jetbrains-mono/600.css";
import "@fontsource/jetbrains-mono/600-italic.css";
import "@fontsource/jetbrains-mono/800.css";
import "@fontsource/jetbrains-mono/800-italic.css";
import "@fontsource-variable/geist";
import "./styles.css";
import taskbarLogo from "../assets/logo.png";

import { getVersion } from "@tauri-apps/api/app";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { Effect, getCurrentWindow } from "@tauri-apps/api/window";
import { readImage, readText, writeText } from "@tauri-apps/plugin-clipboard-manager";
import { openUrl } from "@tauri-apps/plugin-opener";
import { open as openDialog } from "@tauri-apps/plugin-dialog";

import { onUpdateChange, startUpdateChecks } from "./updater";
import { WEIGHTS } from "./fonts";
import { AGENTS } from "./agent-catalog";
import { startAgentBridge } from "./agents";
import type { Point } from "./bubble";
import { BrowserHost, BrowserPane, hostOf, normalizeUrl, type BrowserHooks } from "./browser";
import { FolderDock } from "./folder-dock";
import { DragGhost } from "./ghost";
import { icons } from "./icons";
import {
  computeLayout,
  edgeAt,
  halfRect,
  insertAt,
  leaf,
  loadNode,
  neighbor,
  removeSession,
  saveNode,
  sessionsOf,
  type Divider,
  type Edge,
  type Node,
  type Pane,
  type Rect,
  type SavedNode,
  type Tab,
} from "./layout";
import { t, translatePage } from "./lang";
import { IS_WINDOWS, SUPER_KEY } from "./platform";
import { isLocalUrl } from "./links";
import { Predictor } from "./predict";
import { hideMenu, isMenuOpen, showMenu, type MenuEntry } from "./menu";
import { formatDuration, notificationsEnabled, notify, NOTIFY_AFTER_MS, setNotificationsEnabled } from "./notify";
import { shouldOnboard, startOnboarding } from "./onboarding";
import { showTabToast } from "./tab-toast";
import { TabStrip } from "./tabstrip";
import { applySpace } from "./space";
import { Palette, type Command } from "./palette";
import { deleteWorkspace, loadWorkspaces, saveWorkspace, type Workspace } from "./workspaces";
import { invoke } from "@tauri-apps/api/core";
import { homeDir, listShells, type ShellInfo } from "./pty";
import { folderName, Session, setHome, type SessionInit, type TermLook } from "./session";
import {
  DEFAULT_FONT_SIZE,
  clampFontSize,
  esc,
  focusSettingsSearch,
  loadSettings,
  renderSettings,
  saveSettings,
  TERMINAL_FONTS,
  type AgentSettings,
  type FontWeightPref,
  type Settings,
} from "./settings";
import { Sidebar, groupTabs, type DragItem } from "./sidebar";
import { softBackgrounds, terminalThemes, type ThemeName } from "./themes";

const GAP = 6;

const DIVIDER_HIT = 8;

const win = getCurrentWindow();
const settings = loadSettings();

const paneGap = () => (settings.tabLayout === "horizontal" ? 0 : GAP);
const tabs: Tab[] = [];
let activeTab: Tab | null = null;
let nextTabId = 1;
let shells: ShellInfo[] = [];
let home = IS_WINDOWS ? "C:\\" : "/";
let settingsOpen = false;

let paneRects = new Map<Pane, Rect>();

const $ = <T extends HTMLElement = HTMLElement>(selector: string) => document.querySelector<T>(selector)!;

translatePage(document.body, {
  "New terminal (Ctrl+T) · right-click to pick a shell or folder": "Nueva terminal (Ctrl+T) · clic derecho para elegir shell o carpeta",
  "Settings (Ctrl+,)": "Ajustes (Ctrl+,)",
  "Hide or pin the sidebar (Ctrl+Shift+B)": "Ocultar o fijar la barra lateral (Ctrl+Shift+B)",
  "Drag to change the width": "Arrastrá para cambiar el ancho",
  Terminals: "Terminales",
  "Beauty Shell home": "Inicio de Beauty Shell",
  "Open a terminal to get started.": "Abrí una terminal para empezar.",
  "Get started": "Empezar",
  Workspaces: "Espacios de trabajo",
  Minimize: "Minimizar",
  Maximize: "Maximizar",
  Close: "Cerrar",
});
const app = $("#app");
const stage = $("#stage");
const sidebarEl = $("#sidebar");
const settingsEl = $("#settings-page");
const btnNew = $("#btn-new");
const btnPin = $("#btn-pin");
const btnSettings = $("#btn-settings");
const dropHint = $("#drop-hint");
const emptyEl = $("#empty");
($(".home-logo") as HTMLImageElement).src = taskbarLogo;
const ghost = new DragGhost($("#drag-ghost"));
const stripEl = $("#tabstrip");
const dock = new FolderDock($("#folder-dock"));

btnNew.innerHTML = `<span class="sb-add-icon">${icons.plus}</span><span class="sb-add-label">${t("Nueva terminal", "New terminal")}</span><span class="sb-add-key">Ctrl+T</span>`;

$("#sb-list").addEventListener("dblclick", (e) => {
  if (e.target === e.currentTarget) newTab();
});
btnPin.innerHTML = icons.sidebar;
btnSettings.innerHTML = `${icons.gear}<span>${t("Ajustes", "Settings")}</span>`;

const homeActions: { icon: string; label: string; keys?: string; run: () => void }[] = [
  { icon: icons.terminal, label: t("Nueva terminal", "New terminal"), keys: "Ctrl+T", run: () => newTab() },
  { icon: icons.folder, label: t("Abrir carpeta…", "Open folder…"), run: () => void pickFolder() },
  { icon: icons.globe, label: t("Navegador", "Browser"), keys: "Ctrl+Shift+O", run: () => void openBrowser() },
  { icon: icons.gear, label: t("Ajustes", "Settings"), keys: "Ctrl+,", run: () => openSettingsPage() },
];
const homeMore = document.createElement("div");
homeMore.className = "home-more";
homeActions.forEach((action, i) => {
  const btn = document.createElement("button");
  btn.className = i === 0 ? "home-primary" : "home-pill";
  btn.innerHTML =
    i === 0
      ? `${action.icon}<span>${action.label}</span><span class="home-key">${action.keys}</span>`
      : `${action.icon}<span>${action.label}</span>`;
  if (i > 0 && action.keys) btn.title = action.keys;
  btn.addEventListener("click", action.run);
  (i === 0 ? $(".home-actions") : homeMore).append(btn);
});
$(".home-actions").append(homeMore);

function renderHomeSpaces() {
  const list = loadWorkspaces();
  const section = $(".home-spaces");
  section.hidden = !list.length;
  const rows = $(".home-spaces-list");
  rows.replaceChildren(
    ...list.map((w) => {
      const btn = document.createElement("button");
      btn.className = "home-space";
      btn.innerHTML = `${icons.folder}<span class="home-space-name">${esc(w.name)}</span><span class="home-space-detail">${esc(workspaceSummary(w))}</span>`;
      btn.addEventListener("click", () => openWorkspace(w));
      return btn;
    }),
  );
}

function playEnter(el: HTMLElement) {
  el.classList.remove("entering");
  void el.offsetWidth;
  el.classList.add("entering");
  el.addEventListener("animationend", function done(e) {
    if (e.target !== el) return;
    el.classList.remove("entering");
    el.removeEventListener("animationend", done);
  });
}

const winGlyph = (body: string) =>
  `<svg viewBox="0 0 10 10" width="10" height="10" fill="none" stroke="currentColor" stroke-width="1" aria-hidden="true">${body}</svg>`;
const GLYPH = IS_WINDOWS
  ? { minimize: "\uE921", maximize: "\uE922", restore: "\uE923", close: "\uE8BB" }
  : {
      minimize: winGlyph(`<path d="M0 5.5h10"/>`),
      maximize: winGlyph(`<rect x="0.5" y="0.5" width="9" height="9" rx="1"/>`),
      restore: winGlyph(`<rect x="0.5" y="2.5" width="7" height="7" rx="1"/><path d="M2.5 2.5v-.5a1.5 1.5 0 0 1 1.5-1.5h4a1.5 1.5 0 0 1 1.5 1.5v4a1.5 1.5 0 0 1-1.5 1.5h-.5"/>`),
      close: winGlyph(`<path d="m0.5 0.5 9 9M9.5 0.5l-9 9"/>`),
    };
$('[data-win="min"]').innerHTML = GLYPH.minimize;
$('[data-win="max"]').innerHTML = GLYPH.maximize;
$('[data-win="close"]').innerHTML = GLYPH.close;

const darkQuery = matchMedia("(prefers-color-scheme: dark)");

function resolvedTheme(): ThemeName {
  if (settings.theme === "system") return darkQuery.matches ? "dark" : "light";
  return settings.theme;
}

const FONT_WEIGHTS = Object.fromEntries(Object.entries(WEIGHTS).map(([key, w]) => [key, w.value])) as Record<FontWeightPref, number>;

function fontWeights() {
  const normal = (FONT_WEIGHTS[settings.fontWeight] ?? 400) + (settings.terminalBg === "glass" ? 100 : 0);
  return { normal, bold: Math.min(normal + 300, 800) };
}

function loadTerminalFonts() {
  const family = TERMINAL_FONTS[settings.fontFamily] ?? TERMINAL_FONTS.jetbrains;
  const { normal, bold } = fontWeights();
  const size = `${settings.fontSize}px`;
  return Promise.all(
    [`${normal} ${size}`, `${bold} ${size}`, `italic ${normal} ${size}`, `italic ${bold} ${size}`].map((f) =>
      document.fonts.load(`${f} ${family}`),
    ),
  ).catch(() => {});
}

function termLook(): TermLook {
  const name = resolvedTheme();
  const glass = settings.terminalBg === "glass";
  const weights = fontWeights();
  const background = settings.terminalBg === "soft" ? softBackgrounds[name] : terminalThemes[name].background!;
  const theme = { ...terminalThemes[name], background, cursorAccent: background };
  return {
    theme: glass ? { ...theme, background: "#00000000" } : theme,
    background,
    fontSize: settings.fontSize,
    fontFamily: TERMINAL_FONTS[settings.fontFamily] ?? TERMINAL_FONTS.jetbrains,
    fontWeight: weights.normal,
    fontWeightBold: weights.bold,
    lineHeight: settings.lineHeight,
    translucent: glass,
    cursorStyle: settings.cursorStyle,
    cursorBlink: settings.cursorBlink,
    scrollback: settings.scrollback,
    copyOnSelect: settings.copyOnSelect,
    suggest: settings.suggestions,
  };
}

function applyAppearance() {
  const root = document.documentElement;
  root.dataset.theme = resolvedTheme();
  root.dataset.effect = settings.effect;
  root.classList.toggle("term-glass", settings.terminalBg === "glass");
  root.classList.toggle("term-soft", settings.terminalBg === "soft");
  root.style.setProperty("--term-alpha", String(settings.terminalOpacity));
  root.style.setProperty("--sb-w", `${settings.sidebarWidth}px`);
  root.style.setProperty("--glass", String(settings.glass));
  applySpace(root, settings.space);
  app.classList.toggle("unpinned", !settings.sidebarPinned);
  btnPin.classList.toggle("on", settings.sidebarPinned);

  win.setTheme(settings.theme === "system" ? null : resolvedTheme()).catch(() => {});
}

async function applyEffect() {
  if (!IS_WINDOWS) return;
  try {
    if (settings.effect === "none") await win.clearEffects();
    else await win.setEffects({ effects: [settings.effect === "mica" ? Effect.Mica : Effect.Acrylic] });
  } catch {
  }
}

function refreshTerminals() {
  for (const s of allSessions()) s.applyLook(termLook());
}

/** Swaps the theme with transitions off, otherwise every color animates at once; they return after the next frame. */
function withoutTransitions(change: () => void) {
  const style = document.createElement("style");
  style.textContent = "*,*::before,*::after{transition:none !important}";
  document.head.append(style);
  change();
  void document.body.offsetHeight;
  requestAnimationFrame(() => requestAnimationFrame(() => style.remove()));
}

function updateSettings(patch: Partial<Settings>) {
  Object.assign(settings, patch);
  saveSettings(settings);
  if ("theme" in patch) withoutTransitions(applyAppearance);
  else applyAppearance();
  if ("effect" in patch) void applyEffect();
  if ("tabLayout" in patch) {
    setPeek(false);
    setTitlebar(false);
    relayout();
    scheduleUpdate();
  }
  const look: (keyof Settings)[] = [
    "theme", "fontSize", "fontFamily", "fontWeight", "lineHeight", "terminalBg", "cursorStyle", "cursorBlink", "scrollback", "copyOnSelect", "suggestions",
  ];

  const fonts: (keyof Settings)[] = ["fontFamily", "fontWeight", "terminalBg"];
  if (fonts.some((key) => key in patch)) void loadTerminalFonts().then(refreshTerminals);
  else if (look.some((key) => key in patch)) refreshTerminals();
}

darkQuery.addEventListener("change", () => {
  if (settings.theme !== "system") return;
  withoutTransitions(applyAppearance);
  refreshTerminals();
});

const allPanes = () => tabs.flatMap((t) => sessionsOf(t.root));

const allSessions = () => allPanes().filter((p): p is Session => p instanceof Session);

const orderedTabs = () => (settings.tabLayout === "horizontal" ? [...tabs] : groupTabs(tabs).flatMap((g) => g.tabs));
const tabOf = (s: Pane) => tabs.find((t) => sessionsOf(t.root).includes(s));
const current = () => activeTab?.focus ?? null;

const currentTerm = () => {
  const pane = current();
  return pane instanceof Session ? pane : null;
};

let lastDragEnd = 0;

const sidebar = new Sidebar($("#sessions"), {
  activateTab: (tab) => {
    activateTab(tab);
    setPeek(false);
  },
  focusPane: (s) => {
    const tab = tabOf(s);
    if (tab) activateTab(tab, s);
  },
  closeTab: (tab) => closeTab(tab),
  closePane: (s) => closeSession(s),
  rename: (s, name) => s.rename(name),
  newIn: (dir) => newTab(dir || undefined),
  tabMenu: (tab, x, y) => showMenu(x, y, tabMenu(tab)),
  paneMenu: (s, x, y) => showMenu(x, y, paneMenu(s)),
  dragStart: (item, label, e, el) => beginDrag(item, label, e, el),
  wasDragging: () => performance.now() - lastDragEnd < 150,
});

const strip = new TabStrip(stripEl, {
  activateTab: (tab) => activateTab(tab),
  closeTab: (tab) => closeTab(tab),
  rename: (s, name) => s.rename(name),
  tabMenu: (tab, x, y) => showMenu(x, y, tabMenu(tab)),
  dragStart: (item, label, e, el) => beginDrag(item, label, e, el),
  wasDragging: () => performance.now() - lastDragEnd < 150,
  newTab: () => newTab(),
  newMenu: (x, y) => showMenu(x, y, newMenu()),
  openSettings: () => openSettingsPage(),
  toggleSettings: () => toggleSettings(),
  closeSettings: () => closeSettingsPage(),
});

const browserHost = new BrowserHost();

const predictor = new Predictor(
  () => home,
  () => {
    for (const s of allSessions()) s.refreshSuggestion();
  },
);

const browserHooks: BrowserHooks = {
  changed: scheduleUpdate,
  onFocus: (pane) => onPaneFocus(pane),
  onHeadDrag: (pane, e, el) => beginDrag({ kind: "pane", session: pane }, pane.label, e, el),
  onClose: (pane) => closeSession(pane),
  openTab: (url) => void openBrowser(url),
  suggestions: localServers,
};

function createBrowser(init: SessionInit): BrowserPane {
  return new BrowserPane(init, stage, browserHost, browserHooks);
}

function createPane(init: SessionInit): Pane {
  return init.browser !== undefined ? createBrowser(init) : createSession(init);
}

function openBrowser(url?: string, background = false): BrowserPane {
  const pane = createBrowser({ shell: "browser", cwd: current()?.cwd ?? home, browser: url ?? null });
  const tab: Tab = { id: nextTabId++, root: leaf(pane), focus: pane };
  tabs.push(tab);
  if (background) {
    relayout();
    scheduleUpdate();
  } else activateTab(tab);
  return pane;
}

function localServers(): string[] {
  const found = new Set<string>();
  for (const s of allSessions()) {
    for (const m of s.readScreen(300).matchAll(/https?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(?::\d+)?[^\s"'<>)]*/gi)) {
      found.add(m[0].replace(/[.,;]+$/, ""));
    }
  }
  return [...found].slice(0, 8);
}

function openLink(uri: string) {
  if (isLocalUrl(uri)) openBrowser(uri.replace("://0.0.0.0", "://localhost"));
  else openUrl(uri).catch(() => {});
}

let coverQueued = false;
function syncBrowserCover() {
  if (coverQueued) return;
  coverQueued = true;
  requestAnimationFrame(() => {
    coverQueued = false;
    browserHost.setCovered(
      settingsOpen ||
        isMenuOpen() ||
        palette.isOpen ||
        document.body.classList.contains("dragging") ||
        !!document.getElementById("onboarding"),
    );
  });
}
const coverWatch = new MutationObserver(syncBrowserCover);
coverWatch.observe(document.body, { childList: true, attributes: true, attributeFilter: ["class"] });
coverWatch.observe($("#menu"), { attributes: true, attributeFilter: ["hidden"] });
coverWatch.observe(settingsEl, { attributes: true, attributeFilter: ["hidden"] });

const horizontalTabs = () => app.classList.contains("htabs");

function startRename(session: Pane) {
  if (!(horizontalTabs() && strip.startRename(session))) sidebar.startRename(session);
}

const splitShell = (target: Pane) => (target instanceof Session ? target.shell : settings.shell);

function tabMenu(tab: Tab): MenuEntry[] {
  const page = tab.focus instanceof BrowserPane;
  return [
    { label: t("Renombrar", "Rename"), hint: t("doble clic", "double-click"), action: () => startRename(tab.focus) },
    { label: t("Dividir a la derecha", "Split right"), hint: "Ctrl+Shift+D", action: () => split(tab, tab.focus, "right") },
    { label: t("Dividir abajo", "Split down"), hint: "Ctrl+Shift+E", action: () => split(tab, tab.focus, "bottom") },
    {
      label: t("Duplicar", "Duplicate"),
      action: () => (tab.focus instanceof BrowserPane ? openBrowser(tab.focus.url || undefined) : newTab(tab.focus.cwd, tab.focus.shell)),
    },
    ...(tab.root.type === "split" && !page
      ? [{
          label: tab.broadcast ? t("Dejar de escribir en todos", "Stop typing in all") : t("Escribir en todos los paneles", "Type in all panes"),
          action: () => toggleBroadcast(tab),
        }]
      : []),
    "sep",
    { label: t("Cerrar pestaña", "Close tab"), hint: "Ctrl+Shift+W", danger: true, action: () => closeTab(tab) },
  ];
}

function paneMenu(s: Pane): MenuEntry[] {
  return [
    ...(s instanceof Session ? [{ label: t("Buscar", "Find"), hint: "Ctrl+F", action: () => s.openSearch() }] : []),
    ...(s instanceof BrowserPane && s.url ? [{ label: t("Abrir en tu navegador", "Open in your browser"), action: () => void openUrl(s.url).catch(() => {}) }] : []),
    { label: t("Renombrar", "Rename"), hint: t("doble clic", "double-click"), action: () => sidebar.startRename(s) },
    { label: t("Dividir a la derecha", "Split right"), hint: "Ctrl+Shift+D", action: () => split(tabOf(s)!, s, "right") },
    { label: t("Dividir abajo", "Split down"), hint: "Ctrl+Shift+E", action: () => split(tabOf(s)!, s, "bottom") },
    {
      label: tabOf(s)?.zoomed === s ? t("Achicar panel", "Restore pane") : t("Agrandar panel", "Zoom pane"),
      hint: "Ctrl+Shift+Z",
      action: () => toggleZoom(tabOf(s)!, s),
    },
    { label: t("Separar en otra pestaña", "Move to a new tab"), action: () => detachPane(s) },
    "sep",
    { label: t("Cerrar panel", "Close pane"), hint: "Ctrl+W", danger: true, action: () => closeSession(s) },
  ];
}

let updateQueued = false;
function scheduleUpdate() {
  if (updateQueued) return;
  updateQueued = true;
  requestAnimationFrame(() => {
    updateQueued = false;
    sidebar.render(tabs, activeTab);
    strip.render(tabs, activeTab, settingsOpen);
    renderTabDots();
    persist();
  });
}

const tabDots = $("#tab-dots");
const tabDotsList = $("#tab-dots .dots-list");
function renderTabDots() {
  const list = orderedTabs().slice(0, 9);
  const html =
    list.length > 1 && !settingsOpen && settings.tabLayout !== "horizontal"
      ? list
          .map((tab, i) => {
            const label = esc(tab.focus.label);
            const active = tab === activeTab ? ` class="active" aria-current="true"` : "";
            return `<button data-tab="${tab.id}"${active} title="${label} (Ctrl+${i + 1})">${i + 1}</button>`;
          })
          .join("")
      : "";
  if (tabDotsList.innerHTML !== html) tabDotsList.innerHTML = html;

  const index = list.indexOf(activeTab!);
  const appearing = tabDots.hasAttribute("hidden");
  tabDots.classList.toggle("still", appearing);
  tabDots.classList.toggle("no-thumb", index < 0);
  if (index >= 0) tabDots.style.setProperty("--i", String(index));
  tabDots.hidden = !html;
  if (appearing) requestAnimationFrame(() => tabDots.classList.remove("still"));

  stage.style.setProperty("--dots-w", `${tabDots.offsetWidth}px`);
}

tabDots.addEventListener("click", (e) => {
  const id = Number((e.target as HTMLElement).closest<HTMLElement>("[data-tab]")?.dataset.tab);
  const tab = tabs.find((t) => t.id === id);
  if (tab) activateTab(tab);
});

function createSession(init: SessionInit): Session {
  const session = new Session(init, termLook(), stage, {
    onChange: scheduleUpdate,
    onFocus: onPaneFocus,
    onAction: (s, action, e) => {
      const tab = tabOf(s);
      if (!tab) return;
      if (action === "split") split(tab, s, "right");
      else if (action === "zoom") toggleZoom(tab, s);
      else if (action === "close") closeSession(s);
      else showMenu(e.clientX, e.clientY, paneMenu(s));
    },
    onHeadDrag: (s, e, el) => beginDrag({ kind: "pane", session: s }, s.label, e, el),
    onOpenLink: (uri) => openLink(uri),
    onInput: (s, data) => {
      const tab = tabOf(s);

      if (!tab?.broadcast || /^\x1b\[(<|M)/.test(data)) return;
      for (const other of sessionsOf(tab.root)) if (other !== s && other instanceof Session) other.write(data);
    },
    onCommandDone: (s, command, code, ms) => {
      predictor.record(command, s.commandCwd || s.cwd, s.shell, code === 0);

      if (AGENTS.some((a) => a.install === command.trim())) void scanAgents();
      if (ms < NOTIFY_AFTER_MS) return;
      const how = code === 0 ? t("terminó", "finished") : t(`falló (código ${code})`, `failed (code ${code})`);
      void notify(`${s.label} · ${how}`, `${command}\n${formatDuration(ms)}`);
    },
    suggest: (s, typed) => predictor.suggest(typed, s.cwd, s.shell),
    onSettled: (s, ms) => {
      if (ms >= NOTIFY_AFTER_MS) void notify(t(`${s.label} terminó de trabajar`, `${s.label} finished working`), `${formatDuration(ms)} · ${folderName(s.cwd)}`);
    },
    onWaiting: (s, message) => void notify(t(`${s.label} te está esperando`, `${s.label} is waiting for you`), message ?? folderName(s.cwd)),
  });
  void session.start();
  return session;
}

function newTab(cwd = current()?.cwd ?? home, shell = settings.shell, command?: string) {
  const session = createSession({ shell, cwd, command });
  const tab: Tab = { id: nextTabId++, root: leaf(session), focus: session };
  tabs.push(tab);
  activateTab(tab);
}

function split(tab: Tab, target: Pane, edge: Edge) {
  const session = createSession({ shell: splitShell(target), cwd: target.cwd });
  tab.root = insertAt(tab.root, target, edge, leaf(session));
  tab.zoomed = null;
  activateTab(tab, session);
}

function toggleZoom(tab: Tab, session = tab.focus) {
  if (tab.root.type === "leaf") return;
  tab.zoomed = tab.zoomed === session ? null : session;
  activateTab(tab, session);
}

function toggleBroadcast(tab: Tab) {
  if (tab.root.type === "leaf") return;
  tab.broadcast = !tab.broadcast;
  relayout();
  scheduleUpdate();
  tab.focus.focus();
}

function activateTab(tab: Tab, focus = tab.focus) {
  if (settingsOpen) closeSettingsPage(false);

  if (tab.zoomed && tab.zoomed !== focus) tab.zoomed = null;
  activeTab = tab;
  tab.focus = focus;
  relayout();
  focus.focus();
  scheduleUpdate();
}

function onPaneFocus(session: Pane) {
  const tab = tabOf(session);
  if (!tab || tab !== activeTab || tab.focus === session) return;
  tab.focus = session;
  updateFocusClasses();
  scheduleUpdate();
}

function updateFocusClasses() {
  for (const tab of tabs) for (const s of sessionsOf(tab.root)) s.setFocused(s === tab.focus);
}

const closedLayouts: SavedNode[] = [];

function remember(layout: SavedNode) {
  closedLayouts.push(layout);
  if (closedLayouts.length > 20) closedLayouts.shift();
}

function reopenClosed() {
  const layout = closedLayouts.pop();
  if (!layout) return;
  const root = loadNode(layout, createPane);
  const tab: Tab = { id: nextTabId++, root, focus: sessionsOf(root)[0] };
  tabs.push(tab);
  activateTab(tab);
}

function closeSession(session: Pane) {
  const tab = tabOf(session);
  if (!tab) return;
  remember(saveNode(leaf(session)));
  const root = removeSession(tab.root, session);
  session.dispose();
  if (!root) return removeTab(tab);
  tab.root = root;
  if (tab.focus === session) tab.focus = sessionsOf(root)[0];
  if (tab === activeTab) activateTab(tab);
  else {
    relayout();
    scheduleUpdate();
  }
}

function closeTab(tab: Tab) {
  remember(saveNode(tab.root));
  for (const s of sessionsOf(tab.root)) s.dispose();
  removeTab(tab);
}

function removeTab(tab: Tab) {
  const list = orderedTabs();
  const index = list.indexOf(tab);
  tabs.splice(tabs.indexOf(tab), 1);

  if (!tabs.length) {
    activeTab = null;
    relayout();
    scheduleUpdate();
    return;
  }
  if (activeTab === tab) {
    const rest = list.filter((t) => t !== tab);
    activeTab = null;
    activateTab(rest[Math.min(index, rest.length - 1)]);
  } else {
    relayout();
    scheduleUpdate();
  }
}

function detachPane(session: Pane) {
  const tab = tabOf(session);
  if (!tab || tab.root.type === "leaf") return;
  tab.root = removeSession(tab.root, session)!;
  if (tab.focus === session) tab.focus = sessionsOf(tab.root)[0];
  const created: Tab = { id: nextTabId++, root: leaf(session), focus: session };
  tabs.splice(tabs.indexOf(tab) + 1, 0, created);
  activateTab(created);
}

function cycle(step: number) {
  const list = orderedTabs();
  if (settingsOpen) {
    const target = list[step > 0 ? 0 : list.length - 1];
    if (target) activateTab(target);
    else closeSettingsPage();
    return;
  }
  if (!activeTab || list.length < 2) return;
  activateTab(list[(list.indexOf(activeTab) + step + list.length) % list.length]);
  announceTab();
}

function announceTab() {
  if (app.classList.contains("titlebar") || horizontalTabs() || settingsOpen || !activeTab) return;
  const list = orderedTabs();
  const { cwd, label } = activeTab.focus;
  showTabToast(folderName(cwd), cwd, label, list.indexOf(activeTab) + 1, list.length);
}

listen<{ id: number; code: number }>("pty-exit", ({ payload }) => {
  const session = allSessions().find((s) => s.ptyId === payload.id);
  if (!session) return;

  if (payload.code === 0) closeSession(session);
  else session.handleExit(payload.code);
});

let dividerEls: HTMLElement[] = [];
let dividerData: Divider[] = [];

function relayout() {
  const shownBefore = new Set(stage.querySelectorAll<HTMLElement>(".pane.visible"));
  const area: Rect = { x: 0, y: 0, w: stage.clientWidth, h: stage.clientHeight };

  stage.classList.toggle("split", activeTab?.root.type === "split");
  for (const tab of tabs) {
    const rects = new Map<Pane, Rect>();
    const dividers: Divider[] = [];
    computeLayout(tab.root, area, paneGap(), rects, dividers);
    const visible = tab === activeTab && !settingsOpen;

    const zoomed = tab.zoomed && rects.has(tab.zoomed) ? tab.zoomed : null;
    if (!zoomed) tab.zoomed = null;
    if (tab.root.type === "leaf") tab.broadcast = false;

    const corner = zoomed ?? [...rects].find(([, r]) => r.y === 0 && Math.abs(r.x + r.w - area.w) < 1)?.[0];
    for (const [s, r] of rects) {
      const rect = s === zoomed ? area : r;
      s.place(rect, visible && (!zoomed || s === zoomed));

      s.pane.classList.toggle("right-edge", Math.abs(rect.x + rect.w - area.w) < 1);
      s.pane.classList.toggle("bottom-edge", Math.abs(rect.y + rect.h - area.h) < 1);
      s.pane.classList.toggle("zoomed", s === zoomed);
      s.pane.classList.toggle("dots-corner", s === corner);
      s.pane.classList.toggle("broadcast", !!tab.broadcast);
    }
    if (tab === activeTab) {
      paneRects = zoomed ? new Map([[zoomed, area]]) : rects;
      renderDividers(visible && !zoomed ? dividers : []);
    }
  }
  if (!activeTab) renderDividers([]);
  keepUnder(shownBefore);
  const noTabs = !tabs.length && !settingsOpen;
  if (noTabs && emptyEl.hidden) renderHomeSpaces();
  emptyEl.hidden = !noTabs;

  const horizontal = settings.tabLayout === "horizontal";
  if (app.classList.contains("no-tabs") && !noTabs) playEnter(horizontal ? stripEl : sidebarEl);
  app.classList.toggle("no-tabs", noTabs);

  app.classList.toggle("htabs", horizontal && !noTabs);

  const caption = !horizontal && !noTabs && settings.sidebarPinned;
  app.classList.toggle("caption", caption);
  if (caption) setTitlebar(false);
  if (noTabs) setPeek(false);
  updateFocusClasses();

  for (const pane of browserHost.all()) pane.sync();
}

let underTimer = 0;

function keepUnder(shownBefore: Set<HTMLElement>) {
  const shownNow = [...stage.querySelectorAll<HTMLElement>(".pane.visible")];
  const appeared = shownNow.filter((p) => !shownBefore.has(p));
  if (!appeared.length) return;
  const gone = [...shownBefore].filter((p) => p.isConnected && !p.classList.contains("visible") && !p.classList.contains("leaving"));
  if (!gone.length) {
    for (const p of appeared) if (!p.classList.contains("entering")) p.classList.add("instant");
    requestAnimationFrame(() => requestAnimationFrame(() => appeared.forEach((p) => p.classList.remove("instant"))));
    return;
  }
  clearTimeout(underTimer);
  stage.querySelectorAll(".pane.under").forEach((p) => p.classList.remove("under"));
  gone.forEach((p) => p.classList.add("under"));

  underTimer = window.setTimeout(() => gone.forEach((p) => p.classList.remove("under")), 360);
}

function renderDividers(dividers: Divider[]) {
  while (dividerEls.length > dividers.length) dividerEls.pop()!.remove();
  while (dividerEls.length < dividers.length) {
    const el = document.createElement("div");
    const index = dividerEls.length;
    el.addEventListener("pointerdown", (e) => resizeSplit(e, index, el));
    stage.append(el);
    dividerEls.push(el);
  }
  dividerData = dividers;
  dividers.forEach((d, i) => {
    const el = dividerEls[i];
    el.className = `divider ${d.split.dir}`;

    const row = d.split.dir === "row";
    const grow = Math.max(0, DIVIDER_HIT - (row ? d.rect.w : d.rect.h)) / 2;
    Object.assign(el.style, {
      left: `${d.rect.x - (row ? grow : 0)}px`,
      top: `${d.rect.y - (row ? 0 : grow)}px`,
      width: `${d.rect.w + (row ? 2 * grow : 0)}px`,
      height: `${d.rect.h + (row ? 0 : 2 * grow)}px`,
    });
  });
}

function resizeSplit(e: PointerEvent, index: number, el: HTMLElement) {
  const { split, area } = dividerData[index];
  e.preventDefault();
  el.setPointerCapture(e.pointerId);
  el.classList.add("dragging");
  const origin = stage.getBoundingClientRect();
  const row = split.dir === "row";
  const move = (ev: PointerEvent) => {
    const pos = row ? ev.clientX - origin.left - area.x : ev.clientY - origin.top - area.y;
    const gap = paneGap();
    const size = (row ? area.w : area.h) - gap;
    split.ratio = Math.min(0.85, Math.max(0.15, (pos - gap / 2) / size));
    relayout();
  };
  const up = () => {
    el.classList.remove("dragging");
    el.removeEventListener("pointermove", move);
    el.removeEventListener("pointerup", up);
    scheduleUpdate();
  };
  el.addEventListener("pointermove", move);
  el.addEventListener("pointerup", up);
}

let layoutQueued = false;
new ResizeObserver(() => {
  if (layoutQueued) return;
  layoutQueued = true;
  requestAnimationFrame(() => {
    layoutQueued = false;
    relayout();
  });
}).observe(stage);

type DropTarget =
  | { kind: "pane"; session: Pane; edge: Edge }
  | { kind: "folder"; dir: string }
  | { kind: "pick" }
  | { kind: "order"; tab: Tab; after: boolean }

  | { kind: "detach"; card?: boolean };

const inside = (r: { left: number; top: number; right: number; bottom: number }, x: number, y: number) =>
  x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;

const dirKey = (path: string) => path.replace(/\\/g, "/").replace(/\/+$/, "").toLowerCase();
const draggedSessions = (item: DragItem) => (item.kind === "tab" ? sessionsOf(item.tab.root) : [item.session]);

function canMoveTo(item: DragItem, dir: string) {
  const sessions = draggedSessions(item);
  return sessions.every((session) => session.canChangeDirectory) && sessions.some((session) => dirKey(session.cwd) !== dirKey(dir));
}

function folderTargets(): HTMLElement[] {
  return [...document.querySelectorAll<HTMLElement>("#sidebar .group[data-dir], [data-drop-dir]")];
}

const folderTargetDir = (el: HTMLElement) => el.dataset.dropDir ?? el.dataset.dir!;

function dropTargetAt(x: number, y: number, item: DragItem): DropTarget | null {
  const under = document.elementFromPoint(x, y);
  const splitPane = item.kind === "pane" && tabOf(item.session)?.root.type === "split";
  if (under?.closest("[data-drop-detach]")) return splitPane ? { kind: "detach", card: true } : null;
  if (under?.closest("[data-drop-pick]")) return { kind: "pick" };
  const folder = under?.closest<HTMLElement>("#sidebar .group[data-dir], [data-drop-dir]");
  if (folder) {
    const dir = folderTargetDir(folder);
    return canMoveTo(item, dir) ? { kind: "folder", dir } : null;
  }
  if (under?.closest("#folder-dock")) return null;

  if (horizontalTabs() && inside(stripEl.getBoundingClientRect(), x, y)) {
    if (item.kind !== "tab") return splitPane ? { kind: "detach" } : null;
    const order = strip.orderTarget(x, y, item.tab);
    return order && { kind: "order", ...order };
  }
  if (!horizontalTabs() && inside(sidebarEl.getBoundingClientRect(), x, y)) {
    return splitPane ? { kind: "detach" } : null;
  }
  const s = stage.getBoundingClientRect();
  if (inside(s, x, y)) {
    for (const [session, r] of paneRects) {
      const abs: Rect = { x: s.left + r.x, y: s.top + r.y, w: r.w, h: r.h };
      if (x < abs.x || x > abs.x + abs.w || y < abs.y || y > abs.y + abs.h) continue;
      if (item.kind === "tab" && item.tab === activeTab) return null;
      if (item.kind === "pane" && item.session === session) return null;
      return { kind: "pane", session, edge: edgeAt(abs, x, y) };
    }
    return null;
  }
  return null;
}

function showDropHint(target: DropTarget | null) {
  const overCard = target?.kind === "detach" && target.card ? document.querySelector<HTMLElement>("[data-drop-detach]") : null;
  const onBar = target?.kind === "detach" && !target.card;
  sidebarEl.classList.toggle("drop-detach", onBar && !horizontalTabs());

  strip.showSlot(onBar && horizontalTabs() ? dragLabel : null);
  const folder = target?.kind === "folder" ? (folderTargets().find((el) => folderTargetDir(el) === target.dir) ?? null) : null;
  for (const el of folderTargets()) el.classList.toggle("drop-target", el === folder);
  dock.highlight(target?.kind === "pick" ? document.querySelector<HTMLElement>("[data-drop-pick]") : (overCard ?? folder));
  strip.showCaret(target?.kind === "order" ? target : null);
  if (target?.kind !== "pane") {
    dropHint.classList.remove("visible");
    return;
  }
  const r = halfRect(paneRects.get(target.session)!, target.edge);
  Object.assign(dropHint.style, { left: `${r.x}px`, top: `${r.y}px`, width: `${r.w}px`, height: `${r.h}px` });
  dropHint.classList.add("visible");
}

const centerOf = (el: Element | null | undefined) => {
  const r = el?.getBoundingClientRect();
  return r && r.width ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null;
};

function dropPoint(target: DropTarget | null): { x: number; y: number } | null {
  if (target?.kind === "folder") {
    return centerOf(folderTargets().find((el) => folderTargetDir(el) === target.dir && el.getBoundingClientRect().width));
  }
  if (target?.kind === "pick") return centerOf(document.querySelector("[data-drop-pick]"));
  if (target?.kind === "detach") {
    if (target.card) return centerOf(document.querySelector("[data-drop-detach]"));
    return horizontalTabs() ? strip.slotCenter() : null;
  }
  if (target?.kind === "order") return strip.centerOf(target.tab);
  if (target?.kind !== "pane") return null;
  const r = halfRect(paneRects.get(target.session)!, target.edge);
  const s = stage.getBoundingClientRect();
  return { x: s.left + r.x + r.w / 2, y: s.top + r.y + r.h / 2 };
}

function showFolderDock(item: DragItem) {
  if (!horizontalTabs() && settings.sidebarPinned) return;
  const sessions = draggedSessions(item);
  dock.show(
    groupTabs(tabs).map((g) => g.dir),
    sessions.map((session) => session.cwd),
    sessions.every((session) => session.canChangeDirectory),
    item.kind === "pane" && tabOf(item.session)?.root.type === "split",
  );
}

let dragLabel = "";

function beginDrag(item: DragItem, label: string, e: PointerEvent, el: HTMLElement) {
  dragLabel = label;
  const startX = e.clientX;
  const startY = e.clientY;
  let dragging = false;
  let target: DropTarget | null = null;
  el.setPointerCapture(e.pointerId);

  const move = (ev: PointerEvent) => {
    if (!dragging) {
      if (Math.hypot(ev.clientX - startX, ev.clientY - startY) < 6) return;
      dragging = true;
      if (settingsOpen) closeSettingsPage(false);
      sidebar.frozen = true;
      strip.frozen = true;
      ghost.start(`${icons.terminal}<span>${esc(label)}</span>`, ev.clientX, ev.clientY);
      document.body.classList.add("dragging");
      showFolderDock(item);
    }

    if (!settings.sidebarPinned) {
      const overBar = app.classList.contains("peek") && inside(sidebarEl.getBoundingClientRect(), ev.clientX, ev.clientY);
      setPeek(overBar || (item.kind === "pane" && ev.clientX <= 12));
    }
    ghost.moveTo(ev.clientX, ev.clientY);
    target = dropTargetAt(ev.clientX, ev.clientY, item);
    showDropHint(target);
  };
  const end = () => {
    el.removeEventListener("pointermove", move);
    el.removeEventListener("pointerup", end);
    el.removeEventListener("pointercancel", end);
    if (!dragging) return;
    lastDragEnd = performance.now();
    ghost.end(dropPoint(target));
    document.body.classList.remove("dragging");
    showDropHint(null);
    dock.hide();
    sidebar.frozen = false;
    strip.frozen = false;
    if (target) {
      setPeek(false);
      drop(item, target);
    } else {
      scheduleUpdate();
    }
  };
  el.addEventListener("pointermove", move);
  el.addEventListener("pointerup", end);
  el.addEventListener("pointercancel", end);
}

function moveToFolder(item: DragItem, dir: string) {
  if (!canMoveTo(item, dir)) return;
  if (item.kind === "tab") {
    for (const session of sessionsOf(item.tab.root)) session.changeDirectory(dir);
    return;
  }
  if (tabOf(item.session)?.root.type === "split") detachPane(item.session);
  item.session.changeDirectory(dir);
}

async function pickAndMove(item: DragItem) {
  const from = draggedSessions(item)[0]?.cwd;
  const dir = await openDialog({ directory: true, defaultPath: from }).catch(() => null);
  if (typeof dir === "string") moveToFolder(item, dir);
  current()?.focus();
}

function reorder(tab: Tab, target: { tab: Tab; after: boolean }) {
  const list = orderedTabs().filter((t) => t !== tab);
  list.splice(list.indexOf(target.tab) + (target.after ? 1 : 0), 0, tab);
  tabs.splice(0, tabs.length, ...list);
  scheduleUpdate();
}

function drop(item: DragItem, target: DropTarget) {
  if (target.kind === "folder") return moveToFolder(item, target.dir);
  if (target.kind === "pick") return void pickAndMove(item);
  if (target.kind === "order") {
    if (item.kind === "tab") reorder(item.tab, target);
    return;
  }
  if (target.kind === "detach") {
    if (item.kind === "pane") detachPane(item.session);
    return;
  }
  let sub: Node;
  let moved: Pane;
  if (item.kind === "tab") {
    sub = item.tab.root;
    moved = item.tab.focus;
    tabs.splice(tabs.indexOf(item.tab), 1);
  } else {
    const source = tabOf(item.session)!;
    const rest = removeSession(source.root, item.session);
    if (rest) {
      source.root = rest;
      if (source.focus === item.session) source.focus = sessionsOf(rest)[0];
    } else {
      tabs.splice(tabs.indexOf(source), 1);
    }
    sub = leaf(item.session);
    moved = item.session;
  }
  const dest = tabOf(target.session)!;
  dest.root = insertAt(dest.root, target.session, target.edge, sub);
  activateTab(dest, moved);
}

const TABS_KEY = "vidrio.tabs";

interface SavedState {
  active: number;
  tabs: { layout: SavedNode; focus: number }[];
}

function persist() {
  const list = orderedTabs();
  const state: SavedState = {
    active: activeTab ? list.indexOf(activeTab) : 0,
    tabs: list.map((t) => ({ layout: saveNode(t.root), focus: sessionsOf(t.root).indexOf(t.focus) })),
  };
  try {
    localStorage.setItem(TABS_KEY, JSON.stringify(state));
  } catch {
  }
}

function loadSaved(): SavedState | null {
  try {
    const state = JSON.parse(localStorage.getItem(TABS_KEY) ?? "null") as SavedState | null;
    if (state?.tabs?.length) return state;

    const old = JSON.parse(localStorage.getItem("vidrio.sessions") ?? "null") as {
      active?: number;
      sessions?: SessionInit[];
    } | null;
    if (old?.sessions?.length) {
      return { active: old.active ?? 0, tabs: old.sessions.map((init) => ({ layout: { type: "leaf", init }, focus: 0 })) };
    }
  } catch {
  }
  return null;
}

function copySelection(): boolean {
  const text = currentTerm()?.term.getSelection();
  if (!text) return false;
  writeText(text).catch(() => {});
  currentTerm()!.term.clearSelection();
  return true;
}

async function paste() {
  const session = currentTerm();
  if (!session) return;
  try {
    const image = await readImage();
    await image.close().catch(() => {});
    session.pasteClipboardImage();
    return;
  } catch {
  }

  try {
    const text = await readText();
    if (text) session.term.paste(text);
  } catch {
  }
}

stage.addEventListener("contextmenu", (e) => {
  if (settingsOpen) return;
  e.preventDefault();
  if (!copySelection()) paste();
});

const PEEK_IDLE_MS = 2500;
let peekTimer = 0;

let peekRequest = 0;
function setPeek(on: boolean) {
  clearTimeout(peekTimer);
  const request = ++peekRequest;
  const peek = on && !settings.sidebarPinned && !horizontalTabs() && tabs.length > 0;
  if (!peek) {
    app.classList.remove("peek");
    browserHost.setCoveredUntilX(0);
    return;
  }

  const reach = sidebarEl.offsetLeft + sidebarEl.offsetWidth;
  const show = () => {
    if (request !== peekRequest) return;
    app.classList.add("peek");
    browserHost.setCoveredUntilX(reach);

    setTitlebar(false);
    peekTimer = window.setTimeout(closeIdlePeek, PEEK_IDLE_MS);
  };
  if (app.classList.contains("peek")) show();
  else void browserHost.freezeUntilX(reach).then(show);
}

function closeIdlePeek() {
  if (sidebarEl.matches(":hover") || sidebarEl.contains(document.activeElement)) return;
  if (isMenuOpen() || document.body.classList.contains("dragging")) return;
  setPeek(false);
}

$("#peek-zone").addEventListener("mouseenter", () => {
  if (!titlebar) setPeek(true);
});
sidebarEl.addEventListener("mouseenter", () => clearTimeout(peekTimer));
sidebarEl.addEventListener("mouseleave", () => {
  if (isMenuOpen() || document.body.classList.contains("dragging")) return;
  peekTimer = window.setTimeout(() => setPeek(false), 220);
});

function togglePinned() {
  updateSettings({ sidebarPinned: !settings.sidebarPinned });
  setPeek(false);
  relayout();
}

btnPin.addEventListener("click", togglePinned);

const resizer = $("#sb-resize");
resizer.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  resizer.setPointerCapture(e.pointerId);
  const startX = e.clientX;
  const startWidth = settings.sidebarWidth;
  const move = (ev: PointerEvent) => {
    settings.sidebarWidth = Math.round(Math.min(420, Math.max(200, startWidth + ev.clientX - startX)));
    document.documentElement.style.setProperty("--sb-w", `${settings.sidebarWidth}px`);
  };
  resizer.addEventListener("pointermove", move);
  resizer.addEventListener(
    "pointerup",
    () => {
      resizer.removeEventListener("pointermove", move);
      saveSettings(settings);
    },
    { once: true },
  );
});

btnNew.addEventListener("click", () => newTab());
btnNew.addEventListener("contextmenu", (e) => {
  e.preventDefault();
  showMenu(e.clientX, e.clientY, newMenu());
});

function newMenu(): MenuEntry[] {
  return [
    ...shells.map((sh) => ({
      label: sh.name,
      hint: sh.id === settings.shell ? t("predeterminada", "default") : undefined,
      action: () => newTab(undefined, sh.id),
    })),
    "sep" as const,
    { label: t("Abrir en carpeta…", "Open in folder…"), action: () => void pickFolder() },
    { label: t("Navegador", "Browser"), hint: "Ctrl+Shift+O", action: () => void openBrowser() },
  ];
}

async function pickFolder() {
  const dir = await openDialog({ directory: true, defaultPath: current()?.cwd }).catch(() => null);
  if (typeof dir === "string") newTab(dir);
  else current()?.focus();
}

function anchor(session: Session | undefined): Point {
  if (!session) return { x: innerWidth / 2, y: 28 };
  const cursor = session.inputPoint();
  if (cursor) return cursor;
  const tab = tabOf(session);
  const row =
    tab &&
    [...document.querySelectorAll<HTMLElement>(`.tab[data-tab="${tab.id}"], .htab[data-tab="${tab.id}"]`)]
      .map((el) => el.getBoundingClientRect())
      .find((r) => r.width > 0);
  if (row && row.width && row.right > 0) return { x: row.left + row.width / 2, y: row.top + row.height / 2 };
  return { x: 28, y: innerHeight / 2 };
}

startAgentBridge({
  sessions: allSessions,
  anchor,
  openBrowser: (url, background) => hostOf(openBrowser(url, background).url),
  readBrowser: async (query, maxChars) => {
    const q = query?.trim().toLowerCase();
    const pages = browserHost.all();

    const page = q
      ? pages.find((p) => p.title.toLowerCase().includes(q) || p.url.toLowerCase().includes(q))
      : (pages.find((p) => p === current()) ?? pages[pages.length - 1]);
    if (!page) {
      throw new Error(q
        ? t(`No hay ninguna página abierta con "${query}".`, `No open page matches "${query}".`)
        : t("No hay páginas abiertas en el navegador. Abrí una con open_browser.", "There are no pages open in the browser. Open one with open_browser."));
    }
    return page.read(maxChars);
  },
});

const agents: AgentSettings = {
  port: 0,
  status: "",
  busy: false,
  found: null,
  claudeConnected: false,
  version: "",
  onConnect: async () => {
    agents.busy = true;
    rerenderSettings();
    try {
      await invoke<string>("connect_claude");
      agents.status = t(
        "Listo. Las sesiones de Claude Code que abras desde ahora ya pueden hablar entre sí; las que estaban abiertas tienen que reiniciarse.",
        "Done. The Claude Code sessions you open from now on can talk to each other; the ones that were open need a restart.",
      );
    } catch (e) {
      agents.status = t(`No se pudo conectar: ${e}`, `Couldn't connect: ${e}`);
    }
    agents.claudeConnected = await invoke<boolean>("claude_connected").catch(() => false);
    agents.busy = false;
    rerenderSettings();
  },
  onRescan: () => void scanAgents(true),
};
invoke<number>("agent_port").then((port) => (agents.port = port)).catch(() => {});
getVersion().then((v) => (agents.version = v)).catch(() => {});

async function scanAgents(clear = false) {
  if (clear) {
    agents.found = null;
    rerenderSettings();
  }
  const [programs, connected] = await Promise.all([
    invoke<{ command: string; path: string | null }[]>("find_programs", { commands: AGENTS.map((a) => a.command) }).catch(() => []),
    invoke<boolean>("claude_connected").catch(() => false),
  ]);
  agents.found = Object.fromEntries(AGENTS.map((a, i) => [a.id, programs[i]?.path ?? null]));
  agents.claudeConnected = connected;
  rerenderSettings();
}

function rerenderSettings() {
  if (settingsOpen) renderSettings(settingsEl, settings, shells, agents, updateSettings, () => closeSettingsPage());
}

function openSettingsPage() {
  if (settingsOpen) return;
  settingsOpen = true;
  renderSettings(settingsEl, settings, shells, agents, updateSettings, () => closeSettingsPage());
  settingsEl.hidden = false;
  app.classList.add("settings-open");
  btnSettings.classList.add("on");

  settingsEl.classList.add("entering");
  clearTimeout(settingsEnterTimer);
  settingsEnterTimer = window.setTimeout(() => settingsEl.classList.remove("entering"), 1100);
  relayout();
  scheduleUpdate();
  void scanAgents();
}

let settingsEnterTimer = 0;

function closeSettingsPage(refocus = true) {
  if (!settingsOpen) return;
  settingsOpen = false;
  settingsEl.hidden = true;
  app.classList.remove("settings-open");
  btnSettings.classList.remove("on");
  relayout();
  scheduleUpdate();
  if (refocus) current()?.focus();
}

const toggleSettings = () => (settingsOpen ? closeSettingsPage() : openSettingsPage());
btnSettings.addEventListener("click", toggleSettings);

const palette = new Palette(() => current()?.focus());

function openPalette() {
  if (palette.isOpen) return palette.close();
  hideMenu();
  palette.open(paletteCommands());
}

function paletteCommands(): Command[] {
  const tab = activeTab;
  const s = current();
  const term = currentTerm();
  const splitTab = tab?.root.type === "split" ? tab : null;
  const list: (Command | false | null | undefined)[] = [
    { label: t("Nueva terminal", "New terminal"), hint: "Ctrl+T", run: () => newTab() },
    ...shells.map((sh) => ({ label: t(`Nueva terminal: ${sh.name}`, `New terminal: ${sh.name}`), run: () => newTab(undefined, sh.id) })),
    { label: t("Abrir en carpeta…", "Open in folder…"), run: () => void pickFolder() },
    { label: t("Abrir navegador", "Open browser"), hint: "Ctrl+Shift+O", run: () => void openBrowser() },
    {
      label: t("Abrir página…", "Open page…"),
      run: async () => {
        const url = normalizeUrl((await palette.ask(t("Dirección o búsqueda", "Address or search"))) ?? "");
        if (url) openBrowser(url);
      },
    },
    tab && { label: t("Dividir a la derecha", "Split right"), hint: "Ctrl+Shift+D", run: () => split(tab, tab.focus, "right") },
    tab && { label: t("Dividir abajo", "Split down"), hint: "Ctrl+Shift+E", run: () => split(tab, tab.focus, "bottom") },
    splitTab && {
      label: splitTab.zoomed ? t("Achicar panel", "Restore pane") : t("Agrandar panel", "Zoom pane"),
      hint: "Ctrl+Shift+Z",
      run: () => toggleZoom(splitTab),
    },
    splitTab && {
      label: splitTab.broadcast
        ? t("Dejar de escribir en todos los paneles", "Stop typing in all panes")
        : t("Escribir en todos los paneles", "Type in all panes"),
      run: () => toggleBroadcast(splitTab),
    },
    term && { label: t("Buscar en la terminal", "Find in terminal"), hint: "Ctrl+F", run: () => term.openSearch() },
    term && { label: t("Ir al comando anterior", "Go to previous command"), hint: "Ctrl+↑", run: () => term.jumpToCommand(-1) },
    term && { label: t("Ir al comando siguiente", "Go to next command"), hint: "Ctrl+↓", run: () => term.jumpToCommand(1) },
    s && {
      label: s instanceof BrowserPane ? t("Renombrar página", "Rename page") : t("Renombrar terminal", "Rename terminal"),
      hint: t("doble clic", "double-click"),
      run: () => startRename(s),
    },
    s && { label: t("Cerrar panel", "Close pane"), hint: "Ctrl+W", run: () => closeSession(s) },
    tab && { label: t("Cerrar pestaña", "Close tab"), hint: "Ctrl+Shift+W", run: () => closeTab(tab) },
    closedLayouts.length > 0 && { label: t("Reabrir lo último cerrado", "Reopen what you last closed"), hint: "Ctrl+Shift+T", run: reopenClosed },
    tabs.length > 0 && { label: t("Guardar espacio de trabajo…", "Save workspace…"), run: () => void saveCurrentWorkspace() },
    ...loadWorkspaces().flatMap((w) => [
      { label: t(`Abrir espacio: ${w.name}`, `Open workspace: ${w.name}`), detail: workspaceSummary(w), run: () => openWorkspace(w) },
      { label: t(`Borrar espacio: ${w.name}`, `Delete workspace: ${w.name}`), run: () => deleteWorkspace(w.name) },
    ]),
    {
      label: notificationsEnabled()
        ? t("Desactivar avisos al terminar", "Turn off notifications when done")
        : t("Activar avisos al terminar", "Turn on notifications when done"),
      run: () => setNotificationsEnabled(!notificationsEnabled()),
    },
    {
      label: settings.sidebarPinned ? t("Ocultar barra lateral", "Hide sidebar") : t("Fijar barra lateral", "Pin sidebar"),
      hint: "Ctrl+Shift+B",
      run: togglePinned,
    },
    {
      label: settings.tabLayout === "horizontal" ? t("Pestañas al costado", "Tabs on the side") : t("Pestañas arriba", "Tabs on top"),
      run: () => updateSettings({ tabLayout: settings.tabLayout === "horizontal" ? "vertical" : "horizontal" }),
    },
    { label: t("Ajustes", "Settings"), hint: "Ctrl+,", run: openSettingsPage },
    { label: t("Pantalla completa", "Full screen"), hint: "F11", run: () => void toggleFullscreen() },
    { label: t("Agrandar letra", "Bigger text"), hint: "Ctrl+=", run: () => zoom(1) },
    { label: t("Achicar letra", "Smaller text"), hint: "Ctrl+-", run: () => zoom(-1) },
    { label: t("Tamaño de letra normal", "Normal text size"), hint: "Ctrl+0", run: () => zoom(0) },
    quake && { label: t("Salir del modo Quake", "Leave Quake mode"), hint: `${SUPER_KEY}+\``, run: () => void invoke("quake_exit") },
    ...orderedTabs().flatMap((tb) =>
      sessionsOf(tb.root).map((p) => ({ label: t(`Ir a: ${p.label}`, `Go to: ${p.label}`), detail: p.cwd, run: () => activateTab(tb, p) })),
    ),
  ];
  return list.filter((c): c is Command => !!c);
}

function workspaceSummary(w: Workspace): string {
  const leaves = (n: SavedNode): SessionInit[] => (n.type === "leaf" ? [n.init] : [...leaves(n.a), ...leaves(n.b)]);
  return w.tabs
    .flatMap(leaves)
    .map((init) => init.command ?? folderName(init.cwd))
    .join(" · ");
}

async function saveCurrentWorkspace() {
  const name = await palette.ask(t("Nombre del espacio de trabajo", "Workspace name"), folderName(current()?.cwd ?? ""));
  if (!name || !tabs.length) return;
  saveWorkspace({ name, tabs: orderedTabs().map((t) => saveNode(t.root, true)) });
}

function openWorkspace(w: Workspace) {
  let first: Tab | null = null;
  for (const layout of w.tabs) {
    const root = loadNode(layout, createPane);
    const tab: Tab = { id: nextTabId++, root, focus: sessionsOf(root)[0] };
    tabs.push(tab);
    first ??= tab;
  }
  if (first) activateTab(first);
}

let quake = false;
void listen<boolean>("quake", ({ payload }) => {
  quake = payload;
  if (!payload) return;
  app.classList.remove("quake-drop");
  void app.offsetWidth;
  app.classList.add("quake-drop");
  current()?.focus();
});

function zoom(step: number) {
  updateSettings({ fontSize: step === 0 ? DEFAULT_FONT_SIZE : clampFontSize(settings.fontSize + step) });
  rerenderSettings();
}

const ARROWS: Record<string, Edge> = { ArrowLeft: "left", ArrowRight: "right", ArrowUp: "top", ArrowDown: "bottom" };

function handleShortcut(e: KeyboardEvent): boolean {
  if (palette.isOpen) return false;

  const web = settingsOpen ? null : current();
  if (web instanceof BrowserPane) {
    const k = e.key.toLowerCase();
    if (e.ctrlKey && !e.altKey && !e.shiftKey && k === "l") {
      web.focusAddress();
      return true;
    }
    if ((e.ctrlKey && !e.altKey && !e.shiftKey && k === "r") || (e.key === "F5" && !e.ctrlKey && !e.altKey)) {
      web.reload();
      return true;
    }
    if (e.altKey && !e.ctrlKey && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
      web.history(e.key === "ArrowLeft" ? -1 : 1);
      return true;
    }
  }
  if (e.ctrlKey && e.shiftKey && !e.altKey && e.key.toLowerCase() === "o") {
    openBrowser();
    return true;
  }
  if (e.key === "Escape" && (isMenuOpen() || settingsOpen)) {
    if (isMenuOpen()) hideMenu();
    else closeSettingsPage();
    return true;
  }

  if (e.altKey && !e.ctrlKey && !e.shiftKey && !e.metaKey && ARROWS[e.key] && activeTab?.root.type === "split") {
    const next = neighbor(paneRects, activeTab.focus, ARROWS[e.key]);
    if (next) activateTab(activeTab, next);
    return true;
  }
  if (e.key === "F11" && !e.ctrlKey && !e.altKey && !e.shiftKey) {
    void toggleFullscreen();
    return true;
  }
  if (!e.ctrlKey || e.altKey || e.metaKey) return false;
  const key = e.key.toLowerCase();

  if (e.shiftKey) {
    switch (key) {
      case "t": reopenClosed(); return true;
      case "w": if (settingsOpen) closeSettingsPage(); else if (activeTab) closeTab(activeTab); return true;
      case "tab": case "pageup": cycle(-1); return true;
      case "pagedown": cycle(1); return true;
      case "d": if (activeTab) split(activeTab, activeTab.focus, "right"); return true;
      case "e": if (activeTab) split(activeTab, activeTab.focus, "bottom"); return true;
      case "b": togglePinned(); return true;
      case "f": currentTerm()?.openSearch(); return true;
      case "c": copySelection(); return true;
      case "v": paste(); return true;
      case "p": openPalette(); return true;
      case "z": if (activeTab) toggleZoom(activeTab); return true;
    }
    return false;
  }

  if (key === "arrowup" || key === "arrowdown") return currentTerm()?.jumpToCommand(key === "arrowup" ? -1 : 1) ?? false;

  switch (key) {
    case "t": newTab(); return true;
    case "w": {
      if (settingsOpen) closeSettingsPage();
      else { const s = current(); if (s) closeSession(s); }
      return true;
    }
    case "f":
      if (settingsOpen) focusSettingsSearch(settingsEl);
      else currentTerm()?.openSearch();
      return true;
    case "tab": case "pagedown": cycle(1); return true;
    case "pageup": cycle(-1); return true;
    case "v": paste(); return true;
    case "c": return copySelection();
    case ",": toggleSettings(); return true;
    case "=": case "+": zoom(1); return true;
    case "-": zoom(-1); return true;
    case "0": zoom(0); return true;
  }
  if (/^[1-9]$/.test(key)) {
    const list = orderedTabs();
    const target = key === "9" ? list[list.length - 1] : list[Number(key) - 1];
    if (target) {
      activateTab(target);
      announceTab();
    }
    return true;
  }
  return false;
}

async function toggleFullscreen() {
  await win.setFullscreen(!(await win.isFullscreen())).catch(() => {});
}

// Capture phase: shortcuts resolve before xterm sees the key.
window.addEventListener(
  "keydown",
  (e) => {
    const target = e.target as HTMLElement;
    if ((target.tagName === "INPUT" || target.tagName === "SELECT") && e.key !== "Escape") return;

    if (target.hasAttribute("data-search") && (target as HTMLInputElement).value) return;
    if (!handleShortcut(e)) return;
    e.preventDefault();
    e.stopPropagation();
  },
  true,
);

const TITLEBAR_H = 32;
let titlebar = false;
function setTitlebar(on: boolean) {
  if (on === titlebar) return;
  titlebar = on;
  app.classList.toggle("titlebar", on);
}
document.addEventListener("mousemove", (e) => {
  if (document.body.classList.contains("dragging")) return;

  const fixed = horizontalTabs() || app.classList.contains("caption");
  setTitlebar(!app.classList.contains("peek") && !fixed && e.clientY < (titlebar ? TITLEBAR_H + 6 : 10));
});
document.documentElement.addEventListener("mouseleave", () => setTitlebar(false));

const setCtrlHeld = (on: boolean) => document.documentElement.classList.toggle("ctrl-held", on);
window.addEventListener(
  "keydown",
  (e) => {
    if (e.key === "Control") setCtrlHeld(!e.altKey && !e.shiftKey);
    else if (!e.ctrlKey || e.altKey) setCtrlHeld(false);
  },
  true,
);
window.addEventListener("keyup", (e) => {
  if (e.key === "Control") setCtrlHeld(false);
});
window.addEventListener("blur", () => setCtrlHeld(false));

$("#winctl").addEventListener("click", (e) => {
  const action = (e.target as HTMLElement).closest<HTMLElement>("[data-win]")?.dataset.win;
  if (action === "min") void win.minimize();
  if (action === "max") void win.toggleMaximize();
  if (action === "close") void win.close();
});

void win.onResized(async () => {
  const maximized = await win.isMaximized();
  document.documentElement.classList.toggle("maximized", maximized);
  const max = $('[data-win="max"]');
  max.innerHTML = maximized ? GLYPH.restore : GLYPH.maximize;
  max.title = maximized ? t("Restaurar", "Restore") : t("Maximizar", "Maximize");
});

void getCurrentWebview().onDragDropEvent(({ payload }) => {
  if (payload.type === "enter" || payload.type === "over") {
    stage.classList.add("file-drop");
    return;
  }
  stage.classList.remove("file-drop");
  const target = currentTerm();
  if (payload.type === "drop" && target) {
    target.term.paste(payload.paths.map((p) => (/\s/.test(p) ? `"${p}"` : p)).join(" "));
    target.focus();
  }
});

if (!import.meta.env.DEV) {
  document.addEventListener("contextmenu", (e) => e.preventDefault());
}

async function boot() {
  applyAppearance();
  [shells, home] = await Promise.all([
    listShells().catch(() => [] as ShellInfo[]),
    homeDir().catch(() => (IS_WINDOWS ? "C:\\" : "/")),
  ]);
  setHome(home);

  if (!shells.some((s) => s.id === settings.shell)) settings.shell = shells[0]?.id ?? (IS_WINDOWS ? "powershell" : "bash");

  // xterm measures the font when created, so it must be loaded first.
  await Promise.all([loadTerminalFonts(), invoke("browser_close_all").catch(() => {})]);

  const saved = settings.restore ? loadSaved() : null;
  if (saved) {
    for (const { layout, focus } of saved.tabs) {
      const root = loadNode(layout, createPane);
      const panes = sessionsOf(root);
      tabs.push({ id: nextTabId++, root, focus: panes[Math.min(Math.max(focus, 0), panes.length - 1)] });
    }
    activateTab(tabs[Math.min(Math.max(saved.active, 0), tabs.length - 1)]);
  } else if (shouldOnboard()) {
    relayout();
    showWelcome();
  } else {
    relayout();
  }
  void applyEffect();
}

function showWelcome() {
  startOnboarding({
    settings,
    shells,
    home,
    update: updateSettings,
    findAgents: async () => {
      await scanAgents();
      return agents.found ?? {};
    },
    connectClaude: async () => {
      await agents.onConnect();
      return agents.claudeConnected;
    },
    claudeConnected: () => agents.claudeConnected,
    done: () => {
      if (!tabs.length) relayout();
      else current()?.focus();
    },
  });
}

window.addEventListener("beauty:install-agent", (e) => {
  const { command, url } = (e as CustomEvent<{ command?: string; url?: string }>).detail;
  if (url) return void openUrl(url).catch(() => {});
  if (!command) return;
  const powershell = IS_WINDOWS ? (shells.find((sh) => sh.id === "pwsh") ?? shells.find((sh) => sh.id === "powershell")) : undefined;
  closeSettingsPage(false);
  const session = createSession({ shell: powershell?.id ?? settings.shell, cwd: home, command });
  const tab: Tab = { id: nextTabId++, root: leaf(session), focus: session };
  tabs.push(tab);
  activateTab(tab);
});

function playIntro() {
  app.classList.add("intro");
  setTimeout(() => {
    app.classList.remove("intro");

    document.querySelectorAll(".pane.entering").forEach((p) => p.classList.remove("entering"));
  }, 450);
}

let revealed = false;
const reveal = () => {
  if (!revealed) playIntro();
  revealed = true;
  return win.show().then(() => win.setFocus()).then(() => current()?.focus()).catch(() => {});
};
const fallback = setTimeout(reveal, 2000);
boot().finally(() => {
  clearTimeout(fallback);
  void reveal();

  onUpdateChange(rerenderSettings);
  startUpdateChecks();
});
