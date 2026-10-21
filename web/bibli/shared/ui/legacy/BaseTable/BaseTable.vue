<template>
  <div class="table-container">
    <div v-if="showFilters" class="table-filters">
      <div class="filters-row">
        <ColumnFilter v-for="column in filterableColumns" :key="column.key" :label="column.header"
          :placeholder="`Фильтр по ${column.header.toLowerCase()}`" v-model="columnFilters[column.key]"
          @filter="(value) => handleColumnFilter(column.key, value)" />
      </div>
    </div>
    <div class="table-scroll">
      <table class="base-table">
        <thead>
          <tr>
            <th v-for="column in columns" :key="column.key"
              :class="[
                column.headerClass,
                columnColClass(column),
                { 'sortable': column.sortable !== false },
              ]"
              @click="column.sortable !== false ? handleSort(column.key) : null">
              <div class="header-content">
                <span>{{ column.header }}</span>
                <!-- Стрелка только при серверной сортировке: иначе внешний вид
                     таблиц в других проектах остаётся прежним. -->
                <i
                  v-if="serverSort && column.sortable !== false && sortKey === column.key"
                  class="sort-arrow"
                  :class="sortDir === 'asc' ? 'pi pi-sort-up' : 'pi pi-sort-down'"
                ></i>
              </div>
            </th>
            <th v-if="showActions" class="actions-header">Действия</th>
          </tr>
        </thead>
        <tbody :aria-busy="loading" :aria-label="loading ? loadingText : undefined">
          <template v-if="loading">
            <tr
              v-for="row in loadingSkeletonRows"
              :key="`skeleton-${row}`"
              class="table-row table-row--skeleton"
              aria-hidden="true"
            >
              <td
                v-for="(column, colIndex) in columns"
                :key="column.key"
                :class="[column.cellClass, columnColClass(column)]"
              >
                <span
                  class="table-skeleton-bar"
                  :class="skeletonBarClass(colIndex, row)"
                ></span>
              </td>
              <td v-if="showActions" class="actions-cell">
                <span class="table-skeleton-bar table-skeleton-bar--xs"></span>
              </td>
            </tr>
          </template>
          <template v-else>
            <tr
              v-for="(item, index) in sortedItems"
              :key="item.id || index"
              class="table-row"
              :class="rowClass"
              @click="handleRowClick ? handleRowClick(item) : null"
            >
              <td
                v-for="column in columns"
                :key="column.key"
                :class="[column.cellClass, columnColClass(column)]"
                :data-label="column.header"
              >
                <slot
                  :name="`cell-${column.key}`"
                  :item="item"
                  :column="column"
                  :value="getNestedValue(item, column.key)"
                >
                  {{ getNestedValue(item, column.key) }}
                </slot>
              </td>
              <td v-if="showActions" class="actions-cell" data-label="Действия">
                <div class="actions-cell-inner">
                  <slot name="actions" :item="item">
                  </slot>
                </div>
              </td>
            </tr>
            <tr v-if="sortedItems.length === 0" class="table-meta-row">
              <td :colspan="tableColspan" class="no-results">
                {{ noResultsText }}
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ColumnFilter } from '../ColumnFilter'
import { fuzzyMatch } from 'bibli/shared/utils'

interface TableColumn {
  key: string
  header: string
  headerClass?: string
  cellClass?: string
  sortable?: boolean
  filterable?: boolean
  sortKey?: string
  hideBelowTablet?: boolean
  hideOnMobile?: boolean
}

interface Props {
  columns: TableColumn[]
  items: any[]
  loading?: boolean
  loadingText?: string
  loadingSkeletonRows?: number
  noResultsText?: string
  showActions?: boolean
  showFilters?: boolean
  rowClass?: string
  handleRowClick?: (item: any) => void
  /**
   * Сортировкой управляет страница: таблица не переставляет строки сама, а
   * сообщает о клике по заголовку событием `sort`. Нужно там, где на экране
   * лежит одна страница из многих и локальная сортировка вводит в заблуждение.
   * По умолчанию выключено — прежнее поведение сохраняется.
   */
  serverSort?: boolean
  /** Активная колонка при serverSort (ключ колонки). */
  sortKey?: string | null
  /** Направление активной сортировки при serverSort. */
  sortDir?: 'asc' | 'desc'
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  loadingText: 'Загрузка...',
  loadingSkeletonRows: 6,
  noResultsText: 'Ничего не найдено',
  showActions: false,
  showFilters: false,
  rowClass: '',
  handleRowClick: undefined,
  serverSort: false,
  sortKey: null,
  sortDir: 'asc',
})

