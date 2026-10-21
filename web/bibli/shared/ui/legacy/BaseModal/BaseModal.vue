<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="base-modal-overlay"
      :style="{ zIndex: overlayZIndex }"
      @mousedown.self="onOverlayMouseDownSelf"
      @mouseup.self="onOverlayMouseUpSelf"
      @click.self="shouldCloseOnOverlayClick() && handleOverlayClick()"
      @keydown.esc="handleEscape"
    >
      <!-- Full-bleed paint: closes Dynamic Island gap on iOS PWA -->
      <div
        class="base-modal-overlay__paint"
        aria-hidden="true"
      />
      <div
        ref="modalRef"
        class="base-modal"
        :class="modalClass"
        :style="modalStyle"
        @click.stop
        @mousedown="onModalMouseDown"
        @mouseup="onModalMouseUp"
      >
        <div class="base-modal-header">
          <div class="base-modal-header-content">
            <slot name="header">
              <h3 v-if="title" class="base-modal-title">{{ title }}</h3>
              <p v-if="subtitle" class="base-modal-subtitle">{{ subtitle }}</p>
            </slot>
          </div>
          <div class="base-modal-header-actions">
            <div
              v-if="isCompactMobile && hasHeaderActionsPinned"
              class="base-modal-header-actions-pinned"
            >
              <slot name="header-actions-pinned"></slot>
            </div>
            <div v-if="!isCompactMobile" class="base-modal-header-actions-inline">
              <slot name="header-actions-pinned"></slot>
              <slot name="header-actions"></slot>
            </div>
            <button
              v-if="!actionsInMenu && hasFooter && isMobile"
              type="button"
              class="base-modal-mobile-menu-btn"
              :class="{ 'base-modal-mobile-menu-btn--active': actionsMenuOpen }"
              :aria-label="mobileMenuAriaLabel"
              :aria-expanded="actionsMenuOpen"
              @click.stop="toggleActionsMenu"
            >
              <i class="pi pi-ellipsis-v" aria-hidden="true"></i>
            </button>
            <button
              v-if="showActionsMenuBtn"
              type="button"
              class="base-modal-actions-menu-btn"
              :class="{ 'base-modal-actions-menu-btn--active': actionsMenuOpen }"
              :aria-label="mobileMenuAriaLabel"
              :aria-expanded="actionsMenuOpen"
              @click.stop="toggleActionsMenu"
            >
              <i class="pi pi-ellipsis-v" aria-hidden="true"></i>
            </button>
            <button
              v-if="closable"
              class="base-modal-close"
              @click="handleClose"
              :aria-label="closeAriaLabel"
            >
              ×
            </button>
          </div>
          <div
            v-if="isCompactMobile && actionsMenuOpen"
            class="base-modal-actions-menu"
            @click="onActionsMenuClick"
          >
            <slot v-if="hasHeaderActions" name="header-actions"></slot>
            <slot v-if="hasFooter" name="footer"></slot>
          </div>
        </div>

        <!-- Content -->
        <div class="base-modal-content">
          <slot></slot>
        </div>

        <div
          v-if="isCompactMobile && actionsMenuOpen"
          class="base-modal-footer-backdrop"
          @click="actionsMenuOpen = false"
        />

        <!-- Footer -->
        <div
          v-if="hasFooter && !isCompactMobile"
          class="base-modal-footer"
          :class="{ 'base-modal-footer--mobile-open': !actionsInMenu && isMobile && actionsMenuOpen }"
          @click="onFooterClick"
        >
          <slot name="footer"></slot>
        </div>

        <!-- Поверх всего содержимого модалки (лоадеры экспорта и т.п.) -->
        <slot name="overlay"></slot>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted, normalizeClass, useSlots } from 'vue';
import { MODAL_OVERLAY_Z_INDEX } from 'bibli/shared/utils/layerZIndex';
import { acquireAppOverlay, releaseAppOverlay } from 'bibli/shared/utils/appOverlay';
import 'bibli/shared/ui/rr/overlays/app-pwa-fullbleed.css';

const MOBILE_BREAKPOINT = 768;

