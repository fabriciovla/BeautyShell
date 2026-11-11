<script setup>
import { ref } from "vue";
import DemoPane from "./DemoPane.vue";
import DemoSidebar from "./DemoSidebar.vue";
import DemoSidebarFooter from "./DemoSidebarFooter.vue";
import DemoStaticSidebar from "./DemoStaticSidebar.vue";
import DemoStaticStage from "./DemoStaticStage.vue";
import { stageTab } from "./DemoStyles.js";
import { getShellDemo } from "./ShellDemoData.js";
import { useShellDemo } from "./UseShellDemo.js";

const props = defineProps({ lang: { type: String, required: true } });

const data = getShellDemo(props.lang);
const input = ref();
const win = ref();
const demo = useShellDemo(data, { input, win });
</script>

<template>
  <div class="content-width relative mt-64 p-showcase overflow-hidden rounded-24 isolate phone:mt-44 phone:rounded-18" id="terminal-demo">
    <div class="absolute z-behind inset-0 bg-wallpaper" aria-hidden="true"></div>
    <div ref="win" class="relative grid cols-sidebar gap-6 h-demo p-6 rounded-12 bg-glass shadow-window blur-glass text-13 text-left tablet:cols-sidebar-small phone:cols-1 phone:h-340" role="region" :aria-label="data.text.region" @keydown="demo.onWindowKey">
      <aside class="flex flex-col min-w-0 min-h-0 p-6 phone:hidden">
        <div class="flex flex-1 flex-col gap-8 min-h-0 overflow-y-auto no-scrollbar">
          <DemoStaticSidebar v-if="!demo.live" :data="data" />
          <DemoSidebar v-else :demo="demo" />
        </div>
        <DemoSidebarFooter :settings="data.text.settings" />
      </aside>

      <div class="grid min-w-0 min-h-0">
        <DemoStaticStage v-if="!demo.live" :data="data" />
        <template v-else>
          <div v-for="tab in demo.tabs" :key="tab.id" :class="[stageTab, { hidden: tab !== demo.active }]" :style="`--panes: ${tab.size}`">
            <DemoPane v-for="(pane, i) in tab.panes" :key="pane.id" :demo="demo" :tab="tab" :pane="pane" :index="i" />
          </div>
        </template>
      </div>

      <input
        ref="input"
        class="absolute top-0 left-0 w-1 h-1 p-0 border-0 opacity-0 text-16 no-pointer"
        type="text"
        :aria-label="data.text.input"
        autocomplete="off"
        autocapitalize="off"
        spellcheck="false"
        tabindex="-1"
        @input="demo.onInput"
        @keydown="demo.onInputKey"
        @focus="demo.typing = true"
        @blur="demo.typing = false"
      />
    </div>
    <p :class="['absolute right-0 bottom-demo-hint left-0 text-soft text-13 text-center transition-opacity-slow', { 'opacity-0': demo.hintGone }]" v-html="data.text.hint" />
  </div>
</template>
