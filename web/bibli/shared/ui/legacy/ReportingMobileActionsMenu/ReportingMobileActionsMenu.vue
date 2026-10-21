<template>
  <RrBottomSheet
    :model-value="modelValue"
    :title="title"
    placement="sheet"
    height-mode="fit"
    :height-percent="70"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <ul class="reporting-mobile-actions" role="list">
      <li v-for="action in actions" :key="action.id">
        <button
          type="button"
          class="reporting-mobile-actions__item"
          :disabled="action.disabled"
          @click="onSelect(action.id)"
        >
          <span class="reporting-mobile-actions__icon" aria-hidden="true">
            <i :class="action.icon"></i>
          </span>
          <span class="reporting-mobile-actions__text">
            <span class="reporting-mobile-actions__label">{{ action.label }}</span>
            <span v-if="action.hint" class="reporting-mobile-actions__hint">{{ action.hint }}</span>
          </span>
          <span class="reporting-mobile-actions__chevron" aria-hidden="true">›</span>
        </button>
      </li>
    </ul>
  </RrBottomSheet>
</template>

<script setup lang="ts">
import RrBottomSheet from 'bibli/shared/ui/rr/overlays/RrBottomSheet.vue'
import type { ReportingMobileAction } from './types'

defineProps<{
  modelValue: boolean
  title?: string
  actions: ReportingMobileAction[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  select: [id: string]
}>()

function onSelect(id: string) {
  emit('select', id)
  emit('update:modelValue', false)
}
</script>
