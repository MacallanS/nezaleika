<template>
  <section class="staff-notes" aria-label="Заметки">
    <div class="staff-notes__layout">
      <article class="staff-notes-panel staff-notes-panel--comments">
        <h2 class="staff-notes-panel__title">Комментарий</h2>

        <div v-if="loading" class="staff-notes-panel__state staff-notes-panel__state--skeleton">
          <StaffProfileListSkeleton variant="notes" :rows="4" />
        </div>
        <div v-else-if="error" class="staff-notes-panel__state staff-notes-panel__state--error">
          {{ error }}
          <button type="button" class="staff-notes-retry" @click="reload">Повторить</button>
        </div>
        <div v-else-if="!items.length" class="staff-notes-panel__state">Пока нет заметок</div>

        <ul v-else ref="listEl" class="staff-notes-list" role="list">
          <li v-for="item in items" :key="item.id" class="staff-notes-item">
            <span class="staff-notes-item__avatar" aria-hidden="true">
              <img
                v-if="actorAvatarUrl(item) && !brokenAvatarIds.has(item.id)"
                class="staff-notes-item__avatar-img"
                :src="actorAvatarUrl(item)!"
                alt=""
                width="40"
                height="40"
                loading="lazy"
                decoding="async"
                @error="onAvatarError(item.id)"
              />
              <template v-else>{{ item.actor.initials }}</template>
            </span>
            <div class="staff-notes-item__body">
              <div class="staff-notes-item__head">
                <span class="staff-notes-item__name">{{ item.actor.name }}</span>
                <time class="staff-notes-item__time" :datetime="item.created_at">
                  {{ formatTime(item.created_at) }}
                </time>
                <div v-if="canDeleteNote(item)" class="staff-notes-item__actions">
                  <button
                    type="button"
                    class="staff-notes-item__more"
                    aria-label="Ещё"
                    aria-haspopup="menu"
                    :aria-expanded="openNoteMenuId === item.id ? 'true' : 'false'"
                    :disabled="deletingId === item.id"
                    @click.stop="toggleNoteMenu(item.id, $event)"
                  >
                    <img
                      class="staff-notes-item__more-icon"
                      :src="iconMore"
                      alt=""
                      width="20"
                      height="20"
                    />
                  </button>
                  <Teleport to="body">
                    <div
                      v-if="openNoteMenuId === item.id"
                      class="staff-notes-item__menu-backdrop"
                      aria-hidden="true"
                      @pointerdown="closeNoteMenu"
                    />
                    <div
                      v-if="openNoteMenuId === item.id"
                      class="staff-notes-item__menu"
                      role="menu"
                      :style="noteMenuStyle"
                      @pointerdown.stop
                    >
                      <button
                        type="button"
                        class="staff-notes-item__menu-item"
                        role="menuitem"
                        :disabled="deletingId === item.id"
                        @click="onDeleteFromMenu(item.id)"
                      >
                        Удалить
                      </button>
                    </div>
                  </Teleport>
                </div>
              </div>
              <p class="staff-notes-item__text">{{ item.text }}</p>
            </div>
          </li>
        </ul>

        <form
          v-if="!readOnly"
          class="staff-notes-composer"
          @submit.prevent="onSend"
        >
          <input
            v-model="draft"
            type="text"
            class="staff-notes-composer__input"
            placeholder="Введите текст"
            maxlength="2000"
            :disabled="sending"
            autocomplete="off"
          />
          <button
            type="submit"
            class="staff-notes-composer__send"
            aria-label="Отправить"
            :disabled="sending || !draft.trim()"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M4 12L20 4l-6 16-2.5-6.5L4 12z"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        </form>
      </article>

      <aside class="staff-notes-panel staff-notes-panel--side">
        <h2 class="staff-notes-panel__title">Дополнительная информация</h2>

        <div v-if="selectedLabels.length" class="staff-notes-tags">
          <span
            v-for="tag in selectedLabels"
            :key="String(tag.id)"
            class="staff-notes-tag"
          >
            {{ tag.name }}
            <button
              v-if="!readOnly"
              type="button"
              class="staff-notes-tag__remove"
              :aria-label="`Убрать метку ${tag.name}`"
              :disabled="labelsSaving"
              @click="removeLabel(tag.id)"
            >
              ×
            </button>
          </span>
        </div>

        <div v-if="!readOnly" class="staff-notes-add">
          <button
            type="button"
            class="staff-notes-add__btn"
            :disabled="labelsSaving"
            @click.stop="toggleLabelPicker"
          >
            + Метку
          </button>
          <div
            v-if="showLabelPicker"
            class="staff-notes-add__backdrop"
            aria-hidden="true"
            @pointerdown="closeLabelPicker"
          />
          <div
            v-if="showLabelPicker"
            class="staff-notes-add__menu"
            @pointerdown.stop
          >
            <div class="staff-notes-add__search">
              <input
                v-model="newLabelName"
                type="text"
                class="staff-notes-add__input"
                placeholder="Поиск"
                maxlength="80"
                autofocus
                @keydown.enter.prevent="onSearchEnter"
              />
            </div>
            <div class="staff-notes-add__list">
              <button
                v-for="opt in filteredCatalog"
                :key="String(opt.id)"
                type="button"
                class="staff-notes-add__option"
                :disabled="labelsSaving"
                @click="addLabel(opt)"
              >
                <span class="staff-notes-add__option-label">{{ opt.name }}</span>
              </button>
              <p v-if="!filteredCatalog.length && !canCreateLabel" class="staff-notes-add__empty">
                {{ newLabelName.trim() ? 'Ничего не найдено' : 'Нет доступных меток' }}
              </p>
            </div>
            <button
              type="button"
              class="staff-notes-add__create-btn"
              :disabled="!canCreateLabel || labelsSaving"
              @click="createAndAddLabel"
            >
              <span class="staff-notes-add__create-plus" aria-hidden="true">+</span>
              <template v-if="newLabelName.trim()">
                Добавить «{{ newLabelName.trim() }}»
              </template>
              <template v-else>Добавить</template>
            </button>
          </div>
        </div>

        <div class="staff-notes-joined">
          <span class="staff-notes-joined__label">Присоединился</span>
          <span class="staff-notes-joined__value">{{ joinedLabel }}</span>
        </div>
      </aside>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useToast } from 'bibli/shared/ui'
