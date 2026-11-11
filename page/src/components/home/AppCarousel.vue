<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { WIDTHS } from "./Carousel.js";

const props = defineProps({
  lang: { type: String, required: true },
  slides: { type: Array, required: true },
});

const items = computed(() =>
  props.slides.map((s) => {
    const widths = s.widths ?? WIDTHS;
    return {
      src: `${s.name}-${widths[Math.min(1, widths.length - 1)]}.webp`,
      srcset: widths.map((w) => `${s.name}-${w}.webp ${w}w`).join(", "),
      width: s.width,
      height: s.height,
      pose: s.pose,
      alt: s.alt[props.lang],
    };
  }),
);
const many = props.slides.length > 1;

const track = ref(null);
let scroller = null;
let frame = 0;
let idle = 0;

function scrollParent(el) {
  for (let node = el.parentElement; node; node = node.parentElement) {
    const { overflowY } = getComputedStyle(node);
    if (overflowY === "auto" || overflowY === "scroll") return node;
  }
  return null;
}

const smooth = (t) => t * t * (3 - 2 * t);
function settle(raw) {
  const i = Math.floor(raw);
  const f = Math.min(1, Math.max(0, (raw - i - 0.15) / 0.7));
  return i + smooth(f);
}

function update() {
  frame = 0;
  const travel = scroller.scrollHeight - scroller.clientHeight;
  const progress = travel > 0 ? Math.min(1, Math.max(0, scroller.scrollTop / travel)) : 0;
  const pos = settle(progress * (props.slides.length - 1));

  const els = track.value.children;
  const step = els[0].offsetWidth + parseFloat(getComputedStyle(track.value).columnGap || 0);
  track.value.style.transform = `translate3d(${Math.round(-pos * step)}px, 0, 0)`;

  for (let i = 0; i < els.length; i++) {
    const d = Math.min(1, Math.abs(i - pos));
    els[i].style.transform = d ? `scale(${1 - 0.08 * d})` : "";
    els[i].style.opacity = d ? 1 - 0.45 * d : "";
  }
}

function onScroll() {
  if (!frame) frame = requestAnimationFrame(update);
  track.value.classList.add("is-moving");
  clearTimeout(idle);
  idle = setTimeout(() => track.value?.classList.remove("is-moving"), 200);
}

onMounted(() => {
  if (!many) return;
  scroller = scrollParent(track.value);
  if (!scroller) return;
  scroller.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  update();
});

onBeforeUnmount(() => {
  scroller?.removeEventListener("scroll", onScroll);
  window.removeEventListener("resize", onScroll);
  cancelAnimationFrame(frame);
  clearTimeout(idle);
});
</script>

<template>
  <section class="carousel">
    <div ref="track" class="track">
      <figure v-for="(slide, i) in items" :key="slide.src" class="slide">
        <img
          :src="slide.src"
          :srcset="slide.srcset"
          sizes="(max-width: 860px) 100vw, 820px"
          :width="slide.width"
          :height="slide.height"
          :alt="slide.alt"
          :style="slide.pose"
          :loading="i ? 'lazy' : undefined"
          decoding="async"
        />
      </figure>
    </div>
  </section>
</template>

<style scoped>

.carousel {
  container-type: inline-size;
  width: 100vw;
  margin-left: calc(50% - 50vw);
  overflow: hidden;
}

.track {
  --reserve: 264px;

  --slide: round(down, min(720px, 86cqw, (100dvh - var(--reserve)) * 4 / 3), 2px);
  display: flex;
  column-gap: 24px;

  padding-left: round(down, (100cqw - var(--slide)) / 2, 1px);
}
.track.is-moving,
.track.is-moving .slide {
  will-change: transform, opacity;
}

.slide {
  position: relative;
  flex: none;
  width: var(--slide);
  aspect-ratio: 4 / 3;
  margin: 0;
  overflow: hidden;
  border-radius: clamp(20px, calc(var(--slide) * 0.06), 40px);
  background: var(--surface);
  transform-origin: center;
}

.slide img {
  position: absolute;
  display: block;
  max-width: none;
  height: auto;
  border-radius: calc(var(--slide) * 0.012);
  box-shadow: 0 0 0 1px rgba(20, 20, 45, 0.06), 0 24px 60px rgba(20, 20, 45, 0.14);
}

@media (max-width: 860px) {
  .track {
    column-gap: 12px;
  }
}
</style>
