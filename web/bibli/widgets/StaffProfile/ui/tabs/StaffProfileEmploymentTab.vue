<template>
  <section class="staff-employment" aria-label="Трудоустройство">
    <article class="staff-employment-card">
      <UserEmploymentPanel
        variant="agent"
        :is-editing="isEditing"
        :account-type="form.account_type"
        :type-options="typeOptions"
        :display-sections="displaySections"
        :saving="isSaving"
        :can-edit="canEdit"
        section-title="Трудоустройство"
        :fancybox-group="fancyboxGroup"
        :get-text-field="(k) => getTextField(k as EmploymentIeField)"
        :set-text-field="(k, v) => setTextField(k as EmploymentIeField, v)"
        :get-employment-file-name="(k) => getEmploymentFileName(k as EmploymentFileKey)"
        :has-selected-file="(k) => hasSelectedFile(k as EmploymentFileKey)"
        :get-selected-file-name="(k) => getSelectedFileName(k as EmploymentFileKey)"
        @update:account-type="(v) => { form.account_type = v }"
        @toggle-edit="toggleEdit"
        @save="onSave"
        @cancel="toggleEdit"
        @file-change="(key, e) => onFileChange(e, key as EmploymentFileKey)"
        @preview-file="onPreviewFile"
      />
    </article>
  </section>
</template>

<script setup lang="ts">
import { computed, toRef } from 'vue'
import { Fancybox } from '@fancyapps/ui'
import '@fancyapps/ui/dist/fancybox/fancybox.css'
import { useToast } from 'bibli/shared/ui'
import UserEmploymentPanel from '@/shared/ui/user-details/UserEmploymentPanel.vue'
import type { StaffProfileModel } from '../../composables/useStaffProfile'
import {
  useStaffProfileEmployment,
} from '../../composables/useStaffProfileEmployment'
import type {
  EmploymentFileKey,
  EmploymentIeField,
} from '@/shared/ui/user-details/userEmploymentTypes'

const props = defineProps<{
  profile: StaffProfileModel
  userId: number
  canEdit?: boolean
}>()

const emit = defineEmits<{
  reload: []
}>()

const toast = useToast()
const staffDetails = computed(() => props.profile.rawStaffDetails)
const userIdRef = toRef(props, 'userId')

const {
  form,
  isEditing,
  isSaving,
  typeOptions,
  displaySections,
  fancyboxGroup,
  toggleEdit,
  onFileChange,
  getTextField,
  setTextField,
  hasSelectedFile,
  getSelectedFileName,
  getEmploymentFileName,
  save,
} = useStaffProfileEmployment(staffDetails, userIdRef)

async function onSave() {
  const result = await save()
  if (result.ok) {
    toast.add({
      severity: 'success',
      summary: 'Успех',
      detail: 'Тип оформления обновлён',
      life: 3000,
    })
    emit('reload')
    return
  }
  if (result.error === 'no_type') {
    toast.add({
      severity: 'warn',
      summary: 'Укажите тип',
      detail: 'Пожалуйста, выберите тип оформления',
      life: 3000,
    })
    return
  }
  if (result.error === 'validation') {
    toast.add({
      severity: 'warn',
      summary: 'Проверьте данные',
      detail: (result.details || []).join(', '),
      life: 4000,
    })
    return
  }
  toast.add({
    severity: 'error',
    summary: 'Ошибка',
    detail: 'Не удалось сохранить тип оформления',
    life: 4000,
  })
}

function onPreviewFile(payload: {
  event: Event
  group: string
  url: string
  label: string
}) {
  payload.event.preventDefault()
  payload.event.stopPropagation()
  const groupElements = document.querySelectorAll(`[data-fancybox="${payload.group}"]`)
  const files = Array.from(groupElements)
    .map((el) => ({
      src: el.getAttribute('href') || '',
      type: 'image' as const,
      caption: el.getAttribute('data-caption') || '',
    }))
    .filter((file) => file.src)
  const currentIndex = files.findIndex((file) => file.src === payload.url)
  Fancybox.show(files, {
    startIndex: currentIndex >= 0 ? currentIndex : 0,
  } as any)
}
</script>

<style scoped>
.staff-employment {
  width: 100%;
  min-width: 0;
}

.staff-employment-card {
  box-sizing: border-box;
  padding: 20px;
  border-radius: var(--rr-radius-2-xl, 20px);
  background: var(--rr-backgrounds-primary, #fff);
}

.staff-employment-card :deep(.details-pane-section-toolbar) {
  margin-bottom: 12px;
}

.staff-employment-card :deep(.details-pane-head h4) {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #101012;
}

.staff-employment-card :deep(.edit-toggle-btn) {
  border: none;
  background: transparent;
  color: #3d5afe;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
</style>
