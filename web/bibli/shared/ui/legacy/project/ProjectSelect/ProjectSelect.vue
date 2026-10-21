<template>
  <div class="project-select-unified">
    <StatusSelect
      :model-value="modelValue"
      :options="options"
      :placeholder="placeholder"
      :disabled="disabled"
      v-bind="$attrs"
      @update:model-value="emit('update:modelValue', $event)"
    />
  </div>
</template>

<script setup lang="ts">
import { StatusSelect } from '../../index'

type SelectOption = Record<string, any>

withDefaults(
  defineProps<{
    modelValue?: string | number | null
    options?: SelectOption[]
    placeholder?: string
    disabled?: boolean
  }>(),
  {
    modelValue: '',
    options: () => [],
    placeholder: 'Проект',
    disabled: false,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number | null): void
}>()
</script>

<style scoped>
.project-select-unified {
  width: 100%;
  min-width: 0;
  --status-select-height: var(--project-select-height, var(--filter-control-height-md, 40px));
  --status-select-font-size: var(--filter-control-font-size-md, 14px);
}
</style>
