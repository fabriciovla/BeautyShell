<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";
import gsap from "gsap";
import BaseLayout from "../../layouts/BaseLayout.vue";
import AppShowcaseCard from "./AppShowcaseCard.vue";
import { apps, chrome, routes } from "../../I18n.js";

const props = defineProps({ lang: { type: String, required: true } });
const lang = props.lang;

const copy = {
  es: {
    title: "Beauty Apps — apps simples y lindas para Windows",
    description:
      "Beauty Browser, un navegador simple y lindo; Beauty Shell, la terminal más hermosa para Windows, y Beauty Screenshot, capturas de pantalla simples y lindas.",
    brand: "Beauty Apps",
    role: "Apps simples y lindas para Windows.",
    cta: "Nuestras apps",
    download: "Descargar",
    docs: "Documentación",
    open: (name) => `Abrir ${name}`,
    close: "Cerrar",
  },
  en: {
    title: "Beauty Apps — simple, beautiful apps for Windows",
    description:
      "Beauty Browser, a simple and beautiful browser; Beauty Shell, the most beautiful terminal for Windows, and Beauty Screenshot, simple and beautiful screenshots.",
    brand: "Beauty Apps",
    role: "Simple, beautiful apps for Windows.",
    cta: "Our apps",
    download: "Download",
    docs: "Documentation",
    open: (name) => `Open ${name}`,
    close: "Close",
  },
}[lang];

const words = copy.brand.split(" ");
const root = ref(null);

let ctx;
onMounted(() => {
  document.documentElement.classList.remove("intro");
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  ctx = gsap.context(() => {
    gsap
      .timeline({ defaults: { ease: "power3.out" } })
      .from(".site-header .header-inner > *", { y: -18, opacity: 0, duration: 0.6, stagger: 0.08 })
      .from(".hero", { scale: 0.985, opacity: 0, duration: 0.7, clearProps: "transform,opacity" }, 0.05)
      .from(".word-inner", { yPercent: 115, duration: 0.9, stagger: 0.09 }, 0.15)
      .from(".role", { y: 16, opacity: 0, duration: 0.65 }, 0.45)
      .from(".hero-actions > *", { y: 14, opacity: 0, duration: 0.6, stagger: 0.08, clearProps: "transform,opacity" }, 0.55)
      .from(".slot", { y: 50, opacity: 0, duration: 0.8, stagger: 0.1, clearProps: "transform,opacity" }, 0.65);
  }, root.value);
});
onBeforeUnmount(() => ctx?.revert());
</script>

<template>
  <BaseLayout
    :lang="lang"
    :title="copy.title"
    :description="copy.description"
    :alternates="{ es: routes.es.home, en: routes.en.home }"
  >
    <div ref="root" class="page" data-intro>
      <header class="site-header">
        <div class="header-inner">
          <a class="brand" :href="routes[lang].home" :aria-label="chrome[lang].home">
            <img class="brand-logo" src="/BeautyAppsLogo.png" alt="" width="24" height="24" />
            {{ copy.brand }}
          </a>
        </div>
      </header>

      <section id="top" class="hero">
        <h1 class="name" :aria-label="copy.brand">
          <span v-for="word in words" :key="word" class="word" aria-hidden="true">
            <span class="word-inner">{{ word }}</span>
          </span>
        </h1>
        <p class="role">{{ copy.role }}</p>

        <div class="hero-actions">
          <a class="cta-primary" href="#apps">
            <span class="ms" style="font-size: 18px" aria-hidden="true">apps</span>
            {{ copy.cta }}
          </a>
        </div>
      </section>

      <div id="apps" class="cards-stack">
        <AppShowcaseCard
          id="browser"
          :lang="lang"
          align="left"
          wide
          :href="routes[lang].browser"
          :name="apps.browser.name"
          :logo="apps.browser.logo"
          :download-href="apps.browser.download"
          :download-label="copy.download"
          :open-label="copy.open(apps.browser.name)"
          :close-label="copy.close"
        />

        <AppShowcaseCard
          id="shell"
          :lang="lang"
          align="left"
          :href="routes[lang].shell"
          :name="apps.shell.name"
          :logo="apps.shell.logo"
          :download-href="apps.shell.download"
          :download-label="copy.download"
          :docs-href="routes[lang].docs.shell"
          :docs-label="copy.docs"
          :open-label="copy.open(apps.shell.name)"
          :close-label="copy.close"
        />

        <AppShowcaseCard
          id="screenshot"
          :lang="lang"
          align="right"
          :href="routes[lang].screenshot"
          :name="apps.screenshot.name"
          :logo="apps.screenshot.logo"
          :download-href="apps.screenshot.download"
          :download-label="copy.download"
          :docs-href="routes[lang].docs.screenshot"
          :docs-label="copy.docs"
          :open-label="copy.open(apps.screenshot.name)"
          :close-label="copy.close"
        />
      </div>
    </div>

  </BaseLayout>
</template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  max-width: 1920px;
  min-height: 100vh;
  margin: 0 auto;
  padding: 68px 20px 28px;
}

.site-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 40;
  background: color-mix(in srgb, var(--bg) 86%, transparent);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.header-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 64px;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  border-radius: 8px;
  font-family: var(--font-title);
  font-size: 16px;
  font-weight: 600;
  letter-spacing: -0.03em;
  color: var(--text);
}
.brand:focus-visible {
  outline: 2px solid var(--text);
  outline-offset: 4px;
}

.brand-logo {
  width: 24px;
  height: 24px;
  border-radius: 6px;
}

.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 18px;
  min-height: calc(100vh - 88px);
  border-radius: 36px;
  background: var(--surface);
  padding: 48px 24px;
  text-align: center;
}

.name {
  font-family: var(--font-title);
  font-size: clamp(54px, 9.2vw, 132px);
  font-weight: 600;
  letter-spacing: -0.05em;
  line-height: 0.96;
}

.word {
  display: inline-block;
  overflow: hidden;
  margin: 0 0.02em;
  padding: 0.04em 0.08em 0.12em;
  vertical-align: top;
}
.word-inner {
  display: inline-block;
}

.role {
  font-family: var(--font-body);
  font-size: clamp(18px, 2vw, 26px);
  font-weight: 400;
  letter-spacing: -0.02em;
  color: var(--text-muted);
}

.hero-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  margin-top: 10px;
}

.cta-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 44px;
  border: none;
  border-radius: 9999px;
  background: var(--text);
  color: var(--bg);
  padding: 0 22px;
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;

  transition: translate 0.2s, background 0.2s;
}
.cta-primary:hover {
  translate: 0 -1px;
  background: #2a2a38;
}

.cards-stack {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
  scroll-margin-top: 76px;
}

@media (max-width: 860px) {
  .page {
    padding: 64px 16px 24px;
  }
  .cards-stack {
    grid-template-columns: minmax(0, 1fr);
  }
  .hero {
    min-height: calc(100vh - 80px);
    border-radius: 28px;
  }
}
</style>
