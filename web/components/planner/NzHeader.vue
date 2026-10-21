<template>
  <header class="nz-head" :class="{ 'nz-head--child': back }">
    <div class="nz-head__row">
      <button v-if="back" type="button" class="nz-head__back" aria-label="Назад" @click="$emit('back')">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M14.5 6.5L9 12l5.5 5.5" />
        </svg>
      </button>
      <div class="nz-head__text">
        <h1>{{ title }}</h1>
        <p v-if="subtitle">{{ subtitle }}</p>
      </div>
      <div v-if="$slots.default" class="nz-head__aside">
        <slot />
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
  back?: boolean
}>()

defineEmits<{ back: [] }>()
</script>

<style scoped>
.nz-head {
  position: sticky;
  top: 0;
  z-index: 4;
  padding: calc(env(safe-area-inset-top, 0px) + 12px) 16px 12px;
  background: #f2f3f7;
}
.nz-head__row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 40px;
}
.nz-head__text {
  flex: 1;
  min-width: 0;
}
.nz-head__text h1 {
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 24px;
  font-weight: 600;
  line-height: 32px;
  letter-spacing: -0.02em;
  color: #101012;
}
.nz-head__text p {
  margin: 2px 0 0;
  font-size: 15px;
  line-height: 20px;
  color: rgba(60, 60, 67, 0.72);
}
.nz-head--child .nz-head__text h1 {
  font-size: 20px;
  line-height: 28px;
}
.nz-head__back {
  flex: 0 0 auto;
  width: 40px;
  height: 40px;
  margin-left: -8px;
  padding: 0;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: #101012;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.nz-head__back svg {
  width: 24px;
  height: 24px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.5;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.nz-head__aside {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
