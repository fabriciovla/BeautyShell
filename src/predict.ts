import { invoke } from "@tauri-apps/api/core";
import { IS_WINDOWS } from "./platform";

interface Entry {
  cmd: string;
  cwd: string;

  shell: string;
  at: number;
  count: number;
}

const KEY = "beauty.history";
const MAX = 3000;

const FRESH_MS = 5000;

const family = (shell: string) => (shell === "powershell" ? "pwsh" : shell);
const sameDir = (a: string, b: string) => a.replace(/[\\/]+$/, "").toLowerCase() === b.replace(/[\\/]+$/, "").toLowerCase();

const CD = /^\s*(?:cd|chdir|sl|set-location|pushd|push-location)(?:\s+-(?:literal)?path)?\s+(['"]?)(.+?)\1\s*$/i;

const CD_TYPING = /^(\s*(?:cd|chdir|sl|set-location|pushd|push-location)(?:\s+-(?:literal)?path)?\s+)(['"]?)([^'"]*)$/i;

const RELATIVE = /(^|\s|['"])\.{1,2}([\\/]|\s|['"]|$)/;

const isAbsolute = (path: string) => /^([a-z]:[\\/]|\\\\|~([\\/]|$))/i.test(path) || (!IS_WINDOWS && path.startsWith("/"));

function local(cmd: string): boolean {
  const target = CD.exec(cmd)?.[2];
  if (target) return !isAbsolute(target) && target !== "-" && target !== "+";
  return RELATIVE.test(cmd);
}

export class Predictor {
  private entries: Entry[] = [];

  private seeds: string[] = [];
  private readonly exists = new Map<string, { ok: boolean; at: number }>();
  private readonly dirs = new Map<string, { names: string[]; at: number }>();
  private readonly asking = new Set<string>();

  constructor(
    private readonly home: () => string,
    private readonly changed: () => void,
  ) {
    try {
      this.entries = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    } catch {
      this.entries = [];
    }
    invoke<string[]>("ps_history")
      .then((lines) => {
        const seen = new Set<string>();
        for (let i = lines.length - 1; i >= 0; i--) {
          const line = lines[i].trim();
          if (line && !seen.has(line)) {
            seen.add(line);
            this.seeds.push(line);
          }
        }
      })
      .catch(() => {});
  }

  record(cmd: string, cwd: string, shell: string, ok: boolean) {
    cmd = cmd.trim();
    if (!ok || !cmd || cmd.includes("\n")) return;
    const sh = family(shell);
    const found = this.entries.find((e) => e.cmd === cmd && e.shell === sh && sameDir(e.cwd, cwd));
    if (found) {
      found.count++;
      found.at = Date.now();
    } else {
      this.entries.push({ cmd, cwd, shell: sh, at: Date.now(), count: 1 });
      if (this.entries.length > MAX) this.entries.splice(0, this.entries.length - MAX);
    }
    try {
      localStorage.setItem(KEY, JSON.stringify(this.entries));
    } catch {
    }
  }

  suggest(typed: string, cwd: string, shell: string): string {
    if (!typed.trim()) return "";
    const cd = CD_TYPING.exec(typed);
    if (cd) return this.suggestCd(typed, cd[2], cd[3], cwd, shell);

    const length = typed.trim().length;
    if (length < 2) return "";
    const wide = length >= 3;
    const ranked = this.ranked(typed, cwd, shell, (cmd, here) => here || (wide && !local(cmd)));
    if (family(shell) === "pwsh" && wide) {
      const lower = typed.toLowerCase();
      for (const cmd of this.seeds) {
        if (cmd.length > typed.length && cmd.toLowerCase().startsWith(lower) && !local(cmd) && !ranked.includes(cmd)) ranked.push(cmd);
      }
    }

    const hit = ranked.find((cmd) => {
      const target = CD.exec(cmd)?.[2];
      return !target || this.pathExists(this.resolve(target, cwd)) === true;
    });
    return hit ? hit.slice(typed.length) : "";
  }

  private ranked(typed: string, cwd: string, shell: string, allow: (cmd: string, here: boolean) => boolean): string[] {
    const lower = typed.toLowerCase();
    const sh = family(shell);
    const now = Date.now();
    const scored = new Map<string, number>();
    for (const e of this.entries) {
      if (e.shell !== sh || e.cmd.length <= typed.length || !e.cmd.toLowerCase().startsWith(lower)) continue;
      const here = sameDir(e.cwd, cwd);
      if (!allow(e.cmd, here)) continue;
      const recency = Math.max(0, 30 - (now - e.at) / 86_400_000);
      const score = (here ? 1000 : 0) + Math.min(e.count, 50) * 4 + recency;
      scored.set(e.cmd, Math.max(scored.get(e.cmd) ?? 0, score));
    }
    return [...scored.entries()].sort((a, b) => b[1] - a[1]).map(([cmd]) => cmd);
  }

  private suggestCd(typed: string, quote: string, partial: string, cwd: string, shell: string): string {
    if (!partial.trim()) return "";
    const real = this.completeDir(partial, quote, cwd);
    if (real) return real;
    const ranked = this.ranked(typed, cwd, shell, (cmd, here) => here || isAbsolute(CD.exec(cmd)?.[2] ?? ""));
    if (family(shell) === "pwsh") {
      const lower = typed.toLowerCase();
      for (const cmd of this.seeds) {
        const target = CD.exec(cmd)?.[2] ?? "";
        if (cmd.length > typed.length && cmd.toLowerCase().startsWith(lower) && isAbsolute(target) && !ranked.includes(cmd)) ranked.push(cmd);
      }
    }
    const hit = ranked.find((cmd) => {
      const target = CD.exec(cmd)?.[2];
      return !!target && this.pathExists(this.resolve(target, cwd)) === true;
    });
    return hit ? hit.slice(typed.length) : "";
  }

  private resolve(target: string, cwd: string): string {
    if (/^~([\\/]|$)/.test(target)) return this.home() + target.slice(1);
    if (isAbsolute(target)) return target;
    return `${cwd.replace(/[\\/]+$/, "")}${IS_WINDOWS ? "\\" : "/"}${target}`;
  }

  private pathExists(path: string): boolean | undefined {
    const known = this.exists.get(path);
    if (known && performance.now() - known.at < FRESH_MS) return known.ok;
    if (!this.asking.has(path)) {
      this.asking.add(path);
      invoke<boolean[]>("paths_exist", { paths: [path] })
        .then(([ok]) => {
          this.exists.set(path, { ok, at: performance.now() });
          this.changed();
        })
        .catch(() => {})
        .finally(() => this.asking.delete(path));
    }
    return known?.ok;
  }

  private completeDir(partial: string, quote: string, cwd: string): string {
    const cut = Math.max(partial.lastIndexOf("\\"), partial.lastIndexOf("/"));
    const parent = cut >= 0 ? partial.slice(0, cut + 1) : "";
    const name = partial.slice(cut + 1).toLowerCase();
    if (!name) return "";
    const dir = parent ? this.resolve(parent, cwd) : cwd;
    const hit = this.listDirs(dir)?.find((n) => n.toLowerCase().startsWith(name) && n.length > name.length);
    if (!hit) return "";

    if (/\s/.test(hit) && !quote) return "";
    return hit.slice(name.length) + quote;
  }

  private listDirs(dir: string): string[] | undefined {
    const known = this.dirs.get(dir);
    if (known && performance.now() - known.at < FRESH_MS) return known.names;
    const key = `dirs:${dir}`;
    if (!this.asking.has(key)) {
      this.asking.add(key);
      invoke<string[]>("list_dirs", { dir })
        .then((names) => {
          this.dirs.set(dir, { names, at: performance.now() });
          this.changed();
        })
        .catch(() => {})
        .finally(() => this.asking.delete(key));
    }
    return known?.names;
  }
}
