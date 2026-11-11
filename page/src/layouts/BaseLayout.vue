<script setup>
import { useHead } from "@unhead/vue";
import DownloadNotice from "../components/DownloadNotice.vue";

const props = defineProps({
  lang: { type: String, default: "es" },
  title: { type: String, default: "Beauty Apps — apps simples y lindas para Windows" },
  description: { type: String, default: "Apps simples y lindas para Windows: Beauty Browser, Beauty Shell y Beauty Screenshot." },
  alternates: { type: Object, default: () => ({ es: "/", en: "/en/" }) },
  icon: { type: Object, default: () => ({ href: "/BeautyAppsFavicon.png", type: "image/png" }) },
});

useHead({
  htmlAttrs: { lang: props.lang },
  title: props.title,
  meta: [{ name: "description", content: props.description }],
  link: [
    { rel: "alternate", hreflang: "es", href: props.alternates.es },
    { rel: "alternate", hreflang: "en", href: props.alternates.en },
    { rel: "icon", href: props.icon.href, type: props.icon.type },
  ],
});
</script>

<template>
  <slot />
  <DownloadNotice :lang="lang" />
</template>
