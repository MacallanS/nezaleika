<template>
  <section class="onec-page">
    <div class="onec-toolbar">
      <div class="onec-filters">
        <div class="onec-search">
          <RrSearchInput
            v-model="filterFio"
            placeholder="Поиск по ФИО или телефону"
          />
        </div>
        <RrFilterChip size="wide" class="onec-status-filter">
          <RrMultiSelect
            v-model="filterStatus"
            :options="statusFilterOptions"
            placeholder="Все статусы 1С"
            sheet-title="Статус 1С"
            :multiple="false"
          />
        </RrFilterChip>
        <button
          type="button"
          class="onec-btn onec-btn--primary"
          :disabled="loading"
          @click="refresh"
        >
          <i class="pi pi-refresh" :class="{ 'onec-spin': loading }" aria-hidden="true"></i>
          {{ loading ? "Обновление…" : "Обновить" }}
        </button>
      </div>

      <div v-if="enabled === false" class="onec-alert onec-alert--error">
        Интеграция с 1С отключена на сервере
      </div>
      <div v-else-if="errorMessage" class="onec-alert onec-alert--error">
        {{ errorMessage }}
      </div>
    </div>

    <div class="onec-table-panel">
      <div v-if="!loading && filteredItems.length === 0" class="onec-empty">
        <template v-if="filterFio.trim() || filterStatus">
          Ничего не найдено
        </template>
        <template v-else>
          В очереди 1С пока нет записей
        </template>
      </div>

      <BaseTable
        v-else
        :columns="tableColumns"
        :items="filteredItems"
        :loading="loading"
        :show-actions="false"
        row-class="onec-row"
        :handle-row-click="openRowDetail"
      >
        <template #cell-fio="{ item }">
          <span class="onec-cell-fio" :class="{ 'onec-cell-fio--loading': isRowResyncing(item) }">
            <span class="onec-cell-name">{{ item.fio || "—" }}</span>
            <i
              v-if="isRowResyncing(item)"
              class="pi pi-spin pi-spinner onec-inline-loader"
              title="Синхронизация выполняется"
              aria-hidden="true"
            ></i>
            <i
              v-if="item.fio && !isRowResyncing(item)"
              class="pi pi-copy onec-copy"
              title="Копировать ФИО"
              @click.stop="copyToClipboard(item.fio)"
            ></i>
          </span>
        </template>
        <template #cell-phone="{ item }">
          <span class="onec-cell-phone" :class="{ 'onec-cell-phone--loading': isRowResyncing(item) }">
            <span>{{ formatPhonePlus(item.phone) }}</span>
            <i
              v-if="item.phone && !isRowResyncing(item)"
              class="pi pi-copy onec-copy"
              title="Копировать телефон"
              @click.stop="copyToClipboard(formatPhonePlus(item.phone))"
            ></i>
          </span>
        </template>
        <template #cell-account_type="{ item }">
          <span
            v-if="accountTypeShortLabel(item.account_type) !== '—'"
            class="onec-type-chip"
            :class="`onec-type-chip--${item.account_type}`"
          >
            {{ accountTypeShortLabel(item.account_type) }}
          </span>
          <span v-else class="onec-cell-muted">—</span>
        </template>
        <template #cell-status="{ item }">
          <span :aria-busy="isRowResyncing(item) ? 'true' : 'false'">
            <RrStatusBadge
              kind="onec"
              :id="item.status"
              :label="statusLabel(item.status)"
              size="sm"
            />
          </span>
        </template>
        <template #cell-reason="{ item }">
          <span
            class="onec-reason"
            :title="reasonForTable(item)"
            :class="{
              'onec-reason--loading': isRowResyncing(item),
              'onec-reason--error': String(item.status || '').startsWith('failed'),
              'onec-reason--pending': item.status === 'pending',
              'onec-reason--needs-resync': item.status === 'needs_resync',
            }"
          >
            {{ reasonForTable(item) }}
          </span>
        </template>
        <template #cell-attempts="{ item }">
          <span class="onec-cell-attempts">{{ item.attempts || "—" }}</span>
        </template>
        <template #cell-updated="{ item }">
          <span class="onec-cell-updated">{{ formatDate(item.synced_at || item.updated_at || item.created_at) }}</span>
        </template>
        <template #cell-actions="{ item }">
          <div class="onec-row-actions" @click.stop>
            <button
              type="button"
              class="onec-menu-trigger"
              :class="{ 'onec-menu-trigger--active': rowMenuVisible && rowMenuItem?.id === item.id }"
              aria-label="Действия"
              aria-haspopup="menu"
              :aria-expanded="rowMenuVisible && rowMenuItem?.id === item.id"
              :disabled="isRowResyncing(item)"
              @click.stop="toggleRowMenu($event, item)"
            >
              <i
                class="pi"
                :class="isRowResyncing(item) ? 'pi-spinner pi-spin' : 'pi-ellipsis-v'"
                aria-hidden="true"
              ></i>
            </button>
          </div>
        </template>
      </BaseTable>
    </div>

    <BaseModal
      v-model="detailVisible"
      :title="detailTitle"
      size="md"
      @hide="closeDetail"
    >
      <div v-if="detailItem" class="onec-detail-modal">
        <div class="onec-detail-head">
          <div>
            <div class="onec-detail-kicker">Сотрудник</div>
            <div class="onec-detail-name">{{ detailItem.fio || "—" }}</div>
            <div class="onec-detail-meta-row">
              <div v-if="detailItem.phone" class="onec-detail-phone">{{ formatPhonePlus(detailItem.phone) }}</div>
              <span
                v-if="accountTypeShortLabel(detailItem.account_type) !== '—'"
                class="onec-type-chip"
                :class="`onec-type-chip--${detailItem.account_type}`"
              >
                {{ accountTypeShortLabel(detailItem.account_type) }}
              </span>
            </div>
          </div>
          <RrStatusBadge
            kind="onec"
            :id="detailItem.status"
            :label="statusLabel(detailItem.status)"
            size="md"
          />
        </div>

        <div
          v-if="detailItem.status === 'pending'"
          class="onec-detail-hint onec-detail-hint--pending"
        >
          Запись в очереди. Если статус не меняется — проверьте обработчик очереди 1С на сервере.
        </div>

        <OnecSyncDetailsPanel
          v-if="showDetailPanel"
          :sync="detailItem"
          :show-meta="true"
          :show-status-in-meta="false"
          @copy="copyToClipboard"
        />

        <div
          v-else-if="detailHumanReason"
          class="onec-detail-hint onec-detail-hint--info"
        >
          {{ detailHumanReason }}
        </div>
      </div>

      <template #footer>
        <div class="onec-detail-footer">
          <button
            v-if="detailItem?.on_signing && canMutateOnec"
            type="button"
            class="onec-btn onec-btn--ghost"
            :disabled="resyncLoadingId === detailItem?.user_id"
            @click="handleResyncFromDetail"
          >
            {{ resyncLoadingId === detailItem?.user_id ? "…" : resyncButtonLabel(detailItem) }}
          </button>
          <button
            v-if="detailItem && canDeleteQueueItem"
            type="button"
            class="onec-btn onec-btn--danger"
            :disabled="deleteLoadingId === detailItem.id"
            @click="handleDeleteFromDetail"
          >
            {{ deleteLoadingId === detailItem.id ? "…" : "Удалить из очереди" }}
          </button>
          <button
            v-if="detailItem && canEditInOnboarding(detailItem)"
            type="button"
            class="onec-btn onec-btn--primary"
            @click="openInOnboardingFromDetail"
          >
            {{ isOnboardingReadOnly ? "Открыть карточку" : "Редактировать" }}
          </button>
        </div>
      </template>
    </BaseModal>

    <Teleport to="body">
      <div
        v-if="rowMenuVisible && rowMenuItem"
        class="onec-context-menu-layer"
      >
        <button
          type="button"
          class="onec-context-menu-backdrop"
          aria-label="Закрыть меню"
          @click="closeRowMenu"
        />
        <div
          ref="rowMenuRef"
          class="onec-context-menu"
          :style="rowMenuStyle"
          role="menu"
          @mousedown.stop
          @click.stop
        >
          <button
            v-if="canEditInOnboarding(rowMenuItem)"
            type="button"
            class="onec-context-menu-item"
            role="menuitem"
            @click="handleMenuEdit"
          >
            <i class="pi pi-pencil" aria-hidden="true"></i>
            <span>{{ isOnboardingReadOnly ? "Открыть карточку" : "Редактировать" }}</span>
          </button>
          <button
            v-if="rowMenuItem.on_signing && canMutateOnec"
            type="button"
            class="onec-context-menu-item"
            role="menuitem"
            :disabled="resyncLoadingId === rowMenuItem.user_id"
            @click="handleMenuResync"
          >
            <i class="pi pi-sync" aria-hidden="true"></i>
            <span>{{ resyncLoadingId === rowMenuItem.user_id ? "…" : resyncButtonLabel(rowMenuItem) }}</span>
          </button>
          <button
            v-if="canDeleteQueueItem"
            type="button"
            class="onec-context-menu-item onec-context-menu-item--danger"
            role="menuitem"
            :disabled="deleteLoadingId === rowMenuItem.id"
            @click="handleMenuDelete"
          >
            <i class="pi pi-trash" aria-hidden="true"></i>
            <span>{{ deleteLoadingId === rowMenuItem.id ? "…" : "Удалить" }}</span>
          </button>
        </div>
      </div>
    </Teleport>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onActivated, onDeactivated, onMounted, onUnmounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useToast } from "bibli/shared/ui";
