<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useHead } from "@unhead/vue";
import gsap from "gsap";
import DocsMenu from "../components/docs/DocsMenu.vue";
import DocsSearch from "../components/docs/DocsSearch.vue";
import DownloadNotice from "../components/DownloadNotice.vue";
import SiteHeader from "../components/SiteHeader.vue";
import { docFromPath, docHref } from "../DocsNav.js";
import { other } from "../I18n.js";

const props = defineProps({
  app: { type: String, required: true },
  lang: { type: String, required: true },
});

const route = useRoute();
const router = useRouter();
const pageId = computed(() => docFromPath(route.path)?.id ?? "home");
const alt = computed(() => docHref(props.app, pageId.value, other(props.lang)));
const favicon = { shell: "/BeautyShellFavicon.png", screenshot: "/BeautyScreenshotFavicon.png" }[props.app];

useHead({
  htmlAttrs: { lang: props.lang },
  link: [{ rel: "icon", href: favicon, type: "image/png" }],
});

const root = ref(null);
let ctx;

function onClick(event) {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const a = event.target.closest?.("a[href]");
  if (!a || a.target || a.hasAttribute("download") || a.hasAttribute("data-download")) return;
  const url = new URL(a.href, location.href);
  if (url.origin !== location.origin) return;
  const doc = docFromPath(url.pathname);
  if (!doc || doc.app !== props.app || doc.lang !== props.lang) return;
  if (url.pathname === location.pathname && url.hash) return;
  event.preventDefault();
  if (url.pathname !== location.pathname) router.push(url.pathname + url.hash);
}

onMounted(() => {
  document.addEventListener("click", onClick);
  document.documentElement.classList.remove("intro");
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  ctx = gsap.context(() => {
    gsap
      .timeline({ defaults: { ease: "power3.out", clearProps: "transform,opacity" } })
      .from(".site-header .header-inner > *", { y: -14, opacity: 0, duration: 0.5, stagger: 0.06 });
  }, root.value);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", onClick);
  ctx?.revert();
});
</script>

<template>
  <div ref="root" class="docs" data-intro>
    <SiteHeader :lang="lang" :app="app" :alt-href="alt">
      <template #actions>
        <DocsSearch :app="app" :lang="lang" />
        <DocsMenu :app="app" :lang="lang" :page-id="pageId" />
      </template>
    </SiteHeader>

    <main class="docs-main">
      <slot />
    </main>
  </div>

  <DownloadNotice :lang="lang" />
</template>

<style scoped>
.docs-main {
  max-width: 1120px;
  margin: 0 auto;
  padding: 8px 20px 96px;
}

@media (max-width: 640px) {
  .docs-main {
    padding: 4px 12px 72px;
  }
}
</style>

<style>

.docs-page-leave-active {
  transition: opacity 0.16s ease-out, transform 0.16s ease-out;
}
.docs-page-leave-to {
  opacity: 0;
  transform: translate3d(0, -6px, 0);
}
.docs-page-enter-active {
  transition: opacity 0.4s var(--ease), transform 0.5s var(--ease);
}
.docs-page-enter-from {
  opacity: 0;
  transform: translate3d(0, 16px, 0);
}
</style>