interface Props {
  modelValue: boolean;
  /** Поверх остальных слоёв (по умолчанию 10000). */
  overlayZIndex?: number;
  title?: string;
  subtitle?: string;
  closable?: boolean;
  closeOnEscape?: boolean;
  closeOnOverlayClick?: boolean;
  modal?: boolean;
  width?: string | number;
  maxWidth?: string | number;
  maxHeight?: string | number;
  position?: 'center' | 'top' | 'bottom';
  closeAriaLabel?: string;
  mobileMenuAriaLabel?: string;
  class?: string;
  size?: 'sm' | 'md' | 'lg';
  heightMode?: 'content' | 'max';
  /** На мобильных прячет #header-actions и #footer в меню «⋮» рядом с крестиком. */
  actionsInMenu?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  overlayZIndex: MODAL_OVERLAY_Z_INDEX,
  closable: true,
  closeOnEscape: true,
  closeOnOverlayClick: true,
  modal: true,
  position: 'center',
  closeAriaLabel: 'Закрыть',
  mobileMenuAriaLabel: 'Действия',
  class: '',
  size: 'md',
  heightMode: 'content',
  actionsInMenu: false,
});

const slots = useSlots();
const hasFooter = computed(() => Boolean(slots.footer));
const hasHeaderActions = computed(() => Boolean(slots['header-actions']));
const hasHeaderActionsPinned = computed(() => Boolean(slots['header-actions-pinned']));
const isMobile = ref(false);
const actionsMenuOpen = ref(false);
const isCompactMobile = computed(() => props.actionsInMenu && isMobile.value);
const showActionsMenuBtn = computed(
  () => isCompactMobile.value && (hasHeaderActions.value || hasFooter.value),
);

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'hide': [];
  'show': [];
}>();

const modalRef = ref<HTMLElement | null>(null);
const mouseDownTarget = ref<'overlay' | 'modal' | null>(null);
const mouseUpTarget = ref<'overlay' | 'modal' | null>(null);

const modalClass = computed(() =>
  normalizeClass([
    props.class,
    props.size ? `base-modal-size-${props.size}` : '',
    props.heightMode === 'max' ? 'base-modal-height-max' : 'base-modal-height-content',
    {
      'base-modal-wide': props.maxWidth === '900px' || props.width === '900px',
      'base-modal-large': props.maxWidth === '1000px' || props.width === '1000px',
      'base-modal--actions-in-menu': props.actionsInMenu,
      'base-modal--has-pinned-actions': props.actionsInMenu && hasHeaderActionsPinned.value,
    },
  ])
);

const modalStyle = computed(() => {
  const style: Record<string, string> = {};
  
  const sizePresets: Record<'sm' | 'md' | 'lg', { width: string; maxWidth: string }> = {
    sm: { width: 'min(520px, calc(100vw - 40px))', maxWidth: 'min(520px, calc(100vw - 40px))' },
    md: { width: 'min(820px, calc(100vw - 40px))', maxWidth: 'min(820px, calc(100vw - 40px))' },
    lg: { width: 'min(1100px, calc(100vw - 40px))', maxWidth: 'min(1100px, calc(100vw - 40px))' },
  };

  const modalMaxHeightCap =
    'var(--base-modal-mobile-max-h, calc(100% - (2 * var(--base-modal-overlay-pad-block))))';

  if (props.width) {
    style.width = typeof props.width === 'number' ? `${props.width}px` : props.width;
  } else if (props.size && sizePresets[props.size]) {
    style.width = sizePresets[props.size].width;
  }
  
  if (props.maxWidth) {
    style.maxWidth = typeof props.maxWidth === 'number' ? `${props.maxWidth}px` : props.maxWidth;
  } else if (props.size && sizePresets[props.size]) {
    style.maxWidth = sizePresets[props.size].maxWidth;
  }
  
  if (props.maxHeight) {
    const raw = typeof props.maxHeight === 'number' ? `${props.maxHeight}px` : props.maxHeight;
    style.maxHeight = `min(${raw}, ${modalMaxHeightCap})`;
  }
  
  return style;
});

const onOverlayMouseDownSelf = () => {
  // Запоминаем, что клик начался на overlay
  mouseDownTarget.value = 'overlay';
};

const onModalMouseDown = () => {
  // Запоминаем, что клик начался в модалке
  mouseDownTarget.value = 'modal';
};

const onModalMouseUp = () => {
  // Запоминаем, что клик закончился в модалке
  mouseUpTarget.value = 'modal';
  // Если клик начался в модалке, сбрасываем флаги
  if (mouseDownTarget.value === 'modal') {
    mouseDownTarget.value = null;
    mouseUpTarget.value = null;
  }
};

