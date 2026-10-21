<template>
  <div class="content-block" :class="{ 'content-block--wide': wide }">
    <div v-if="title || $slots['header-actions']" class="block-header">
      <div v-if="title || $slots['header-meta']" class="block-header__lead">
        <h2 v-if="title" class="block-title">{{ title }}</h2>
        <slot name="header-meta" />
      </div>
      <div v-if="$slots['header-actions']" class="block-header__actions">
        <slot name="header-actions" />
      </div>
    </div>

    <p v-if="lead" class="hint content-block__lead">{{ lead }}</p>

    <div v-if="hasToolbar" class="block-toolbar">
      <div v-if="$slots['toolbar-filters']" class="block-toolbar__filters">
        <slot name="toolbar-filters" />
      </div>
      <div v-if="$slots['toolbar-actions']" class="block-toolbar__actions">
        <slot name="toolbar-actions" />
      </div>
    </div>

    <div class="block-body">
      <slot />
    </div>

    <div v-if="$slots.footer" class="block-footer">
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, useSlots } from "vue";

defineProps<{
  title?: string;
  lead?: string;
  wide?: boolean;
}>();

const slots = useSlots();

const hasToolbar = computed(
  () => Boolean(slots["toolbar-filters"] || slots["toolbar-actions"]),
);
</script>

<style scoped>
.content-block :deep(.base-table th.actions-header) {
  text-align: left;
  vertical-align: middle;
}

.content-block :deep(.base-table td.actions-cell) {
  text-align: center;
  vertical-align: middle;
}

.content-block :deep(.actions-cell-inner) {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  gap: 4px;
}

@media (max-width: 768px) {
  .content-block__lead {
    display: none;
  }
}
</style>
