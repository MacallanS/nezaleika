<template>
  <div class="staff-doc-panel-empty">
    <div class="staff-doc-panel-empty__copy">
      <h2 class="staff-doc-panel-empty__title">Раздел «{{ title }}» пока не заполнен</h2>
      <p class="staff-doc-panel-empty__subtitle">Сотрудник ещё не добавил сюда данные.</p>
      <p class="staff-doc-panel-empty__subtitle">
        После заполнения они появятся здесь автоматически.
      </p>
      <button
        type="button"
        class="staff-doc-panel-empty__add"
        @click="emit('add-manual')"
      >
        Добавить вручную
      </button>
    </div>
    <img
      class="staff-doc-panel-empty__art"
      :src="emptyBearArt"
      alt=""
      width="180"
      height="249"
      decoding="async"
    />
  </div>
</template>

<script setup lang="ts">
import emptyBearArt from '../../assets/empty-section-bear.svg'

defineProps<{
  title: string
}>()

const emit = defineEmits<{
  'add-manual': []
}>()
</script>

<style scoped>
.staff-doc-panel-empty {
  display: flex;
  flex: 1;
  min-height: 100%;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 16px;
  padding: 24px 16px;
  box-sizing: border-box;
}

.staff-doc-panel-empty__copy {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  max-width: 520px;
  order: 0;
  flex: 0 0 auto;
}

.staff-doc-panel-empty__title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  line-height: 1.3;
  color: #101012;
}

.staff-doc-panel-empty__subtitle {
  margin: 0;
  font-size: 14px;
  line-height: 1.45;
  color: rgba(60, 60, 67, 0.72);
}

.staff-doc-panel-empty__add {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-top: 8px;
  min-height: 48px;
  padding: var(--rr-spacing-padding-l, 12px) var(--rr-spacing-padding-xl, 16px);
  border: none;
  border-radius: var(--rr-radius-m, 8px);
  background: var(--rr-button-brand-primary-background-default, #5b7dec);
  color: var(--rr-button-brand-primary-text-default, #fff);
  font-family: var(--rr-font-family-font-family, Manrope, system-ui, sans-serif);
  font-weight: 600;
  font-size: var(--rr-font-size-font-size-m, 16px);
  line-height: var(--rr-line-height-line-height-m, 24px);
  letter-spacing: var(--rr-tracking-tracking-m, 0px);
  cursor: pointer;
}

.staff-doc-panel-empty__add:hover {
  filter: brightness(0.96);
}

.staff-doc-panel-empty__add:active {
  filter: brightness(0.92);
}

.staff-doc-panel-empty__art {
  display: block;
  order: 1;
  flex: 0 0 auto;
  width: min(180px, 55%);
  max-height: 220px;
  height: auto;
  object-fit: contain;
  pointer-events: none;
  user-select: none;
}
</style>