import { useSessionStore } from '@/shared/auth'
import { useRoles } from '@/shared/composables'
import StaffProfileListSkeleton from '../StaffProfileListSkeleton.vue'
import { getDocumentAvatarUrl } from '@/shared/api/http/http'
import {
  addRegistrationStatus,
  updateStaffNewStatus,
} from '@/pages/onboarding/api'
import {
  getOnboardingSupportLabels,
  type OnboardingListUser,
  type OnboardingStatusOption,
} from 'bibli/widgets/Onboarding/lib/onboardingListUtils'
import {
  createStaffNote,
  deleteStaffNote,
  fetchStaffLabelCatalog,
  fetchStaffNotes,
  type StaffProfileNoteItem,
} from '../../api/notes'
import { formatStaffHistoryTimeLabel } from '../../lib/staffProfileHistoryTime'
import { formatStaffJoinedLabel } from '../../lib/staffProfileProjects'
import { getStaffProfileActionErrorMessage } from '../../lib/staffProfileActionError'
import type { StaffProfileModel } from '../../composables/useStaffProfile'
import iconMore from '../../assets/icons/more.svg'

const props = withDefaults(
  defineProps<{
    profile: StaffProfileModel
    userId: number | string
    readOnly?: boolean
  }>(),
  { readOnly: false },
)

const emit = defineEmits<{
  'notes-count': [count: number]
  reload: []
}>()

const toast = useToast()
const sessionStore = useSessionStore()
const { isAdmin } = useRoles()
const loading = ref(true)
const error = ref('')
const items = ref<StaffProfileNoteItem[]>([])
const total = ref(0)
const draft = ref('')
const sending = ref(false)
const deletingId = ref<number | null>(null)
const brokenAvatarIds = ref(new Set<number>())
const openNoteMenuId = ref<number | null>(null)
const noteMenuPos = ref({ top: 0, right: 0 })
const listEl = ref<HTMLElement | null>(null)

