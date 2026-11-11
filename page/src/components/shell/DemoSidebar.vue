<script setup>
import DemoFolder from "./DemoFolder.vue";
import { newTabBox } from "./DemoStyles.js";
import { icons } from "./ShellIcons.js";

defineProps({ demo: { type: Object, required: true } });
</script>

<template>
  <DemoFolder v-for="folder in demo.folders()" :key="folder" :demo="demo" :folder="folder" />
  <button :class="['button-reset focus-ring-in', newTabBox, demo.tabs.length >= demo.maxTabs ? 'opacity-45 cursor-default' : 'hover:bg-white-45 hover:text-ink']" type="button" :disabled="demo.tabs.length >= demo.maxTabs" @click="demo.newTab"><svg class="w-15 h-15" viewBox="0 0 24 24" aria-hidden="true" v-html="icons.plus" /> {{ demo.ui.newTerminal }} <kbd class="ml-auto text-faint font-sans text-11">Ctrl+T</kbd></button>
</template>
