<template>
  <Teleport to="body">
    <transition name="fade">
      <div v-if="visible" class="photo-modal-overlay" @click.self="$emit('close')">
        <div class="photo-modal-content">
          <button class="photo-modal-close" @click="$emit('close')">×</button>
          <img :src="src" :alt="alt" class="photo-modal-img" />
          <div class="photo-modal-caption">{{ alt }}</div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup lang="ts">
interface Props {
  visible: boolean;
  src: string;
  alt: string;
}

defineProps<Props>();
defineEmits<{
  (e: 'close'): void;
}>();
</script>

<style scoped>
.photo-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--russ-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
}

.photo-modal-content {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  background: var(--russ-bg);
  border-radius: 8px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.photo-modal-close {
  position: absolute;
  top: 10px;
  right: 10px;
  background: var(--russ-overlay-light);
  color: var(--russ-text-inverse);
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  font-size: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.photo-modal-close:hover {
  background: var(--russ-overlay);
}

.photo-modal-img {
  max-width: 100%;
  max-height: 80vh;
  object-fit: contain;
}

.photo-modal-caption {
  margin-top: 10px;
  text-align: center;
  color: var(--russ-text-primary);
  font-size: 14px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
