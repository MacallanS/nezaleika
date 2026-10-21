<template>
  <nav class="tab-bar" :class="{ 'tab-bar--immersive': immersive }" aria-label="Навигация">
    <NuxtLink to="/" class="tab" :class="{ active: route.path === '/' }">
      Полив
      <span v-if="badge > 0" class="badge">{{ badge }}</span>
    </NuxtLink>
    <NuxtLink to="/plants" class="tab" :class="{ active: route.path.startsWith('/plants') }">
      Мои
    </NuxtLink>
    <NuxtLink to="/profile" class="tab" :class="{ active: route.path === '/profile' }">
      Профиль
    </NuxtLink>
  </nav>
</template>

<script setup lang="ts">
const route = useRoute()
const plants = usePlantsStore()
const badge = computed(() => plants.dashboard.overdue + plants.dashboard.due_today)
const immersive = computed(() => route.path === '/')
</script>

<style scoped>
.tab-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: space-around;
  padding: 10px 12px calc(10px + env(safe-area-inset-bottom, 0px));
  background: var(--rr-color-bg-surface-primary, #fff);
  border-top: 1px solid var(--rr-color-border-subtle, #e0e0e0);
  z-index: 50;
}
.tab-bar--immersive {
  background: rgba(0, 0, 0, 0.92);
  border-top-color: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(12px);
}
.tab-bar--immersive .tab {
  color: rgba(255, 255, 255, 0.55);
}
.tab-bar--immersive .tab.active {
  color: #fff;
}
.tab {
  position: relative;
  flex: 1;
  text-align: center;
  text-decoration: none;
  font-weight: 600;
  font-size: 14px;
  color: var(--rr-color-text-secondary, #666);
  padding: 8px 4px;
}
.tab.active {
  color: #2e7d32;
}
.badge {
  position: absolute;
  top: 2px;
  right: 22%;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  background: #c62828;
  color: #fff;
  font-size: 11px;
  line-height: 18px;
}
</style>
