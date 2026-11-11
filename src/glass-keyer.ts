import type { ITheme } from "@xterm/xterm";

/*
 * With terminal glass only the default background (SGR 49) is transparent, so a program that paints its
 * background in the terminal's own color (Claude Code's input box does) left an opaque block. This filter
 * rewrites those backgrounds to the default before the output reaches xterm; other colors are kept.
 */

type Rgb = [number, number, number];

const TOLERANCE = 24;

const ANSI_KEYS: (keyof ITheme)[] = [
  "black", "red", "green", "yellow", "blue", "magenta", "cyan", "white",
  "brightBlack", "brightRed", "brightGreen", "brightYellow", "brightBlue", "brightMagenta", "brightCyan", "brightWhite",
];

export function hexRgb(hex: string): Rgb {
  const h = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) || 0) as Rgb;
}

function color256(n: number, palette: Rgb[]): Rgb | null {
  if (n < 16) return palette[n] ?? null;
  if (n < 232) {
    const level = (v: number) => (v ? 55 + v * 40 : 0);
    const i = n - 16;
    return [level(Math.floor(i / 36)), level(Math.floor(i / 6) % 6), level(i % 6)];
  }
  if (n < 256) {
    const v = 8 + (n - 232) * 10;
    return [v, v, v];
  }
  return null;
}

export class BackgroundKeyer {
  private bg: Rgb = [0, 0, 0];
  private palette: Rgb[] = [];

  private carry = "";

  setTheme(theme: ITheme, background: string) {
    this.bg = hexRgb(background);
    this.palette = ANSI_KEYS.map((key) => hexRgb(String(theme[key] ?? "#000000")));
  }

  private matches(rgb: Rgb | null) {
    return !!rgb && rgb.every((v, i) => Math.abs(v - this.bg[i]) <= TOLERANCE);
  }

  process(data: string): string {
    data = this.carry + data;
    this.carry = "";
    const cut = data.match(/\x1b(\[[0-9;:]*)?$/);
    if (cut) {
      this.carry = cut[0];
      data = data.slice(0, cut.index);
    }
    return data.replace(/\x1b\[([0-9;:]*)m/g, (seq, params: string) => {
      if (!params) return seq;
      const out = this.rewrite(params.split(";"));
      return out ? `\x1b[${out}m` : seq;
    });
  }

  private rewrite(tokens: string[]): string | null {
    const out: string[] = [];
    let changed = false;
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];

      if (t.startsWith("48:")) {
        const sub = t.split(":").map(Number);
        const rgb = sub[1] === 2 ? (sub.slice(-3) as Rgb) : sub[1] === 5 ? color256(sub[2], this.palette) : null;
        if (this.matches(rgb)) {
          out.push("49");
          changed = true;
        } else out.push(t);
        continue;
      }
      if (t === "48" && tokens[i + 1] === "2" && i + 4 < tokens.length) {
        const rgb = tokens.slice(i + 2, i + 5).map(Number) as Rgb;
        if (this.matches(rgb)) {
          out.push("49");
          changed = true;
        } else out.push(...tokens.slice(i, i + 5));
        i += 4;
        continue;
      }
      if (t === "48" && tokens[i + 1] === "5" && i + 2 < tokens.length) {
        if (this.matches(color256(Number(tokens[i + 2]), this.palette))) {
          out.push("49");
          changed = true;
        } else out.push(...tokens.slice(i, i + 3));
        i += 2;
        continue;
      }

      if ((t === "38" || t === "58") && (tokens[i + 1] === "2" || tokens[i + 1] === "5")) {
        const span = tokens[i + 1] === "2" ? 5 : 3;
        out.push(...tokens.slice(i, i + span));
        i += span - 1;
        continue;
      }
      const n = Number(t);
      const index =n >= 40 && n <= 47 ? n - 40 : n >= 100 && n <= 107 ? n - 92 : -1;
      if (index >= 0 && this.matches(this.palette[index])) {
        out.push("49");
        changed = true;
        continue;
      }
      out.push(t);
    }
    return changed ? out.join(";") : null;
  }
}
