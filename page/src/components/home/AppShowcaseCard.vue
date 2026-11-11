<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";
import gsap from "gsap";
import WindowsLogo from "../WindowsLogo.vue";
import AppCarousel from "./AppCarousel.vue";
import { scrollLength } from "./Carousel.js";
import { slides as shellSlides } from "../shell/ShellSlides.js";
import { slides as screenshotSlides } from "../screenshot/ScreenshotSlides.js";
import { EASE, OPEN, clamp01, dropMouseFocus, reduced, resetItems, revealItems, usingKeyboard } from "../Motion.js";

const props = defineProps({
  id: { type: String, required: true },
  lang: { type: String, required: true },
  align: { type: String, default: "left" },

  wide: { type: Boolean, default: false },

  href: { type: String, default: undefined },
  name: { type: String, required: true },
  logo: { type: String, required: true },
  downloadHref: { type: String, required: true },
  downloadLabel: { type: String, required: true },

  docsHref: { type: String, default: undefined },
  docsLabel: { type: String, default: undefined },
  openLabel: { type: String, required: true },
  closeLabel: { type: String, required: true },
});

const RADIUS = 44;

const slides = { shell: shellSlides, screenshot: screenshotSlides }[props.id];

const mounted = ref(false);
const open = ref(false);
const card = ref(null);
const overlay = ref(null);
const shape = ref(null);
const contentBox = ref(null);
const scrim = ref(null);
const closedHead = ref(null);
const openHead = ref(null);
const travelHead = ref(null);
const closeBtn = ref(null);

const state = { p: 0, rp: 0 };
let tween = null;
let target = 0;
let m = { card: null, color: "var(--surface)", toLeft: 0, toTop: 0, dx: 0, dy: 0, scale: 1, scrollY: 0 };
let items = [];

function measure() {
  const to = openHead.value.getBoundingClientRect();
  const from = closedHead.value.getBoundingClientRect();
  items = Array.from(contentBox.value.querySelectorAll("[data-anim]"));
  m = {
    card: card.value.getBoundingClientRect(),
    color: getComputedStyle(card.value).backgroundColor,
    toLeft: to.left,
    toTop: to.top,
    dx: from.left - to.left,
    dy: from.top - to.top,
    scale: to.width ? from.width / to.width : 1,
    scrollY: window.scrollY,
  };
}

function render() {
  const p = state.p;
  const rp = state.rp;
  const w = document.documentElement.clientWidth;
  const h = window.innerHeight;
  const k = 1 - p;
  const o = overlay.value;
  const sh = shape.value;
  const box = contentBox.value;
  const th = travelHead.value;
  const c = m.card;
  const sy = m.scrollY - window.scrollY;
  const left = c.left * k;
  const top = (c.top + sy) * k;
  const right = (w - c.right) * k;
  const bottom = (h - c.bottom - sy) * k;
  const cardBg = `color-mix(in srgb, var(--bg) ${p * 100}%, ${m.color})`;

  scrim.value.style.opacity = clamp01(p / 0.85);

  if (p >= 1 && rp >= 1) {
    sh.style.display = "none";
    o.style.clipPath = "";
    o.style.backgroundColor = "";
    openHead.value.style.visibility = "";
    th.style.display = "none";
    th.style.transform = "";
  } else {
    const r = RADIUS * Math.sqrt(k);
    const clip = p >= 1 ? "" : `inset(${top}px ${right}px ${bottom}px ${left}px round ${r}px)`;
    sh.style.display = "block";
    sh.style.clipPath = clip;
    o.style.clipPath = clip;
    sh.style.backgroundColor = p >= 1 ? "" : cardBg;
    o.style.backgroundColor = "transparent";
    openHead.value.style.visibility = "hidden";
    th.style.display = "flex";

    const swell = target === 1 ? Math.sin(Math.PI * clamp01((p - 0.45) / 0.55)) : 0;
    const sc = (1 + (m.scale - 1) * k) * (1 + 0.06 * swell);
    const lift = 16 * Math.sin(Math.PI * p) * (target === 1 ? 1 : 0);
    th.style.transform = `translate3d(${m.toLeft + m.dx * k}px, ${m.toTop + (m.dy + sy) * k - lift}px, 0) scale(${sc})`;
  }

  if (rp >= 1) {
    box.style.opacity = "";
    box.style.pointerEvents = "";
    resetItems(items);
  } else if (rp <= 0) {
    box.style.opacity = "0";
    box.style.pointerEvents = "none";
  } else {
    box.style.opacity = "";
    box.style.pointerEvents = target === 1 && rp >= 0.75 ? "" : "none";
    revealItems(items, rp);
  }

  const b = rp;
  closeBtn.value.style.opacity = b >= 1 ? "" : b;
  closeBtn.value.style.transform = b >= 1 ? "" : `scale(${0.7 + 0.3 * b})`;
  closeBtn.value.style.pointerEvents = target === 1 && b > 0.2 ? "" : "none";
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
    const dur = Math.max(0.2, 0.42 * dist);
    tween = gsap
      .timeline({ onUpdate: render, onComplete: settle })
      .to(state, { p: 1, duration: dur, ease: OPEN }, 0)

      .to(state, { rp: 1, duration: Math.max(0.3, 0.42 * dist), ease: "none" }, dur * 0.8);
  } else {
    const fade = Math.max(0.06, 0.1 * dist);
    tween = gsap
      .timeline({ onUpdate: render, onComplete: settle })
      .to(state, { rp: 0, duration: fade, ease: "none" }, 0)
      .to(state, { p: 0, duration: Math.max(0.16, 0.28 * dist), ease: EASE }, fade * 0.5);
  }
}

