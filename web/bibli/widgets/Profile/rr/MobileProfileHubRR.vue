<template>
  <section
    class="mobile-profile-hub-rr"
    :class="{ 'mobile-profile-hub-rr--registry': heroVariant === 'registry' }"
    aria-label="Профиль"
  >
    <header class="mph-hero">
      <button
        v-if="showBell"
        type="button"
        class="mph-hero__bell"
        aria-label="Уведомления"
        @click="emit('notifications')"
      >
        <img :src="iconBell" alt="" width="24" height="24" />
      </button>

      <div class="mph-hero__identity">
        <span class="mph-hero__avatar" aria-hidden="true">
          <img
            v-if="effectiveAvatar"
            class="mph-hero__avatar-img"
            :src="effectiveAvatar"
            alt=""
            @error="avatarBroken = true"
          />
          <span v-else class="mph-hero__avatar-fallback">{{ initials }}</span>
        </span>
        <h1 class="mph-hero__name">{{ userName || 'Профиль' }}</h1>
        <p v-if="subtitle" class="mph-hero__subtitle">{{ subtitle }}</p>
      </div>
    </header>

    <div class="mph-body">
      <section
        v-if="serviceItems.length"
        class="mph-section mph-section--card"
        aria-label="Сервисы"
      >
        <h2 class="mph-section__title">Сервисы</h2>
        <ul class="mph-docs mph-docs--services" role="list">
          <li v-for="svc in serviceItems" :key="svc.id">
            <button
              type="button"
              class="mph-doc mph-doc--service"
              :disabled="svc.disabled && !svc.current"
              :aria-current="svc.current ? 'true' : undefined"
              @click="onService(svc)"
            >
              <span class="mph-doc__icon" aria-hidden="true">
                <img :src="serviceIconUrl(svc)" alt="" width="64" height="64" />
              </span>
              <span class="mph-doc__label">{{ serviceDisplayLabel(svc) }}</span>
            </button>
          </li>
        </ul>
      </section>

      <section
        v-if="showDocumentsSection"
        class="mph-section mph-section--card"
        aria-label="Документы"
      >
        <h2 class="mph-section__title">Документы</h2>
        <ul class="mph-docs" role="list">
          <li v-for="item in activationTiles" :key="item.key">
            <button type="button" class="mph-doc" @click="onItem(item)">
              <span class="mph-doc__icon" aria-hidden="true">
                <img :src="docIcon(item)" alt="" width="64" height="64" />
              </span>
              <span class="mph-doc__label">{{ item.label }}</span>
            </button>
          </li>
        </ul>
      </section>

      <ul v-if="overflowItems.length" class="mph-list" role="list">
        <li v-for="item in overflowItems" :key="item.key">
          <template v-if="item.children?.length">
            <button
              type="button"
              class="mph-row"
              :aria-expanded="isGroupOpen(item)"
              @click="toggleGroup(item)"
            >
              <span class="mph-row__icon" aria-hidden="true">
                <img :src="rowIcon(item)" alt="" width="24" height="24" />
              </span>
              <span class="mph-row__label">{{ item.label }}</span>
              <span
                v-if="item.badge"
                class="mph-row__badge"
                aria-label="Требует внимания"
              />
              <span class="mph-row__chevron" aria-hidden="true">›</span>
            </button>
            <ul v-if="isGroupOpen(item)" class="mph-sub" role="list">
              <li
                v-for="(child, index) in item.children"
                :key="child.key"
                class="mph-sub__item"
                :class="{ 'is-last': index === (item.children?.length ?? 1) - 1 }"
              >
                <img
                  class="mph-sub__tree"
                  :src="index === (item.children?.length ?? 1) - 1 ? navRrIcons.treeEnd : navRrIcons.treeMid"
                  alt=""
                  width="17"
                  :height="index === (item.children?.length ?? 1) - 1 ? 23 : 42"
                  aria-hidden="true"
                />
                <button type="button" class="mph-sub__link" @click="onItem(child)">
                  <span class="mph-sub__label">{{ child.label }}</span>
                  <span
                    v-if="child.badge"
                    class="mph-row__badge"
                    aria-label="Требует внимания"
                  />
                </button>
              </li>
            </ul>
          </template>
          <button v-else type="button" class="mph-row" @click="onItem(item)">
            <span class="mph-row__icon" aria-hidden="true">
              <img :src="rowIcon(item)" alt="" width="24" height="24" />
            </span>
            <span class="mph-row__label">{{ item.label }}</span>
            <span
              v-if="item.badge"
              class="mph-row__badge"
              aria-label="Требует внимания"
            />
            <span class="mph-row__chevron" aria-hidden="true">›</span>
          </button>
        </li>
      </ul>

      <section
        v-if="settingsItems.length"
        class="mph-section mph-section--card"
        aria-label="Настройки"
      >
        <h2 class="mph-section__title">Настройки</h2>
        <ul class="mph-list mph-list--in-card" role="list">
          <li v-for="item in settingsItems" :key="item.key">
            <button
              type="button"
              class="mph-row"
              :disabled="item.stub && !item.to"
              @click="onItem(item)"
            >
              <span class="mph-row__icon" aria-hidden="true">
                <img :src="rowIcon(item)" alt="" width="24" height="24" />
              </span>
              <span class="mph-row__label">{{ item.label }}</span>
              <span class="mph-row__chevron" aria-hidden="true">›</span>
            </button>
          </li>
        </ul>
      </section>

      <section
        v-if="helpItems.length"
        class="mph-section mph-section--card"
        aria-label="Помощь и информация"
      >
        <h2 class="mph-section__title">Помощь и информация</h2>
        <ul class="mph-list mph-list--in-card" role="list">
          <li v-for="item in helpItems" :key="item.key">
            <button
              type="button"
              class="mph-row"
              :disabled="item.stub && !item.to"
              @click="onItem(item)"
            >
              <span class="mph-row__icon" aria-hidden="true">
                <img :src="rowIcon(item)" alt="" width="24" height="24" />
              </span>
              <span class="mph-row__label">{{ item.label }}</span>
              <span class="mph-row__chevron" aria-hidden="true">›</span>
            </button>
          </li>
        </ul>
      </section>

      <ul class="mph-list" role="list">
        <li>
          <button type="button" class="mph-row mph-row--danger" @click="emit('logout')">
            <span class="mph-row__icon" aria-hidden="true">
              <img :src="iconLogout" alt="" width="24" height="24" />
            </span>
            <span class="mph-row__label">Выйти из аккаунта</span>
          </button>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  CRM_ICON_BY_ID,
  NAV_RR_ICON_BY_KEY,
  navRrIcons,
  type NavRrIconName,
} from '../../Layout/rr/assets/icons'
import iconPersonal from './assets/activation/personal.png'
import iconPassport from './assets/activation/passport.png'
import iconInn from './assets/activation/inn.png'
import iconSnils from './assets/activation/snils.png'
import iconBank from './assets/activation/bank.png'
import iconAgentType from './assets/activation/agent-type.png'
import iconLogout from './assets/hub/icon-logout.svg'
import iconAbout from './assets/hub/icon-about.svg'
import iconSupport from './assets/hub/icon-support.svg'
import iconSecurity from './assets/hub/icon-security.svg'
import iconContacts from './assets/hub/icon-contacts.svg'
import iconBell from './assets/hub/icon-bell.svg'
import './mobile-profile-hub-rr.css'

