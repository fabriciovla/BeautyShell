<script setup>
defineProps({ compact: { type: Boolean, default: false } });
</script>

<template>
  <div class="absolute z-behind inset-0 bg-wallpaper"></div>
  <div :class="['absolute -bottom-4p overflow-hidden rounded-12 bg-white shadow-lg', compact ? 'top-14p right-8p left-8p' : 'top-12p right-10p left-10p']">
    <div class="flex items-center gap-6 h-30 px-12 border-b border-line"><i class="w-70 h-7 mr-auto rounded-4 bg-black-9"></i><i class="w-30 h-7 rounded-4 bg-black-9"></i><i class="w-30 h-7 rounded-4 bg-black-9"></i></div>
    <div :class="['grid px-8p', compact ? 'gap-7 py-18' : 'gap-10 py-26']">
      <b class="w-46p h-16 mb-6 rounded-5 bg-black-70"></b><span class="h-8 rounded-4 bg-black-10"></span><span class="h-8 rounded-4 bg-black-10"></span><span class="w-62p h-8 rounded-4 bg-black-10"></span>
      <div class="grid cols-3 gap-10 my-8"><em v-for="n in 3" :class="['rounded-10 bg-shot-card', compact ? 'h-56' : 'h-shot-card']"></em></div>
      <span class="h-8 rounded-4 bg-black-10"></span><span class="w-62p h-8 rounded-4 bg-black-10"></span>
    </div>
  </div>
</template>