const emit = defineEmits<{
  (e: 'sort', payload: { key: string; direction: 'asc' | 'desc' }): void
}>()

const sortColumn = ref<string>('')
const sortDirection = ref<'asc' | 'desc'>('asc')
const columnFilters = ref<Record<string, string>>({})

const filterableColumns = computed(() => {
  return props.columns.filter(col => col.filterable !== false)
})

const tableColspan = computed(() => {
  const columnsCount = props.columns.length + (props.showActions ? 1 : 0)
  return Math.max(1, columnsCount)
})

const filteredItems = computed(() => {
  let filtered = props.items

  Object.entries(columnFilters.value).forEach(([columnKey, filterValue]) => {
    if (filterValue.trim()) {
      filtered = filtered.filter(item => {
        const value = getNestedValue(item, columnKey)
        return fuzzyMatch(String(value), filterValue, 0.3)
      })
    }
  })

  return filtered
})

const sortedItems = computed(() => {
  // Порядок задал сервер — трогать его нельзя, иначе перемешаем страницу.
  if (props.serverSort) return filteredItems.value
  if (!sortColumn.value) return filteredItems.value

  const column = props.columns.find(c => c.key === sortColumn.value)
  const sortByKey = column?.sortKey ?? sortColumn.value

  return [...filteredItems.value].sort((a, b) => {
    const aValue = getNestedValue(a, sortByKey)
    const bValue = getNestedValue(b, sortByKey)

    // Handle null/undefined values
    if (aValue == null && bValue == null) return 0
    if (aValue == null) return sortDirection.value === 'asc' ? -1 : 1
    if (bValue == null) return sortDirection.value === 'asc' ? 1 : -1

    // Если оба значения можно привести к числу — сравниваем как числа
    const aNum = Number(aValue)
    const bNum = Number(bValue)

    if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) {
      if (aNum < bNum) return sortDirection.value === 'asc' ? -1 : 1
      if (aNum > bNum) return sortDirection.value === 'asc' ? 1 : -1
      return 0
    }

    // Иначе сравниваем как строки
    const aStr = String(aValue).toLowerCase()
    const bStr = String(bValue).toLowerCase()

    if (aStr < bStr) return sortDirection.value === 'asc' ? -1 : 1
    if (aStr > bStr) return sortDirection.value === 'asc' ? 1 : -1
    return 0
  })
})

const handleSort = (columnKey: string) => {
  if (props.serverSort) {
    const direction: 'asc' | 'desc' =
      props.sortKey === columnKey && props.sortDir === 'asc' ? 'desc' : 'asc'
    emit('sort', { key: columnKey, direction })
    return
  }

  if (sortColumn.value === columnKey) {
    // Toggle direction if same column
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    // New column, start with ascending
    sortColumn.value = columnKey
    sortDirection.value = 'asc'
  }
}

const handleColumnFilter = (columnKey: string, value: string) => {
  columnFilters.value[columnKey] = value
}

const getNestedValue = (obj: any, path: string) => {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : ''
  }, obj)
}

const columnColClass = (column: TableColumn) => {
  return {
    'col--hide-tablet': column.hideBelowTablet === true,
    'col--hide-mobile': column.hideOnMobile === true,
  }
}

const skeletonBarSizes = ['sm', 'md', 'lg', 'md', 'sm', 'lg'] as const

const skeletonBarClass = (colIndex: number, rowIndex: number) => {
  const size = skeletonBarSizes[(colIndex + rowIndex) % skeletonBarSizes.length]
  return `table-skeleton-bar--${size}`
}
</script>