export type MobileProfileServiceItem = {
  id: string
  label: string
  color: string
  icon?: string
  href?: string
  disabled?: boolean
  current?: boolean
}

export type MobileProfileHubItem = {
  key: string
  label: string
  to?: string
  iconKey: string
  iconUrl?: string
  stub?: boolean
  badge?: boolean
  children?: MobileProfileHubItem[]
}

const DOC_ICON_BY_KEY: Record<string, string> = {
  personal: iconPersonal,
  passport: iconPassport,
  inn: iconInn,
  snils: iconSnils,
  bank: iconBank,
  'agent-type': iconAgentType,
}

/** Иконки хаба профиля (IconSet) — по key пункта. */
const HUB_ICON_BY_KEY: Record<string, string> = {
  contacts: iconContacts,
  notifications: iconBell,
  security: iconSecurity,
  support: iconSupport,
  about: iconAbout,
}

const props = withDefaults(
  defineProps<{
    userName?: string
    userRole?: string
    projectLabel?: string
    avatarUrl?: string
    showBell?: boolean
    personalItems?: MobileProfileHubItem[]
    documentItems?: MobileProfileHubItem[]
    overflowItems?: MobileProfileHubItem[]
    settingsItems?: MobileProfileHubItem[]
    helpItems?: MobileProfileHubItem[]
    serviceItems?: MobileProfileServiceItem[]
    heroVariant?: 'fintech' | 'registry'
  }>(),
  {
    userName: '',
    userRole: '',
    projectLabel: '',
    avatarUrl: '',
    showBell: true,
    personalItems: () => [],
    documentItems: () => [],
    overflowItems: () => [],
    settingsItems: () => [],
    helpItems: () => [],
    serviceItems: () => [],
    heroVariant: 'fintech',
  },
)

