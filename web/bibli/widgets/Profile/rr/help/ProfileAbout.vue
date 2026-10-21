<template>
  <ProfileSecurityShell title="О приложении" back-to="/profile">
    <div class="profile-about">
      <div class="profile-about__brand">
        <span class="profile-about__logo" aria-hidden="true">
          <img :src="logoSrc" alt="" width="96" height="96" />
        </span>
        <p class="profile-about__name">РУССАЙФИН</p>
      </div>

      <ul class="profile-security-list" role="list">
        <li v-for="item in links" :key="item.href">
          <a
            class="profile-security-row profile-about__row"
            :href="item.href"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span class="profile-security-row__text">
              <span class="profile-security-row__label">{{ item.label }}</span>
            </span>
            <span class="profile-security-row__chevron" aria-hidden="true">›</span>
          </a>
        </li>
      </ul>

      <div class="profile-about__meta">
        <p class="profile-about__version">Версия {{ version }} · Сборка {{ buildLabel }}</p>
        <p class="profile-about__copy">© {{ year }} Руссайфин</p>
        <p class="profile-about__partner">Проект в партнёрстве с Русмаркетом</p>
        <a class="profile-about__email" :href="`mailto:${supportEmail}`">{{ supportEmail }}</a>
      </div>
    </div>
  </ProfileSecurityShell>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ProfileSecurityShell from '../security/ProfileSecurityShell.vue'
import '../profile-security.css'
import '../profile-help.css'

const props = withDefaults(
  defineProps<{
    version?: string
    buildId?: string
    logoSrc?: string
    supportEmail?: string
  }>(),
  {
    version: '1.0.0',
    buildId: '',
    logoSrc: '/icons/rsm-mark.svg',
    supportEmail: 'support@rusaifin.ru',
  },
)

const year = new Date().getFullYear()

const buildLabel = computed(() => {
  const id = String(props.buildId || '').trim()
  if (!id) return '—'
  return id.length > 8 ? id.slice(-6) : id
})

const links = [
  { label: 'Пользовательское соглашение', href: '/user-agreement.pdf' },
  { label: 'Политика обработки персональных данных', href: '/Policy.pdf' },
  { label: 'Юридическая информация', href: '/SOPD-Fintech.pdf' },
]
</script>
