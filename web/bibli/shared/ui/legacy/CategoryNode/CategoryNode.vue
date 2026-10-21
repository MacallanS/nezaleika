<template>
  <div class="category-node">
    <div
      class="category-row"
      :class="{ inactive: !category.is_active, selected: selectedId === category.id }"
    >
      <span class="category-name">{{ category.name }}</span>
      <span v-if="!category.is_active" class="badge badge-inactive">Архив</span>
      <div class="category-actions">
        <button type="button" class="icon-btn" title="Редактировать" @click="$emit('edit', category)">
          <i class="pi pi-pencil"></i>
        </button>
        <button
          v-if="category.is_active"
          type="button"
          class="icon-btn"
          title="В архив"
          @click="$emit('archive', category)"
        >
          <i class="pi pi-archive"></i>
        </button>
      </div>
    </div>
    <div v-if="category.children?.length" class="category-children">
      <CategoryNode
        v-for="child in category.children"
        :key="child.id"
        :category="child"
        :selected-id="selectedId"
        @edit="$emit('edit', $event)"
        @archive="$emit('archive', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Category } from './types'

defineProps<{
  category: Category
  selectedId: number | null
}>()

defineEmits<{
  edit: [cat: Category]
  archive: [cat: Category]
}>()
</script>

<style scoped>
.category-node {
  margin-left: 0;
}
.category-children {
  margin-left: 1.25rem;
}
.category-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.5rem;
  border-radius: 6px;
}
.category-row.selected {
  background: var(--russ-info-light);
}
.category-row.inactive {
  opacity: 0.75;
}
.category-name {
  flex: 1;
}
.category-actions {
  display: flex;
  gap: 0.25rem;
}
.icon-btn {
  padding: 0.25rem;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 4px;
  color: var(--russ-text-primary, var(--russ-text-secondary));
}
.icon-btn:hover {
  background: var(--russ-bg-hover, var(--russ-border));
}
.badge-inactive {
  font-size: 0.75rem;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  background: var(--russ-border-dark, var(--russ-border-dark));
  color: var(--russ-text-primary, var(--russ-text-secondary));
}
</style>
