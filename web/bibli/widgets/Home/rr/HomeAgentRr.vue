<template>
  <section class="home-agent-rr" aria-label="Главная">
    <header class="har-hero">
      <div class="har-hero__top">
        <button
          type="button"
          class="har-user"
          :aria-label="displayName || 'Профиль'"
          @click="emit('profile')"
        >
          <span class="har-user__avatar" aria-hidden="true">
            <img
              v-if="effectiveAvatar"
              class="har-user__avatar-img"
              :src="effectiveAvatar"
              alt=""
              @error="avatarBroken = true"
            />
            <span v-else class="har-user__avatar-fallback">{{ initials }}</span>
          </span>
          <span class="har-user__name">{{ displayName || 'Профиль' }}</span>
          <span class="har-user__chevron" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M6 4l4 4-4 4"
                stroke="currentColor"
                stroke-width="1.3"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </span>
        </button>

        <button
          v-if="showBell"
          type="button"
          class="har-bell"
          aria-label="Уведомления"
          @click="emit('notifications')"
        >
          <img :src="iconBell" alt="" width="24" height="24" />
        </button>
      </div>

      <div class="har-hero__copy">
        <p class="har-hero__eyebrow">{{ eyebrow }}</p>
        <h1 class="har-hero__title">{{ title }}</h1>
        <p v-if="subtitle" class="har-hero__subtitle">{{ subtitle }}</p>
      </div>

      <button
        type="button"
        class="har-hero__cta"
        :class="ctaClass"
        :disabled="actionLoading"
        @click="onCta"
      >
        <span v-if="actionLoading" class="har-hero__cta-loader" aria-hidden="true" />
        <span v-else>{{ ctaLabel }}</span>
      </button>
    </header>

    <div class="har-body">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import iconBell from 'bibli/widgets/Profile/rr/assets/hub/icon-bell.svg'
import './home-agent-rr.css'

const props = withDefaults(
  defineProps<{
    userName?: string
    avatarUrl?: string
    showBell?: boolean
    onShift?: boolean
    showUnclosed?: boolean
    actionLoading?: boolean
    activePointName?: string | null
  }>(),
  {
    userName: '',
    avatarUrl: '',
    showBell: false,
    onShift: false,
    showUnclosed: false,
    actionLoading: false,
    activePointName: null,
  },
)

const emit = defineEmits<{
  profile: []
  notifications: []
  start: []
  end: []
  unclosed: []
}>()

const avatarBroken = ref(false)

watch(
  () => props.avatarUrl,
  () => {
    avatarBroken.value = false
  },
)

const effectiveAvatar = computed(() =>
  props.avatarUrl && !avatarBroken.value ? props.avatarUrl : '',
)

const displayName = computed(() => String(props.userName || '').trim())

const initials = computed(() => {
  const parts = displayName.value.split(/[\s-]+/).filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0].slice(0, 1) + parts[1].slice(0, 1)).toUpperCase()
})

const eyebrow = computed(() => {
  if (props.showUnclosed) return 'Нужно закрыть предыдущую смену'
  if (props.onShift) {
    const point = String(props.activePointName || '').trim()
    return point ? `Активная точка · ${point}` : 'Вы на смене'
  }
  return 'На сегодня ничего не запланировано'
})

const title = computed(() => {
  if (props.showUnclosed) return 'Смена не закрыта'
  if (props.onShift) return 'Завершить смену?'
  return 'Готовы начать?'
})

const subtitle = computed(() => {
  if (props.showUnclosed) return 'Отправьте отчёт, чтобы продолжить'
  if (props.onShift) return 'Проведите check out и закройте день'
  return 'Выберите точку и начните'
})

const ctaLabel = computed(() => {
  if (props.showUnclosed) return 'Смена не закрыта'
  if (props.onShift) return 'Закончить смену'
  return 'Начать'
})

const ctaClass = computed(() => {
  if (props.showUnclosed) return 'har-hero__cta--unclosed'
  if (props.onShift) return 'har-hero__cta--end'
  return null
})

function onCta() {
  if (props.actionLoading) return
  if (props.showUnclosed) {
    emit('unclosed')
    return
  }
  if (props.onShift) {
    emit('end')
    return
  }
  emit('start')
}
</script>
