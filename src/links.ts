import { invoke } from "@tauri-apps/api/core";
import type { ILink, Terminal } from "@xterm/xterm";
import { IS_WINDOWS } from "./platform";

export const isLocalUrl = (uri: string) => /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(:\d+)?([/?#]|$)/i.test(uri);

const PATH = IS_WINDOWS
  ? /((?:[A-Za-z]:[\\/]|~[\\/]|\.{1,2}[\\/])?[\w@+-][\w.@+\-\\/]*)(?::(\d+)(?::(\d+))?|\((\d+),(\d+)\))?/g
  :
    /((?:~\/|\.{1,2}\/|\/)?[\w@+-][\w.@+\-/]*)(?::(\d+)(?::(\d+))?|\((\d+),(\d+)\))?/g;

const plausible = (p: string) => /[\\/]/.test(p) || /\.[A-Za-z]\w{0,7}$/.test(p);

const known = new Map<string, { ok: boolean; at: number }>();
const FRESH_MS = 5000;

async function existing(paths: string[]): Promise<Set<string>> {
  const now = performance.now();
  const ask = paths.filter((p) => {
    const k = known.get(p);
    return !k || now - k.at > FRESH_MS;
  });
  if (ask.length) {
    const found = await invoke<boolean[]>("paths_exist", { paths: ask }).catch(() => ask.map(() => false));
    ask.forEach((p, i) => known.set(p, { ok: found[i], at: now }));
  }
  return new Set(paths.filter((p) => known.get(p)?.ok));
}

function resolvePosix(p: string, cwd: string, home: string): string {
  if (p.startsWith("/")) return p;
  if (p === "~" || p.startsWith("~/")) return home.replace(/\/$/, "") + p.slice(1);
  return `${cwd.replace(/\/$/, "")}/${p.replace(/^\.\//, "")}`;
}

function resolve(path: string, cwd: string, home: string): string {
  if (!IS_WINDOWS) return resolvePosix(path, cwd, home);
  const p = path.replace(/\//g, "\\");
  if (/^[A-Za-z]:\\/.test(p)) return p;
  if (p.startsWith("~\\")) return home + p.slice(1);
  return `${cwd.replace(/\\$/, "")}\\${p.replace(/^\.\\/, "")}`;
}

export function registerFileLinks(term: Terminal, cwd: () => string, home: () => string) {
  term.registerLinkProvider({
    provideLinks(y, callback) {
      const text = term.buffer.active.getLine(y - 1)?.translateToString(true) ?? "";
      const found: { start: number; text: string; path: string; line?: number; col?: number }[] = [];
      for (const m of text.matchAll(PATH)) {
        const before = text[m.index - 1];

        if (before === "/" || before === ":" || before === "\\") continue;
        let raw = m[1];
        let whole = m[0];
        const trimmed = raw.replace(/[.\\/]+$/, "");
        if (trimmed !== raw && whole === raw) whole = trimmed;
        raw = trimmed;
        if (!raw || !plausible(raw)) continue;
        const line = Number(m[2] ?? m[4]) || undefined;
        const col = Number(m[3] ?? m[5]) || undefined;
        found.push({ start: m.index, text: whole, path: resolve(raw, cwd(), home()), line, col });
      }
      if (!found.length) return callback(undefined);
      void existing(found.map((f) => f.path)).then((ok) => {
        const links: ILink[] = found
          .filter((f) => ok.has(f.path))
          .map((f) => ({
            text: f.text,
            range: { start: { x: f.start + 1, y }, end: { x: f.start + f.text.length, y } },
            decorations: { pointerCursor: false, underline: true },
            activate: (event) => {
              if (!event.ctrlKey) return;
              invoke("open_in_editor", { path: f.path, line: f.line ?? null, col: f.col ?? null }).catch(() => {});
            },
          }));
        callback(links.length ? links : undefined);
      });
    },
  });
}
