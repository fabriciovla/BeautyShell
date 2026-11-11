import { Terminal, type ITheme } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { Unicode11Addon } from "@xterm/addon-unicode11";
import { WebLinksAddon } from "@xterm/addon-web-links";
import { SearchAddon, type ISearchOptions } from "@xterm/addon-search";
import { WebglAddon } from "@xterm/addon-webgl";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import type { IMarker } from "@xterm/xterm";
import { AGENTS, type AgentDef } from "./agent-catalog";
import { BackgroundKeyer, hexRgb } from "./glass-keyer";
import { icons } from "./icons";
import type { Rect } from "./layout";
import { isLocalUrl, registerFileLinks } from "./links";
import { killPty, resizePty, spawnPty, writePty } from "./pty";
import { esc } from "./settings";
import { t } from "./lang";
import { IS_WINDOWS } from "./platform";

export interface SessionInit {
  shell: string;
  cwd: string;
  name?: string | null;

  command?: string | null;

  browser?: string | null;
}

let lastPaneUid = 0;
export const nextPaneUid = () => ++lastPaneUid;

const WAITING_PROMPT = /\b(Do you want to|Would you like to)\b|Esc to cancel|Enter to (select|confirm)|\(y\/n\)|\[Y\/n\]|\[y\/N\]/i;

export interface TermLook {
  theme: ITheme;

  /** The theme background even when the terminal is translucent, reported to programs through OSC 11. */
  background: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: number;
  fontWeightBold: number;
  lineHeight: number;
  translucent: boolean;
  cursorStyle: "bar" | "block" | "underline";
  cursorBlink: boolean;
  scrollback: number;
  copyOnSelect: boolean;

  suggest: boolean;
}

export type PaneAction = "split" | "zoom" | "more" | "close";

export interface SessionHooks {
  onChange(): void;
  onFocus(session: Session): void;
  onAction(session: Session, action: PaneAction, event: MouseEvent): void;
  onHeadDrag(session: Session, event: PointerEvent, el: HTMLElement): void;

  onOpenLink(uri: string): void;

  onInput(session: Session, data: string): void;

  onCommandDone(session: Session, command: string, code: number, ms: number): void;

  suggest(session: Session, typed: string): string;

  onSettled(session: Session, ms: number): void;

  /** A program asks for attention: a permission prompt, a question or a notification (OSC 9 / 777). */
  onWaiting(session: Session, message: string | null): void;
}

const SEARCH_COLORS = {
  light: { matchBackground: "#fff1b3", activeMatchBackground: "#ffcf40", matchOverviewRuler: "#e6c34d", activeMatchColorOverviewRuler: "#ffb300" },
  dark: { matchBackground: "#4d3f00", activeMatchBackground: "#a37a00", matchOverviewRuler: "#806600", activeMatchColorOverviewRuler: "#d9a400" },
};

const SHELL_LABELS: Record<string, string> = {
  pwsh: "PowerShell",
  powershell: "PowerShell",
  cmd: "Cmd",
  gitbash: "Git Bash",
  wsl: "WSL",
  bash: "Bash",
  zsh: "Zsh",
  fish: "Fish",
  sh: "Sh",
};

export const shellLabel = (id: string) => SHELL_LABELS[id] ?? id;

let home = IS_WINDOWS ? "C:\\" : "/";
export const setHome = (dir: string) => (home = dir);

function posixToWindows(path: string): string {
  if (path === "~" || path.startsWith("~/")) path = home.replace(/\/$/, "") + path.slice(1);
  if (!IS_WINDOWS) return path;
  const drive = path.match(/^\/([a-zA-Z])(\/.*)?$/);
  if (!drive) return path;
  return `${drive[1].toUpperCase()}:${(drive[2] ?? "/").replace(/\//g, "\\")}`;
}

function normalizeDir(path: string): string {
  const p = posixToWindows(path.trim());
  return /^[A-Za-z]:\\$/.test(p) || p === "/" ? p : p.replace(/[\\/]+$/, "");
}

function windowsPath(path: string): string {
  if (!IS_WINDOWS) return path;
  const wsl = path.match(/^\/mnt\/([a-z])(?:\/(.*))?$/i);
  if (wsl) return `${wsl[1].toUpperCase()}:\\${(wsl[2] ?? "").replace(/\//g, "\\")}`;
  return posixToWindows(path);
}

