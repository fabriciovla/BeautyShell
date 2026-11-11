<script setup>
import { ref, watch } from "vue";
import { useRoute } from "vue-router";
import MorphModal from "../MorphModal.vue";
import DocsNavList from "./DocsNavList.vue";

const props = defineProps({
  app: { type: String, required: true },
  lang: { type: String, required: true },
  pageId: { type: String, required: true },
});

const t = {
  es: { menu: "Menú", label: "Menú de la documentación", close: "Cerrar" },
  en: { menu: "Menu", label: "Documentation menu", close: "Close" },
}[props.lang];

const modal = ref(null);
const trigger = ref(null);

const route = useRoute();
watch(() => route.path, () => modal.value?.hide());
</script>

<template>
  <button ref="trigger" class="docs-menu-btn" type="button" :aria-label="t.label" @click="modal.show(trigger)">
    <span class="menu-id" data-shared>
      <span class="ms" style="font-size: 20px" aria-hidden="true">menu</span>
      <span class="label">{{ t.menu }}</span>
    </span>
  </button>

  <MorphModal ref="modal" :label="t.label" :width="340" placement="end">
    <template #default="{ close }">
      <div class="menu-panel">
        <div class="menu-head">

          <span class="menu-id is-title" data-shared>
            <span class="ms" style="font-size: 26px" aria-hidden="true">menu</span>
            <span>{{ t.menu }}</span>
          </span>
          <button data-anim class="menu-close" type="button" :aria-label="t.close" @click="close">
            <span class="ms" style="font-size: 22px" aria-hidden="true">close</span>
          </button>
        </div>
        <DocsNavList :app="app" :lang="lang" :page-id="pageId" animated />
      </div>
    </template>
  </MorphModal>
</template>

<style scoped>
.docs-menu-btn {
  display: inline-flex;
  align-items: center;
  height: 38px;
  border: none;
  border-radius: 12px;
  background: var(--surface);
  padding: 0 14px 0 12px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text);
  cursor: pointer;
  transition: background 0.2s;
}
.docs-menu-btn:hover {
  background: var(--surface-hover);
}

.menu-panel {
  display: grid;
  gap: 14px;
  padding: 16px 14px 24px;
}

.menu-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-left: 12px;
}

.menu-id {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text);
}
.menu-id > * {
  display: block;
  line-height: 1;
}
.menu-id.is-title {
  gap: 10.4px;
  font-size: 18.2px;
}

.menu-close {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 12px;
  background: transparent;
  color: var(--text);
  cursor: pointer;
}
.menu-close:hover {
  background: var(--hover-bg);
}

@media (max-width: 640px) {
  .docs-menu-btn {
    width: 38px;
    justify-content: center;
    padding: 0;
  }
  .label {
    display: none;
  }
}
</style>
