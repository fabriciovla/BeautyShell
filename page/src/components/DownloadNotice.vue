<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import Button from "./Button.vue";
import MorphModal from "./MorphModal.vue";
import WindowsLogo from "./WindowsLogo.vue";

const props = defineProps({ lang: { type: String, required: true } });

const texts = {
  es: {
    title: "La app no está firmada",
    text: "Todavía no tiene firma digital, que es un certificado pago. Por eso Windows puede avisarte al abrirla, pero no es un virus.",
    hint: "Si aparece el aviso, tocá <b>Más información</b> y después <b>Ejecutar de todos modos</b>.",
    cancel: "Cancelar",
    download: "Descargar",
  },
  en: {
    title: "The app isn't signed",
    text: "It doesn't have a digital signature yet, which is a paid certificate. That's why Windows may warn you when you open it, but it's not a virus.",
    hint: "If the warning shows up, click <b>More info</b> and then <b>Run anyway</b>.",
    cancel: "Cancel",
    download: "Download",
  },
};
const shield = '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>';

const modal = ref(null);
const href = ref("");
const t = computed(() => texts[props.lang]);

function onClick(e) {
  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const link = e.target.closest?.("a[data-download]");
  if (!link) return;
  e.preventDefault();
  e.stopPropagation();
  href.value = link.href;
  modal.value?.show(link);
}

onMounted(() => document.addEventListener("click", onClick, true));
onBeforeUnmount(() => document.removeEventListener("click", onClick, true));
</script>

<template>
  <MorphModal ref="modal" :label="t.title" :width="420" placement="center">
    <template #default="{ close }">
      <div class="dn">
        <span data-anim class="dn-icon"><svg viewBox="0 0 24 24" aria-hidden="true" v-html="shield" /></span>
        <h2 data-anim class="dn-title">{{ t.title }}</h2>
        <p data-anim class="dn-text">{{ t.text }}</p>
        <p data-anim class="dn-text dn-hint" v-html="t.hint" />
        <div data-anim class="dn-actions">
          <Button as="button" variant="ghost" type="button" @click="close">{{ t.cancel }}</Button>

          <Button :href="href" @click="close">
            <WindowsLogo class="w-14 h-14" />
            {{ t.download }}
          </Button>
        </div>
      </div>
    </template>
  </MorphModal>
</template>

<style scoped>
.dn {
  display: grid;
  justify-items: center;
  gap: 10px;
  padding: 32px 28px 24px;
  text-align: center;
}

.dn-icon {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  margin-bottom: 6px;
  border-radius: 9999px;
  background: var(--surface);
  color: var(--text);
}
.dn-icon svg {
  width: 22px;
  height: 22px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.dn-title {
  font-family: var(--font-title);
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -0.03em;
  line-height: 1.2;
}

.dn-text {
  font-size: 15px;
  line-height: 1.55;
  color: var(--text-muted);
  text-wrap: pretty;
}
.dn-hint :deep(b) {
  font-weight: 600;
  color: var(--text);
}

.dn-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  width: 100%;
  margin-top: 14px;
}
</style>
