<script setup>
import WindowsLogo from "./WindowsLogo.vue";
import { apps, chrome, routes } from "../I18n.js";

const props = defineProps({
  lang: { type: String, required: true },
  app: { type: String, default: undefined },
  altHref: { type: String, default: undefined },
});

const r = routes[props.lang];
const t = chrome[props.lang];
const current = props.app ? apps[props.app] : null;
const backLabel = { es: "Volver al inicio", en: "Back to home" }[props.lang];
</script>

<template>
  <header class="site-header">
    <div class="header-inner">
      <a class="back" :href="r.home">
        <span class="ms" style="font-size: 20px" aria-hidden="true">arrow_back</span>
        {{ backLabel }}
      </a>

      <nav class="actions">
        <slot name="actions" />
        <a v-if="altHref" class="lang-switch" :href="altHref">{{ t.otherLang }}</a>
        <a v-if="current" class="download" :href="current.download" data-download>
          <WindowsLogo class="w-14 h-14" />
          <span class="download-label">{{ t.download }}</span>
        </a>
      </nav>
    </div>
  </header>
</template>

<style scoped>
.site-header {
  position: sticky;
  top: 0;
  z-index: 40;
  background: color-mix(in srgb, var(--bg) 86%, transparent);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  max-width: 1320px;
  height: 64px;
  margin: 0 auto;
  padding: 0 24px;
}

.back {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 38px;
  border-radius: 12px;
  background: var(--surface);
  padding: 0 14px 0 10px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text);
  white-space: nowrap;
  transition: background 0.2s;
}
.back:hover {
  background: var(--surface-hover);
}

.actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.lang-switch {
  display: inline-flex;
  align-items: center;
  height: 38px;
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 0 14px;
  font-size: 14px;
  font-weight: 500;
  transition: background 0.2s;
}
.lang-switch:hover {
  background: var(--hover-bg);
}

.download {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 38px;
  border-radius: 9999px;
  padding: 0 16px;
  background: #09090d;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.32), 0 1px 2px rgba(0, 0, 0, 0.16);
  transition: background 0.2s;
}
.download:hover {
  background: #1c1c26;
}

@media (max-width: 640px) {
  .header-inner {
    padding: 0 16px;
  }
  .download-label {
    display: none;
  }

  .actions:has(> :not(.lang-switch, .download)) .lang-switch {
    display: none;
  }
  .download {
    width: 38px;
    justify-content: center;
    padding: 0;
  }
}

</style>
