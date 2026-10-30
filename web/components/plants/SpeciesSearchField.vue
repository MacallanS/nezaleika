<template>
  <AuthRRField :label="label" :error="error">
    <button
      type="button"
      class="species-field"
      :class="{ 'species-field--open': open, 'species-field--filled': !!selected }"
      :aria-expanded="open ? 'true' : 'false'"
      aria-haspopup="listbox"
      @click="open = true"
    >
      <span
        v-if="selected"
        class="species-field__thumb"
        :style="{ backgroundImage: `url(${speciesThumb(selected)})` }"
        aria-hidden="true"
      />
      <span v-if="selected" class="species-field__value">
        <strong>{{ selected.name_ru }}</strong>
        <span v-if="selected.name_lat">{{ selected.name_lat }}</span>
      </span>
      <span v-else class="species-field__placeholder">{{ placeholder }}</span>
      <span class="species-field__chev" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path
            d="M7 10l5 5 5-5"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </span>
    </button>
  </AuthRRField>

  <RrBottomSheet
    v-model="open"
    title="Вид растения"
    placement="sheet"
    height-mode="percent"
    :height-percent="90"
  >
    <div class="species-sheet">
      <div class="species-sheet__search">
        <span class="species-sheet__search-icon" aria-hidden="true">
          <RrSearchIcon :size="20" />
        </span>
        <input
          ref="searchInputRef"
          v-model="query"
          class="species-sheet__input"
          type="search"
          inputmode="search"
          enterkeyhint="search"
          autocomplete="off"
          placeholder="Монстера, фикус…"
          @input="onQueryInput"
        />
        <button
          v-if="query.trim()"
          type="button"
          class="species-sheet__clear"
          tabindex="-1"
          aria-label="Очистить"
          @mousedown.prevent
          @click="clearQuery"
        >
          <img :src="authRrIcons.clear" width="24" height="24" alt="" />
        </button>
      </div>

      <RrSelectScroll class="species-sheet__list">
        <ul class="species-sheet__options" role="listbox">
          <li
            v-for="s in results"
            :key="s.id"
            class="species-sheet__item"
            :class="{ 'species-sheet__item--selected': draftId === s.id }"
            role="option"
            :aria-selected="draftId === s.id ? 'true' : 'false'"
            @click="draftId = s.id"
          >
            <button
              type="button"
              class="species-sheet__thumb"
              :style="{ backgroundImage: `url(${speciesThumb(s)})` }"
              :aria-label="`Посмотреть ${s.name_ru}`"
              @click.stop="openPreview(s)"
            />
            <span class="species-sheet__label">
              <strong>{{ s.name_ru }}</strong>
              <span v-if="s.name_lat">{{ s.name_lat }}</span>
            </span>
            <span v-if="draftId === s.id" class="species-sheet__check" aria-hidden="true">
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
          <li v-if="!results.length" class="species-sheet__empty">{{ emptyHint }}</li>
        </ul>
      </RrSelectScroll>
    </div>

    <template #footer>
      <AuthRRButton type="button" label="Выбрать" :disabled="draftId == null" @click="apply" />
    </template>
  </RrBottomSheet>

  <SpeciesPhotoPreview v-model="previewOpen" :src="previewSrc" :alt="previewAlt" />
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { authRrIcons } from 'bibli/shared/assets/auth/rr'
import { AuthRRButton, AuthRRField, RrBottomSheet, RrSearchIcon, RrSelectScroll } from 'bibli/shared/ui/rr'
import SpeciesPhotoPreview from '~/components/plants/SpeciesPhotoPreview.vue'
import { ensureAuth, getApi } from '~/utils/api'
import { resolveSpeciesImage } from '~/utils/plantIllustrations'

export interface SpeciesOption {
  id: number
  name_ru: string
  name_lat: string
  category?: string
  image_url?: string | null
}

const props = withDefaults(
  defineProps<{
    modelValue?: SpeciesOption | null
    label?: string
    placeholder?: string
    error?: string
  }>(),
  {
    modelValue: null,
    label: 'Вид растения',
    placeholder: 'Начните вводить название…',
    error: '',
  },
)

const emit = defineEmits<{ 'update:modelValue': [SpeciesOption | null] }>()

const open = ref(false)
const query = ref('')
const results = ref<SpeciesOption[]>([])
const draftId = ref<number | null>(null)
const searching = ref(false)
const searchInputRef = ref<HTMLInputElement | null>(null)
const previewOpen = ref(false)
const previewSrc = ref<string | null>(null)
const previewAlt = ref('')

const selected = computed(() => props.modelValue)

const emptyHint = computed(() => {
  const q = query.value.trim()
  if (q.length < 2) return 'Введите минимум 2 буквы'
  if (searching.value) return 'Ищем…'
  return 'Ничего не найдено'
})

let searchSeq = 0
let searchTimer: ReturnType<typeof setTimeout> | undefined

function speciesThumb(s: Pick<SpeciesOption, 'image_url' | 'category'>) {
  return resolveSpeciesImage(s.image_url, s.category)
}

function openPreview(s: SpeciesOption) {
  previewSrc.value = speciesThumb(s)
  previewAlt.value = s.name_ru
  previewOpen.value = true
}

watch(open, (v) => {
  if (!v) return
  draftId.value = props.modelValue?.id ?? null
  query.value = ''
  results.value = props.modelValue ? [props.modelValue] : []
})

