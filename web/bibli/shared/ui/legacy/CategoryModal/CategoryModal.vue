<template>
  <BaseModal
    v-model="modalVisible"
    width="100vw"
    max-width="1400px"
    class="category-modal"
    @hide="onHide"
  >
    <AddItemBlock
      :items="categories"
      :available-items="[]"
      :list-loading="categoriesLoading"
      :add-loading="false"
      :add-button-loading="addCategoryLoading"
      :config="config"
      :get-item-name="(item: any) => item.name"
      :get-item-subtitle="(item: any) => `ID: ${item.id}`"
      :get-avatar-text="(item: any) => item.name.charAt(0).toUpperCase()"
      avatar-class="category-avatar"
      avatar-icon="pi pi-tag"
      :show-edit-button="true"
      @add="handleAdd"
      @remove="handleRemove"
      @edit="handleEdit"
    >
      <template #select>
        <div class="category-add-form">
          <div v-if="editingCategory" class="category-edit-mode">
            <i class="pi pi-pencil"></i>
            <span>Редактирование категории: {{ editingCategory.name }}</span>
            <button
              class="category-cancel-edit-btn"
              @click="handleCancelEdit"
              title="Отменить редактирование"
            >
              <i class="pi pi-times"></i>
            </button>
          </div>
          <div class="category-input-group">
            <label class="category-label">
              {{ editingCategory ? 'Новое название категории:' : 'Название категории:' }}
            </label>
            <input
              v-model="categoryName"
              type="text"
              class="category-input"
              :class="{ 'category-input-error': categoryNameError }"
              :placeholder="editingCategory ? 'Введите новое название категории' : 'Введите название категории'"
              @input="validateCategoryName"
              @keyup.enter="handleAddCategory"
            />
            <div v-if="categoryNameError" class="category-error-message">
              Название категории не может быть пустым
            </div>
            <button
              class="category-add-btn"
              :class="{ 'category-edit-btn': editingCategory }"
              @click="handleAddCategory"
              :disabled="addCategoryLoading || !categoryName.trim() || categoryNameError"
            >
              <span v-if="addCategoryLoading" class="loader"></span>
              <i v-else-if="editingCategory" class="pi pi-check"></i>
              <i v-else class="pi pi-plus"></i>
              <span v-if="addCategoryLoading">
                {{ editingCategory ? 'Обновление...' : 'Добавление...' }}
              </span>
              <span v-else>
                {{ editingCategory ? 'Обновить' : 'Добавить' }}
              </span>
            </button>
          </div>
        </div>
      </template>
    </AddItemBlock>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import { BaseModal } from '@/shared/ui';
import { AddItemBlock } from '~/widgets';
import type { Category } from '~/entities/product';


interface Props {
  visible: boolean;
  categories: Category[];
  categoriesLoading: boolean;
  addCategoryLoading: boolean;
  editingCategory: Category | null;
}

interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'add', category: { name: string }): void;
  (e: 'remove', category: Category): void;
  (e: 'edit', category: Category): void;
  (e: 'cancel-edit'): void;
  (e: 'close'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const modalVisible = computed({
  get: () => props.visible,
  set: (value: boolean) => emit('update:visible', value)
});

const categoryName = ref('');
const categoryNameError = ref(false);

// Watch for editing category changes
watch(() => props.editingCategory, (newCategory) => {
  if (newCategory) {
    categoryName.value = newCategory.name || '';
  } else {
    categoryName.value = '';
  }
  categoryNameError.value = false;
}, { immediate: true });

const config = {
  listTitle: 'Текущие категории',
  addTitle: 'Добавить новую категорию',
  listLoadingText: 'Загрузка категорий...',
  addLoadingText: 'Загрузка...',
  addButtonLoadingText: 'Добавление...',
  emptyText: 'Нет категорий',
  emptySubtext: 'Создайте первую категорию',
  allAddedText: 'Все категории созданы',
  allAddedSubtext: 'Нет доступных категорий для добавления',
  selectLabel: 'Название категории',
  selectPlaceholder: 'Введите название',
  addButtonText: 'Создать категорию',
  removeButtonTitle: 'Удалить категорию'
};

const validateCategoryName = () => {
  categoryNameError.value = !categoryName.value.trim();
};

const handleAdd = (itemId: string | number | Record<string, any>) => {
  if (typeof itemId === 'object' && itemId !== null) {
    emit('add', itemId as Category);
  } else {
    // If itemId is passed, find the category in props
    const category = props.categories.find(cat => cat.id === itemId);
    if (category) {
      emit('add', category);
    }
  }
  categoryName.value = '';
  categoryNameError.value = false;
};

const handleAddCategory = () => {
  if (!categoryName.value.trim() || categoryNameError.value) return;
  emit('add', { name: categoryName.value.trim() } as any);
  categoryName.value = '';
  categoryNameError.value = false;
};

const handleRemove = (itemId: string | number) => {
  const category = props.categories.find(cat => cat.id === itemId);
  if (category) {
    emit('remove', category);
  }
};

const handleEdit = (item: any) => {
  emit('edit', item as Category);
};

const handleCancelEdit = () => {
  categoryName.value = '';
  categoryNameError.value = false;
  emit('cancel-edit');
};

const onHide = () => {
  emit('close');
};
</script>

<style scoped>
.category-add-form {
  padding: 1rem;
}

.category-edit-mode {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: var(--russ-info-light);
  border: 1px solid var(--russ-info);
  border-radius: 8px;
  margin-bottom: 1rem;
  color: var(--russ-info-text);
  font-weight: 600;
}

.category-cancel-edit-btn {
  margin-left: auto;
  background: none;
  border: none;
  color: var(--russ-info-text);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.category-cancel-edit-btn:hover {
  background: rgba(255, 255, 255, 0.5);
}

.category-input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.category-label {
  font-weight: 600;
  color: var(--russ-text-secondary);
  font-size: 14px;
}

.category-input {
  width: 100%;
  padding: 14px 16px;
  border: 1.5px solid var(--russ-border);
  border-radius: 10px;
  background: var(--russ-bg-quaternary);
  transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
  box-shadow: 0 1px 4px var(--russ-shadow-accent-light);
  color: var(--russ-text-primary);
  box-sizing: border-box;
}

.category-input:focus {
  border-color: var(--russ-input-border-focus);
  box-shadow: 1px 0px 5px 5px var(--russ-shadow-color);
  outline: none;
  background: var(--russ-bg);
}

.category-input:hover {
  border-color: var(--russ-border-dark);
  background: var(--russ-bg);
}

.category-input-error {
  border-color: var(--russ-error) !important;
}

.category-error-message {
  color: var(--russ-error);
  font-size: 12px;
  margin-top: -0.25rem;
}

.category-add-btn {
  padding: 12px 24px;
  background: var(--russ-accent-dark);
  color: var(--russ-text-inverse);
  border: none;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
  margin-top: 0.5rem;
}

.category-add-btn:hover:not(:disabled) {
  background: var(--russ-accent-dark);
  box-shadow: 0 4px 12px rgba(29, 76, 210, 0.3);
}

.category-add-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.category-edit-btn {
  background: var(--russ-success);
}

.category-edit-btn:hover:not(:disabled) {
  background: var(--russ-success-dark);
}

.loader {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: var(--russ-text-inverse);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
