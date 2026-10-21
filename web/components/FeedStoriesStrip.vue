<template>
  <div v-if="plants.length" class="stories" role="tablist" aria-label="Срочные растения">
    <button
      v-for="p in plants"
      :key="p.id"
      type="button"
      class="stories__item"
      :class="{ 'stories__item--active': p.id === activeId }"
      role="tab"
      :aria-selected="p.id === activeId"
      @click="$emit('select', p.id)"
    >
      <span
        class="stories__ring"
        :class="{
          'stories__ring--danger': p.status === 'overdue',
          'stories__ring--warn': p.status === 'due_today',
        }"
      >
        <img v-if="p.photo_url" :src="p.photo_url" alt="" class="stories__img" />
        <span v-else class="stories__placeholder">{{ p.name.charAt(0) }}</span>
      </span>
      <span class="stories__name">{{ p.name }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import type { FeedPlant } from '~/stores/plants'

defineProps<{
  plants: FeedPlant[]
  activeId?: number | null
}>()

defineEmits<{ select: [id: number] }>()
</script>

<style scoped>
.stories {
  display: flex;
  gap: 12px;
  padding: 8px 16px 4px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}
.stories::-webkit-scrollbar {
  display: none;
}
.stories__item {
  flex: 0 0 auto;
  width: 64px;
  border: none;
  background: none;
  padding: 0;
  cursor: pointer;
  color: #fff;
  text-align: center;
}
.stories__ring {
  display: block;
  width: 56px;
  height: 56px;
  margin: 0 auto;
  padding: 2px;
  border-radius: 50%;
  background: linear-gradient(135deg, #66bb6a, #2e7d32);
}
.stories__ring--warn {
  background: linear-gradient(135deg, #ffb74d, #f57c00);
}
.stories__ring--danger {
  background: linear-gradient(135deg, #ef5350, #c62828);
}
.stories__img,
.stories__placeholder {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #000;
  box-sizing: border-box;
  background: #1b5e20;
  font-weight: 700;
  font-size: 20px;
  line-height: 52px;
}
.stories__name {
  display: block;
  margin-top: 4px;
  font-size: 10px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
}
.stories__item--active .stories__name {
  color: #a5d6a7;
}
</style>
