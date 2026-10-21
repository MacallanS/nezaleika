<template>
  <BaseModal
    :model-value="modelValue"
    :title="cardTitle"
    size="lg"
    @update:model-value="emit('update:modelValue', $event)"
    @hide="handleHide"
  >
    <div v-if="loading" class="onec-user-card-loading">Загрузка карточки…</div>
    <div v-else-if="loadError" class="onec-user-card-error">{{ loadError }}</div>
    <div v-else-if="user" class="onec-user-card">
      <section class="onec-user-card-section">
        <h3 class="onec-user-card-section-title">Основное</h3>
        <div class="onec-user-card-grid">
          <div class="onec-user-card-field">
            <span class="onec-user-card-label">ФИО</span>
            <span class="onec-user-card-value">{{ fullName }}</span>
          </div>
          <div class="onec-user-card-field">
            <span class="onec-user-card-label">Телефон</span>
            <span class="onec-user-card-value">{{ formatPhonePlus(user.phone) }}</span>
          </div>
          <div class="onec-user-card-field">
            <span class="onec-user-card-label">Email</span>
            <span class="onec-user-card-value">{{ user.email || "—" }}</span>
          </div>
          <div class="onec-user-card-field">
            <span class="onec-user-card-label">Тип оформления</span>
            <span
              class="onec-user-card-type"
              :class="effectiveAccountType ? `onec-user-card-type--${effectiveAccountType}` : ''"
            >
              {{ accountTypeLabel }}
            </span>
          </div>
          <div class="onec-user-card-field">
            <span class="onec-user-card-label">Этап</span>
            <span class="onec-user-card-value">{{ stageLabel }}</span>
          </div>
          <div class="onec-user-card-field">
            <span class="onec-user-card-label">ИНН</span>
            <span class="onec-user-card-value">{{ user.data?.inn || "—" }}</span>
          </div>
        </div>
      </section>

      <section v-if="dataIssues.length" class="onec-user-card-section onec-user-card-section--warn">
        <h3 class="onec-user-card-section-title">Возможные проблемы в данных</h3>
        <ul class="onec-user-card-issues">
          <li v-for="issue in dataIssues" :key="issue">{{ issue }}</li>
        </ul>
      </section>

      <section class="onec-user-card-section">
        <h3 class="onec-user-card-section-title">Синхронизация с 1С</h3>
        <OnecSyncDetailsPanel
          :sync="effectiveSync"
          :fio="fullName"
          :show-meta="false"
          @copy="emitCopy"
        />
      </section>
    </div>

    <template #footer>
      <div class="onec-user-card-footer">
        <button type="button" class="onec-user-card-btn onec-user-card-btn--ghost" @click="handleHide">
          Закрыть
        </button>
        <button
          v-if="canResyncOnec"
          type="button"
          class="onec-user-card-btn onec-user-card-btn--ghost"
          :disabled="resyncLoading"
          @click="handleResync"
        >
          {{ resyncLoading ? "…" : "Повторить синхронизацию" }}
        </button>
        <button type="button" class="onec-user-card-btn" @click="openInOnboarding">
          Редактировать в оформлении
        </button>
      </div>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { formatPhonePlus } from "@/shared/utils/phoneDisplay";
import { buildStaffProfileUrl } from "bibli/widgets/StaffProfile";
import { useToast } from "bibli/shared/ui";
import { writeClipboardText } from "bibli/shared/utils/copyToClipboard";
import {
  fetchStaffRegistrationById,
  isOnecResyncTimeoutError,
  resyncOnecCounterparty,
  type OnecQueueItem,
} from "@/pages/onboarding/api";
import OnecSyncDetailsPanel from "./OnecSyncDetailsPanel.vue";
import type { OnecSyncStatusLike } from "../lib/onecSyncUtils";
import { humanizeOnecErrorMessage } from "../lib/onecSyncUtils";
import {
  getEmploymentTypeShortName,
  resolveEffectiveAccountType,
} from "@/pages/agents/lib/employmentTypeFields";

const props = defineProps<{
  modelValue: boolean;
  userId: number | null;
  queueItem?: OnecQueueItem | null;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  resynced: [];
}>();

const toast = useToast();
const router = useRouter();
const loading = ref(false);
const loadError = ref("");
const user = ref<Record<string, any> | null>(null);
const resyncLoading = ref(false);

