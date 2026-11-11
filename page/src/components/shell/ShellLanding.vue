<script setup>
import AppLanding from "../AppLanding.vue";
import ShellAppDemo from "./ShellAppDemo.vue";
import { apps, routes } from "../../I18n.js";

const props = defineProps({ lang: { type: String, required: true } });

const copy = {
  es: {
    title: "Beauty Shell — la terminal más bonita para Windows",
    description:
      "Una terminal de escritorio para Windows con sesiones ordenadas, paneles divididos y una apariencia que podés hacer tuya.",
    role: "La terminal más bonita para Windows.",
  },
  en: {
    title: "Beauty Shell — the most beautiful terminal for Windows",
    description: "A desktop terminal for Windows with organized sessions, split panes and a look you can make your own.",
    role: "The most beautiful terminal for Windows.",
  },
}[props.lang];
</script>

<template>
  <AppLanding
    :lang="lang"
    :app="apps.shell"
    :title="copy.title"
    :description="copy.description"
    :role="copy.role"
    :alternates="{ es: routes.es.shell, en: routes.en.shell }"
    favicon="/BeautyShellFavicon.png"
    :home="routes[lang].shell"
    :docs-href="routes[lang].docs.shell"
  >
    <ShellAppDemo :lang="lang" />
  </AppLanding>
</template>
