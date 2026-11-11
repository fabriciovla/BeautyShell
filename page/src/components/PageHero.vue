<script setup>
defineProps({
  title: { type: String, required: true },
  titleMuted: { type: String, required: true },
  lead: { type: String, required: true },
  pill: { type: String, default: undefined },
  logo: { type: String, default: undefined },
});
</script>

<template>
  <div :class="['content-width flex flex-col items-center text-center phone:pt-56', pill ? 'pt-88' : 'pt-96']">
    <p v-if="pill" class="inline-flex items-center gap-8 h-32 pr-14 pl-7 border border-line rounded-full bg-white-70 shadow-sm text-soft text-13 font-500"><img class="w-18 h-18" :src="logo" alt="" width="18" height="18" /> {{ pill }}</p>
    <h1 id="hero-title" :class="['text-hero font-600 leading-1 tracking-055 text-balance', { 'mt-28': pill }]">{{ title }}<br /><span class="text-faint">{{ titleMuted }}</span></h1>
    <p class="max-w-560 mt-24 text-soft text-18 leading-1-6 text-pretty phone:text-16">{{ lead }}</p>
    <div v-if="$slots.default" class="flex flex-wrap justify-center gap-10 mt-34 phone:flex-col phone:self-stretch">
      <slot />
    </div>
  </div>
</template>
