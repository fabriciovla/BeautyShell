<script setup>

const props = defineProps({
  lang: { type: String, required: true },
  time: { type: String, default: "" },
  date: { type: String, default: "" },
  trayOn: { type: Boolean, default: true },
  trayTitle: { type: String, default: "Beauty Screenshot" },
});
const emit = defineEmits(["capture", "menu"]);

const t = {
  es: { title: "Diez lugares para ver la aurora", tag: "Viajes", by: "Por Ana Varela · 6 min de lectura", site: "revista.viajes" },
  en: { title: "Ten places to see the northern lights", tag: "Travel", by: "By Ana Varela · 6 min read", site: "travel.magazine" },
}[props.lang];
</script>

<template>
  <div class="scene">
    <div class="wallpaper"></div>

    <div class="win">
      <div class="win-bar">
        <span class="win-tab"><img src="/BeautyBrowserLogo.png" alt="" />{{ t.site }}</span>
        <span class="win-ctl"><svg viewBox="0 0 24 24"><path d="M7 12h10" /></svg><svg viewBox="0 0 24 24"><path d="M7.5 7.5h9v9h-9z" /></svg><svg viewBox="0 0 24 24"><path d="m7.5 7.5 9 9m0-9-9 9" /></svg></span>
      </div>
      <div class="win-page">
        <p class="tag">{{ t.tag }}</p>
        <p class="headline">{{ t.title }}</p>
        <p class="by">{{ t.by }}</p>
        <div class="photos">
          <div class="photo aurora"></div>
          <div class="photo fjord"></div>
          <div class="photo lake"></div>
        </div>
        <div class="lines"><i></i><i></i><i class="short"></i></div>
      </div>
    </div>

    <div class="taskbar">
      <div class="apps">
        <span class="app start"><svg viewBox="0 0 14 14"><path d="M0 0h6v6H0zM8 0h6v6H8zM0 8h6v6H0zM8 8h6v6H8z" /></svg></span>
        <span class="app"><svg viewBox="0 0 24 24" class="search"><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4-4" /></svg></span>
        <span class="app"><span class="folder"></span></span>
        <span class="app on"><img src="/BeautyBrowserLogo.png" alt="" /></span>
        <span class="app"><img src="/BeautyShellLogo.png" alt="" /></span>
      </div>
      <div class="tray">
        <svg viewBox="0 0 24 24" class="chev"><path d="m7 14 5-5 5 5" /></svg>
        <button
          v-if="trayOn"
          class="tray-icon"
          type="button"
          :title="trayTitle"
          @click="emit('capture')"
          @contextmenu.prevent="emit('menu', $event)"
        ><img src="/BeautyScreenshotLogo.png" alt="" /></button>
        <svg viewBox="0 0 24 24" class="sys"><path d="M2.5 9.5a14 14 0 0 1 19 0M5.5 12.6a9.5 9.5 0 0 1 13 0M8.6 15.7a5 5 0 0 1 6.8 0" /><circle cx="12" cy="19" r="1" /></svg>
        <svg viewBox="0 0 24 24" class="sys"><path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z" /><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" /></svg>
        <span class="clock"><b>{{ time }}</b><b>{{ date }}</b></span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.scene {
  position: absolute;
  inset: 0;
  overflow: hidden;
  font-family: "Segoe UI Variable Text", "Segoe UI", system-ui, sans-serif;
  color: #1b1b1b;
  line-height: normal;
}
.wallpaper {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(60% 80% at 70% 110%, #2563eb 0%, transparent 60%),
    radial-gradient(45% 60% at 30% 100%, #60a5fa 0%, transparent 65%),
    radial-gradient(70% 60% at 85% 10%, #c7d2fe 0%, transparent 60%),
    linear-gradient(160deg, #dbeafe 0%, #93c5fd 45%, #1e40af 100%);
}

.win {
  position: absolute;
  top: 7%;
  left: 9%;
  right: 9%;
  bottom: calc(48px + 6%);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 20px 50px rgb(0 0 0 / 28%), 0 0 0 1px rgb(0 0 0 / 10%);
}
.win-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 34px;
  flex: none;
  padding: 0 0 0 10px;
  background: #ebebf0;
}
.win-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 26px;
  padding: 0 14px 0 10px;
  border-radius: 7px;
  background: #fff;
  font-size: 12px;
}
.win-tab img {
  width: 14px;
  height: 14px;
  border-radius: 4px;
}
.win-ctl {
  display: flex;
  height: 100%;
}
.win-ctl svg {
  width: 46px;
  height: 14px;
  fill: none;
  stroke: #444;
  stroke-width: 1.2;
}
.win-page {
  flex: 1;
  min-height: 0;
  padding: 4% 7%;
  overflow: hidden;
}
.tag {
  margin: 0;
  color: #2563eb;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.headline {
  margin: 8px 0 6px;
  font-family: Georgia, "Times New Roman", serif;
  font-size: clamp(20px, 2.6vw, 34px);
  line-height: 1.1;
}
.by {
  margin: 0;
  color: #6b6b6b;
  font-size: 12px;
}
.photos {
  display: grid;
  grid-template-columns: 1.6fr 1fr 1fr;
  gap: 12px;
  height: 46%;
  margin: 3% 0;
}
.photo {
  border-radius: 10px;
}
.aurora {
  background:
    radial-gradient(60% 50% at 40% 30%, #7be0a6, transparent 70%),
    radial-gradient(50% 40% at 70% 20%, #a78bfa, transparent 70%),
    linear-gradient(180deg, #0b1d3a, #0f3b4f 60%, #0a1a24);
}
.fjord {
  background: linear-gradient(180deg, #fde68a 0%, #f59e0b 35%, #1f3a5f 36%, #0f2742 100%);
}
.lake {
  background: linear-gradient(180deg, #bae6fd 0%, #7dd3fc 45%, #166534 46%, #14532d 70%, #38bdf8 71%, #0369a1 100%);
}
.lines {
  display: grid;
  gap: 8px;
}
.lines i {
  height: 8px;
  border-radius: 99px;
  background: #ececf1;
}
.lines .short {
  width: 55%;
}

.taskbar {
  position: absolute;
  inset: auto 0 0;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 48px;
  background: rgb(238 242 250 / 85%);
  backdrop-filter: blur(30px) saturate(1.4);
  border-top: 1px solid rgb(255 255 255 / 50%);
}
.apps {
  display: flex;
  gap: 4px;
}
.app {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 5px;
  position: relative;
}
.app.on {
  background: rgb(255 255 255 / 55%);
}
.app.on::after {
  content: "";
  position: absolute;
  bottom: 2px;
  width: 16px;
  height: 3px;
  border-radius: 2px;
  background: #2563eb;
}
.app img {
  width: 24px;
  height: 24px;
  border-radius: 6px;
}
.app svg {
  width: 22px;
  height: 22px;
  fill: #0078d4;
}
.app svg.search {
  fill: none;
  stroke: #333;
  stroke-width: 2;
  width: 20px;
}
.folder {
  width: 24px;
  height: 19px;
  border-radius: 3px;
  background: linear-gradient(180deg, #ffd666 0 35%, #f5b400 35%);
}
.tray {
  position: absolute;
  right: 10px;
  display: flex;
  align-items: center;
  gap: 4px;
  height: 100%;
}
.tray svg {
  width: 16px;
  height: 16px;
  fill: none;
  stroke: #1b1b1b;
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.tray .chev {
  margin-right: 4px;
}
.tray .sys {
  margin: 0 3px;
}
.tray-icon {
  display: grid;
  place-items: center;
  width: 32px;
  height: 40px;
  border: 0;
  border-radius: 5px;
  background: none;
  padding: 0;
  cursor: default;
}
.tray-icon:hover {
  background: rgb(255 255 255 / 60%);
}
.tray-icon img {
  width: 18px;
  height: 18px;
  border-radius: 4px;
}
.clock {
  display: grid;
  justify-items: end;
  margin-left: 6px;
  font-size: 12px;
}
.clock b {
  font-weight: 400;
}

@media (max-width: 720px) {
  .win {
    left: 4%;
    right: 4%;
  }
  .tray .sys,
  .tray .chev,
  .app:nth-child(n + 4) {
    display: none;
  }
}
</style>
