/** Minimal matchMedia helper (no @vueuse dependency). */
export function useMediaQuery(query: string) {
  const matches = ref(false)

  function sync() {
    if (!import.meta.client) return
    matches.value = window.matchMedia(query).matches
  }

  onMounted(() => {
    sync()
    const mql = window.matchMedia(query)
    const onChange = () => {
      matches.value = mql.matches
    }
    mql.addEventListener('change', onChange)
    onBeforeUnmount(() => mql.removeEventListener('change', onChange))
  })

  return matches
}