const onOverlayMouseUpSelf = () => {
  // Запоминаем, что клик закончился на overlay
  mouseUpTarget.value = 'overlay';
  // Если клик начался в модалке, сбрасываем флаги чтобы предотвратить закрытие
  if (mouseDownTarget.value === 'modal') {
    mouseDownTarget.value = null;
    mouseUpTarget.value = null;
  }
};

const shouldCloseOnOverlayClick = () => {
  // Закрываем только если:
  // 1. Клик начался на overlay И
  // 2. Клик закончился на overlay (не в модалке) И
  // 3. Включено закрытие по клику на overlay
  const should = 
    mouseDownTarget.value === 'overlay' && 
    mouseUpTarget.value !== 'modal' && 
    props.closeOnOverlayClick;
  
  // Сбрасываем флаги после проверки
  mouseDownTarget.value = null;
  mouseUpTarget.value = null;
  
  return should;
};

const handleOverlayClick = () => {
  if (props.closeOnOverlayClick) {
    handleClose();
  }
};

const handleClose = () => {
  actionsMenuOpen.value = false;
  emit('update:modelValue', false);
  emit('hide');
};

const updateIsMobile = () => {
  if (typeof window === 'undefined') return;
  isMobile.value = window.innerWidth <= MOBILE_BREAKPOINT;
};

const toggleActionsMenu = () => {
  actionsMenuOpen.value = !actionsMenuOpen.value;
};

const onFooterClick = (event: MouseEvent) => {
  const target = event.target as HTMLElement | null;
  if (target?.closest('button:not(:disabled)')) {
    actionsMenuOpen.value = false;
  }
};

const onActionsMenuClick = (event: MouseEvent) => {
  onFooterClick(event);
};

const handleEscape = (event: KeyboardEvent) => {
  if (event.key !== 'Escape' || !props.closeOnEscape || !props.modelValue) {
    return;
  }

  if (isMobile.value && actionsMenuOpen.value) {
    actionsMenuOpen.value = false;
    return;
  }

  handleClose();
};

// Блокировка скролла body при открытой модалке
watch(
  () => props.modelValue,
  (isOpen, wasOpen) => {
    if (isOpen) {
      emit('show');
      document.body.style.overflow = 'hidden';
      document.documentElement.classList.add('base-modal-open');
      if (!wasOpen) acquireAppOverlay();
      nextTick(() => {
        modalRef.value?.focus();
      });
    } else {
      actionsMenuOpen.value = false;
      document.body.style.overflow = '';
      document.documentElement.classList.remove('base-modal-open');
      if (wasOpen) releaseAppOverlay();
    }
  },
  { immediate: true }
);

watch(isMobile, (mobile) => {
  if (!mobile) {
    actionsMenuOpen.value = false;
  }
});

// Обработка клавиатуры
onMounted(() => {
  updateIsMobile();
  window.addEventListener('resize', updateIsMobile);

  if (props.closeOnEscape) {
    document.addEventListener('keydown', handleEscape);
  }
});

onUnmounted(() => {
  document.body.style.overflow = '';
  document.documentElement.classList.remove('base-modal-open');
  if (props.modelValue) releaseAppOverlay();
  window.removeEventListener('resize', updateIsMobile);
  document.removeEventListener('keydown', handleEscape);
});
</script>

<style scoped>
.base-modal-overlay {
  --base-modal-overlay-pad-inline: 20px;
  --base-modal-overlay-pad-block: 20px;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  height: 100dvh;
  height: 100lvh;
  min-height: -webkit-fill-available;
  margin: 0;
  /* Scrim рисует __paint — иначе светлый filler + тёмный dimmer = шов под Island */
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.2s ease;
  touch-action: auto;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  padding:
    calc(var(--base-modal-overlay-pad-block) + env(safe-area-inset-top, 0px))
    calc(var(--base-modal-overlay-pad-inline) + env(safe-area-inset-right, 0px))
    calc(var(--base-modal-overlay-pad-block) + env(safe-area-inset-bottom, 0px))
    calc(var(--base-modal-overlay-pad-inline) + env(safe-area-inset-left, 0px));
  box-sizing: border-box;
}

