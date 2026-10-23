<template>
  <component
    :is="clickable ? 'button' : 'span'"
    :type="clickable ? 'button' : undefined"
    class="plant-thumb"
    :class="{ 'plant-thumb--photo': !!photoUrl, 'plant-thumb--static': !clickable }"
    :style="thumbStyle"
    :aria-label="clickable ? ariaLabel : undefined"
    :aria-hidden="clickable ? undefined : true"
    @click="clickable ? $emit('click') : undefined"
  />
</template>

<script setup lang="ts">
import { illustrationForCategory } from '~/utils/plantIllustrations'

const props = withDefaults(
  defineProps<{
    photoUrl?: string | null
    category?: string | null
    name?: string
    clickable?: boolean
  }>(),
  { photoUrl: null, category: 'other', name: 'Растение', clickable: false },
)

defineEmits<{ click: [] }>()

const ariaLabel = computed(() => `Карточка: ${props.name}`)

const thumbStyle = computed(() => {
  if (props.photoUrl) return { backgroundImage: `url(${props.photoUrl})` }
  return { backgroundImage: `url(${illustrationForCategory(props.category)})` }
})
</script>

<style scoped>
.plant-thumb {
  display: block;
  padding: 0;
  border: none;
  border-radius: 10px;
  background: #e8f0ea center / cover no-repeat;
  -webkit-tap-highlight-color: transparent;
}
.plant-thumb:not(.plant-thumb--static) {
  cursor: pointer;
}
.plant-thumb:not(.plant-thumb--static):active {
  transform: scale(0.96);
}
.plant-thumb--photo {
  background-color: #c8e6c9;
}
</style>