function setScrollLock(locked) {
  const val = locked ? "hidden" : "";

  document.documentElement.style.overflow = val;
}

function settle() {
  tween = null;
  if (target === 1) {
    (usingKeyboard() ? closeBtn.value : overlay.value).focus({ preventScroll: true });
  } else {
    open.value = false;
    shape.value.style.display = "none";
    shape.value.style.clipPath = "";
    overlay.value.style.clipPath = "";
    overlay.value.style.backgroundColor = "";
    openHead.value.style.visibility = "";
    travelHead.value.style.display = "none";
    travelHead.value.style.transform = "";
    contentBox.value.style.opacity = "";
    contentBox.value.style.pointerEvents = "";
    resetItems(items);
    setScrollLock(false);
    if (usingKeyboard()) card.value.focus({ preventScroll: true });
    else dropMouseFocus();
  }
}

function openModal() {
  if (props.href) {
    window.open(props.href, "_blank", "noopener");
    return;
  }
  if (target === 1) return;
  dropMouseFocus();
  if (!open.value) {
    overlay.value.scrollTop = 0;
    measure();
    render();
    open.value = true;
  }
  setScrollLock(true);
  goTo(1);
}

function closeModal() {
  if (target === 0 || !open.value) return;
  dropMouseFocus();
  setScrollLock(false);
  goTo(0);
}

function onOverlayClick(event) {
  if (event.target.closest(".close, a")) return;
  if (target === 0 && open.value) openModal();
}

function onKey(event) {
  if (event.key === "Escape") closeModal();
}

function onScroll() {
  if (open.value && (state.p < 1 || state.rp < 1)) render();
}

onMounted(() => {
  mounted.value = true;
  window.addEventListener("keydown", onKey);
  window.addEventListener("scroll", onScroll, { passive: true });
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKey);
  window.removeEventListener("scroll", onScroll);
  setScrollLock(false);
  tween?.kill();
});

defineExpose({ openModal });
</script>

<template>
  <section class="slot" :class="{ 'is-wide': wide }">
    <div
      ref="card"
      class="card"
      :class="{ 'is-right': align === 'right' }"
      role="button"
      tabindex="0"
      :aria-label="openLabel"
      :aria-expanded="open"
      @click="openModal"
      @keydown.enter.prevent="openModal"
      @keydown.space.prevent="openModal"
    >
      <div ref="closedHead" class="head" :class="{ ghost: open }">
        <img class="app-logo" :src="logo" alt="" width="52" height="52" />
        <span class="title">{{ name }}</span>
      </div>
    </div>
  </section>

  <Teleport v-if="mounted && !href" to="body">
    <div ref="scrim" class="scrim" :class="{ 'is-open': open }" aria-hidden="true"></div>
    <div ref="shape" class="shape" aria-hidden="true"></div>
    <div ref="travelHead" class="head travel-head" aria-hidden="true">
      <img class="app-logo" :src="logo" alt="" width="52" height="52" />
      <span class="title">{{ name }}</span>
    </div>
    <div
      ref="overlay"
      class="overlay"
      :class="{ 'is-open': open }"
      role="dialog"
      aria-modal="true"
      tabindex="-1"
      :aria-label="name"
      :inert="open ? undefined : ''"
      @click="onOverlayClick"
    >
      <button ref="closeBtn" class="close" type="button" :aria-label="closeLabel" @click="closeModal">
        <span class="ms" style="font-size: 24px" aria-hidden="true">close</span>
      </button>

      <div ref="contentBox" class="container">
        <div ref="openHead" class="head is-inline">
          <img class="app-logo" :src="logo" alt="" width="52" height="52" />
          <span class="title is-inline">{{ name }}</span>
        </div>

        <div data-anim class="demo-wrap">
          <AppCarousel :lang="lang" :slides="slides" />
        </div>

        <div data-anim class="dock">
          <a class="pill-btn primary" :href="downloadHref" data-download>
            <WindowsLogo class="w-16 h-16" />
            {{ downloadLabel }}
          </a>
          <a v-if="docsHref" class="pill-btn secondary" :href="docsHref">
            <span class="ms" style="font-size: 18px" aria-hidden="true">menu_book</span>
            {{ docsLabel }}
          </a>
        </div>
      </div>

      <div :style="{ height: scrollLength(slides) }" aria-hidden="true"></div>
    </div>
  </Teleport>
