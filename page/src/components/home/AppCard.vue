<script setup>
import Button from "../Button.vue";
import WindowsLogo from "../WindowsLogo.vue";
import ScreenshotDemo from "../screenshot/ScreenshotDemo.vue";
import ShellPreview from "./ShellPreview.vue";
import { apps, chrome, routes } from "../../I18n.js";

const props = defineProps({
  id: { type: String, required: true },
  lang: { type: String, required: true },
  description: { type: String, required: true },
  more: { type: String, required: true },
});

const t = chrome[props.lang];
const href = routes[props.lang][props.id];
const app = apps[props.id];
const arrow = '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>';
</script>

<template>
  <article class="group flex flex-col overflow-hidden rounded-24 bg-surface shadow-card">
    <a class="relative block h-300 overflow-hidden isolate phone:h-240" :href="href" tabindex="-1" aria-hidden="true">
      <ShellPreview v-if="id === 'shell'" />
      <ScreenshotDemo v-else :lang="lang" compact />
    </a>

    <div class="grid justify-items-start gap-10 pt-28 px-30 pb-30 phone:pt-24 phone:px-22 phone:pb-26">
      <img class="w-44 h-44 mb-6" :src="app.logo" alt="" width="44" height="44" />
      <h2 class="text-24 font-600 leading-1-2 tracking-03"><a class="rounded-4 focus-ring" :href="href">{{ app.name }}</a></h2>
      <p class="max-w-460 text-soft text-15-5 leading-1-6 text-pretty">{{ description }}</p>
      <div class="flex flex-wrap gap-8 mt-12">
        <Button v-if="app.download" size="small" :href="app.download" data-download>
          <WindowsLogo class="w-14 h-14" />
          {{ t.download }}
        </Button>
        <Button v-else as="span" variant="quiet" size="small" aria-disabled="true">{{ t.soon }}</Button>
        <Button variant="ghost" size="small" :href="href">
          {{ more }}
          <svg class="w-14 h-14" viewBox="0 0 24 24" aria-hidden="true" v-html="arrow" />
        </Button>
      </div>
    </div>
  </article>
</template>
