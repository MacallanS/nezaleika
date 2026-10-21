<template>
  <BaseModal
    :model-value="visible"
    title="Выберите роль для пользователя"
    size="sm"
    @update:model-value="onVisibleUpdate"
    @hide="emit('close')"
  >
    <div v-if="modalLoading" class="staff-hire-modal__loading">
      <div class="staff-hire-modal__spinner" aria-hidden="true" />
      <p>Загрузка данных...</p>
    </div>

    <template v-else>
      <div class="staff-hire-modal__section">
        <h4 class="staff-hire-modal__heading">Роль пользователя</h4>
        <div class="staff-hire-modal__row">
          <BaseSelect
            :model-value="roleSelection"
            :options="roleOptions"
            label="Роль"
            placeholder="-- выберите роль --"
            required
            :searchable="false"
            @update:model-value="onRoleUpdate"
          />
        </div>
        <div v-if="showProject" class="staff-hire-modal__row">
          <BaseSelect
            :model-value="projectId"
            :options="projectOptions"
            label="Проект"
            placeholder="-- выберите проект --"
            required
            option-label="name"
            option-value="id"
            :searchable="false"
            hide-when-single
            @update:model-value="onProjectUpdate"
          />
        </div>
        <div v-if="showPoints && projectId" class="staff-hire-modal__row">
          <BaseSelect
            :model-value="pointIds"
            :options="pointOptions"
            label="Точки"
            option-label="name"
            option-value="id"
            placeholder="-- выберите точки --"
            required
            :multiple="true"
            :searchable="true"
            @update:model-value="onPointsUpdate"
          />
        </div>
      </div>
      <div class="staff-hire-modal__actions">
        <button
          type="button"
          class="staff-hire-modal__submit"
          :disabled="!canSubmit"
          @click="emit('confirm')"
        >
          <span v-if="submitting" class="staff-hire-modal__loader" aria-hidden="true" />
          Подтвердить
        </button>
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { BaseModal, BaseSelect } from 'bibli/shared/ui'

defineProps<{
  visible: boolean
  modalLoading: boolean
  submitting: boolean
  canSubmit: boolean
  roleSelection: string
  roleOptions: Array<{ id: string; name: string }>
  projectId: string
  projectOptions: Array<{ id: number | string; name?: string }>
  pointIds: string[]
  pointOptions: Array<{ id: number | string; name: string }>
  showProject: boolean
  showPoints: boolean
}>()

const emit = defineEmits<{
  close: []
  confirm: []
  'update:roleSelection': [value: string]
  'update:projectId': [value: string]
  'update:pointIds': [value: string[]]
  'role-change': []
  'project-change': []
}>()

function onVisibleUpdate(value: boolean) {
  if (!value) emit('close')
}

function onRoleUpdate(value: unknown) {
  emit('update:roleSelection', value == null ? '' : String(value))
  emit('role-change')
}

function onProjectUpdate(value: unknown) {
  emit('update:projectId', value == null ? '' : String(value))
  emit('project-change')
}

function onPointsUpdate(value: unknown) {
  if (Array.isArray(value)) {
    emit(
      'update:pointIds',
      value.map((v) => String(v)).filter(Boolean),
    )
    return
  }
  emit('update:pointIds', value == null || value === '' ? [] : [String(value)])
}
</script>

<style scoped>
.staff-hire-modal__loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 24px 8px;
  color: var(--rr-labels-neutral-secondary, rgba(60, 60, 67, 0.72));
}

.staff-hire-modal__spinner {
  width: 28px;
  height: 28px;
  border: 2px solid rgba(0, 0, 0, 0.12);
  border-top-color: #111827;
  border-radius: 50%;
  animation: staff-hire-spin 0.8s linear infinite;
}

@keyframes staff-hire-spin {
  to {
    transform: rotate(360deg);
  }
}

.staff-hire-modal__section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.staff-hire-modal__heading {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--rr-labels-neutral-primary, #1c1c1e);
}

.staff-hire-modal__row {
  min-width: 0;
}

.staff-hire-modal__actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.staff-hire-modal__submit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 40px;
  padding: 0 18px;
  border: none;
  border-radius: 999px;
  background: #111827;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.staff-hire-modal__submit:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.staff-hire-modal__loader {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: #fff;
  border-radius: 50%;
  animation: staff-hire-spin 0.8s linear infinite;
}
</style>
