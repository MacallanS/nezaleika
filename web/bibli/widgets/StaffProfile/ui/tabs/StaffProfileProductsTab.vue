<template>
  <section class="staff-products" aria-label="Продукты">
    <article class="staff-products-card">
      <AddItemBlock
        :items="staffProducts"
        :available-items="availableProducts"
        :list-loading="listLoading"
        :add-loading="availableLoading"
        :add-button-loading="addLoading"
        :get-item-name="(item) => item.name || 'Продукт'"
        :show-product-fields="true"
        :product-fields="productFields"
        :config="addItemConfig"
        @add="handleAdd"
        @remove="handleRemove"
        @update-field="handleUpdateField"
      />
    </article>
  </section>
</template>

<script setup lang="ts">
import { toRef } from 'vue'
import { AddItemBlock } from '@/shared/lib/widgets'
import { useToast } from 'bibli/shared/ui'
import { useStaffProfileProducts } from '../../composables/useStaffProfileProducts'

const props = defineProps<{
  userId: number
}>()

const toast = useToast()
const userIdRef = toRef(props, 'userId')

const {
  staffProducts,
  productFields,
  availableProducts,
  listLoading,
  availableLoading,
  addLoading,
  addProduct,
  removeProduct,
  updateField,
} = useStaffProfileProducts(userIdRef)

const addItemConfig = {
  listTitle: 'Назначенные продукты',
  addTitle: 'Добавить продукт',
  listLoadingText: 'Загрузка продуктов…',
  addLoadingText: 'Загрузка доступных продуктов…',
  addButtonLoadingText: 'Добавление…',
  emptyText: 'Нет назначенных продуктов',
  emptySubtext: 'Назначьте продукты сотруднику',
  allAddedText: 'Все продукты уже назначены',
  allAddedSubtext: 'Нет доступных продуктов для добавления',
  selectLabel: 'Выберите продукт',
  selectPlaceholder: 'Выберите из списка',
  addButtonText: 'Добавить',
  removeButtonTitle: 'Удалить продукт',
}

function handleAdd(itemId: string | number | Record<string, unknown>) {
  let id: string
  if (typeof itemId === 'object' && itemId !== null && 'id' in itemId) {
    id = String(itemId.id)
  } else {
    id = String(itemId)
  }
  void (async () => {
    try {
      const ok = await addProduct(id)
      if (ok) {
        toast.add({
          severity: 'success',
          summary: 'Готово',
          detail: 'Продукт добавлен',
          life: 3000,
        })
      }
    } catch {
      toast.add({
        severity: 'error',
        summary: 'Ошибка',
        detail: 'Не удалось добавить продукт',
        life: 4000,
      })
    }
  })()
}

function handleRemove(itemId: string | number | Record<string, unknown>) {
  let id: number
  if (typeof itemId === 'object' && itemId !== null && 'id' in itemId) {
    id = Number(itemId.id)
  } else {
    id = Number(itemId)
  }
  void (async () => {
    try {
      await removeProduct(id)
      toast.add({
        severity: 'success',
        summary: 'Готово',
        detail: 'Продукт удалён',
        life: 3000,
      })
    } catch {
      toast.add({
        severity: 'error',
        summary: 'Ошибка',
        detail: 'Не удалось удалить продукт',
        life: 4000,
      })
    }
  })()
}

function handleUpdateField(fieldId: number, value: string) {
  void (async () => {
    try {
      await updateField(fieldId, value)
      toast.add({
        severity: 'success',
        summary: 'Сохранено',
        detail: 'Поле обновлено',
        life: 2500,
      })
    } catch {
      toast.add({
        severity: 'error',
        summary: 'Ошибка',
        detail: 'Не удалось обновить поле',
        life: 4000,
      })
    }
  })()
}

</script>

<style scoped>
.staff-products {
  width: 100%;
  min-width: 0;
}

.staff-products-card {
  box-sizing: border-box;
  padding: 20px;
  border-radius: var(--rr-radius-2-xl, 20px);
  background: var(--rr-backgrounds-primary, #fff);
}
</style>