import { RrSearchInput, RrMultiSelect, RrStatusBadge, RrFilterChip } from "bibli/shared/ui";
import { matchFioQuery } from "bibli/shared/utils/levenshtein";
import { writeClipboardText } from "bibli/shared/utils/copyToClipboard";
import {
  deleteOnecQueueItem,
  fetchOnecQueue,
  isOnecResyncTimeoutError,
  resyncOnecCounterparty,
  type OnecQueueItem,
} from "@/pages/onboarding/api";
import OnecSyncDetailsPanel from "./OnecSyncDetailsPanel.vue";
import { buildStaffProfileUrl } from "bibli/widgets/StaffProfile";
import { formatPhonePlus } from "@/shared/utils/phoneDisplay";
import { useRoles } from "@/shared/composables/useRoles";
import {
  hasOnecFailureDetails,
  humanizeOnecErrorMessage,
  isOnecRowActionable,
  onecPrimaryMessage,
  onecReasonForTable,
  onecStatusLabel,
} from "../lib/onecSyncUtils";
import { getEmploymentTypeShortName } from "@/pages/agents/lib/employmentTypeFields";
import "./onboarding-no-shadows.css";

const ONBOARDING_BODY_CLASS = "onboarding-no-shadows";

function enableOnboardingFlatUi() {
  document.body.classList.add(ONBOARDING_BODY_CLASS);
}

