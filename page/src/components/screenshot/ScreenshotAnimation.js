import { nextTick } from "vue";

export function startScreenshotAnimation({ mock, selection, bar, copyButton, hint, key, label, cursor, thumbEl, isCross, thumb, labelPos }) {
  const root = mock.value;
  const sel = selection.value;
  const corners = [...sel.querySelectorAll("i")];
  const barEl = bar.value;
  const hintEl = hint.value;
  const keyEl = key.value;
  const labelEl = label.value;
  const cursorEl = cursor.value;

  const ease = "cubic-bezier(0.22, 1, 0.36, 1)";
  const fly = "cubic-bezier(0.32, 0.72, 0, 1)";
  let visible = false;
  let run = 0;

  const sleep = (ms, id) =>
    new Promise((done, stop) => setTimeout(() => (id === run ? done() : stop()), ms));
  const play = (el, frames, ms, easing = ease, delay = 0) =>
    el.animate(frames, { duration: ms, easing, delay, fill: "forwards" });
  const fade = (el, to, ms = 220, delay = 0) => play(el, [{ opacity: to }], ms, "ease-out", delay);
  const at = (x, y, s = 1) => `translate(${x}px, ${y}px) scale(${s})`;
  let cx = 0, cy = 0;
  const moveCursor = (x, y, ms, easing = ease) => {
    const a = play(cursorEl, [{ transform: at(cx, cy) }, { transform: at(x, y) }], ms, easing);
    cx = x; cy = y;
    return a.finished;
  };
  const click = () => play(cursorEl, [{ transform: at(cx, cy) }, { transform: at(cx, cy, 0.82) }, { transform: at(cx, cy) }], 220, "ease-out").finished;

  async function snapshot(x, y, w, h, W, H) {
    thumb.value = { x, y, w, h, W, H };
    await nextTick();
    if (!thumbEl.value) throw new Error("la captura no llegó a dibujarse");
    return thumbEl.value;
  }

  async function cycle(id) {
    const W = root.clientWidth, H = root.clientHeight;
    const x = W * 0.24, y = H * 0.24, w = W * 0.46, h = H * 0.46;

    cx = W * 0.62; cy = H * 0.86;
    isCross.value = false;
    play(cursorEl, [{ transform: at(cx, cy) }], 0);
    await sleep(500, id);
    const approach = moveCursor(x - 18, y - 14, 900);

    fade(keyEl, 1, 200);
    await sleep(450, id);
    play(keyEl, [{ scale: 1 }, { scale: 0.9 }, { scale: 1 }], 240, "ease-out");
    await sleep(160, id);
    play(sel, [{ left: `${x}px`, top: `${y}px`, width: "0px", height: "0px", opacity: 0 }, { left: `${x}px`, top: `${y}px`, width: "0px", height: "0px", opacity: 1 }], 260, "ease-out");
    fade(hintEl, 1, 260, 120);
    fade(keyEl, 0, 200, 300);
    await approach;
    isCross.value = true;
    await moveCursor(x, y, 380);
    await sleep(250, id);

    fade(hintEl, 0, 180);
    corners.forEach((c) => fade(c, 1, 160));
    const drag = 1000;
    play(sel, [{ left: `${x}px`, top: `${y}px`, width: "0px", height: "0px" }, { left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px` }], drag, "cubic-bezier(0.45, 0, 0.25, 1)");
    await moveCursor(x + w, y + h, drag, "cubic-bezier(0.45, 0, 0.25, 1)");

    play(barEl, [{ opacity: 0, translate: "0 -4px" }, { opacity: 1, translate: "0 0" }], 220, ease);
    await sleep(350, id);
    const m = root.getBoundingClientRect(), b = copyButton.value.getBoundingClientRect();
    isCross.value = false;
    await moveCursor(b.left - m.left + b.width / 2, b.top - m.top + b.height / 2, 650);
    await sleep(120, id);
    await click();
    await sleep(80, id);

    const tw = Math.min(220, Math.max(110, W * 0.2)), s = tw / w, th = h * s, gap = Math.max(14, W * 0.022);
    const tx = W - gap - tw - x, ty = H - gap - th - y;
    const shot = await snapshot(x, y, w, h, W, H);
    fade(barEl, 0, 120);
    fade(sel, 0, 380, 60);
    fade(cursorEl, 0, 200);
    const frame = (k) => `0 0 0 ${4 / k}px #fff, 0 ${14 / k}px ${34 / k}px rgb(0 0 0 / 38%)`;
    play(shot, [
      { transform: "translate(0, 0) scale(1)", boxShadow: "0 0 0 0 #fff, 0 0 0 rgb(0 0 0 / 0%)", borderRadius: "12px" },
      { transform: `translate(${tx}px, ${ty}px) scale(${s})`, boxShadow: frame(s), borderRadius: `${8 / s}px` },
    ], 620, fly);
    await sleep(620, id);

    play(shot, [
      { transform: `translate(${tx}px, ${ty}px) scale(${s})` },
      { transform: `translate(${tx}px, ${ty}px) scale(${s * 1.05})` },
      { transform: `translate(${tx}px, ${ty}px) scale(${s * 0.98})` },
      { transform: `translate(${tx}px, ${ty}px) scale(${s})` },
    ], 520, "ease-in-out");
    labelPos.value = { right: `${gap}px`, bottom: `${gap + th + 10}px` };
    play(labelEl, [{ opacity: 0, translate: "0 4px" }, { opacity: 1, translate: "0 0" }], 240, ease, 200);
    await sleep(2300, id);

    const out = gap + tw + 24;
    play(shot, [{ transform: `translate(${tx}px, ${ty}px) scale(${s})` }, { transform: `translate(${tx + out}px, ${ty}px) scale(${s})` }], 420, "cubic-bezier(0.55, 0, 0.75, 0)");
    play(labelEl, [{ opacity: 1, translate: "0 0" }, { opacity: 0, translate: `${out}px 0` }], 420, "cubic-bezier(0.55, 0, 0.75, 0)");
    await sleep(900, id);
    thumb.value = null;
  }

  function reset() {
    run++;
    root.getAnimations({ subtree: true }).forEach((a) => a.cancel());
    thumb.value = null;
  }

  async function loop() {
    const id = ++run;
    try {
      while (id === run) {
        await cycle(id);
        reset();
        run = id;
      }
    } catch {
    }
  }

  const seen = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    reset();
    if (visible) loop();
  });
  seen.observe(root);
  let width = root.clientWidth;
  const resized = new ResizeObserver(() => {
    if (root.clientWidth === width) return;
    width = root.clientWidth;
    reset();
    if (visible) loop();
  });
  resized.observe(root);

  return () => {
    seen.disconnect();
    resized.disconnect();
    run++;
  };
}
