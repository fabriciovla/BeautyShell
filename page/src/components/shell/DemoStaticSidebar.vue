<script setup>
import { folderBox, folderHead, newTabBox, tabBox, tabState } from "./DemoStyles.js";
import { icons } from "./ShellIcons.js";

const props = defineProps({ data: { type: Object, required: true } });

const first = props.data.tabs[0];
const folders = [...new Set(props.data.tabs.map((t) => t.folder))];
</script>

<template>
  <div v-for="folder in folders" :class="folderBox">
    <div :class="folderHead"><svg class="w-13 h-13" viewBox="0 0 24 24" aria-hidden="true" v-html="icons.folder" /> {{ folder }}</div>
    <div class="space-y-2">
      <div v-for="t in data.tabs.filter((t) => t.folder === folder)" :class="[tabBox, tabState(t === first)]">
        <svg class="w-16 h-16" viewBox="0 0 24 24" aria-hidden="true" v-html="icons[t.icon]" />
        <span class="grid flex-1 min-w-0 leading-1-25"><b class="truncate font-500">{{ t.title }}</b><small v-if="t.sub" class="truncate text-faint text-11-5">{{ t.sub }}</small></span>
      </div>
    </div>
  </div>
  <div :class="newTabBox"><svg class="w-15 h-15" viewBox="0 0 24 24" aria-hidden="true" v-html="icons.plus" /> {{ data.ui.newTerminal }} <kbd class="ml-auto text-faint font-sans text-11">Ctrl+T</kbd></div>
</template>
