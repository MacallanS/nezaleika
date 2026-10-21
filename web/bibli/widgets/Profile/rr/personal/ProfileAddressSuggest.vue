<template>
  <div
    ref="rootRef"
    class="profile-address-suggest"
  >
    <!-- Компакт: как select «Кем выдан» — триггер + шторка снизу -->
    <button
      v-if="isCompact"
      type="button"
      class="auth-rr-input__control auth-rr-input__control--align-left profile-address-suggest__trigger"
      :class="{
        'auth-rr-input__control--error': error,
        'profile-address-suggest__trigger--placeholder': !displayValue,
      }"
      :disabled="disabled"
      :aria-invalid="error ? 'true' : undefined"
      :aria-expanded="sheetOpen ? 'true' : 'false'"
      aria-haspopup="dialog"
      @click="openSheet"
    >
      {{ displayValue || placeholder || 'Выберите адрес' }}
    </button>

    <!-- Десктоп: ввод в поле + выпадающий список -->
    <template v-else>
      <input
        ref="inputRef"
        class="auth-rr-input__control auth-rr-input__control--align-left"
        :class="{ 'auth-rr-input__control--error': error }"
        type="text"
        :value="modelValue"
        :placeholder="placeholder"
        :autocomplete="autocomplete"
        :aria-invalid="error ? 'true' : undefined"
        :aria-expanded="dropdownOpen && suggestions.length ? 'true' : 'false'"
        aria-autocomplete="list"
        role="combobox"
        :disabled="disabled"
        @input="onDesktopInput"
        @focus="onDesktopFocus"
        @blur="onDesktopBlur"
        @keydown="onDesktopKeydown"
      />
      <Teleport to="body">
        <div
          v-if="dropdownOpen && suggestions.length"
          ref="listRef"
          class="profile-address-suggest__list rr-select-surface"
          :style="listStyle"
        >
          <RrSelectScroll>
            <ul class="profile-address-suggest__options" role="listbox">
              <li
                v-for="(item, idx) in suggestions"
                :id="`addr-opt-${idx}`"
                :key="`${item.value}-${idx}`"
                class="profile-address-suggest__item"
                :class="{ 'profile-address-suggest__item--active': idx === activeIndex }"
                role="option"
                :aria-selected="idx === activeIndex"
                @mousedown.prevent="selectDesktop(item)"
              >
                <span class="profile-address-suggest__value">{{ item.value }}</span>
                <span
                  v-if="item.region && item.region !== item.value"
                  class="profile-address-suggest__meta"
                >
                  {{ item.region }}
                </span>
              </li>
            </ul>
          </RrSelectScroll>
        </div>
      </Teleport>
    </template>

    <RrBottomSheet
      v-if="isCompact"
      :model-value="sheetOpen"
      placement="sheet"
      height-mode="percent"
      :height-percent="90"
      :title="resolvedSheetTitle"
      @update:model-value="onSheetOpenChange"
      @close="onSheetClose"
    >
      <div class="profile-address-suggest__sheet">
        <div class="profile-address-suggest__search">
          <span class="profile-address-suggest__search-icon" aria-hidden="true">
            <RrSearchIcon :size="20" />
          </span>
          <input
            ref="sheetSearchRef"
            v-model="sheetQuery"
            class="profile-address-suggest__search-input"
            type="search"
            inputmode="search"
            enterkeyhint="search"
            autocomplete="off"
            :placeholder="searchPlaceholder"
            @keydown.enter.prevent="applySheet"
          />
          <button
            v-if="sheetQuery.trim()"
            type="button"
            class="profile-address-suggest__search-clear"
            tabindex="-1"
            aria-label="Очистить"
            @mousedown.prevent
            @click="clearSheetQuery"
          >
            <img :src="authRrIcons.clear" width="24" height="24" alt="" />
          </button>
        </div>

        <RrSelectScroll class="profile-address-suggest__sheet-list">
          <ul class="profile-address-suggest__options" role="listbox">
            <li
              v-for="(item, idx) in suggestions"
              :key="`sheet-${item.value}-${idx}`"
              class="profile-address-suggest__item profile-address-suggest__item--sheet"
              :class="{ 'profile-address-suggest__item--selected': isDraftSelected(item) }"
              role="option"
              :aria-selected="isDraftSelected(item) ? 'true' : 'false'"
              @click="selectDraft(item)"
            >
              <span class="profile-address-suggest__item-text">
                <span class="profile-address-suggest__value">{{ item.value }}</span>
                <span
                  v-if="item.region && item.region !== item.value"
                  class="profile-address-suggest__meta"
                >
                  {{ item.region }}
                </span>
              </span>
              <span
                v-if="isDraftSelected(item)"
                class="profile-address-suggest__check"
                aria-hidden="true"
              >
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
            <li
              v-if="!suggestions.length"
              class="profile-address-suggest__empty"
            >
              {{ sheetListMessage }}
            </li>
          </ul>
        </RrSelectScroll>
      </div>

      <template #footer>
        <AuthRRButton type="button" :label="applyLabel" @click="applySheet" />
      </template>
    </RrBottomSheet>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useProfileApi } from '../../composables/useProfileServices'
