<template>
  <div class="auth-template">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';

function updateViewportHeight() {
  if (typeof window === 'undefined') return;
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}

onMounted(() => {
  if (typeof window === 'undefined') return;
  updateViewportHeight();
  window.addEventListener('resize', updateViewportHeight);
  window.addEventListener('orientationchange', updateViewportHeight);
});

onUnmounted(() => {
  if (typeof window === 'undefined') return;
  window.removeEventListener('resize', updateViewportHeight);
  window.removeEventListener('orientationchange', updateViewportHeight);
});
</script>

<style>
.auth-template {
  padding: 30px 0;
  background-color: var(--russ-bg);
  min-height: calc(var(--vh, 1vh) * 100);
  height: calc(var(--vh, 1vh) * 100);
  padding-bottom: calc(30px + env(safe-area-inset-bottom));
  box-sizing: border-box;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.auth-template::-webkit-scrollbar {
  display: none;
}

html,
body {
  margin: 0;
  background-color: #ffffff;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

html::-webkit-scrollbar,
body::-webkit-scrollbar {
  display: none;
}

@media (max-width: 768px) {
  .auth-template {
    padding: 0;
    padding-bottom: 0;
  }
}
</style>
