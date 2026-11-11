<script setup>

import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import ScreenshotScene from "./ScreenshotScene.vue";

const props = defineProps({ lang: { type: String, required: true } });

const t = {
  es: {
    region: "Demo de Beauty Screenshot",
    hint: "Arrastrá para seleccionar  ·  Esc para salir",
    copy: "Copiar",
    save: "Guardar",
    cancel: "Cancelar",
    copied: "Copiada",
    saved: "Guardada",
    savedCopied: "Guardada y copiada",
    activeTitle: "Beauty Screenshot está activo",
    activeText: "Presioná Impr Pant para capturar",
    tray: "BeautyScreenshot · Impr Pant para capturar",
    capture: "Capturar",
    startup: "Iniciar con Windows",
    folder: "Abrir carpeta de capturas",
    settings: "Ajustes…",
    quit: "Salir",
    settingsTitle: "Ajustes",
    sCapture: "Captura",
    hotkey: "Atajo de teclado",
    hotkeyText: "Combinación que abre la captura",
    key: "Impr Pant",
    enter: "Enter y doble clic",
    enterText: "Qué hacer al confirmar sin usar la barra",
    sSaving: "Guardado",
    folderRow: "Carpeta",
    folderPath: "C:\\Users\\Ana\\Pictures\\Capturas",
    change: "Cambiar…",
    copyOnSave: "Copiar también al guardar",
    copyOnSaveText: "Además del archivo, deja la imagen en el portapapeles",
    sLook: "Apariencia",
    radius: "Esquinas redondeadas",
    radiusText: "Redondea la selección y la imagen final, con esquinas transparentes",
    dim: "Oscurecido",
    dimText: "Cuánto se oscurece la pantalla mientras seleccionás",
    showHint: "Mostrar la indicación",
    showHintText: "El cartelito de abajo mientras seleccionás",
    captures: "Capturas",
    empty: "Todavía no guardaste capturas.",
    file: "Captura",
    close: "Cerrar",
  },
  en: {
    region: "Beauty Screenshot demo",
    hint: "Drag to select  ·  Esc to exit",
    copy: "Copy",
    save: "Save",
    cancel: "Cancel",
    copied: "Copied",
    saved: "Saved",
    savedCopied: "Saved and copied",
    activeTitle: "Beauty Screenshot is running",
    activeText: "Press Print Screen to capture",
    tray: "BeautyScreenshot · Print Screen to capture",
    capture: "Capture",
    startup: "Start with Windows",
    folder: "Open screenshots folder",
    settings: "Settings…",
    quit: "Quit",
    settingsTitle: "Settings",
    sCapture: "Capture",
    hotkey: "Keyboard shortcut",
    hotkeyText: "The keys that start a capture",
    key: "Print Screen",
    enter: "Enter and double-click",
    enterText: "What to do when you confirm without the toolbar",
    sSaving: "Saving",
    folderRow: "Folder",
    folderPath: "C:\\Users\\Ana\\Pictures\\Screenshots",
    change: "Change…",
    copyOnSave: "Copy when saving too",
    copyOnSaveText: "Besides the file, leaves the image on the clipboard",
    sLook: "Appearance",
    radius: "Rounded corners",
    radiusText: "Rounds the selection and the final image, with transparent corners",
    dim: "Dimming",
    dimText: "How dark the screen gets while you select",
    showHint: "Show the hint",
    showHintText: "The little label at the bottom while you select",
    captures: "Screenshots",
    empty: "You haven't saved any screenshots yet.",
    file: "Screenshot",
    close: "Close",
  },
}[props.lang];

const icons = {
  copy: "M8 8h11v12H8zM5 16V4h11",
  save: "M5 4h11l3 3v13H5zM8 4v5h7V4M8 20v-6h8v6",
  cancel: "M6 6l12 12M18 6 6 18",
  check: "M5 12.5l4.5 4.5L19 7.5",
};

const settings = reactive({ radius: 10, dim: 50, action: "copy", copyOnSave: false, showHint: true, startup: true });

const stage = ref();
const size = reactive({ w: 1200, h: 700 });
let observer;

