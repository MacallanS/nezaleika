<template>
  <BaseModal
    :model-value="visible"
    :title="modalTitle"
    :subtitle="modalLead"
    size="md"
    @update:model-value="onVisibleChange"
  >
    <form id="project-form-modal" class="project-form" @submit.prevent="handleSubmit">
      <div class="project-form__name-block">
        <RrInputText
          v-model="form.name"
          label="Название"
          name="project_name"
          placeholder="Название проекта"
          autocomplete="off"
          :disabled="loading"
          clearable
        />
      </div>

      <div class="project-form__cards">
        <section
          class="project-form__section-card"
          aria-labelledby="project-form-main"
        >
          <h3 id="project-form-main" class="project-form__section-title">Основное</h3>

          <RrField label="Руководитель проекта">
            <div class="project-form__field-stack">
              <p class="project-form__field-hint">Кто ведёт проект</p>
              <div class="project-form__select">
                <RrMultiSelect
                  v-model="form.project_manager_id"
                  :options="projectManagers"
                  :multiple="false"
                  :searchable="true"
                  :disabled="staffLoading || loading"
                  option-label="fullName"
                  option-value="id"
                  placeholder="Выберите руководителя"
                  sheet-title="Руководитель проекта"
                  search-placeholder="Поиск"
                />
              </div>
            </div>
          </RrField>

          <RrField label="Региональные руководители">
            <div class="project-form__field-stack">
              <p class="project-form__field-hint">Можно несколько</p>
              <div class="project-form__select project-form__select--multi">
                <RrMultiSelect
                  v-model="form.regional_director_ids"
                  :options="regionalDirectors"
                  :multiple="true"
                  :searchable="true"
                  :disabled="staffLoading || loading"
                  option-label="fullName"
                  option-value="id"
                  placeholder="Не обязательно"
                  sheet-title="Региональные руководители"
                  search-placeholder="Поиск"
                />
              </div>
            </div>
          </RrField>
        </section>

        <section
          class="project-form__section-card"
          aria-labelledby="project-form-shift"
        >
          <h3 id="project-form-shift" class="project-form__section-title">Смена и 1С</h3>

          <RrField label="База 1С">
            <div class="project-form__field-stack">
              <p class="project-form__field-hint">Для выгрузок в 1С</p>
              <div class="project-form__select">
                <RrMultiSelect
                  v-model="form.onec_base_key"
                  :options="onecBaseSelectOptions"
                  :multiple="false"
                  :searchable="onecBaseSelectOptions.length > 7"
                  :disabled="onecBasesLoading || loading"
                  option-label="label"
                  option-value="key"
                  placeholder="Не выбрана"
                  sheet-title="База 1С"
                  search-placeholder="Поиск"
                />
              </div>
            </div>
          </RrField>

          <RrField label="Фиксация выхода на смену">
            <div class="project-form__field-stack">
              <p class="project-form__field-hint">Как агент подтверждает смену</p>
              <div
                class="project-form__segment"
                role="radiogroup"
                aria-label="Фиксация выхода на смену"
              >
              <button
                type="button"
                class="project-form__segment-btn"
                :class="{ 'project-form__segment-btn--active': form.checkin_media_mode === 'photo' }"
                role="radio"
                :aria-checked="form.checkin_media_mode === 'photo'"
                :disabled="loading"
                @click="form.checkin_media_mode = 'photo'"
              >
                <span class="project-form__segment-title">Фото</span>
                <span class="project-form__segment-desc">Без кода</span>
              </button>
              <button
                type="button"
                class="project-form__segment-btn"
                :class="{ 'project-form__segment-btn--active': form.checkin_media_mode === 'video' }"
                role="radio"
                :aria-checked="form.checkin_media_mode === 'video'"
                :disabled="loading"
                @click="form.checkin_media_mode = 'video'"
              >
                <span class="project-form__segment-title">Видео</span>
                <span class="project-form__segment-desc">Агент называет код</span>
              </button>
              </div>
            </div>
          </RrField>
        </section>
      </div>

      <div v-if="backendError" class="project-form__error" role="alert">{{ backendError }}</div>
    </form>

    <template #footer>
      <div class="project-form__footer">
        <RrButton
          type="button"
          variant="neutral-secondary"
          :disabled="loading"
          label="Отмена"
          @click="closeModal"
        />
        <RrButton
          type="submit"
          form="project-form-modal"
          variant="brand-primary"
          :loading="loading"
          :disabled="loading || !canSubmit"
          :label="submitLabel"
        />
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { BaseModal } from '../../shared/ui'
import {
  RrButton,
  RrField,
  RrInputText,
  RrMultiSelect,
} from '../../shared/ui/rr'