const noteMenuStyle = computed(() => ({
  top: `${noteMenuPos.value.top}px`,
  right: `${noteMenuPos.value.right}px`,
}))

function scrollNotesToBottom() {
  void nextTick(() => {
    const el = listEl.value
    if (!el) return
    el.scrollTop = el.scrollHeight
  })
}

const catalog = ref<OnboardingStatusOption[]>([])
const selectedLabels = ref<OnboardingStatusOption[]>([])
const labelsSaving = ref(false)
const showLabelPicker = ref(false)
const newLabelName = ref('')

const joinedLabel = computed(() => {
  const raw = props.profile.rawRegistration
  const iso =
    (typeof raw?.registered_at === 'string' && raw.registered_at) ||
    (typeof raw?.created_at === 'string' && raw.created_at) ||
    null
  return formatStaffJoinedLabel(iso)
})

const availableCatalog = computed(() => {
  const selected = new Set(selectedLabels.value.map((l) => String(l.id)))
  return catalog.value.filter((item) => !selected.has(String(item.id)))
})

const filteredCatalog = computed(() => {
  const q = newLabelName.value.trim().toLowerCase()
  if (!q) return availableCatalog.value
  return availableCatalog.value.filter((item) => item.name.toLowerCase().includes(q))
})

const canCreateLabel = computed(() => {
  const name = newLabelName.value.trim()
  if (!name) return false
  const lower = name.toLowerCase()
  return !catalog.value.some((item) => item.name.toLowerCase() === lower)
})

function canDeleteNote(item: StaffProfileNoteItem): boolean {
  if (props.readOnly) return false
  if (isAdmin.value) return true
  const myId = sessionStore.user?.id
  if (myId == null || item.actor.id == null) return false
  return String(item.actor.id) === String(myId)
}

function actorAvatarUrl(item: StaffProfileNoteItem): string | null {
  const code = item.actor.avatar?.trim()
  if (!code) return null
  return getDocumentAvatarUrl(code, 96)
}

function onAvatarError(id: number) {
  if (brokenAvatarIds.value.has(id)) return
  const next = new Set(brokenAvatarIds.value)
  next.add(id)
  brokenAvatarIds.value = next
}

function formatTime(createdAt: string) {
  return formatStaffHistoryTimeLabel(createdAt)
}

function syncLabelsFromProfile() {
  const userLike = {
    ...(props.profile.rawRegistration || {}),
    registration: props.profile.registration,
  } as OnboardingListUser
  selectedLabels.value = getOnboardingSupportLabels(userLike, catalog.value)
}

async function reload() {
  loading.value = true
  error.value = ''
  brokenAvatarIds.value = new Set()
  try {
    const [notes, labels] = await Promise.all([
      fetchStaffNotes(props.userId),
      fetchStaffLabelCatalog().catch(() => [] as OnboardingStatusOption[]),
    ])
    items.value = notes.items
    total.value = notes.total
    catalog.value = labels
    syncLabelsFromProfile()
    emit('notes-count', notes.total)
    scrollNotesToBottom()
  } catch (e) {
    console.error('[staff-profile-notes]', e)
    error.value = 'Не удалось загрузить заметки'
    items.value = []
    total.value = 0
    emit('notes-count', 0)
  } finally {
    loading.value = false
  }
}

async function onSend() {
  const text = draft.value.trim()
  if (!text || sending.value) return
  sending.value = true
  try {
    const created = await createStaffNote(props.userId, text)
    items.value = [...items.value, created]
    total.value += 1
    draft.value = ''
    emit('notes-count', total.value)
    scrollNotesToBottom()
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: getStaffProfileActionErrorMessage(e, 'Не удалось отправить заметку'),
      life: 4000,
    })
  } finally {
    sending.value = false
  }
}

async function onDelete(noteId: number) {
  const item = items.value.find((row) => row.id === noteId)
  if (!item || !canDeleteNote(item) || deletingId.value) return
  deletingId.value = noteId
  openNoteMenuId.value = null
  try {
    await deleteStaffNote(props.userId, noteId)
    items.value = items.value.filter((item) => item.id !== noteId)
    total.value = Math.max(0, total.value - 1)
    emit('notes-count', total.value)
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: getStaffProfileActionErrorMessage(e, 'Не удалось удалить заметку'),
      life: 4000,
    })
  } finally {
    deletingId.value = null
  }
}

