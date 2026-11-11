import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { openUrl } from "@tauri-apps/plugin-opener";
import { icons } from "./icons";
import type { Rect } from "./layout";
import { nextPaneUid, type SessionInit } from "./session";
import { esc } from "./settings";
import { t } from "./lang";

export function normalizeUrl(text: string): string | null {
  const t = text.trim();
  if (!t) return null;
  if (/^(https?|file|about):/i.test(t)) return t;
  if (/^(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(:\d+)?(\/|$)/i.test(t)) return `http://${t}`;
  if (/^[\w-]+(\.[\w-]+)+(:\d+)?(\/\S*)?$/.test(t)) return `https://${t}`;
  return `https://www.google.com/search?q=${encodeURIComponent(t)}`;
}

export function hostOf(url: string): string {
  try {
    return new URL(url).host || url;
  } catch {
    return url;
  }
}

export interface BrowserHooks {
  changed(): void;
  onFocus(pane: BrowserPane): void;

  onHeadDrag(pane: BrowserPane, event: PointerEvent, el: HTMLElement): void;
  onClose(pane: BrowserPane): void;

  openTab(url: string): void;

  suggestions(): string[];
}

export class BrowserHost {
  private readonly panes = new Map<string, BrowserPane>();
  covered = false;

  coveredUntilX = 0;

  constructor() {
    void listen<{ label: string; kind: string; value: string }>("browser-event", ({ payload }) => {
      this.panes.get(payload.label)?.event(payload.kind, payload.value);
    });
  }

  register(pane: BrowserPane) {
    this.panes.set(pane.viewId, pane);
  }

  unregister(pane: BrowserPane) {
    this.panes.delete(pane.viewId);
  }

  setCovered(covered: boolean) {
    if (covered === this.covered) return;
    this.covered = covered;
    for (const pane of this.panes.values()) pane.sync();
  }

  async freezeUntilX(x: number) {
    const under = this.all().filter((pane) => pane.shownLeftOf(x));
    if (!under.length) return;
    await Promise.race([Promise.all(under.map((pane) => pane.freeze())), new Promise((done) => setTimeout(done, 250))]);
  }

  setCoveredUntilX(x: number) {
    if (x === this.coveredUntilX) return;
    this.coveredUntilX = x;
    for (const pane of this.panes.values()) pane.sync();
  }

  all(): BrowserPane[] {
    return [...this.panes.values()];
  }
}

export class BrowserPane {
  readonly uid = nextPaneUid();

  readonly viewId = `browser-${this.uid}-${Date.now()}`;
  readonly shell = "browser";
  readonly pane: HTMLElement;
  cwd: string;
  url = "";
  title = "";
  loading = false;

  readonly busy = false;
  readonly waiting = false;
  attention = false;
  readonly exited = false;
  readonly exitCode = 0;
  readonly ptyId = null;
  private customName: string | null;
  private readonly bar: HTMLElement;
  private readonly view: HTMLElement;
  private readonly input: HTMLInputElement;
  private readonly start: HTMLElement;
  private visible = false;

  private created = false;

  private ready = false;
  private disposed = false;

  private snapshot: string | null = null;
  private lastBounds = "";
  private lastVisible: boolean | null = null;

  constructor(
    init: SessionInit,
    stage: HTMLElement,
    private readonly host: BrowserHost,
    private readonly hooks: BrowserHooks,
  ) {
    this.cwd = init.cwd;
    this.customName = init.name ?? null;
    this.pane = document.createElement("div");
    this.pane.className = "pane browser-pane";
    this.pane.innerHTML = `
      <div class="browser-bar">
        <button class="icon-btn" data-act="back" title="${t("Atrás", "Back")} (Alt+←)">${icons.arrowLeft}</button>
        <button class="icon-btn" data-act="forward" title="${t("Adelante", "Forward")} (Alt+→)">${icons.arrowRight}</button>
        <button class="icon-btn" data-act="reload" title="${t("Recargar", "Reload")} (Ctrl+R)">${icons.refresh}</button>
        <form class="browser-address">
          <span class="browser-site">${icons.globe}</span>
          <input type="text" spellcheck="false" autocomplete="off" placeholder="${t("Escribí una dirección o buscá", "Type an address or search")}">
        </form>
        <button class="icon-btn" data-act="external" title="${t("Abrir en tu navegador", "Open in your browser")}">${icons.external}</button>
        <button class="icon-btn" data-act="close" title="${t("Cerrar", "Close")} (Ctrl+W)">${icons.close}</button>
        <span class="browser-mini" aria-hidden="true">Beauty Browser</span>
      </div>
      <div class="browser-view"><div class="browser-start"></div></div>`;
    this.bar = this.pane.querySelector<HTMLElement>(".browser-bar")!;
    this.view = this.pane.querySelector<HTMLElement>(".browser-view")!;
    this.input = this.pane.querySelector<HTMLInputElement>("input")!;
    this.start = this.pane.querySelector<HTMLElement>(".browser-start")!;
    stage.append(this.pane);
    host.register(this);
    this.wire();
    new ResizeObserver(() => this.sync()).observe(this.view);
    if (init.browser) this.navigate(init.browser);
    else this.renderStart();
  }

  get label(): string {
    return this.customName || this.title || hostOf(this.url) || t("Navegador", "Browser");
  }

  get canChangeDirectory() {
    return true;
  }

  changeDirectory(dir: string) {
    this.cwd = dir;
    this.hooks.changed();
    return true;
  }

  private wire() {
    this.pane.querySelector("form")!.addEventListener("submit", (e) => {
      e.preventDefault();
      const url = normalizeUrl(this.input.value);
      if (url) this.navigate(url);
    });
    this.input.addEventListener("focus", () => this.input.select());
    this.input.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.input.value = this.url;
        this.input.blur();
      }
    });
    this.bar.addEventListener("click", (e) => {
      const act = (e.target as HTMLElement).closest<HTMLElement>("[data-act]")?.dataset.act;
      if (act === "back") this.history(-1);
      else if (act === "forward") this.history(1);
      else if (act === "reload") this.reload();
      else if (act === "external" && this.url) openUrl(this.url).catch(() => {});
      else if (act === "close") this.hooks.onClose(this);
    });

    this.bar.addEventListener("pointerdown", (e) => {
      if (e.button !== 0 || (e.target as HTMLElement).closest("button, input")) return;
      this.hooks.onHeadDrag(this, e, this.bar);
    });
    this.pane.addEventListener("mousedown", () => this.hooks.onFocus(this));
    this.pane.addEventListener("focusin", () => this.hooks.onFocus(this));
    this.view.addEventListener("click", (e) => {
      const go = (e.target as HTMLElement).closest<HTMLElement>("[data-go]")?.dataset.go;
      if (go) this.navigate(go);
    });

    this.view.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = (e.target as HTMLElement).querySelector("input");
      const url = input && normalizeUrl(input.value);
      if (url) this.navigate(url);
    });
  }

  private renderStart() {
    const found = this.hooks.suggestions();
    this.start.innerHTML = `
      <div class="browser-brand">
        <h2>Beauty Browser</h2>
      </div>
      <form class="browser-search">
        <span class="browser-search-icon">${icons.search}</span>
        <input type="text" spellcheck="false" autocomplete="off" placeholder="${t("Buscá en Google o escribí una dirección", "Search Google or type an address")}">
      </form>
      ${
        found.length
          ? `<div class="browser-local">
              <span class="browser-local-title">${t("En tus terminales", "In your terminals")}</span>
              <div class="browser-chips">${found.map((u) => `<button class="browser-chip" data-go="${esc(u)}">${esc(hostOf(u))}</button>`).join("")}</div>
            </div>`
          : ""
      }`;
    this.start.hidden = false;
  }

  private showError(message: string) {
    this.start.innerHTML = `<span class="browser-start-icon">${icons.globe}</span><b>${t("No se pudo abrir la página", "Couldn't open the page")}</b><p>${esc(message)}</p>`;
    this.start.hidden = false;
  }

  event(kind: string, value: string) {
    if (kind === "open") return this.hooks.openTab(value);
    if (kind === "title") this.title = value;
    if (kind === "loading") this.loading = true;
    if (kind === "loaded") this.loading = false;
    if (kind === "url" || kind === "loaded") this.setUrl(value);
    this.paint();
    this.hooks.changed();
  }

  private setUrl(url: string) {
    this.url = url;
    if (document.activeElement !== this.input) this.input.value = url;
  }

  private paint() {
    this.pane.classList.toggle("loading", this.loading);
    this.pane.querySelector<HTMLElement>(".browser-site")!.innerHTML = this.loading ? icons.spinner : icons.globe;
    this.pane.querySelector<HTMLElement>(".browser-mini")!.textContent = this.url ? hostOf(this.url) : "Beauty Browser";
  }

  navigate(url: string) {
    this.setUrl(url);
    this.input.blur();
    this.loading = true;
    this.paint();
    this.start.hidden = true;
    if (this.created) invoke("browser_navigate", { label: this.viewId, url }).catch(() => {});

    this.sync();
    this.hooks.changed();
  }

  history(step: number) {
    if (this.created) invoke("browser_history", { label: this.viewId, step }).catch(() => {});
  }

  reload() {
    if (this.created) invoke("browser_reload", { label: this.viewId }).catch(() => {});
  }

  focusAddress() {
    this.input.focus();
  }

  place(rect: Rect, visible: boolean) {
    Object.assign(this.pane.style, {
      left: `${rect.x}px`,
      top: `${rect.y}px`,
      width: `${rect.w}px`,
      height: `${rect.h}px`,
    });
    this.pane.classList.toggle("top-edge", rect.y === 0);
    this.pane.classList.toggle("left-edge", rect.x === 0);
    this.pane.classList.toggle("visible", visible);
    if (visible) this.attention = false;
    this.visible = visible;
    this.sync();
  }

  setFocused(on: boolean) {
    this.pane.classList.toggle("focused", on);
  }

  focus() {
    if (!this.url) requestAnimationFrame(() => (this.start.querySelector("input") ?? this.input).focus());
    else if (this.created) invoke("browser_focus", { label: this.viewId }).catch(() => {});
  }

  rename(name: string | null) {
    this.customName = name;
    this.hooks.changed();
  }

  serialize(): SessionInit {
    return { shell: "browser", cwd: this.cwd, name: this.customName, browser: this.url || null };
  }

  dispose() {
    this.disposed = true;
    this.host.unregister(this);

    if (this.ready) invoke("browser_close", { label: this.viewId }).catch(() => {});
    this.setSnapshot(null);
    this.pane.remove();
  }

  sync() {
    if (!this.url) return;
    const r = this.view.getBoundingClientRect();
    const visible = this.visible && !this.host.covered && r.left >= this.host.coveredUntilX && r.width > 0 && r.height > 0;
    const bounds = { x: r.left, y: r.top, width: r.width, height: r.height };
    const key = `${bounds.x},${bounds.y},${bounds.width},${bounds.height}`;
    if (!this.created) {
      if (!visible) return;
      this.created = true;
      this.lastBounds = key;
      this.lastVisible = true;
      invoke("browser_open", { label: this.viewId, url: this.url, ...bounds })
        .then(() => {
          this.ready = true;
          if (this.disposed) invoke("browser_close", { label: this.viewId }).catch(() => {});

          else this.sync();
        })
        .catch((e) => {
          this.created = false;
          this.loading = false;
          this.paint();
          this.showError(String(e));
        });
      return;
    }
    if (!this.ready || this.disposed) return;
    if (visible && key !== this.lastBounds) {
      this.lastBounds = key;
      invoke("browser_bounds", { label: this.viewId, ...bounds }).catch(() => {});
    }
    if (visible !== this.lastVisible) {
      this.lastVisible = visible;
      invoke("browser_visible", { label: this.viewId, visible })

        .then(() => visible && this.setSnapshot(null))
        .catch(() => {});
    }
  }

  shownLeftOf(x: number): boolean {
    return this.ready && this.lastVisible === true && this.view.getBoundingClientRect().left < x;
  }

  async freeze() {
    try {
      const jpeg = await invoke<ArrayBuffer>("browser_snapshot", { label: this.viewId });
      this.setSnapshot(URL.createObjectURL(new Blob([jpeg], { type: "image/jpeg" })));
    } catch {
    }
  }

  private setSnapshot(url: string | null) {
    if (this.snapshot) URL.revokeObjectURL(this.snapshot);
    this.snapshot = url;
    this.view.style.backgroundImage = url ? `url("${url}")` : "";
  }

  async read(maxChars: number): Promise<string> {
    if (!this.created) return t(`"${this.label}" todavía no cargó ninguna página.`, `"${this.label}" hasn't loaded a page yet.`);
    const raw = await invoke<string>("browser_read", { label: this.viewId });

    let data: { title: string; url: string; text: string };
    try {
      const once = JSON.parse(raw);
      data = typeof once === "string" ? JSON.parse(once) : once;
    } catch {
      return raw.slice(0, maxChars);
    }
    const text = data.text.replace(/\n{3,}/g, "\n\n").trim();
    const cut = text.length > maxChars ? `${text.slice(0, maxChars)}\n… (${t(`${text.length - maxChars} caracteres más`, `${text.length - maxChars} more characters`)})` : text;
    return `${data.title}\n${data.url}\n\n${cut}`;
  }
}
