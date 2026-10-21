<template>
  <div class="project-switch-card">
    <div class="project-switch-spinner-wrap">
      <div class="project-switch-spinner"></div>
    </div>
    <h3>{{ title }}</h3>
    <p>{{ description }}</p>
    <div class="project-switch-progress" aria-hidden="true"></div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string
    description?: string
  }>(),
  {
    title: 'Подгружаем данные проекта',
    description: 'Обычно это занимает до минуты.',
  }
)
</script>

<style scoped>
.project-switch-card {
  width: min(420px, calc(100vw - 32px));
  background: var(--russ-bg-elevated, var(--russ-text-inverse));
  border: 1px solid var(--russ-border, rgba(0, 0, 0, 0.08));
  border-radius: 16px;
  box-shadow: 0 12px 36px rgba(0, 0, 0, 0.12);
  padding: 24px 20px 18px;
  text-align: center;
}

.project-switch-spinner-wrap {
  width: 52px;
  height: 52px;
  margin: 0 auto 14px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: color-mix(in srgb, var(--russ-primary, var(--russ-accent)) 12%, transparent);
}

.project-switch-spinner {
  width: 28px;
  height: 28px;
  border: 3px solid color-mix(in srgb, var(--russ-primary, var(--russ-accent)) 24%, transparent);
  border-top-color: var(--russ-primary, var(--russ-accent));
  border-radius: 50%;
  animation: projectSwitchSpin 0.8s linear infinite;
}

.project-switch-card h3 {
  margin: 0;
  font-size: 20px;
  line-height: 1.25;
  color: var(--russ-text-primary);
}

.project-switch-card p {
  margin: 10px 0 16px;
  font-size: 14px;
  line-height: 1.45;
  color: var(--russ-text-tertiary);
}

.project-switch-progress {
  position: relative;
  height: 6px;
  border-radius: 999px;
  overflow: hidden;
  background: color-mix(in srgb, var(--russ-primary, var(--russ-accent)) 12%, transparent);
}

.project-switch-progress::before {
  content: '';
  position: absolute;
  inset: 0;
  width: 42%;
  border-radius: 999px;
  background: var(--russ-primary, var(--russ-accent));
  animation: projectSwitchProgress 1.2s ease-in-out infinite;
}

@keyframes projectSwitchSpin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes projectSwitchProgress {
  0% {
    transform: translateX(-110%);
  }
  100% {
    transform: translateX(260%);
  }
}
</style>
