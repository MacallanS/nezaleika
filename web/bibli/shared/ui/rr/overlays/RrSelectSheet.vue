<template>
  <RrBottomSheet
    :model-value="open"
    placement="sheet"
    height-mode="fit"
    :height-percent="90"
    :title="title"
    :title-id="titleId"
    :z-index="zIndex"
    @update:model-value="onOpenChange"
    @close="onSheetClose"
  >
    <div class="profile-select-sheet">
      <div v-if="searchable" class="profile-select-sheet__search">
        <span class="profile-select-sheet__search-icon" aria-hidden="true">
          <RrSearchIcon :size="20" />
        </span>
        <input
          ref="searchInputRef"
          v-model="query"
          class="profile-select-sheet__search-input"
          type="search"
          inputmode="search"
          enterkeyhint="search"
          autocomplete="off"
          :placeholder="searchPlaceholder"
          @keydown.enter.prevent
        />
        <button
          v-if="query.trim()"
          type="button"
          class="profile-select-sheet__search-clear"
          tabindex="-1"
          aria-label="Очистить"
          @mousedown.prevent
          @click="clearQuery"
        >
          <img :src="authRrIcons.clear" width="24" height="24" alt="" />
        </button>
      </div>

      <RrSelectScroll class="profile-select-sheet__list">
        <ul class="profile-select-sheet__options" role="listbox" :aria-multiselectable="multiple ? 'true' : 'false'">
      <li
        v-for="(option, idx) in filteredOptions"
        :key="`${optionKey(option)}-${idx}`"
        class="profile-select-sheet__item"
        :class="{ 'profile-select-sheet__item--selected': isDraftSelected(option) }"
        role="option"
        :aria-selected="isDraftSelected(option) ? 'true' : 'false'"
        @click="toggleDraft(option)"
      >
        <span class="profile-select-sheet__label">{{ getLabel(option) }}</span>
        <span v-if="isDraftSelected(option)" class="profile-select-sheet__check" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M20 6L9 17l-5-5"
              stroke="currentColor"
              stroke-width="2.2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </span>
      </li>
      <li v-if="filteredOptions.length === 0" class="profile-select-sheet__empty">
        Нет совпадений
      </li>
        </ul>
      </RrSelectScroll>
    </div>

    <template #footer>
      <AuthRRButton type="button" :label="applyLabel" @click="apply" />
    </template>
  </RrBottomSheet>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { authRrIcons } from 'bibli/shared/assets/auth/rr'
import AuthRRButton from '../form/AuthRRButton.vue'
import RrSearchIcon from '../list/RrSearchIcon.vue'
import RrSelectScroll from '../list/RrSelectScroll.vue'
import { FLOATING_LAYER_Z_INDEX } from 'bibli/shared/utils/layerZIndex'
import RrBottomSheet from './RrBottomSheet.vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: '' },
  titleId: { type: String, default: '' },
  options: { type: Array, default: () => [] },
  modelValue: { type: [String, Number, Array, Boolean], default: null },
  multiple: { type: Boolean, default: false },
  searchable: { type: Boolean, default: true },
  optionLabel: { type: String, default: 'name' },
  optionValue: { type: String, default: 'id' },
  applyLabel: { type: String, default: 'Применить' },
  searchPlaceholder: { type: String, default: 'Поиск по названию' },
  zIndex: { type: [Number, String], default: FLOATING_LAYER_Z_INDEX },
})

const emit = defineEmits(['update:open', 'update:modelValue', 'apply', 'close'])

const query = ref('')
const draft = ref(null)
const searchInputRef = ref(null)
/** Prevents double commit when Apply closes the sheet and then `close` fires. */
let committed = false

function getLabel(option) {
  if (option == null) return ''
  return typeof option === 'object' ? String(option[props.optionLabel] ?? '') : String(option)
}

function getValue(option) {
  if (option == null) return option
  return typeof option === 'object' ? option[props.optionValue] : option
}

function optionKey(option) {
  const value = getValue(option)
  return value == null ? getLabel(option) : String(value)
}

function isSameValue(a, b) {
  if (a == null && b == null) return true
  return String(a) === String(b)
}

function cloneValue(value) {
  if (props.multiple) {
    if (!value) return []
    return Array.isArray(value) ? [...value] : [value]
  }
  return value
}

function isDraftSelected(option) {
  const value = getValue(option)
  if (props.multiple) {
    const current = Array.isArray(draft.value) ? draft.value : []
    return current.some((selected) => isSameValue(selected, value))
  }
  return isSameValue(draft.value, value)
}

function toggleDraft(option) {
  const value = getValue(option)
  if (props.multiple) {
    const current = Array.isArray(draft.value) ? [...draft.value] : []
    const index = current.findIndex((selected) => isSameValue(selected, value))
    if (index > -1) current.splice(index, 1)
    else current.push(value)
    draft.value = current
    return
  }
  draft.value = value
}