</template>

<style scoped>
.slot {
  position: relative;
  flex: 1;
  min-height: clamp(380px, 54vh, 520px);
}

.slot.is-wide {
  grid-column: 1 / -1;
  min-height: clamp(260px, 34vh, 340px);
}

.card {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: flex-end;
  border: 1px solid transparent;
  border-radius: 44px;
  background: var(--surface);
  padding: 40px;
  cursor: pointer;
  transition: background 0.3s, border-color 0.3s;
}
.card.is-right {
  justify-content: flex-end;
}
.card:hover {
  background: var(--surface-hover);
  border-color: var(--border);
}
.card:focus-visible {
  outline: 2px solid var(--text);
  outline-offset: 4px;
}

.head {
  display: flex;
  align-items: center;
  gap: 16px;
  white-space: nowrap;
}
.head.is-inline {
  position: relative;
  z-index: 2;
}
.head.ghost {
  visibility: hidden;
}

.app-logo {
  flex-shrink: 0;
  width: 52px;
  height: 52px;
  border-radius: 14px;
  object-fit: cover;
}

.title {
  font-family: var(--font-title);
  font-size: clamp(32px, 3.8vw, 48px);
  font-weight: 600;
  letter-spacing: -0.04em;
  line-height: 1.05;
}

.scrim {
  position: fixed;
  inset: 0;
  z-index: 49;
  background: rgba(20, 20, 31, 0.14);
  opacity: 0;
  pointer-events: none;
  visibility: hidden;
  will-change: opacity;
}
.scrim.is-open {
  visibility: visible;
}

.shape {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: none;
  background: var(--bg);
  pointer-events: none;
}

.overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  background: var(--bg);
  visibility: hidden;
}
.overlay:focus {
  outline: none;
}
.overlay.is-open {
  visibility: visible;
}

.head.travel-head {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 51;
  transform-origin: 0 0;
  will-change: transform;
  backface-visibility: hidden;
  display: none;
  pointer-events: none;
}

.close {
  position: fixed;
  top: 24px;
  left: 28px;
  z-index: 2;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 14px;
  background: transparent;
  color: var(--text);
  cursor: pointer;

  will-change: opacity, transform;
}
.close:hover {
  background: var(--hover-bg);
}

.container {
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 28px;
  height: 100dvh;
  max-width: 1060px;
  margin: 0 auto;
  padding: 24px;
}

.head.is-inline {
  align-self: center;
  margin-bottom: 24px;
}

.dock {
  display: flex;
  align-items: center;
  align-self: center;
  gap: 6px;
  border: 1px solid var(--border);
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.72);
  padding: 5px;
  box-shadow: 0 10px 30px rgba(20, 20, 31, 0.08), 0 1px 2px rgba(20, 20, 31, 0.05);
}

.pill-btn {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  height: 38px;
  border-radius: 9999px;
  padding: 0 16px;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: -0.01em;
  transition: background 0.2s, transform 0.2s;
}
.pill-btn.primary {
  border: 1px solid #09090d;
  background: #09090d;
  color: #fff;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.32), 0 1px 2px rgba(0, 0, 0, 0.16);
}
.pill-btn.primary:hover {
  background: #1c1c26;
}
.pill-btn.secondary {
  border: 1px solid rgba(20, 20, 45, 0.08);
  background: rgba(20, 20, 45, 0.045);
  color: var(--text-body);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.75), 0 1px 2px rgba(20, 20, 45, 0.04);
}
.pill-btn.secondary:hover {
  background: rgba(20, 20, 45, 0.08);
  color: var(--text);
}

@media (max-width: 860px) {
  .card {
    padding: 28px;
  }
  .title {
    white-space: normal;
  }
  .container {
    gap: 24px;
    padding: 72px 16px 16px;
  }
  .head.is-inline {
    margin-bottom: 16px;
  }
}
</style>
