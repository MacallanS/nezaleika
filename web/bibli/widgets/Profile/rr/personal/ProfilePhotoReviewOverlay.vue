<template>
  <Teleport to="body">
    <div
      class="profile-photo-review"
      :class="{ 'profile-photo-review--pdf': isPdf }"
      role="dialog"
      aria-modal="true"
      :aria-label="ariaLabel"
      @dblclick.prevent
    >
      <div
        class="profile-photo-review__stage"
        :aria-hidden="isPdf || isEmpty ? undefined : 'true'"
      >
        <iframe
          v-if="isPdf && src && !isEmpty"
          class="profile-photo-review__pdf-frame"
          :src="pdfFrameSrc"
          title="Просмотр PDF"
        />
        <img
          v-else-if="src && !isEmpty"
          class="profile-photo-review__img"
          :src="src"
          :alt="alt"
        />
        <div v-else class="profile-photo-review__empty" aria-hidden="true">
          <span class="profile-photo-review__empty-icon">📷</span>
          <span class="profile-photo-review__empty-label">Нет фото</span>
        </div>
        <div v-if="!isPdf" class="profile-photo-review__dim" />
      </div>

      <button
        type="button"
        class="profile-photo-review__close"
        aria-label="Закрыть"
        @click="emit('close')"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path
            d="M3 3l8 8M11 3L3 11"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
          />
        </svg>
      </button>

      <div class="profile-photo-review__footer">
        <p v-if="resolvedHint" class="profile-photo-review__hint">{{ resolvedHint }}</p>
        <div class="profile-photo-review__bar">
          <div class="profile-photo-review__actions">
            <AuthRRButton
              v-if="showSecondary"
              variant="brand-secondary"
              :label="secondaryLabel"
              :disabled="primaryLoading"
              @click="emit('secondary')"
            />
            <AuthRRButton
              v-if="showFileAction"
              variant="brand-secondary"
              :label="fileActionLabel"
              :disabled="primaryLoading"
              @click="emit('file')"
            />
            <AuthRRButton
              :label="primaryLabel"
              :loading="primaryLoading"
              :class="{
                'profile-photo-review__primary--alone': !showSecondary && !showFileAction,
                'profile-photo-review__primary--span': showSecondary && showFileAction,
              }"
              @click="emit('primary')"
            />
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'
import { AuthRRButton } from 'bibli/shared/ui/rr'
import { useAppOverlayWhileMounted } from 'bibli/shared/composables/useAppOverlayBinding'
import { NAV_DRAWER_Z_INDEX } from 'bibli/shared/utils/layerZIndex'
import { EMPTY_PHOTO_PREVIEW_TOKEN } from '../lib/profilePhotos'
import 'bibli/shared/ui/rr/auth-rr-button.css'

useAppOverlayWhileMounted()
const reviewOverlayZIndex = NAV_DRAWER_Z_INDEX

const props = defineProps({
  src: { type: String, default: '' },
  alt: { type: String, default: 'Просмотр фото' },
  ariaLabel: { type: String, default: 'Просмотр фото' },
  hint: { type: String, default: '' },
  isPdf: { type: Boolean, default: false },
  /** @deprecated оставлен для совместимости — PDF открывается inline */
  pdfLabel: { type: String, default: 'Открыть PDF' },
  showSecondary: { type: Boolean, default: true },
  secondaryLabel: { type: String, default: 'Заменить' },
  /** Вторая замена: загрузка файла, когда в шаге есть и камера, и галерея */
  showFileAction: { type: Boolean, default: false },
  fileActionLabel: { type: String, default: 'Загрузить' },
  primaryLabel: { type: String, default: 'Готово' },
  primaryLoading: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'primary', 'secondary', 'file'])

/** Пустой слот после удаления саппортом — плашка с действиями без превью. */
const isEmpty = computed(() => !String(props.src || '').trim() || props.src === EMPTY_PHOTO_PREVIEW_TOKEN)

