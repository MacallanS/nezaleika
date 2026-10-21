<template>
  <form v-bind="$attrs" class="p-form" @submit.prevent="$emit('submit', $event)">
    <slot />
  </form>
</template>

<script setup lang="ts">
defineEmits<{ (e: 'submit', ev: Event): void }>()
</script>

<style scoped>
.p-form {
  display: block;
}
</style>