const emit = defineEmits<{
  navigate: [to: string]
  logout: []
  notifications: []
  stub: [item: MobileProfileHubItem]
  service: [item: MobileProfileServiceItem]
}>()

const avatarBroken = ref(false)
const openGroups = ref<Record<string, boolean>>({})

watch(
  () => props.avatarUrl,
  () => {
    avatarBroken.value = false
  },
)

const effectiveAvatar = computed(() =>
  props.avatarUrl && !avatarBroken.value ? props.avatarUrl : '',
)

const initials = computed(() => {
  const parts = String(props.userName || '')
    .trim()
    .split(/[\s-]+/)
    .filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0].slice(0, 1) + parts[1].slice(0, 1)).toUpperCase()
})

const subtitle = computed(() => {
  const bits = [props.userRole, props.projectLabel].filter(Boolean)
  return bits.join(' · ')
})

/** Личные данные — первая иконка в ряду документов, не отдельная строка. */
const activationTiles = computed(() => [...props.personalItems, ...props.documentItems])

/** В реестре блок документов не показываем — только сервисы и overflow. */
const showDocumentsSection = computed(
  () => props.heroVariant !== 'registry' && activationTiles.value.length > 0,
)

function navIconByKey(iconKey: string): string {
  const name = (NAV_RR_ICON_BY_KEY[iconKey] ||
    (iconKey === 'user' ? 'user' : 'services')) as NavRrIconName
  return navRrIcons[name] || navRrIcons.services
}

function rowIcon(item: MobileProfileHubItem | string): string {
  if (typeof item === 'string') return navIconByKey(item)
  if (item.iconUrl) return item.iconUrl
  if (HUB_ICON_BY_KEY[item.key]) return HUB_ICON_BY_KEY[item.key]
  if (HUB_ICON_BY_KEY[item.iconKey]) return HUB_ICON_BY_KEY[item.iconKey]
  return navIconByKey(item.iconKey)
}

function docIcon(item: MobileProfileHubItem): string {
  if (item.iconUrl) return item.iconUrl
  return DOC_ICON_BY_KEY[item.key] || rowIcon(item)
}

function onItem(item: MobileProfileHubItem) {
  if (item.to) {
    emit('navigate', item.to)
    return
  }
  emit('stub', item)
}

function serviceIconUrl(svc: MobileProfileServiceItem): string {
  if (svc.icon) return svc.icon
  const id = String(svc.id).toLowerCase()
  return CRM_ICON_BY_ID[id] || CRM_ICON_BY_ID.fintech || navRrIcons.services
}

function serviceDisplayLabel(svc: MobileProfileServiceItem): string {
  const id = String(svc.id).toLowerCase()
  if (id === 'fintech') return 'Финтех'
  if (id === 'registry') return 'Реестр'
  return svc.label
}

function onService(svc: MobileProfileServiceItem) {
  if (svc.disabled && !svc.current) return
  // Хаб /profile не является экраном сервиса. Подсветка «Реестр» значит только
  // контекст: тап всё равно должен открыть /cards/, иначе с моб. профиля клик мёртвый.
  if (svc.current && String(svc.id).toLowerCase() !== 'registry') return
  emit('service', svc)
}

function isGroupOpen(item: MobileProfileHubItem): boolean {
  return Boolean(openGroups.value[item.key])
}

function toggleGroup(item: MobileProfileHubItem): void {
  openGroups.value = {
    ...openGroups.value,
    [item.key]: !isGroupOpen(item),
  }
}
</script>