const fullName = computed(() => {
  if (props.queueItem?.fio?.trim()) return props.queueItem.fio.trim();
  const u = user.value;
  if (!u) return "—";
  return [u.surname, u.name, u.patronymic].filter(Boolean).join(" ").trim() || "—";
});

const cardTitle = computed(() => `Карточка: ${fullName.value}`);

const effectiveAccountType = computed(() => {
  if (user.value) return resolveEffectiveAccountType(user.value);
  return props.queueItem?.account_type != null ? String(props.queueItem.account_type) : "";
});

const accountTypeLabel = computed(() => {
  const type = effectiveAccountType.value;
  if (!type) return "—";
  if (type === "3") return "ИП";
  if (type === "2") return "Самозанятый";
  return getEmploymentTypeShortName(type);
});

const stageLabel = computed(() => {
  const reg = user.value?.registration;
  if (!reg) return props.queueItem?.on_signing ? "На подписании" : "—";
  if (Number(reg.on_signing) === 1) return "На подписании";
  return "На оформлении";
});

const canResyncOnec = computed(() => {
  const u = user.value;
  const onSigning =
    Number(u?.registration?.on_signing) === 1 ||
    props.queueItem?.on_signing === true;
  const isHiredAgent = Number(u?.role_id) === 3;
  if (!onSigning && !isHiredAgent) return false;
  if (!u) {
    // Очередь 1С: item уже на подписании — activation подтянется с карточкой.
    return onSigning;
  }
  if (u.activation_complete === true || u.activation?.complete === true) return true;
  if (u.activation_complete === false || u.activation?.complete === false) return false;
  // Пока карточка не подгрузила activation — не даём синхронизировать вслепую.
  return false;
});

const effectiveSync = computed<OnecSyncStatusLike | null>(() => {
  if (props.queueItem) {
    return {
      status: props.queueItem.status,
      error_message: props.queueItem.error_message,
      response_body: props.queueItem.response_body ?? null,
      request_payload: props.queueItem.request_payload ?? null,
      onec_counterparty_id: props.queueItem.onec_counterparty_id,
      attempts: props.queueItem.attempts,
      synced_at: props.queueItem.synced_at,
    };
  }
  return (user.value?.onec_sync_status as OnecSyncStatusLike | null | undefined) ?? null;
});

const dataIssues = computed(() => {
  const u = user.value;
  if (!u) return [];
  const issues: string[] = [];
  const data = u.data || {};
  const accountType = resolveEffectiveAccountType(u);
  const ie = u.individual_enterepreneur || {};

  if (accountType !== "3" && !data.inn?.trim()) issues.push("Не указан ИНН");
  if (!data.passport?.trim()) issues.push("Не указан паспорт");
  if (!data.birthday?.trim()) issues.push("Не указана дата рождения");
  if (!data.registration_address?.trim()) issues.push("Не указан адрес регистрации");
  if (accountType !== "3" && !data.bank_account?.trim()) issues.push("Не указан расчётный счёт");
  if (accountType !== "3" && !data.bank_bik?.trim()) issues.push("Не указан БИК банка");

  if (accountType === "2" && !u.self_employed) {
    issues.push("Тип «Самозанятый», но блок самозанятого не заполнен");
  }
  if (accountType === "3" && !u.individual_enterepreneur) {
    issues.push("Тип «ИП», но блок ИП не заполнен");
  }
  if (accountType === "3") {
    if (!ie.inn?.trim() && !data.inn?.trim()) issues.push("Не указан ИНН ИП");
    if (!ie.payment_account?.trim() && !data.bank_account?.trim()) {
      issues.push("Не указан расчётный счёт ИП");
    }
    if (!ie.bank_bik?.trim() && !data.bank_bik?.trim()) {
      issues.push("Не указан БИК банка ИП");
    }
  }
  if (accountType !== "2" && accountType !== "3" && accountType !== "") {
    issues.push("Для выгрузки в 1С нужен тип «Самозанятый» или «ИП»");
  }

  return issues;
});

watch(
  () => [props.modelValue, props.userId] as const,
  ([visible, userId]) => {
    if (visible && userId) {
      void loadUser(userId);
    }
    if (!visible) {
      user.value = null;
      loadError.value = "";
    }
  },
  { immediate: true }
);

