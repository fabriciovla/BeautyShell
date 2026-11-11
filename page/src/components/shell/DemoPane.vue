<script setup>
import { cursorBlock, focusDot, paneBox, paneHead, termBox } from "./DemoStyles.js";
import { prompt } from "./ShellDemoData.js";

defineProps({
  demo: { type: Object, required: true },
  tab: { type: Object, required: true },
  pane: { type: Object, required: true },
  index: { type: Number, required: true },
});
</script>

<template>
  <section :class="[paneBox, { 'tablet:hidden': index > 0 }]" @pointerdown.prevent="demo.focusPane(pane)">
    <div :class="paneHead"><i :class="focusDot(pane === demo.focused)"></i> {{ pane.script.head }} <span class="truncate text-faint font-400">~\{{ tab.folder }}</span></div>
    <div :ref="demo.setTerm(pane.id)" :class="termBox">
      <template v-for="line in pane.lines" :key="line.id">
        <p v-if="line.prompt" class="pre-wrap"><span class="text-faint" v-html="prompt(tab.folder)" /> <span>{{ line.typed }}</span><span v-if="line.cursor" :class="cursorBlock(pane === demo.focused, demo.typing)"></span><span v-if="line.ctrlC" class="text-faint">^C</span></p>
        <p v-else class="pre-wrap" v-html="line.html || '&nbsp;'" />
      </template>
    </div>
  </section>
</template>
