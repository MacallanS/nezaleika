<!--
  AddItemBlock - Универсальный компонент для добавления/удаления элементов
  
  Использование:
  <AddItemBlock
    :items="[]"                    // Текущие элементы
    :available-items="[]"          // Доступные для добавления элементы
    :config="{                     // Конфигурация текстов (опционально)
      listTitle: 'Заголовок списка',
      addTitle: 'Заголовок добавления',
      listLoadingText: 'Загрузка...',
      addLoadingText: 'Загрузка...',
      addButtonLoadingText: 'Добавление...',
      emptyText: 'Нет элементов',
      emptySubtext: 'Подсказка',
      allAddedText: 'Все добавлены',
      allAddedSubtext: 'Подсказка',
      selectLabel: 'Выберите',
      selectPlaceholder: 'Выберите из списка',
      addButtonText: 'Добавить',
      removeButtonTitle: 'Удалить'
    }"
    :get-item-name="(item) => item.name"           // Функция получения имени
    :get-item-subtitle="(item) => item.subtitle"   // Функция получения подзаголовка
    :show-edit-button="false"                      // Показывать кнопку редактирования
    @add="(itemId) => handleAdd(itemId)"           // Событие добавления
    @remove="(itemId) => handleRemove(itemId)"     // Событие удаления
    @edit="(item) => handleEdit(item)"             // Событие редактирования
  />
  
  События:
  - @add: вызывается при добавлении элемента, передает itemId
  - @remove: вызывается при удалении элемента, передает itemId
  - @edit: вызывается при редактировании элемента, передает item
-->

<template>
  <div class="add-item-block">
    <div class="supports-container">
      <div class="supports-list-column">
        <h4 class="supports-section-title">{{ computedProps.listTitle }}</h4>

        <div v-if="listLoading" class="supports-loading">
          <span class="loader"></span>
          <span>{{ computedProps.listLoadingText }}</span>
        </div>

        <div v-else-if="localItems.length > 0" class="supports-list">
          <div v-for="(item, index) in localItems" :key="item.id" class="support-card"
            :draggable="enableReorder"
            @dragstart="onDragStart(index)"
            @dragover.prevent
            @drop.prevent="onDrop(index)"
            :class="{ 'support-card-disabled': item.disabled }">
            <div class="support-card-content">
              <button
                v-if="enableReorder"
                class="drag-handle-btn"
                type="button"
                title="Перетащите для изменения порядка"
              >
                <i class="pi pi-bars"></i>
              </button>
              <div class="support-avatar category-avatar" :style="getItemAvatarStyle(item)"></div>
              <div v-if="item.disabled" class="locked-indicator" title="Заблокировано">
                <i class="pi pi-lock"></i>
              </div>
              <div class="support-info">
                <div class="support-fio">{{ getItemName(item) }}</div>
                <div v-if="getItemSubtitle(item)" class="support-phone">{{ getItemSubtitle(item) }}</div>
                <div v-if="showProductFields && (productFields && productFields.length)"
                  class="product-fields-under-item ultra-compact">
                  <div
                    v-for="field in (productFields.filter(f => f.product_id === item.id && (!fieldNameFilter || (f.name || '').toLowerCase() === fieldNameFilter)))"
                    :key="(field.id || field.name) + '-' + item.id" class="product-field-row ultra-compact-row">
                    <div class="product-field-controls ultra-compact-controls">
                      <input type="text" class="product-field-input ultra-compact-input"
                        v-model="fieldValues[field.id as number]" :placeholder="field.name || 'Поле'"
                        :data-field-id="field.id" @keyup.enter="updateField(field.id)" @blur="updateField(field.id)" />
                      <button class="product-field-save ultra-compact-save" @click="updateField(field.id)"
                        title="Сохранить">
                        <i class="pi pi-check"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="support-actions">
              <button v-if="showEditButton" class="support-edit-btn"
                :class="{ 'support-edit-btn-disabled': item.disabled }"
                :title="item.disabled ? 'Редактирование заблокировано' : 'Редактировать'" :disabled="item.disabled"
                @click="handleEdit(item)">
                <i class="pi pi-pencil"></i>
              </button>
              <button v-if="showRemoveButton" class="support-remove-btn" :title="computedProps.removeButtonTitle"
                @click="handleRemove(item)">
                <i class="pi pi-trash"></i>
              </button>
            </div>

          </div>
        </div>

        <div v-else class="supports-empty">
          <div class="supports-empty-text">{{ computedProps.emptyText }}</div>
          <div class="supports-empty-subtext">{{ computedProps.emptySubtext }}</div>
        </div>
      </div>

      <div class="supports-add-column">
        <h4 class="supports-section-title">{{ computedProps.addTitle }}</h4>

        <div v-if="false" class="supports-add-loading">
          <span class="loader"></span>
          <span>{{ computedProps.addLoadingText }}</span>
        </div>

        <div v-else class="supports-add-form">
          <slot name="select" :available-items="availableItems" :on-add="handleSlotAdd">
            <div v-if="availableItems.length > 0">
              <div class="support-select-wrapper">
                <label class="support-select-label">{{
                  computedProps.selectLabel
                }}</label>
                <select v-model="selectedItemId" class="support-select">
                  <option value="">{{ computedProps.selectPlaceholder }}</option>
                  <option v-for="item in availableItems" :key="item.id" :value="item.id">
                    {{ getItemName(item) }}
                  </option>
                </select>
                <button class="support-add-btn" @click="handleAdd" :disabled="addButtonLoading || !selectedItemId">
                  <span v-if="addButtonLoading" class="loader"></span>
                  <i v-else class="pi pi-plus"></i>
                  <span v-if="addButtonLoading">{{
                    computedProps.addButtonLoadingText
                  }}</span>
                  <span v-else>{{ computedProps.addButtonText }}</span>
                </button>
              </div>
            </div>
            <div v-else class="supports-all-attached">
              <div class="supports-all-text">{{ computedProps.allAddedText }}</div>
              <div class="supports-all-subtext">{{ computedProps.allAddedSubtext }}</div>
            </div>
          </slot>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";


