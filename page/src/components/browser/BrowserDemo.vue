<script setup>

import { computed, nextTick, reactive, ref } from "vue";

const props = defineProps({ lang: { type: String, required: true } });

const t = {
  es: {
    region: "Demo de Beauty Browser",
    library: "Historial, descargas y ajustes (Ctrl+H)",
    dock: "Fijar barra lateral (Ctrl+S)",
    undock: "Soltar barra lateral (Ctrl+S)",
    back: "Atrás",
    forward: "Adelante",
    reload: "Volver a cargar",
    url: "Buscar o escribir una URL (Ctrl+L)",
    urlPlaceholder: "Buscá o escribí una dirección",
    copy: "Copiar enlace",
    siteSettings: "Ajustes del sitio",
    clear: "Limpiar",
    clearTip: "Cerrar las demás pestañas de este space",
    newTab: "Nueva pestaña",
    closeTab: "Cerrar pestaña (Ctrl+W)",
    downloads: "Descargas (Ctrl+J)",
    newSpace: "Nuevo space",
    personal: "Personal",
    work: "Trabajo",
    hello: ["Buenos días", "Buenas tardes", "Buenas noches"],
    ask: " · ¿qué buscamos?",
    placeholder: "Buscá en Google o escribí una dirección",
    enter: "para buscar con",
    search: "Buscar",
    searched: "Buscar con Google",
    lofi: "Música para estudiar - YouTube",
    wiki: "Aurora polar - Wikipedia, la enciclopedia libre",
    wikiHost: "es.wikipedia.org",
    notion: "Notas de la reunión - Notion",
    figma: "Sitio nuevo - Figma",
  },
  en: {
    region: "Beauty Browser demo",
    library: "History, downloads and settings (Ctrl+H)",
    dock: "Pin sidebar (Ctrl+S)",
    undock: "Unpin sidebar (Ctrl+S)",
    back: "Back",
    forward: "Forward",
    reload: "Reload",
    url: "Search or type a URL (Ctrl+L)",
    urlPlaceholder: "Search or type an address",
    copy: "Copy link",
    siteSettings: "Site settings",
    clear: "Clear",
    clearTip: "Close the other tabs in this space",
    newTab: "New tab",
    closeTab: "Close tab (Ctrl+W)",
    downloads: "Downloads (Ctrl+J)",
    newSpace: "New space",
    personal: "Personal",
    work: "Work",
    hello: ["Good morning", "Good afternoon", "Good evening"],
    ask: " · what are we looking for?",
    placeholder: "Search Google or type an address",
    enter: "to search with",
    search: "Search",
    searched: "Google Search",
    lofi: "Music to study to - YouTube",
    wiki: "Aurora - Wikipedia",
    wikiHost: "en.wikipedia.org",
    notion: "Meeting notes - Notion",
    figma: "New website - Figma",
  },
}[props.lang];

const icons = {
  library: "M4.5 4h3v16h-3zM9.5 4h3v16h-3zM14.6 5.3l2.9-.8 3.9 15-2.9.8z",
  dock: "M3.5 5h17v14h-17zM9 5v14",
  docked: "M3.5 5h17v14h-17zM9 5v14M5.5 8h1.5M5.5 11h1.5",
  back: "M19 12H5M11 6l-6 6 6 6",
  forward: "M5 12h14M13 6l6 6-6 6",
  reload: "M19.5 12a7.5 7.5 0 1 1-2.2-5.3M19.5 4.5v4h-4",
  link: "M10 14a4 4 0 0 0 5.7 0l3-3A4 4 0 0 0 13 5.3l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3A4 4 0 0 0 11 18.7l1-1",
  check: "M5 12.5l4.5 4.5L19 7.5",
  tune: "M4 8h9M17 8h3M4 16h3M11 16h9M15 6v4M9 14v4",
  plus: "M12 5v14M5 12h14",
  close: "M6 6l12 12M18 6 6 18",
  download: "M12 4v11M7 10l5 5 5-5M5 20h14",
  globe: "M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17zM3.5 12h17M12 3.5c2.4 2.3 3.5 5.2 3.5 8.5s-1.1 6.2-3.5 8.5c-2.4-2.3-3.5-5.2-3.5-8.5s1.1-6.2 3.5-8.5z",
  home: "M4.5 10.5 12 4.5l7.5 6V19.5h-5v-5.5h-5v5.5h-5z",
  work: "M4 8h16v11H4zM9 8V5.5h6V8M4 13h16",
  star: "M12 4l2.5 5.2 5.5.7-4 3.9 1 5.6-5-2.7-5 2.7 1-5.6-4-3.9 5.5-.7z",
  code: "M9 7l-5 5 5 5M15 7l5 5-5 5",
  game: "M7 9h10a4 4 0 0 1 0 8c-1.5 0-2.3-1-3-2h-4c-.7 1-1.5 2-3 2a4 4 0 0 1 0-8zM8 11v3M6.5 12.5h3M15.5 12h.01M17.5 14h.01",
};

