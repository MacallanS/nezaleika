<template>
  <section class="staff-settings" aria-label="Параметры">
    <article class="staff-settings-card">
      <h2 class="staff-settings-card__title">Выход на смену</h2>
      <p v-if="loading" class="staff-settings-card__hint">Загрузка…</p>

      <ul v-else class="staff-settings-list" role="list">
        <li class="staff-settings-row">
          <div class="staff-settings-row__copy">
            <p class="staff-settings-row__label">Требовать геолокацию</p>
            <p class="staff-settings-row__desc">
              Сотрудник должен предоставить геолокацию при выходе на смену
            </p>
          </div>
          <button
            type="button"
            class="staff-settings-toggle"
            :class="{ 'staff-settings-toggle--on': checkinEnabled }"
            :disabled="saving || loading"
            :aria-pressed="checkinEnabled"
            aria-label="Требовать геолокацию"
            @click="onToggleGeo"
          >
            <span class="staff-settings-toggle__knob" aria-hidden="true" />
          </button>
        </li>

        <li class="staff-settings-row">
          <div class="staff-settings-row__copy">
            <p class="staff-settings-row__label">Требовать фото или видео</p>
            <p class="staff-settings-row__desc">
              Сотрудник должен загрузить медиа при выходе на смену (если это требует проект)
            </p>
          </div>
          <button
            type="button"
            class="staff-settings-toggle"
            :class="{ 'staff-settings-toggle--on': checkinPhotoEnabled }"
            :disabled="saving || loading"
            :aria-pressed="checkinPhotoEnabled"
            aria-label="Требовать фото или видео"
            @click="onTogglePhoto"
          >
            <span class="staff-settings-toggle__knob" aria-hidden="true" />
          </button>
        </li>
      </ul>

      <p v-if="saving" class="staff-settings-card__saving">Сохранение…</p>
    </article>

    <article v-if="showRecruiterPiiSetting()" class="staff-settings-card">
      <h2 class="staff-settings-card__title">Оформление</h2>
      <ul v-if="!loading" class="staff-settings-list" role="list">
        <li class="staff-settings-row">
          <div class="staff-settings-row__copy">
            <p class="staff-settings-row__label">Видит персональные данные</p>
            <p class="staff-settings-row__desc">
              Паспорт, ИНН, банковские реквизиты и другие ПДн на странице оформления
            </p>
          </div>
          <button
            type="button"
            class="staff-settings-toggle"
            :class="{ 'staff-settings-toggle--on': hrRegistrationPiiVisible }"
            :disabled="saving || loading"
            :aria-pressed="hrRegistrationPiiVisible"
            aria-label="Видит персональные данные на оформлении"
            @click="onTogglePii"
          >
            <span class="staff-settings-toggle__knob" aria-hidden="true" />
          </button>
        </li>
      </ul>
    </article>
  </section>
</template>

<script setup lang="ts">
import { computed, toRef } from 'vue'
import { useToast } from 'bibli/shared/ui'
import { useStaffProfileSettings } from '../../composables/useStaffProfileSettings'

const props = defineProps<{
  userId: number
  targetRoleId?: number | null
}>()

const toast = useToast()
const userIdRef = toRef(props, 'userId')
const targetRoleIdRef = computed(() => props.targetRoleId ?? null)

const {
  checkinEnabled,
  checkinPhotoEnabled,
  hrRegistrationPiiVisible,
  showRecruiterPiiSetting,
  loading,
  saving,
  toggleCheckinEnabled,
  toggleCheckinPhotoEnabled,
  toggleHrRegistrationPiiVisible,
} = useStaffProfileSettings(userIdRef, targetRoleIdRef)

async function onToggleGeo() {
  const ok = await toggleCheckinEnabled()
  if (ok) {
    toast.add({
      severity: 'success',
      summary: 'Сохранено',
      detail: checkinEnabled.value
        ? 'Геолокация при выходе на смену включена'
        : 'Геолокация при выходе на смену отключена',
      life: 3000,
    })
  } else {
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: 'Не удалось обновить настройку',
      life: 4000,
    })
  }
}

async function onTogglePhoto() {
  const ok = await toggleCheckinPhotoEnabled()
  if (ok) {
    toast.add({
      severity: 'success',
      summary: 'Сохранено',
      detail: checkinPhotoEnabled.value
        ? 'Медиа при выходе на смену включено'
        : 'Медиа при выходе на смену отключено',
      life: 3000,
    })
  } else {
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: 'Не удалось обновить настройку',
      life: 4000,
    })
  }
}

async function onTogglePii() {
  const ok = await toggleHrRegistrationPiiVisible()
  if (ok) {
    toast.add({
      severity: 'success',
      summary: 'Сохранено',
      detail: hrRegistrationPiiVisible.value
        ? 'Рекрутер видит персональные данные на оформлении'
        : 'Персональные данные на оформлении скрыты',
      life: 3000,
    })
  } else {
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: 'Не удалось обновить настройку',
      life: 4000,
    })
  }
}
</script>

<style scoped>
.staff-settings {
  width: 100%;
  min-width: 0;
}

.staff-settings-card {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  border-radius: var(--rr-radius-2-xl, 20px);
  background: var(--rr-backgrounds-primary, #fff);
}

.staff-settings-card__title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  line-height: 24px;
  color: #101012;
}

.staff-settings-card__hint,
.staff-settings-card__saving {
  margin: 0;
  font-size: 14px;
  color: rgba(60, 60, 67, 0.72);
}

.staff-settings-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.staff-settings-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
  border-radius: 14px;
  background: var(--rr-backgrounds-secondary, #f5f5f7);
}

.staff-settings-row__copy {
  min-width: 0;
  flex: 1;
}

.staff-settings-row__label {
  margin: 0 0 4px;
  font-size: 15px;
  font-weight: 600;
  color: #101012;
}

.staff-settings-row__desc {
  margin: 0;
  font-size: 13px;
  line-height: 18px;
  color: rgba(60, 60, 67, 0.72);
}

.staff-settings-toggle {
  position: relative;
  flex-shrink: 0;
  width: 44px;
  height: 26px;
  border: none;
  border-radius: 999px;
  background: #c8cad2;
  cursor: pointer;
  padding: 0;
  transition: background-color 0.15s ease;
}

.staff-settings-toggle:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.staff-settings-toggle--on {
  background: #3d5afe;
}

.staff-settings-toggle__knob {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #fff;
  transition: transform 0.15s ease;
}

.staff-settings-toggle--on .staff-settings-toggle__knob {
  transform: translateX(18px);
}
</style>
