<script setup lang="ts">
import { BaseSelect } from '../../shared/ui'
import { RrSearchInput } from '@/shared/ui'

defineProps<{
  mainTab: string
  filterFio: string
  filterRole: string | number
  filterProjectId: string | number
  filterPointId: string | number
  filteredRoles: Array<{ id: string | number; name: string }>
  canUseProjectFilter: boolean
  projectOptions: Array<{ id: string | number; name: string }>
  pointOptions: Array<{ id: string | number; name: string }>
  searchPending?: boolean
}>()

const emit = defineEmits<{
  'update:filterFio': [value: string]
  'update:filterRole': [value: string | number]
  'update:filterProjectId': [value: string | number]
  'update:filterPointId': [value: string | number]
  search: []
}>()
</script>

<template>
  <div class="filters-block header-bar">
    <div class="filters-row">
      <div class="search-wrapper" :class="{ 'search-wrapper--pending': searchPending }">
        <RrSearchInput
          :model-value="filterFio"
          placeholder="Поиск по ФИО или телефону"
          @update:model-value="emit('update:filterFio', $event)"
          @search="emit('search')"
        />
        <span
          v-if="searchPending"
          class="search-pending-spinner"
          aria-label="Поиск…"
          aria-live="polite"
        ></span>
      </div>
      <BaseSelect
        v-if="mainTab === 'staff' || mainTab === 'blocked'"
        :model-value="filterRole"
        :options="[{ id: '', name: 'Все роли' }, ...filteredRoles]"
        option-label="name"
        option-value="id"
        placeholder="Все роли"
        class="filter-select agents-select"
        :searchable="true"
        @update:model-value="emit('update:filterRole', $event)"
      />
      <BaseSelect
        v-if="mainTab === 'projects' && canUseProjectFilter"
        :model-value="filterProjectId"
        :options="[{ id: '', name: 'Все проекты' }, ...projectOptions]"
        option-label="name"
        option-value="id"
        placeholder="Все проекты"
        class="filter-select agents-select"
        :searchable="true"
        @update:model-value="emit('update:filterProjectId', $event)"
      />

      <transition name="fade-slide">
        <BaseSelect
          v-if="mainTab === 'projects' && canUseProjectFilter && filterProjectId && filterProjectId !== ''"
          :model-value="filterPointId"
          :options="[{ id: '', name: 'Все точки' }, ...pointOptions]"
          option-label="name"
          option-value="id"
          placeholder="Все точки"
          class="filter-select point-select agents-select"
          :searchable="true"
          @update:model-value="emit('update:filterPointId', $event)"
        />
      </transition>
    </div>
  </div>
</template>

<style scoped>
.filters-block {
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
}

.filters-block.header-bar {
  gap: 12px;
}

.search-wrapper {
  position: relative;
  flex: 1;
  min-width: 180px;
  height: 48px;
  width: 100%;
}

.search-wrapper--pending :deep(.search-wrapper) {
  padding-right: 44px;
}

.search-pending-spinner {
  position: absolute;
  right: 14px;
  top: 50%;
  width: 18px;
  height: 18px;
  margin-top: -9px;
  border: 2px solid rgba(0, 0, 0, 0.12);
  border-top-color: var(--russ-primary, #2563eb);
  border-radius: 50%;
  animation: agents-search-spin 0.7s linear infinite;
  pointer-events: none;
}

@keyframes agents-search-spin {
  to {
    transform: rotate(360deg);
  }
}

.filters-row {
  display: flex;
  gap: 12px;
  align-items: center;
  width: 100%;
  --filters-control-height: 48px;
}

.agents-select {
  max-width: 200px;
  --status-select-height: var(--filters-control-height);
  --status-select-height-mobile: var(--filters-control-height);
  --base-select-height: var(--filters-control-height);
  --base-select-min-height: var(--filters-control-height);
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.28s cubic-bezier(0.4, 0, 0.2, 1),
    transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-16px);
}

.fade-slide-enter-to,
.fade-slide-leave-from {
  opacity: 1;
  transform: translateY(0);
}
</style>
