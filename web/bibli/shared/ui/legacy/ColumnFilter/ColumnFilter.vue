<template>
    <div class="column-filter">
        <div class="filter-header">
            <span class="filter-label">{{ label }}</span>
            <button v-if="hasActiveFilter" class="clear-filter-btn" @click="clearFilter" title="Очистить фильтр">
                <i class="pi pi-times"></i>
            </button>
        </div>
        <div class="filter-content">
            <input v-model="filterValue" class="filter-input" type="text" :placeholder="placeholder"
                @input="handleFilterChange" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'

interface Props {
    label: string
    placeholder?: string
    modelValue?: string
}

interface Emits {
    (e: 'update:modelValue', value: string): void
    (e: 'filter', value: string): void
}

const props = withDefaults(defineProps<Props>(), {
    placeholder: 'Фильтр...',
    modelValue: ''
})

const emit = defineEmits<Emits>()

const filterValue = ref(props.modelValue)

const hasActiveFilter = computed(() => {
    return filterValue.value.trim().length > 0
})

watch(() => props.modelValue, (newValue) => {
    filterValue.value = newValue
})

watch(filterValue, (newValue) => {
    emit('update:modelValue', newValue)
})

const handleFilterChange = () => {
    emit('filter', filterValue.value)
}

const clearFilter = () => {
    filterValue.value = ''
    emit('filter', '')
}
</script>

<style scoped>
.column-filter {
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 120px;
}

.filter-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
}

.filter-label {
    font-size: 12px;
    font-weight: 600;
    color: var(--russ-neutral-dark);
    white-space: nowrap;
}

.clear-filter-btn {
    background: none;
    border: none;
    color: var(--russ-input-error);
    cursor: pointer;
    padding: 2px;
    border-radius: 4px;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
}

.clear-filter-btn:hover {
    background: var(--russ-error-light);
    color: var(--russ-error);
}

.filter-content {
    width: 100%;
}

.filter-input {
    width: 100%;
    padding: 6px 8px;
    border: 1px solid var(--russ-border);
    border-radius: 6px;
    font-size: 12px;
    color: var(--russ-text-secondary);
    background: var(--russ-bg);
    transition: all 0.2s ease;
}

.filter-input:focus {
    outline: none;
    border-color: var(--russ-input-border-focus);
    box-shadow: 0 0 0 2px var(--russ-shadow-accent-light);
}

.filter-input::placeholder {
    color: var(--russ-text-quaternary);
    font-size: 11px;
}

@media (max-width: 768px) {
    .column-filter {
        min-width: 100px;
    }

    .filter-label {
        font-size: 11px;
    }

    .filter-input {
        font-size: 11px;
        padding: 5px 6px;
    }
}
</style>
