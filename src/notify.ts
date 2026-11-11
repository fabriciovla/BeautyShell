import { getCurrentWindow, UserAttentionType } from "@tauri-apps/api/window";
import { isPermissionGranted, requestPermission, sendNotification } from "@tauri-apps/plugin-notification";

export const NOTIFY_AFTER_MS = 10_000;

const KEY = "vidrio.notify";

let enabled = (() => {
  try {
    return localStorage.getItem(KEY) !== "off";
  } catch {
    return true;
  }
})();

export const notificationsEnabled = () => enabled;

export function setNotificationsEnabled(on: boolean) {
  enabled = on;
  try {
    localStorage.setItem(KEY, on ? "on" : "off");
  } catch {
  }
}

export function formatDuration(ms: number): string {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s} s`;
  const m = Math.floor(s / 60);
  if (m < 60) return s % 60 ? `${m} min ${s % 60} s` : `${m} min`;
  return `${Math.floor(m / 60)} h ${m % 60} min`;
}

export async function notify(title: string, body: string) {
  if (!enabled) return;
  const win = getCurrentWindow();
  if (await win.isFocused().catch(() => false)) return;
  try {
    let granted = await isPermissionGranted();
    if (!granted) granted = (await requestPermission()) === "granted";
    if (granted) sendNotification({ title, body });
  } catch {
  }
  win.requestUserAttention(UserAttentionType.Informational).catch(() => {});
}
