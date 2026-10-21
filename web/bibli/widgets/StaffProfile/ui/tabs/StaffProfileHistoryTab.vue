<template>
  <section class="staff-profile-history" aria-label="История">
    <h2 class="staff-profile-history__title">Последние изменения</h2>

    <div v-if="loading" class="staff-profile-history__state staff-profile-history__state--skeleton">
      <StaffProfileListSkeleton variant="history" :rows="6" />
    </div>
    <div v-else-if="error" class="staff-profile-history__state staff-profile-history__state--error">
      <p>{{ error }}</p>
      <button type="button" class="staff-profile-history__retry" @click="reload">Повторить</button>
    </div>
    <div v-else-if="!items.length" class="staff-profile-history__state">
      Пока нет записей в истории
    </div>

    <ul v-else class="staff-profile-history__list" role="list">
      <li v-for="item in items" :key="item.id" class="staff-profile-history__row">
        <span
          class="staff-profile-history__avatar"
          :class="`staff-profile-history__avatar--${item.actor_role}`"
          aria-hidden="true"
        >
          <img
            v-if="actorAvatarUrl(item) && !brokenAvatarIds.has(item.id)"
            class="staff-profile-history__avatar-img"
            :src="actorAvatarUrl(item)!"
            alt=""
            width="24"
            height="24"
            loading="lazy"
            decoding="async"
            @error="onAvatarError(item.id)"
          />
          <template v-else>{{ item.actor.initials }}</template>
        </span>

        <div class="staff-profile-history__body">
          <p class="staff-profile-history__line">
            <span class="staff-profile-history__name">{{ item.actor.name }}</span>
            <span class="staff-profile-history__verb">{{ item.verb }}</span>
            <span
              v-if="item.step_label"
              class="staff-profile-history__target staff-profile-history__target--step"
            >
              <img
                v-if="stepIcon(item.step)"
                class="staff-profile-history__step-icon"
                :src="stepIcon(item.step)!"
                alt=""
                width="16"
                height="16"
                aria-hidden="true"
              />
              {{ item.step_label }}
            </span>
            <span
              v-else-if="item.status_name"
              class="staff-profile-history__target staff-profile-history__target--status"
            >
              «{{ item.status_name }}»
            </span>
            <span
              v-else-if="item.target"
              class="staff-profile-history__target"
            >
              {{ item.target }}
            </span>
          </p>
        </div>

        <time class="staff-profile-history__time" :datetime="item.created_at">
          {{ formatTime(item.created_at) }}
        </time>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { getDocumentAvatarUrl } from '@/shared/api/http/http'
import {
  fetchStaffActivationHistory,
  type StaffProfileHistoryItem,
} from '../../api/history'
import { formatStaffHistoryTimeLabel } from '../../lib/staffProfileHistoryTime'
import { activationStepIcon } from '../../lib/staffProfileOverview'
import StaffProfileListSkeleton from '../StaffProfileListSkeleton.vue'

const props = defineProps<{
  userId: number | string
}>()

const loading = ref(true)
const error = ref('')
const items = ref<StaffProfileHistoryItem[]>([])
const brokenAvatarIds = ref(new Set<number>())

function stepIcon(step: string | null) {
  return activationStepIcon(step)
}

function actorAvatarUrl(item: StaffProfileHistoryItem): string | null {
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

async function reload() {
  loading.value = true
  error.value = ''
  brokenAvatarIds.value = new Set()
  try {
    items.value = await fetchStaffActivationHistory(props.userId)
  } catch (e) {
    console.error('[staff-profile-history]', e)
    error.value = 'Не удалось загрузить историю'
    items.value = []
  } finally {
    loading.value = false
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

defineExpose({ reload })
</script>

<style scoped>
.staff-profile-history {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
  min-width: 0;
  padding: 24px;
  border-radius: 16px;
  background: #ffffff;
}

.staff-profile-history__title {
  margin: 0;
  font-family: var(--rr-font-family-font-family, Manrope, system-ui, sans-serif);
  font-weight: 600;
  font-style: normal;
  font-size: var(--rr-font-size-font-size-xl, 24px);
  line-height: var(--rr-line-height-line-height-xl, 24px);
  letter-spacing: var(--rr-tracking-tracking-xl, -0.5px);
  color: var(--Labels-Neutral-Primary, var(--rr-labels-neutral-primary, #101012));
}

.staff-profile-history__state {
  padding: 24px 0;
  color: rgba(60, 60, 67, 0.72);
  font-size: 14px;
  line-height: 20px;
}

.staff-profile-history__state--skeleton {
  padding: 0;
}

.staff-profile-history__state--error {
  color: #e11d48;
}

.staff-profile-history__retry {
  margin-top: 8px;
  padding: 8px 12px;
  border: none;
  border-radius: 8px;
  background: #e7e8ee;
  color: #101012;
  font: inherit;
  cursor: pointer;
}

.staff-profile-history__list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.staff-profile-history__row {
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
}

.staff-profile-history__avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #e7e8ee;
  color: #101012;
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
  flex: 0 0 auto;
  overflow: hidden;
}

.staff-profile-history__avatar-img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.staff-profile-history__avatar--system {
  background: #101012;
  color: #fff;
}

.staff-profile-history__avatar--support {
  background: #dbe4ff;
  color: #2f4fbf;
}

.staff-profile-history__avatar--agent {
  background: #e8f7ee;
  color: #1f7a3f;
}

.staff-profile-history__body {
  min-width: 0;
}

.staff-profile-history__line {
  margin: 0;
  font-family: var(--rr-font-family-font-family, Manrope, system-ui, sans-serif);
  font-weight: 400;
  font-style: normal;
  font-size: var(--rr-font-size-font-size-m, 16px);
  line-height: var(--rr-line-height-line-height-m, 24px);
  letter-spacing: var(--rr-tracking-tracking-m, 0px);
  color: #000000;
}

.staff-profile-history__name {
  font-weight: 400;
  margin-right: 4px;
  color: #000000;
}

.staff-profile-history__verb {
  font-weight: 400;
  margin-right: 4px;
  color: var(--Labels-Neutral-Secondary, var(--rr-labels-neutral-secondary, #3c3c43b8));
}

.staff-profile-history__target {
  font-weight: 400;
  color: #000000;
}

.staff-profile-history__target--status {
  font-weight: 600;
}

.staff-profile-history__target--step {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.staff-profile-history__step-icon {
  display: inline-block;
  width: 16px;
  height: 16px;
  object-fit: contain;
  flex: 0 0 auto;
  border-radius: 3px;
}

.staff-profile-history__time {
  flex: 0 0 auto;
  font-size: 12px;
  line-height: 16px;
  color: rgba(60, 60, 67, 0.52);
  white-space: nowrap;
}

@media (max-width: 640px) {
  .staff-profile-history__row {
    grid-template-columns: 24px minmax(0, 1fr);
  }

  .staff-profile-history__time {
    grid-column: 2;
  }
}
</style>
