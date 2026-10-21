<template>
  <div v-if="lastPage > 1" class="russ-table-pagination">
    <Button
      label="Назад"
      class="custom-button-secondary"
      :disabled="pageNum <= 1 || loading"
      @click="goTo(pageNum - 1)"
    />
    <div class="page-info">Страница {{ pageNum }} из {{ lastPage }}</div>
    <Button
      label="Вперёд"
      class="custom-button-secondary"
      :disabled="pageNum >= lastPage || loading"
      @click="goTo(pageNum + 1)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Button } from '@/shared/ui'

const props = withDefaults(
  defineProps<{
    currentPage?: number
    lastPage: number
    loading?: boolean
  }>(),
  { currentPage: 1 }
)

const pageNum = computed(() => Math.max(1, Number(props.currentPage) || 1))

const emit = defineEmits<{
  (e: 'page-change', page: number): void
}>()

function goTo(page: number) {
  const p = Math.max(1, Number(page) || 1)
  emit('page-change', p)
}
</script>

<style>
.russ-table-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 14px;
  padding: 4px 0;
}

.russ-table-pagination .custom-button {
  min-height: 38px !important;
  height: 38px !important;
  padding: 0 16px !important;
  font-size: 14px !important;
  font-weight: 700 !important;
  border-radius: 10px !important;
  border: 1px solid var(--russ-border) !important;
  background: var(--russ-bg-hover) !important;
  color: var(--russ-text-secondary) !important;
  transition: background 0.18s ease, border-color 0.18s ease;
}

.russ-table-pagination .custom-button:hover:not(:disabled) {
  background: var(--russ-border) !important;
  border-color: var(--russ-border) !important;
}

.russ-table-pagination .custom-button:disabled,
.russ-table-pagination .custom-button.custom-button-disabled {
  opacity: 0.55 !important;
  cursor: not-allowed;
}

.russ-table-pagination .page-info {
  color: var(--russ-text-tertiary);
  font-weight: 600;
  font-size: 14px;
}

@media (max-width: 768px) {
  .russ-table-pagination {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