const now = ref(new Date());
const time = computed(() => now.value.toLocaleTimeString(props.lang === "es" ? "es-AR" : "en-US", { hour: "2-digit", minute: "2-digit" }));
const date = computed(() => now.value.toLocaleDateString(props.lang === "es" ? "es-AR" : "en-US"));
let clock;

const toast = ref(false);
let toastTimer;

const mode = ref("idle");
const rect = reactive({ x: 0, y: 0, w: 0, h: 0 });
const leaving = ref(false);
let origin = null;

const scale = computed(() => 1920 / size.w);
const radius = computed(() => Math.max(0, Math.min(settings.radius * (size.w / 1440), rect.w / 2, rect.h / 2)));
const sizeLabel = computed(() => `${Math.round(rect.w * scale.value)} × ${Math.round(rect.h * scale.value)}`);

function begin(delay = 150) {
  if (mode.value !== "idle") return;
  menu.open = false;
  toast.value = false;
  clearTimeout(toastTimer);
  setTimeout(() => {
    leaving.value = false;
    Object.assign(rect, { x: 0, y: 0, w: 0, h: 0 });
    mode.value = "armed";
  }, delay);
}

function cancel() {
  mode.value = "idle";
  origin = null;
}

function point(e) {
  const box = stage.value.getBoundingClientRect();
  return { x: Math.max(0, Math.min(size.w, e.clientX - box.left)), y: Math.max(0, Math.min(size.h, e.clientY - box.top)) };
}

function onDown(e) {
  if (mode.value === "idle" || e.button !== 0) return;
  if (e.target.closest(".toolbar")) return;
  if (e.detail === 2 && mode.value === "selected") return confirm(settings.action);
  e.currentTarget.setPointerCapture(e.pointerId);
  origin = point(e);
  Object.assign(rect, { x: origin.x, y: origin.y, w: 0, h: 0 });
  mode.value = "dragging";
}

function onMove(e) {
  if (mode.value !== "dragging" || !origin) return;
  const p = point(e);
  Object.assign(rect, { x: Math.min(origin.x, p.x), y: Math.min(origin.y, p.y), w: Math.abs(p.x - origin.x), h: Math.abs(p.y - origin.y) });
}

function onUp() {
  if (mode.value !== "dragging") return;
  origin = null;
  mode.value = rect.w >= 6 && rect.h >= 6 ? "selected" : "armed";
}

const marks = computed(() => {
  const x = rect.x - 1.5, y = rect.y - 1.5, w = rect.w + 3, h = rect.h + 3;
  const half = Math.min(w, h) / 2;
  const r = Math.min(radius.value > 0 ? radius.value + 1.5 : 0, half);
  const l = Math.min(r + 14, half);
  const arc = (ex, ey) => (r > 0 ? `A${r} ${r} 0 0 1 ${ex} ${ey}` : `L${ex} ${ey}`);
  return [
    `M${x} ${y + l}L${x} ${y + r}${arc(x + r, y)}L${x + l} ${y}`,
    `M${x + w - l} ${y}L${x + w - r} ${y}${arc(x + w, y + r)}L${x + w} ${y + l}`,
    `M${x + w} ${y + h - l}L${x + w} ${y + h - r}${arc(x + w - r, y + h)}L${x + w - l} ${y + h}`,
    `M${x + l} ${y + h}L${x + r} ${y + h}${arc(x, y + h - r)}L${x} ${y + h - l}`,
  ].join("");
});

const tag = ref();
const tagPos = computed(() => {
  const th = 22, tw = tag.value?.offsetWidth ?? 80;
  let x = rect.x, y = rect.y - th - 8;
  if (y < 6) { x = rect.x + 8; y = rect.y + 8; }
  return { left: `${Math.max(6, Math.min(x, size.w - tw - 6))}px`, top: `${y}px` };
});

const bar = ref();
const barPos = computed(() => {
  const bw = bar.value?.offsetWidth ?? 220, bh = bar.value?.offsetHeight ?? 40;
  let x = rect.x + rect.w - bw, y = rect.y + rect.h + 12;
  if (y + bh > size.h - 8) {
    y = rect.y - bh - 12;
    if (y < 8) y = rect.y + rect.h - bh - 12;
  }
  return { left: `${Math.max(8, Math.min(x, size.w - bw - 8))}px`, top: `${y}px` };
});

