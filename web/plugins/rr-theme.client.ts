export default defineNuxtPlugin(() => {
  const html = document.documentElement
  html.toggleAttribute('data-rr', true)
  html.dataset.colorMode = 'light'
  html.dataset.rrViewport = 'mobile'
  html.dataset.rrDensity = '100'
})