interface Project {
  id: number
  name: string
  project_manager_id?: number | string
  regional_director_id?: number | string
  regional_director_ids?: (number | string)[]
  regional_directors?: Array<{
    id: number
    name: string
    surname: string
    patronymic?: string | null
  }>
  onec_base_key?: string | null
  checkin_media_mode?: 'photo' | 'video' | null
}

interface OnecBaseOption {
  key: string
  label: string
}

export type ProjectFormPayload = {
  id?: number
  name: string
  project_manager_id: string
  regional_director_ids: (string | number)[]
  onec_base_key: string | null
  checkin_media_mode: 'photo' | 'video'
}

interface Props {
  visible: boolean
  /** create — новый проект; edit — существующий */
  mode?: 'create' | 'edit'
  project: Project | null
  projectManagers: any[]
  regionalDirectors: any[]
  staffLoading: boolean
  onecBases?: OnecBaseOption[]
  onecBasesLoading?: boolean
  /** Prefill для create (например текущий пользователь как PM) */
  initialCreate?: Partial<{
    name: string
    project_manager_id: string
    regional_director_ids: (string | number)[]
    onec_base_key: string
    checkin_media_mode: 'photo' | 'video'
  }> | null
  onUpdate?: (data: ProjectFormPayload & { id: number }) => Promise<void>
  onCreate?: (data: ProjectFormPayload) => Promise<void>
}

interface Emits {
  (e: 'close'): void
  (e: 'updated'): void
  (e: 'created'): void
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'edit',
  onecBases: () => [],
  onecBasesLoading: false,
  initialCreate: null,
})
const emit = defineEmits<Emits>()

const form = ref<{
  id: number | null
  name: string
  project_manager_id: string
  regional_director_ids: (string | number)[]
  onec_base_key: string
  checkin_media_mode: 'photo' | 'video'
}>({
  id: null,
  name: '',
  project_manager_id: '',
  regional_director_ids: [],
  onec_base_key: '',
  checkin_media_mode: 'photo',
})

const onecBaseSelectOptions = computed(() => [
  { key: '', label: 'Без базы 1С' },
  ...(props.onecBases ?? []),
])

const loading = ref(false)
const backendError = ref('')

const isCreate = computed(() => props.mode === 'create')
const modalTitle = computed(() =>
  isCreate.value ? 'Новый проект' : 'Информация о проекте',
)
const modalLead = computed(() =>
  isCreate.value
    ? 'Руководитель, регионы, база 1С и способ фиксации выхода на смену.'
    : 'Измените основные данные проекта и способ фиксации смены.',
)
const submitLabel = computed(() =>
  isCreate.value ? 'Создать проект' : 'Сохранить изменения',
)
const canSubmit = computed(() => form.value.name.trim().length > 0)

function resetCreateForm() {
  form.value = {
    id: null,
    name: props.initialCreate?.name ?? '',
    project_manager_id: props.initialCreate?.project_manager_id
      ? String(props.initialCreate.project_manager_id)
      : '',
    regional_director_ids: Array.isArray(props.initialCreate?.regional_director_ids)
      ? props.initialCreate!.regional_director_ids.map((id) => String(id))
      : [],
    onec_base_key: props.initialCreate?.onec_base_key
      ? String(props.initialCreate.onec_base_key)
      : '',
    checkin_media_mode:
      props.initialCreate?.checkin_media_mode === 'video' ? 'video' : 'photo',
  }
}

