<script setup>
defineProps({
  as: { type: String, default: "a" },
  variant: { type: String, default: "dark" },
  size: { type: String, default: "medium" },
});

const variants = {
  dark: "border border-transparent bg-ink text-white shadow-button cursor-pointer press hover:bg-ink-soft",
  ghost: "border border-strong bg-surface text-ink cursor-pointer press hover:border-dark",
  quiet: "border border-strong bg-transparent text-faint cursor-default",
};

const sizes = {
  small: "gap-8 min-h-36 px-15 text-13-5",
  medium: "gap-8 min-h-44 px-20 text-14-5",
  large: "gap-10 min-h-52 px-26 text-16",
};
</script>

<template>
  <component :is="as" :class="['inline-flex centrar rounded-full font-500 tracking-01 nowrap transition-button focus-ring', variants[variant], sizes[size]]"><slot /></component>
</template>