async function loadUser(userId: number) {
  loading.value = true;
  loadError.value = "";
  try {
    user.value = await fetchStaffRegistrationById(userId);
  } catch (e) {
    loadError.value = errorDetail(e) || "Не удалось загрузить карточку сотрудника";
    user.value = null;
  } finally {
    loading.value = false;
  }
}

function errorDetail(error: unknown): string {
  const anyErr = error as { response?: { data?: unknown }; message?: string };
  const data = anyErr?.response?.data;
  if (typeof data === "string" && data.trim()) return data.trim();
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    if (obj.message) return String(obj.message);
    if (obj.detail) return String(obj.detail);
    if (obj.data != null) return String(obj.data);
  }
  return anyErr?.message ? String(anyErr.message) : "";
}

function handleHide() {
  emit("update:modelValue", false);
}

async function handleResync() {
  const id = props.userId;
  if (!id || !canResyncOnec.value) {
    if (id && !canResyncOnec.value) {
      toast.add({
        severity: "warn",
        summary: "1С",
        detail: "Сначала заполните все данные агента",
        life: 5000,
      });
    }
    return;
  }
  resyncLoading.value = true;
  toast.add({
    severity: "info",
    summary: "1С",
    detail: "Выгрузка в 1С запущена",
    life: 4000,
  });
  try {
    await resyncOnecCounterparty(id);
  } catch (e) {
    if (!isOnecResyncTimeoutError(e)) {
      toast.add({
        severity: "error",
        summary: "1С",
        detail:
          humanizeOnecErrorMessage(errorDetail(e)) ||
          "Не удалось синхронизировать с 1С",
        life: 8000,
      });
    }
  } finally {
    emit("resynced");
    resyncLoading.value = false;
  }
}

async function openInOnboarding() {
  const id = props.userId;
  if (!id) return;
  handleHide();
  await router.push(
    buildStaffProfileUrl(id, {
      from: "onec",
      tab: "projects",
    }),
  );
}

async function emitCopy(text: string) {
  if (!text) return;
  const value = String(text);
  const ok = await writeClipboardText(value);
  if (ok) {
    toast.add({
      severity: "success",
      summary: "Скопировано",
      detail: value.slice(0, 120),
      life: 1500,
    });
    return;
  }
  toast.add({
    severity: "error",
    summary: "Ошибка",
    detail: "Не удалось скопировать",
    life: 2500,
  });
}
</script>

<style scoped>
.onec-user-card-loading,
.onec-user-card-error {
  padding: 24px 8px;
  text-align: center;
  font-size: 14px;
}

.onec-user-card-error {
  color: var(--russ-error);
}

.onec-user-card {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.onec-user-card-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.onec-user-card-section--warn {
  padding: 12px 14px;
  border-radius: 8px;
  background: #fff7ed;
  border: 1px solid #fed7aa;
}

.onec-user-card-section-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--russ-text-primary);
}

.onec-user-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px 16px;
}

.onec-user-card-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.onec-user-card-label {
  font-size: 12px;
  color: var(--russ-text-secondary);
}

.onec-user-card-value {
  font-size: 14px;
  color: var(--russ-text-primary);
  word-break: break-word;
}

.onec-user-card-type {
  display: inline-flex;
  align-self: flex-start;
  padding: 3px 9px;
  font-size: 13px;
  font-weight: 700;
  border-radius: 6px;
  color: #334155;
  background: #f1f5f9;
}

.onec-user-card-type--2 {
  color: #0f766e;
  background: #ccfbf1;
}

.onec-user-card-type--3 {
  color: #1d4ed8;
  background: #dbeafe;
}

.onec-user-card-issues {
  margin: 0;
  padding-left: 18px;
  color: #9a3412;
  font-size: 13px;
  line-height: 1.5;
}

.onec-user-card-footer {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
  width: 100%;
}

.onec-user-card-btn {
  background: var(--russ-accent-dark);
  color: var(--russ-text-inverse);
  height: 40px;
  padding: 0 16px;
  border: 1px solid var(--russ-accent-dark);
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.onec-user-card-btn--ghost {
  background: var(--russ-bg);
  color: var(--russ-text-primary);
  border-color: var(--russ-border);
}

.onec-user-card-btn:hover:not(:disabled) {
  opacity: 0.92;
}

.onec-user-card-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
