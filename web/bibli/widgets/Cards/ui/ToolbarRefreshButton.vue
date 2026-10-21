<script setup lang="ts">
// Минимальная тулбар-кнопка обновления. Стили — глобальный класс .toolbar-refresh-btn
// в cards-shared.css (добавлен в b362e30); сам компонент в том коммите не был закоммичен.
withDefaults(
  defineProps<{
    loading?: boolean
    disabled?: boolean
  }>(),
  { loading: false, disabled: false },
)

defineEmits<{ (e: 'click'): void }>()
</script>

<template>
  <button
    type="button"
    class="toolbar-refresh-btn"
    :disabled="disabled || loading"
    title="Обновить"
    aria-label="Обновить"
    @click="$emit('click')"
  >
    <i :class="loading ? 'pi pi-spin pi-spinner' : 'pi pi-refresh'" />
  </button>
</template>