interface Props {
  items: any[];
  availableItems: any[];

  listLoading?: boolean;
  addButtonLoading?: boolean;

  config?: {
    listTitle?: string;
    addTitle?: string;
    listLoadingText?: string;
    addLoadingText?: string;
    addButtonLoadingText?: string;
    emptyText?: string;
    emptySubtext?: string;
    allAddedText?: string;
    allAddedSubtext?: string;
    selectLabel?: string;
    selectPlaceholder?: string;
    addButtonText?: string;
    removeButtonTitle?: string;
  };

  listTitle?: string;
  addTitle?: string;

  listLoadingText?: string;
  addLoadingText?: string;
  addButtonLoadingText?: string;

  emptyText?: string;
  emptySubtext?: string;
  allAddedText?: string;
  allAddedSubtext?: string;

  selectLabel?: string;
  selectPlaceholder?: string;
  addButtonText?: string;
  removeButtonTitle?: string;

  getItemName?: (item: any) => string;
  getItemSubtitle?: (item: any) => string;

  showEditButton?: boolean;
  showRemoveButton?: boolean;

  showProductFields?: boolean;
  enableReorder?: boolean;
  productFields?: Array<{
    id?: number;
    name?: string;
    value?: string;
    product_id?: number;
  }>;
}

interface Emits {
  (e: "add", itemId: string | number | Record<string, any>): void;
  (e: "remove", itemId: string | number): void;
  (e: "edit", item: any): void;
  (e: "update-field", fieldId: number, value: string): void;
  (e: "reorder", ids: Array<string | number>): void;
}