const shot = ref(null);
const shotEl = ref();
const saved = reactive([]);
let shotTimer;
let counter = 1;

async function confirm(action) {
  if (mode.value !== "selected") return;
  const r = { ...rect };
  const label = action === "save" ? (settings.copyOnSave ? t.savedCopied : t.saved) : t.copied;
  if (action === "save") {
    const d = new Date();
    const stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}${String(d.getSeconds()).padStart(2, "0")}`;
    saved.unshift({ id: counter++, ...r, name: `${t.file} ${stamp}.png`, radius: radius.value });
  }
  leaving.value = true;
  mode.value = "idle";

  const k = Math.max(0.55, Math.min(1, size.w / 1500));
  const s = Math.min(1, (220 * k) / r.w, (150 * k) / r.h);
  const pw = r.w * s, ph = r.h * s, frame = 4, margin = 20 * k;
  const left = size.w - margin - pw - frame * 2, top = size.h - 48 - margin - ph - frame * 2;
  clearTimeout(shotTimer);
  shot.value = { ...r, s, pw, ph, left, top, label, landed: false, out: false, key: counter++ };
  await nextTick();
  const el = shotEl.value;
  if (!el) return;
  const fromX = r.x - frame - left, fromY = r.y - frame - top;
  const fx = (r.w + frame * 2) / (pw + frame * 2), fy = (r.h + frame * 2) / (ph + frame * 2);
  const flight = el.animate(
    [
      { transform: `translate(${fromX}px, ${fromY}px) scale(${fx}, ${fy})`, borderRadius: `${radius.value}px` },
      { transform: "none", borderRadius: "10px" },
    ],
    { duration: 460, easing: "cubic-bezier(0.32, 0.72, 0, 1)", delay: 30 },
  );
  await flight.finished.catch(() => {});
  if (!shot.value) return;
  shot.value.landed = true;
  shotTimer = setTimeout(dismiss, 3600);
}

function dismiss() {
  if (!shot.value) return;
  shot.value.out = true;
  shotTimer = setTimeout(() => (shot.value = null), 320);
}

const crop = (c, s) => ({
  width: `${size.w}px`,
  height: `${size.h}px`,
  transform: `translate(${-c.x * s}px, ${-c.y * s}px) scale(${s})`,
});

function showToast(ms = 5000) {
  toast.value = true;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (toast.value = false), ms);
}

const menu = reactive({ open: false, x: 0, y: 0 });
const settingsOpen = ref(false);
const folderOpen = ref(false);
const trayOn = ref(true);

function openMenu(e) {
  const p = point(e);
  menu.x = Math.min(p.x, size.w - 250);
  menu.y = size.h - 48;
  menu.open = true;
  toast.value = false;
}
function pick(what) {
  menu.open = false;
  if (what === "capture") begin(250);
  else if (what === "startup") settings.startup = !settings.startup;
  else if (what === "folder") folderOpen.value = true;
  else if (what === "settings") settingsOpen.value = true;
  else if (what === "quit") {
    trayOn.value = false;
    settingsOpen.value = false;

    setTimeout(() => {
      trayOn.value = true;
      showToast();
    }, 1800);
  }
}

function onKey(e) {
  if (mode.value === "idle") return;
  if (e.key === "Escape") {
    e.preventDefault();
    cancel();
  } else if (e.key === "Enter" && mode.value === "selected") {
    e.preventDefault();
    confirm(settings.action);
  }
}

function onKeyUp(e) {
  if (e.key === "PrintScreen" && trayOn.value) begin(0);
}

let seen;
onMounted(() => {
  observer = new ResizeObserver(([entry]) => {
    size.w = entry.contentRect.width;
    size.h = entry.contentRect.height;
  });
  observer.observe(stage.value);
  clock = setInterval(() => (now.value = new Date()), 20000);
  window.addEventListener("keydown", onKey);
  window.addEventListener("keyup", onKeyUp);

  seen = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) {
      seen.disconnect();
      setTimeout(() => showToast(), 600);
    }
  }, { threshold: 0.4 });
  seen.observe(stage.value);
});
onBeforeUnmount(() => {
  observer?.disconnect();
  seen?.disconnect();
  clearInterval(clock);
  clearTimeout(shotTimer);
  clearTimeout(toastTimer);
  window.removeEventListener("keydown", onKey);
  window.removeEventListener("keyup", onKeyUp);
});
</script>

<template>
  <div ref="stage" class="screen" role="region" :aria-label="t.region" @pointerdown="menu.open = false">
    <ScreenshotScene :lang="lang" :time="time" :date="date" :tray-on="trayOn" :tray-title="t.tray" @capture="begin()" @menu="openMenu" />

    <Transition name="pop">
      <div v-if="folderOpen" class="window folder" @pointerdown.stop>
        <div class="titlebar">
          <span class="folder-icon"></span>
          <span class="title">{{ t.captures }}</span>
          <button class="x" type="button" :aria-label="t.close" @click="folderOpen = false"><svg viewBox="0 0 24 24"><path :d="icons.cancel" /></svg></button>
        </div>
        <div class="files">
          <p v-if="!saved.length" class="empty">{{ t.empty }}</p>
          <figure v-for="file in saved" :key="file.id" class="file">
            <div class="file-pic">
              <div class="pic" :style="{ width: `${file.w * Math.min(150 / file.w, 96 / file.h)}px`, height: `${file.h * Math.min(150 / file.w, 96 / file.h)}px`, borderRadius: `${file.radius * Math.min(150 / file.w, 96 / file.h)}px` }">
                <div class="copy" :style="crop(file, Math.min(150 / file.w, 96 / file.h))"><ScreenshotScene :lang="lang" :time="time" :date="date" :tray-on="false" /></div>
              </div>
            </div>
            <figcaption>{{ file.name }}</figcaption>
          </figure>
        </div>
      </div>
    </Transition>

    <Transition name="pop">
      <div v-if="settingsOpen" class="window settings" @pointerdown.stop>
        <div class="titlebar">
          <img src="/BeautyScreenshotLogo.png" alt="" />
          <span class="title">Beauty Screenshot</span>
          <button class="x" type="button" :aria-label="t.close" @click="settingsOpen = false"><svg viewBox="0 0 24 24"><path :d="icons.cancel" /></svg></button>
        </div>
        <div class="settings-page">
          <p class="page-title">{{ t.settingsTitle }}</p>

          <p class="section">{{ t.sCapture }}</p>
          <div class="card">
            <div class="row">
              <div><p class="row-title">{{ t.hotkey }}</p><p class="row-text">{{ t.hotkeyText }}</p></div>
              <span class="button">{{ t.key }}</span>
            </div>
            <i class="divider"></i>
            <div class="row">
              <div><p class="row-title">{{ t.enter }}</p><p class="row-text">{{ t.enterText }}</p></div>
              <div class="segment">
                <button type="button" :class="{ on: settings.action === 'copy' }" @click="settings.action = 'copy'">{{ t.copy }}</button>
                <button type="button" :class="{ on: settings.action === 'save' }" @click="settings.action = 'save'">{{ t.save }}</button>
              </div>
            </div>
          </div>

          <p class="section">{{ t.sSaving }}</p>
          <div class="card">
            <div class="row">
              <div class="grow"><p class="row-title">{{ t.folderRow }}</p><p class="row-text ellipsis">{{ t.folderPath }}</p></div>
              <span class="button">{{ t.change }}</span>
            </div>
            <i class="divider"></i>
            <div class="row">
              <div><p class="row-title">{{ t.copyOnSave }}</p><p class="row-text">{{ t.copyOnSaveText }}</p></div>
              <button class="toggle" type="button" :class="{ on: settings.copyOnSave }" :aria-pressed="settings.copyOnSave" @click="settings.copyOnSave = !settings.copyOnSave"><i></i></button>
            </div>
          </div>

          <p class="section">{{ t.sLook }}</p>
          <div class="card">
            <div class="row">
              <div><p class="row-title">{{ t.radius }}</p><p class="row-text">{{ t.radiusText }}</p></div>
              <div class="slider"><input v-model.number="settings.radius" type="range" min="0" max="24" :style="{ '--p': `${(settings.radius / 24) * 100}%` }" /><span>{{ settings.radius }} px</span></div>
            </div>
            <i class="divider"></i>
            <div class="row">
              <div><p class="row-title">{{ t.dim }}</p><p class="row-text">{{ t.dimText }}</p></div>
              <div class="slider"><input v-model.number="settings.dim" type="range" min="0" max="85" :style="{ '--p': `${(settings.dim / 85) * 100}%` }" /><span>{{ settings.dim }} %</span></div>
            </div>
            <i class="divider"></i>
            <div class="row">
              <div><p class="row-title">{{ t.showHint }}</p><p class="row-text">{{ t.showHintText }}</p></div>
              <button class="toggle" type="button" :class="{ on: settings.showHint }" :aria-pressed="settings.showHint" @click="settings.showHint = !settings.showHint"><i></i></button>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <Transition name="menu">
      <div v-if="menu.open" class="menu" :style="{ left: `${menu.x}px`, bottom: `${size.h - menu.y + 8}px` }" @pointerdown.stop>
        <button type="button" @click="pick('capture')">{{ t.capture }}</button>
        <button type="button" @click="pick('startup')"><svg v-if="settings.startup" viewBox="0 0 24 24"><path :d="icons.check" /></svg>{{ t.startup }}</button>
        <i></i>
        <button type="button" @click="pick('folder')">{{ t.folder }}</button>
        <button type="button" @click="pick('settings')">{{ t.settings }}</button>
        <i></i>
        <button type="button" @click="pick('quit')">{{ t.quit }}</button>
      </div>
    </Transition>

    <Transition name="toast">
      <div v-if="toast && mode === 'idle'" class="toast">
        <img src="/BeautyScreenshotLogo.png" alt="" />
        <div><p class="toast-title">{{ t.activeTitle }}</p><p class="toast-text">{{ t.activeText }}</p></div>
      </div>
    </Transition>

    <div
      v-if="mode !== 'idle'"
      class="overlay"
      @pointerdown="onDown"
      @pointermove="onMove"
      @pointerup="onUp"
    >

      <div v-if="mode === 'armed'" class="dim-all" :style="{ background: `rgb(0 0 0 / ${settings.dim}%)` }"></div>
      <template v-else>
        <div class="hole" :style="{ left: `${rect.x}px`, top: `${rect.y}px`, width: `${rect.w}px`, height: `${rect.h}px`, borderRadius: `${radius}px`, boxShadow: `0 0 0 9999px rgb(0 0 0 / ${settings.dim}%)` }"></div>
        <div class="edge-dark" :style="{ left: `${rect.x - 2}px`, top: `${rect.y - 2}px`, width: `${rect.w + 4}px`, height: `${rect.h + 4}px`, borderRadius: `${radius ? radius + 2 : 0}px` }"></div>
        <div class="edge-light" :style="{ left: `${rect.x - 1}px`, top: `${rect.y - 1}px`, width: `${rect.w + 2}px`, height: `${rect.h + 2}px`, borderRadius: `${radius ? radius + 1 : 0}px` }"></div>
        <svg class="marks" :viewBox="`0 0 ${size.w} ${size.h}`"><path :d="marks" /></svg>
        <span ref="tag" class="size-tag" :style="tagPos">{{ sizeLabel }}</span>
      </template>

      <div v-if="mode === 'selected'" ref="bar" class="toolbar" :style="barPos">
        <button type="button" @click="confirm('copy')"><svg viewBox="0 0 24 24"><path :d="icons.copy" /></svg>{{ t.copy }}</button>
        <button type="button" @click="confirm('save')"><svg viewBox="0 0 24 24"><path :d="icons.save" /></svg>{{ t.save }}</button>
        <i></i>
        <button type="button" class="only-icon" :aria-label="t.cancel" @click="cancel"><svg viewBox="0 0 24 24"><path :d="icons.cancel" /></svg></button>
      </div>

      <p v-if="settings.showHint && mode !== 'selected'" class="hint">{{ t.hint }}</p>
    </div>

    <div
      v-if="shot"
      :key="shot.key"
      ref="shotEl"
      class="thumb"
      :class="{ out: shot.out }"
      :style="{ left: `${shot.left}px`, top: `${shot.top}px`, width: `${shot.pw + 8}px`, height: `${shot.ph + 8}px` }"
      @click="dismiss"
    >
      <div class="pic" :style="{ width: `${shot.pw}px`, height: `${shot.ph}px` }">
        <div class="copy" :style="crop(shot, shot.s)"><ScreenshotScene :lang="lang" :time="time" :date="date" :tray-on="trayOn" /></div>
      </div>
      <span class="badge" :class="{ on: shot.landed && shot.pw >= 90 && shot.ph >= 44 }"><svg viewBox="0 0 24 24"><path :d="icons.check" /></svg>{{ shot.label }}</span>
    </div>
  </div>
</template>

<style scoped>
.screen {
  position: relative;
  height: 100%;
  overflow: hidden;
  border-radius: 12px;
  box-shadow: 0 24px 60px rgb(20 20 45 / 16%), 0 0 0 1px rgb(20 20 45 / 10%);
  font-family: "Segoe UI Variable Text", "Segoe UI", system-ui, sans-serif;
  line-height: normal;
  isolation: isolate;
  user-select: none;
}
button {
  border: 0;
  background: none;
  padding: 0;
  font: inherit;
  color: inherit;
  cursor: default;
}
svg {
  fill: none;
  stroke: currentColor;
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
}
p {
  margin: 0;
}

.overlay {
  position: absolute;
  inset: 0;
  z-index: 20;
  cursor: crosshair;
  touch-action: none;
  animation: fade 0.11s ease-out;
}
.dim-all {
  position: absolute;
  inset: 0;
}
.hole,
.edge-dark,
.edge-light {
  position: absolute;
  pointer-events: none;
}
.edge-dark {
  border: 1px solid rgb(0 0 0 / 22%);
}
.edge-light {
  border: 1px solid rgb(255 255 255 / 94%);
}
.marks {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
.marks path {
  stroke: #fff;
  stroke-width: 3;
}
.size-tag {
  position: absolute;
  padding: 3px 7px 4px;
  border-radius: 4px;
  background: rgb(30 30 30 / 90%);
  color: #f3f3f3;
  font-size: 12px;
  white-space: nowrap;
  pointer-events: none;
}
.toolbar {
  position: absolute;
  display: flex;
  align-items: center;
  padding: 4px;
  border: 1px solid rgb(255 255 255 / 12%);
  border-radius: 8px;
  background: rgb(30 30 30 / 95%);
  box-shadow: 0 3px 18px rgb(0 0 0 / 35%);
  color: #f0f0f0;
  cursor: default;
  animation: rise 0.18s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.toolbar button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 13px 7px 11px;
  border-radius: 5px;
  font-size: 12.5px;
  cursor: pointer;
  transition: background 0.12s;
}
.toolbar button.only-icon {
  padding: 7px 10px;
}
.toolbar button:hover {
  background: rgb(255 255 255 / 14%);
}
.toolbar button:active {
  background: rgb(255 255 255 / 8%);
}
.toolbar svg {
  width: 14px;
  height: 14px;
}
.toolbar i {
  width: 1px;
  align-self: stretch;
  margin: 7px 4px;
  background: rgb(255 255 255 / 16%);
}
.hint {
  position: absolute;
  left: 50%;
  bottom: 72px;
  translate: -50%;
  padding: 5px 14px 6px;
  border-radius: 13px;
  background: rgb(22 22 22 / 70%);
  color: rgb(255 255 255 / 80%);
  font-size: 12px;
  white-space: pre;
  pointer-events: none;
  animation: fade 0.2s ease-out;
}

.thumb {
  position: absolute;
  z-index: 15;
  padding: 4px;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 4px 26px rgb(0 0 0 / 45%);
  transform-origin: 0 0;
  cursor: pointer;
  transition: translate 0.3s cubic-bezier(0.4, 0, 1, 1), opacity 0.3s;
}
.thumb.out {
  translate: calc(100% + 40px) 0;
  opacity: 0;
}
.thumb:hover {
  scale: 1.03;
}
.pic {
  position: relative;
  overflow: hidden;
  border-radius: 6px;
}
.copy {
  position: absolute;
  top: 0;
  left: 0;
  transform-origin: 0 0;
  pointer-events: none;
}
.badge {
  position: absolute;
  left: 10px;
  bottom: 10px;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 2px 8px 3px 7px;
  border-radius: 8px;
  background: rgb(30 30 30 / 85%);
  color: #f2f2f2;
  font-size: 11px;
  opacity: 0;
  transition: opacity 0.2s;
}
.badge.on {
  opacity: 1;
}
.badge svg {
  width: 10px;
  height: 10px;
  stroke-width: 2.4;
}

.toast {
  position: absolute;
  z-index: 12;
  left: 50%;
  bottom: 68px;
  translate: -50%;
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 220px;
  padding: 10px 20px 10px 12px;
  border: 1px solid rgb(0 0 0 / 8%);
  border-radius: 10px;
  background: rgb(251 251 251 / 98%);
  box-shadow: 0 3px 20px rgb(0 0 0 / 18%);
  color: #1b1b1b;
}
.toast img {
  width: 36px;
  height: 36px;
  border-radius: 9px;
}
.toast-title {
  font-size: 13.5px;
  font-weight: 600;
}
.toast-text {
  margin-top: 2px;
  font-size: 12px;
  color: #6b6b6b;
}

.menu {
  position: absolute;
  z-index: 18;
  display: flex;
  flex-direction: column;
  min-width: 230px;
  padding: 4px;
  border: 1px solid rgb(0 0 0 / 8%);
  border-radius: 8px;
  background: rgb(249 249 249 / 96%);
  backdrop-filter: blur(30px);
  box-shadow: 0 8px 24px rgb(0 0 0 / 18%);
  font-size: 13px;
  color: #1b1b1b;
}
.menu button {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 32px;
  padding: 0 12px 0 34px;
  border-radius: 4px;
  text-align: left;
  position: relative;
}
.menu button:hover {
  background: rgb(0 0 0 / 5%);
}
.menu button svg {
  position: absolute;
  left: 11px;
  width: 14px;
  height: 14px;
}
.menu i {
  height: 1px;
  margin: 4px 0;
  background: rgb(0 0 0 / 8%);
}

.window {
  position: absolute;
  z-index: 10;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid rgb(0 0 0 / 12%);
  border-radius: 8px;
  background: #f3f3f3;
  box-shadow: 0 20px 50px rgb(0 0 0 / 30%);
  color: #1b1b1b;
}
.settings {
  top: 5%;
  left: 50%;
  translate: -50%;
  width: min(640px, 92%);
  bottom: calc(48px + 4%);
}
.folder {
  top: 9%;
  left: 7%;
  width: min(620px, 86%);
  bottom: calc(48px + 10%);
}
.titlebar {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 32px;
  flex: none;
  padding-left: 12px;
  font-size: 12px;
}
.titlebar img {
  width: 16px;
  height: 16px;
  border-radius: 4px;
}
.titlebar .title {
  flex: 1;
}
.x {
  display: grid;
  place-items: center;
  width: 46px;
  height: 32px;
}
.x:hover {
  background: #c42b1c;
  color: #fff;
}
.x svg {
  width: 12px;
  height: 12px;
  stroke-width: 1.4;
}

.settings-page {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 22px 26px 24px 30px;
}
.page-title {
  margin: 0 0 22px 2px;
  font-size: 26px;
  font-weight: 600;
}
.section {
  margin: 0 0 8px 2px;
  font-size: 13px;
  font-weight: 600;
}
.card {
  margin-bottom: 26px;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  background: #fbfbfb;
}
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px 14px 18px;
}
.grow {
  flex: 1;
  min-width: 0;
}
.row-title {
  font-size: 14px;
}
.row-text {
  margin-top: 2px;
  font-size: 12px;
  color: #6b6b6b;
}
.ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.divider {
  display: block;
  height: 1px;
  margin: 0 16px 0 18px;
  background: #e5e5e5;
}
.button {
  flex: none;
  padding: 5px 16px 6px;
  border: 1px solid #d6d6d6;
  border-radius: 4px;
  background: #fff;
  font-size: 13px;
  white-space: nowrap;
}
.segment {
  display: flex;
  flex: none;
  padding: 2px;
  border: 1px solid #d6d6d6;
  border-radius: 6px;
  background: #fff;
}
.segment button {
  padding: 4px 14px 5px;
  border-radius: 4px;
  font-size: 13px;
}
.segment button.on {
  background: #2b2b2b;
  color: #fff;
}
.toggle {
  position: relative;
  flex: none;
  width: 40px;
  height: 20px;
  border: 1px solid #8a8a8a;
  border-radius: 10px;
  background: #f9f9f9;
  transition: background 0.15s, border-color 0.15s;
}
.toggle i {
  position: absolute;
  top: 3px;
  left: 4px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #8a8a8a;
  transition: translate 0.15s, background 0.15s;
}
.toggle.on {
  border-color: #2b2b2b;
  background: #2b2b2b;
}
.toggle.on i {
  translate: 19px;
  background: #fff;
}
.slider {
  display: flex;
  flex: none;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}
.slider span {
  width: 44px;
  text-align: right;
}
.slider input {
  width: 160px;
  height: 20px;
  margin: 0;
  background: transparent;
  appearance: none;
  -webkit-appearance: none;
  cursor: pointer;
}
.slider input::-webkit-slider-runnable-track {
  height: 4px;
  border-radius: 2px;
  background: linear-gradient(90deg, #2b2b2b var(--p), #d4d4d4 var(--p));
}
.slider input::-moz-range-track {
  height: 4px;
  border-radius: 2px;
  background: linear-gradient(90deg, #2b2b2b var(--p), #d4d4d4 var(--p));
}
.slider input::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 20px;
  height: 20px;
  margin-top: -8px;
  border: 1px solid #d6d6d6;
  border-radius: 50%;
  background: radial-gradient(circle, #2b2b2b 0 5px, #fff 5.5px);
}
.slider input::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border: 1px solid #d6d6d6;
  border-radius: 50%;
  background: radial-gradient(circle, #2b2b2b 0 5px, #fff 5.5px);
}

.folder-icon {
  width: 16px;
  height: 13px;
  border-radius: 2px;
  background: linear-gradient(180deg, #ffd666 0 35%, #f5b400 35%);
}
.files {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
  align-content: start;
  gap: 8px;
  padding: 14px;
  background: #fff;
}
.empty {
  grid-column: 1 / -1;
  padding: 40px 0;
  color: #6b6b6b;
  font-size: 13px;
  text-align: center;
}
.file {
  display: grid;
  justify-items: center;
  gap: 6px;
  margin: 0;
  padding: 10px 6px;
  border-radius: 4px;
}
.file:hover {
  background: #e5f3ff;
}
.file-pic {
  display: grid;
  place-items: center;
  width: 150px;
  height: 96px;
}
.file .pic {
  box-shadow: 0 1px 4px rgb(0 0 0 / 18%);
}
.file figcaption {
  max-width: 150px;
  font-size: 12px;
  text-align: center;
  overflow-wrap: anywhere;
}

@keyframes fade {
  from { opacity: 0; }
}
@keyframes rise {
  from { opacity: 0; translate: 0 4px; }
}
.pop-enter-active,
.pop-leave-active {
  transition: opacity 0.16s, scale 0.16s;
}
.pop-enter-from,
.pop-leave-to {
  opacity: 0;
  scale: 0.97;
}
.menu-enter-active,
.menu-leave-active {
  transition: opacity 0.12s, translate 0.12s;
}
.menu-enter-from,
.menu-leave-to {
  opacity: 0;
  translate: 0 6px;
}
.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.25s, translate 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  translate: -50% 12px;
}
</style>
