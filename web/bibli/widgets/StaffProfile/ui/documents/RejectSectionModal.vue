<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="staff-reject-modal__overlay"
      @mousedown.self="onOverlayMouseDown"
      @mouseup.self="onOverlayMouseUp"
      @click.self="onOverlayClick"
      @keydown.esc="onEscape"
    >
      <div
        ref="dialogRef"
        class="staff-reject-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="staff-reject-modal-title"
        tabindex="-1"
        @click.stop
        @mousedown.stop="overlayMouseDownOnDialog = true"
        @mouseup.stop="overlayMouseDownOnDialog = true"
      >
        <header class="staff-reject-modal__head">
          <h2 id="staff-reject-modal-title" class="staff-reject-modal__title">
            Причина отклонения
          </h2>
          <button
            type="button"
            class="staff-reject-modal__close"
            aria-label="Закрыть"
            @click="close"
          >
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden="true">
              <path
                d="M7 7l10 10M17 7L7 17"
                stroke="currentColor"
                stroke-width="1.3"
                stroke-linecap="round"
              />
            </svg>
          </button>
        </header>

        <div class="staff-reject-modal__body">
          <div class="staff-reject-modal__tags">
            <button
              v-for="r in REASONS"
              :key="r.id"
              type="button"
              class="staff-reject-modal__tag"
              :class="{ 'staff-reject-modal__tag--active': r.id === reasonId }"
              @click="reasonId = r.id"
            >
              {{ r.label }}
            </button>
          </div>

          <textarea
            v-model="comment"
            class="staff-reject-modal__comment"
            placeholder="Комментарий агенту"
            rows="6"
          />
        </div>

        <footer class="staff-reject-modal__footer">
          <button
            type="button"
            class="staff-reject-modal__submit"
            :disabled="!reasonId"
            @click="submit"
          >
            Отклонить раздел
          </button>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'
import { acquireAppOverlay, releaseAppOverlay } from 'bibli/shared/utils/appOverlay'
import { MODAL_OVERLAY_Z_INDEX } from 'bibli/shared/utils/layerZIndex'

type RejectReasonPayload = {
  reason: string
  comment: string | null
}

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: [payload: RejectReasonPayload]
}>()

const overlayZIndex = MODAL_OVERLAY_Z_INDEX

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
})

const dialogRef = ref<HTMLElement | null>(null)
const overlayMouseDownOnOverlay = ref(false)
const overlayMouseDownOnDialog = ref(false)

const REASONS = [
  { id: 'illegible_scan', label: 'Нечитаемый скан' },
  { id: 'data_mismatch', label: 'Данные не совпадают' },
  { id: 'expired_document', label: 'Документ просрочен' },
  { id: 'cropped_document', label: 'Обрезан документ' },
  { id: 'other', label: 'Другое' },
] as const

const reasonId = ref<null | (typeof REASONS)[number]['id']>(null)
const comment = ref('')

function close(): void {
  visible.value = false
  reasonId.value = null
  comment.value = ''
}

function submit(): void {
  if (!reasonId.value) return
  emit('submit', {
    reason: reasonId.value,
    comment: comment.value.trim() ? comment.value.trim() : null,
  })
  close()
}

function onOverlayMouseDown(): void {
  overlayMouseDownOnOverlay.value = true
  overlayMouseDownOnDialog.value = false
}

function onOverlayMouseUp(): void {
  if (overlayMouseDownOnDialog.value) {
    overlayMouseDownOnOverlay.value = false
    overlayMouseDownOnDialog.value = false
  }
}

function onOverlayClick(): void {
  if (overlayMouseDownOnOverlay.value && !overlayMouseDownOnDialog.value) {
    close()
  }
  overlayMouseDownOnOverlay.value = false
  overlayMouseDownOnDialog.value = false
}

function onEscape(event: KeyboardEvent): void {
  if (event.key === 'Escape' && visible.value) {
    close()
  }
}

watch(
  () => props.modelValue,
  (open, wasOpen) => {
    if (typeof document === 'undefined') return
    document.body.style.overflow = open ? 'hidden' : ''
    if (open && !wasOpen) acquireAppOverlay()
    else if (!open && wasOpen) releaseAppOverlay()
    if (open) {
      nextTick(() => dialogRef.value?.focus())
    }
  },
  { immediate: true },
)

onUnmounted(() => {
  if (typeof document !== 'undefined') {
    document.body.style.overflow = ''
    if (props.modelValue) releaseAppOverlay()
  }
})
</script>

