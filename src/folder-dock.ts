import { icons } from "./icons";
import { folderName } from "./session";
import { esc } from "./settings";
import { t } from "./lang";

export class FolderDock {
  private hideTimer = 0;

  constructor(private readonly el: HTMLElement) {}

  show(dirs: string[], here: string[], movable: boolean, detachable: boolean) {
    clearTimeout(this.hideTimer);
    if (!movable && !detachable) return this.hide();
    const key = (path: string) => path.replace(/\\/g, "/").replace(/\/+$/, "").toLowerCase();
    const current = new Set(here.map(key));
    const cards = dirs
      .map((dir) => {
        const isHere = current.size === 1 && current.has(key(dir));
        const off = !movable || isHere;
        return `
        <div class="dock-card ${off ? "off" : ""}" ${off ? "" : `data-drop-dir="${esc(dir)}"`} title="${esc(dir)}">
          <span class="dock-icon">${icons.folder}</span>
          <span class="dock-text">
            <b>${esc(folderName(dir))}</b>
            <span>${isHere ? t("Ya está acá", "Already here") : esc(dir)}</span>
          </span>
        </div>`;
      })
      .join("");
    const pick = `
      <div class="dock-card dock-pick ${movable ? "" : "off"}" ${movable ? "data-drop-pick" : ""}>
        <span class="dock-icon">${icons.plus}</span>
        <span class="dock-text"><b>${t("Otra carpeta…", "Another folder…")}</b><span>${t("Elegirla al soltar", "Pick it on drop")}</span></span>
      </div>`;
    const detach = detachable
      ? `
      <div class="dock-card dock-detach" data-drop-detach>
        <span class="dock-icon">${icons.expand}</span>
        <span class="dock-text"><b>${t("Pestaña nueva", "New tab")}</b><span>${t("Sacarla de la división", "Take it out of the split")}</span></span>
      </div>`
      : "";
    const head = movable
      ? detachable
        ? t("Separala o movela a otra carpeta", "Detach it or move it to another folder")
        : t("Soltala en una carpeta para moverla", "Drop it on a folder to move it")
      : t("Ocupada: se puede separar, pero no cambiar de carpeta", "Busy: it can be detached, but not moved to another folder");
    this.el.innerHTML = `
      <div class="dock-head">${head}</div>
      <div class="dock-cards">${detach}${cards}${pick}</div>`;
    this.el.hidden = false;
    this.el.classList.remove("leaving");
  }

  hide() {
    if (this.el.hidden) return;
    this.el.classList.add("leaving");
    clearTimeout(this.hideTimer);
    this.hideTimer = window.setTimeout(() => {
      this.el.hidden = true;
      this.el.classList.remove("leaving");
    }, 150);
  }

  get visible() {
    return !this.el.hidden && !this.el.classList.contains("leaving");
  }

  highlight(card: HTMLElement | null) {
    this.el.querySelectorAll(".dock-card.drop-target").forEach((c) => c.classList.remove("drop-target"));
    card?.classList.add("drop-target");
  }
}