<style scoped>
.sort-arrow {
  margin-left: 6px;
  font-size: 12px;
  color: var(--russ-primary, #2f6fdb);
}

.table-container {
  width: 100%;
  min-width: 0;
  min-inline-size: 100%;
  max-width: 100%;
  overflow: visible;
  display: flex;
  flex-direction: column;
  margin-top: 10px;
  border-radius: 12px;
}

.table-filters {
  background: var(--russ-bg-secondary);
  border: 1px solid var(--russ-border);
  border-radius: 12px 12px 0 0;
  padding: 16px;
  margin-bottom: 0;
}

.filters-row {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  align-items: flex-end;
}

.table-scroll {
  height: auto;
  width: 100%;
  min-inline-size: 100%;
  min-width: 0;
  overflow-x: auto;
  overflow-y: visible;
  -webkit-overflow-scrolling: touch;
}

.base-table {
  width: 100%;
  min-width: 0;
  table-layout: auto;
  border-collapse: separate;
  border-spacing: 0;
  border-radius: 0 0 14px 14px;
  overflow: hidden;
}

.base-table th,
.base-table td {
  padding: 14px 16px;
  border-bottom: 1px solid var(--russ-border);
  font-size: clamp(14px, calc(14px + (18 - 14) * ((100vw - 320px) / (1920 - 320))), 18px);
  color: var(--russ-text-secondary);
  background: var(--russ-bg);
  vertical-align: top;
}

.table-row--skeleton {
  cursor: default;
  pointer-events: none;
}

.table-row--skeleton:hover {
  background: var(--russ-bg);
}

.table-skeleton-bar {
  display: block;
  height: 14px;
  border-radius: 6px;
  background: var(--rr-fx-skeleton-base, var(--russ-bg-tertiary));
  position: relative;
  overflow: hidden;
}

.table-skeleton-bar::after {
  content: '';
  position: absolute;
  inset: 0;
  transform: translateX(-100%);
  background: linear-gradient(
    90deg,
    transparent,
    var(--rr-fx-skeleton-highlight, rgba(255, 255, 255, 0.45)),
    transparent
  );
  animation: table-skeleton-shimmer 1.4s ease-in-out infinite;
}

.table-skeleton-bar--xs {
  width: 48px;
  height: 28px;
}

.table-skeleton-bar--sm {
  width: 58%;
}

.table-skeleton-bar--md {
  width: 76%;
}

.table-skeleton-bar--lg {
  width: 92%;
}

@keyframes table-skeleton-shimmer {
  100% {
    transform: translateX(100%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .table-skeleton-bar::after {
    animation: none;
  }
}

.base-table td {
  color: var(--russ-text-primary);
}

.base-table th {
  background: var(--russ-bg-secondary);
  text-align: left;
  font-weight: 600;
  color: var(--russ-text-secondary);
}

.base-table thead tr th:first-child {
  border-top-left-radius: 0;
}

.base-table thead tr th:last-child {
  border-top-right-radius: 0;
}

@media (min-width: 641px) {
  .base-table tbody tr:last-child td:first-child {
    border-bottom-left-radius: 0px;
  }

  .base-table tbody tr:last-child td:last-child {
    border-bottom-right-radius: 0px;
  }
}

.table-row {
  transition: background-color 0.2s ease;
  cursor: pointer;
}

.table-row:hover {
  background: var(--russ-bg-quaternary);
}

.base-table td.actions-cell {
  padding: 14px 10px !important;
  height: auto;
  text-align: center;
  vertical-align: middle;
}

.actions-cell-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding-left: 0;
  box-sizing: border-box;
}

.actions-header {
  text-align: center;
}

.sortable {
  cursor: pointer;
  user-select: none;
  transition: background-color 0.2s ease;
}

.sortable:hover {
  background: var(--russ-bg-hover);
}

.header-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.no-results {
  text-align: center;
  color: var(--russ-text-tertiary);
  font-style: italic;
}

/* Планшет: компактнее, без принудительной ширины; скрываем второстепенные колонки */
@media (max-width: 1024px) and (min-width: 641px) {
  .table-filters {
    padding: 12px;
  }

  .filters-row {
    gap: 12px;
  }

  .base-table th,
  .base-table td {
    padding: 10px 12px;
    font-size: 14px;
  }

  .base-table th:not(.actions-header),
  .base-table td:not(.actions-cell) {
    max-width: min(20rem, 42vw);
    overflow-wrap: anywhere;
  }
}

@media (max-width: 899px) and (min-width: 641px) {
  .base-table :is(th, td).col--hide-tablet {
    display: none !important;
  }
}

/* Телефон: та же таблица, горизонтальный скролл, плотнее ячейки */
@media (max-width: 640px) {
  .table-filters {
    padding: 10px;
  }

  .filters-row {
    gap: 10px;
  }

  .table-scroll {
    overflow-x: auto;
  }

  .base-table {
    width: max-content;
    min-width: 100%;
  }

  .base-table :is(th, td).col--hide-tablet,
  .base-table :is(th, td).col--hide-mobile {
    display: none !important;
  }

  .base-table th,
  .base-table td {
    padding: 8px 10px;
    font-size: 13px;
    vertical-align: middle;
  }

  .actions-cell {
    vertical-align: middle;
  }

  .actions-cell-inner {
    align-items: center;
    justify-content: center;
    height: 100%;
    min-height: 100%;
  }

  .header-content {
    gap: 6px;
  }
}
</style>
