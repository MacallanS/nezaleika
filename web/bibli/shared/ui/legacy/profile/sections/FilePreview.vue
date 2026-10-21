<template>
  <span class="file-preview clickable" @click="handleClick">
    <template v-if="fileType === 'image'">
      <img :src="getFileUrl(file)" class="file-thumb" />
    </template>
    <template v-else-if="fileType === 'pdf'">
      <span class="file-icon">📄 PDF</span>
    </template>
    <template v-else>
      <span class="file-icon">📄</span>
    </template>
  </span>
</template>
<script setup>
import { computed } from 'vue';
const props = defineProps(['file', 'label', 'getFileUrl']);
const emit = defineEmits(['open-modal']);
const fileType = computed(() => {
  if (!props.file) return '';
  const url = props.getFileUrl(props.file);

  if (/\.(jpg|jpeg|png|gif)$/i.test(url)) return 'image';
  if (/\.pdf$/i.test(url)) return 'pdf';

  if (url && !url.includes('.')) {
    return 'image';
  }


  return 'other';
});
function handleClick() {
  emit('open-modal', props.file, props.label);
}
</script>
<style scoped>
.file-preview {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  min-height: 44px;
  max-width: 60px;
  max-height: 60px;
  border-radius: 6px;
  box-shadow: 0 2px 8px var(--russ-shadow-primary-light);
  background: var(--russ-bg-gray-light);
  margin: 0.2rem 0.5rem 0.2rem 0;
  cursor: pointer;
  transition: transform 0.18s;
}

.file-preview.clickable:hover {
  box-shadow: 0 4px 16px var(--russ-shadow-primary);
}

.file-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 5px;
}

.file-icon {
  font-size: 1.2rem;
  color: var(--russ-accent);
  font-weight: 600;
  padding: 0 0.3rem;
}
</style>