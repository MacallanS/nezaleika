<template>
  <div v-if="items.length" ref="anchorRef" class="staff-profile-more">
    <button
      type="button"
      class="staff-profile-more__trigger"
      aria-label="Ещё"
      aria-haspopup="menu"
      :aria-expanded="open ? 'true' : 'false'"
      :aria-controls="menuId"
      @click.stop="toggle"
    >
      <img class="staff-profile-more__trigger-icon" :src="iconMore" alt="" width="24" height="24" />
    </button>

    <Teleport to="body">
      <div
        v-if="open"
        class="staff-profile-more__backdrop"
        aria-hidden="true"
        @click="close"
      />
      <div
        v-if="open"
        :id="menuId"
        ref="panelRef"
        class="staff-profile-more__panel"
        role="menu"
        :style="alignedPanelStyles"
        @mousedown.stop
      >
        <button
          v-for="(item, index) in items"
          :key="`${item.label}-${index}`"
          type="button"
          class="staff-profile-more__item"
          role="menuitem"
          @click="onSelect(item)"
        >
          {{ item.label }}
        </button>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useRrFloatingDropdown } from 'bibli/shared/ui/rr/composables/useRrFloatingDropdown'
import type { StaffProfileMoreMenuItem } from '../composables/useStaffProfileMoreActions'
import iconMore from '../assets/icons/more.svg'

const props = withDefaults(
  defineProps<{
    items?: StaffProfileMoreMenuItem[]
  }>(),
  {
    items: () => [],
  },
)

const menuId = 'staff-profile-header-more-menu'
const anchorRef = ref<HTMLElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)
const open = ref(false)
const route = useRoute()

const { panelStyles, startTracking, stopTracking, repositionWhenOpen } = useRrFloatingDropdown(
  anchorRef,
  panelRef,
  open,
  {
    estimatedHeight: 240,
    maxHeight: 360,
    minWidth: 240,
  },
)

const alignedPanelStyles = computed(() => {
  const styles = { ...panelStyles.value }
  const anchor = anchorRef.value?.querySelector('.staff-profile-more__trigger') as HTMLElement | null
  const trigger = anchor ?? (anchorRef.value?.firstElementChild as HTMLElement | null)
  const widthPx = Number.parseFloat(String(styles.width ?? ''))
  if (trigger && Number.isFinite(widthPx) && widthPx > 0) {
    const rect = trigger.getBoundingClientRect()
    styles.left = `${Math.max(8, rect.right - widthPx)}px`
  }
  return styles
})

function openMenu() {
  if (!props.items.length) return
  open.value = true
  startTracking()
  void repositionWhenOpen()
}

function close() {
  open.value = false
  stopTracking()
}

function toggle() {
  if (open.value) close()
  else openMenu()
}

async function onSelect(item: StaffProfileMoreMenuItem) {
  try {
    await Promise.resolve(item.command?.())
  } finally {
    close()
  }
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') close()
}

watch(open, (isOpen) => {
  if (typeof document === 'undefined') return
  if (isOpen) document.addEventListener('keydown', onKeydown)
  else document.removeEventListener('keydown', onKeydown)
})

watch(
  () => route.fullPath,
  () => {
    if (open.value) close()
  },
)

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  stopTracking()
})
</script>

<style scoped>
.staff-profile-more {
  position: relative;
  flex-shrink: 0;
}

.staff-profile-more__trigger {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  gap: var(--rr-spacing-padding-s, 4px);
  padding: var(--rr-spacing-padding-l, 12px);
  border: none;
  border-radius: var(--rr-radius-m, 8px);
  background: var(--rr-button-neutral-secondary-background-default, #f2f3f7);
  cursor: pointer;
}

.staff-profile-more__trigger:hover {
  background: var(--rr-button-neutral-secondary-background-hover, #e7e8ee);
}

.staff-profile-more__trigger:focus-visible {
  outline: 2px solid var(--rr-input-border-active, #1c4ae5);
  outline-offset: 2px;
}

.staff-profile-more__trigger-icon {
  display: block;
  width: 24px;
  height: 24px;
}

.staff-profile-more__backdrop {
  position: fixed;
  inset: 0;
  z-index: 99999;
}

.staff-profile-more__panel {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 240px;
  padding: 8px;
  border: 1px solid var(--rr-border-neutral-subtle, rgba(120, 120, 128, 0.16));
  border-radius: 16px;
  background: var(--rr-backgrounds-primary, #fff);
  box-shadow: 0 8px 24px rgba(16, 16, 18, 0.12);
}

.staff-profile-more__item {
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 40px;
  margin: 0;
  padding: 8px 12px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: var(--rr-labels-neutral-primary, #101012);
  font-family: var(--rr-font-family-font-family, Manrope, system-ui, sans-serif);
  font-size: var(--rr-font-size-font-size-s, 14px);
  font-weight: 500;
  line-height: var(--rr-line-height-line-height-s, 20px);
  text-align: left;
  cursor: pointer;
}

.staff-profile-more__item:hover,
.staff-profile-more__item:focus-visible {
  background: var(--rr-backgrounds-quaternary, #f2f3f7);
  outline: none;
}
</style>