import {
  AuthRRButton,
  RrBottomSheet,
  RrSearchIcon,
  RrSelectScroll,
} from 'bibli/shared/ui/rr'
import { authRrIcons } from 'bibli/shared/assets/auth/rr'
import { buildFixedFloatingStyles, computeFloatingPlacement, useCompactViewport } from 'bibli/shared/utils'
import 'bibli/shared/ui/rr/rr-select-surface.css'

const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  autocomplete: { type: String, default: 'off' },
  error: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  mode: {
    type: String,
    default: 'address',
    validator: (v) => v === 'address' || v === 'city',
  },
  minChars: { type: Number, default: 2 },
  sheetTitle: { type: String, default: '' },
  searchPlaceholder: { type: String, default: 'Поиск адреса' },
  applyLabel: { type: String, default: 'Применить' },
})

const emit = defineEmits(['update:modelValue', 'blur', 'select'])

const { suggestAddress } = useProfileApi()
const isCompact = useCompactViewport()

const rootRef = ref(null)
const inputRef = ref(null)
const listRef = ref(null)
const sheetSearchRef = ref(null)

const dropdownOpen = ref(false)
const sheetOpen = ref(false)
const suggestions = ref([])
const activeIndex = ref(-1)
const listStyle = ref({})
const sheetQuery = ref('')
const draftValue = ref('')
const loading = ref(false)

let debounceTimer = null
let reqSeq = 0
let blurTimer = null

const displayValue = computed(() => String(props.modelValue || '').trim())
const resolvedSheetTitle = computed(
  () => props.sheetTitle || props.placeholder || 'Адрес',
)
const sheetListMessage = computed(() => {
  const q = sheetQuery.value.trim()
  if (q.length < props.minChars) {
    return `Введите минимум ${props.minChars} символа`
  }
  return 'Нет совпадений — можно применить введённый адрес'
})

watch(
  () => props.modelValue,
  (val) => {
    if (!String(val || '').trim()) {
      suggestions.value = []
      dropdownOpen.value = false
    }
  },
)

watch(dropdownOpen, (isOpen) => {
  if (isOpen) updatePanelRect()
})

watch(sheetQuery, (q) => {
  if (!sheetOpen.value) return
  if (draftValue.value && q !== draftValue.value) {
    draftValue.value = ''
  }
  scheduleFetch(q)
})

function isDraftSelected(item) {
  return Boolean(item?.value) && item.value === draftValue.value
}

function selectDraft(item) {
  if (!item?.value) return
  draftValue.value = item.value
  sheetQuery.value = item.value
}

