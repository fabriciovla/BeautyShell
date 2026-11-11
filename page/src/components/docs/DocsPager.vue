<script setup>
import { neighbors } from "../../DocsNav.js";

const props = defineProps({
  app: { type: String, required: true },
  lang: { type: String, required: true },
  pageId: { type: String, required: true },
});

const t = {
  es: { prev: "Anterior", next: "Siguiente" },
  en: { prev: "Previous", next: "Next" },
}[props.lang];

const { prev, next } = neighbors(props.app, props.pageId, props.lang);
</script>

<template>
  <nav v-if="prev || next" class="pager" :aria-label="`${t.prev} / ${t.next}`">
    <a v-if="prev" class="pager-card" :href="prev.href">
      <span class="pager-label"><span class="ms" style="font-size: 18px" aria-hidden="true">arrow_back</span>{{ t.prev }}</span>
      <span class="pager-title">{{ prev.title }}</span>
    </a>
    <span v-else></span>
    <a v-if="next" class="pager-card is-next" :href="next.href">
      <span class="pager-label">{{ t.next }}<span class="ms" style="font-size: 18px" aria-hidden="true">arrow_forward</span></span>
      <span class="pager-title">{{ next.title }}</span>
    </a>
    <span v-else></span>
  </nav>
</template>

<style scoped>
.pager {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-top: 64px;
}

.pager-card {
  display: grid;
  gap: 6px;
  border: 1px solid transparent;
  border-radius: 24px;
  background: var(--surface);
  padding: 20px 24px;
  transition: background 0.3s, border-color 0.3s;
}
.pager-card:hover {
  background: var(--surface-hover);
  border-color: var(--border);
}
.pager-card.is-next {
  justify-items: end;
  text-align: right;
}

.pager-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--text-dim);
}
.pager-label .ms {
  transition: transform 0.3s var(--ease);
}
.pager-card:hover .pager-label .ms {
  transform: translateX(-3px);
}
.pager-card.is-next:hover .pager-label .ms {
  transform: translateX(3px);
}

.pager-title {
  font-family: var(--font-title);
  font-size: 20px;
  font-weight: 600;
  letter-spacing: -0.03em;
  color: var(--text);
}

@media (max-width: 640px) {
  .pager {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