function fillFromProject(newProject: Project | null) {
  if (!newProject) return
  form.value.id = newProject.id
  form.value.name = newProject.name
  form.value.project_manager_id = newProject.project_manager_id
    ? String(newProject.project_manager_id)
    : ''
  form.value.onec_base_key = newProject.onec_base_key
    ? String(newProject.onec_base_key)
    : ''
  form.value.checkin_media_mode =
    newProject.checkin_media_mode === 'video' ? 'video' : 'photo'

  if (newProject.regional_directors && Array.isArray(newProject.regional_directors)) {
    form.value.regional_director_ids = newProject.regional_directors
      .map((dir: any) => String(dir.id))
      .filter(Boolean)
  } else if (newProject.regional_director_ids && Array.isArray(newProject.regional_director_ids)) {
    form.value.regional_director_ids = newProject.regional_director_ids.map((id) =>
      String(id),
    )
  } else if (newProject.regional_director_id) {
    form.value.regional_director_ids = [String(newProject.regional_director_id)]
  } else {
    form.value.regional_director_ids = []
  }
}

watch(
  () => [props.visible, props.mode, props.project, props.initialCreate] as const,
  ([visible]) => {
    if (!visible) return
    backendError.value = ''
    if (isCreate.value) {
      resetCreateForm()
    } else {
      fillFromProject(props.project)
    }
  },
  { immediate: true, deep: true },
)

function onVisibleChange(value: boolean) {
  if (!value) closeModal()
}

const closeModal = () => {
  emit('close')
  backendError.value = ''
}

const normalizeDirectorIds = (value: unknown): (string | number)[] => {
  if (Array.isArray(value)) {
    return value.filter((id) => id !== '' && id !== null && id !== undefined)
  }
  if (value === '' || value === null || value === undefined) {
    return []
  }
  return [value as string | number]
}

function buildPayload(): ProjectFormPayload {
  const directorIds = normalizeDirectorIds(form.value.regional_director_ids)
  return {
    ...(form.value.id != null ? { id: form.value.id } : {}),
    name: form.value.name.trim(),
    project_manager_id: form.value.project_manager_id
      ? String(form.value.project_manager_id)
      : '',
    regional_director_ids: directorIds.length > 0 ? directorIds : [],
    onec_base_key: form.value.onec_base_key ? String(form.value.onec_base_key) : null,
    checkin_media_mode: form.value.checkin_media_mode === 'video' ? 'video' : 'photo',
  }
}

function extractErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object') {
    if ('response' in err && (err as any).response?.data?.message) {
      return (err as any).response.data.message
    }
    if ('response' in err && (err as any).response?.data?.data) {
      return String((err as any).response.data.data)
    }
    if ('message' in err && (err as any).message) {
      return (err as any).message
    }
  }
  return fallback
}

