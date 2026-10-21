import { applyRussRedesign } from 'bibli/shared/theme/rr'

const MOBILE_MAX = 1024

function syncRrTheme() {
  applyRussRedesign({
    enabled: true,
    colorMode: 'light',
    density: '100',
    viewport: window.innerWidth <= MOBILE_MAX ? 'mobile' : 'desktop',
  })
}

export default defineNuxtPlugin(() => {
  syncRrTheme()
  window.addEventListener('resize', syncRrTheme, { passive: true })
})