function disableOnboardingFlatUi() {
  document.body.classList.remove(ONBOARDING_BODY_CLASS);
}

const toast = useToast();
const route = useRoute();
const router = useRouter();
const { isAdmin, isOnboardingReadOnly } = useRoles();
const canDeleteQueueItem = computed(() => isAdmin.value && !isOnboardingReadOnly.value);
const canMutateOnec = computed(() => !isOnboardingReadOnly.value);

const items = ref<OnecQueueItem[]>([]);
const enabled = ref<boolean | null>(null);
const loading = ref(false);
const errorMessage = ref("");
const filterFio = ref("");
const filterStatus = ref("");
const resyncLoadingId = ref<number | null>(null);
const deleteLoadingId = ref<number | null>(null);
const detailVisible = ref(false);
const detailItem = ref<OnecQueueItem | null>(null);
const rowMenuItem = ref<OnecQueueItem | null>(null);
const rowMenuVisible = ref(false);
const rowMenuRef = ref<HTMLElement | null>(null);
const rowMenuStyle = ref<Record<string, string>>({ top: "0px", left: "0px" });
let queuePollGeneration = 0;

type LoadQueueOptions = {
  force?: boolean;
  silent?: boolean;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function syncDetailItemFromQueue() {
  if (!detailItem.value) return;

  const fresh = items.value.find((item) => item.id === detailItem.value?.id);
  if (fresh) {
    detailItem.value = fresh;
  }
}

function queueItemSnapshot(item: OnecQueueItem) {
  return {
    status: item.status,
    attempts: item.attempts,
    updated_at: item.updated_at,
    synced_at: item.synced_at,
  };
}

function queueItemChanged(
  before: ReturnType<typeof queueItemSnapshot>,
  after: OnecQueueItem | undefined,
): boolean {
  if (!after) return true;

  return (
    after.status !== before.status ||
    after.attempts !== before.attempts ||
    after.updated_at !== before.updated_at ||
    after.synced_at !== before.synced_at
  );
}

async function waitForQueueItemUpdate(
  userId: number,
  before: ReturnType<typeof queueItemSnapshot>,
): Promise<void> {
  const generation = queuePollGeneration;
  const deadline = Date.now() + 45_000;

  while (Date.now() < deadline) {
    if (generation !== queuePollGeneration) return;

    await sleep(2000);
    await loadQueue({ force: true, silent: true });

    const fresh = items.value.find((item) => item.user_id === userId);
    if (fresh?.status === "pending") {
      continue;
    }

    if (queueItemChanged(before, fresh)) {
      return;
    }
  }
}

const statusFilterOptions = computed(() => [
  { id: "", name: "Все статусы 1С" },
  ...Object.entries({
    pending: "В очереди",
    success: "Успешно",
    needs_resync: "Требуется выгрузка в 1С",
    skipped_not_smz: "Не выгружается",
    failed_validation: "Ошибка данных",
    failed_transport: "Ошибка сети",
    failed_onec: "Ошибка 1С",
  }).map(([id, name]) => ({ id, name })),
]);

const tableColumns = [
  { key: "fio", header: "ФИО", cellClass: "onec-col-fio", headerClass: "onec-col-fio" },
  { key: "phone", header: "Телефон", cellClass: "onec-col-phone", headerClass: "onec-col-phone", hideOnMobile: true },
  { key: "account_type", header: "Тип", cellClass: "onec-col-type", headerClass: "onec-col-type", hideBelowTablet: true },
  { key: "status", header: "Статус 1С", cellClass: "onec-col-status", headerClass: "onec-col-status" },
  { key: "reason", header: "Причина / ID", cellClass: "onec-col-reason", headerClass: "onec-col-reason", hideOnMobile: true },
  { key: "attempts", header: "Попытки", cellClass: "onec-col-attempts", headerClass: "onec-col-attempts", hideBelowTablet: true },
  { key: "updated", header: "Обновлено", cellClass: "onec-col-updated", headerClass: "onec-col-updated", hideOnMobile: true },
  { key: "actions", header: "", cellClass: "onec-col-actions", headerClass: "onec-col-actions" },
];

const filteredItems = computed(() => {
  return items.value.filter((item) => {
    const fio = item.fio || "";
    const phone = item.phone || "";
    const reason = reasonForTable(item);
    const query = filterFio.value.trim();
    const fioMatch =
      !query ||
      matchFioQuery(fio, query, 0.3) ||
      phone.includes(query.replace(/\D/g, "")) ||
      phone.includes(query) ||
      reason.toLowerCase().includes(query.toLowerCase());
    const statusMatch =
      !filterStatus.value || String(item.status) === String(filterStatus.value);
    return fioMatch && statusMatch;
  });
});

const detailTitle = computed(() => {
  if (!detailItem.value) return "Синхронизация с 1С";
  const name = detailItem.value.fio?.trim();
  return name ? `1С: ${name}` : "Синхронизация с 1С";
});

const detailHumanReason = computed(() => {
  if (!detailItem.value) return "";
  return humanizeOnecErrorMessage(onecPrimaryMessage(detailItem.value));
});

const showDetailPanel = computed(() => {
  if (!detailItem.value) return false;
  return (
    hasOnecFailureDetails(detailItem.value) ||
    Boolean(detailItem.value.response_body) ||
    Boolean(detailItem.value.request_payload) ||
    detailItem.value.status === "success" ||
    detailItem.value.status === "needs_resync"
  );
});

function resyncButtonLabel(item?: { status?: string | null } | null): string {
  if (item?.status === "needs_resync") {
    return "Выгрузить в 1С";
  }
  if (
    !item?.status ||
    item.status === "failed_validation" ||
    item.status === "failed_transport" ||
    item.status === "failed_onec"
  ) {
    return "Синхронизировать";
  }
  return "Повторить";
}

function statusLabel(status?: string | null) {
  return onecStatusLabel(status);
}

function accountTypeShortLabel(type?: number | string | null) {
  return getEmploymentTypeShortName(type);
}

function reasonForTable(item: OnecQueueItem): string {
  return onecReasonForTable(item);
}

function canEditInOnboarding(item: OnecQueueItem): boolean {
  return isOnecRowActionable(item);
}

function closeRowMenu() {
  rowMenuVisible.value = false;
  rowMenuItem.value = null;
  rowMenuStyle.value = { top: "0px", left: "0px" };
}

function isMobileViewport() {
  return window.innerWidth <= 768;
}

function setMobileRowMenuStyle() {
  rowMenuStyle.value = {
    top: "auto",
    bottom: "max(12px, env(safe-area-inset-bottom))",
    left: "12px",
    right: "12px",
  };
}

async function positionRowMenu(trigger: HTMLElement) {
  if (isMobileViewport()) {
    setMobileRowMenuStyle();
    return;
  }

  const padding = 8;
  const rect = trigger.getBoundingClientRect();
  const estimatedWidth = 196;

  rowMenuStyle.value = {
    top: `${rect.bottom + 4}px`,
    left: `${Math.max(padding, rect.right - estimatedWidth)}px`,
    right: "auto",
    bottom: "auto",
  };

  await nextTick();
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });

  const menuEl = rowMenuRef.value;
  if (!menuEl) return;

  const menuRect = menuEl.getBoundingClientRect();
  const menuWidth = menuRect.width || estimatedWidth;
  const menuHeight = menuRect.height || 140;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  let left = rect.right - menuWidth;
  let top = rect.bottom + 4;

  if (left < padding) {
    left = padding;
  }
  if (left + menuWidth > viewportWidth - padding) {
    left = Math.max(padding, viewportWidth - menuWidth - padding);
  }
  if (top + menuHeight > viewportHeight - padding) {
    top = Math.max(padding, rect.top - menuHeight - 4);
  }
  if (top < padding) {
    top = padding;
  }

  rowMenuStyle.value = {
    top: `${top}px`,
    left: `${left}px`,
    right: "auto",
    bottom: "auto",
  };
}

