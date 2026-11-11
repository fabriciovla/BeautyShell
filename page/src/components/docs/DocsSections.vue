<script setup>
import { nextTick, ref, shallowRef } from "vue";
import MorphModal from "../MorphModal.vue";
import { DOCS, docHref } from "../../DocsNav.js";

const props = defineProps({
  app: { type: String, required: true },
  lang: { type: String, required: true },
});

const t = {
  es: { title: "Secciones", close: "Cerrar" },
  en: { title: "Sections", close: "Close" },
}[props.lang];

const groups = DOCS[props.app];
const modal = ref(null);
const current = shallowRef(groups[0]);

async function openGroup(group, event) {
  const card = event.currentTarget;
  current.value = group;
  await nextTick();
  modal.value.show(card);
}
</script>

<template>
  <section class="sections" :aria-label="t.title">
    <button v-for="group in groups" :key="group.title.en" class="section-card" type="button" data-section-card @click="openGroup(group, $event)">
      <span class="section-head" data-shared>
        <span class="ms section-icon" aria-hidden="true">{{ group.icon }}</span>
        <span class="section-title">{{ group.title[lang] }}</span>
      </span>
    </button>
  </section>

  <MorphModal ref="modal" :label="current.title[lang]" :width="440">
    <template #default="{ close }">
      <div class="group-panel">
        <div class="group-top">
          <span class="section-head" data-shared>
            <span class="ms section-icon" aria-hidden="true">{{ current.icon }}</span>
            <span class="section-title">{{ current.title[lang] }}</span>
          </span>
          <button data-anim class="group-close" type="button" :aria-label="t.close" @click="close">
            <span class="ms" style="font-size: 22px" aria-hidden="true">close</span>
          </button>
        </div>
        <nav class="group-links">
          <a v-for="p in current.pages" :key="p.id" data-anim class="group-link" :href="docHref(app, p.id, lang)">{{ p.title[lang] }}</a>
        </nav>
      </div>
    </template>
  </MorphModal>
</template>

<style scoped>
.sections {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.section-card {
  display: flex;
  align-items: flex-end;
  min-height: 220px;
  border: 1px solid transparent;
  border-radius: 36px;
  background: var(--surface);
  padding: 30px;
  font: inherit;
  color: var(--text);
  cursor: pointer;
  transition: background 0.3s, border-color 0.3s;
}
.section-card:hover {
  background: var(--surface-hover);
  border-color: var(--border);
}
.section-card:focus-visible {
  outline: 2px solid var(--text);
  outline-offset: 4px;
}

.section-head {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 14px;
  text-align: left;
  color: var(--text);
}

.section-icon {
  --fill: 0;
  --wght: 400;
  font-size: 30px;
}

.section-title {
  font-family: var(--font-title);
  font-size: 30px;
  font-weight: 600;
  letter-spacing: -0.04em;
  line-height: 1.05;
  white-space: nowrap;
}

.group-panel {
  display: grid;
  gap: 18px;
  padding: 30px 18px 18px;
}

.group-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding-left: 12px;
}

.group-close {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  margin: -6px -2px 0 0;
  border: none;
  border-radius: 12px;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}
.group-close:hover {
  background: var(--hover-bg);
  color: var(--text);
}

.group-links {
  display: grid;
  gap: 2px;
}

.group-link {
  display: flex;
  align-items: center;
  min-height: 48px;
  border-radius: 14px;
  padding: 0 12px;
  font-size: 16px;
  color: var(--text-muted);
  transition: background 0.2s, color 0.2s;
}
.group-link:hover {
  background: var(--hover-bg);
  color: var(--text);
}

@media (max-width: 640px) {
  .section-card {
    min-height: 170px;
    border-radius: 28px;
    padding: 24px;
  }
}
</style>
