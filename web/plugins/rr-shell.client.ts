function setShellHeight() {
  const vh = window.innerHeight * 0.01
  document.documentElement.style.setProperty('--vh', `${vh}px`)
  document.documentElement.style.setProperty('--app-shell-height', `${window.innerHeight}px`)
}

export default defineNuxtPlugin(() => {
  const html = document.documentElement
  html.classList.add('app-rr-shell')

  setShellHeight()
  window.addEventListener('resize', setShellHeight, { passive: true })

  const route = useRoute()
  watch(
    () => route.path,
    (path) => {
      const feed = path === '/' || path === ''
      html.classList.toggle('app-rr-immersive-no-tabbar', false)
      html.classList.toggle('app-rr-feed-lock', feed)
    },
    { immediate: true },
  )
})