<style scoped>
.staff-reject-modal__overlay {
  position: fixed;
  inset: 0;
  z-index: v-bind(overlayZIndex);
  display: flex;
  align-items: center;
  justify-content: center;
  padding:
    calc(20px + env(safe-area-inset-top, 0px))
    calc(20px + env(safe-area-inset-right, 0px))
    calc(20px + env(safe-area-inset-bottom, 0px))
    calc(20px + env(safe-area-inset-left, 0px));
  box-sizing: border-box;
  background: var(--app-overlay-scrim, var(--russ-overlay, rgba(0, 0, 0, 0.56)));
}

.staff-reject-modal {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  width: min(670px, calc(100vw - 40px));
  max-width: min(720px, calc(100vw - 40px));
  border-radius: 20px;
  background: #ffffff;
  outline: none;
}

.staff-reject-modal__head {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 20px 52px 0;
}

.staff-reject-modal__title {
  margin: 0;
  font-family: var(--rr-font-family-font-family, Manrope, system-ui, sans-serif);
  font-weight: 500;
  font-size: var(--rr-font-size-font-size-2xl, 32px);
  line-height: var(--rr-line-height-line-height-2xl, 32px);
  letter-spacing: var(--rr-tracking-tracking-2xl, -1px);
  text-align: center;
  vertical-align: middle;
  color: #101012;
}

.staff-reject-modal__close {
  position: absolute;
  top: 20px;
  right: 20px;
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  margin: 0;
  padding: 0;
  border: none;
  background: transparent;
  color: #93939c;
  cursor: pointer;
}

.staff-reject-modal__close:focus-visible {
  outline: 2px solid #1c4ae5;
  outline-offset: 2px;
  border-radius: 4px;
}

.staff-reject-modal__body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 20px 0;
}

.staff-reject-modal__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

.staff-reject-modal__tag {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  border: none;
  border-radius: 9999px;
  padding: 4px 8px 6px 8px;
  background: #f2f3f7;
  font-family: var(--rr-font-family-font-family, Manrope, system-ui, sans-serif);
  font-weight: 600;
  font-size: var(--rr-font-size-font-size-xs, 12px);
  line-height: 12px;
  letter-spacing: var(--rr-tracking-tracking-s, 0px);
  text-align: center;
  color: #101012;
  cursor: pointer;
  white-space: nowrap;
}

.staff-reject-modal__tag--active {
  background: #e8e9ee;
  box-shadow: inset 0 0 0 1px rgba(16, 16, 18, 0.12);
}

.staff-reject-modal__comment {
  box-sizing: border-box;
  width: 100%;
  height: 176px;
  min-height: 176px;
  margin: 0;
  padding: 16px;
  border: none;
  border-radius: 16px;
  background: #f2f3f7;
  resize: none;
  font-family: var(--rr-font-family-font-family, Manrope, system-ui, sans-serif);
  font-weight: 400;
  font-size: 16px;
  line-height: 24px;
  color: #101012;
}

.staff-reject-modal__comment::placeholder {
  color: rgba(60, 60, 67, 0.55);
}

.staff-reject-modal__comment:focus {
  outline: none;
}

.staff-reject-modal__footer {
  padding: 16px 20px 20px;
}

.staff-reject-modal__submit {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 48px;
  margin: 0;
  padding: 12px 16px;
  border: none;
  border-radius: 8px;
  background: #242426;
  font-family: var(--rr-font-family-font-family, Manrope, system-ui, sans-serif);
  font-weight: 600;
  font-size: 16px;
  line-height: 24px;
  color: #ffffff;
  cursor: pointer;
}

.staff-reject-modal__submit:disabled {
  background: #f2f3f7;
  color: rgba(16, 16, 18, 0.24);
  cursor: not-allowed;
}

.staff-reject-modal__submit:not(:disabled):hover {
  opacity: 0.92;
}

.staff-reject-modal__submit:focus-visible {
  outline: 2px solid #1c4ae5;
  outline-offset: 2px;
}

@media (max-width: 640px) {
  .staff-reject-modal__overlay {
    padding: 12px;
  }

  .staff-reject-modal__head {
    padding-left: 44px;
    padding-right: 44px;
  }

  .staff-reject-modal__close {
    right: 16px;
  }

  .staff-reject-modal__body,
  .staff-reject-modal__footer {
    padding-left: 16px;
    padding-right: 16px;
  }

  .staff-reject-modal__footer {
    padding-bottom: 16px;
  }

  .staff-reject-modal__tag {
    white-space: normal;
  }
}
</style>