const handleSubmit = async () => {
  if (!canSubmit.value) return

  loading.value = true
  backendError.value = ''

  try {
    const payload = buildPayload()

    if (isCreate.value) {
      if (!props.onCreate) {
        throw new Error('Создание проекта не настроено')
      }
      await props.onCreate(payload)
      emit('created')
    } else {
      if (!form.value.id) return
      if (props.onUpdate) {
        await props.onUpdate({ ...payload, id: form.value.id })
      }
      emit('updated')
    }

    closeModal()
  } catch (err) {
    backendError.value = extractErrorMessage(
      err,
      isCreate.value ? 'Ошибка при создании проекта' : 'Ошибка при сохранении проекта',
    )
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.project-form {
  --project-form-control-h: 48px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.project-form__name-block {
  width: 100%;
}

.project-form__cards {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

@media (min-width: 720px) {
  .project-form__cards {
    grid-template-columns: 1fr 1fr;
    align-items: start;
  }
}

.project-form__section-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px 18px;
  border-radius: 14px;
  border: 1px solid var(--russ-border-light, #e5e7eb);
  background: var(--rr-backgrounds-secondary, var(--russ-bg-secondary, #f8fafc));
}

.project-form__section-title {
  margin: 0 0 4px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: var(--rr-labels-primary, var(--russ-text-primary, #111827));
}

.project-form__field-stack {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  min-width: 0;
}

.project-form__field-hint {
  margin: 0;
  font-size: 12px;
  line-height: 1.35;
  color: var(--rr-labels-tertiary, var(--russ-text-quaternary, #9ca3af));
}

.project-form__select {
  width: 100%;
  min-width: 0;
}

.project-form__select :deep(.rr-multi-select) {
  box-sizing: border-box;
  width: 100%;
  min-height: var(--project-form-control-h);
  padding: 0 12px 0 14px;
  border: 1px solid var(--rr-input-border-default, #dedee3);
  border-radius: var(--rr-radius-l, 12px);
  background-color: var(--rr-backgrounds-quaternary, #f2f3f7);
  transition:
    border-color 0.15s ease,
    background-color 0.15s ease,
    box-shadow 0.15s ease;
}

.project-form__select :deep(.rr-multi-select:hover:not(.rr-multi-select--disabled)) {
  border-color: var(--rr-input-border-hover, #c8c8d0);
  background-color: var(--rr-input-background-hover, #eceef2);
}

.project-form__select :deep(.rr-multi-select--open) {
  border-color: var(--rr-input-border-active, #5b7dec);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--rr-input-border-active, #5b7dec) 22%, transparent);
}

.project-form__select :deep(.rr-multi-select--disabled) {
  opacity: 0.6;
  cursor: not-allowed;
}

.project-form__select :deep(.rr-multi-select__trigger) {
  width: 100%;
  min-height: calc(var(--project-form-control-h) - 2px);
  padding: 0;
  align-items: center;
}

.project-form__select :deep(.rr-multi-select__value) {
  min-height: 24px;
  align-items: center;
}

.project-form__select :deep(.rr-multi-select__placeholder) {
  color: var(--rr-input-text-default, #8b919a);
  font-weight: 400;
}

.project-form__select :deep(.rr-multi-select__primary) {
  color: var(--rr-labels-neutral-primary, #101012);
  font-weight: 600;
}

.project-form__select--multi :deep(.rr-multi-select__value) {
  flex-wrap: wrap;
  gap: 6px;
  padding: 6px 0;
}

.project-form__select--multi :deep(.rr-multi-select__primary),
.project-form__select--multi :deep(.rr-multi-select__more) {
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  min-height: 26px;
  padding: 4px 10px;
  border-radius: 34px;
  background: #fff;
  border: 1px solid var(--rr-select-border, #dedee3);
  font-size: 12px;
  font-weight: 500;
  line-height: 1.2;
  white-space: nowrap;
}

.project-form__select--multi :deep(.rr-multi-select__more) {
  flex-shrink: 0;
  color: var(--rr-labels-brand-primary, #1c4ae5);
  font-weight: 600;
}

.project-form__segment {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.project-form__segment-btn {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  min-height: 56px;
  padding: 10px 12px;
  border: 1px solid var(--rr-input-border-default, #dedee3);
  border-radius: 12px;
  background: var(--rr-backgrounds-quaternary, #fff);
  color: var(--rr-labels-secondary, #4b5563);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    background-color 0.15s ease,
    box-shadow 0.15s ease;
}

.project-form__segment-btn:hover:not(:disabled) {
  border-color: var(--rr-input-border-hover, #c8c8d0);
  background: var(--rr-input-background-hover, #f8f9fb);
}

.project-form__segment-btn--active {
  border-color: var(--rr-input-border-active, #5b7dec);
  background: color-mix(in srgb, var(--rr-input-border-active, #5b7dec) 8%, #fff);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--rr-input-border-active, #5b7dec) 18%, transparent);
  color: var(--rr-labels-primary, #111827);
}

.project-form__segment-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.project-form__segment-title {
  font-size: 14px;
  font-weight: 700;
  line-height: 1.25;
}

.project-form__segment-desc {
  font-size: 12px;
  font-weight: 500;
  line-height: 1.3;
  color: var(--rr-labels-tertiary, #9ca3af);
}

.project-form__segment-btn--active .project-form__segment-desc {
  color: var(--rr-labels-secondary, #6b7280);
}

.project-form__error {
  padding: 12px 14px;
  border-radius: 10px;
  background: var(--russ-error-light, #fee2e2);
  border: 1px solid var(--russ-error-light, #fecaca);
  color: var(--russ-error-dark, #991b1b);
  font-size: 14px;
  line-height: 1.45;
}

.project-form__footer {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
  width: 100%;
}

@media (max-width: 768px) {
  .project-form__footer {
    flex-direction: column-reverse;
  }

  .project-form__footer :deep(.auth-rr-button) {
    width: 100%;
  }
}
</style>