.base-modal-overlay__paint {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100%;
  height: 100dvh;
  height: 100lvh;
  min-height: -webkit-fill-available;
  margin-top: calc(-1 * env(safe-area-inset-top, 0px));
  margin-bottom: calc(-1 * env(safe-area-inset-bottom, 0px));
  padding-top: env(safe-area-inset-top, 0px);
  padding-bottom: env(safe-area-inset-bottom, 0px);
  box-sizing: content-box;
  background: var(--app-overlay-scrim, var(--russ-overlay));
  pointer-events: none;
  z-index: 0;
}

.base-modal-overlay::-webkit-scrollbar {
  width: 0;
  background: transparent;
}

.base-modal-overlay::-webkit-scrollbar-track {
  background: transparent;
}

.base-modal-overlay::-webkit-scrollbar-thumb {
  background: transparent;
}

.base-modal {
  background: var(--russ-bg);
  border-radius: 25px;
  max-width: 1200px;
  width: min(1200px, calc(100vw - 40px));
  max-height: calc(100% - (2 * var(--base-modal-overlay-pad-block)));
  box-shadow: 0 4px 12px var(--russ-shadow-color);
  padding: 0;
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  animation: slideIn 0.2s ease;
  margin: auto;
  box-sizing: border-box;
  border: 1px solid var(--russ-border);
  overflow: hidden;
  outline: none;
}

.base-modal-height-max {
  height: calc(100% - (2 * var(--base-modal-overlay-pad-block)));
}

.base-modal-height-content {
  height: auto;
}

.base-modal-wide {
  max-width: 1200px;
  width: min(1200px, calc(100vw - 40px));
}

.base-modal-large {
  max-width: 1400px;
  width: min(1400px, calc(100vw - 40px));
}

.base-modal-size-sm {
  max-width: 520px;
  width: min(520px, calc(100vw - 40px));
}

.base-modal-size-md {
  max-width: 820px;
  width: min(820px, calc(100vw - 40px));
}

.base-modal-size-lg {
  max-width: 1140px;
  width: min(1140px, calc(100vw - 40px));
}

.base-modal-header {
  padding: 1.5rem 1.5rem 1rem 1.5rem;
  border-bottom: 1px solid var(--russ-border);
  flex-shrink: 0;
  min-height: 50px;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 1rem;
  position: relative;
  z-index: 21;
}

.base-modal-header-content {
  flex: 1;
}

.base-modal-header-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  justify-content: flex-end;
  margin-left: auto;
  flex-wrap: wrap;
  position: relative;
}

