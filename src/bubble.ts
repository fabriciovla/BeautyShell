import { icons } from "./icons";
import { esc } from "./settings";

export interface Point {
  x: number;
  y: number;
}

const APPEAR = 170;
const TRAVEL = 760;
const STICK = 230;
const TRAIL_OPACITY = [0.34, 0.2, 0.09];
const TRAIL_LAG = 0.075;

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function make(target: string, message: string, trail: boolean): HTMLElement {
  const el = document.createElement("div");
  el.className = `bubble glass${trail ? " trail" : ""}`;
  el.innerHTML = `
    <span class="bubble-icon">${icons.send}</span>
    <span class="bubble-text">
      <span class="bubble-to">${icons.arrowRight}<span>${esc(target)}</span></span>
      <span class="bubble-msg">${esc(message)}</span>
    </span>`;
  document.body.append(el);
  return el;
}

const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

function fadeBubble(to: Point, target: string, message: string): Promise<void> {
  const bubble = make(target, message, false);
  const { offsetWidth: width, offsetHeight: height } = bubble;
  bubble.style.transform = `translate(${to.x - width / 2}px, ${to.y - height / 2}px)`;
  bubble.style.transition = "opacity 300ms ease-out";
  bubble.style.opacity = "0";
  requestAnimationFrame(() => (bubble.style.opacity = "1"));
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
      bubble.style.transition = "opacity 150ms ease-out";
      bubble.style.opacity = "0";
      setTimeout(() => bubble.remove(), 150);
    }, APPEAR + TRAVEL);
  });
}

export function flyBubble(from: Point, to: Point, target: string, message: string): Promise<void> {
  if (reducedMotion.matches) return fadeBubble(to, target, message);

  const trail = TRAIL_OPACITY.map(() => make(target, message, true));
  const bubble = make(target, message, false);
  const width = bubble.offsetWidth;
  const height = bubble.offsetHeight;

  const distance = Math.hypot(to.x - from.x, to.y - from.y);
  const control = { x: (from.x + to.x) / 2, y: Math.min(from.y, to.y) - Math.min(150, distance * 0.35) };
  const at = (t: number): Point => {
    const u = 1 - t;
    return {
      x: u * u * from.x + 2 * u * t * control.x + t * t * to.x,
      y: u * u * from.y + 2 * u * t * control.y + t * t * to.y,
    };
  };
  const place = (el: HTMLElement, p: Point, scale: number, opacity: number, angle = 0) => {
    el.style.transform = `translate(${p.x - width / 2}px, ${p.y - height / 2}px) rotate(${angle}deg) scale(${scale})`;
    el.style.opacity = String(opacity);
  };

  return new Promise((resolve) => {
    const start = performance.now();
    let landed = false;
    const frame = (now: number) => {
      const elapsed = now - start;
      if (elapsed < APPEAR) {
        const k = elapsed / APPEAR;
        place(bubble, from, 0.7 + 0.3 * ease(k), k);
        trail.forEach((el) => (el.style.opacity = "0"));
      } else if (elapsed < APPEAR + TRAVEL) {
        const k = (elapsed - APPEAR) / TRAVEL;
        const p = at(ease(k));
        const before = at(ease(Math.max(0, k - 0.02)));

        place(bubble, p, 1, 1, clamp((p.x - before.x) * 0.5, -9, 9));
        trail.forEach((el, i) => {
          const tk = Math.max(0, k - TRAIL_LAG * (i + 1));
          place(el, at(ease(tk)), 1 - 0.04 * (i + 1), TRAIL_OPACITY[i] * Math.min(1, k * 5) * (1 - k * k));
        });
      } else {
        if (!landed) {
          landed = true;
          resolve();
        }
        const k = Math.min(1, (elapsed - APPEAR - TRAVEL) / STICK);
        place(bubble, to, 1 - 0.75 * ease(k), 1 - k);
        trail.forEach((el) => (el.style.opacity = "0"));
        if (k >= 1) {
          bubble.remove();
          trail.forEach((el) => el.remove());
          return;
        }
      }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  });
}