const props = withDefaults(defineProps<Props>(), {
  listLoading: false,
  addButtonLoading: false,
  listTitle: "Текущие элементы",
  addTitle: "Добавить элемент",
  listLoadingText: "Загрузка элементов...",
  addLoadingText: "Загрузка доступных элементов...",
  addButtonLoadingText: "Добавление...",
  emptyText: "Нет элементов",
  emptySubtext: "Добавьте элементы в правой панели",
  allAddedText: "Все элементы уже добавлены",
  allAddedSubtext: "Нет доступных элементов для добавления",
  selectLabel: "Выберите элемент",
  selectPlaceholder: "Выберите из списка",
  addButtonText: "Добавить",
  removeButtonTitle: "Удалить",
  showEditButton: false,
  showRemoveButton: true,
  showProductFields: false,
  enableReorder: false,
  productFields: () => [] as Array<{ id?: number; name?: string; value?: string }>,
});

const computedProps = computed(() => {
  if (props.config) {
    return {
      listTitle: props.config.listTitle || props.listTitle,
      addTitle: props.config.addTitle || props.addTitle,
      listLoadingText: props.config.listLoadingText || props.listLoadingText,
      addLoadingText: props.config.addLoadingText || props.addLoadingText,
      addButtonLoadingText:
        props.config.addButtonLoadingText || props.addButtonLoadingText,
      emptyText: props.config.emptyText || props.emptyText,
      emptySubtext: props.config.emptySubtext || props.emptySubtext,
      allAddedText: props.config.allAddedText || props.allAddedText,
      allAddedSubtext: props.config.allAddedSubtext || props.allAddedSubtext,
      selectLabel: props.config.selectLabel || props.selectLabel,
      selectPlaceholder: props.config.selectPlaceholder || props.selectPlaceholder,
      addButtonText: props.config.addButtonText || props.addButtonText,
      removeButtonTitle: props.config.removeButtonTitle || props.removeButtonTitle,
    };
  }
  return {
    listTitle: props.listTitle,
    addTitle: props.addTitle,
    listLoadingText: props.listLoadingText,
    addLoadingText: props.addLoadingText,
    addButtonLoadingText: props.addButtonLoadingText,
    emptyText: props.emptyText,
    emptySubtext: props.emptySubtext,
    allAddedText: props.allAddedText,
    allAddedSubtext: props.allAddedSubtext,
    selectLabel: props.selectLabel,
    selectPlaceholder: props.selectPlaceholder,
    addButtonText: props.addButtonText,
    removeButtonTitle: props.removeButtonTitle,
  };
});

const getItemName = (item: any): string => {
  if (props.getItemName) {
    return props.getItemName(item);
  }
  if (item.surname && item.name) {
    return [item.surname, item.name, item.patronymic].filter(Boolean).join(' ');
  }
  return item.name || item.fullName || "";
};

const getItemSubtitle = (item: any): string => {
  if (props.getItemSubtitle) {
    return props.getItemSubtitle(item);
  }
  return "";
};

const DEFAULT_METRIC_COLOR = "#808080";

const hexToRgb = (hex: string) => {
  const normalized = hex.replace("#", "").trim();
  if (![3, 6].includes(normalized.length)) return null;
  const full = normalized.length === 3
    ? normalized.split("").map((char) => char + char).join("")
    : normalized;
  const int = Number.parseInt(full, 16);
  if (Number.isNaN(int)) return null;
  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255,
  };
};

const rgbToHex = (r: number, g: number, b: number) =>
  `#${[r, g, b].map((value) => value.toString(16).padStart(2, "0")).join("")}`;

const softenTooLightColor = (color: string) => {
  const rgb = hexToRgb(color);
  if (!rgb) return color;

  const max = Math.max(rgb.r, rgb.g, rgb.b);
  const min = Math.min(rgb.r, rgb.g, rgb.b);
  const isGray = max - min < 8;
  if (isGray) return color;

  const luminance = 0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b;
  if (luminance < 235) return color;

  const factor = 0.82;
  return rgbToHex(
    Math.round(rgb.r * factor),
    Math.round(rgb.g * factor),
    Math.round(rgb.b * factor)
  );
};

const getItemAvatarStyle = (item: any) => {
  const color = typeof item?.color === "string" && item.color.trim() ? item.color : DEFAULT_METRIC_COLOR;
  const safeColor = softenTooLightColor(color);
  return {
    background: safeColor,
    borderColor: safeColor,
  };
};


const emit = defineEmits<Emits>();

