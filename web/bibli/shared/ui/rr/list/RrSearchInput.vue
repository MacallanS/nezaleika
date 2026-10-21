<template>
  <div
    class="rr-search-input"
    :style="{ '--rr-search-input-icon-size': normalizedIconSize }"
  >
    <span class="rr-search-input__icon">
      <RrSearchIcon :size="iconSize" />
    </span>
    <input
      v-model="searchQuery"
      class="rr-search-input__field"
      type="search"
      inputmode="search"
      enterkeyhint="search"
      autocomplete="off"
      :placeholder="placeholder"
      @input="handleSearch"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import RrSearchIcon from './RrSearchIcon.vue'

const props = withDefaults(defineProps<{
  placeholder?: string
  modelValue?: string
  iconSize?: number | string
}>(), {
  placeholder: 'Поиск',
  modelValue: '',
  iconSize: 24,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  search: [value: string]
}>()

const searchQuery = ref(props.modelValue)

const normalizedIconSize = computed(() => {
  const size = props.iconSize
  return typeof size === 'number' ? `${size}px` : size
})

watch(() => props.modelValue, (value) => {
  searchQuery.value = value
})

watch(searchQuery, (value) => {
  emit('update:modelValue', value)
})

function handleSearch() {
  emit('search', searchQuery.value)
}
</script>

<style scoped>
.rr-search-input {
  --rr-search-input-icon-size: 24px;
  --rr-search-input-padding-x: 12px;
  --rr-search-input-icon-gap: 8px;

  display: flex;
  align-items: center;
  gap: var(--rr-search-input-icon-gap);
  flex: 1;
  min-width: 0;
  max-width: 100%;
  min-height: 48px;
  height: 48px;
  padding: 0 var(--rr-search-input-padding-x);
  background: #fff;
  border: 1px solid #e3e6ec;
  border-radius: 12px;
  transition: background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
  overflow: hidden;
  box-sizing: border-box;
}

.rr-search-input:hover {
  background: #f8f9fb;
  border-color: #cdcdd6;
}

.rr-search-input:focus-within {
  background: #fff;
  border-color: #5b7dec;
  box-shadow: 0 0 0 3px rgba(91, 125, 236, 0.22);
}

.rr-search-input__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: var(--rr-search-input-icon-size);
  height: var(--rr-search-input-icon-size);
  pointer-events: none;
  color: #8b919a;
  transition: color 0.2s ease;
}

.rr-search-input:hover .rr-search-input__icon,
.rr-search-input:focus-within .rr-search-input__icon {
  color: #5f6673;
}

.rr-search-input__field {
  box-sizing: border-box;
  flex: 1;
  min-width: 0;
  width: 100%;
  min-height: 0 !important;
  height: auto !important;
  padding: 0 !important;
  border: none;
  border-radius: 0 !important;
  background: transparent;
  font-family: Manrope, system-ui, sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  color: #101012;
  outline: none;
}

.rr-search-input__field::-webkit-search-decoration,
.rr-search-input__field::-webkit-search-cancel-button,
.rr-search-input__field::-webkit-search-results-button,
.rr-search-input__field::-webkit-search-results-decoration {
  -webkit-appearance: none;
  appearance: none;
}

.rr-search-input__field::placeholder {
  color: #8b919a;
  opacity: 1;
  font-weight: 400;
}
</style>