.base-modal-header-actions-inline,
.base-modal-header-actions-pinned {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.base-modal-header-actions-inline {
  flex-wrap: wrap;
}

.base-modal-title {
  margin: 0 0 0.25rem 0;
  color: var(--russ-bg-dark);
  font-weight: 600;
  font-size: 18px;
  padding-right: 40px;
}

.base-modal-subtitle {
  margin: 0;
  color: var(--russ-text-tertiary);
  font-size: 14px;
  line-height: 1.4;
  padding-right: 40px;
}

.base-modal-close {
  background: none;
  border: none;
  color: var(--russ-text-tertiary);
  cursor: pointer;
  z-index: 10;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.15s, background-color 0.15s;
  font-size: 24px;
  line-height: 1;
  padding: 0;
  border-radius: 50%;
}

.base-modal-close:hover {
  color: var(--russ-text-secondary);
  background: var(--russ-bg-hover);
}

.base-modal-close:focus {
  outline: 1px solid var(--russ-text-quaternary);
  outline-offset: 2px;
}

.base-modal-mobile-menu-btn {
  display: none;
  background: none;
  border: none;
  color: var(--russ-text-tertiary);
  cursor: pointer;
  width: 32px;
  height: 32px;
  align-items: center;
  justify-content: center;
  transition: color 0.15s, background-color 0.15s;
  font-size: 18px;
  line-height: 1;
  padding: 0;
  border-radius: 50%;
  flex-shrink: 0;
}

.base-modal-mobile-menu-btn:hover {
  color: var(--russ-text-secondary);
  background: var(--russ-bg-hover);
}

.base-modal-mobile-menu-btn--active,
.base-modal-mobile-menu-btn--active:hover {
  color: var(--russ-accent-dark);
  background: var(--russ-bg-hover);
}

.base-modal-mobile-menu-btn:focus {
  outline: 1px solid var(--russ-text-quaternary);
  outline-offset: 2px;
}

.base-modal-actions-menu-btn {
  display: none;
  background: none;
  border: none;
  color: var(--russ-text-tertiary);
  cursor: pointer;
  width: 32px;
  height: 32px;
  align-items: center;
  justify-content: center;
  transition: color 0.15s, background-color 0.15s;
  font-size: 18px;
  line-height: 1;
  padding: 0;
  border-radius: 50%;
  flex-shrink: 0;
}

.base-modal-actions-menu-btn:hover {
  color: var(--russ-text-secondary);
  background: var(--russ-bg-hover);
}

.base-modal-actions-menu-btn--active,
.base-modal-actions-menu-btn--active:hover {
  color: var(--russ-accent-dark);
  background: var(--russ-bg-hover);
}

.base-modal-actions-menu-btn:focus {
  outline: 1px solid var(--russ-text-quaternary);
  outline-offset: 2px;
}

.base-modal-actions-menu {
  position: absolute;
  top: calc(100% - 4px);
  left: 0.75rem;
  right: 0.75rem;
  z-index: 22;
  width: auto;
  min-width: 0;
  max-width: none;
  max-height: min(60vh, 420px);
  overflow-x: hidden;
  overflow-y: auto;
  padding: 8px;
  background: var(--russ-bg);
  border: 1px solid var(--russ-border);
  border-radius: 12px;
  box-shadow: 0 8px 24px var(--russ-shadow-color);
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-sizing: border-box;
  -webkit-overflow-scrolling: touch;
}

.base-modal-actions-menu > * {
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
}

.base-modal-actions-menu :deep(.form-actions),
.base-modal-actions-menu :deep(.modal-footer-actions),
.base-modal-actions-menu :deep(.reporting-modal-footer) {
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  padding: 4px;
  margin: 0;
  background: transparent;
  border: none;
  border-radius: 0;
  box-sizing: border-box;
}

.base-modal-actions-menu :deep(.btn-block),
.base-modal-actions-menu :deep(.modal-actions-group),
.base-modal-actions-menu :deep(.modal-actions-group--process),
.base-modal-actions-menu :deep(.modal-actions-cluster),
.base-modal-actions-menu :deep(.modal-actions-buttons) {
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  margin: 0;
  margin-left: 0 !important;
  padding: 0;
  border: none;
  box-sizing: border-box;
}

.base-modal-actions-menu :deep(button:not(.export-btn)),
.base-modal-actions-menu :deep(.details-save-fab) {
  width: 100%;
  min-width: 0 !important;
  max-width: 100%;
  white-space: normal;
  text-align: center;
  justify-content: center;
  box-sizing: border-box;
}

.base-modal-actions-menu :deep(.export-btn) {
  width: 100%;
  min-width: 0 !important;
  max-width: 100%;
  box-sizing: border-box;
}

.base-modal-actions-menu :deep(.modal-actions-cluster:not(:has(button))),
.base-modal-actions-menu :deep(.modal-actions-buttons:not(:has(button))) {
  display: none;
}

.base-modal-actions-menu :deep(.modal-actions-group--process:not(:has(button))) {
  display: none;
}

.base-modal-footer-backdrop {
  position: absolute;
  inset: 0;
  z-index: 20;
  background: transparent;
}

.base-modal-content {
  padding: 1.5rem;
  overflow-y: auto;
  overflow-x: hidden;
  flex: 1;
  min-height: 0;
  max-width: 100%;
  box-sizing: border-box;
  -webkit-overflow-scrolling: touch;
  position: relative;
  text-align: left;
}


.base-modal-size-sm {
  max-width: 520px;
  width: min(520px, calc(100vw - 40px));
}

.base-modal-size-md {
  max-width: 820px;
  width: min(820px, calc(100vw - 40px));
}

.base-modal-size-lg {
  max-width: 1100px;
  width: min(1100px, calc(100vw - 40px));
}

/* Стили для контента внутри модалки */
.base-modal-content > * {
  max-width: 100%;
  box-sizing: border-box;
  min-width: 0;
}

.base-modal-content::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.base-modal-content::-webkit-scrollbar-track {
  background: var(--russ-bg-tertiary);
  border-radius: 4px;
}

.base-modal-content::-webkit-scrollbar-thumb {
  background: var(--russ-text-light);
  border-radius: 4px;
}

.base-modal-content::-webkit-scrollbar-thumb:hover {
  background: var(--russ-neutral-light);
}

.base-modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--russ-border);
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  flex-shrink: 0;
  max-width: 100%;
  box-sizing: border-box;
  flex-wrap: wrap;
}

