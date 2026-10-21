<template>
  <div class="onec-detail" :class="{ 'onec-detail--compact': compact }">
    <div class="onec-detail-block onec-detail-block--status">
      <div class="onec-detail-label">Статус синхронизации</div>
      <RrStatusBadge
        v-if="sync?.status"
        kind="onec"
        :id="sync.status"
        :label="onecStatusLabel(sync.status)"
        size="md"
      />
      <span v-else class="onec-detail-value">—</span>
    </div>

    <div v-if="showMeta && isAdmin" class="onec-detail-meta">
      <div v-if="fio">
        <div class="onec-detail-label">Сотрудник</div>
        <div class="onec-detail-value">{{ fio }}</div>
      </div>
      <div v-if="showStatusInMeta">
        <div class="onec-detail-label">Статус</div>
        <RrStatusBadge
          v-if="sync?.status"
          kind="onec"
          :id="sync.status"
          :label="onecStatusLabel(sync.status)"
          size="sm"
        />
        <span v-else class="onec-detail-value">—</span>
      </div>
      <div v-if="sync?.onec_counterparty_id">
        <div class="onec-detail-label">ID в 1С</div>
        <div class="onec-detail-value">{{ sync.onec_counterparty_id }}</div>
      </div>
      <div v-if="sync?.attempts != null">
        <div class="onec-detail-label">Попытки</div>
        <div class="onec-detail-value">{{ sync.attempts }}</div>
      </div>
      <div v-if="sync?.synced_at">
        <div class="onec-detail-label">Обновлено</div>
        <div class="onec-detail-value">{{ formatDate(sync.synced_at) }}</div>
      </div>
    </div>

    <div class="onec-detail-block">
      <div class="onec-detail-label-row">
        <span class="onec-detail-label">Причина</span>
        <button
          v-if="primaryMessage"
          type="button"
          class="onec-copy-mini"
          @click="emitCopy(primaryMessage)"
        >
          Копировать
        </button>
      </div>
      <pre
        class="onec-detail-message"
        :class="{
          'onec-detail-message--pending': sync?.status === 'pending',
          'onec-detail-message--success': sync?.status === 'success',
          'onec-detail-message--needs-resync': sync?.status === 'needs_resync',
          'onec-detail-message--error': sync?.status && String(sync.status).startsWith('failed'),
        }"
      >{{ primaryMessage || "—" }}</pre>
    </div>

    <div v-if="isAdmin" class="onec-detail-block">
        <div class="onec-detail-label-row">
          <span class="onec-detail-label">Ответ 1С</span>
        <button
          v-if="responseText"
          type="button"
          class="onec-copy-mini"
          @click="emitCopy(responseText)"
        >
          Копировать JSON
        </button>
      </div>
      <pre class="onec-detail-json">{{ responseText || "Ответ от 1С не сохранён" }}</pre>
    </div>

    <div v-if="isAdmin && requestText" class="onec-detail-block">
      <div class="onec-detail-label-row">
        <span class="onec-detail-label">Что отправляли</span>
        <button type="button" class="onec-copy-mini" @click="emitCopy(requestText)">
          Копировать JSON
        </button>
      </div>
      <pre class="onec-detail-json">{{ requestText }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { RrStatusBadge } from "bibli/shared/ui";
import { useRoles } from "@/shared/composables";
import {
  onecPrimaryMessage,
  onecStatusLabel,
  prettyOnecJson,
  humanizeOnecErrorMessage,
  type OnecSyncStatusLike,
} from "../lib/onecSyncUtils";

const props = withDefaults(
  defineProps<{
    sync?: OnecSyncStatusLike | null;
    fio?: string | null;
    showMeta?: boolean;
    showStatusInMeta?: boolean;
    compact?: boolean;
  }>(),
  {
    sync: null,
    fio: null,
    showMeta: true,
    showStatusInMeta: true,
    compact: false,
  }
);

const emit = defineEmits<{
  copy: [text: string];
}>();

const { isAdmin } = useRoles();

const primaryMessage = computed(() =>
  humanizeOnecErrorMessage(onecPrimaryMessage(props.sync))
);
const responseText = computed(() => prettyOnecJson(props.sync?.response_body ?? null));
const requestText = computed(() => prettyOnecJson(props.sync?.request_payload ?? null));

function formatDate(value?: string | null) {
  if (!value) return "—";
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

function emitCopy(text: string) {
  emit("copy", text);
}
</script>

<style scoped>
.onec-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.onec-detail-block--status {
  gap: 10px;
}

.onec-detail-meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px 16px;
}

.onec-detail-label {
  font-size: 12px;
  color: var(--russ-text-secondary);
  margin-bottom: 4px;
}

.onec-detail-value {
  font-size: 14px;
  color: var(--russ-text-primary);
  word-break: break-word;
}

.onec-detail-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.onec-detail-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.onec-copy-mini {
  border: none;
  background: transparent;
  color: var(--russ-accent);
  font-size: 12px;
  cursor: pointer;
  padding: 0;
}

.onec-copy-mini:hover {
  text-decoration: underline;
}

.onec-detail--compact {
  gap: 10px;
}

.onec-detail--compact .onec-detail-block--status {
  display: none;
}

.onec-detail--compact .onec-detail-meta {
  gap: 8px 12px;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
}

.onec-detail--compact .onec-detail-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--russ-text-tertiary);
  margin-bottom: 4px;
}

.onec-detail--compact .onec-detail-value {
  font-size: 13px;
}

.onec-detail--compact .onec-detail-block {
  gap: 6px;
}

.onec-detail--compact .onec-detail-message,
.onec-detail--compact .onec-detail-json {
  padding: 8px 10px;
  font-size: 11px;
  max-height: 220px;
}

.onec-detail-message,
.onec-detail-json {
  margin: 0;
  padding: 12px 14px;
  border-radius: 8px;
  border: 1px solid var(--russ-border);
  background: var(--russ-bg-secondary, #f8f8f9);
  color: var(--russ-text-primary);
  font-family: var(--russ-font-family-mono);
  font-size: 12px;
  line-height: 1.45;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 280px;
  overflow: auto;
}

.onec-detail-message--pending {
  color: #92400e;
  background: #fffbeb;
  border: 1px solid #fde68a;
}

.onec-detail-message--success {
  color: #166534;
  background: #dcfce7;
  border: 1px solid #bbf7d0;
}

.onec-detail-message--needs-resync {
  color: #9a3412;
  background: #ffedd5;
  border: 1px solid #fdba74;
}

.onec-detail-message--error {
  color: var(--russ-error, #b91c1c);
  background: var(--russ-error-light, #fee2e2);
  border-color: transparent;
}
</style>