function toggleNoteMenu(noteId: number, event: MouseEvent) {
  if (openNoteMenuId.value === noteId) {
    closeNoteMenu()
    return
  }
  const btn = event.currentTarget
  if (btn instanceof HTMLElement) {
    const rect = btn.getBoundingClientRect()
    noteMenuPos.value = {
      top: rect.bottom + 4,
      right: Math.max(8, window.innerWidth - rect.right),
    }
  }
  openNoteMenuId.value = noteId
}

function closeNoteMenu() {
  openNoteMenuId.value = null
}

function onDeleteFromMenu(noteId: number) {
  void onDelete(noteId)
}

function onNoteMenuKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') closeNoteMenu()
}

watch(openNoteMenuId, (id) => {
  if (id != null) {
    document.addEventListener('keydown', onNoteMenuKeydown, true)
    return
  }
  document.removeEventListener('keydown', onNoteMenuKeydown, true)
})

async function persistLabels(next: OnboardingStatusOption[]) {
  labelsSaving.value = true
  try {
    await updateStaffNewStatus(props.userId, {
      user_id: String(props.userId),
      status_ids: next.map((item) => item.id),
    })
    selectedLabels.value = next
    emit('reload')
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: getStaffProfileActionErrorMessage(e, 'Не удалось сохранить метки'),
      life: 4000,
    })
  } finally {
    labelsSaving.value = false
  }
}

async function addLabel(opt: OnboardingStatusOption) {
  showLabelPicker.value = false
  newLabelName.value = ''
  if (selectedLabels.value.some((item) => String(item.id) === String(opt.id))) return
  await persistLabels([...selectedLabels.value, opt])
}

async function removeLabel(id: string | number) {
  await persistLabels(selectedLabels.value.filter((item) => String(item.id) !== String(id)))
}

function closeLabelPicker() {
  if (!showLabelPicker.value) return
  showLabelPicker.value = false
  newLabelName.value = ''
}

function toggleLabelPicker() {
  if (showLabelPicker.value) {
    closeLabelPicker()
    return
  }
  showLabelPicker.value = true
}

function onSearchEnter() {
  if (canCreateLabel.value) {
    void createAndAddLabel()
    return
  }
  const first = filteredCatalog.value[0]
  if (first) void addLabel(first)
}

function onLabelPickerKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') closeLabelPicker()
}

watch(showLabelPicker, (open) => {
  if (open) {
    document.addEventListener('keydown', onLabelPickerKeydown, true)
    return
  }
  document.removeEventListener('keydown', onLabelPickerKeydown, true)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onLabelPickerKeydown, true)
  document.removeEventListener('keydown', onNoteMenuKeydown, true)
})

async function createAndAddLabel() {
  const name = newLabelName.value.trim()
  if (!name || !canCreateLabel.value) return
  labelsSaving.value = true
  try {
    const created = await addRegistrationStatus({ name })
    const row = created?.data ?? created
    const opt: OnboardingStatusOption = {
      id: row?.id ?? name,
      name: row?.name ?? name,
      color: row?.color ?? null,
    }
    catalog.value = [...catalog.value, opt]
    newLabelName.value = ''
    showLabelPicker.value = false
    await persistLabels([...selectedLabels.value, opt])
  } catch (e) {
    toast.add({
      severity: 'error',
      summary: 'Ошибка',
      detail: getStaffProfileActionErrorMessage(e, 'Не удалось создать метку'),
      life: 4000,
    })
  } finally {
    labelsSaving.value = false
  }
}

onMounted(() => {
  void reload()
})

watch(
  () => props.userId,
  () => {
    void reload()
  },
)

watch(
  () => props.profile.registration,
  () => {
    syncLabelsFromProfile()
  },
)

defineExpose({ reload })
</script>

<style scoped>
.staff-notes {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 0;
  min-height: 0;
  height: 100%;
  padding-bottom: 5px;
}

.staff-notes__layout {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(240px, 0.9fr);
  gap: 12px;
  align-items: stretch;
  flex: 1 1 auto;
  min-height: 0;
  height: 100%;
}