function posixPath(path: string, wsl: boolean): string {
  if (!IS_WINDOWS) return path;
  const windows = path.match(/^([a-z]):[\\/](.*)$/i);
  if (windows) return `${wsl ? "/mnt/" : "/"}${windows[1].toLowerCase()}/${windows[2].replace(/\\/g, "/")}`;
  const mounted = path.match(/^\/mnt\/([a-z])(?:\/(.*))?$/i);
  if (mounted) return `${wsl ? "/mnt/" : "/"}${mounted[1].toLowerCase()}/${mounted[2] ?? ""}`;
  const drive = path.match(/^\/([a-z])(?:\/(.*))?$/i);
  if (drive) return `${wsl ? "/mnt/" : "/"}${drive[1].toLowerCase()}/${drive[2] ?? ""}`;
  return path.replace(/\\/g, "/");
}

const quotePosix = (path: string) => `'${path.replace(/'/g, "'\\''")}'`;

const agentPatterns = new Map<string, RegExp>();
function agentCommand(agent: AgentDef): RegExp {
  let pattern = agentPatterns.get(agent.id);
  if (!pattern) {
    pattern = new RegExp(`(^|[\\\\/\\s"])${agent.command}(\\.exe|\\.cmd|\\.ps1|\\.bat)?("|\\s|$)`, "i");
    agentPatterns.set(agent.id, pattern);
  }
  return pattern;
}

const isExeTitle = (t: string) => /\.exe$/i.test(t);

const isPathTitle = (t: string) => /^([A-Za-z]:\\|\/|~|MINGW(32|64):|[\w.-]+@[\w.-]+:\s*[~/])/.test(t);

function cwdFromTitle(title: string): string | null {
  const mingw = title.match(/^MINGW(?:32|64):(.+)$/);
  if (mingw) return normalizeDir(mingw[1]);
  if (/^[A-Za-z]:\\/.test(title) && !isExeTitle(title)) return normalizeDir(title);
  return null;
}

export const folderName = (dir: string) => dir.split(/[\\/]/).filter(Boolean).pop() ?? dir;

export class Session {
  readonly uid = nextPaneUid();
  readonly pane: HTMLDivElement;
  private readonly host: HTMLDivElement;
  private readonly head: HTMLDivElement;
  private readonly searchBox: HTMLDivElement;
  private readonly searchInput: HTMLInputElement;
  readonly term: Terminal;
  private readonly fitAddon = new FitAddon();
  private readonly searchAddon = new SearchAddon();
  private webgl: WebglAddon | null = null;
  private translucent: boolean;
  private background: string;
  private readonly keyer = new BackgroundKeyer();
  private copyOnSelect: boolean;
  private suggestOn: boolean;

  private inputStart: { line: number; x: number } | null = null;

  commandCwd = "";
  private readonly ghost: HTMLElement;

  private suggestion = "";
  private suggestQueued = false;
  private pendingInput = "";

  ptyId: number | null = null;
  shell: string;
  cwd: string;
  customName: string | null;
  title = "";
  visible = false;

  private shown = false;
  busy = false;
  attention = false;
  exited = false;
  exitCode = 0;

  waiting = false;

  command: string | null = null;

  private marks: IMarker[] = [];
  private commandRunning = false;
  private commandStartedAt = 0;
  private lastCommandDoneAt = 0;
  private promptHasInput = false;
  private commandPending = false;
  private startupCommand: string | null;
  private startupTimer = 0;

  private started = false;
  private startedAt = 0;
  private lastInputAt = 0;
  private lastResizeAt = 0;

  private ptyRows = 0;
  private bottomTimer = 0;
  private lastOutputAt = 0;
  private burstStart = 0;
  private busySince = 0;
  private idleTimer = 0;
  private resizeTimer = 0;
  private scrollTimer = 0;
  private reanchorTimer = 0;
  private promptReanchorPending = false;

