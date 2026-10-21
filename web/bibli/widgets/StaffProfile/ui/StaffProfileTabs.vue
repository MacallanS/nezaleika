<template>
  <div class="staff-profile-tabs" role="tablist" aria-label="Разделы профиля">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      type="button"
      class="staff-profile-tabs__btn"
      :class="{ 'staff-profile-tabs__btn--active': model === tab.id }"
      role="tab"
      :aria-selected="model === tab.id"
      @click="model = tab.id"
    >
      <span>{{ tab.label }}</span>
      <span v-if="tab.count != null" class="staff-profile-tabs__count">· {{ tab.count }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import type { StaffProfileTabOption } from '../lib/staffProfileTabs'

defineProps<{
  tabs: StaffProfileTabOption[]
}>()

const model = defineModel<string>({ required: true })
</script>

<style scoped>
.staff-profile-tabs {
  display: flex;
  flex: 1 1 auto;
  flex-wrap: nowrap;
  align-items: stretch;
  justify-content: flex-start;
  gap: var(--rr-spacing-padding-m, 8px);
  width: 100%;
  min-width: 0;
  overflow-x: auto;
  scrollbar-width: none;
}

.staff-profile-tabs::-webkit-scrollbar {
  display: none;
}

.staff-profile-tabs__btn {
  box-sizing: border-box;
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  gap: var(--rr-spacing-padding-m, 8px);
  width: auto;
  min-width: 0;
  height: 40px;
  min-height: 40px;
  padding: var(--rr-spacing-padding-m, 8px);
  border: none;
  border-radius: 10px;
  background: transparent;
  color: var(--rr-labels-neutral-secondary, rgba(60, 60, 67, 0.72));
  font-family: var(--rr-font-family-font-family, Manrope, system-ui, sans-serif);
  font-size: 15px;
  font-weight: 500;
  line-height: 20px;
  cursor: pointer;
}

.staff-profile-tabs__btn > span:first-child {
  white-space: nowrap;
}

.staff-profile-tabs__btn--active {
  background: var(--rr-backgrounds-neutral-primary-hover, #3c3c43);
  color: var(--rr-button-neutral-primary-text-default, #fff);
}

.staff-profile-tabs__count {
  opacity: 0.9;
}

@media (min-width: 769px) {
  .staff-profile-tabs {
    overflow-x: visible;
  }

  .staff-profile-tabs__btn {
    flex: 1 1 0;
    width: 0;
  }
}
</style>
