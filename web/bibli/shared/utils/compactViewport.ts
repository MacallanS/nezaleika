import { onBeforeUnmount, onMounted, ref } from 'vue'

export const COMPACT_VIEWPORT_MQ = '(max-width: 1023px)'

export function useCompactViewport() {
  const isCompact = ref(
    typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia(COMPACT_VIEWPORT_MQ).matches,
  )

  let mq = null

  function sync() {
    isCompact.value = Boolean(mq?.matches)
  }

  onMounted(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    mq = window.matchMedia(COMPACT_VIEWPORT_MQ)
    sync()
    mq.addEventListener?.('change', sync)
  })

  onBeforeUnmount(() => {
    mq?.removeEventListener?.('change', sync)
  })

  return isCompact
}