  constructor(
    init: SessionInit,
    look: TermLook,
    stage: HTMLElement,
    private readonly hooks: SessionHooks,
  ) {
    this.shell = init.shell;
    this.cwd = init.cwd;
    this.customName = init.name ?? null;
    this.startupCommand = init.command?.trim() || null;
    this.translucent = look.translucent;
    this.background = look.background;
    this.keyer.setTheme(look.theme, look.background);
    this.copyOnSelect = look.copyOnSelect;
    this.suggestOn = look.suggest;

    this.pane =document.createElement("div");
    this.pane.className = "pane";
    this.host = document.createElement("div");
    this.host.className = "term-host";
    this.head = this.buildHead();
    this.searchBox = this.buildSearch();
    this.searchInput = this.searchBox.querySelector("input")!;
    this.pane.append(this.head, this.host, this.searchBox);
    stage.append(this.pane);
    this.pane.addEventListener("focusin", () => hooks.onFocus(this));
    this.pane.addEventListener("mousedown", () => hooks.onFocus(this));
    this.pane.addEventListener(
      "wheel",
      () => {
        this.pane.classList.add("scrolling");
        clearTimeout(this.scrollTimer);
        this.scrollTimer = window.setTimeout(() => this.pane.classList.remove("scrolling"), 900);
      },
      { passive: true },
    );

    this.term = new Terminal({
      fontFamily: look.fontFamily,
      fontSize: look.fontSize,
      fontWeight: look.fontWeight,
      fontWeightBold: look.fontWeightBold,
      lineHeight: look.lineHeight,
      theme: look.theme,
      allowTransparency: look.translucent,
      cursorBlink: look.cursorBlink,
      cursorStyle: look.cursorStyle,
      cursorWidth: 2,
      cursorInactiveStyle: "none",
      allowProposedApi: true,
      scrollback: look.scrollback,
      smoothScrollDuration: 90,
      rescaleOverlappingGlyphs: true,

      windowsPty: IS_WINDOWS ? { backend: "conpty", buildNumber: 22621 } : undefined,
    });

    this.term.loadAddon(this.fitAddon);
    this.term.loadAddon(this.searchAddon);
    this.term.loadAddon(new Unicode11Addon());
    this.term.unicode.activeVersion = "11";
    this.term.loadAddon(
      new WebLinksAddon((event, uri) => {
        if (event.ctrlKey || isLocalUrl(uri)) this.hooks.onOpenLink(uri);
      }),
    );
    registerFileLinks(this.term, () => this.cwd, () => home);
    this.term.open(this.host);
    this.loadWebgl();

    this.host.addEventListener("mouseup", () => {
      if (this.copyOnSelect && this.term.hasSelection()) writeText(this.term.getSelection()).catch(() => {});
    });

    this.term.onData((data) => this.input(data));
    this.ghost = document.createElement("div");
    this.ghost.className = "suggest";
    this.ghost.hidden = true;
    this.host.append(this.ghost);
    this.term.onRender(() => this.refreshSuggestion());
    this.term.onCursorMove(() => this.refreshSuggestion());
    this.term.onScroll(() => this.refreshSuggestion());

    this.term.attachCustomKeyEventHandler((e) => {
      if (e.type !== "keydown" || !this.suggestion || e.altKey || e.metaKey || e.shiftKey) return true;
      let take = "";
      if (!e.ctrlKey && (e.key === "Tab" || e.key === "ArrowRight")) take = this.suggestion;
      else if (e.ctrlKey && e.key === "ArrowRight") take = /^\s*\S+/.exec(this.suggestion)?.[0] ?? "";
      if (!take) return true;
      e.preventDefault();
      this.hideSuggestion();
      this.input(take);
      return false;
    });

    this.term.onResize(({ cols, rows }) => {
      this.lastResizeAt = performance.now();
      const grew = rows > this.ptyRows;
      clearTimeout(this.resizeTimer);
      this.resizeTimer = window.setTimeout(() => {
        if (this.ptyId === null) return;
        this.ptyRows = rows;
        resizePty(this.ptyId, cols, rows).catch(() => {});
        if (grew) this.keepPromptAtBottom();
      }, 60);
    });
    this.term.onTitleChange((title) => this.setTitle(title));
    this.term.onBell(() => {
      if (this.visible && document.hasFocus()) return;
      if (!this.visible) this.attention = true;
      if (!this.setWaiting(null)) this.changed();
    });
    this.searchAddon.onDidChangeResults(({ resultIndex, resultCount }) => {
      const count = this.searchBox.querySelector(".search-count")!;
      count.textContent = !resultCount ? t("sin resultados", "no results") : `${resultIndex < 0 ? "+" : resultIndex + 1}/${resultCount}`;
    });

    this.term.parser.registerOscHandler(11, (data) => {
      if (!this.translucent || data !== "?" || this.ptyId === null) return false;
      const hex = hexRgb(this.background).map((v) => v.toString(16).padStart(2, "0").repeat(2));
      writePty(this.ptyId, `\x1b]11;rgb:${hex.join("/")}\x1b\\`).catch(() => {});
      return true;
    });

    this.term.parser.registerOscHandler(9, (data) => {
      if (data.startsWith("9;")) {
        this.commandPending = false;
        this.setCwd(data.slice(2).replace(/^"(.*)"$/, "$1"));
        if (this.promptReanchorPending) this.reanchorPromptAfterResize();
        return true;
      }
      if (/^\d+;/.test(data)) return false;
      this.setWaiting(data || null);
      return true;
    });
    this.term.parser.registerOscHandler(777, (data) => {
      const [kind, title, body] = data.split(";");
      if (kind !== "notify") return false;
      this.setWaiting([title, body].filter(Boolean).join(": ") || null);
      return true;
    });
    this.term.parser.registerOscHandler(133, (data) => {
      this.shellMark(data);
      return true;
    });
    this.term.parser.registerOscHandler(7701, (data) => {
      try {
        this.command = new TextDecoder().decode(Uint8Array.from(atob(data), (c) => c.charCodeAt(0))).trim();
      } catch {
        this.command = null;
      }
      return true;
    });
    this.term.parser.registerOscHandler(7, (data) => {
      try {
        this.commandPending = false;
        this.setCwd(decodeURIComponent(new URL(data).pathname));
        if (this.promptReanchorPending) this.reanchorPromptAfterResize();
      } catch {
      }
      return true;
    });
  }

