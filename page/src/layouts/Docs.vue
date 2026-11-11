<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";
import { useHead } from "@unhead/vue";
import gsap from "gsap";
import DocsPager from "../components/docs/DocsPager.vue";
import DocsSections from "../components/docs/DocsSections.vue";
import { DOCS, DOCS_HOME, docHref, docTitle } from "../DocsNav.js";
import { apps } from "../I18n.js";

const props = defineProps({ frontmatter: { type: Object, required: true } });

const fm = props.frontmatter;
const lang = fm.lang;
const app = fm.app ?? "shell";
const { name, logo } = apps[app];
const title = docTitle(app, fm.id, lang);
const home = DOCS_HOME.title[lang];
const isHome = fm.id === DOCS_HOME.id;
const group = DOCS[app].find((g) => g.pages.some((p) => p.id === fm.id));
const homeTitle = { es: `Documentación de ${name}`, en: `${name} docs` }[lang];

useHead({
  title: `${isHome ? home : title} — ${name}`,
  meta: [{ name: "description", content: fm.description }],
  link: [
    { rel: "alternate", hreflang: "es", href: docHref(app, fm.id, "es") },
    { rel: "alternate", hreflang: "en", href: docHref(app, fm.id, "en") },
  ],
});

const root = ref(null);
const article = ref(null);
let ctx;
let seen;

function revealOnScroll() {
  if (!article.value) return;
  const later = Array.from(article.value.children).filter((el) => el.getBoundingClientRect().top > window.innerHeight);
  if (!later.length) return;
  later.forEach((el) => el.classList.add("reveal"));
  seen = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add("is-in");
        seen.unobserve(e.target);
      }
    },
    { rootMargin: "0px 0px -8% 0px" },
  );
  later.forEach((el) => seen.observe(el));
}

const firstVisit = typeof document !== "undefined" && document.documentElement.classList.contains("intro");

onMounted(() => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (firstVisit) {
    ctx = gsap.context(() => {
      const visible = Array.from(article.value?.children ?? []).filter((el) => el.getBoundingClientRect().top < window.innerHeight);
      gsap
        .timeline({ defaults: { ease: "power3.out", clearProps: "transform,opacity" } })
        .from(".docs-hero", { y: 22, opacity: 0, duration: 0.65 }, 0.08)
        .from(".docs-hero [data-hero]", { y: 14, opacity: 0, duration: 0.55, stagger: 0.07 }, 0.2)
        .from("[data-section-card]", { y: 26, opacity: 0, duration: 0.6, stagger: 0.05 }, 0.3)
        .from(visible, { y: 16, opacity: 0, duration: 0.55, stagger: 0.04 }, 0.32);
    }, root.value);
  }
  revealOnScroll();
});

onBeforeUnmount(() => {
  ctx?.revert();
  seen?.disconnect();
});
</script>

<template>
  <div ref="root" class="docs-page">
    <header class="docs-hero" :class="{ 'is-home': isHome }">
      <nav v-if="!isHome" data-hero class="crumbs" aria-label="Breadcrumb">
        <a class="crumb-link" :href="docHref(app, DOCS_HOME.id, lang)">{{ home }}</a>
        <template v-if="group">
          <span class="ms crumb-sep" style="font-size: 18px" aria-hidden="true">chevron_right</span>
          <span>{{ group.title[lang] }}</span>
        </template>
      </nav>
      <div data-hero class="hero-title">
        <img v-if="isHome" class="hero-logo" :src="logo" alt="" width="56" height="56" />
        <h1>{{ isHome ? homeTitle : title }}</h1>
      </div>
      <p v-if="fm.lead" data-hero class="hero-lead">{{ fm.lead }}</p>
    </header>

    <DocsSections v-if="isHome" :app="app" :lang="lang" />

    <template v-if="!isHome">
      <article ref="article" class="prose docs-prose">
        <slot />
      </article>

      <DocsPager :app="app" :lang="lang" :page-id="fm.id" />
    </template>
  </div>
</template>

<style scoped>
.docs-page {
  display: grid;
  align-content: start;
  gap: 40px;
}

.docs-hero {
  display: grid;
  gap: 18px;
  border-radius: 36px;
  background: var(--surface);
  padding: 36px 44px 44px;
}
.docs-hero.is-home {
  padding: 44px 44px 52px;
}

.crumbs {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  font-family: var(--font-title);
  font-size: 15px;
  font-weight: 500;
  letter-spacing: -0.01em;
  color: var(--text-muted);
}

.crumb-link {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: color 0.2s;
}
.crumb-link:hover {
  color: var(--text);
}

.crumb-sep {
  color: var(--text-dim);
}

.hero-title {
  display: flex;
  align-items: center;
  gap: 18px;
}
.hero-title h1 {
  font-family: var(--font-title);
  font-size: clamp(34px, 4.4vw, 54px);
  font-weight: 600;
  letter-spacing: -0.045em;
  line-height: 1.04;
  text-wrap: balance;
}

.hero-logo {
  flex-shrink: 0;
  width: 56px;
  height: 56px;
  border-radius: 15px;
}

.hero-lead {
  max-width: 720px;
  font-size: clamp(16px, 1.5vw, 18.5px);
  line-height: 1.65;
  color: var(--text-muted);
  text-wrap: pretty;
}

.docs-prose {
  width: 100%;
  max-width: 780px;
  padding: 0 44px;
}

.docs-page > :deep(.pager) {
  width: 100%;
  max-width: 868px;
  margin-top: 24px;
}

@media (max-width: 640px) {
  .docs-page {
    gap: 28px;
  }
  .docs-hero,
  .docs-hero.is-home {
    border-radius: 28px;
    padding: 26px 22px 30px;
  }
  .hero-logo {
    width: 46px;
    height: 46px;
    border-radius: 12px;
  }
  .docs-prose {
    padding: 0 8px;
  }
}
</style>