const sites = {
  start: { title: t.newTab },
  youtube: { title: "YouTube", host: "youtube.com", icon: "YouTube", hero: "linear-gradient(135deg, #ff8a80, #e52d27 60%, #8c0f0b)" },
  lofi: { title: t.lofi, host: "youtube.com", icon: "YouTube", hero: "linear-gradient(160deg, #2b1e4a, #8a5cf6 55%, #f2a2c0)" },
  spotify: { title: "Spotify - Web Player", host: "open.spotify.com", icon: "Spotify", hero: "linear-gradient(160deg, #1ed760, #0d3b22 70%, #121212)" },
  whatsapp: { title: "WhatsApp", host: "web.whatsapp.com", icon: "WhatsApp", hero: "linear-gradient(135deg, #e7fce3, #25d366 60%, #075e54)" },
  github: { title: "GitHub", host: "github.com", icon: "GitHub", hero: "linear-gradient(135deg, #3d444d, #0d1117)" },
  maps: { title: "Google Maps", host: "google.com", icon: "GoogleMaps", hero: "linear-gradient(135deg, #d6f5e3, #a8dab5 45%, #8ab4f8)" },
  notion: { title: t.notion, host: "notion.so", icon: "Notion", hero: "linear-gradient(135deg, #fbfaf8, #e3e2de)" },
  wiki: { title: t.wiki, host: t.wikiHost, icon: "Wikipedia", serif: true, hero: "linear-gradient(160deg, #0b1d3a 10%, #1c6e5a 55%, #7be0a6 80%, #3a2a6e)" },
  figma: { title: t.figma, host: "figma.com", icon: "Figma", hero: "linear-gradient(135deg, #f24e1e, #a259ff 50%, #1abcfe)" },
  pulls: { title: "Pull requests · GitHub", host: "github.com", icon: "GitHub", hero: "linear-gradient(135deg, #f6f8fa, #d0d7de)" },
};
const favorites = ["youtube", "spotify", "whatsapp", "github", "maps", "notion"];
const mostVisited = ["youtube", "wiki", "github", "maps"];
const heroes = ["linear-gradient(135deg, #e0e7ff, #6366f1)", "linear-gradient(135deg, #fde68a, #f97316)", "linear-gradient(135deg, #cffafe, #0891b2)", "linear-gradient(135deg, #fce7f3, #db2777)"];
const favicon = (name) => `/BrowserFavicons/${name}.png`;

const hour = new Date().getHours();
const hello = t.hello[hour >= 5 && hour < 12 ? 0 : hour >= 12 && hour < 20 ? 1 : 2];

let nextId = 1;
const tab = (page) => reactive({ id: nextId++, history: [page], at: 0 });
const pageOf = (tb) => tb.history[tb.at];
const space = (name, icon, list) => {
  const tabs = list.map((key) => tab(sites[key]));
  return reactive({ name, icon, tabs, active: tabs[0].id });
};
const spaces = reactive([space(t.personal, "home", ["start", "wiki", "lofi"]), space(t.work, "work", ["figma", "pulls", "notion"])]);
const spaceIcons = ["star", "code", "game"];
const current = ref(0);
const sp = computed(() => spaces[current.value]);

const activeTab = computed(() => sp.value.tabs.find((tb) => tb.id === sp.value.active));
const shown = computed(() => {
  const a = sp.value.active;
  return typeof a === "string" ? sites[a.slice(4)] : activeTab.value ? pageOf(activeTab.value) : sites.start;
});
const activeIndex = computed(() => sp.value.tabs.findIndex((tb) => tb.id === sp.value.active));
const url = computed(() => shown.value.host ?? t.newTab);

const loading = ref(0);
const load = () => loading.value++;

