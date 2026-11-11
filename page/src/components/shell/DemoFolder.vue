<script setup>
import DemoTab from "./DemoTab.vue";
import { folderBox, folderHead } from "./DemoStyles.js";
import { icons } from "./ShellIcons.js";

defineProps({
  demo: { type: Object, required: true },
  folder: { type: String, required: true },
});
</script>

<template>
  <div :class="folderBox">
    <button :class="['group button-reset focus-ring-in hover:text-soft', folderHead]" type="button" :aria-expanded="!demo.isShut(folder)" @click="demo.toggleFolder(folder)"><svg class="w-13 h-13" viewBox="0 0 24 24" aria-hidden="true" v-html="icons.folder" /> <span class="flex-1 min-w-0 truncate">{{ folder }}</span><span :class="['font-500', { hidden: !demo.isShut(folder) }]">{{ demo.tabsIn(folder).length }}</span><svg :class="['w-11 h-11 transition-chevron group-hover:opacity-100', demo.isShut(folder) ? 'opacity-100 rotate-0' : 'opacity-0 rotate-90']" viewBox="0 0 24 24" aria-hidden="true" v-html="icons.chevron" /></button>
    <div :class="['space-y-2', { hidden: demo.isShut(folder) }]">
      <DemoTab v-for="tab in demo.tabsIn(folder)" :key="tab.id" :demo="demo" :tab="tab" />
    </div>
  </div>
</template>
