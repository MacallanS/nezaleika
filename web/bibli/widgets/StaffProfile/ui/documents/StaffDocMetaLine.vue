<template>
  <p v-if="hasContent" class="staff-doc-meta">
    <span class="staff-doc-meta__primary">
      <img class="staff-doc-meta__icon" :src="iconClock" alt="" width="16" height="16" />
      <span v-if="uploadedLabel">{{ uploadedLabel }}</span>
      <span v-if="uploadedLabel" class="staff-doc-meta__dot" aria-hidden="true">·</span>
      <span>версия {{ version }}</span>
    </span>
    <span v-if="reasonLabel" class="staff-doc-meta__reason">
      <span class="staff-doc-meta__reason-text">причина: «{{ reasonLabel }}»</span>
    </span>
  </p>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import iconClock from '../../assets/icons/clock-backward.svg'

const props = withDefaults(
  defineProps<{
    uploadedLabel?: string
    version?: number
    reasonLabel?: string
  }>(),
  {
    uploadedLabel: '',
    version: 1,
    reasonLabel: '',
  },
)

const hasContent = computed(
  () => Boolean(props.uploadedLabel || props.reasonLabel || props.version),
)
</script>

<style scoped>
.staff-doc-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  margin: 0;
  min-width: 0;
  font-family: var(--rr-font-family-font-family, Manrope, system-ui, sans-serif);
  font-size: var(--rr-font-size-font-size-xs, 12px);
  line-height: var(--rr-line-height-line-height-xs, 16px);
  color: var(--rr-labels-neutral-secondary, #93939c);
}

.staff-doc-meta__primary {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.staff-doc-meta__reason {
  display: block;
  width: 100%;
  min-width: 0;
}

.staff-doc-meta__reason-text {
  min-width: 0;
  white-space: normal;
  overflow-wrap: anywhere;
}

.staff-doc-meta__icon {
  display: block;
  flex-shrink: 0;
  width: 16px;
  height: 16px;
}

.staff-doc-meta__dot {
  flex-shrink: 0;
  color: var(--rr-labels-neutral-secondary, #93939c);
}
</style>