function newTab() {
  const tb = tab(sites.start);
  sp.value.tabs.unshift(tb);
  sp.value.active = tb.id;
}
function closeTab(tb) {
  const list = sp.value.tabs;
  const i = list.indexOf(tb);
  list.splice(i, 1);
  if (!list.length) return newTab();
  if (sp.value.active === tb.id) sp.value.active = list[Math.min(i, list.length - 1)].id;
}
function clearSpace() {
  const keep = activeTab.value;
  sp.value.tabs.splice(0, sp.value.tabs.length, ...(keep ? [keep] : []));
}
function openFavorite(key) {
  sp.value.active = "fav:" + key;
  load();
}
function addSpace() {
  if (spaces.length >= 5) return;
  spaces.push(space(`Space ${spaces.length + 1}`, spaceIcons[spaces.length - 2], ["start"]));
  current.value = spaces.length - 1;
}

function pageFor(text) {
  const v = text.trim();
  if (!v) return null;
  const looksLikeAddress = /^[a-z]+:\/\//i.test(v) || (!/\s/.test(v) && /^[^\s/]+\.[a-z]{2,}(\/.*)?$/i.test(v));
  if (!looksLikeAddress) return { title: `${v} - ${t.searched}`, host: "google.com", icon: "Google", query: v };
  const host = v.replace(/^[a-z]+:\/\//i, "").split("/")[0].replace(/^www\./, "");
  const known = Object.values(sites).find((s) => s.host === host);
  return known ?? { title: host, host, hero: heroes[host.length % heroes.length] };
}
function navigate(page) {
  if (!page) return;
  let tb = activeTab.value;
  if (!tb) {
    tb = tab(page);
    sp.value.tabs.unshift(tb);
    sp.value.active = tb.id;
  } else {
    tb.history.splice(tb.at + 1);
    tb.history.push(page);
    tb.at++;
  }
  load();
}
const go = (text) => navigate(pageFor(text));
function step(delta) {
  const tb = activeTab.value;
  if (!tb || !tb.history[tb.at + delta]) return;
  tb.at += delta;
  load();
}
const canBack = computed(() => !!activeTab.value && activeTab.value.at > 0);
const canForward = computed(() => !!activeTab.value && activeTab.value.at < activeTab.value.history.length - 1);

const editing = ref(false);
const draft = ref("");
const urlInput = ref();
async function editUrl() {
  draft.value = shown.value.host ? `https://${shown.value.host}/` : "";
  editing.value = true;
  await nextTick();
  urlInput.value?.select();
}
function submitUrl() {
  editing.value = false;
  go(draft.value);
}

const copied = ref(false);
function copyLink() {
  if (!shown.value.host) return;
  navigator.clipboard?.writeText(`https://${shown.value.host}/`);
  copied.value = true;
  setTimeout(() => (copied.value = false), 1200);
}

const query = ref("");
function search() {
  go(query.value);
  query.value = "";
}

const docked = ref(true);
const peek = ref(false);
const open = computed(() => docked.value || peek.value);
function toggleDock() {
  docked.value = !docked.value;
  peek.value = !docked.value;
}
</script>

<template>
  <div class="window" :class="{ docked }" role="region" :aria-label="t.region">
    <div class="edge" @mouseenter="peek = true" @click="peek = true"></div>

    <aside class="sidebar" :class="{ open }" @mouseleave="peek = false">
      <div class="top">
        <div class="buttons">
          <button class="icon" type="button" :title="t.library"><svg viewBox="0 0 24 24"><path :d="icons.library" /></svg></button>
          <button class="icon" type="button" :title="docked ? t.undock : t.dock" @click="toggleDock"><svg viewBox="0 0 24 24"><path :d="docked ? icons.docked : icons.dock" /></svg></button>
        </div>
        <div class="buttons">
          <button class="icon" :class="{ off: !canBack }" type="button" :title="t.back" @click="step(-1)"><svg viewBox="0 0 24 24"><path :d="icons.back" /></svg></button>
          <button class="icon" :class="{ off: !canForward }" type="button" :title="t.forward" @click="step(1)"><svg viewBox="0 0 24 24"><path :d="icons.forward" /></svg></button>
          <button class="icon" type="button" :title="t.reload" @click="load"><svg viewBox="0 0 24 24"><path :d="icons.reload" /></svg></button>
        </div>
      </div>

      <div class="url">
        <input
          v-if="editing"
          ref="urlInput"
          v-model="draft"
          class="url-input"
          spellcheck="false"
          :placeholder="t.urlPlaceholder"
          @keydown.enter="submitUrl"
          @keydown.esc.stop="editing = false"
          @blur="editing = false"
        />
        <button v-else class="url-text" type="button" :title="t.url" @click="editUrl">{{ url }}</button>
        <button class="icon small" type="button" :title="t.copy" @click="copyLink"><svg viewBox="0 0 24 24"><path :d="copied ? icons.check : icons.link" /></svg></button>
        <button class="icon small" type="button" :title="t.siteSettings"><svg viewBox="0 0 24 24"><path :d="icons.tune" /></svg></button>
      </div>

      <div class="favorites">
        <button v-for="key in favorites" :key="key" class="tile" :class="{ on: sp.active === 'fav:' + key }" type="button" :title="sites[key].title" @click="openFavorite(key)">
          <img :src="favicon(sites[key].icon)" alt="" />
        </button>
      </div>

      <div class="space-name">
        <svg viewBox="0 0 24 24"><path :d="icons[sp.icon]" /></svg>
        {{ sp.name }}
      </div>

      <div class="divider">
        <i></i>
        <button type="button" :title="t.clearTip" @click="clearSpace">{{ t.clear }}</button>
      </div>

      <button class="row" type="button" @click="newTab">
        <svg viewBox="0 0 24 24"><path :d="icons.plus" /></svg>
        {{ t.newTab }}
      </button>

      <div class="tabs">
        <div class="indicator" :class="{ gone: activeIndex < 0 }" :style="{ transform: `translateY(${Math.max(activeIndex, 0) * 44}px)` }"></div>
        <TransitionGroup name="tab">
          <div v-for="tb in sp.tabs" :key="tb.id" class="tab" @click="sp.active = tb.id" @mouseup.middle="closeTab(tb)">
            <img v-if="pageOf(tb).icon" :src="favicon(pageOf(tb).icon)" alt="" />
            <svg v-else class="globe" viewBox="0 0 24 24"><path :d="icons.globe" /></svg>
            <span class="title">{{ pageOf(tb).title }}</span>
            <button class="close" type="button" :title="t.closeTab" @click.stop="closeTab(tb)"><svg viewBox="0 0 24 24"><path :d="icons.close" /></svg></button>
          </div>
        </TransitionGroup>
      </div>

      <div class="bottom">
        <button class="icon" type="button" :title="t.downloads"><svg class="s16" viewBox="0 0 24 24"><path :d="icons.download" /></svg></button>
        <div class="dots">
          <button v-for="(s, i) in spaces" :key="s.name" class="dot" :class="{ on: i === current }" type="button" :title="s.name" @click="current = i">
            <svg viewBox="0 0 24 24"><path :d="icons[s.icon]" /></svg>
          </button>
        </div>
        <button class="icon" type="button" :title="t.newSpace" @click="addSpace"><svg viewBox="0 0 24 24"><path :d="icons.plus" /></svg></button>
      </div>
    </aside>

    <div class="page">
      <i v-if="loading" :key="loading" class="loadbar"></i>
      <Transition name="page" mode="out-in">

        <div v-if="!shown.host" :key="'start' + sp.active" class="start">
          <img class="logo" src="/BeautyBrowserLogo.png" alt="" />
          <p class="hello">{{ hello }}<span>{{ t.ask }}</span></p>
          <form @submit.prevent="search">
            <div class="search">
              <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
              <input v-model="query" :placeholder="t.placeholder" spellcheck="false" />
            </div>
            <div class="foot">
              <div><kbd>Enter</kbd> {{ t.enter }} <b>Google</b></div>
              <button class="go" :class="{ on: query.trim() }" :aria-label="t.search"><svg viewBox="0 0 24 24"><path d="M12 19V5M5 12l7-7 7 7" /></svg></button>
            </div>
          </form>
          <nav>
            <a v-for="key in mostVisited" :key="key" @click="navigate(sites[key])">
              <img :src="favicon(sites[key].icon)" alt="" />{{ sites[key].title.split(" - ")[0] }}
            </a>
          </nav>
        </div>

        <div v-else-if="shown.query" :key="shown.title" class="results">
          <div class="results-bar">
            <img :src="favicon('Google')" alt="" />
            <span class="results-box">{{ shown.query }}</span>
          </div>
          <div v-for="n in 4" :key="n" class="result">
            <i class="r-host"></i>
            <b v-if="n === 1">{{ shown.query }}</b><i v-else class="r-title"></i>
            <i></i><i class="short"></i>
          </div>
        </div>

        <div v-else :key="shown.title" class="site">
          <div class="site-bar">
            <img v-if="shown.icon" :src="favicon(shown.icon)" alt="" />
            <b>{{ shown.host }}</b>
            <i></i><i></i><i></i>
          </div>
          <div class="site-hero" :style="{ background: shown.hero }"></div>
          <p class="site-title" :class="{ serif: shown.serif }">{{ shown.title.split(" - ")[0] }}</p>
          <div class="lines"><i></i><i></i><i class="short"></i></div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped>

.window {
  position: relative;
  display: grid;
  height: 100%;
  border-radius: 8px;
  background: #ebebf0;
  box-shadow: 0 24px 60px rgb(20 20 45 / 14%), 0 6px 20px rgb(20 20 45 / 6%), 0 0 0 1px rgb(20 20 45 / 10%);
  overflow: hidden;
  font-family: "Segoe UI Variable Text", "Segoe UI", system-ui, sans-serif;
  font-size: 14px;
  line-height: normal;
  color: #1f1f24;
  text-align: left;
  user-select: none;
}
button { border: 0; background: none; padding: 0; font: inherit; color: inherit; cursor: default; }
input { border: 0; outline: 0; background: transparent; font: inherit; color: inherit; min-width: 0; }
svg { width: 14px; height: 14px; flex: none; fill: none; stroke: currentColor; stroke-width: 1.5; stroke-linecap: round; stroke-linejoin: round; }
svg.s16 { width: 16px; height: 16px; }

.sidebar {
  position: absolute; inset: 0 auto 0 0; z-index: 2; width: 264px;
  display: flex; flex-direction: column; gap: 6px; min-height: 0;
  padding: 10px 8px 8px 10px;
  border-radius: 8px;
  border-right: 1px solid rgb(0 0 0 / 10%);
  background: rgb(244 244 247 / 88%);
  backdrop-filter: blur(30px) saturate(1.3);
  box-shadow: 0 16px 40px rgb(0 0 0 / 18%), 0 2px 8px rgb(0 0 0 / 8%);
  opacity: 0; transform: translateX(-296px); pointer-events: none;
  transition: transform .17s ease, opacity .14s ease, box-shadow .2s;
}
.sidebar.open { opacity: 1; transform: none; pointer-events: auto; transition: transform .17s ease, box-shadow .2s; }
.docked .sidebar { box-shadow: none; background: rgb(244 244 247 / 72%); }
.edge { position: absolute; inset: 0 auto 0 0; z-index: 1; width: 14px; }
.top, .buttons { display: flex; align-items: center; gap: 2px; }
.top { justify-content: space-between; }
.icon { display: grid; place-items: center; width: 28px; height: 28px; border-radius: 8px; transition: background .1s, opacity .1s; }
.icon:hover { background: rgb(0 0 0 / 5%); }
.icon:active { background: rgb(0 0 0 / 8%); }
.icon.off { opacity: .35; }
.icon.off:hover { background: none; }
.icon.small svg { width: 13px; height: 13px; }

.url {
  display: flex; align-items: center; gap: 2px; height: 38px; padding: 0 4px 0 0;
  border-radius: 8px; background: rgb(0 0 0 / 5.5%); transition: background .1s;
}
.url:hover { background: rgb(0 0 0 / 9.4%); }
.url-text, .url-input { flex: 1; min-width: 0; height: 100%; padding: 0 12px; text-align: left; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.url-input { cursor: text; user-select: text; }
.url .icon:hover { background: rgb(0 0 0 / 8%); }

.favorites { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin: 4px 0 2px; }
.tile {
  display: grid; place-items: center; height: 44px; border-radius: 8px;
  background: rgb(255 255 255 / 55%); border: 1px solid rgb(0 0 0 / 7%);
  transition: background .12s, border-color .12s;
}
.tile:hover { background: rgb(255 255 255 / 78%); }
.tile.on { background: #fff; border-color: rgb(42 42 51 / 23%); }
.tile img { width: 20px; height: 20px; }

.space-name { display: flex; align-items: center; gap: 8px; margin: 4px 0 0 8px; color: #8a8a94; font-size: 13px; font-weight: 600; }
.space-name svg { width: 15px; height: 15px; }

.divider { display: flex; align-items: center; gap: 8px; margin-left: 4px; }
.divider i { flex: 1; height: 1px; background: rgb(0 0 0 / 8%); }
.divider button { padding: 2px 4px; border-radius: 4px; color: #8a8a94; font-size: 11px; }
.divider button:hover { text-decoration: underline; }

.row { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 8px; color: #8a8a94; transition: background .1s; }
.row:hover { background: rgb(0 0 0 / 5%); }
.row svg { width: 13px; height: 13px; }

.tabs { position: relative; flex: 1; min-height: 0; padding-top: 4px; overflow: hidden; }
.indicator {
  position: absolute; top: 5px; left: 0; right: 0; height: 42px; border-radius: 8px;
  background: #fff; border: 1px solid rgb(0 0 0 / 6%); box-shadow: 0 1px 0 rgb(0 0 0 / 5%);
  transition: transform .28s cubic-bezier(.2, .9, .25, 1), opacity .14s;
}
.indicator.gone { opacity: 0; }
.tab { position: relative; display: flex; align-items: center; gap: 10px; height: 42px; margin: 1px 0; padding: 0 8px 0 10px; border-radius: 8px; transition: background .1s; }
.tab:hover { background: rgb(0 0 0 / 5%); }
.tab img { width: 16px; height: 16px; flex: none; }
.tab .globe { width: 14px; height: 14px; margin: 0 1px; color: #8a8a94; }
.title { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.close { display: grid; place-items: center; width: 22px; height: 22px; border-radius: 11px; color: #8a8a94; opacity: 0; transition: opacity .1s, background .1s; }
.close svg { width: 8px; height: 8px; stroke-width: 2; }
.tab:hover .close { opacity: 1; }
.close:hover { background: rgb(0 0 0 / 7%); color: #1f1f24; }
.tab-enter-from, .tab-leave-to { opacity: 0; }
.tab-enter-active, .tab-leave-active { transition: opacity .18s; }
.tab-leave-active { position: absolute; left: 0; right: 0; }
.tab-move { transition: transform .28s cubic-bezier(.2, .9, .25, 1); }

.bottom { position: relative; display: flex; align-items: center; justify-content: space-between; height: 40px; }
.bottom > .icon { width: 30px; height: 30px; }
.dots { position: absolute; left: 50%; translate: -50%; display: flex; gap: 4px; }
.dot { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 8px; color: #8a8a94; transition: background .12s; }
.dot svg { width: 16px; height: 16px; }
.dot:hover { background: rgb(0 0 0 / 5%); }
.dot.on { background: #fff; color: #1f1f24; }

.page { position: relative; margin: 8px; border-radius: 8px; overflow: hidden; background: #fff; transition: margin-left .2s cubic-bezier(.2, .9, .25, 1); }
.docked .page { margin-left: 272px; }
.page > :not(.loadbar) { position: absolute; inset: 0; }
.page-enter-active, .page-leave-active { transition: opacity .16s ease; }
.page-enter-from, .page-leave-to { opacity: 0; }

.loadbar {
  position: absolute; z-index: 3; top: 0; left: 0; right: 0; height: 3px; border-radius: 1.5px;
  background: #2f6feb; transform-origin: center; animation: load .7s cubic-bezier(.2, .8, .2, 1) forwards;
}
@keyframes load {
  0% { transform: scaleX(0); opacity: 1; }
  70% { transform: scaleX(1); opacity: 1; }
  100% { transform: scaleX(1); opacity: 0; }
}

.start {
  display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 0 6% 7%;
  background: radial-gradient(1200px 760px at 50% -12%, #fff 0%, #f4f4f7 46%, #e8e9ef 100%);
}
.start .logo { width: 66px; height: 66px; border-radius: 16px; box-shadow: 0 12px 22px rgb(70 50 160 / 25%); animation: float 7s ease-in-out infinite; }
.hello { margin: 22px 0 20px; font-size: 27px; font-weight: 600; letter-spacing: -.02em; text-align: center; }
.hello span { color: #8a8a94; font-weight: 500; }
.start form {
  width: min(660px, 100%); padding: 16px 14px 12px 18px; border-radius: 18px; background: #fff;
  border: 1px solid rgb(0 0 0 / 6%); box-shadow: 0 1px 2px rgb(0 0 0 / 4%), 0 14px 44px rgb(22 22 44 / 8%);
  transition: box-shadow .25s, border-color .25s;
}
.start form:focus-within { border-color: rgb(47 111 235 / 32%); box-shadow: 0 1px 2px rgb(0 0 0 / 4%), 0 18px 54px rgb(47 111 235 / 14%); }
.search { display: flex; align-items: center; gap: 12px; }
.search svg { width: 18px; height: 18px; stroke-width: 2; color: #9a9aa3; }
.search input { flex: 1; font-size: 17px; cursor: text; user-select: text; }
.search input::placeholder { color: #9a9aa3; }
.foot { display: flex; align-items: center; justify-content: space-between; margin-top: 14px; font-size: 12.5px; color: #9a9aa3; }
.foot b { color: #6b6b75; font-weight: 600; }
kbd { font: inherit; font-size: 11px; padding: 1px 6px; border-radius: 6px; background: #f1f1f4; color: #6b6b75; border: 1px solid rgb(0 0 0 / 5%); }
.go { display: grid; place-items: center; width: 32px; height: 32px; border-radius: 10px; background: #1f1f24; color: #fff; opacity: .18; transition: opacity .15s, transform .15s; }
.go.on { opacity: 1; }
.go:active { transform: scale(.94); }
.go svg { width: 16px; height: 16px; stroke-width: 2.4; }
.start nav { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; width: min(660px, 100%); margin-top: 26px; }
.start nav a {
  display: flex; align-items: center; gap: 10px; min-width: 0; padding: 10px 12px; border-radius: 12px;
  background: rgb(255 255 255 / 58%); border: 1px solid rgb(0 0 0 / 5%); font-size: 13px;
  white-space: nowrap; overflow: hidden; cursor: pointer; transition: background .15s, transform .15s, box-shadow .15s;
}
.start nav a:hover { background: #fff; transform: translateY(-1px); box-shadow: 0 6px 18px rgb(22 22 44 / 6%); }
.start nav img { width: 20px; height: 20px; border-radius: 5px; flex: none; }

.results { display: flex; flex-direction: column; gap: 26px; padding: 0 40px; overflow: hidden; }
.results-bar { display: flex; align-items: center; gap: 18px; height: 76px; flex: none; border-bottom: 1px solid rgb(0 0 0 / 6%); margin: 0 -40px; padding: 0 40px; }
.results-bar img { width: 28px; height: 28px; }
.results-box { width: min(560px, 70%); padding: 10px 20px; border-radius: 99px; box-shadow: 0 1px 6px rgb(32 33 36 / 18%); font-size: 15px; }
.result { display: grid; gap: 8px; max-width: 600px; }
.result b { color: #1a0dab; font-size: 19px; font-weight: 400; }
.result i { height: 9px; border-radius: 99px; background: #ececf1; }
.result .r-host { width: 30%; height: 8px; }
.result .r-title { width: 60%; height: 14px; background: #d6dcf5; }
.result .short { width: 45%; }

.site { display: flex; flex-direction: column; gap: 18px; padding: 0 0 28px; }
.site-bar { display: flex; align-items: center; gap: 10px; height: 56px; flex: none; padding: 0 28px; border-bottom: 1px solid rgb(0 0 0 / 6%); }
.site-bar img { width: 20px; height: 20px; }
.site-bar b { margin-right: auto; font-weight: 600; }
.site-bar i { width: 54px; height: 8px; border-radius: 99px; background: #ececf1; }
.site-hero { flex: 1; min-height: 0; margin: 0 28px; border-radius: 14px; }
.site-title { padding: 0 28px; font-size: clamp(20px, 2.4vw, 30px); font-weight: 700; letter-spacing: -.02em; }
.site-title.serif { font-family: Georgia, "Times New Roman", serif; font-weight: 400; }
.lines { display: grid; gap: 10px; padding: 0 28px; }
.lines i { height: 9px; border-radius: 99px; background: #ececf1; }
.lines i.short { width: 45%; }

@keyframes float { 50% { transform: translateY(-3px); } }

@media (max-width: 720px) {
  .sidebar, .edge { display: none; }
  .docked .page { margin-left: 8px; }
  .start nav { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
</style>