const filteredOptions = computed(() => {
  const list = Array.isArray(props.options) ? props.options : []
  const q = query.value.trim().toLowerCase().replace(/ё/g, 'е')
  if (!q) return list
  return list.filter((option) => {
    const label = getLabel(option).toLowerCase().replace(/ё/g, 'е')
    const value = String(getValue(option) ?? '').toLowerCase()
    return label.includes(q) || value.includes(q)
  })
})

function resetDraft() {
  draft.value = cloneValue(props.modelValue)
  query.value = ''
}

function clearQuery() {
  query.value = ''
  void nextTick(() => {
    const el = searchInputRef.value
    if (!el) return
    try {
      el.focus({ preventScroll: true })
    } catch {
      el.focus()
    }
  })
}

function commitDraft() {
  if (committed) return
  committed = true
  const next = cloneValue(draft.value)
  emit('update:modelValue', next)
  emit('apply', next)
}

function onOpenChange(next) {
  emit('update:open', next)
}

function onSheetClose() {
  // Swipe / backdrop / X: keep the draft selection instead of discarding it.
  commitDraft()
  query.value = ''
  emit('close')
}

function apply() {
  commitDraft()
  emit('update:open', false)
}

watch(
  () => props.open,
  (open) => {
    if (open) {
      committed = false
      resetDraft()
    }
  },
)

watch(
  () => props.modelValue,
  () => {
    if (props.open && !committed) resetDraft()
  },
)
</script>

<style scoped>
.profile-select-sheet {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.profile-select-sheet__search {
  position: sticky;
  top: 0;
  z-index: 1;
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: var(--rr-spacing-padding-m, 8px);
  /* Keep 48px on desktop too — --rr-size-4-xl jumps to 64px there */
  box-sizing: border-box;
  height: 48px;
  min-height: 48px;
  max-height: 48px;
  padding: 0 var(--rr-spacing-padding-l, 12px);
  border-radius: var(--rr-radius-m, 10px);
  background: var(--rr-backgrounds-quaternary, #f2f3f7);
  color: var(--rr-labels-neutral-secondary, rgba(60, 60, 67, 0.72));
}

.profile-select-sheet__search-icon {
  display: inline-flex;
  flex: 0 0 auto;
  color: #93939c;
}

.profile-select-sheet__search-input {
  flex: 1 1 auto;
  min-width: 0;
  box-sizing: border-box;
  height: 100%;
  min-height: 0;
  margin: 0;
  padding: 0;
  border: none;
  background: transparent;
  font-family: var(--rr-font-family-font-family, Manrope, system-ui, sans-serif);
  font-size: var(--rr-font-size-font-size-m, 16px);
  line-height: var(--rr-line-height-line-height-m, 22px);
  color: var(--rr-labels-neutral-primary, #101012);
  outline: none;
  /* Hide native search clear — custom button uses auth clear.svg */
  -webkit-appearance: none;
  appearance: none;
}

.profile-select-sheet__search-input::-webkit-search-decoration,
.profile-select-sheet__search-input::-webkit-search-cancel-button,
.profile-select-sheet__search-input::-webkit-search-results-button,
.profile-select-sheet__search-input::-webkit-search-results-decoration {
  display: none;
  -webkit-appearance: none;
  appearance: none;
}

.profile-select-sheet__search-input::placeholder {
  color: var(--rr-labels-neutral-secondary, rgba(60, 60, 67, 0.72));
}

.profile-select-sheet__search-clear {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  margin: 0;
  padding: 0;
  border: none;
  border-radius: var(--rr-radius-xs, 4px);
  background: transparent;
  color: var(--rr-input-text-default, rgba(60, 60, 67, 0.6));
  cursor: pointer;
}

.profile-select-sheet__search-clear:hover,
.profile-select-sheet__search-clear:focus,
.profile-select-sheet__search-clear:focus-visible,
.profile-select-sheet__search-clear:active {
  border: none;
  outline: none;
  box-shadow: none;
  background: transparent;
  opacity: 0.85;
}

.profile-select-sheet__search-clear img {
  display: block;
  width: 24px;
  height: 24px;
}

.profile-select-sheet__list {
  min-height: 0;
}

.profile-select-sheet__options {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.profile-select-sheet__item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--rr-spacing-padding-l, 12px);
  padding: 12px 14px;
  border-radius: var(--rr-radius-m, 10px);
  cursor: pointer;
  color: var(--rr-labels-neutral-primary, #101012);
}

.profile-select-sheet__item--selected {
  background: var(--rr-backgrounds-quaternary, #f2f3f7);
}

.profile-select-sheet__label {
  flex: 1 1 auto;
  min-width: 0;
  font-size: var(--rr-font-size-font-size-m, 16px);
  line-height: var(--rr-line-height-line-height-m, 22px);
  overflow-wrap: anywhere;
}

.profile-select-sheet__check {
  flex: 0 0 auto;
  display: inline-flex;
  margin-top: 2px;
  color: var(--rr-labels-neutral-primary, #101012);
}

.profile-select-sheet__empty {
  padding: 16px 8px;
  text-align: center;
  color: var(--rr-labels-neutral-secondary, rgba(60, 60, 67, 0.72));
  font-size: var(--rr-font-size-font-size-s, 14px);
}
</style>