function toggleRowMenu(event: MouseEvent, item: OnecQueueItem) {
  event.preventDefault();
  event.stopPropagation();

  if (rowMenuVisible.value && rowMenuItem.value?.id === item.id) {
    closeRowMenu();
    return;
  }

  rowMenuItem.value = item;
  rowMenuVisible.value = true;

  const trigger = event.currentTarget as HTMLElement;
  void positionRowMenu(trigger);
}

function handleMenuEdit() {
  const item = rowMenuItem.value;
  if (!item) return;
  closeRowMenu();
  void openInOnboarding(item);
}

function handleMenuResync() {
  const item = rowMenuItem.value;
  if (!item || resyncLoadingId.value === item.user_id) return;
  closeRowMenu();
  void handleResync(item);
}

function handleMenuDelete() {
  const item = rowMenuItem.value;
  if (!item || deleteLoadingId.value === item.id) return;
  closeRowMenu();
  void handleDelete(item);
}

function handleDocumentKeyDown(event: KeyboardEvent) {
  if (event.key === "Escape" && rowMenuVisible.value) {
    closeRowMenu();
  }
}

function handleViewportChange() {
  if (rowMenuVisible.value) {
    closeRowMenu();
  }
}

function openRowDetail(item: OnecQueueItem) {
  if (isRowResyncing(item)) return;
  if (rowMenuVisible.value) return;
  closeRowMenu();
  detailItem.value = item;
  detailVisible.value = true;
}

