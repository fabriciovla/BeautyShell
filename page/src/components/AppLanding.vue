<script setup>

import { onBeforeUnmount, onMounted, ref } from "vue";
import gsap from "gsap";
import BaseLayout from "../layouts/BaseLayout.vue";
import WindowsLogo from "./WindowsLogo.vue";

const props = defineProps({
  lang: { type: String, required: true },
  app: { type: Object, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  role: { type: String, required: true },
  alternates: { type: Object, required: true },
  favicon: { type: String, required: true },
  home: { type: String, required: true },
  docsHref: { type: String, default: undefined },
});

const copy = {
  es: { download: "Descargar", free: "Descargar gratis", docs: "Documentación", note: "Gratis · Windows 10 y 11" },
  en: { download: "Download", free: "Download for free", docs: "Documentation", note: "Free · Windows 10 and 11" },
}[props.lang];

const root = ref(null);
let ctx;
onMounted(() => {
  document.documentElement.classList.remove("intro");
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  ctx = gsap.context(() => {
    gsap
      .timeline({ defaults: { ease: "power3.out" } })
      .from(".landing-header > *", { y: -14, opacity: 0, duration: 0.55, stagger: 0.08, clearProps: "transform,opacity" })
      .from(".hero > *", { y: 18, opacity: 0, duration: 0.6, stagger: 0.06, clearProps: "transform,opacity" }, 0.08)
      .from(".demo", { y: 28, opacity: 0, duration: 0.8, clearProps: "transform,opacity" }, 0.3);
  }, root.value);
});
onBeforeUnmount(() => ctx?.revert());
</script>

<template>
  <BaseLayout :lang="lang" :title="title" :description="description" :alternates="alternates" :icon="{ href: favicon, type: 'image/png' }">
    <div ref="root" data-intro>
      <header class="landing-header">
        <a class="brand" :href="home"><img :src="app.logo" alt="" width="24" height="24" />{{ app.name }}</a>
        <a class="pill small" :href="app.download" data-download>{{ copy.download }}</a>
      </header>

      <main class="page">
        <div class="glass">
          <section class="hero">
            <img class="hero-logo" :src="app.logo" alt="" width="64" height="64" />
            <h1>{{ app.name }}</h1>
            <p class="role">{{ role }}</p>
            <div class="actions">
              <a class="pill" :href="app.download" data-download>
                <WindowsLogo class="w-16 h-16" />
                {{ copy.free }}
              </a>
              <a v-if="docsHref" class="pill secondary" :href="docsHref">
                <span class="ms" style="font-size: 18px" aria-hidden="true">menu_book</span>
                {{ copy.docs }}
              </a>
            </div>
            <p class="note">{{ copy.note }}</p>
          </section>

          <div class="demo">
            <slot />
          </div>
        </div>
      </main>
    </div>
  </BaseLayout>
</template>

<style scoped>

.landing-header {
  position: fixed;
  inset: 0 0 auto;
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  padding: 0 clamp(20px, 3vw, 36px);
  background: color-mix(in srgb, var(--bg) 86%, transparent);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}
.brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-family: var(--font-title);
  font-size: 16px;
  font-weight: 600;
  letter-spacing: -0.03em;
}
.brand img {
  width: 24px;
  height: 24px;
  border-radius: 6px;
}

.pill {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  height: 44px;
  padding: 0 22px;
  border: 1px solid #09090d;
  border-radius: 9999px;
  background: #09090d;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.01em;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.32), 0 1px 2px rgba(0, 0, 0, 0.16);
  transition: background 0.2s, translate 0.2s;
}
.pill:hover {
  background: #1c1c26;
  translate: 0 -1px;
}
.pill.secondary {
  border-color: rgba(20, 20, 45, 0.08);
  background: rgba(255, 255, 255, 0.6);
  color: var(--text-body);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.75), 0 1px 2px rgba(20, 20, 45, 0.04);
}
.pill.secondary:hover {
  background: rgba(255, 255, 255, 0.9);
  color: var(--text);
}
.pill.small {
  height: 36px;
  padding: 0 16px;
  font-size: 14px;
}

.page {
  padding: 68px 20px 20px;
}
.glass {
  overflow: hidden;
  border-radius: 36px;
  background:
    radial-gradient(50% 60% at 18% 30%, rgb(255 255 255 / 80%), transparent 68%),
    radial-gradient(55% 50% at 84% 85%, rgb(255 255 255 / 60%), transparent 70%),
    linear-gradient(145deg, #f3f3fc 0%, #e8e8f7 52%, #efeffa 100%);
}
.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
  padding: clamp(48px, 7vw, 88px) 20px clamp(40px, 5vw, 64px);
  text-align: center;
}
.hero-logo {
  width: 64px;
  height: 64px;
  margin-bottom: 4px;
  border-radius: 16px;
}
h1 {
  font-family: var(--font-title);
  font-size: clamp(54px, 9.2vw, 132px);
  font-weight: 600;
  letter-spacing: -0.05em;
  line-height: 0.96;
}
.role {
  font-size: clamp(18px, 2vw, 26px);
  letter-spacing: -0.02em;
  color: var(--text-muted);
}
.actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  margin-top: 10px;
}
.note {
  font-size: 13px;
  color: var(--text-muted);
}

.demo {
  height: calc(100vh - 88px);
  min-height: 480px;
  padding: 0 clamp(12px, 2.5vw, 36px) clamp(12px, 2.5vw, 36px);
}

@media (max-width: 860px) {
  .page {
    padding: 64px 12px 12px;
  }
  .glass {
    border-radius: 28px;
  }
  .demo {
    height: 460px;
    min-height: 0;
  }
}
</style>
