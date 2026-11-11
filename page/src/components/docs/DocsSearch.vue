<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import MorphModal from "../MorphModal.vue";
import { DOCS, DOCS_HOME, docHref } from "../../DocsNav.js";

const props = defineProps({
  app: { type: String, required: true },
  lang: { type: String, required: true },
});

const t = {
  es: { search: "Buscar", label: "Buscar en la documentación", empty: "No hay páginas que coincidan." },
  en: { search: "Search", label: "Search the documentation", empty: "No pages match." },
}[props.lang];

const fold = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const entries = [
  { id: DOCS_HOME.id, title: DOCS_HOME.title[props.lang], group: "", href: docHref(props.app, DOCS_HOME.id, props.lang) },
  ...DOCS[props.app].flatMap((g) =>
    g.pages.map((p) => ({ id: p.id, title: p.title[props.lang], group: g.title[props.lang], href: docHref(props.app, p.id, props.lang) })),
  ),
].map((e) => ({ ...e, key: fold(`${e.title} ${e.group}`) }));

const modal = ref(null);
const trigger = ref(null);
const list = ref(null);
const query = ref("");
const active = ref(0);

const results = computed(() => {
  const words = fold(query.value).split(/\s+/).filter(Boolean);
  return words.length ? entries.filter((e) => words.every((w) => e.key.includes(w))) : entries;
});

watch(query, () => (active.value = 0));

const route = useRoute();
const router = useRouter();
watch(() => route.path, () => modal.value?.hide());

function scrollActive() {
  list.value?.querySelector(`[data-index="${active.value}"]`)?.scrollIntoView({ block: "nearest" });
}

function onInputKey(event) {
  const n = results.value.length;
  if (event.key === "ArrowDown" && n) {
    event.preventDefault();
    active.value = (active.value + 1) % n;
    scrollActive();
  } else if (event.key === "ArrowUp" && n) {
    event.preventDefault();
    active.value = (active.value - 1 + n) % n;
    scrollActive();
  } else if (event.key === "Enter" && n) {
    event.preventDefault();
    const href = results.value[active.value].href;
    if (href === route.path) modal.value.hide();
    else router.push(href);
  }
}

function openSearch() {
  modal.value.show(trigger.value);
}

function onGlobalKey(event) {
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName ?? "");
  if ((event.key === "k" || event.key === "K") && (event.ctrlKey || event.metaKey)) {
    event.preventDefault();
    openSearch();
  } else if (event.key === "/" && !typing) {
    event.preventDefault();
    openSearch();
  }
}

onMounted(() => {
  window.addEventListener("keydown", onGlobalKey);
});
onBeforeUnmount(() => window.removeEventListener("keydown", onGlobalKey));
</script>

<template>
  <button ref="trigger" class="search-btn" type="button" :aria-label="t.label" @click="openSearch">

    <span class="search-id" data-shared>
      <span class="ms" style="font-size: 19px" aria-hidden="true">search</span>
      <span class="search-text">{{ t.search }}</span>
    </span>
  </button>

  <MorphModal ref="modal" :label="t.label" :width="440" placement="end" autofocus="input" @closed="query = ''">
    <div class="search-panel">
      <label class="field">
        <span class="search-id is-field" data-shared>
          <span class="ms" style="font-size: 22.8px" aria-hidden="true">search</span>
          <span class="search-text" :class="{ 'is-hidden': query }">{{ t.search }}</span>
        </span>
        <input
          v-model="query"
          data-anim
          type="text"
          :aria-label="t.label"
          autocomplete="off"
          spellcheck="false"
          @keydown="onInputKey"
        />
      </label>

      <ul v-if="results.length" ref="list" class="results" role="listbox">
        <li v-for="(e, i) in results" :key="e.id" data-anim role="option" :aria-selected="i === active">
          <a
            class="result"
            :class="{ 'is-active': i === active }"
            :href="e.href"
            :data-index="i"
            tabindex="-1"
            @mousemove="active = i"
          >
            <span class="result-title">{{ e.title }}</span>
            <span class="result-group">{{ e.group }}</span>
          </a>
        </li>
      </ul>
      <p v-else data-anim class="empty">{{ t.empty }}</p>
    </div>
  </MorphModal>
</template>

<style scoped>
.search-btn {
  display: inline-flex;
  align-items: center;
  height: 38px;
  border: none;
  border-radius: 12px;
  background: var(--surface);
  padding: 0 16px 0 12px;
  color: var(--text-muted);
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}
.search-btn:hover {
  background: var(--surface-hover);
  color: var(--text);
}

.search-id {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--text-muted);
  font-size: 14px;
  pointer-events: none;
}
.search-id > * {
  display: block;
  line-height: 1.2;
}
.search-id .ms {
  line-height: 1;
}
.search-btn .search-text {
  min-width: 96px;
  text-align: left;
}
.search-id.is-field {
  gap: 9.6px;
  font-size: 16.8px;
}
.search-text.is-hidden {
  visibility: hidden;
}

.search-panel {
  display: grid;
  gap: 8px;
  padding: 10px;
}

.field {
  position: relative;
  display: flex;
  align-items: center;
  height: 52px;
  border-radius: 18px;
  background: var(--surface);
  padding: 0 16px;
}

.field input {
  position: absolute;
  inset: 0;
  width: 100%;
  border: none;
  background: transparent;
  outline: none;
  padding: 0 16px 0 calc(16px + 22.8px + 9.6px);
  font: inherit;
  font-size: 16.8px;
  color: var(--text);
  -webkit-user-select: text;
  user-select: text;
}

.results {
  display: grid;
  gap: 2px;
  margin: 0;
  padding: 4px 0;
  list-style: none;
}

.result {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 46px;
  border-radius: 14px;
  padding: 0 14px;
  color: var(--text-body);
}
.result.is-active {
  background: var(--hover-bg);
  color: var(--text);
}
.result-title {
  font-size: 15px;
  font-weight: 500;
}
.result-group {
  margin-left: auto;
  font-size: 13px;
  color: var(--text-dim);
}

.empty {
  padding: 28px 14px;
  text-align: center;
  font-size: 14.5px;
  color: var(--text-dim);
}

@media (max-width: 640px) {
  .search-btn {
    width: 38px;
    justify-content: center;
    padding: 0;
  }
  .search-btn .search-text {
    display: none;
  }
}
</style>
