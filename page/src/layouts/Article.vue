<script setup>
import { useRoute } from "vue-router";
import BaseLayout from "./BaseLayout.vue";
import SiteHeader from "../components/SiteHeader.vue";

const props = defineProps({ frontmatter: { type: Object, required: true } });

const fm = props.frontmatter;
const lang = fm.lang;
const here = useRoute().path.replace(/\/?$/, "/");
const alternates = lang === "es" ? { es: here, en: fm.alt } : { es: fm.alt, en: here };
const updated = { es: "Última actualización", en: "Last updated" }[lang];
</script>

<template>
  <BaseLayout :lang="lang" :title="`${fm.title} — Beauty Shell`" :description="fm.description" :alternates="alternates">
    <SiteHeader :lang="lang" :alt-href="fm.alt" />

    <main>
      <header class="content-width grid justify-items-start gap-18 pt-72 pb-48 phone:pt-48">
        <p v-if="fm.eyebrow" class="text-faint font-mono text-12 tracking-wide uppercase">{{ fm.eyebrow }}</p>
        <h1 class="max-w-820 text-article font-600 leading-1-04 tracking-045 text-balance phone:text-article-small">{{ fm.title }}</h1>
        <p v-if="fm.lead" class="max-w-680 text-soft text-19 leading-1-6 text-pretty">{{ fm.lead }}</p>
        <p v-if="fm.updated" class="flex flex-wrap row-gap-6 col-gap-18 text-faint font-mono text-12 tracking-wide uppercase"><span>{{ updated }}: {{ fm.updated }}</span></p>
      </header>

      <div class="content-width pb-112">
        <article class="prose">
          <slot />
        </article>
      </div>
    </main>

  </BaseLayout>
</template>
