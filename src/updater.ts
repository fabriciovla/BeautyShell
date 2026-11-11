import { relaunch } from "@tauri-apps/plugin-process";
import { check, type Update } from "@tauri-apps/plugin-updater";
import { t } from "./lang";
import { IS_WINDOWS } from "./platform";

export const STORE_DISTRIBUTION = import.meta.env.VITE_DISTRIBUTION === "store";

export const SELF_UPDATES = !STORE_DISTRIBUTION && IS_WINDOWS;

export type UpdateStatus = "idle" | "checking" | "downloading" | "ready" | "latest" | "error";

export interface UpdateState {
  status: UpdateStatus;

  version?: string;
  error?: string;
}

let state: UpdateState = { status: "idle" };
let pending: Update | null = null;
const listeners = new Set<() => void>();

export const updateState = () => state;

export function onUpdateChange(fn: () => void) {
  listeners.add(fn);
}

function set(next: UpdateState) {
  state = next;
  listeners.forEach((fn) => fn());
  renderNotice();
}

export async function checkForUpdates() {
  if (state.status === "checking" || state.status === "downloading" || state.status === "ready") return;
  set({ status: "checking" });
  try {
    const update = await check();
    if (!update) return set({ status: "latest" });
    set({ status: "downloading", version: update.version });
    await update.download();
    pending = update;
    set({ status: "ready", version: update.version });
  } catch (e) {
    set({ status: "error", error: String(e) });
  }
}

export async function installAndRestart() {
  if (!pending) return;
  try {
    await pending.install();
    await relaunch();
  } catch (e) {
    set({ status: "error", version: state.version, error: String(e) });
  }
}

const HOURS = 3600 * 1000;

export function startUpdateChecks() {
  if (import.meta.env.DEV || !SELF_UPDATES) return;
  window.setTimeout(() => void checkForUpdates(), 8000);
  window.setInterval(() => void checkForUpdates(), 6 * HOURS);
}

let dismissed = false;

function renderNotice() {
  let el = document.getElementById("aviso-actualizacion");
  if (state.status !== "ready" || dismissed) {
    el?.remove();
    return;
  }
  if (el) return;
  el = document.createElement("div");
  el.id = "aviso-actualizacion";
  el.className = "glass";
  el.setAttribute("role", "status");
  el.innerHTML = `
    <span class="act-text"><b>Beauty Shell ${state.version}</b> ${t("está lista", "is ready")}</span>
    <button class="act-restart" title="${t("Se cierran las terminales; las pestañas vuelven al abrir", "The terminals close; the tabs come back when it opens")}">${t("Reiniciar", "Restart")}</button>
    <button class="act-close" aria-label="${t("Después", "Later")}" title="${t("Después", "Later")}">×</button>`;
  el.querySelector(".act-restart")!.addEventListener("click", () => void installAndRestart());
  el.querySelector(".act-close")!.addEventListener("click", () => {
    dismissed = true;
    renderNotice();
  });
  document.body.append(el);
}
