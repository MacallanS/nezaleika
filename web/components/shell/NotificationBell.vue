<template>
  <button
    type="button"
    class="nz-bell"
    :class="{ 'nz-bell--hot': badge > 0 }"
    :aria-label="badge > 0 ? `Уведомления, ${badge}` : 'Уведомления'"
    @click="emit('click')"
  >
    <svg viewBox="0 0 24 24" class="nz-bell__icon" aria-hidden="true">
      <path
        d="M9.74 19.19c.63.5 1.46.81 2.37.81s1.74-.31 2.37-.81M5.45 16.61c-.37 0-.58-.59-.36-.92.53-.76 1.91-1.87 1.91-3.21l.02-1.94C7.02 6.93 8.82 4 12.11 4c3.34 0 4.89 2.97 4.89 6.63l-.02 1.85c0 1.35 1.65 2.47 2.15 3.23.22.33.01.9-.36.9H5.45Z"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path d="M12 2v1.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
    </svg>
    <span v-if="badge > 0" class="nz-bell__badge">{{ badge > 9 ? '9+' : badge }}</span>
  </button>
</template>

<script setup lang="ts">
defineProps<{ badge?: number }>()
const emit = defineEmits<{ click: [] }>()
</script>

<style scoped>
.nz-bell {
  position: relative;
  width: 40px;
  height: 40px;
  padding: 0;
  border: none;
  border-radius: 999px;
  background: var(--rr-backgrounds-quaternary, #f2f3f7);
  color: var(--rr-labels-neutral-primary, #101012);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.15s, transform 0.15s;
}
.nz-bell:active {
  transform: scale(0.94);
}
.nz-bell--hot {
  background: #ffebee;
  color: #c62828;
}
.nz-bell__icon {
  width: 20px;
  height: 20px;
}
.nz-bell__badge {
  position: absolute;
  top: 4px;
  right: 4px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 999px;
  background: #c62828;
  color: #fff;
  font-size: 10px;
  font-weight: 800;
  line-height: 16px;
  text-align: center;
  box-shadow: 0 0 0 2px #fff;
}
</style>