function clearQuery() {
  query.value = ''
  results.value = props.modelValue ? [props.modelValue] : []
  void nextTick(() => searchInputRef.value?.focus())
}

function onQueryInput() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(runSearch, 250)
}

async function runSearch() {
  const q = query.value.trim()
  const seq = ++searchSeq
  if (q.length < 2) {
    results.value = props.modelValue && draftId.value === props.modelValue.id ? [props.modelValue] : []
    searching.value = false
    return
  }
  searching.value = true
  try {
    await ensureAuth()
    const { data } = await getApi().get<SpeciesOption[] | { results?: SpeciesOption[] }>('/api/species', {
      params: { q },
    })
    if (seq !== searchSeq) return
    results.value = Array.isArray(data) ? data : (data.results ?? [])
  } catch {
    if (seq === searchSeq) results.value = []
  } finally {
    if (seq === searchSeq) searching.value = false
  }
}

function apply() {
  const picked = results.value.find((s) => s.id === draftId.value) ?? null
  emit('update:modelValue', picked)
  open.value = false
}

onBeforeUnmount(() => {
  clearTimeout(searchTimer)
})
</script>

<style scoped>
.species-field {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 48px;
  height: var(--auth-rr-control-h, var(--rr-size-3-xl, 48px));
  padding: 0 12px 0 14px;
  border-radius: var(--rr-radius-l, 12px);
  border: 1px solid #dedee3;
  background: var(--rr-backgrounds-quaternary, #f2f3f7);
  box-shadow: none;
  font: inherit;
  text-align: left;
  cursor: pointer;
  box-sizing: border-box;
  color: var(--rr-labels-neutral-primary, #101012);
}
.species-field--open,
.species-field:focus-visible {
  outline: 2px solid rgba(46, 125, 50, 0.35);
  outline-offset: 1px;
}
.species-field__thumb {
  flex: 0 0 auto;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: #e8f0ea center / cover no-repeat;
}
.species-field__value {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.species-field__value strong {
  font-size: 15px;
  font-weight: 650;
  color: var(--rr-labels-neutral-primary, #101012);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.species-field__value span {
  font-size: 12px;
  color: var(--rr-labels-neutral-secondary, rgba(60, 60, 67, 0.72));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.species-field__placeholder {
  flex: 1;
  color: var(--rr-labels-neutral-secondary, rgba(60, 60, 67, 0.55));
  font-size: 15px;
}
.species-field__chev {
  flex: 0 0 auto;
  color: #9aa5ad;
  display: inline-flex;
}
.species-sheet {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1 1 auto;
  min-height: 0;
  height: 100%;
}
.species-sheet__search {
  position: sticky;
  top: 0;
  z-index: 1;
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 8px;
  box-sizing: border-box;
  height: 48px;
  min-height: 48px;
  max-height: 48px;
  padding: 0 12px;
  border-radius: 12px;
  border: 1px solid var(--rr-color-border-subtle, #dedee3);
  background: var(--rr-backgrounds-quaternary, #f2f3f7);
  color: var(--rr-labels-neutral-secondary, rgba(60, 60, 67, 0.72));
}
.species-sheet__search-icon {
  display: inline-flex;
  flex: 0 0 auto;
  color: #93939c;
}
.species-sheet__input {
  flex: 1 1 auto;
  min-width: 0;
  box-sizing: border-box;
  height: 100%;
  margin: 0;
  padding: 0;
  border: none;
  background: transparent;
  font: inherit;
  /* ≥16px: иначе iOS Safari зумит страницу при фокусе */
  font-size: 16px;
  color: var(--rr-labels-neutral-primary, #101012);
  outline: none;
  -webkit-appearance: none;
  appearance: none;
}
.species-sheet__input::-webkit-search-decoration,
.species-sheet__input::-webkit-search-cancel-button,
.species-sheet__input::-webkit-search-results-button,
.species-sheet__input::-webkit-search-results-decoration {
  -webkit-appearance: none;
  appearance: none;
}
.species-sheet__clear {
  flex: 0 0 auto;
  border: none;
  background: transparent;
  padding: 4px;
  cursor: pointer;
  display: inline-flex;
}
.species-sheet__list {
  flex: 1 1 auto;
  min-height: 0;
  max-height: none;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
}
.species-sheet__options {
  list-style: none;
  margin: 0;
  padding: 0;
}
.species-sheet__item {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 52px;
  padding: 10px 4px;
  border-bottom: 1px solid var(--rr-color-border-subtle, #eee);
  cursor: pointer;
}
.species-sheet__thumb {
  flex: 0 0 auto;
  width: 40px;
  height: 40px;
  padding: 0;
  border: none;
  border-radius: 10px;
  background: #e8f0ea center / cover no-repeat;
  cursor: zoom-in;
}
.species-sheet__item--selected {
  background: rgba(46, 125, 50, 0.06);
}
.species-sheet__label {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.species-sheet__label strong {
  font-size: 15px;
  font-weight: 650;
}
.species-sheet__label span {
  font-size: 12px;
  color: var(--rr-labels-neutral-secondary, rgba(60, 60, 67, 0.72));
}
.species-sheet__check {
  color: #2e7d32;
  flex: 0 0 auto;
}
.species-sheet__empty {
  padding: 28px 8px;
  text-align: center;
  color: #7b868c;
  font-size: 14px;
}
</style>
