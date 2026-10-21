<template>
  <section class="staff-onec" aria-label="Синхронизация с 1С">
    <header class="staff-onec__head">
      <h2 class="staff-onec__title">Синхронизация с 1С</h2>
      <button
        v-if="!readOnly"
        type="button"
        class="staff-onec__send"
        :disabled="!view.canSend || onecBusy"
        @click="onSend"
      >
        {{ onecBusy ? 'Отправка…' : 'Отправить' }}
      </button>
    </header>

    <div class="staff-onec__message" role="status">
      {{ view.message }}
    </div>

    <dl class="staff-onec__meta">
      <div class="staff-onec__meta-cell">
        <dt>Статус</dt>
        <dd>
          <RrStatusBadge
            class="rr-grid-list__badge"
            kind="onec"
            :id="view.status || undefined"
            :label="view.statusLabel"
            size="sm"
          />
        </dd>
      </div>
      <div class="staff-onec__meta-cell">
        <dt>Попытка</dt>
        <dd>{{ view.attempts }}</dd>
      </div>
      <div class="staff-onec__meta-cell">
        <dt>Дата обновления</dt>
        <dd>{{ view.updatedAtLabel }}</dd>
      </div>
    </dl>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useToast } from 'bibli/shared/ui'
import RrStatusBadge from 'bibli/shared/ui/rr/list/RrStatusBadge.vue'
import { buildStaffOnecView } from '../../lib/staffProfileOnec'
import type { StaffProfileModel } from '../../composables/useStaffProfile'

const props = withDefaults(
  defineProps<{
    profile: StaffProfileModel
    onecBusy?: boolean
    readOnly?: boolean
  }>(),
  {
    onecBusy: false,
    readOnly: false,
  },
)

const emit = defineEmits<{
  'resync-onec': []
}>()

const toast = useToast()
const view = computed(() => buildStaffOnecView(props.profile))

function onSend() {
  if (props.readOnly || props.onecBusy) return
  if (!view.value.canSend) {
    toast.add({
      severity: 'warn',
      summary: '1С',
      detail: 'Отправка доступна после перехода на подписание и заполнения активации',
      life: 4000,
    })
    return
  }
  emit('resync-onec')
}
</script>

<style scoped>
.staff-onec {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  min-width: 0;
  padding: 20px;
  border-radius: var(--rr-radius-l, 12px);
  background: var(--rr-backgrounds-primary, #fff);
  font-family: var(--rr-font-family-font-family, Manrope, system-ui, sans-serif);
  overflow: hidden;
}

.staff-onec__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;
}

.staff-onec__title {
  margin: 0;
  min-width: 0;
  font-size: 18px;
  font-weight: 700;
  line-height: 24px;
  color: var(--rr-labels-neutral-primary, #101012);
}

.staff-onec__send {
  box-sizing: border-box;
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  min-height: 36px;
  padding: 8px 14px;
  border: none;
  border-radius: var(--rr-radius-m, 8px);
  background: var(--rr-backgrounds-brand-secondary, #e8f0ff);
  color: var(--rr-labels-brand-primary, #1c4ae5);
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  line-height: 18px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.staff-onec__send:hover:not(:disabled) {
  background: #dbe6ff;
}

.staff-onec__send:disabled {
  opacity: 0.48;
  cursor: not-allowed;
}

.staff-onec__message {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 120px;
  padding: 24px 20px;
  border-radius: var(--rr-radius-l, 12px);
  background: var(--rr-backgrounds-quaternary, #f2f3f7);
  color: var(--rr-labels-neutral-secondary, rgba(60, 60, 67, 0.72));
  font-size: 15px;
  font-weight: 500;
  line-height: 22px;
  text-align: center;
}

.staff-onec__meta {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin: 0;
}

.staff-onec__meta-cell {
  min-width: 0;
}

.staff-onec__meta-cell dt {
  margin: 0 0 6px;
  font-size: 13px;
  font-weight: 500;
  line-height: 16px;
  color: var(--rr-labels-neutral-secondary, rgba(60, 60, 67, 0.72));
}

.staff-onec__meta-cell dd {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  line-height: 20px;
  color: var(--rr-labels-neutral-primary, #101012);
}

@media (max-width: 640px) {
  .staff-onec__meta {
    grid-template-columns: 1fr;
  }
}
</style>
