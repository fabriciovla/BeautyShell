import { BrowserPane, hostOf } from "./browser";
import { icons } from "./icons";
import { sessionsOf, type Pane, type Tab } from "./layout";
import { folderName, Session } from "./session";
import { esc } from "./settings";
import { t } from "./lang";

export interface Group {
  dir: string;
  tabs: Tab[];
}

export type DragItem = { kind: "tab"; tab: Tab } | { kind: "pane"; session: Pane };

export interface SidebarHandlers {
  activateTab(tab: Tab): void;
  focusPane(session: Pane): void;
  closeTab(tab: Tab): void;
  closePane(session: Pane): void;
  rename(session: Pane, name: string | null): void;
  newIn(dir: string): void;
  tabMenu(tab: Tab, x: number, y: number): void;
  paneMenu(session: Pane, x: number, y: number): void;
  dragStart(item: DragItem, label: string, event: PointerEvent, el: HTMLElement): void;
  wasDragging(): boolean;
}

export function tabIcon(tab: Tab, panes: Pane[]): string {
  if (panes.some((p) => p.busy || (p instanceof BrowserPane && p.loading))) return icons.spinner;
  if (panes.length > 1) return icons.split;
  if (tab.focus instanceof BrowserPane) return icons.globe;
  return tab.focus instanceof Session ? (tab.focus.agent?.icon ?? icons.terminal) : icons.terminal;
}

export function groupTabs(tabs: Tab[]): Group[] {
  const groups = new Map<string, Group>();
  for (const tab of tabs) {
    const key = tab.focus.cwd.toLowerCase();
    if (!groups.has(key)) groups.set(key, { dir: tab.focus.cwd, tabs: [] });
    groups.get(key)!.tabs.push(tab);
  }
  return [...groups.values()];
}

function tabStatus(tab: Tab, panes: Pane[]): string {
  const focus = tab.focus;
  const parts: string[] = [];
  if (panes.some((p) => p.busy)) parts.push(t("trabajando…", "working…"));
  else if (panes.some((p) => p.waiting)) parts.push(t("esperando respuesta", "waiting for a reply"));
  else if (focus.exited) parts.push(t(`terminó · código ${focus.exitCode}`, `exited · code ${focus.exitCode}`));
  else if (panes.some((p) => p.attention)) parts.push(t("actividad nueva", "new activity"));
  else if (focus instanceof BrowserPane && focus.url) parts.push(hostOf(focus.url));
  if (tab.broadcast) parts.push(t("escribe en todos", "types in all"));
  if (panes.length > 1) parts.push(t(`${panes.length} paneles`, `${panes.length} panes`));
  return parts.join(" · ");
}

export class Sidebar {
  private tabs: Tab[] = [];
  private active: Tab | null = null;
  private renaming = false;
  private readonly collapsed = new Set<string>();

  private drawnActive: Tab | null = null;

  frozen = false;

  private lastHtml = "";

  private readonly born = new Map<number, number>();
  private drawn = false;

  private readonly marker = Object.assign(document.createElement("span"), { className: "tab-marker" });

  private markerAt: { dir: string; y: number; h: number } | null = null;

