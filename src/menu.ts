import { icons } from "./icons";
import { esc } from "./settings";

export interface MenuItem {
  label: string;
  hint?: string;
  danger?: boolean;

  checked?: boolean;

  style?: string;
  action: () => void;
}

export type MenuEntry = MenuItem | "sep";

const el = document.getElementById("menu")!;
let items: MenuItem[] = [];

export const isMenuOpen = () => !el.hidden;

export function hideMenu() {
  el.hidden = true;
}

export function showMenu(x: number, y: number, entries: MenuEntry[], minWidth = 0) {
  items = [];
  el.style.minWidth = minWidth ? `${minWidth}px` : "";
  el.innerHTML = entries
    .map((entry) => {
      if (entry === "sep") return `<div class="menu-sep"></div>`;
      items.push(entry);
      return `<div class="menu-item ${entry.danger ? "danger" : ""}" data-i="${items.length - 1}">
        <span${entry.style ? ` style="${esc(entry.style)}"` : ""}>${esc(entry.label)}</span>${entry.hint ? `<span class="hint">${esc(entry.hint)}</span>` : ""}${entry.checked ? `<span class="menu-check">${icons.check}</span>` : ""}</div>`;
    })
    .join("");
  el.hidden = false;
  const { width, height } = el.getBoundingClientRect();
  el.style.left = `${Math.min(x, innerWidth - width - 8)}px`;
  el.style.top = `${Math.min(y, innerHeight - height - 8)}px`;
}

el.addEventListener("click", (e) => {
  const row = (e.target as HTMLElement).closest<HTMLElement>(".menu-item");
  if (!row) return;
  hideMenu();
  items[Number(row.dataset.i)]?.action();
});

document.addEventListener("mousedown", (e) => {
  if (!el.contains(e.target as Node)) hideMenu();
});
window.addEventListener("blur", hideMenu);