  private buildHead(): HTMLDivElement {
    const head = document.createElement("div");
    head.className = "pane-head";
    head.innerHTML = `
      <span class="pane-head-title"></span>
      <div class="pane-actions">
        <button class="icon-btn" data-act="search" title="${t("Buscar", "Find")} (Ctrl+F)">${icons.search}</button>
        <button class="icon-btn" data-act="split" title="${t("Dividir a la derecha", "Split right")} (Ctrl+Shift+D)">${icons.split}</button>
        <button class="icon-btn" data-act="zoom" title="${t("Agrandar o achicar el panel", "Zoom the pane in or out")} (Ctrl+Shift+Z)">${icons.expand}</button>
        <button class="icon-btn" data-act="more" title="${t("Más opciones", "More options")}">${icons.dots}</button>
        <button class="icon-btn" data-act="close" title="${t("Cerrar panel", "Close pane")} (Ctrl+W)">${icons.close}</button>
      </div>`;
    head.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      const action = target.closest<HTMLElement>("[data-act]")?.dataset.act;
      if (action === "search") this.openSearch();
      else if (action) this.hooks.onAction(this, action as PaneAction, e);
    });

    head.addEventListener("pointerdown", (e) => {
      if (e.button !== 0 || (e.target as HTMLElement).closest("button")) return;
      this.hooks.onHeadDrag(this, e, head);
    });
    return head;
  }

  private buildSearch(): HTMLDivElement {
    const box = document.createElement("div");
    box.className = "pane-search glass";
    box.hidden = true;
    box.innerHTML = `
      <input type="text" placeholder="${t("Buscar", "Find")}" spellcheck="false">
      <span class="search-count"></span>
      <button class="icon-btn" data-dir="prev" title="${t("Anterior", "Previous")} (Shift+Enter)">${icons.up}</button>
      <button class="icon-btn" data-dir="next" title="${t("Siguiente", "Next")} (Enter)">${icons.down}</button>
      <button class="icon-btn" data-dir="close" title="${t("Cerrar", "Close")} (Esc)">${icons.close}</button>`;
    const input = box.querySelector("input")!;
    input.addEventListener("input", () => this.find(false, true));
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") this.find(e.shiftKey);
      if (e.key === "Escape") this.closeSearch();
    });
    box.addEventListener("click", (e) => {
      const dir = (e.target as HTMLElement).closest<HTMLElement>("[data-dir]")?.dataset.dir;
      if (dir === "close") this.closeSearch();
      else if (dir) this.find(dir === "prev");
    });
    return box;
  }

  openSearch() {
    this.searchBox.hidden = false;
    this.searchInput.focus();
    this.searchInput.select();
    if (this.searchInput.value) this.find(false, true);
  }

  private closeSearch() {
    this.searchBox.hidden = true;
    this.searchAddon.clearDecorations();
    this.term.focus();
  }

  private find(backwards: boolean, incremental = false) {
    const query = this.searchInput.value;
    if (!query) {
      this.searchAddon.clearDecorations();
      this.searchBox.querySelector(".search-count")!.textContent = "";
      return;
    }
    const theme = document.documentElement.dataset.theme === "dark" ? "dark" : "light";
    const options: ISearchOptions = { incremental, decorations: SEARCH_COLORS[theme] };
    if (backwards) this.searchAddon.findPrevious(query, options);
    else this.searchAddon.findNext(query, options);
  }

  private updateHead() {
    this.head.querySelector(".pane-head-title")!.textContent = this.label;
  }

  private get runsCodex() {
    return /(^|[\\/\s"])codex(\.exe|\.cmd|\.ps1)?("|\s|$)/i.test(this.command ?? "") || /\bcodex\b/i.test(this.label);
  }

  private get runsClaude() {
    return /(^|[\\/\s"])claude(\.exe|\.cmd|\.ps1)?("|\s|$)/i.test(this.command ?? "") || /\bclaude\b/i.test(this.label);
  }

  get agent(): AgentDef | null {
    const command = this.runningCommand;
    if (command) {
      const found = AGENTS.find((a) => agentCommand(a).test(command));
      if (found) return found;
    }

    if (this.customName) return null;
    const label = this.label.toLowerCase();
    return AGENTS.find((a) => a.name.toLowerCase() === label) ?? null;
  }

  pasteClipboardImage() {
    if (
      this.exited ||
      this.ptyId === null ||
      (!this.commandRunning && !this.busy && !this.runsClaude && !this.runsCodex)
    ) {
      return false;
    }
    this.input(IS_WINDOWS ? "\x1bv" : "\x16");
    return true;
  }

  async deliver(text: string, submit: boolean) {
    if (this.exited || this.ptyId === null) throw new Error(t(`"${this.label}" no tiene un proceso corriendo.`, `"${this.label}" has no running process.`));
    const sentAt = performance.now();
    if (this.runsCodex) {
      await writePty(this.ptyId, text.replace(/\s*\r?\n\s*/g, " "));
    } else {
      this.term.paste(text);
    }
    if (submit) {
      const quiet = () => performance.now() - this.lastOutputAt >= 150;
      while (performance.now() - sentAt < 2500 && (performance.now() - sentAt < 250 || !quiet())) {
        await new Promise((r) => setTimeout(r, 50));
      }
      if (this.ptyId !== null) await writePty(this.ptyId, "\r");
    }
    this.pane.classList.remove("receiving");
    void this.pane.offsetWidth;
    this.pane.classList.add("receiving");
  }

  refreshSuggestion() {
    if (this.suggestQueued) return;
    this.suggestQueued = true;
    requestAnimationFrame(() => {
      this.suggestQueued = false;
      this.showSuggestion(this.currentSuggestion());
    });
  }

  private hideSuggestion() {
    this.suggestion = "";
    this.ghost.hidden = true;
  }

  private currentSuggestion(): string {
    const powershell = this.shell === "pwsh" || this.shell === "powershell";
    if (!this.suggestOn || !powershell || this.exited || this.commandRunning || !this.inputStart) return "";
    const buffer = this.term.buffer.active;
    if (buffer.type !== "normal" || buffer.viewportY !== buffer.baseY) return "";
    const line = buffer.baseY + buffer.cursorY;
    if (line !== this.inputStart.line || buffer.cursorX < this.inputStart.x) return "";
    const text = buffer.getLine(line)?.translateToString(false) ?? "";

    if (text.slice(buffer.cursorX).trim()) return "";
    const typed = text.slice(this.inputStart.x, buffer.cursorX);
    if (!typed.trim()) return "";
    return this.hooks.suggest(this, typed);
  }

  private showSuggestion(rest: string) {
    this.suggestion = rest;
    const screen = this.term.element?.querySelector<HTMLElement>(".xterm-screen");
    if (!rest || !screen) {
      this.ghost.hidden = true;
      return;
    }

    const box = screen.getBoundingClientRect();
    const host = this.host.getBoundingClientRect();
    const cellWidth = box.width / this.term.cols;
    const cellHeight = box.height / this.term.rows;
    const buffer = this.term.buffer.active;
    const room = Math.max(0, this.term.cols - buffer.cursorX);
    Object.assign(this.ghost.style, {
      left: `${box.left - host.left + buffer.cursorX * cellWidth}px`,
      top: `${box.top - host.top + buffer.cursorY * cellHeight}px`,
      height: `${cellHeight}px`,
      lineHeight: `${cellHeight}px`,
      fontFamily: String(this.term.options.fontFamily),
      fontSize: `${this.term.options.fontSize}px`,
      fontWeight: String(this.term.options.fontWeight ?? 400),
    });
    this.ghost.style.setProperty("--cell", `${cellWidth}px`);
    this.ghost.innerHTML = [...rest.slice(0, room)].map((ch) => `<i>${ch === " " ? "&nbsp;" : esc(ch)}</i>`).join("");
    this.ghost.hidden = false;
  }

  readScreen(count: number): string {
    const buffer = this.term.buffer.active;
    const end = buffer.baseY + this.term.rows;
    const lines: string[] = [];
    for (let i = Math.max(0, end - count); i < end; i++) lines.push(buffer.getLine(i)?.translateToString(true) ?? "");
    while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
    return lines.join("\n");
  }

  inputPoint(): { x: number; y: number } | null {
    if (!this.visible) return null;
    const r = this.host.getBoundingClientRect();
    if (!r.width || !r.height) return null;
    const { cols, rows } = this.term;
    const buffer = this.term.buffer.active;
    const cellWidth = r.width / cols;
    const cellHeight = r.height / rows;

    const rules: { row: number; start: number; end: number }[] = [];
    for (let row = rows - 1; row >= 0 && rules.length < 2; row--) {
      const text = buffer.getLine(buffer.baseY + row)?.translateToString(false) ?? "";
      if (!/^\s*─+\s*$/.test(text)) continue;
      const start = text.indexOf("─");
      const end = text.lastIndexOf("─");
      if (end - start >= cols / 3) rules.push({ row, start, end });
    }

    if (rules.length === 2 && rules[0].row - rules[1].row <= rows / 2) {
      const [bottom, top] = rules;
      return {
        x: r.left + ((top.start + top.end + 1) / 2) * cellWidth,
        y: r.top + ((top.row + bottom.row + 1) / 2) * cellHeight,
      };
    }
    return { x: r.left + r.width / 2, y: r.top + (buffer.cursorY + 0.5) * cellHeight };
  }

  rename(name: string | null) {
    this.customName = name;
    this.changed();
  }

  write(data: string) {
    if (this.exited || this.ptyId === null) return;
    this.clearWaiting();
    writePty(this.ptyId, data).catch(() => {});
  }

  get canChangeDirectory() {
    return !this.exited && this.ptyId !== null && !this.commandRunning && !this.commandPending && !this.promptHasInput;
  }

  changeDirectory(dir: string) {
    if (!this.canChangeDirectory) return false;
    let command: string;
    switch (this.shell) {
      case "pwsh":
      case "powershell":
        command = `Set-Location -LiteralPath '${windowsPath(dir).replace(/'/g, "''")}'`;
        break;
      case "cmd":
        command = `cd /d "${windowsPath(dir).replace(/"/g, '""')}"`;
        break;
      case "gitbash":
        command = `cd -- ${quotePosix(posixPath(dir, false))}`;
        break;
      case "wsl":
        command = `cd -- ${quotePosix(posixPath(dir, true))}`;
        break;

      case "bash":
      case "zsh":
      case "fish":
      case "sh":
        command = `cd -- ${quotePosix(dir)}`;
        break;
      default:
        return false;
    }
    this.commandPending = true;
    this.write(`${command}\r`);
    return true;
  }

  private setWaiting(message: string | null): boolean {
    if (this.waiting) return false;
    this.waiting = true;
    this.hooks.onWaiting(this, message);
    this.changed();
    return true;
  }

  private clearWaiting() {
    if (!this.waiting) return;
    this.waiting = false;
    this.changed();
  }

  private shellMark(data: string) {
    const [kind, arg] = data.split(";");
    const now = performance.now();
    if (kind === "A") {
      this.inputStart = null;
      this.promptHasInput = false;
      const marker = this.term.registerMarker(0);
      if (!marker) return;
      this.marks.push(marker);
      if (this.marks.length > 500) this.marks.shift()?.dispose();
    } else if (kind === "B") {
      const buffer = this.term.buffer.active;
      this.inputStart = { line: buffer.baseY + buffer.cursorY, x: buffer.cursorX };
      this.runStartupCommand();
    } else if (kind === "C") {
      this.commandRunning = true;
      this.commandStartedAt = now;
      this.commandCwd = this.cwd;
      this.inputStart = null;
      this.hideSuggestion();

      this.changed();
    } else if (kind === "D" && this.commandRunning) {
      this.commandRunning = false;
      this.commandPending = false;
      this.promptHasInput = false;
      if (this.promptReanchorPending) this.reanchorPromptAfterResize();
      const code = Number(arg) || 0;
      const command = this.command ?? "";
      this.command = null;
      if (!command) {
        this.marks.pop()?.dispose();
        return;
      }
      this.lastCommandDoneAt = now;
      this.hooks.onCommandDone(this, command, code, now - this.commandStartedAt);
      this.changed();
    }
  }

  jumpToCommand(step: -1 | 1): boolean {
    const buffer = this.term.buffer.active;
    this.marks = this.marks.filter((m) => !m.isDisposed && m.line >= 0);
    if (!this.marks.length || this.commandRunning || buffer.type !== "normal") return false;
    const top = buffer.viewportY;
    const lines = this.marks.map((m) => m.line);
    const target = step < 0 ? lines.filter((l) => l < top).pop() : lines.find((l) => l > top);
    if (target === undefined) {
      if (step > 0) this.term.scrollToBottom();
      return true;
    }
    if (step > 0 && target > buffer.baseY) this.term.scrollToBottom();
    else this.term.scrollToLine(target);
    return true;
  }

  get runningCommand(): string | null {
    return this.commandRunning ? this.command : null;
  }

  private runStartupCommand() {
    clearTimeout(this.startupTimer);
    const command = this.startupCommand;
    if (!command || this.ptyId === null) return;
    this.startupCommand = null;
    writePty(this.ptyId, `${command}\r`).catch(() => {});
  }

  private changed() {
    this.updateHead();
    this.hooks.onChange();
  }

  private loadWebgl() {
    try {
      const webgl = new WebglAddon();
      webgl.onContextLoss(() => {
        webgl.dispose();
        if (this.webgl === webgl) this.webgl = null;
      });
      this.term.loadAddon(webgl);
      this.webgl = webgl;
    } catch {
    }
  }

  async start() {
    this.exited = false;
    if (!this.started) {
      this.started = true;
      await this.waitForSize();
      await document.fonts.ready;
      await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      this.fit();

      this.term.write("\r\n".repeat(this.term.rows - 1));
    }
    this.startedAt = performance.now();
    this.fit();
    const { cols, rows } = this.term;
    try {
      this.ptyId = await spawnPty({
        shell: this.shell,
        cwd: this.cwd,
        cols,
        rows,
        onData: (data) => this.output(data),
      });
      if (this.pendingInput) {
        const pending = this.pendingInput;
        this.pendingInput = "";
        writePty(this.ptyId, pending).catch(() => {});
      }
      this.ptyRows = rows;
      if (this.term.cols !== cols || this.term.rows !== rows) {
        resizePty(this.ptyId, this.term.cols, this.term.rows).catch(() => {});
        this.ptyRows = this.term.rows;
      }

      if (this.startupCommand) this.startupTimer = window.setTimeout(() => this.runStartupCommand(), 3000);
    } catch (e) {
      this.exited = true;
      this.term.write(`\x1b[31m${t("No se pudo iniciar la shell", "Couldn't start the shell")}: ${e}\x1b[0m\r\n`);
    }
    this.changed();
  }

  private waitForSize(): Promise<void> {
    if (this.host.clientHeight) return Promise.resolve();
    return new Promise((resolve) => {
      const done = () => {
        observer.disconnect();
        clearTimeout(timeout);
        resolve();
      };
      const observer = new ResizeObserver(() => this.host.clientHeight && done());
      const timeout = setTimeout(done, 2000);
      observer.observe(this.host);
    });
  }

  private input(data: string) {
    if (this.exited) {
      if (data === "\r") {
        this.term.write("\r\n");
        void this.start();
      }
      return;
    }
    if (data.includes("\r") || data.includes("\n")) {
      if (this.promptHasInput) this.commandPending = true;
      this.promptHasInput = false;
    } else if (data === "\x03") {
      this.promptHasInput = false;
      this.commandPending = false;
    } else if (data !== "\x0c" && data.length) {
      this.promptHasInput = true;
    }
    this.lastInputAt = performance.now();
    this.clearWaiting();
    if (this.ptyId === null) this.pendingInput += data;
    else writePty(this.ptyId, data).catch(() => {});
    this.hooks.onInput(this, data);
  }

  private output(data: string) {
    this.term.write(this.translucent ? this.keyer.process(data) : data);
    const now = performance.now();
    if (now - this.lastOutputAt > 400) this.burstStart = now;
    this.lastOutputAt = now;

    const incidental =
      now - this.lastInputAt < 300 || now - this.lastResizeAt < 500 || now - this.startedAt < 1500;
    if (incidental) return;

    let changed = false;
    if (!this.visible && !this.attention) {
      this.attention = true;
      changed = true;
    }
    if (!this.busy && now - this.burstStart > 600) {
      this.busy = true;
      this.busySince = this.burstStart;
      this.waiting = false;
      changed = true;
    }
    clearTimeout(this.idleTimer);
    this.idleTimer = window.setTimeout(() => this.settle(), 800);
    if (changed) this.changed();
  }

  private settle() {
    if (!this.busy) return;
    this.busy = false;
    if (!this.visible) this.attention = true;
    if (WAITING_PROMPT.test(this.readScreen(15))) {
      if (this.setWaiting(null)) return;
    } else if (performance.now() - this.lastCommandDoneAt > 2000) {
      this.hooks.onSettled(this, this.lastOutputAt - this.busySince);
    }
    this.changed();
  }

  handleExit(code: number) {
    this.exited = true;
    this.exitCode = code;
    this.ptyId = null;
    this.busy = false;
    this.term.write(`\r\n\x1b[2m${t(`[proceso terminado · código ${code}] Enter para reiniciar`, `[process exited · code ${code}] Enter to restart`)}\x1b[0m\r\n`);
    this.changed();
  }

  private setTitle(title: string) {
    this.title = title.trim();
    const cwd = cwdFromTitle(this.title);
    if (cwd) this.cwd = cwd;
    this.changed();
  }

  private setCwd(path: string) {
    const dir = normalizeDir(path);
    if (!dir || dir === this.cwd) return;
    this.cwd = dir;
    this.changed();
  }

  get label(): string {
    if (this.customName) return this.customName;
    let text = this.title;
    if (!text || isPathTitle(text) || isExeTitle(text)) return shellLabel(this.shell);
    text = text.match(/\.exe\s+-\s+(.+)$/i)?.[1] ?? text;
    text = text.replace(/^(Administrador|Administrator):\s*/i, "");

    text = text.replace(/^[^\p{L}\p{N}\s"'([{<\\/.~-]\uFE0F?\s+/u, "").trim();
    return text ? text.charAt(0).toUpperCase() + text.slice(1) : shellLabel(this.shell);
  }

  place(rect: Rect, visible: boolean) {
    const style = this.pane.style;
    style.left = `${rect.x}px`;
    style.top = `${rect.y}px`;
    style.width = `${rect.w}px`;
    style.height = `${rect.h}px`;
    this.pane.classList.toggle("top-edge", rect.y === 0);
    this.pane.classList.toggle("left-edge", rect.x === 0);
    this.pane.classList.toggle("visible", visible);

    if (visible && !this.shown) {
      this.shown = true;
      this.pane.classList.add("entering");
      const done = (e: AnimationEvent) => {
        if (e.target !== this.pane || e.pseudoElement) return;
        this.pane.classList.remove("entering");
        this.pane.removeEventListener("animationend", done);
      };
      this.pane.addEventListener("animationend", done);
    }
    if (visible && !this.visible) this.attention = false;
    this.visible = visible;
    this.fit();
  }

  setFocused(on: boolean) {
    this.pane.classList.toggle("focused", on);
  }

  focus() {
    this.term.focus();
    if (this.promptReanchorPending) this.reanchorPromptAfterResize();
  }

  private keepPromptAtBottom() {
    if (this.shell !== "pwsh" && this.shell !== "powershell") return;
    clearTimeout(this.bottomTimer);
    this.bottomTimer = window.setTimeout(() => {
      const buffer = this.term.buffer.active;
      if (this.exited || this.ptyId === null || this.commandRunning || this.commandPending || !this.inputStart) return;
      if (buffer.type !== "normal" || buffer.cursorY >= this.term.rows - 1) return;
      writePty(this.ptyId, "\x1b[24;8~").catch(() => {});
    }, 200);
  }

  reanchorPromptAfterResize() {
    if (this.shell !== "pwsh" && this.shell !== "powershell") return;
    this.promptReanchorPending = true;
    clearTimeout(this.reanchorTimer);
    this.reanchorTimer = window.setTimeout(() => {
      if (!this.exited && this.ptyId !== null && !this.commandRunning && !this.commandPending) {
        this.promptReanchorPending = false;
        this.lastInputAt = performance.now();
        writePty(this.ptyId!, "\x0c").catch(() => {});
      }
    }, 180);
  }

  fit() {
    if (!this.host.clientWidth || !this.host.clientHeight) return;
    try {
      this.fitAddon.fit();
    } catch {
    }
  }

  applyLook(look: TermLook) {
    const fontChanged =
      this.term.options.fontSize !== look.fontSize ||
      this.term.options.fontFamily !== look.fontFamily ||
      this.term.options.lineHeight !== look.lineHeight ||
      this.term.options.fontWeight !== look.fontWeight;
    this.term.options.theme = look.theme;
    this.term.options.fontSize = look.fontSize;
    this.term.options.fontFamily = look.fontFamily;
    this.term.options.fontWeight = look.fontWeight;
    this.term.options.fontWeightBold = look.fontWeightBold;
    this.term.options.lineHeight = look.lineHeight;
    this.background = look.background;
    this.keyer.setTheme(look.theme, look.background);
    this.term.options.cursorStyle = look.cursorStyle;
    this.term.options.cursorBlink = look.cursorBlink;
    this.term.options.scrollback = look.scrollback;
    this.copyOnSelect = look.copyOnSelect;
    this.suggestOn = look.suggest;
    this.refreshSuggestion();
    if (look.translucent !== this.translucent) {
      this.translucent = look.translucent;
      this.term.options.allowTransparency = look.translucent;
      this.webgl?.dispose();
      this.webgl = null;
      this.loadWebgl();
    }
    this.fit();
    if (fontChanged && (this.shell === "pwsh" || this.shell === "powershell")) {
      this.promptReanchorPending = true;
      if (this.visible) this.reanchorPromptAfterResize();
    }
  }

  serialize(withCommand = false): SessionInit {
    const init: SessionInit = { shell: this.shell, cwd: this.cwd, name: this.customName };
    if (withCommand && this.runningCommand) init.command = this.runningCommand;
    return init;
  }

  dispose() {
    clearTimeout(this.idleTimer);
    clearTimeout(this.startupTimer);
    clearTimeout(this.resizeTimer);
    clearTimeout(this.scrollTimer);
    clearTimeout(this.reanchorTimer);
    if (this.ptyId !== null) killPty(this.ptyId).catch(() => {});

    if (!this.visible) {
      this.term.dispose();
      this.pane.remove();
      return;
    }
    this.pane.classList.remove("entering");
    this.pane.classList.add("leaving");
    setTimeout(() => {
      this.term.dispose();
      this.pane.remove();
    }, 150);
  }
}
