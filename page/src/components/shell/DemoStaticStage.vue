<script setup>
import { cursorBlock, focusDot, paneBox, paneHead, stageTab, termBox } from "./DemoStyles.js";
import { prompt } from "./ShellDemoData.js";

const props = defineProps({ data: { type: Object, required: true } });

const first = props.data.tabs[0];
</script>

<template>
  <div :class="stageTab" :style="`--panes: ${first.panes.length}`">
    <section v-for="(pane, i) in first.panes" :class="[paneBox, { 'tablet:hidden': i > 0 }]">
      <div :class="paneHead"><i :class="focusDot(i === 0)"></i> {{ pane.head }} <span class="truncate text-faint font-400">~\{{ first.folder }}</span></div>
      <div :class="termBox">
        <p class="pre-wrap"><span class="text-faint" v-html="prompt(first.folder)" /> {{ pane.cmd }}</p>
        <p v-for="line in pane.out" class="pre-wrap" v-html="line || '&nbsp;'" />
        <p v-if="!pane.running" class="pre-wrap"><span class="text-faint" v-html="prompt(first.folder)" /> <span :class="cursorBlock(i === 0, false)"></span></p>
      </div>
    </section>
  </div>
</template>
