<script setup lang="ts">
import { BaseSelect } from '../../shared/ui'

defineProps<{
  visible: boolean
  projects: Array<{ id: string | number; name: string }>
  pointsOfSelectedProject: Array<{ id: string | number; name: string }>
  selectedProjectId: string | number | null
  selectedPointId: string | number | null
  referal: string | null
  refLink: string
  inviteLoading?: boolean
}>()

const emit = defineEmits<{
  'update:selectedProjectId': [value: string | number | null]
  'update:selectedPointId': [value: string | number | null]
  copyRef: []
}>()
</script>

<template>
  <div v-if="visible" class="referral-compact-block">
    <div class="referral-compact-label">Реферальная ссылка</div>

    <div class="referral-compact-stack">
      <div class="referral-compact-selects">
        <BaseSelect
          :model-value="selectedProjectId"
          :options="projects"
          option-label="name"
          option-value="id"
          placeholder="Проект"
          class="compact-select"
          :searchable="true"
          @update:model-value="emit('update:selectedProjectId', $event)"
        />
        <BaseSelect
          :model-value="selectedPointId"
          :options="pointsOfSelectedProject"
          option-label="name"
          option-value="id"
          placeholder="Точка"
          :disabled="!selectedProjectId"
          class="compact-select"
          :searchable="true"
          @update:model-value="emit('update:selectedPointId', $event)"
        />
      </div>

      <div v-if="inviteLoading" class="referral-hint">Получаем ссылку…</div>
      <div v-else-if="referal" class="referral-compact-result">
        <span class="referral-link-text" title="Скопировать ссылку" @click="emit('copyRef')">
          {{ refLink }}
        </span>
        <button type="button" class="referral-copy-btn" title="Копировать" @click="emit('copyRef')">
          <i class="pi pi-copy"></i>
        </button>
      </div>
      <p v-else class="referral-hint">
        {{
          selectedPointId
            ? 'Ссылка недоступна'
            : selectedProjectId
              ? 'Выберите точку'
              : 'Выберите проект и точку'
        }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.referral-compact-block {
  padding: 10px 12px;
  border: 1px solid var(--russ-border);
  border-radius: 10px;
  background: var(--russ-bg);
}

.referral-compact-label {
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--russ-text-secondary);
}

.referral-compact-stack {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.referral-compact-selects {
  display: flex;
  gap: 8px;
}

.compact-select {
  flex: 1;
  min-width: 0;
}

.referral-compact-block :deep(.base-select-combo) {
  height: 40px;
  min-height: 40px;
}

.referral-compact-result {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 36px;
  padding: 6px 8px 6px 10px;
  border-radius: 8px;
  background: var(--russ-bg-quaternary);
}

.referral-link-text {
  flex: 1;
  min-width: 0;
  color: var(--russ-text-primary);
  font-size: 13px;
  line-height: 1.35;
  word-break: break-all;
  cursor: pointer;
}

.referral-copy-btn {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  border-radius: 6px;
  background: var(--russ-accent-dark);
  color: var(--russ-text-inverse);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

.referral-hint {
  margin: 0;
  font-size: 12px;
  line-height: 1.4;
  color: var(--russ-text-muted);
}

@media (max-width: 768px) {
  .referral-compact-selects {
    flex-direction: column;
  }
}
</style>
