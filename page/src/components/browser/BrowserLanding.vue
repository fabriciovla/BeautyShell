<script setup>
import AppLanding from "../AppLanding.vue";
import BrowserDemo from "./BrowserDemo.vue";
import { apps, routes } from "../../I18n.js";

const props = defineProps({ lang: { type: String, required: true } });

const copy = {
  es: {
    title: "Beauty Browser — un navegador simple y lindo para Windows",
    description: "Un navegador simple y lindo para Windows, con tus pestañas a un costado.",
    role: "Un navegador simple y lindo para Windows.",
  },
  en: {
    title: "Beauty Browser — a simple, beautiful browser for Windows",
    description: "A simple, beautiful browser for Windows, with your tabs on the side.",
    role: "A simple, beautiful browser for Windows.",
  },
}[props.lang];
</script>

<template>
  <AppLanding
    :lang="lang"
    :app="apps.browser"
    :title="copy.title"
    :description="copy.description"
    :role="copy.role"
    :alternates="{ es: routes.es.browser, en: routes.en.browser }"
    favicon="/BeautyBrowserFavicon.png"
    :home="routes[lang].browser"
  >
    <BrowserDemo :lang="lang" />
  </AppLanding>
</template>
