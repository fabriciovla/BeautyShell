<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import gsap from "gsap";
import { FOLD, OPEN, clamp01, dropMouseFocus, reduced, resetItems, revealItems, usingKeyboard } from "./Motion.js";

const props = defineProps({
  label: { type: String, required: true },
  width: { type: Number, default: 520 },

  placement: { type: String, default: "over" },

  autofocus: { type: String, default: "" },
});
const emit = defineEmits(["opened", "closed"]);

const RADIUS = 28;
const PAD = 12;

const mounted = ref(false);
const open = ref(false);
const scrim = ref(null);
const stage = ref(null);
const panel = ref(null);
const travel = ref(null);

const state = { p: 0, rp: 0 };
let tween = null;
let target = 0;
let origin = null;
let items = [];
let shared = null;
let m = null;
let resize = null;

function place() {
  const o = origin.getBoundingClientRect();
  const vw = document.documentElement.clientWidth;
  const vh = window.innerHeight;
  const el = panel.value;
  const w = Math.min(Math.max(props.width, props.placement === "over" ? o.width : 0), vw - 2 * PAD);
  el.style.width = `${w}px`;
  const h = Math.min(el.scrollHeight, vh - 2 * PAD);
  const end = props.placement === "end";
  const center = props.placement === "center";

  let left = end ? o.right - w : o.left + (o.width - w) / 2;
  let top = end ? o.top : o.top + (o.height - h) / 2;
  if (center) {
    left = (vw - w) / 2;
    top = Math.max((vh - h) / 2, PAD);
  }
  left = Math.min(Math.max(left, PAD), vw - w - PAD);

  const header = document.querySelector(".site-header")?.getBoundingClientRect().bottom ?? 0;
  if (!end && !center) top = Math.max(Math.min(top, vh - h - PAD), Math.max(header, 0) + PAD);
  el.style.left = `${left}px`;
  el.style.top = `${top}px`;
  el.style.maxHeight = `${vh - top - PAD}px`;
}

function measure() {
  const box = panel.value;
  const transform = box.style.transform;
  box.style.transform = "";
  const s = origin.getBoundingClientRect();
  const P = box.getBoundingClientRect();
  const cs = getComputedStyle(origin);
  const bg = cs.backgroundColor;
  const transparent = !bg || bg === "transparent" || /rgba\(.*,\s*0\)$/.test(bg);
  items = Array.from(panel.value.querySelectorAll("[data-anim]"));
  m = {
    s,
    P,
    r0: Math.min(parseFloat(cs.borderTopLeftRadius) || 12, s.height / 2, s.width / 2),
    color: transparent ? "var(--surface)" : bg,
  };

  const from = origin.querySelector("[data-shared]");
  const to = panel.value.querySelector("[data-shared]");
  if (from && to) {
    const f = from.getBoundingClientRect();
    const t = to.getBoundingClientRect();
    if (!shared) {
      const clone = to.cloneNode(true);
      clone.removeAttribute("data-shared");
      clone.style.width = `${t.width}px`;
      travel.value.replaceChildren(clone);
    }
    shared = { from, to, x: t.left, y: t.top, dx: f.left - t.left, dy: f.top - t.top, scale: t.height ? f.height / t.height : 1 };
  } else {
    shared = null;
    travel.value.replaceChildren();
  }
  box.style.transform = transform;
}

function render() {
  const { p, rp } = state;
  const { s, P } = m;
  const k = 1 - p;
  const top = P.top + (s.top - P.top) * k;
  const left = P.left + (s.left - P.left) * k;
  const right = innerWidth - (P.right + (s.right - P.right) * k);
  const bottom = innerHeight - (P.bottom + (s.bottom - P.bottom) * k);
  const r = m.r0 + (RADIUS - m.r0) * p;

  scrim.value.style.opacity = clamp01(p / 0.85);
  stage.value.style.clipPath = `inset(${top}px ${right}px ${bottom}px ${left}px round ${r}px)`;
  stage.value.style.backgroundColor = p >= 1 ? "" : `color-mix(in srgb, var(--bg) ${p * 100}%, ${m.color})`;

  const box = panel.value;
  if (p >= 1) {
    box.style.transform = "";
    box.style.clipPath = "";
  } else {
    const w = innerWidth - right - left;
    const h = innerHeight - bottom - top;
    const sc = w / P.width;
    box.style.transform = `translate3d(${left - P.left}px, ${top - P.top}px, 0) scale(${sc})`;

    const cut = P.height - h / sc;
    const visible = shared || state.rp > 0;
    box.style.clipPath = visible && cut > 0.5 ? `inset(0 0 ${cut}px 0 round ${r / sc}px)` : "";
  }

  if (shared) {
    const done = p >= 1 && target === 1;
    shared.from.style.visibility = "hidden";
    shared.to.style.visibility = done ? "" : "hidden";
    const tr = travel.value;
    tr.style.display = done ? "none" : "block";

    const opening = target === 1 ? 1 : 0;
    const swell = opening * Math.sin(Math.PI * clamp01((p - 0.45) / 0.55));
    const lift = opening * 10 * Math.sin(Math.PI * p);
    const sc = (1 + (shared.scale - 1) * k) * (1 + 0.06 * swell);
    tr.style.transform = `translate3d(${shared.x + shared.dx * k}px, ${shared.y + shared.dy * k - lift}px, 0) scale(${sc})`;
  }

  if (rp >= 1) {
    box.style.opacity = "";
    box.style.pointerEvents = "";
    resetItems(items);
  } else if (rp <= 0 && !shared) {
    box.style.opacity = "0";
    box.style.pointerEvents = "none";
  } else {
    box.style.opacity = "";
    box.style.pointerEvents = target === 1 && rp >= 0.6 ? "" : "none";
    revealItems(items, rp);
  }
}

