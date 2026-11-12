<template>
  <div class="sheet" @click.self="emit('close')">
    <div class="sheet__card" role="dialog" aria-labelledby="water-date-title">
      <h2 id="water-date-title" class="sheet__title">Когда полили?</h2>
      <p class="sheet__hint">Растение просрочено. Укажите день, когда полив был на самом деле.</p>
      <input v-model="picked" class="sheet__date" type="date" :max="max" aria-label="Дата полива" />
      <button type="button" class="sheet__ok" :disabled="!picked || picked > max" @click="emit('confirm', picked)">
        Записать полив
      </button>
      <button type="button" class="sheet__cancel" @click="emit('close')">Отмена</button>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ date: string; max: string }>()
const emit = defineEmits<{ confirm: [iso: string]; close: [] }>()
const picked = ref(props.date)

watch(
  () => props.date,
  (value) => {
    picked.value = value
  },
)
</script>

<style scoped>
.sheet {
  position: fixed;
  inset: 0;
  z-index: 40;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgba(16, 24, 40, 0.4);
}
.sheet__card {
  width: min(480px, 100%);
  padding: 20px 16px calc(16px + env(safe-area-inset-bottom));
  border-radius: 20px 20px 0 0;
  background: #fff;
}
.sheet__title {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
}
.sheet__hint {
  margin: 6px 0 14px;
  font-size: 14px;
  color: #5f6b70;
}
.sheet__date {
  width: 100%;
  padding: 12px;
  border: 1px solid #dfe4e1;
  border-radius: 12px;
  font: inherit;
  background: #fff;
}
.sheet__ok,
.sheet__cancel {
  width: 100%;
  margin-top: 10px;
  padding: 14px;
  border: none;
  border-radius: 14px;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}
.sheet__ok {
  background: #2e7d32;
  color: #fff;
}
.sheet__ok:disabled {
  opacity: 0.5;
}
.sheet__cancel {
  background: #f2f3f7;
  color: #1c2326;
}
</style>
