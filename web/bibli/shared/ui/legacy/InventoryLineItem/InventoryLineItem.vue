<template>
  <div class="inventory-line-item" :style="{ '--filter-control-height': LINE_CONTROL_HEIGHT }">
    <BaseSelect
      v-model="line.sku_id"
      :options="skuOptions"
      placeholder="Выберите SKU *"
      option-label="name"
      option-value="id"
      :searchable="true"
      :height="LINE_CONTROL_HEIGHT"
      class="line-select"
      @update:model-value="handleSkuChange"
    />
    <InputText
      v-model="qtyValue"
      type="number"
      :name="qtyFieldName || 'qty'"
      :placeholder="qtyPlaceholder || 'Количество *'"
      class="line-input"
    />
    <button
      class="line-remove-btn"
      type="button"
      @click="$emit('remove')"
      :disabled="disabled"
      title="Удалить"
    >
      <i class="pi pi-trash"></i>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { BaseSelect, InputText } from '@/shared/ui'

const props = defineProps<{
  line: { sku_id: number | ''; qty?: number | null; delta_qty?: number | null }
  skuOptions: Array<{ id: number | ''; name: string }>
  qtyFieldName?: string
  qtyPlaceholder?: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  remove: []
  skuChanged: []
}>()

/** Единая высота строки: берём общий размер контролов из темы */
const LINE_CONTROL_HEIGHT = 'var(--ui-control-height, var(--filter-control-height, var(--filter-control-height-md, 40px)))'

function handleSkuChange() {
  emit('skuChanged')
}

// Поддержка разных полей количества (qty или delta_qty)
const qtyValue = computed({
  get: () => {
    // Проверяем наличие свойства через undefined
    if (props.line.qty !== undefined) {
      return props.line.qty
    }
    if (props.line.delta_qty !== undefined) {
      return props.line.delta_qty
    }
    return null
  },
  set: (value: number | null) => {
    // Обновляем соответствующее поле напрямую
    if (props.line.qty !== undefined) {
      props.line.qty = value
    } else if (props.line.delta_qty !== undefined) {
      props.line.delta_qty = value
    }
  }
})
</script>

<style scoped>
.inventory-line-item {
  display: grid;
  grid-template-columns: 1fr 160px auto;
  gap: 10px;
  align-items: center;
  margin: 5px 0;
}

.line-select {
  width: 100%;
}

.line-input {
  width: 100%;
}

.line-remove-btn {
  height: var(--ui-control-height, var(--filter-control-height, var(--filter-control-height-md, 40px)));
  min-height: var(--ui-control-height, var(--filter-control-height, var(--filter-control-height-md, 40px)));
  min-width: var(--ui-control-height, var(--filter-control-height, var(--filter-control-height-md, 40px)));
  padding: 0 12px;
  border-radius: 8px;
  border: 1px solid var(--russ-border);
  background: var(--russ-bg);
  color: var(--russ-error);
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.18s ease;
  flex-shrink: 0;
}

.line-remove-btn:hover:not(:disabled) {
  background: var(--russ-bg-hover);
  border-color: var(--russ-error);
}

.line-remove-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.line-remove-btn i {
  font-size: 16px;
}

@media (max-width: 900px) {
  .inventory-line-item {
    grid-template-columns: 1fr;
    gap: 8px;
    margin: 2px 0;
  }
  
  .line-remove-btn {
    width: 100%;
    justify-self: stretch;
  }
}
</style>
