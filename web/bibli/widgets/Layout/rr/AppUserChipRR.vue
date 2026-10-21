<template>
  <div class="app-user-chip-rr" :class="{ 'is-compact': compact }">
    <button
      type="button"
      class="app-user-chip-rr__trigger"
      :class="{ 'is-open': menuOpen }"
      :aria-label="userName || 'Профиль'"
      aria-haspopup="true"
      :aria-expanded="menuOpen ? 'true' : 'false'"
      aria-controls="app-user-chip-rr-menu"
      @click="toggleMenu"
    >
      <span class="app-user-chip-rr__avatar" aria-hidden="true">
        <img v-if="avatarUrl" class="app-user-chip-rr__avatar-img" :src="avatarUrl" alt="" />
        <span v-else class="app-user-chip-rr__avatar-fallback">{{ initials }}</span>
      </span>
      <span v-if="!compact" class="app-user-chip-rr__text">
        <span v-if="userName" class="app-user-chip-rr__name">{{ userName }}</span>
        <span v-if="userRole" class="app-user-chip-rr__role">{{ userRole }}</span>
      </span>
    </button>
    <Menu
      ref="menuRef"
      id="app-user-chip-rr-menu"
      :model="menuItems"
      :popup="true"
      @update:visible="menuOpen = $event"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Menu } from 'bibli/shared/ui/legacy/Menu'
import './app-user-chip-rr.css'

export interface AppUserChipMenuItem {
  label: string
  icon?: string
  command?: () => void
  to?: string
}

const props = withDefaults(
  defineProps<{
    userName?: string
    userRole?: string
    avatarUrl?: string
    menuItems?: AppUserChipMenuItem[]
    /** Только аватар (мобильная шапка) */
    compact?: boolean
  }>(),
  {
    userName: '',
    userRole: '',
    avatarUrl: '',
    menuItems: () => [],
    compact: false,
  },
)

const menuRef = ref<InstanceType<typeof Menu> | null>(null)
const menuOpen = ref(false)

const initials = computed(() => {
  const parts = props.userName.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase()
  return (parts[0].slice(0, 1) + parts[1].slice(0, 1)).toUpperCase()
})

function toggleMenu(event: Event) {
  menuRef.value?.toggle?.(event)
}
</script>
