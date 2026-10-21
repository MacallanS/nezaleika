<template>
  <section class="staff-profile-tab-stub">
    <h2 class="staff-profile-tab-stub__title">{{ title }}</h2>
    <p class="staff-profile-tab-stub__description">{{ description }}</p>
    <p class="staff-profile-tab-stub__hint">Раздел в разработке</p>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  description: string
}>()
</script>

<style scoped>
.staff-profile-tab-stub {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 240px;
  padding-top: 8px;
}

.staff-profile-tab-stub__title {
  margin: 0;
  font-family: var(--rr-font-family-font-family, Manrope, system-ui, sans-serif);
  font-size: var(--rr-font-size-font-size-m, 16px);
  font-weight: 600;
  color: var(--rr-labels-neutral-primary, #101012);
}

.staff-profile-tab-stub__description {
  margin: 0;
  font-size: var(--rr-font-size-font-size-s, 14px);
  line-height: var(--rr-line-height-line-height-s, 20px);
  color: var(--rr-labels-neutral-secondary, rgba(60, 60, 67, 0.72));
}

.staff-profile-tab-stub__hint {
  margin: 8px 0 0;
  font-size: var(--rr-font-size-font-size-s, 14px);
  color: var(--rr-labels-neutral-tertiary, rgba(60, 60, 67, 0.48));
}
</style>