function closeDetail() {
  detailVisible.value = false;
  detailItem.value = null;
}

async function openInOnboarding(item: OnecQueueItem | null | undefined) {
  if (!item?.user_id || !canEditInOnboarding(item)) {
    if (item && !item.user_id) {
      toast.add({
        severity: "error",
        summary: "1С",
        detail: "Не удалось открыть карточку: отсутствует user_id",
        life: 4000,
      });
    }
    return;
  }
  closeDetail();
  await router.push(
    buildStaffProfileUrl(item.user_id, {
      from: "onec",
      tab: "projects",
    }),
  );
}

function openInOnboardingFromDetail() {
  if (detailItem.value) {
    void openInOnboarding(detailItem.value);
  }
}

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

function isRowResyncing(item: OnecQueueItem | null | undefined): boolean {
  return Boolean(item?.user_id && resyncLoadingId.value === item.user_id);
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

async function loadQueue(options: LoadQueueOptions = {}) {
  const { force = false, silent = false } = options;
  if (!force && loading.value) return;

  if (!silent) {
    loading.value = true;
  }
  errorMessage.value = "";
  try {
    const response = await fetchOnecQueue();
    if (response?.status && response.data) {
      enabled.value = response.data.enabled !== false;
      items.value = Array.isArray(response.data.items) ? response.data.items : [];
      syncDetailItemFromQueue();
    } else {
      throw new Error("Неверный формат ответа очереди 1С");
    }
  } catch (e) {
    errorMessage.value = errorDetail(e) || "Не удалось загрузить очередь 1С";
    if (!silent) {
      toast.add({
        severity: "error",
        summary: "1С",
        detail: errorMessage.value,
        life: 5000,
      });
    }
  } finally {
    if (!silent) {
      loading.value = false;
    }
  }
}

async function refresh() {
  await loadQueue({ force: true });
  if (!errorMessage.value) {
    toast.add({
      severity: "success",
      summary: "1С",
      detail: "Очередь обновлена",
      life: 2000,
    });
  }
}

async function handleResync(item: OnecQueueItem) {
  const id = item?.user_id;
  if (!id) return;

  const before = queueItemSnapshot(item);

  resyncLoadingId.value = id;
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
    await loadQueue({ force: true, silent: true });
    await waitForQueueItemUpdate(id, before);
    resyncLoadingId.value = null;
  }
}

async function handleResyncFromDetail() {
  if (detailItem.value) {
    await handleResync(detailItem.value);
  }
}

function deleteConfirmLabel(item: OnecQueueItem): string {
  const name = item.fio?.trim() || `user_id ${item.user_id}`;
  return `Удалить «${name}» из очереди 1С?\n\nИстория синхронизации для этого сотрудника будет очищена. При необходимости можно запустить выгрузку снова.`;
}

