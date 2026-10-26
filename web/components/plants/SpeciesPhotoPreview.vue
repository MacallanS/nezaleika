<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="species-photo-preview"
      role="dialog"
      aria-modal="true"
      :aria-label="alt || 'Фото'"
      @click.self="close"
    >
      <button type="button" class="species-photo-preview__close" aria-label="Закрыть" @click="close">
        ×
      </button>
      <img class="species-photo-preview__img" :src="src" :alt="alt || ''" @click.stop />
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue?: boolean
    src?: string | null
    alt?: string
  }>(),
  {
    modelValue: false,
    src: null,
    alt: '',
  },
)

const emit = defineEmits<{ 'update:modelValue': [boolean] }>()

const open = computed({
  get: () => Boolean(props.modelValue && props.src),
  set: (v: boolean) => emit('update:modelValue', v),
})

function close() {
  open.value = false
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') close()
}

watch(open, (v) => {
  if (typeof document === 'undefined') return
  if (v) {
    document.addEventListener('keydown', onKey)
    document.documentElement.style.overflow = 'hidden'
  } else {
    document.removeEventListener('keydown', onKey)
    document.documentElement.style.overflow = ''
  }
})

onBeforeUnmount(() => {
  if (typeof document === 'undefined') return
  document.removeEventListener('keydown', onKey)
  document.documentElement.style.overflow = ''
})
</script>

<style scoped>
.species-photo-preview {
  position: fixed;
  inset: 0;
  z-index: 10050;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 48px 16px 24px;
  box-sizing: border-box;
  background: rgba(10, 12, 16, 0.92);
  -webkit-tap-highlight-color: transparent;
}
.species-photo-preview__close {
  position: absolute;
  top: max(12px, env(safe-area-inset-top));
  right: max(12px, env(safe-area-inset-right));
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.14);
  color: #fff;
  font-size: 28px;
  line-height: 1;
  cursor: pointer;
}
.species-photo-preview__img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 12px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.35);
}
</style>
