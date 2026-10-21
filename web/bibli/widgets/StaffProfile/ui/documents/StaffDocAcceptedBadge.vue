<template>
  <span
    v-if="label"
    class="staff-doc-status-badge"
    :class="`staff-doc-status-badge--${tone}`"
  >
    {{ label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ActivationStepStatus } from 'bibli/widgets/Profile/rr/lib/activationSteps'

const props = withDefaults(
  defineProps<{
    status?: ActivationStepStatus | string | null
    /** Есть поля/файлы при статусе empty — показываем «Частично заполнено». */
    partial?: boolean
  }>(),
  { partial: false },
)

const label = computed(() => {
  if (props.status === 'done') return 'Принято'
  if (props.status === 'error') return 'Отклонено'
  if (props.status === 'review') return 'Ждет проверки'
  if (
    props.status === 'partial' ||
    ((props.status === 'empty' || !props.status) && props.partial)
  ) {
    return 'Частично заполнено'
  }
  return ''
})

const tone = computed(() => {
  if (props.status === 'error') return 'danger'
  if (props.status === 'done') return 'success'
  if (props.status === 'review') return 'review'
  return 'warning'
})
</script>

<style scoped>
.staff-doc-status-badge {
  display: inline;
  flex-shrink: 0;
  padding: 0;
  border-radius: 0;
  background: none;
  font-family: var(--rr-font-family-font-family, Manrope, system-ui, sans-serif);
  font-size: var(--rr-font-size-font-size-xs, 12px);
  font-weight: 400;
  font-style: normal;
  line-height: var(--rr-line-height-line-height-xs, 16px);
  letter-spacing: var(--rr-tracking-tracking-s, 0px);
  white-space: nowrap;
}

.staff-doc-status-badge--success {
  color: var(--rr-labels-success-primary, #34c759);
}

.staff-doc-status-badge--danger {
  color: var(--rr-labels-danger-primary, #dc2626);
}

.staff-doc-status-badge--review {
  color: var(--rr-labels-brand-primary, #1c4ae5);
}

.staff-doc-status-badge--warning {
  color: var(--rr-labels-warning-primary, #d97706);
}
</style>