  constructor(
    private readonly el: HTMLElement,
    private readonly on: SidebarHandlers,
  ) {
    el.addEventListener("click", (e) => {
      if (this.on.wasDragging()) return;
      const target = e.target as HTMLElement;
      if (target.closest("input")) return;
      const newIn = target.closest<HTMLElement>("[data-new-in]");
      if (newIn) return this.on.newIn(newIn.dataset.newIn!);
      const head = target.closest<HTMLElement>(".group-head");
      if (head) return this.toggleGroup(head.dataset.group!);
      const pane = this.paneAt(target);
      if (pane) return target.closest("[data-close]") ? this.on.closePane(pane) : this.on.focusPane(pane);
      const tab = this.tabAt(target);
      if (tab) return target.closest("[data-close]") ? this.on.closeTab(tab) : this.on.activateTab(tab);
    });
    el.addEventListener("auxclick", (e) => {
      if (e.button !== 1) return;
      const target = e.target as HTMLElement;
      const pane = this.paneAt(target);
      if (pane) return this.on.closePane(pane);
      const tab = this.tabAt(target);
      if (tab) this.on.closeTab(tab);
    });
    el.addEventListener("dblclick", (e) => {
      const target = e.target as HTMLElement;

      if (target === this.el) return this.on.newIn("");
      const session = this.paneAt(target) ?? this.tabAt(target)?.focus;
      if (session) this.startRename(session);
    });
    el.addEventListener("contextmenu", (e) => {
      const target = e.target as HTMLElement;
      const pane = this.paneAt(target);
      const tab = this.tabAt(target);
      if (!pane && !tab) return;
      e.preventDefault();
      if (pane) this.on.paneMenu(pane, e.clientX, e.clientY);
      else this.on.tabMenu(tab!, e.clientX, e.clientY);
    });
    el.addEventListener("pointerdown", (e) => {
      const target = e.target as HTMLElement;
      if (e.button !== 0 || target.closest("button, input")) return;
      const paneRow = target.closest<HTMLElement>(".pane-row");
      const tabRow = target.closest<HTMLElement>(".tab");
      const pane = this.paneAt(target);
      if (pane && paneRow) return this.on.dragStart({ kind: "pane", session: pane }, pane.label, e, paneRow);
      const tab = this.tabAt(target);
      if (tab && tabRow) this.on.dragStart({ kind: "tab", tab }, tab.focus.label, e, tabRow);
    });
  }

  private tabAt(target: HTMLElement): Tab | undefined {
    const id = Number(target.closest<HTMLElement>("[data-tab]")?.dataset.tab);
    return this.tabs.find((t) => t.id === id);
  }

  private paneAt(target: HTMLElement): Pane | undefined {
    const uid = Number(target.closest<HTMLElement>("[data-uid]")?.dataset.uid);
    if (!uid) return undefined;
    return this.tabs.flatMap((t) => sessionsOf(t.root)).find((s) => s.uid === uid);
  }

