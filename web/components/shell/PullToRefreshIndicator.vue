<script setup lang="ts">
import { computed } from 'vue'
import {
  indicatorOffsetInGap,
  PTR_REFRESH_HOLD_PX,
  type PullToRefreshPhase,
} from '~/utils/pullToRefreshMath'

const props = defineProps<{
  distance: number
  phase: PullToRefreshPhase
  animating?: boolean
}>()

const PTR_BLOCK_COMPACT_PX = 28
const PTR_BLOCK_FULL_PX = 50

const isActive = computed(() => props.phase !== 'idle' || props.distance > 0)

const contentOffset = computed(() =>
  props.phase === 'refreshing' ? PTR_REFRESH_HOLD_PX : props.distance,
)

const blockHeight = computed(() =>
  props.phase === 'refreshing' ? PTR_BLOCK_COMPACT_PX : PTR_BLOCK_FULL_PX,
)

const translateY = computed(() => indicatorOffsetInGap(contentOffset.value, blockHeight.value))

const progress = computed(() => Math.min(1, props.distance / 64))

const hint = computed(() => {
  if (props.phase === 'refreshing') return ''
  if (props.phase === 'ready') return 'Отпустите'
  if (props.phase === 'pulling') return 'Потяните вниз'
  return ''
})

const useTransition = computed(() => props.phase === 'refreshing' || props.animating === true)

const spinnerSpinning = computed(() => props.phase === 'ready' || props.phase === 'refreshing')
</script>

<template>
  <div
    class="ptr-indicator"
    :class="{
      'ptr-indicator--active': isActive,
      'ptr-indicator--refreshing': phase === 'refreshing',
      'ptr-indicator--ready': phase === 'ready',
      'ptr-indicator--transition': useTransition,
    }"
    :style="{ transform: `translate3d(-50%, ${translateY}px, 0)` }"
    aria-live="polite"
    :aria-busy="phase === 'refreshing'"
  >
    <div class="ptr-indicator__track" aria-hidden="true">
      <svg
        v-if="phase !== 'refreshing'"
        class="ptr-indicator__ring"
        viewBox="0 0 24 24"
        :style="{ opacity: 0.35 + progress * 0.45 }"
      >
        <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2" />
      </svg>
      <svg
        class="ptr-indicator__spinner"
        :class="{ 'ptr-indicator__spinner--spin': spinnerSpinning }"
        viewBox="0 0 24 24"
        :style="{
          opacity: spinnerSpinning ? 1 : 0.2 + progress * 0.8,
          transform: spinnerSpinning ? undefined : `rotate(${progress * 300}deg)`,
        }"
      >
        <circle
          cx="12"
          cy="12"
          r="9"
          fill="none"
          stroke="currentColor"
          stroke-width="2.25"
          stroke-linecap="round"
          stroke-dasharray="42"
          stroke-dashoffset="14"
        />
      </svg>
    </div>
    <span v-if="hint" class="ptr-indicator__hint">{{ hint }}</span>
  </div>
</template>

<style scoped>
.ptr-indicator {
  position: fixed;
  top: env(safe-area-inset-top, 0px);
  left: 50%;
  z-index: 45;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 6px;
  width: 120px;
  pointer-events: none;
  color: var(--rr-labels-neutral-secondary, rgba(60, 60, 67, 0.72));
  opacity: 0;
  will-change: transform, opacity;
}
.ptr-indicator--active {
  opacity: 1;
}
.ptr-indicator--transition {
  transition: transform 0.24s cubic-bezier(0.22, 1, 0.36, 1);
}
.ptr-indicator__track {
  position: relative;
  width: 28px;
  height: 28px;
  flex: 0 0 auto;
}
.ptr-indicator__ring,
.ptr-indicator__spinner {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
.ptr-indicator__spinner {
  transition: opacity 0.12s ease;
}
.ptr-indicator__spinner--spin {
  animation: ptr-spin 0.75s linear infinite;
}
.ptr-indicator__hint {
  font-family: var(--rr-font-family-font-family, Manrope, system-ui, sans-serif);
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;
  color: var(--rr-labels-neutral-tertiary, rgba(60, 60, 67, 0.52));
}
.ptr-indicator--ready .ptr-indicator__hint {
  color: var(--rr-labels-neutral-primary, #101012);
}
@keyframes ptr-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
