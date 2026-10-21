import { onBeforeUnmount, ref } from 'vue'

const handlerRef = ref<(() => void | Promise<void>) | null>(null)

/** Страница child регистрирует кастомный back (напр. с query). */
export function registerRrChildBack(fn: () => void | Promise<void>) {
  handlerRef.value = fn
  onBeforeUnmount(() => {
    if (handlerRef.value === fn) {
      handlerRef.value = null
    }
  })
}

/** @returns true если handler вызван */
export function runRrChildBack() {
  const fn = handlerRef.value
  if (!fn) return false
  void fn()
  return true
}
