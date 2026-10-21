<template>
  <div v-if="codes.length" class="code-chips">
    <span v-for="code in visibleCodes" :key="code" class="code-chip">
      <span class="code-chip__text">{{ displayCode(code) }}</span>
      <button
        type="button"
        class="code-chip__remove"
        :aria-label="`Удалить ${code}`"
        @click="emit('remove', code)"
      >
        <i class="pi pi-times" aria-hidden="true"></i>
      </button>
    </span>
    <button
      v-if="hiddenCount > 0 && !expanded"
      type="button"
      class="code-chip code-chip--more"
      @click="expanded = true"
    >
      ещё {{ hiddenCount }}
    </button>
    <button
      v-else-if="expanded && codes.length > limit"
      type="button"
      class="code-chip code-chip--more"
      @click="expanded = false"
    >
      свернуть
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";

const props = withDefaults(
  defineProps<{
    codes: string[];
    limit?: number;
  }>(),
  { limit: 8 },
);

const emit = defineEmits<{
  (e: "remove", code: string): void;
}>();

const expanded = ref(false);

watch(
  () => props.codes.length,
  () => {
    if (props.codes.length <= props.limit) expanded.value = false;
  },
);

const hiddenCount = computed(() => Math.max(0, props.codes.length - props.limit));

const visibleCodes = computed(() => {
  if (expanded.value || props.codes.length <= props.limit) return props.codes;
  return props.codes.slice(-props.limit);
});

const displayCode = (code: string) => {
  if (code.length <= 22) return code;
  return `${code.slice(0, 10)}…${code.slice(-8)}`;
};
</script>

<style scoped>
.code-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.code-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  max-width: 100%;
  padding: 3px 5px 3px 10px;
  border-radius: 999px;
  background: var(--rr-backgrounds-secondary, #f5f5f7);
  border: 1px solid color-mix(in srgb, var(--rr-input-border-default, #e5e7eb) 88%, transparent);
  font-size: 12px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  color: var(--rr-labels-neutral-secondary, #5f6673);
}

.code-chip__text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.code-chip--more {
  padding: 3px 10px;
  cursor: pointer;
  font-family: inherit;
  font-weight: 600;
  color: var(--rr-labels-brand-primary, #1c4ae5);
  background: color-mix(in srgb, var(--rr-button-brand-primary-background-default, #5b7dec) 10%, #fff);
  border-color: color-mix(in srgb, var(--rr-button-brand-primary-background-default, #5b7dec) 28%, transparent);
}

.code-chip__remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  margin: -10px -8px -10px 0;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--rr-labels-neutral-secondary, #5f6673);
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s ease, color 0.15s ease;
}

.code-chip__remove:hover {
  background: var(--rr-backgrounds-primary, #fff);
  color: var(--rr-input-text-default, #101012);
}

.code-chip__remove i {
  font-size: 12px;
}
</style>