.staff-notes-panel {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
  min-height: 0;
  height: 100%;
  padding: 20px;
  border-radius: 20px;
  background: #fff;
  overflow: hidden;
}

.staff-notes-panel--comments {
  min-height: 0;
}

.staff-notes-panel--side {
  min-height: 0;
}

.staff-notes-panel__title {
  margin: 0;
  flex: 0 0 auto;
  font-size: 18px;
  font-weight: 700;
  line-height: 24px;
  color: #101012;
}

.staff-notes-panel__state {
  flex: 1 1 auto;
  min-height: 0;
  color: rgba(60, 60, 67, 0.72);
  font-size: 14px;
  line-height: 20px;
}

.staff-notes-panel__state--skeleton {
  width: 100%;
}

.staff-notes-panel__state--error {
  color: #e11d48;
}

.staff-notes-retry {
  display: inline-block;
  margin-top: 8px;
  padding: 8px 12px;
  border: none;
  border-radius: 8px;
  background: #e7e8ee;
  font: inherit;
  cursor: pointer;
}

.staff-notes-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1 1 auto;
  min-height: 0;
  margin: 0;
  padding: 0;
  list-style: none;
  overflow-x: hidden;
  overflow-y: auto;
}

.staff-notes-item {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr);
  gap: 12px;
  align-items: flex-start;
}

.staff-notes-item__avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #dbe4ff;
  color: #2f4fbf;
  font-size: 12px;
  font-weight: 700;
  overflow: hidden;
}

.staff-notes-item__avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.staff-notes-item__head {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.staff-notes-item__name {
  font-size: 14px;
  font-weight: 600;
  color: #101012;
}

.staff-notes-item__time {
  font-size: 12px;
  color: rgba(60, 60, 67, 0.52);
}

.staff-notes-item__actions {
  position: relative;
  margin-left: auto;
  flex: 0 0 auto;
}

.staff-notes-item__more {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  margin: 0;
  padding: 0;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: rgba(60, 60, 67, 0.45);
  cursor: pointer;
}

.staff-notes-item__more:hover:not(:disabled) {
  background: #f2f3f7;
}

.staff-notes-item__more:disabled {
  opacity: 0.45;
  cursor: default;
}

.staff-notes-item__more-icon {
  display: block;
  width: 20px;
  height: 20px;
}

.staff-notes-item__menu-backdrop {
  position: fixed;
  inset: 0;
  z-index: 10050;
}

.staff-notes-item__menu {
  position: fixed;
  z-index: 10051;
  box-sizing: border-box;
  min-width: 160px;
  padding: 4px;
  border: 1px solid var(--Border-Neutral-Subtle, #dedee3);
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 8px 24px rgba(16, 16, 18, 0.12);
}

.staff-notes-item__menu-item {
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 40px;
  margin: 0;
  padding: 8px 12px;
  border: none;
  border-radius: 8px;
  background: transparent;
  font: inherit;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  text-align: left;
  color: #e11d48;
  cursor: pointer;
}

.staff-notes-item__menu-item:hover:not(:disabled),
.staff-notes-item__menu-item:focus-visible {
  background: #fef2f2;
  outline: none;
}

.staff-notes-item__menu-item:disabled {
  opacity: 0.55;
  cursor: default;
}

.staff-notes-item__text {
  margin: 0;
  font-size: 14px;
  line-height: 20px;
  color: #101012;
  white-space: pre-wrap;
  word-break: break-word;
}

.staff-notes-composer {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
  margin-top: auto;
}

.staff-notes-composer__input {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 48px;
  padding: 12px 16px;
  border: none;
  border-radius: 14px;
  background: #f2f3f7;
  font: inherit;
  font-size: 15px;
  color: #101012;
}

.staff-notes-composer__input:focus {
  outline: 2px solid #c5d0ff;
}

.staff-notes-composer__send {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border: none;
  border-radius: 14px;
  background: #101012;
  color: #fff;
  cursor: pointer;
}

.staff-notes-composer__send:disabled {
  opacity: 0.45;
  cursor: default;
}

.staff-notes-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  flex: 0 0 auto;
}

.staff-notes-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 999px;
  background: #f2f3f7;
  font-size: 13px;
  line-height: 18px;
  color: #101012;
}