function clearSheetQuery() {
  sheetQuery.value = ''
  draftValue.value = ''
  suggestions.value = []
  void nextTick(() => {
    const el = sheetSearchRef.value
    if (!el) return
    try {
      el.focus({ preventScroll: true })
    } catch {
      el.focus()
    }
  })
}

function openSheet() {
  if (props.disabled) return
  // Prefill search with current value so user can edit; do NOT autofocus —
  // mobile keyboard must open only when the user taps the search field.
  sheetQuery.value = displayValue.value
  draftValue.value = displayValue.value
  suggestions.value = []
  sheetOpen.value = true
  if (sheetQuery.value.trim().length >= props.minChars) {
    scheduleFetch(sheetQuery.value)
  }
}

function commitSheetDraft() {
  const fromDraft = String(draftValue.value || '').trim()
  const fromQuery = String(sheetQuery.value || '').trim()
  const next = fromDraft || fromQuery
  if (!next || next === displayValue.value) return
  emit('update:modelValue', next)
  const matched = suggestions.value.find((item) => item.value === next)
  if (matched) emit('select', matched)
}

function onSheetOpenChange(open) {
  sheetOpen.value = open
  if (!open) {
    commitSheetDraft()
    resetSheetState()
  }
}

function onSheetClose() {
  commitSheetDraft()
  resetSheetState()
  emit('blur')
}

function resetSheetState() {
  suggestions.value = []
  activeIndex.value = -1
  clearTimeout(debounceTimer)
  reqSeq += 1
  loading.value = false
}

function applySheet() {
  commitSheetDraft()
  sheetOpen.value = false
  resetSheetState()
  emit('blur')
}

function resolveWidthRect(anchorRect) {
  const input = inputRef.value
  const control =
    input && typeof input.closest === 'function'
      ? input.closest('.staff-copy-field__control')
      : null
  if (control && typeof control.getBoundingClientRect === 'function') {
    return control.getBoundingClientRect()
  }
  const root = rootRef.value
  if (root && typeof root.getBoundingClientRect === 'function') {
    return root.getBoundingClientRect()
  }
  return anchorRect
}

function updatePanelRect() {
  const el = inputRef.value
  if (!el || typeof el.getBoundingClientRect !== 'function') return
  const rect = el.getBoundingClientRect()
  const widthRect = resolveWidthRect(rect)
  const estimatedHeight = Math.min(240, Math.round((window.visualViewport?.height || window.innerHeight) * 0.4))
  const result = computeFloatingPlacement(rect, {
    estimatedHeight,
    maxHeight: estimatedHeight,
    padding: 8,
    widthRect,
  })
  listStyle.value = buildFixedFloatingStyles(rect, result, { zIndex: 10050 })
}

function closeDropdown() {
  dropdownOpen.value = false
  activeIndex.value = -1
}

function onDesktopInput(event) {
  const value = event.target.value
  emit('update:modelValue', value)
  scheduleFetch(value)
}

function onDesktopFocus() {
  updatePanelRect()
  if (suggestions.value.length) dropdownOpen.value = true
  else if (String(props.modelValue || '').trim().length >= props.minChars) {
    scheduleFetch(props.modelValue)
  }
}

function onDesktopBlur() {
  clearTimeout(blurTimer)
  blurTimer = window.setTimeout(() => {
    closeDropdown()
    emit('blur')
  }, 120)
}

function onDesktopKeydown(event) {
  if (!dropdownOpen.value || !suggestions.value.length) {
    if (event.key === 'Escape') closeDropdown()
    return
  }
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    activeIndex.value = Math.min(activeIndex.value + 1, suggestions.value.length - 1)
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    activeIndex.value = Math.max(activeIndex.value - 1, 0)
  } else if (event.key === 'Enter' && activeIndex.value >= 0) {
    event.preventDefault()
    selectDesktop(suggestions.value[activeIndex.value])
  } else if (event.key === 'Escape') {
    closeDropdown()
  }
}

