<script setup lang="ts">
const props = defineProps<{
  columnKey: string
  activeKey?: string | null
  direction?: 'asc' | 'desc' | null
}>()

const isActive = () => props.activeKey === props.columnKey && !!props.direction

const showUp = () => !isActive() || props.direction === 'asc'
const showDown = () => !isActive() || props.direction === 'desc'
</script>

<template>
  <span class="rr-column-sort-icon" aria-hidden="true">
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        v-if="showUp()"
        class="rr-column-sort-icon__arrow rr-column-sort-icon__arrow--up"
        :class="{ 'rr-column-sort-icon__arrow--active': isActive() && direction === 'asc' }"
        d="M13.3327 4.66406L11.3327 2.66406L9.33268 4.66406M11.3327 2.66406L11.3327 13.3307"
        stroke="currentColor"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        v-if="showDown()"
        class="rr-column-sort-icon__arrow rr-column-sort-icon__arrow--down"
        :class="{ 'rr-column-sort-icon__arrow--active': isActive() && direction === 'desc' }"
        d="M2.66602 11.3307L4.66602 13.3307L6.66602 11.3307M4.66602 13.3307L4.66602 2.66406"
        stroke="currentColor"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  </span>
</template>

<style scoped>
.rr-column-sort-icon {
  display: inline-flex;
  flex-shrink: 0;
  color: #777;
}

.rr-column-sort-icon__arrow--active {
  color: #101012;
}

.rr-column-sort-icon__arrow:not(.rr-column-sort-icon__arrow--active) {
  color: inherit;
}
</style>
