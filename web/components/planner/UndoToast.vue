<template>
  <Transition name="nz-undo">
    <div v-if="undo" class="nz-undo" role="status">
      <span class="nz-undo__label">{{ undo.label }}</span>
      <button type="button" class="nz-undo__btn" @click="undoLast">Отменить</button>
    </div>
  </Transition>
</template>

<script setup lang="ts">
const undo = useUndoState()
const { undoLast } = useWateringActions()
</script>

<style scoped>
.nz-undo {
  position: fixed;
  left: 50%;
  bottom: calc(76px + env(safe-area-inset-bottom, 0px) + 12px);
  z-index: 1100;
  display: flex;
  align-items: center;
  gap: 12px;
  width: min(420px, calc(100vw - 24px));
  transform: translateX(-50%);
  padding: 12px 12px 12px 16px;
  border-radius: 14px;
  background: #101012;
  color: #fff;
  box-shadow: 0 12px 32px rgba(16, 16, 18, 0.28);
  font-size: 15px;
}
@media (min-width: 1025px) {
  .nz-undo {
    bottom: 24px;
  }
}
.nz-undo__label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.nz-undo__btn {
  border: none;
  background: none;
  color: #81c784;
  font: inherit;
  font-weight: 700;
  padding: 6px 8px;
  cursor: pointer;
}
.nz-undo-enter-active,
.nz-undo-leave-active {
  transition: transform 0.22s ease, opacity 0.22s ease;
}
.nz-undo-enter-from,
.nz-undo-leave-to {
  transform: translateY(16px);
  opacity: 0;
}
</style>
