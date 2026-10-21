<template>
  <div :class="['p-card', 'card', $attrs.class]">
    <div v-if="$slots.title" class="p-card-title"><slot name="title" /></div>
    <div v-if="$slots.content || $slots.default" class="p-card-content">
      <slot name="content"><slot /></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.p-card.card {
  background: var(--russ-bg-elevated);
  border: 1px solid var(--russ-border);
  border-radius: 12px;
  box-shadow: 0 1px 4px var(--russ-shadow-color);
  box-sizing: border-box;
}

.p-card-title {
  padding: 16px 20px;
  border-bottom: 1px solid var(--russ-border);
  color: var(--russ-text-primary);
  font-weight: 600;
}

.p-card-content {
  padding: 20px 24px;
  color: var(--russ-text-primary);
}
</style>