.staff-notes-tag__remove {
  border: none;
  background: transparent;
  color: rgba(60, 60, 67, 0.55);
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  padding: 0;
}

.staff-notes-add {
  position: relative;
}

.staff-notes-add__backdrop {
  position: fixed;
  inset: 0;
  z-index: 10050;
}

.staff-notes-add__btn {
  border: none;
  background: transparent;
  padding: 0;
  color: #3d5afe;
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.staff-notes-add__menu {
  position: absolute;
  left: 0;
  top: calc(100% + 8px);
  z-index: 10051;
  box-sizing: border-box;
  width: min(280px, 80vw);
  padding: 8px;
  border: 1px solid var(--Border-Neutral-Subtle, #dedee3);
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 8px 28px rgba(16, 16, 18, 0.12);
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow: hidden;
}

.staff-notes-add__search {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  height: 40px;
  min-height: 40px;
  padding: 0 12px;
  border-radius: 10px;
  background: var(--Input-Background-Default, #f2f3f7);
}

.staff-notes-add__input {
  box-sizing: border-box;
  display: block;
  width: 100%;
  min-width: 0;
  height: auto;
  min-height: 0;
  margin: 0;
  padding: 0;
  border: none;
  border-radius: 0;
  background: transparent;
  font: inherit;
  font-size: 15px;
  font-weight: 500;
  line-height: 22px;
  color: #101012;
  outline: none;
  appearance: none;
  -webkit-appearance: none;
}

.staff-notes-add__input::placeholder {
  color: rgba(60, 60, 67, 0.45);
}

.staff-notes-add__list {
  display: flex;
  flex-direction: column;
  max-height: 240px;
  overflow: auto;
  padding: 0;
}

.staff-notes-add__option {
  display: flex;
  align-items: center;
  width: 100%;
  margin: 0;
  padding: 10px 12px;
  border: none;
  border-radius: 10px;
  background: transparent;
  text-align: left;
  font: inherit;
  font-size: 15px;
  font-weight: 500;
  line-height: 22px;
  color: #101012;
  cursor: pointer;
}

.staff-notes-add__option:hover {
  background: #f2f3f7;
}

.staff-notes-add__option:disabled {
  opacity: 0.55;
  cursor: default;
}

.staff-notes-add__option-label {
  min-width: 0;
  flex: 1 1 auto;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.staff-notes-add__empty {
  margin: 0;
  padding: 12px;
  font-size: 13px;
  color: rgba(60, 60, 67, 0.6);
}

.staff-notes-add__create-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  box-sizing: border-box;
  width: calc(100% + 16px);
  margin: 0 -8px -8px;
  padding: 10px 20px;
  border: none;
  border-top: 1px solid var(--Border-Neutral-Subtle, #dedee3);
  border-radius: 0 0 16px 16px;
  background: transparent;
  text-align: left;
  font: inherit;
  font-size: 15px;
  font-weight: 600;
  line-height: 22px;
  color: var(--Button-Brand-Primary-Background-Default, #5b7dec);
  cursor: pointer;
}

.staff-notes-add__create-btn:hover:not(:disabled) {
  background: #f7f8fc;
}

.staff-notes-add__create-btn:disabled {
  opacity: 0.55;
  cursor: default;
}

.staff-notes-add__create-plus {
  flex: 0 0 auto;
  font-size: 18px;
  font-weight: 600;
  line-height: 1;
  color: inherit;
}

.staff-notes-joined {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-top: 12px;
  flex: 0 0 auto;
}

.staff-notes-joined__label {
  font-size: 12px;
  color: rgba(60, 60, 67, 0.6);
}

.staff-notes-joined__value {
  font-size: 14px;
  font-weight: 500;
  color: #101012;
}

@media (max-width: 900px) {
  .staff-notes {
    height: auto;
    min-height: min(70vh, 640px);
  }

  .staff-notes__layout {
    grid-template-columns: 1fr;
    height: auto;
    min-height: inherit;
  }

  .staff-notes-panel--comments {
    min-height: 360px;
  }

  .staff-notes-panel--side {
    min-height: 240px;
    height: auto;
  }
}
</style>
