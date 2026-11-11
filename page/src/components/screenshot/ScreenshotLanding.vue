<script setup>
import AppLanding from "../AppLanding.vue";
import ScreenshotAppDemo from "./ScreenshotAppDemo.vue";
import { apps, routes } from "../../I18n.js";

const props = defineProps({ lang: { type: String, required: true } });

const copy = {
  es: {
    title: "Beauty Screenshot — capturas de pantalla simples y lindas",
    description:
      "Capturas de pantalla para Windows: apretá Impr Pant, arrastrá y queda copiada o guardada, con esquinas redondeadas si querés.",
    role: "Capturas de pantalla simples y lindas para Windows.",
  },
  en: {
    title: "Beauty Screenshot — simple, beautiful screenshots",
    description: "Screenshots for Windows: press Print Screen, drag, and it's copied or saved, with rounded corners if you like.",
    role: "Simple, beautiful screenshots for Windows.",
  },
}[props.lang];
</script>

<template>
  <AppLanding
    :lang="lang"
    :app="apps.screenshot"
    :title="copy.title"
    :description="copy.description"
    :role="copy.role"
    :alternates="{ es: routes.es.screenshot, en: routes.en.screenshot }"
    favicon="/BeautyScreenshotFavicon.png"
    :home="routes[lang].screenshot"
    :docs-href="routes[lang].docs.screenshot"
  >
    <ScreenshotAppDemo :lang="lang" />
  </AppLanding>
</template>
