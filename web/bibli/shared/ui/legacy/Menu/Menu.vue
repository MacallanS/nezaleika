<template>
  <Teleport to="body">
    <Transition name="menu-fade">
      <div
        v-if="visible"
        ref="panelRef"
        :id="id"
        :class="['menu-panel', panelClass]"
        :style="panelStyle"
        @click.stop
      >
        <ul class="menu-list">
          <li
            v-for="(item, index) in model"
            :key="index"
            class="menu-item"
            @click="onItemClick(item)"
          >
            <i v-if="item.icon" :class="item.icon" class="menu-item-icon"></i>
            <span class="menu-item-label">{{ item.label }}</span>
          </li>
        </ul>
      </div>
    </Transition>
    <div
      v-if="visible"
      class="menu-backdrop"
      aria-hidden="true"
      @click="close"
    />
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const props = defineProps({
  id: { type: String, default: '' },
  model: { type: Array, default: () => [] },
  popup: { type: Boolean, default: false },
  panelClass: { type: String, default: '' }
})

const visible = ref(false)
const panelRef = ref(null)
const panelStyle = ref({})
const route = useRoute()

const emit = defineEmits(['update:visible'])

function toggle(event) {
  if (visible.value) {
    close()
    return
  }
  if (event && event.currentTarget && props.popup) {
    const rect = event.currentTarget.getBoundingClientRect()
    const padding = 8
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
    const minWidth = isMobile ? Math.min(220, (typeof window !== 'undefined' ? window.innerWidth : 320) - padding * 2) : Math.max(rect.width, 180)
    let top = rect.bottom + (isMobile ? 6 : 12)
    let left = rect.left

    // Меню справа под иконкой, но не за пределами экрана
    if (typeof window !== 'undefined') {
      const vw = window.innerWidth
      const vh = window.innerHeight
      const maxLeft = vw - minWidth - padding
      const minLeft = padding
      left = Math.min(Math.max(left, minLeft), maxLeft)
      if (top + 280 > vh - padding) top = Math.max(padding, rect.top - 280)
      if (top < padding) top = padding
    }

    panelStyle.value = {
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      minWidth: `${minWidth}px`,
      maxWidth: typeof window !== 'undefined' ? `${window.innerWidth - padding * 2}px` : 'none'
    }
  } else {
    panelStyle.value = {}
  }
  visible.value = true
}

function close() {
  visible.value = false
}

async function onItemClick(item) {
  try {
    if (item.command && typeof item.command === 'function') {
      await Promise.resolve(item.command())
    }
  } finally {
    close()
  }
}

// Закрытие по Escape
function onKeydown(e) {
  if (e.key === 'Escape') close()
}

watch(visible, (isVisible) => {
  emit('update:visible', isVisible)
  if (isVisible) {
    document.addEventListener('keydown', onKeydown)
  } else {
    document.removeEventListener('keydown', onKeydown)
  }
})

watch(
  () => route.fullPath,
  () => {
    if (visible.value) close()
  },
)

defineExpose({
  toggle,
  close,
  visible
})
</script>

<style scoped>
.menu-backdrop {
  position: fixed;
  inset: 0;
  /* Ниже .app-navigation (1150): левая колонка навигации остаётся кликабельной */
  z-index: 1099;
}

.menu-panel {
  /* Выше сайдбара, чтобы выпадающее меню не уходило под него при узком окне */
  z-index: 1200;
  background: var(--russ-bg);
  border: 1px solid var(--russ-border);
  border-radius: 8px;
  box-shadow: 0 4px 20px var(--russ-shadow-color);
  min-width: 180px;
  overflow: hidden;
}

.menu-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  cursor: pointer;
  font-size: 14px;
  color: var(--russ-text-primary);
  transition: background 0.15s;
  white-space: nowrap;
}

@media (max-width: 767px) {
  .menu-item {
    gap: 6px;
  }
}

.menu-item:hover {
  background: var(--russ-bg-hover);
}

.menu-item:first-child {
  border-top-left-radius: 7px;
  border-top-right-radius: 7px;
}

.menu-item:last-child {
  border-bottom-left-radius: 7px;
  border-bottom-right-radius: 7px;
}

.menu-item:only-child {
  border-radius: 7px;
}

.menu-item-icon {
  font-size: 14px;
  width: 14px;
  color: var(--russ-text-tertiary);
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.menu-item-label {
  flex: 1;
}

.menu-fade-enter-active,
.menu-fade-leave-active {
  transition: opacity 0.15s ease;
}

.menu-fade-enter-from,
.menu-fade-leave-to {
  opacity: 0;
}
</style>