const selectedItemId = ref<string | number>("");
const localItems = ref<any[]>([...props.items]);
const dragStartIndex = ref<number | null>(null);

watch(
  () => props.items,
  (newItems) => {
    localItems.value = [...newItems];
  },
  { deep: true, immediate: true }
);

const handleAdd = () => {
  if (selectedItemId.value) {
    emit("add", selectedItemId.value);
    selectedItemId.value = "";
  }
};

const handleSlotAdd = () => {
  emit("add", {});
};

const handleRemove = (item: any) => {
  if (item && item.id) {
    emit("remove", item.id);
  } else {
    console.error("Item ID is missing for removal:", item);
  }
};

const handleEdit = (item: any) => {
  if (item && !item.disabled) {
    emit("edit", item);
  }
};

const fieldValues = ref<Record<number, string>>({});
const fieldNameFilter = null;

const initializeFieldValues = () => {
  const values: Record<number, string> = {};
  (props.productFields || []).forEach((f) => {
    if (typeof f.id === "number") {
      values[f.id] = f.value || "";
    }
  });
  fieldValues.value = values;
};

initializeFieldValues();

watch(
  () => props.productFields,
  () => {
    initializeFieldValues();
  },
  { deep: true }
);

const updateField = (fieldId?: number) => {
  if (typeof fieldId !== "number") return;
  const value = fieldValues.value[fieldId] ?? "";
  emit("update-field", fieldId, value);
};

const onDragStart = (index: number) => {
  if (!props.enableReorder) return;
  dragStartIndex.value = index;
};

const onDrop = (dropIndex: number) => {
  if (!props.enableReorder || dragStartIndex.value === null) return;

  const startIndex = dragStartIndex.value;
  if (startIndex === dropIndex) return;

  const cloned = [...localItems.value];
  const [moved] = cloned.splice(startIndex, 1);
  cloned.splice(dropIndex, 0, moved);
  localItems.value = cloned;

  emit(
    "reorder",
    cloned.map((item) => item.id)
  );

  dragStartIndex.value = null;
};

</script>

<style scoped>
.add-item-block {
  width: 100%;
}

.supports-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  height: 76vh;
}

.supports-list-column,
.supports-add-column {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid var(--russ-border);
  min-width: 0;
  max-width: 100%;
}

.supports-section-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--russ-text-primary);
  margin: 0 0 20px 0;
  padding-bottom: 12px;
  border-bottom: 2px solid var(--russ-border);
}

.product-fields-section {
  margin-top: 24px;
}

.product-fields-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
}

.product-fields-card {
  background: var(--russ-bg-secondary);
  border: 1px solid var(--russ-border-light);
  border-radius: 10px;
  padding: 12px;
}

.product-fields-header h6 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: var(--russ-text-secondary);
}

.product-fields-list {
  display: flex;
  gap: 8px;
}

.product-field-input {
  flex: 1;
  padding: 8px 10px;
  border: 1px solid var(--russ-border-dark);
  border-radius: 6px;
  min-width: 0;
}

.product-field-input.compact {
  padding: 6px 8px;
  height: 34px;
  font-size: 13px;
}

.product-field-input.ultra-compact-input,
.product-field-input.ultra-compact {
  padding: 4px 6px !important;
  font-size: 12px;
  line-height: 1.35;
  max-width: 220px;
  box-sizing: border-box;
}

.product-field-save {
  padding: 8px 12px;
  background: var(--russ-accent);
  color: #fff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.product-field-save.compact {
  padding: 6px 10px;
  height: 34px;
  font-size: 12px;
}

.product-field-save.ultra-compact-save,
.product-field-save.ultra-compact {
  padding: 4px 8px;
  height: 28px;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.product-field-save:hover {
  background: var(--russ-accent-dark);
}

.product-fields-under-item {
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px dashed var(--russ-border);
}

.product-fields-under-item.ultra-compact {
  margin-top: 6px;
  padding-top: 4px;
}

.product-field-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
}

.product-field-row.ultra-compact-row,
.product-field-row.compact-row {
  gap: 6px;
  margin-top: 4px;
}

