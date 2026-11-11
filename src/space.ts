export interface Hsl {
  h: number;
  s: number;
  l: number;
}

export interface Space {
  colors: Hsl[];

  grain: number;

  intensity: number;
}

export const MAX_COLORS = 3;

export const DEFAULT_SPACE: Space = {
  colors: [
    { h: 135, s: 0.32, l: 0.62 },
    { h: 88, s: 0.38, l: 0.76 },
    { h: 145, s: 0.42, l: 0.46 },
  ],
  grain: 0.3,
  intensity: 0.6,
};

const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));

export const hsl = ({ h, s, l }: Hsl) => `hsl(${Math.round(h)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%)`;

export function normalizeSpace(raw: Partial<Space> | undefined): Space {
  const colors = Array.isArray(raw?.colors) && raw.colors.length ? raw.colors.slice(0, MAX_COLORS) : DEFAULT_SPACE.colors;
  return {
    colors: colors.map((c) => ({ h: Number(c.h) || 0, s: clamp(Number(c.s)), l: clamp(Number(c.l)) })),
    grain: clamp(Number(raw?.grain ?? DEFAULT_SPACE.grain)),
    intensity: clamp(Number(raw?.intensity ?? DEFAULT_SPACE.intensity)),
  };
}

export function applySpace(root: HTMLElement, space: Space) {
  const [a, b = a, c = b] = space.colors;
  root.style.setProperty("--space-1", hsl(a));
  root.style.setProperty("--space-2", hsl(b));
  root.style.setProperty("--space-3", hsl(c));
  root.style.setProperty("--space-alpha", String(space.intensity));
  root.style.setProperty("--grain", String(space.grain));
}