function selectDesktop(item) {
  if (!item) return
  emit('update:modelValue', item.value)
  emit('select', item)
  suggestions.value = []
  closeDropdown()
}

function scheduleFetch(query) {
  clearTimeout(debounceTimer)
  const q = String(query || '').trim()
  if (q.length < props.minChars) {
    suggestions.value = []
    if (!isCompact.value) closeDropdown()
    return
  }
  debounceTimer = setTimeout(() => {
    void fetchSuggestions(q)
  }, 280)
}

async function fetchSuggestions(query) {
  const seq = ++reqSeq
  if (typeof suggestAddress !== 'function') {
    console.warn('[address-suggest] suggestAddress API is not provided')
    return
  }
  loading.value = true
  try {
    const payload = { query, count: 7 }
    if (props.mode === 'city') {
      payload.from_bound = 'city'
      payload.to_bound = 'settlement'
    }
    const res = await suggestAddress(payload)
    if (seq !== reqSeq) return
    suggestions.value = Array.isArray(res?.suggestions) ? res.suggestions : []
    if (isCompact.value) {
      activeIndex.value = suggestions.value.length ? 0 : -1
      return
    }
    updatePanelRect()
    dropdownOpen.value = suggestions.value.length > 0
    activeIndex.value = suggestions.value.length ? 0 : -1
  } catch (err) {
    if (seq !== reqSeq) return
    console.warn('[address-suggest] failed', err)
    suggestions.value = []
    if (!isCompact.value) closeDropdown()
  } finally {
    if (seq === reqSeq) loading.value = false
  }
}

function isEventInsideList(event) {
  const list = listRef.value
  if (!list || !event) return false
  const path = typeof event.composedPath === 'function' ? event.composedPath() : []
  if (path.includes(list)) return true
  const target = event.target
  return target instanceof Node && list.contains(target)
}

function onExternalScroll(event) {
  if (!dropdownOpen.value || isCompact.value) return
  if (isEventInsideList(event)) return
  closeDropdown()
}

function onResize() {
  if (!dropdownOpen.value || isCompact.value) return
  updatePanelRect()
}

watch(isCompact, (compact) => {
  if (compact) {
    closeDropdown()
  } else if (sheetOpen.value) {
    sheetOpen.value = false
    resetSheetState()
  }
})

onMounted(() => {
  window.addEventListener('resize', onResize, { passive: true })
  window.addEventListener('scroll', onExternalScroll, true)
  window.visualViewport?.addEventListener('resize', onResize)
  window.visualViewport?.addEventListener('scroll', onExternalScroll)
})

onBeforeUnmount(() => {
  clearTimeout(debounceTimer)
  clearTimeout(blurTimer)
  reqSeq += 1
  window.removeEventListener('resize', onResize)
  window.removeEventListener('scroll', onExternalScroll, true)
  window.visualViewport?.removeEventListener('resize', onResize)
  window.visualViewport?.removeEventListener('scroll', onExternalScroll)
})
</script>

<style scoped>
.profile-address-suggest {
  position: relative;
  width: 100%;
  min-width: 0;
  max-width: 100%;
}

.profile-address-suggest :deep(.auth-rr-input__control) {
  width: 100%;
  max-width: 100%;
  min-width: 0;
}

.profile-address-suggest__trigger {
  display: block;
  width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: left;
  cursor: pointer;
  background-image: url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%23787880' stroke-width='1.4' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right var(--rr-spacing-padding-l, 12px) center;
  background-size: 12px 8px;
  padding-right: 36px;
}

.profile-address-suggest__trigger--placeholder {
  color: var(--rr-input-text-default, rgba(60, 60, 67, 0.6));
}

.profile-address-suggest__sheet {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  height: 100%;
  gap: 4px;
}