  private toggleGroup(dir: string) {
    const key = dir.toLowerCase();
    const collapse = !this.collapsed.has(key);
    if (collapse) this.collapsed.add(key);
    else this.collapsed.delete(key);

    [...this.el.querySelectorAll<HTMLElement>(".group")]
      .find((group) => group.dataset.dir?.toLowerCase() === key)
      ?.classList.toggle("collapsed", collapse);
    this.lastHtml = this.html();
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
      if (age >= 180) continue;

      const row = this.el.querySelector<HTMLElement>(`.tab[data-tab="${id}"]`);
      row?.classList.add("entering");
      row?.style.setProperty("animation-delay", `${-age}ms`);
    }
  }

  render(tabs: Tab[], active: Tab | null) {
    this.tabs = tabs;
    this.active = active;
    if (this.renaming || this.frozen) return;
    if (active !== this.drawnActive && active) {
      const group = groupTabs(tabs).find((g) => g.tabs.includes(active));
      if (group) this.collapsed.delete(group.dir.toLowerCase());
    }
    this.drawnActive = active;
    const html = this.html();
    if (html === this.lastHtml) return;
    this.lastHtml = html;
    this.el.innerHTML = html;
    this.animateEntrances();
    this.placeMarker();
  }

  private placeMarker() {
    const marker = this.marker;
    const row = this.el.querySelector<HTMLElement>(".tab.active");
    const items = row?.parentElement;
    if (!row || !items) {
      marker.remove();
      this.markerAt = null;
      return;
    }
    const dir = items.closest<HTMLElement>(".group")!.dataset.dir!;
    const to = { dir, y: row.offsetTop, h: row.offsetHeight };
    const from = this.markerAt?.dir === dir ? this.markerAt : to;
    marker.classList.add("still");
    marker.style.setProperty("--y", `${from.y}px`);
    marker.style.setProperty("--h", `${from.h}px`);
    items.prepend(marker);
    void marker.offsetWidth;
    marker.classList.remove("still");
    marker.style.setProperty("--y", `${to.y}px`);
    marker.style.setProperty("--h", `${to.h}px`);
    this.markerAt = to;
  }

  private html(): string {
    let index = 0;
    return groupTabs(this.tabs)
      .map((group) => {
        const collapsed = this.collapsed.has(group.dir.toLowerCase());
        const rows = group.tabs.map((tab) => this.tabRow(tab, index++)).join("");
        return `
        <section class="group ${collapsed ? "collapsed" : ""}" data-dir="${esc(group.dir)}">
          <header class="group-head" data-group="${esc(group.dir)}" title="${esc(group.dir)}">
            <span class="group-icon"><span class="group-folder">${icons.folder}</span><span class="group-chev">${icons.chevron}</span></span>
            <span class="group-name">${esc(folderName(group.dir))}</span>
            <span class="group-count">${group.tabs.length}</span>
            <button class="icon-btn" data-new-in="${esc(group.dir)}" title="${t("Nueva terminal en esta carpeta", "New terminal in this folder")}">${icons.plus}</button>
          </header>
          <div class="group-items">${rows}</div>
        </section>`;
      })
      .join("");
  }

  private tabRow(tab: Tab, index: number): string {
    const panes = sessionsOf(tab.root);
    const isActive = tab === this.active;
    const busy = panes.some((p) => p.busy);
    const waiting = !busy && panes.some((p) => p.waiting);
    const attention = !isActive && panes.some((p) => p.attention);
    const classes = [
      "tab",
      isActive && "active",
      busy && "busy",
      waiting && "waiting",
      attention && "attention",
      tab.focus.exited && "exited",
    ]
      .filter(Boolean)
      .join(" ");
    const icon = tabIcon(tab, panes);
    const status = tabStatus(tab, panes);
    const key = index < 9 ? `<span class="tab-key">${index + 1}</span>` : "";

    const paneList =
      panes.length > 1
        ? `<div class="pane-list">${panes.map((p) => this.paneRow(p, isActive && p === tab.focus)).join("")}</div>`
        : "";
    return `
      <div class="${classes}" data-tab="${tab.id}" title="${esc(tab.focus.cwd)}">
        <span class="tab-icon">${icon}<i class="dot"></i></span>
        <span class="tab-text">
          <span class="tab-title">${esc(tab.focus.label)}</span>
          ${status ? `<span class="tab-sub">${esc(status)}</span>` : ""}
        </span>
        ${key}
        <button class="icon-btn close" data-close title="${t("Cerrar pestaña", "Close tab")} (Ctrl+Shift+W)">${icons.close}</button>
      </div>${paneList}`;
  }

  private paneRow(session: Pane, focused: boolean): string {
    const classes = [
      "pane-row",
      focused && "focused",
      session.busy && "busy",
      !session.busy && session.waiting && "waiting",
      session.exited && "exited",
    ]
      .filter(Boolean)
      .join(" ");
    return `
      <div class="${classes}" data-uid="${session.uid}" title="${t("Arrastrá para mover o separar este panel", "Drag to move or detach this pane")}">
        <span class="pane-mark">${session.busy ? icons.spinner : ""}</span>
        <span class="pane-title">${esc(session.label)}</span>
        <button class="icon-btn close" data-close title="${t("Cerrar panel", "Close pane")} (Ctrl+W)">${icons.close}</button>
      </div>`;
  }

  startRename(session: Pane) {
    const label =
      this.el.querySelector<HTMLElement>(`.pane-row[data-uid="${session.uid}"] .pane-title`) ??
      this.el.querySelector<HTMLElement>(
        `.tab[data-tab="${this.tabs.find((t) => t.focus === session)?.id}"] .tab-title`,
      );
    if (!label) return;
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
  }
}