function goTo(to) {
  target = to;
  tween?.kill();
  measure();
  render();

  if (reduced()) {
    state.p = to;
    state.rp = to;
    render();
    settle();
    return;
  }

  const dist = Math.max(Math.abs(to - state.p), Math.abs(to - state.rp));

  if (to === 1) {
    const dur = Math.max(0.2, 0.4 * dist);
    tween = gsap
      .timeline({ onUpdate: render, onComplete: settle })
      .to(state, { p: 1, duration: dur, ease: OPEN }, 0)
      .to(state, { rp: 1, duration: Math.max(0.3, 0.42 * dist), ease: "none" }, dur * 0.8);
  } else {
    const dur = Math.max(0.16, 0.24 * dist);
    tween = gsap
      .timeline({ onUpdate: render, onComplete: settle })
      .to(state, { p: 0, duration: dur, ease: FOLD }, 0)
      .to(state, { rp: 0, duration: dur * (shared ? 0.35 : 0.6), ease: "none" }, 0);
  }
}

let prevOverflow = "";

function setScrollLock(locked) {
  const html = document.documentElement;
  if (locked) {
    if (html.style.overflow !== "hidden") prevOverflow = html.style.overflow;
    html.style.overflow = "hidden";
  } else {
    html.style.overflow = prevOverflow;
  }
}

function cleanup() {
  open.value = false;
  for (const el of [stage.value, panel.value]) {
    el.style.clipPath = "";
    el.style.backgroundColor = "";
  }
  panel.value.style.transform = "";
  panel.value.style.opacity = "";
  panel.value.style.pointerEvents = "";
  resetItems(items);
  if (shared) {
    shared.from.style.visibility = "";
    shared.to.style.visibility = "";
  }
  if (origin) origin.style.visibility = "";
  shared = null;
  travel.value.replaceChildren();
  travel.value.style.display = "none";
  setScrollLock(false);
}

function settle() {
  tween = null;
  if (target === 1) {
    render();
    if (!props.autofocus) {
      const first = panel.value.querySelector("a, button, input");
      (usingKeyboard() && first ? first : panel.value).focus({ preventScroll: true });
    }
    emit("opened");
  } else {
    cleanup();
    if (usingKeyboard()) origin?.focus({ preventScroll: true });
    else dropMouseFocus();
    emit("closed");
  }
}

async function show(from) {
  if (target === 1) return;
  origin = from;
  dropMouseFocus();
  if (!open.value) {
    panel.value.scrollTop = 0;
    open.value = true;
    await nextTick();
    place();
  }
  setScrollLock(true);

  origin.style.visibility = "hidden";
  goTo(1);
  if (props.autofocus) panel.value.querySelector(props.autofocus)?.focus({ preventScroll: true });
}

function hide() {
  if (target === 0 || !open.value) return;
  dropMouseFocus();
  goTo(0);
}

function onKey(event) {
  if (event.key === "Escape" && target === 1) {
    event.stopPropagation();
    hide();
  }
}

function onWindowResize() {
  if (!open.value || !origin) return;
  place();
  measure();
  render();
}

function onPanelResize() {
  if (!open.value || !origin || tween) return;
  measure();
  render();
}

onMounted(async () => {
  mounted.value = true;
  window.addEventListener("keydown", onKey, true);
  window.addEventListener("resize", onWindowResize);

  await nextTick();
  resize = new ResizeObserver(onPanelResize);
  resize.observe(panel.value);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKey, true);
  window.removeEventListener("resize", onWindowResize);
  resize?.disconnect();
  tween?.kill();
  if (open.value) cleanup();
});

defineExpose({ show, hide });
</script>

<template>
  <Teleport v-if="mounted" to="body">
    <div ref="scrim" class="mm-scrim" :class="{ 'is-open': open }" aria-hidden="true" @click="hide"></div>
    <div ref="stage" class="mm-stage" :class="{ 'is-open': open }" aria-hidden="true"></div>
    <div
      ref="panel"
      class="mm-panel"
      :class="{ 'is-open': open }"
      role="dialog"
      aria-modal="true"
      :aria-label="label"
      tabindex="-1"
      :inert="open ? undefined : ''"
    >
      <slot :close="hide" />
    </div>
    <div ref="travel" class="mm-travel" aria-hidden="true"></div>
  </Teleport>
</template>

<style scoped>
.mm-scrim {
  position: fixed;
  inset: 0;
  z-index: 60;
  background: rgba(20, 20, 31, 0.16);
  opacity: 0;
  visibility: hidden;
  will-change: opacity;
}

.mm-stage {
  position: fixed;
  inset: 0;
  z-index: 61;
  background: var(--bg);
  pointer-events: none;
  visibility: hidden;
}

.mm-panel {
  position: fixed;
  transform-origin: 0 0;
  top: 0;
  left: 0;
  z-index: 62;
  overflow-y: auto;
  overscroll-behavior: contain;
  border-radius: 28px;
  visibility: hidden;
}

.mm-panel.is-open {
  will-change: transform;
}
.mm-panel:focus {
  outline: none;
}

.mm-travel {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 63;
  display: none;
  transform-origin: 0 0;
  will-change: transform;
  backface-visibility: hidden;
  pointer-events: none;
}

.is-open {
  visibility: visible;
}
</style>
