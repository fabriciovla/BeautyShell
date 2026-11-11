<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";
import ScreenshotDesktop from "./ScreenshotDesktop.vue";
import { startScreenshotAnimation } from "./ScreenshotAnimation.js";

const props = defineProps({
  lang: { type: String, required: true },
  compact: { type: Boolean, default: false },
});

const t = {
  es: { copy: "Copiar", save: "Guardar", hint: "Arrastrá para seleccionar  ·  Esc para salir", key: "Impr Pant", copied: "Copiada" },
  en: { copy: "Copy", save: "Save", hint: "Drag to select  ·  Esc to exit", key: "Print Screen", copied: "Copied" },
}[props.lang];

const arrow = '<path d="M5 3v15.5l4.2-4 2.9 6.6 2.6-1.1-2.9-6.5h5.9z"/>';
const cross = '<path class="cursor-halo" d="M11 2v18M2 11h18"/><path d="M11 2v18M2 11h18"/>';

const mock = ref();
const selection = ref();
const bar = ref();
const copyButton = ref();
const hint = ref();
const key = ref();
const label = ref();
const cursor = ref();
const thumbEl = ref();

const live = ref(false);
const isCross = ref(false);
const thumb = ref(null);
const labelPos = ref();

let dispose = () => {};

onMounted(() => {
  const still = matchMedia("(prefers-reduced-motion: reduce)");
  if (props.compact || still.matches) return;

  live.value = true;
  dispose = startScreenshotAnimation({ mock, selection, bar, copyButton, hint, key, label, cursor, thumbEl, isCross, thumb, labelPos });
});

onBeforeUnmount(() => dispose());

const px = (n) => `${n}px`;
</script>

<template>
  <div ref="mock" class="absolute inset-0 overflow-hidden isolate" aria-hidden="true">
    <ScreenshotDesktop :compact="compact" />
    <div ref="selection" :class="['absolute rounded-12 shadow-selection transition-scale group-hover:grow', compact ? 'top-26p left-22p w-52p h-50p' : 'top-24p left-24p w-46p h-46p', { 'opacity-0': live }]">
      <i :class="['corner corner-tl', { 'opacity-0': live }]"></i><i :class="['corner corner-tr', { 'opacity-0': live }]"></i><i :class="['corner corner-br', { 'opacity-0': live }]"></i><i :class="['corner corner-bl', { 'opacity-0': live }]"></i>
    </div>
    <div ref="bar" :class="['absolute flex gap-2 p-3 rounded-full bg-dark-82 shadow-bar blur-16 text-white font-500', compact ? 'top-76p-12 right-26p text-11-5' : 'top-70p-16 right-30p text-12-5', { 'opacity-0': live }]">
      <span ref="copyButton" class="py-5 px-13 rounded-full bg-white-14">{{ t.copy }}</span>
      <span class="py-5 px-13 rounded-full">{{ t.save }}</span>
    </div>
    <template v-if="!compact">
      <p ref="hint" :class="['absolute right-0 bottom-shot-hint left-0 text-white-70 text-13 text-center pre phone:hidden', { 'opacity-0': live }]">{{ t.hint }}</p>
      <kbd ref="key" :class="['absolute bottom-16p left-50p center-x py-7 px-14 border border-strong border-b-3 rounded-9 bg-white shadow-sm text-ink font-sans text-13 font-600 leading-normal', live ? 'block opacity-0' : 'hidden']">{{ t.key }}</kbd>
      <div v-if="thumb" ref="thumbEl" class="absolute overflow-hidden rounded-12 origin-0" :style="{ left: px(thumb.x), top: px(thumb.y), width: px(thumb.w), height: px(thumb.h) }">
        <div class="absolute" :style="{ left: px(-thumb.x), top: px(-thumb.y), width: px(thumb.W), height: px(thumb.H) }">
          <ScreenshotDesktop />
        </div>
      </div>
      <p ref="label" :class="['absolute py-4 px-11 rounded-full bg-dark-82 shadow-label blur-16 text-white text-12 font-500', live ? 'block opacity-0' : 'hidden']" :style="labelPos">{{ t.copied }}</p>
      <div ref="cursor" :class="['absolute z-1 top-0 left-0 no-pointer', live ? 'block' : 'hidden']">
        <svg :class="['absolute w-22 h-22 cursor-arrow', { hidden: isCross }]" viewBox="0 0 22 22" v-html="arrow" />
        <svg :class="['absolute w-22 h-22 cursor-cross', { hidden: !isCross }]" viewBox="0 0 22 22" v-html="cross" />
      </div>
    </template>
  </div>
</template>
