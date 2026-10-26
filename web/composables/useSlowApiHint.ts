/** After SLOW_MS of an in-flight load, show “server waking” for free Render cold starts. */

const SLOW_MS = 4000

export function useSlowApiHint(loading: Ref<boolean>) {
  const slow = ref(false)
  let timer: ReturnType<typeof setTimeout> | null = null

  watch(
    loading,
    (isLoading) => {
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
      if (!isLoading) {
        slow.value = false
        return
      }
      timer = setTimeout(() => {
        if (loading.value) slow.value = true
      }, SLOW_MS)
    },
    { immediate: true },
  )

  onBeforeUnmount(() => {
    if (timer) clearTimeout(timer)
  })

  return { slow }
}
