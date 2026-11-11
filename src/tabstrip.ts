import { BrowserPane } from "./browser";
import { icons } from "./icons";
import { sessionsOf, type Pane, type Tab } from "./layout";
import { esc } from "./settings";
import { tabIcon, type SidebarHandlers } from "./sidebar";
import { t } from "./lang";

export type StripHandlers = Pick<
  SidebarHandlers,
  "activateTab" | "closeTab" | "rename" | "tabMenu" | "dragStart" | "wasDragging"
> & {
  newTab(): void;
  newMenu(x: number, y: number): void;
  openSettings(): void;
  toggleSettings(): void;
  closeSettings(): void;
};

export class TabStrip {
  private tabs: Tab[] = [];
  private active: Tab | null = null;
  private renaming = false;

  frozen = false;
  private lastHtml = "";

  private readonly born = new Map<number, number>();
  private drawn = false;
  private readonly list: HTMLElement;
  readonly caret: HTMLElement;

  constructor(
    private readonly el: HTMLElement,
    private readonly on: StripHandlers,
  ) {
    el.innerHTML = `
      <div class="ts-list"></div>
      <button class="ts-btn ts-new" title="${t("Nueva terminal (Ctrl+T) · clic derecho para elegir shell o carpeta", "New terminal (Ctrl+T) · right-click to pick a shell or folder")}">${icons.plus}</button>
      <div class="ts-fill" data-tauri-drag-region></div>
      <button class="ts-btn ts-gear" title="${t("Ajustes", "Settings")} (Ctrl+,)">${icons.gear}</button>
      <i class="ts-caret" aria-hidden="true"></i>`;
    this.list = el.querySelector<HTMLElement>(".ts-list")!;
    this.caret = el.querySelector<HTMLElement>(".ts-caret")!;
    const btnNew = el.querySelector<HTMLElement>(".ts-new")!;
    btnNew.addEventListener("click", () => this.on.newTab());
    btnNew.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      this.on.newMenu(e.clientX, e.clientY);
    });
    el.querySelector(".ts-gear")!.addEventListener("click", () => this.on.toggleSettings());
    this.list.addEventListener("click", (e) => {
      if (this.on.wasDragging()) return;
      const target = e.target as HTMLElement;
      if (target.closest("input")) return;
      if (target.closest("[data-settings-tab]")) {
        return target.closest("[data-close]") ? this.on.closeSettings() : this.on.openSettings();
      }
      const tab = this.tabAt(target);
      if (tab) return target.closest("[data-close]") ? this.on.closeTab(tab) : this.on.activateTab(tab);
    });

    this.list.addEventListener("auxclick", (e) => {
      if (e.button !== 1) return;
      const target = e.target as HTMLElement;
      if (target.closest("[data-settings-tab]")) return this.on.closeSettings();
      const tab = this.tabAt(target);
      if (tab) this.on.closeTab(tab);
    });
    this.list.addEventListener("mousedown", (e) => {
      if (e.button === 1) e.preventDefault();
    });
    this.list.addEventListener("dblclick", (e) => {
      const target = e.target as HTMLElement;
      if (target.closest("[data-settings-tab]")) return;
      const tab = this.tabAt(target);
      if (tab) this.startRename(tab.focus);
    });
    this.list.addEventListener("contextmenu", (e) => {
      const target = e.target as HTMLElement;
      if (target.closest("[data-settings-tab]")) return;
      const tab = this.tabAt(target);
      if (!tab) return;
      e.preventDefault();
      this.on.tabMenu(tab, e.clientX, e.clientY);
    });
    this.list.addEventListener("pointerdown", (e) => {
      const target = e.target as HTMLElement;
      if (e.button !== 0 || target.closest("button, input")) return;
      const row = target.closest<HTMLElement>(".htab");
      const tab = this.tabAt(target);
      if (tab && row) this.on.dragStart({ kind: "tab", tab }, tab.focus.label, e, row);
    });

    this.list.addEventListener(
      "wheel",
      (e) => {
        if (this.list.scrollWidth <= this.list.clientWidth) return;
        this.list.scrollLeft += e.deltaY + e.deltaX;
        e.preventDefault();
      },
      { passive: false },
    );
  }

  private tabAt(target: HTMLElement): Tab | undefined {
    const id = Number(target.closest<HTMLElement>("[data-tab]")?.dataset.tab);
    return this.tabs.find((t) => t.id === id);
  }

  render(tabs: Tab[], active: Tab | null, settingsOpen = false) {
    this.tabs = tabs;
    this.active = settingsOpen ? null : active;
    if (this.renaming || this.frozen) return;
    const html = tabs.map((tab) => this.tabHtml(tab)).join("") + (settingsOpen ? this.settingsTabHtml() : "");
    if (html === this.lastHtml) return;
    this.lastHtml = html;
    this.list.innerHTML = html;
    this.animateEntrances();
    this.list.querySelector(".htab.active")?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }

  private tabHtml(tab: Tab): string {
    const panes = sessionsOf(tab.root);
    const isActive = tab === this.active;
    const busy = panes.some((p) => p.busy);
    const waiting = !busy && panes.some((p) => p.waiting);
    const attention = !isActive && panes.some((p) => p.attention);
    const classes = ["htab", isActive && "active", busy && "busy", waiting && "waiting", attention && "attention", tab.focus.exited && "exited"]
      .filter(Boolean)
      .join(" ");
    const icon = tabIcon(tab, panes);
    const where = tab.focus instanceof BrowserPane ? tab.focus.url : tab.focus.cwd;
    return `
      <div class="${classes}" data-tab="${tab.id}" title="${esc(tab.focus.label)} · ${esc(where)}">
        <span class="htab-icon">${icon}<i class="dot"></i></span>
        <span class="htab-title">${esc(tab.focus.label)}</span>
        <button class="htab-close" data-close title="${t("Cerrar pestaña", "Close tab")} (Ctrl+Shift+W)">${icons.close}</button>
      </div>`;
  }

  private settingsTabHtml(): string {
    return `
      <div class="htab settings-tab active" data-settings-tab title="${t("Ajustes", "Settings")}">
        <span class="htab-icon">${icons.gear}</span>
        <span class="htab-title">${t("Ajustes", "Settings")}</span>
        <button class="htab-close" data-close title="${t("Cerrar ajustes", "Close settings")} (Esc)">${icons.close}</button>
      </div>`;
  }

  private animateEntrances() {
    const now = performance.now();
    const first = this.born.size === 0 && !this.drawn;
    this.drawn = true;
    for (const tab of this.tabs) if (!this.born.has(tab.id)) this.born.set(tab.id, first ? -Infinity : now);
    for (const [id, at] of this.born) {
      if (!this.tabs.some((t) => t.id === id)) {
        this.born.delete(id);
        continue;
      }
      const age = now - at;
      if (age >= 300) continue;
      const row = this.list.querySelector<HTMLElement>(`.htab[data-tab="${id}"]`);
      row?.classList.add("entering");
      row?.style.setProperty("animation-delay", `${-age}ms`);
    }
  }

  orderTarget(x: number, y: number, dragged: Tab): { tab: Tab; after: boolean } | null {
    const r = this.list.getBoundingClientRect();
    if (y < r.top || y > r.bottom || x < r.left || x > r.right) return null;
    const rows = [...this.list.querySelectorAll<HTMLElement>(".htab[data-tab]")]
      .map((el) => ({ el, tab: this.tabAt(el)! }))
      .filter(({ tab }) => tab);
    if (rows.length < 2) return null;
    let best: { tab: Tab; after: boolean; d: number } | null = null;
    for (const { el, tab } of rows) {
      const b = el.getBoundingClientRect();
      const mid = b.left + b.width / 2;
      const d = Math.abs(x - mid);
      if (!best || d < best.d) best = { tab, after: x > mid, d };
    }
    if (!best || best.tab === dragged) return null;
    return { tab: best.tab, after: best.after };
  }

  showSlot(label: string | null) {
    let slot = this.list.querySelector<HTMLElement>(".ts-slot");
    if (!label) {
      slot?.remove();
      return;
    }
    if (!slot) {
      slot = document.createElement("div");
      slot.className = "htab ts-slot";
      slot.innerHTML = `<span class="htab-icon">${icons.terminal}</span><span class="htab-title"></span>`;
      this.list.append(slot);
      slot.scrollIntoView({ block: "nearest", inline: "nearest" });
    }
    slot.querySelector(".htab-title")!.textContent = label;
  }

  slotCenter(): { x: number; y: number } | null {
    const r = this.list.querySelector(".ts-slot")?.getBoundingClientRect();
    return r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null;
  }

  showCaret(target: { tab: Tab; after: boolean } | null) {
    const row = target && this.list.querySelector<HTMLElement>(`.htab[data-tab="${target.tab.id}"]`);
    if (!row) {
      this.caret.classList.remove("visible");
      return;
    }
    const r = row.getBoundingClientRect();
    const host = this.el.getBoundingClientRect();
    this.caret.style.left = `${(target.after ? r.right + 1 : r.left - 1) - host.left}px`;
    this.caret.classList.add("visible");
  }

  centerOf(tab: Tab): { x: number; y: number } | null {
    const r = this.list.querySelector<HTMLElement>(`.htab[data-tab="${tab.id}"]`)?.getBoundingClientRect();
    return r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null;
  }

  startRename(session: Pane) {
    const tab = this.tabs.find((t) => t.focus === session);
    const label = tab && this.list.querySelector<HTMLElement>(`.htab[data-tab="${tab.id}"] .htab-title`);
    if (!label) return false;
    this.renaming = true;
    const input = document.createElement("input");
    input.className = "rename";
    input.value = session.label;
    label.replaceWith(input);
    input.focus();
    input.select();

    let done = false;
    const finish = (save: boolean) => {
      if (done) return;
      done = true;
      this.renaming = false;
      this.lastHtml = "";
      if (save) this.on.rename(session, input.value.trim() || null);
      this.render(this.tabs, this.active);
      session.focus();
    };
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") finish(true);
      if (e.key === "Escape") finish(false);
    });
    input.addEventListener("blur", () => finish(true));
    return true;
  }
}