.base-modal-footer > * {
  flex-shrink: 0;
  box-sizing: border-box;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .base-modal-overlay {
    --base-modal-overlay-pad-inline: 12px;
    /* зазор сверху/снизу внутри safe-area; иначе height-max / 90vh на весь экран */
    --base-modal-overlay-pad-block: 16px;
    align-items: center;
  }

  .base-modal {
    --base-modal-mobile-max-h: calc(
      100dvh
      - env(safe-area-inset-top, 0px)
      - env(safe-area-inset-bottom, 0px)
      - (2 * var(--base-modal-overlay-pad-block))
    );
    max-width: calc(100vw - 24px);
    width: calc(100vw - 24px);
    max-height: var(--base-modal-mobile-max-h);
    border-radius: 8px;
    margin: auto;
    flex-shrink: 0;
  }

  .base-modal-height-max {
    height: var(--base-modal-mobile-max-h);
    max-height: var(--base-modal-mobile-max-h);
  }

  .base-modal-wide {
    max-width: calc(100vw - 24px);
    width: calc(100vw - 24px);
  }

  .base-modal-large {
    max-width: calc(100vw - 24px);
    width: calc(100vw - 24px);
  }

  .base-modal-size-sm,
  .base-modal-size-md,
  .base-modal-size-lg {
    max-width: calc(100vw - 24px);
    width: calc(100vw - 24px);
  }

  .base-modal-header {
    padding: 1rem;
  }

  .base-modal-title {
    font-size: 16px;
    padding-right: 32px;
  }

  .base-modal-subtitle {
    font-size: 13px;
    padding-right: 32px;
  }

  .base-modal-close {
    top: 8px;
    right: 8px;
    width: 28px;
    height: 28px;
    font-size: 20px;
  }

  .base-modal-content {
    padding: 1rem;
  }

  /* Троеточие-меню отключено: footer виден в потоке, а не за overflow-кнопкой.
     Иначе главное действие модалки (напр. «Завершить смену») прячется на мобиле. */
  .base-modal-mobile-menu-btn {
    display: none;
  }

  .base-modal--actions-in-menu .base-modal-actions-menu-btn {
    display: flex;
  }

  .base-modal--actions-in-menu.base-modal-height-max .base-modal-content {
    padding-bottom: 1rem;
  }

  .base-modal--actions-in-menu.base-modal--has-pinned-actions .base-modal-title,
  .base-modal--actions-in-menu.base-modal--has-pinned-actions .base-modal-subtitle {
    padding-right: 88px;
  }

  .base-modal--actions-in-menu .base-modal-header-actions {
    flex-wrap: nowrap;
    gap: 0.25rem;
  }

  .base-modal-footer {
    display: flex;
    position: static;
    top: auto;
    right: auto;
    left: auto;
    width: auto;
    max-height: none;
    overflow: visible;
    padding: 1rem;
    border: none;
    border-top: 1px solid var(--russ-border);
    border-radius: 0;
    background: transparent;
    box-shadow: none;
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
    z-index: auto;
  }

  .base-modal-footer > * {
    width: 100%;
  }

  .base-modal-footer :deep(.form-actions),
  .base-modal-footer :deep(.modal-footer-actions),
  .base-modal-footer :deep(.reporting-modal-footer) {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
    width: 100%;
    padding: 4px;
    margin: 0;
    background: transparent;
    border: none;
    border-radius: 0;
  }

  .base-modal-footer :deep(.btn-block),
  .base-modal-footer :deep(.modal-actions-group),
  .base-modal-footer :deep(.modal-actions-group--process),
  .base-modal-footer :deep(.modal-actions-cluster),
  .base-modal-footer :deep(.modal-actions-buttons) {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
    width: 100%;
    margin: 0;
    padding: 0;
    border: none;
  }

  .base-modal-footer :deep(button) {
    width: 100%;
    min-width: 0;
    max-width: none;
    white-space: normal;
    text-align: center;
  }
}
</style>

