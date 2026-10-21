<template>
  <div class="search-wrapper" :class="{ 'search-wrapper--block': block }">
    <span class="search-icon" aria-hidden="true">
      <img class="search-icon__img" :src="iconSearch" alt="" width="24" height="24" />
    </span>
    <input v-model="searchQuery" class="search-input" type="text" :placeholder="placeholder" @input="handleSearch" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import iconSearch from './search.svg';

interface Props {
  placeholder?: string;
  modelValue?: string;
  /** Растянуть на всю ширину родителя (toolbar / grid cell). */
  block?: boolean;
}

interface Emits {
  (e: 'update:modelValue', value: string): void;
  (e: 'search', value: string): void;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Поиск',
  modelValue: '',
  block: false,
});

const emit = defineEmits<Emits>();

const searchQuery = ref(props.modelValue);

watch(() => props.modelValue, (newValue) => {
  searchQuery.value = newValue;
});

watch(searchQuery, (newValue) => {
  emit('update:modelValue', newValue);
});

const handleSearch = () => {
  emit('search', searchQuery.value);
};
</script>

<style scoped>
/* На фоне приложения (#F2F3F7) поле должно быть белым и плотным, иначе «прозрачное». */
.search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1 1 0%;
  width: 100%;
  min-width: 0;
  max-width: none;
  height: 48px;
  min-height: 48px;
  padding: 0 16px 0 12px;
  background: #ffffff;
  border: 1px solid #e7e8ee;
  border-radius: 12px;
  box-sizing: border-box;
  transition: background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
  overflow: hidden;
}

.search-wrapper--block {
  flex: 1 1 0%;
  width: 100%;
  min-width: 0;
  max-width: none;
}

.search-wrapper:hover {
  background: #f8f9fb;
  border-color: #cdcdd6;
}

.search-wrapper:focus-within {
  background: #ffffff;
  border-color: #5b7dec;
  box-shadow: 0 0 0 3px rgba(91, 125, 236, 0.22);
}

.search-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  line-height: 0;
  pointer-events: none;
}

.search-icon__img {
  display: block;
  width: 24px;
  height: 24px;
}

.search-input {
  box-sizing: border-box;
  flex: 1;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  background: transparent;
  border: none;
  border-radius: 0;
  min-height: 0;
  height: 100%;
  padding: 0 !important;
  font-family: Manrope, system-ui, sans-serif;
  font-size: clamp(14px, calc(14px + (18 - 14) * ((100vw - 320px) / (1920 - 320))), 18px);
  line-height: 24px;
  color: #101012;
  outline: none;
}

.search-input::placeholder {
  color: rgba(60, 60, 67, 0.52);
  opacity: 1;
  font-weight: 500;
}
</style>