const resolvedHint = computed(() => {
  if (props.hint) return props.hint
  if (isEmpty.value) return 'Сделайте новое фото или загрузите файл'
  return props.isPdf ? 'Проверьте документ' : 'Проверьте изображение'
})

/** Chrome/Edge: скрыть лишний chrome; blob/http URL без hash оставляем как есть. */
const pdfFrameSrc = computed(() => {
  const url = String(props.src || '')
  if (!url) return ''
  if (url.includes('#')) return url
  return `${url}#view=FitH`
})
</script>

<style scoped>
.profile-photo-review {
  position: fixed;
  inset: 0;
  z-index: v-bind(reviewOverlayZIndex);
  display: flex;
  flex-direction: column;
  background: #2c2c2e;
  color: #fff;
  font-family: var(--rr-font-family-font-family, Manrope, system-ui, sans-serif);
  touch-action: manipulation;
  -webkit-user-select: none;
  user-select: none;
}

.profile-photo-review__stage {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background: #1c1c1e;
  touch-action: manipulation;
}

.profile-photo-review--pdf .profile-photo-review__stage {
  /* сверху оставляем полосу под крестик — иначе он перекрывает ⋮ в viewer PDF */
  inset:
    calc(56px + env(safe-area-inset-top, 0px))
    0
    120px;
  background: #525659;
}

.profile-photo-review--pdf .profile-photo-review__close {
  top: calc(10px + env(safe-area-inset-top, 0px));
  right: 12px;
}

.profile-photo-review__img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
  background: #1c1c1e;
  touch-action: manipulation;
  -webkit-user-drag: none;
  user-select: none;
  pointer-events: none;
}

.profile-photo-review__pdf-frame {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
  background: #525659;
  /* scroll/pinch inside PDF viewer */
  pointer-events: auto;
  -webkit-overflow-scrolling: touch;
}

.profile-photo-review__dim {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: rgba(28, 28, 30, 0.28);
}

.profile-photo-review__empty {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: #2c2c2e;
  color: rgba(255, 255, 255, 0.72);
}

.profile-photo-review__empty-icon {
  font-size: 40px;
  line-height: 1;
}

.profile-photo-review__empty-label {
  font-size: 15px;
  font-weight: 600;
}

.profile-photo-review__close {
  position: absolute;
  top: calc(12px + env(safe-area-inset-top, 0px));
  right: 16px;
  z-index: 5;
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border: none;
  border-radius: 10px;
  background: #78788080;
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  color: #fff;
  cursor: pointer;
}

.profile-photo-review__footer {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 3;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  pointer-events: none;
}

.profile-photo-review__hint {
  margin: 0;
  width: max-content;
  max-width: calc(100% - 32px);
  padding: 10px 16px;
  border-radius: 12px;
  box-sizing: border-box;
  background: #78788080;
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  font-family: var(--rr-font-family-font-family, Manrope, system-ui, sans-serif);
  font-weight: 400;
  font-style: normal;
  font-size: var(--rr-font-size-font-size-m, 16px);
  line-height: var(--rr-line-height-line-height-m, 24px);
  letter-spacing: var(--rr-tracking-tracking-m, 0px);
  text-align: center;
  color: #fff;
}

.profile-photo-review__bar {
  width: 100%;
  padding:
    16px
    16px
    calc(16px + env(safe-area-inset-bottom, 0px));
  border-radius: 16px 16px 0 0;
  background: var(--rr-backgrounds-primary, #fff);
  box-sizing: border-box;
  pointer-events: auto;
}

.profile-photo-review__actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  width: 100%;
}

.profile-photo-review__actions:has(.profile-photo-review__primary--alone) {
  grid-template-columns: 1fr;
}

.profile-photo-review__primary--span {
  grid-column: 1 / -1;
}

.profile-photo-review__actions :deep(.auth-rr-button) {
  width: 100%;
}
</style>