async function handleDelete(item: OnecQueueItem) {
  if (!item?.id || !canDeleteQueueItem.value) return;
  if (!window.confirm(deleteConfirmLabel(item))) return;

  try {
    deleteLoadingId.value = item.id;
    await deleteOnecQueueItem(item.id);
    if (detailItem.value?.id === item.id) {
      closeDetail();
    }
    await loadQueue({ force: true });
    toast.add({
      severity: "success",
      summary: "1С",
      detail: "Запись удалена из очереди",
      life: 3000,
    });
  } catch (e) {
    toast.add({
      severity: "error",
      summary: "1С",
      detail: errorDetail(e) || "Не удалось удалить запись",
      life: 5000,
    });
  } finally {
    deleteLoadingId.value = null;
  }
}

async function handleDeleteFromDetail() {
  if (detailItem.value) {
    await handleDelete(detailItem.value);
  }
}

async function copyToClipboard(text: string | undefined | null) {
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

let queueRefreshInFlight: Promise<void> | null = null;
let lastQueueRefreshAt = 0;
const QUEUE_REFRESH_DEBOUNCE_MS = 400;

async function refreshQueueOnEnter() {
  const now = Date.now();
  if (queueRefreshInFlight || now - lastQueueRefreshAt < QUEUE_REFRESH_DEBOUNCE_MS) {
    return queueRefreshInFlight ?? Promise.resolve();
  }

  lastQueueRefreshAt = now;
  queueRefreshInFlight = loadQueue({ force: true }).finally(() => {
    queueRefreshInFlight = null;
  });
  return queueRefreshInFlight;
}

defineExpose({
  refreshQueueOnEnter,
});

watch(
  () => route.fullPath,
  (fullPath, previousPath) => {
    if (!String(fullPath).startsWith("/onboarding/onec")) return;
    if (previousPath != null && fullPath === previousPath) return;
    void refreshQueueOnEnter();
  },
  { immediate: true },
);

onMounted(() => {
  enableOnboardingFlatUi();
  document.addEventListener("keydown", handleDocumentKeyDown);
  window.addEventListener("resize", handleViewportChange);
});

onActivated(() => {
  enableOnboardingFlatUi();
  void loadQueue();
});

onDeactivated(() => {
  disableOnboardingFlatUi();
});

onUnmounted(() => {
  disableOnboardingFlatUi();
  queuePollGeneration += 1;
  document.removeEventListener("keydown", handleDocumentKeyDown);
  window.removeEventListener("resize", handleViewportChange);
});
</script>

<style scoped>
.onec-page {
  padding: 0 0 40px;
  min-width: 0;
  max-width: 100%;
  overflow-x: clip;
}

.onec-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

.onec-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  flex: 1 1 280px;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
  --onec-filter-control-height: 48px;
}

.onec-search {
  flex: 1 1 260px;
  min-width: 0;
}

.onec-search :deep(.rr-search-input) {
  min-height: var(--onec-filter-control-height);
}

.onec-status-filter {
  flex: 0 1 220px;
  min-width: 0;
  max-width: 280px;
  height: var(--onec-filter-control-height);
}

.onec-status-filter :deep(.rr-multi-select),
.onec-status-filter :deep(.rr-multi-select__trigger),
.onec-status-filter :deep(.rr-multi-select__value) {
  width: 100%;
  min-width: 0;
  max-width: 100%;
}

.onec-status-filter :deep(.rr-multi-select__trigger) {
  min-height: 0;
  height: 100%;
}

.onec-filters .onec-btn--primary {
  height: var(--onec-filter-control-height);
  padding: 0 16px;
  border-radius: 10px;
  font-size: 14px;
}

.onec-alert {
  padding: 12px 16px;
  border-radius: 10px;
  font-size: 14px;
  flex: 1 1 100%;
  width: 100%;
  box-sizing: border-box;
}

