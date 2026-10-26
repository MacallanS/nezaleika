<template>
  <p v-if="show" class="nz-waking" role="status">Сервер просыпается… обычно до минуты на бесплатном хосте</p>
</template>

<script setup lang="ts">
defineProps<{ show: boolean }>()
</script>

<style scoped>
.nz-waking {
  margin: 0 0 12px;
  padding: 10px 12px;
  border-radius: 12px;
  background: #e8f5e9;
  color: #1b5e20;
  font-size: 13px;
  font-weight: 600;
  line-height: 18px;
  text-align: center;
}
</style>
