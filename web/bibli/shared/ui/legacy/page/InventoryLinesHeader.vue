<template>
  <div class="lines-head">
    <div class="lines-title">{{ title }}</div>
    <slot name="actions">
      <button class="btn ghost sm" type="button" @click="$emit('add')">{{ addLabel }}</button>
    </slot>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string
    addLabel?: string
  }>(),
  {
    title: 'Позиции *',
    addLabel: '+ Добавить',
  },
)

defineEmits<{ add: [] }>()
</script>

<style scoped>
.lines-head { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
.lines-title { font-weight: 800; color: var(--russ-text-secondary); }
.btn { height: 44px; padding: 0 16px; border-radius: 10px; border: none; background: var(--russ-primary); color: var(--russ-text-inverse); font-weight: 800; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; }
.btn:disabled { opacity: 0.6; cursor: not-allowed; }
.btn.ghost { background: var(--russ-bg-hover); border: 1px solid var(--russ-border); color: var(--russ-text-secondary); }
.btn.ghost:hover:not(:disabled) { background: var(--russ-border); }
.btn.sm { height: 34px; padding: 0 10px; border-radius: 8px; font-weight: 700; }
</style>
