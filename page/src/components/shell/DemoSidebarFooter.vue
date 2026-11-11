<script setup>
import { icons } from "./ShellIcons.js";

defineProps({ settings: { type: String, required: true } });
</script>

<template>
  <div class="flex shrink-0 items-center justify-between mt-8 pt-10 px-8 pb-4 border-t border-line text-soft text-12-5" aria-hidden="true">
    <span class="flex items-center gap-8"><svg class="w-14 h-14" viewBox="0 0 24 24" v-html="icons.gear" /> {{ settings }}</span>
    <svg class="w-14 h-14" viewBox="0 0 24 24" v-html="icons.sidebar" />
  </div>
</template>
