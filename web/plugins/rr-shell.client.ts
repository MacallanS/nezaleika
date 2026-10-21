function setShellHeight() {
  const vh = window.innerHeight * 0.01
  document.documentElement.style.setProperty('--vh', `${vh}px`)
  document.documentElement.style.setProperty('--app-shell-height', `${window.innerHeight}px`)
}

export default defineNuxtPlugin(() => {
  document.documentElement.classList.add('app-rr-shell')
  setShellHeight()
  window.addEventListener('resize', setShellHeight, { passive: true })
})
