<template>
  <div class="nz-layout">
    <slot />
    <AppTabBar />
  </div>
</template>

<script setup lang="ts">
import AppTabBar from '~/components/AppTabBar.vue'
</script>

<style scoped>
.nz-layout {
  min-height: 100dvh;
}
</style>
