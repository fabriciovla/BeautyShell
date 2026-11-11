export const clamp01 = (v) => Math.min(1, Math.max(0, v));

export const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function cubicBezier(x1, y1, x2, y2) {
  const bez = (t, a, b) => 3 * a * t * (1 - t) ** 2 + 3 * b * t * t * (1 - t) + t ** 3;
  const slope = (t, a, b) => 3 * a * (1 - t) ** 2 + 6 * (b - a) * t * (1 - t) + 3 * (1 - b) * t * t;
  return (x) => {
    if (x <= 0 || x >= 1) return x;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const d = slope(t, x1, x2);
      if (Math.abs(d) < 1e-6) break;
      t = clamp01(t - (bez(t, x1, x2) - x) / d);
    }
    return bez(t, y1, y2);
  };
}

export const EASE = cubicBezier(0.6, 0, 0.2, 1);

export const OPEN = cubicBezier(0.65, 0, 0.35, 1);

export const SNAP = cubicBezier(0.2, 0, 0, 1);

export const FOLD = cubicBezier(0.4, 0, 0.2, 1);

const STAGGER = 0.09;
const RISE = 18;

export function revealItems(items, rp) {
  const step = items.length > 1 ? Math.min(STAGGER, 0.5 / (items.length - 1)) : 0;
  const span = 1 - step * Math.max(0, items.length - 1);
  items.forEach((el, i) => {
    const e = 1 - Math.pow(1 - clamp01((rp - i * step) / span), 3);
    el.style.opacity = e;
    el.style.transform = `translate3d(0, ${RISE * (1 - e)}px, 0)`;
  });
}

export function resetItems(items) {
  for (const el of items) {
    el.style.opacity = "";
    el.style.transform = "";
  }
}

let keyboardInput = false;
if (typeof window !== "undefined") {
  window.addEventListener("keydown", (e) => e.key === "Tab" && (keyboardInput = true), true);
  window.addEventListener("pointerdown", () => (keyboardInput = false), true);
}
export const usingKeyboard = () => keyboardInput;
export const dropMouseFocus = () => {
  if (!keyboardInput) document.activeElement?.blur();
};
