<script setup>
import { DOCS, DOCS_HOME, docHref } from "../../DocsNav.js";

defineProps({
  app: { type: String, required: true },
  lang: { type: String, required: true },
  pageId: { type: String, required: true },

  animated: { type: Boolean, default: false },
});
</script>

<template>
  <div class="nav-list">
    <a
      class="nav-link is-home"
      :class="{ 'is-current': pageId === DOCS_HOME.id }"
      :href="docHref(app, DOCS_HOME.id, lang)"
      :aria-current="pageId === DOCS_HOME.id ? 'page' : undefined"
      :data-anim="animated ? '' : undefined"
      data-nav-item
    >
      <span class="ms" style="font-size: 18px" aria-hidden="true">menu_book</span>
      {{ DOCS_HOME.title[lang] }}
    </a>

    <section v-for="group in DOCS[app]" :key="group.title.en" class="nav-group" :data-anim="animated ? '' : undefined" data-nav-item>
      <h2 class="nav-title">{{ group.title[lang] }}</h2>
      <a
        v-for="p in group.pages"
        :key="p.id"
        class="nav-link"
        :class="{ 'is-current': p.id === pageId }"
        :href="docHref(app, p.id, lang)"
        :aria-current="p.id === pageId ? 'page' : undefined"
      >{{ p.title[lang] }}</a>
    </section>
  </div>
</template>

<style scoped>
.nav-list {
  display: grid;
  gap: 18px;
}

.nav-group {
  display: grid;
  gap: 2px;
}

.nav-title {
  padding: 0 12px 6px;
  font-family: var(--font-title);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--text-dim);
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 36px;
  border-radius: 12px;
  padding: 0 12px;
  font-size: 14.5px;
  color: var(--text-muted);
  transition: background 0.2s, color 0.2s;
}
.nav-link:hover {
  background: var(--hover-bg);
  color: var(--text);
}
.nav-link.is-current {
  background: rgba(20, 20, 45, 0.07);
  color: var(--text);
  font-weight: 600;
}
.nav-link.is-home {
  font-weight: 500;
  color: var(--text);
}
.nav-link:focus-visible {
  outline: 2px solid var(--text);
  outline-offset: -2px;
}
</style>
