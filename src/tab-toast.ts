import { icons } from "./icons";
import { esc } from "./settings";
import { t } from "./lang";

const VISIBLE_MS = 1600;
const LEAVE_MS = 200;

let el: HTMLElement | null = null;
let hideTimer = 0;
let removeTimer = 0;

export function showTabToast(folder: string, path: string, label: string, index: number, total: number) {
  clearTimeout(hideTimer);
  clearTimeout(removeTimer);
  if (!el) {
    el = document.createElement("div");
    el.className = "tab-toast glass";
    el.setAttribute("role", "status");
    el.setAttribute("aria-live", "polite");
    document.body.append(el);
  }
  const toast = el;
  toast.innerHTML = `
    <span class="tt-icon">${icons.folder}</span>
    <span class="tt-folder" title="${esc(path)}">${esc(folder)}</span>
    <span class="tt-sep" aria-hidden="true"></span>
    <span class="tt-tab">${esc(label)}</span>
    <span class="tt-pos">${t(`${index} de ${total}`, `${index} of ${total}`)}</span>`;
  toast.classList.remove("leaving");
  toast.classList.add("shown");
  hideTimer = window.setTimeout(() => {
    toast.classList.add("leaving");
    removeTimer = window.setTimeout(() => toast.classList.remove("shown", "leaving"), LEAVE_MS);
  }, VISIBLE_MS);
}
