import { onBeforeUnmount, onMounted, ref } from 'vue'

const DEFAULT_MQ = '(max-width: 1024px)'

/** Когда шапка отчётности/заявок переходит на компактные кнопки — одно меню вместо ряда. */
export function useCompactHeaderActions(mediaQuery = DEFAULT_MQ) {
  const isCompactHeader = ref(false)
  let mq: MediaQueryList | null = null

  function sync(event?: MediaQueryListEvent) {
    isCompactHeader.value = event?.matches ?? mq?.matches ?? false
  }

  onMounted(() => {
    if (typeof window === 'undefined') return
    mq = window.matchMedia(mediaQuery)
    sync()
    mq.addEventListener('change', sync)
  })

  onBeforeUnmount(() => {
    mq?.removeEventListener('change', sync)
    mq = null
  })

  return { isCompactHeader }
}
