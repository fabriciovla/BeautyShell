<script setup>
import { tabBox, tabState } from "./DemoStyles.js";
import { icons } from "./ShellIcons.js";

defineProps({
  demo: { type: Object, required: true },
  tab: { type: Object, required: true },
});
</script>

<template>
  <div
    :class="[tabBox, tabState(tab === demo.active)]"
    role="button"
    tabindex="0"
    :aria-pressed="tab === demo.active"
    @click="demo.activate(tab, true)"
    @keydown="demo.onTabKey($event, tab)"
  >
    <svg class="w-16 h-16" viewBox="0 0 24 24" aria-hidden="true" v-html="icons[tab.icon]" />
    <span class="grid flex-1 min-w-0 leading-1-25"><b class="truncate font-500">{{ tab.title }}</b><small v-if="tab.sub" class="truncate text-faint text-11-5">{{ tab.sub }}</small></span>
    <i v-if="demo.isBusy(tab)" class="shrink-0 w-12 h-12 mr-5 spinner group-hover:hidden" aria-hidden="true"></i>
    <button v-if="demo.tabs.length > 1" class="button-reset hidden place-items-center shrink-0 w-22 h-22 p-0 rounded-6 text-faint transition-colors group-hover:grid hover:bg-black-6 hover:text-ink" type="button" :aria-label="demo.ui.closeTab" tabindex="-1" @click.stop="demo.closeTab(tab)"><svg class="w-12 h-12" viewBox="0 0 24 24" aria-hidden="true" v-html="icons.close" /></button>
  </div>
</template>