.onec-alert--error {
  background: var(--russ-error-light, #fee2e2);
  color: var(--russ-error, #b91c1c);
  border: 1px solid #fecaca;
}

.onec-table-panel {
  overflow: hidden;
  min-height: 300px;
}

.onec-table-panel :deep(.table-container) {
  margin-top: 0;
}

.onec-table-panel :deep(.base-table) {
  table-layout: fixed;
  width: 100%;
}

.onec-table-panel :deep(.base-table th),
.onec-table-panel :deep(.base-table td) {
  vertical-align: middle;
  overflow: hidden;
}

.onec-table-panel :deep(.onec-col-fio) {
  width: 17%;
  min-width: 140px;
}

.onec-table-panel :deep(.onec-col-phone) {
  width: 11%;
  min-width: 108px;
}

.onec-table-panel :deep(.onec-col-status) {
  width: 13%;
  min-width: 128px;
}

.onec-table-panel :deep(.onec-col-reason) {
  width: auto;
  min-width: 160px;
}

.onec-table-panel :deep(.onec-col-attempts) {
  width: 7%;
  min-width: 72px;
  text-align: center;
}

.onec-table-panel :deep(.onec-col-updated) {
  width: 12%;
  min-width: 118px;
}

.onec-table-panel :deep(.onec-col-actions) {
  width: 44px;
  min-width: 44px;
  max-width: 44px;
  padding-left: 6px;
  padding-right: 6px;
  text-align: center;
}

.onec-table-panel :deep(.table-row.onec-row) {
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.onec-table-panel :deep(.table-row.onec-row:hover) {
  background: var(--russ-bg-hover, #f4f4f5);
}

.onec-empty {
  padding: 32px 16px;
  text-align: center;
  color: var(--russ-text-tertiary);
  font-size: 15px;
}

.onec-cell-fio,
.onec-cell-phone {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  max-width: 100%;
}

.onec-cell-fio--loading,
.onec-cell-phone--loading,
.onec-reason--loading {
  opacity: 0.7;
}

.onec-cell-name {
  font-weight: 500;
  color: var(--russ-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
  flex: 1 1 auto;
}

.onec-inline-loader {
  flex-shrink: 0;
  color: var(--russ-accent, #2563eb);
  font-size: 12px;
}

.onec-cell-phone > span:first-child {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  letter-spacing: 0.03em;
}

.onec-cell-attempts,
.onec-cell-updated {
  display: block;
  white-space: nowrap;
  font-size: 13px;
  letter-spacing: 0.02em;
}

.onec-copy {
  flex-shrink: 0;
  opacity: 0;
  cursor: pointer;
  color: var(--russ-text-tertiary);
  font-size: 12px;
  transition: opacity 0.15s ease, color 0.15s ease;
}

.onec-cell-fio:hover .onec-copy,
.onec-cell-phone:hover .onec-copy {
  opacity: 1;
}

.onec-copy:hover {
  color: var(--russ-accent);
}

@media (hover: none), (pointer: coarse) {
  .onec-copy {
    opacity: 0.75;
  }
}

.onec-detail-meta-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.onec-type-chip {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.02em;
  line-height: 1.3;
  border-radius: 6px;
  white-space: nowrap;
  color: #334155;
  background: #f1f5f9;
}

.onec-type-chip--2 {
  color: #0f766e;
  background: #ccfbf1;
}

.onec-type-chip--3 {
  color: #1d4ed8;
  background: #dbeafe;
}

.onec-cell-muted {
  color: #94a3b8;
}

.onec-col-type {
  width: 72px;
  max-width: 88px;
}

.onec-reason {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
  color: var(--russ-text-secondary);
  line-height: 1.35;
  letter-spacing: 0.02em;
}

.onec-reason--error {
  color: var(--russ-error, #b91c1c);
}

.onec-reason--pending {
  color: #92400e;
}

.onec-reason--needs-resync {
  color: #9a3412;
}

.onec-row-actions {
  display: flex;
  align-items: center;
  justify-content: center;
}

.onec-menu-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 8px;
  background: transparent;
  color: var(--russ-text-tertiary);
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}

.onec-menu-trigger:hover,
.onec-menu-trigger--active {
  background: var(--russ-bg-hover);
  border-color: var(--russ-border);
  color: var(--russ-text-primary);
}

.onec-menu-trigger:focus-visible {
  outline: 2px solid var(--russ-accent);
  outline-offset: 2px;
}

.onec-menu-trigger:disabled {
  opacity: 0.65;
  cursor: wait;
}

.onec-context-menu-layer {
  position: fixed;
  inset: 0;
  z-index: 1190;
}

.onec-context-menu-backdrop {
  position: absolute;
  inset: 0;
  border: none;
  padding: 0;
  margin: 0;
  background: transparent;
  cursor: default;
}

.onec-context-menu {
  position: fixed;
  z-index: 1200;
  min-width: 188px;
  max-width: min(280px, calc(100vw - 24px));
  padding: 4px;
  border: 1px solid var(--russ-border);
  border-radius: 10px;
  background: var(--russ-bg);
  box-shadow: none;
}

.onec-context-menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  border: none;
  border-radius: 8px;
  background: none;
  text-align: left;
  font-size: 14px;
  color: var(--russ-text-primary);
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.onec-context-menu-item:hover:not(:disabled) {
  background: var(--russ-bg-hover);
}

.onec-context-menu-item:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.onec-context-menu-item i {
  flex-shrink: 0;
  font-size: 14px;
  color: var(--russ-text-tertiary);
}

.onec-context-menu-item--danger {
  color: var(--russ-error, #b91c1c);
}

.onec-context-menu-item--danger i {
  color: var(--russ-error, #b91c1c);
}

.onec-context-menu-item--danger:hover:not(:disabled) {
  background: var(--russ-error-light, #fee2e2);
}

.onec-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 36px;
  padding: 0 14px;
  border-radius: 8px;
  border: 1px solid transparent;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: background-color 0.15s ease, border-color 0.15s ease, opacity 0.15s ease;
}

.onec-btn--primary {
  background: var(--russ-accent-dark);
  color: var(--russ-text-inverse);
  border-color: var(--russ-accent-dark);
}

.onec-btn--primary:hover:not(:disabled) {
  background: var(--russ-secondary-dark);
  border-color: var(--russ-secondary-dark);
}

.onec-btn--edit {
  background: var(--russ-bg);
  color: var(--russ-accent);
  border-color: var(--russ-accent);
}

.onec-btn--edit:hover:not(:disabled) {
  background: color-mix(in srgb, var(--russ-accent) 8%, var(--russ-bg));
}

.onec-btn--ghost {
  background: var(--russ-bg);
  color: var(--russ-text-primary);
  border-color: var(--russ-border);
}

.onec-btn--ghost:hover:not(:disabled) {
  background: var(--russ-bg-hover);
}

.onec-btn--danger {
  background: var(--russ-bg);
  color: var(--russ-error, #b91c1c);
  border-color: #fecaca;
}

.onec-btn--danger:hover:not(:disabled) {
  background: var(--russ-error-light, #fee2e2);
  border-color: #fca5a5;
}

.onec-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.onec-spin {
  animation: onec-spin 0.8s linear infinite;
}

@keyframes onec-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.onec-detail-modal {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.onec-detail-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--russ-border);
}

.onec-detail-kicker {
  font-size: 12px;
  color: var(--russ-text-secondary);
  margin-bottom: 4px;
}

.onec-detail-name {
  font-size: 18px;
  font-weight: 600;
  color: var(--russ-text-primary);
}

.onec-detail-phone {
  margin-top: 4px;
  font-size: 14px;
  color: var(--russ-text-secondary);
}

.onec-detail-hint {
  padding: 12px 14px;
  border-radius: 10px;
  font-size: 13px;
  line-height: 1.5;
}

.onec-detail-hint--pending {
  background: #fffbeb;
  color: #92400e;
  border: 1px solid #fde68a;
}

.onec-detail-hint--info {
  background: var(--russ-bg-secondary, #f8f8f9);
  color: var(--russ-text-primary);
  border: 1px solid var(--russ-border);
}

.onec-detail-hint code {
  font-family: var(--russ-font-family-mono);
  font-size: 12px;
}

.onec-detail-footer {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
  width: 100%;
}

@media (max-width: 768px) {
  .onec-page {
    padding-bottom: 24px;
  }

  .onec-toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .onec-filters {
    flex: none;
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
    --onec-filter-control-height: 44px;
  }

  .onec-search,
  .onec-status-filter {
    flex: none;
    width: 100%;
    max-width: 100%;
  }

  .onec-search :deep(.rr-search-input),
  .onec-status-filter {
    width: 100%;
    max-width: 100%;
  }

  .onec-status-filter :deep(.rr-multi-select),
  .onec-status-filter :deep(.rr-multi-select__trigger) {
    width: 100%;
    max-width: 100%;
  }

  .onec-filters .onec-btn--primary {
    width: 100%;
    height: var(--onec-filter-control-height);
    justify-content: center;
  }

  .onec-btn--primary {
    width: 100%;
    justify-content: center;
  }

  .onec-table-panel :deep(.base-table) {
    table-layout: auto;
    width: 100%;
    min-width: 0;
  }

  .onec-table-panel :deep(.onec-col-fio) {
    width: auto;
    min-width: 0;
  }

  .onec-table-panel :deep(.onec-col-status) {
    width: auto;
    min-width: 108px;
  }

  .onec-table-panel :deep(.onec-col-actions) {
    width: 40px;
    min-width: 40px;
    max-width: 40px;
  }

  .onec-table-panel :deep(.base-table th),
  .onec-table-panel :deep(.base-table td) {
    padding: 10px 8px;
  }

  .onec-menu-trigger {
    width: 36px;
    height: 36px;
  }

  .onec-detail-head {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .onec-detail-footer {
    flex-direction: column;
    align-items: stretch;
  }

  .onec-detail-footer .onec-btn {
    width: 100%;
    height: 44px;
  }

  .onec-context-menu-backdrop {
    background: rgba(15, 23, 42, 0.24);
  }

  .onec-context-menu {
    left: 12px !important;
    right: 12px !important;
    width: auto;
    min-width: 0;
    max-width: none;
    border-radius: 14px 14px 0 0;
    padding-bottom: max(4px, env(safe-area-inset-bottom));
  }

  .onec-context-menu-item {
    min-height: 44px;
    padding: 12px 14px;
  }
}
</style>