.profile-address-suggest__search {
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: var(--rr-spacing-padding-m, 8px);
  min-height: var(--rr-size-4-xl, 48px);
  padding: 0 var(--rr-spacing-padding-l, 12px);
  border-radius: var(--rr-radius-m, 10px);
  background: var(--rr-backgrounds-quaternary, #f2f3f7);
  color: var(--rr-labels-neutral-secondary, rgba(60, 60, 67, 0.72));
}

.profile-address-suggest__search-icon {
  display: inline-flex;
  flex: 0 0 auto;
  color: #93939c;
}

.profile-address-suggest__search-input {
  flex: 1 1 auto;
  min-width: 0;
  height: var(--rr-size-4-xl, 48px);
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

.profile-address-suggest__search-input::-webkit-search-decoration,
.profile-address-suggest__search-input::-webkit-search-cancel-button,
.profile-address-suggest__search-input::-webkit-search-results-button,
.profile-address-suggest__search-input::-webkit-search-results-decoration {
  display: none;
  -webkit-appearance: none;
  appearance: none;
}

.profile-address-suggest__search-input::placeholder {
  color: var(--rr-labels-neutral-secondary, rgba(60, 60, 67, 0.72));
}

.profile-address-suggest__search-clear {
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

.profile-address-suggest__search-clear:hover,
.profile-address-suggest__search-clear:focus,
.profile-address-suggest__search-clear:focus-visible,
.profile-address-suggest__search-clear:active {
  border: none;
  outline: none;
  box-shadow: none;
  background: transparent;
  opacity: 0.85;
}

.profile-address-suggest__search-clear img {
  display: block;
  width: 24px;
  height: 24px;
}

.profile-address-suggest__sheet-list {
  flex: 1 1 auto;
  min-height: 72px;
}
</style>

<style>
.profile-address-suggest__list {
  position: fixed;
  z-index: 10050;
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 6px;
  max-height: min(240px, 40vh);
  overflow: hidden;
  overscroll-behavior: contain;
  touch-action: pan-y;
  border-radius: var(--rr-radius-m, 10px);
  background: var(--rr-backgrounds-primary, #fff);
  box-sizing: border-box;
}

.profile-address-suggest__list .rr-select-scroll {
  flex: 1 1 auto;
  min-height: 0;
}

.profile-address-suggest__options {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.profile-address-suggest__item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
}

.profile-address-suggest__item--sheet {
  flex-direction: row;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--rr-spacing-padding-l, 12px);
  padding: 12px 14px;
  border-radius: var(--rr-radius-m, 10px);
}

.profile-address-suggest__item--active,
.profile-address-suggest__item:hover,
.profile-address-suggest__item--selected {
  background: var(--rr-backgrounds-quaternary, #f2f3f7);
}

.profile-address-suggest__item-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1 1 auto;
}

.profile-address-suggest__value {
  font-size: var(--rr-font-size-font-size-s, 14px);
  line-height: 20px;
  color: var(--rr-labels-neutral-primary, #101012);
  overflow-wrap: anywhere;
}

.profile-address-suggest__item--sheet .profile-address-suggest__value {
  font-size: var(--rr-font-size-font-size-m, 16px);
  line-height: var(--rr-line-height-line-height-m, 22px);
}

.profile-address-suggest__meta {
  font-size: var(--rr-font-size-font-size-xs, 12px);
  line-height: 16px;
  color: var(--rr-labels-neutral-secondary, rgba(60, 60, 67, 0.72));
  overflow-wrap: anywhere;
}

.profile-address-suggest__check {
  flex: 0 0 auto;
  display: inline-flex;
  margin-top: 2px;
  color: var(--rr-labels-neutral-primary, #101012);
}

.profile-address-suggest__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  min-height: 72px;
  padding: 16px 8px;
  text-align: center;
  color: var(--rr-labels-neutral-secondary, rgba(60, 60, 67, 0.72));
  font-size: var(--rr-font-size-font-size-s, 14px);
}
</style>