.product-field-label {
  min-width: 80px;
  font-size: 12px;
  color: var(--russ-text-muted);
}

.product-field-controls {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
}

.product-field-controls.ultra-compact-controls {
  gap: 4px;
  max-width: 260px;
}

.supports-loading,
.supports-add-loading {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px;
  color: var(--russ-text-primary);
  justify-content: center;
  background: #f8fafc;
  border-radius: 12px;
  border: 1px dashed #cbd5e1;
}

.supports-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 65vh;
  max-height: 65vh;
  overflow-y: auto;
}


.support-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f8fafc;
  border-radius: 12px;
  padding: 16px;
  border: 1px solid #e2e8f0;
  transition: all 0.2s ease;
}

.drag-handle-btn {
  border: none;
  background: transparent;
  cursor: grab;
  color: var(--russ-text-tertiary);
  padding: 2px;
  margin-right: 2px;
}

.support-card:hover {
  background: var(--russ-bg-tertiary);
  border-color: var(--russ-border-light);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.support-card-disabled {
  opacity: 0.6;
  background: var(--russ-bg-disabled) !important;
  border-color: var(--russ-border-dark) !important;
}

.support-card-disabled:hover {
  background: var(--russ-bg-disabled) !important;
  border-color: var(--russ-border-dark) !important;
  box-shadow: none !important;
  transform: none !important;
}

.support-card-content {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.locked-indicator {
  color: var(--russ-error);
  font-size: 14px;
  margin-left: 4px;
}

.support-avatar {
  width: 40px;
  height: 40px;
  aspect-ratio: 1 / 1;
  flex-shrink: 0;
  border-radius: 50%;
  background: #808080;
  border: 1px solid transparent;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 700;
  box-shadow: 0 2px 8px rgba(71, 85, 105, 0.15);
}

.category-avatar {
  border-radius: 12px;
}

.support-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.support-fio {
  font-weight: 600;
  color: var(--russ-text-primary);
  font-size: 15px;
  cursor: text;
  -webkit-user-select: text;
  -moz-user-select: text;
  user-select: text;
}

.support-phone {
  color: #919191;
  font-size: 13px;
}


.support-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.support-edit-btn {
  background: #dbeafe;
  border: none;
  border-radius: 8px;
  padding: 8px 12px;
  color: #2563eb;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  height: 40px;
}

.support-edit-btn:hover:not([disabled]) {
  background: var(--russ-info-light);
  color: var(--russ-accent-dark);
  transform: scale(1.05);
}

.support-edit-btn[disabled],
.support-edit-btn-disabled {
  opacity: 0.4;
  cursor: not-allowed;
  background: #e5e7eb !important;
  color: #9ca3af !important;
}

.support-edit-btn[disabled]:hover,
.support-edit-btn-disabled:hover {
  background: #e5e7eb !important;
  color: #9ca3af !important;
  transform: none !important;
}



.support-remove-btn {
  background: #fee2e2;
  border: none;
  border-radius: 8px;
  padding: 8px 12px;
  color: #dc2626;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  height: 40px;
}

.support-remove-btn:hover:not([disabled]) {
  background: #fecaca;
  color: #b91c1c;
  transform: scale(1.05);
}

.support-remove-btn[disabled] {
  opacity: 0.6;
  cursor: not-allowed;
}

.support-remove-btn .loader {
  width: 16px;
  height: 16px;
  border-width: 2px;
  margin: 0;
}

.supports-empty {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  text-align: left;
  padding: 14px 16px;
  border-radius: 10px;
  border: 1px dashed var(--russ-border, #e5e7eb);
  background: var(--russ-bg, #fff);
  color: var(--russ-text-tertiary, #64748b);
}

.supports-empty-text {
  font-size: 14px;
  font-weight: 600;
  color: var(--russ-text-secondary, #475569);
  margin: 0;
  line-height: 1.35;
}

.supports-empty-subtext {
  font-size: 13px;
  color: var(--russ-text-tertiary, #64748b);
  margin: 0;
  line-height: 1.35;
}

.supports-add-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
}

.support-select-wrapper {
  display: flex;
  gap: 12px;
  align-items: flex-end;
  flex-wrap: wrap;
  min-width: 0;
}

.support-select-label {
  width: 100%;
  font-size: 14px;
  font-weight: 600;
  color: var(--russ-text-primary);
  margin-bottom: 6px;
}

.support-select {
  flex: 1;
  min-width: 260px;
  height: var(--filter-control-height, var(--filter-control-height-md, 40px));
  min-height: var(--filter-control-height, var(--filter-control-height-md, 40px));
  padding: 0 var(--filter-control-padding-x, 12px);
  border: 1.5px solid var(--russ-border);
  border-radius: var(--filter-control-radius, 10px);
  font-size: var(--filter-control-font-size, var(--filter-control-font-size-md, 14px));
  font-family: var(--filter-control-font-family, var(--russ-font-family));
  font-weight: var(--filter-control-font-weight, 500);
  line-height: var(--filter-control-line-height, 1.2);
  background: var(--russ-bg-quaternary);
  transition: all 0.2s ease;
  color: var(--russ-text-primary);
  box-sizing: border-box;
}

.support-select:focus {
  outline: none;
  border-color: var(--russ-secondary-dark);
  background: var(--russ-bg);
}

.support-add-btn {
  background: var(--russ-accent);
  color: var(--russ-text-inverse);
  border: none;
  border-radius: 10px;
  padding: 0 20px;
  height: var(--filter-control-height, var(--filter-control-height-md, 40px));
  min-height: var(--filter-control-height, var(--filter-control-height-md, 40px));
  font-size: var(--filter-control-font-size, var(--filter-control-font-size-md, 14px));
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  box-sizing: border-box;
}

.support-add-btn:hover:not([disabled]) {
  background: var(--russ-accent-dark);
}

.support-add-btn[disabled] {
  background: var(--russ-text-quaternary);
  color: var(--russ-text-tertiary);
  cursor: not-allowed;
  opacity: 0.85;
}

.support-add-btn .loader {
  width: 16px;
  height: 16px;
  border-width: 2px;
  margin: 0;
}

.supports-all-attached {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  text-align: left;
  padding: 14px 16px;
  border-radius: 10px;
  border: 1px dashed var(--russ-border, #e5e7eb);
  background: var(--russ-bg, #fff);
  color: var(--russ-text-tertiary, #64748b);
}

.supports-all-text {
  font-size: 14px;
  font-weight: 600;
  color: var(--russ-text-secondary, #475569);
  margin: 0;
  line-height: 1.35;
}

.supports-all-subtext {
  font-size: 13px;
  color: var(--russ-text-tertiary, #64748b);
  margin: 0;
  line-height: 1.35;
}

.product-avatar {
  background: var(--russ-primary) !important;
}

.product-avatar i {
  font-size: 18px;
}

.agent-avatar {
  background: var(--russ-neutral-dark) !important;
}

.agent-avatar span {
  font-size: 16px;
  font-weight: 700;
}

.project-point-modal .supports-container {
  margin-top: 0;
}

.project-point-modal .supports-list-column,
.project-point-modal .supports-add-column {
  background: var(--russ-bg-secondary);
  border: 1px solid var(--russ-border-light);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.project-point-modal .supports-section-title {
  color: #475569;
  border-bottom-color: #cbd5e1;
}

.project-point-modal .support-card {
  background: #fff;
  border: 1px solid #e2e8f0;
}

.project-point-modal .support-card:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.project-point-modal .support-remove-btn {
  background: #fef2f2;
  color: #dc2626;
}

.project-point-modal .support-remove-btn:hover:not([disabled]) {
  background: #fee2e2;
  color: #b91c1c;
}

.project-point-modal .support-add-btn:hover:not([disabled]) {
  background: #6b9eff;
}

.project-point-modal .supports-loading,
.project-point-modal .supports-add-loading {
  background: #f1f5f9;
  border: 1px dashed #cbd5e1;
  color: #475569;
}

.project-point-modal .supports-empty {
  color: var(--russ-text-tertiary, #64748b);
}

.project-point-modal .supports-empty-text {
  color: var(--russ-text-secondary, #475569);
}

.project-point-modal .supports-empty-subtext {
  color: var(--russ-text-tertiary, #64748b);
}

.project-point-modal .supports-all-attached {
  color: var(--russ-text-tertiary, #64748b);
}

.project-point-modal .supports-all-text {
  color: var(--russ-text-secondary, #475569);
}

.project-point-modal .supports-all-subtext {
  color: var(--russ-text-tertiary, #64748b);
}

.agent-modal-modern .supports-container {
  margin-top: 0;
}

.agent-modal-modern .supports-list-column,
.agent-modal-modern .supports-add-column {
  background: #f6f6f6;
  border: 1px solid #f2f2f2;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.agent-modal-modern .supports-section-title {
  color: var(--russ-text-primary);
  border-bottom-color: #f2f2f2;
}

.agent-modal-modern .support-card {
  background: #f2f2f2;
  border: 1px solid #f2f2f2;
}

.agent-modal-modern .support-card:hover {
  background: #f6f6f6;
  border-color: #f2f2f2;
}

.agent-modal-modern .support-remove-btn {
  background: #fef2f2;
  color: #dc2626;
}

.agent-modal-modern .support-remove-btn:hover:not([disabled]) {
  background: #fee2e2;
  color: #b91c1c;
}

.agent-modal-modern .supports-loading,
.agent-modal-modern .supports-add-loading {
  background: #f2f2f2;
  border: 1px dashed #f2f2f2;
  color: var(--russ-text-primary);
}

.agent-modal-modern .supports-empty {
  color: var(--russ-text-tertiary, #64748b);
}

.agent-modal-modern .supports-empty-text {
  color: var(--russ-text-secondary, #475569);
}

.agent-modal-modern .supports-empty-subtext {
  color: var(--russ-text-tertiary, #64748b);
}

.agent-modal-modern .supports-all-attached {
  color: var(--russ-text-tertiary, #64748b);
}

.agent-modal-modern .supports-all-text {
  color: var(--russ-text-secondary, #475569);
}

.agent-modal-modern .supports-all-subtext {
  color: var(--russ-text-tertiary, #64748b);
}

.agent-modal-modern .support-select-label {
  color: var(--russ-text-primary);
}

.agent-modal-modern .support-fio {
  color: var(--russ-text-primary);
}

.agent-modal-modern .support-phone {
  color: #949494;
}


@media (max-width: 700px) {
  .supports-container {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .supports-list {
    height: 45vh;
    max-height: 45vh;
  }

  .supports-list-column,
  .supports-add-column {
    padding: 16px;
  }

  .supports-section-title {
    font-size: 16px;
    margin-bottom: 16px;
  }

  .support-card {
    padding: 12px;
    align-items: stretch;
  }

  .support-avatar {
    width: 36px;
    height: 36px;
    font-size: 14px;
  }

  .support-fio {
    font-size: 14px;
  }

  .support-phone {
    font-size: 12px;
  }

  .support-actions {
    gap: 6px;
  }

  .product-field-row.ultra-compact-row {
    align-items: stretch;
  }

  .product-field-controls,
  .product-field-controls.ultra-compact-controls {
    flex-wrap: wrap;
    gap: 6px;
  }

  .product-field-input,
  .product-field-input.ultra-compact-input {
    width: 100%;
  }


  .product-field-save,
  .product-field-save.ultra-compact-save {
    flex: 0 0 auto;
  }

  .support-edit-btn,
  .support-remove-btn {
    min-width: 36px;
    height: 36px;
    padding: 6px 10px;
  }

  .support-add-btn {
    padding: 12px 16px;
    font-size: 14px;
  }

  .supports-empty,
  .supports-all-attached {
    padding: 30px 16px;
  }

  .supports-empty-text,
  .supports-all-text {
    font-size: 14px;
  }

  .supports-empty-subtext,
  .supports-all-subtext {
    font-size: 12px;
  }
}
</style>
