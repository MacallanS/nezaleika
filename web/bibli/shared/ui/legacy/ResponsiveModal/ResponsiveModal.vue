<template>
  <RrBottomSheet
    v-if="useSheet"
    :model-value="modelValue"
    placement="sheet"
    :height-mode="sheetHeightMode"
    :height-percent="sheetHeightPercent"
    :close-on-backdrop="closeOnOverlayClick"
    :z-index="overlayZIndex"
    footer-layout="row"
    class="responsive-modal-sheet"
    @update:model-value="onUpdate"
  >
    <template v-if="$slots.header" #header>
      <div class="responsive-modal-sheet__header" :class="modalSurfaceClass">
        <slot name="header" />
      </div>
    </template>

    <div class="responsive-modal-sheet__body" :class="modalSurfaceClass">
      <slot />
    </div>

    <template v-if="$slots.footer" #footer>
      <div class="responsive-modal-sheet__footer" :class="modalSurfaceClass">
        <slot name="footer" />
      </div>
    </template>
  </RrBottomSheet>

  <BaseModal
    v-else
    :model-value="modelValue"
    :overlay-z-index="overlayZIndex"
    :title="title"
    :subtitle="subtitle"
    :closable="closable"
    :close-on-escape="closeOnEscape"
    :close-on-overlay-click="closeOnOverlayClick"
    :width="width"
    :max-width="maxWidth"
    :max-height="maxHeight"
    :size="size"
    :height-mode="heightMode"
    :actions-in-menu="actionsInMenu"
    :class="props.class"
    @update:model-value="onUpdate"
  >
    <template v-if="$slots.header" #header>
      <slot name="header" />
    </template>
    <slot />
    <template v-if="$slots.footer" #footer>
      <slot name="footer" />
    </template>
    <template v-if="$slots['header-actions']" #header-actions>
      <slot name="header-actions" />
    </template>
    <template v-if="$slots['header-actions-pinned']" #header-actions-pinned>
      <slot name="header-actions-pinned" />
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import RrBottomSheet from 'bibli/shared/ui/rr/overlays/RrBottomSheet.vue'
import { MODAL_OVERLAY_Z_INDEX } from 'bibli/shared/utils/layerZIndex'
import BaseModal from '../BaseModal/BaseModal.vue'

const MOBILE_SHEET_MQ = '(max-width: 768px)'

interface Props {
  modelValue: boolean
  overlayZIndex?: number
  title?: string
  subtitle?: string
  closable?: boolean
  closeOnEscape?: boolean
  closeOnOverlayClick?: boolean
  width?: string | number
  maxWidth?: string | number
  maxHeight?: string | number
  class?: string
  size?: 'sm' | 'md' | 'lg'
  heightMode?: 'content' | 'max'
  actionsInMenu?: boolean
  /** На ≤768px — нижний шит вместо центрированной модалки. */
  sheetOnMobile?: boolean
  sheetHeightMode?: 'fit' | 'percent'
  sheetHeightPercent?: number
}

const props = withDefaults(defineProps<Props>(), {
  overlayZIndex: MODAL_OVERLAY_Z_INDEX,
  closable: true,
  closeOnEscape: true,
  closeOnOverlayClick: true,
  class: '',
  size: 'md',
  heightMode: 'content',
  actionsInMenu: false,
  sheetOnMobile: true,
  sheetHeightMode: 'fit',
  sheetHeightPercent: 92,
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const isMobileSheet = ref(false)
let mq: MediaQueryList | null = null

const useSheet = computed(() => props.sheetOnMobile && isMobileSheet.value)

const modalSurfaceClass = computed(() => props.class)

function syncMq(event?: MediaQueryListEvent) {
  isMobileSheet.value = event?.matches ?? mq?.matches ?? false
}

function onUpdate(value: boolean) {
  emit('update:modelValue', value)
}

onMounted(() => {
  if (typeof window === 'undefined') return
  mq = window.matchMedia(MOBILE_SHEET_MQ)
  syncMq()
  mq.addEventListener('change', syncMq)
})

onBeforeUnmount(() => {
  mq?.removeEventListener('change', syncMq)
  mq = null
})
</script>

<style scoped>
.responsive-modal-sheet__header :deep(.modal-title),
.responsive-modal-sheet__header :deep(.analytics-export-header) {
  margin: 0;
  width: 100%;
}

.responsive-modal-sheet__body {
  min-height: 0;
}

.responsive-modal-sheet__footer {
  width: 100%;
}
</style>
