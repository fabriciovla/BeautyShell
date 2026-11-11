<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import DocsShell from "./layouts/DocsShell.vue";
import { docFromPath } from "./DocsNav.js";

const route = useRoute();
const doc = computed(() => docFromPath(route.path));
</script>

<template>
  <RouterView v-slot="{ Component }">
    <DocsShell v-if="doc" :key="`${doc.app}-${doc.lang}`" :app="doc.app" :lang="doc.lang">
      <Transition name="docs-page" mode="out-in">
        <component :is="Component" :key="route.path" />
      </Transition>
    </DocsShell>
    <component :is="Component" v-else />
  </RouterView>
</template>
