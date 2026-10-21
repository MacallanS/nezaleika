<script setup lang="ts">
import { computed } from 'vue'
import RrColumnSortIcon from './RrColumnSortIcon.vue'
import './rr-grid-list.css'

export interface RrGridListColumn {
  key: string
  label: string
  sortable?: boolean
  sortKey?: string
  align?: 'start' | 'center' | 'end'
  interactive?: boolean
  stack?: boolean
}

const props = withDefaults(
  defineProps<{
    columns: RrGridListColumn[]
    items: unknown[]
    rowKey?: (item: unknown, index: number) => string | number
    gridTemplate?: string
    loading?: boolean
    skeletonCount?: number
    sortKey?: string | null
    sortDir?: 'asc' | 'desc' | null
    /** Строка как кнопка (курсор, role, клик). Выключить, если деталка не открывается. */
    rowClickable?: boolean
  }>(),
  {
    skeletonCount: 4,
    loading: false,
    sortKey: null,
    sortDir: null,
    rowClickable: true,
  },
)

const emit = defineEmits<{
  sort: [sortKey: string]
  rowClick: [item: unknown, index: number]
}>()

const rootStyle = computed(() => {
  if (!props.gridTemplate) return undefined
  return { '--rr-grid-list-template': props.gridTemplate } as Record<string, string>
})

function resolveRowKey(item: unknown, index: number): string | number {
  if (props.rowKey) return props.rowKey(item, index)
  return index
}

function headCellClass(column: RrGridListColumn): string[] {
  const classes = ['rr-grid-list__head-cell', `rr-grid-list__head-cell--${column.key}`]
  if (column.align === 'center') classes.push('rr-grid-list__head-cell--align-center')
  if (column.align === 'end') classes.push('rr-grid-list__head-cell--align-end')
  return classes
}

function cellClass(column: RrGridListColumn): string[] {
  const classes = ['rr-grid-list__cell', `rr-grid-list__cell--${column.key}`]
  if (column.align === 'center') classes.push('rr-grid-list__cell--align-center')
  if (column.align === 'end') classes.push('rr-grid-list__cell--align-end')
  if (column.interactive) classes.push('rr-grid-list__cell--interactive')
  if (column.stack) classes.push('rr-grid-list__cell--stack')
  return classes
}

function onRowClick(item: unknown, index: number) {
  if (!props.rowClickable) return
  emit('rowClick', item, index)
}

function onCellClick(event: MouseEvent, column: RrGridListColumn) {
  if (column.interactive) {
    event.stopPropagation()
  }
}
</script>

<template>
  <div class="rr-grid-list" :style="rootStyle">
    <div v-if="!loading && !items.length" class="rr-grid-list__empty">
      <slot name="empty">Ничего не найдено</slot>
    </div>

    <div v-else class="rr-grid-list__scroll">
      <div class="rr-grid-list__head">
        <div
          v-for="column in columns"
          :key="column.key"
          :class="headCellClass(column)"
        >
          <button
            v-if="column.sortable && column.sortKey"
            type="button"
            class="rr-grid-list__sort"
            :aria-label="`Сортировка: ${column.label}`"
            @click="emit('sort', column.sortKey)"
          >
            <span>{{ column.label }}</span>
            <RrColumnSortIcon
              :column-key="column.sortKey"
              :active-key="sortKey"
              :direction="sortDir"
            />
          </button>
          <span v-else>{{ column.label }}</span>
        </div>
      </div>

      <div v-if="loading" class="rr-grid-list__loading">
        <slot name="loading">
          <div
            v-for="index in skeletonCount"
            :key="index"
            class="rr-grid-list__skeleton"
          />
        </slot>
      </div>

      <div v-else class="rr-grid-list__rows">
        <div
          v-for="(item, index) in items"
          :key="resolveRowKey(item, index)"
          class="rr-grid-list__row"
          :class="{ 'rr-grid-list__row--static': !rowClickable }"
          :role="rowClickable ? 'button' : undefined"
          :tabindex="rowClickable ? 0 : undefined"
          @click="onRowClick(item, index)"
          @keydown.enter="onRowClick(item, index)"
          @keydown.space.prevent="onRowClick(item, index)"
        >
          <div
            v-for="column in columns"
            :key="column.key"
            :class="cellClass(column)"
            @click="onCellClick($event, column)"
          >
            <slot
              :name="`cell-${column.key}`"
              :item="item"
              :index="index"
              :column="column"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
