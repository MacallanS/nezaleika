<template>
  <div class="cards-root cards-root--warehouse">
  <CardsPageShell
    v-model="tab"
    :tabs="shellTabs"
    variant="warehouse"
    :refresh-loading="refreshLoading"
    :refresh-disabled="refreshDisabled"
    @refresh="refreshCurrentTab"
    @project-change="onShellProjectChange"
  >
    <p v-if="!cardsProjects.length && !pointsLoading" class="empty-hint">
      Нет доступных проектов с учётом карт.
    </p>

    <RrSegmentTabs
      v-if="isTransfersRoute"
      class="transfers-segments"
      :tabs="transfersSegmentTabs"
      :model-value="transfersSegment"
      aria-label="Передачи"
      @update:model-value="onTransfersSegment"
    />

    <!-- Остатки -->
    <CardsContentBlock
      v-if="tab === 'balances'"
      title="Остатки"
      lead="Склад и точки: на складе — карты в офисе, на точках — по последней инвентаризации (или номинал)."
    >
      <div class="balances-threshold">
        <div class="balances-threshold__row">
          <label class="balances-threshold__label" for="cards-balance-threshold">
            Минимум карт
          </label>
          <input
            id="cards-balance-threshold"
            v-model="thresholdDraft"
            type="number"
            min="1"
            inputmode="numeric"
            class="balances-threshold__input"
            placeholder="50"
          />
          <AuthRRButton
            type="button"
            variant="brand-primary"
            class="balances-threshold__apply"
            label="Применить"
            :disabled="!canApplyThreshold"
            @click="applyThreshold"
          />
        </div>
        <p class="balances-threshold__hint">
          Ниже порога (<b>{{ threshold }}</b>) — точка подсветится: пора пополнить.
        </p>
      </div>

      <div
        v-if="pointsLoading || balancesLoading || centralLoading"
        class="balances-list balances-list--loading"
      >
        Загрузка остатков…
      </div>
      <ul
        v-else
        class="balances-list"
        aria-label="Остатки на складе и точках"
      >
        <li class="balances-list__row balances-list__row--warehouse">
          <span class="balances-list__name">
            Склад
            <span class="balances-list__meta">
              {{ warehouseBoxCount }} кор.<template v-if="manualBoxCount"> · {{ manualBoxCount }} без накладной</template>
            </span>
          </span>
          <span class="balances-list__balance" title="Карты в офисе (коробки in_central)">
            <b>{{ warehouseCards }}</b>
            <span class="balances-list__unit">карт</span>
          </span>
        </li>
        <li
          v-for="item in balanceRows"
          :key="item.id"
          class="balances-list__row"
          :class="{ 'balances-list__row--low': item.isLow }"
        >
          <span class="balances-list__name">{{ item.name }}</span>
          <span class="balances-list__balance" :title="item.isLow ? `Меньше порога (${threshold} карт)` : undefined">
            <b>{{ item.balance }}</b>
            <span class="balances-list__unit">карт</span>
            <i v-if="item.isLow" class="pi pi-arrow-down low-flag" aria-hidden="true" />
          </span>
        </li>
      </ul>
      <p v-if="!pointsLoading && !balancesLoading && !balanceRows.length" class="hint">
        Нет точек выбранного проекта
      </p>

      <div class="balances-actions">
        <AuthRRButton
          type="button"
          variant="brand-primary"
          label="Новая коробка"
          @click="manualBoxOpen = true"
        />
        <AuthRRButton
          variant="neutral-secondary"
          label="QR коробок"
          @click="goQrLabelsPage"
        />
      </div>
    </CardsContentBlock>

    <!-- Отправка -->
    <CardsContentBlock
      v-if="tab === 'send'"
      title="Отправка на точку"
      lead="Склад → точка: выберите коробки в офисе и точку назначения. Приёмка коробок — через API."
    >
      <div class="send-form send-form--huge">
        <div class="send-form__select-block">
          <label class="send-form__label" @click.prevent="openSelectFromLabel">Точка</label>
          <RrMultiSelect
            class="send-form__huge-select"
            :model-value="sendLocation ?? ''"
            :options="pointOptions"
            option-label="name"
            option-value="location"
            placeholder="Выберите точку"
            :multiple="false"
            :searchable="true"
            sheet-title="Точка"
            @update:model-value="onSendLocation"
          />
        </div>

        <div class="send-form__select-block">
          <label class="send-form__label">
            Коробки в офисе ({{ centralBoxes.length }})
          </label>
          <p v-if="centralLoading" class="hint">Загрузка коробок…</p>
          <CardsBoxPicker
            v-else
            :model-value="selectedBoxIds"
            :boxes="centralBoxes"
            multiple
            scan-label="Добавить коробку по QR"
            empty-text="В офисе нет коробок — приёмка идёт через API (вкладка «Приёмка / списание»)."
            @update:model-value="onSelectedBoxesFromPicker"
          />
        </div>
      </div>

      <template #footer>
        <div class="field-sticky-footer">
          <AuthRRButton
            variant="brand-primary"
            :label="sendLoading ? 'Отправляем…' : `Отправить (${selectedBoxIds.length} кор. / ${selectedCapacity} карт)`"
            :loading="sendLoading"
            :disabled="sendLoading || !selectedBoxIds.length || !sendLocation"
            @click="doSend"
          />
        </div>
      </template>
    </CardsContentBlock>

    <!-- Партии: трекинг / отмена; приём только на точке -->
    <CardsContentBlock
      v-if="tab === 'shipments'"
      title="Партии"
      lead="Статусы отправок со склада. Принять партию можно только на точке."
    >
      <div class="send-form__select-block shipment-status-filter">
        <label class="send-form__label" @click.prevent="openSelectFromLabel">Статус</label>
        <RrMultiSelect
          class="send-form__huge-select"
          :model-value="shipmentStatus"
          :options="shipmentStatusOptions"
          option-label="label"
          option-value="value"
          placeholder="Статус"
          :multiple="false"
          :disabled="shipmentsLoading"
          sheet-title="Статус"
          @update:model-value="setShipmentStatus"
        />
      </div>

      <p v-if="shipmentsLoading" class="hint">Загрузка партий…</p>
      <ul v-else-if="shipments.length" class="ship-list" role="list" aria-label="Партии">
        <li v-for="item in shipments" :key="item.id" class="ship-row">
          <div class="ship-row__info">
            <span class="ship-row__id">#{{ item.id }}</span>
            <span class="ship-row__name">{{ pointName(item.to_location_external_id) }}</span>
            <span class="ship-row__qty">{{ item.units_count ?? '—' }} карт · {{ statusLabel(item.status) }}</span>
          </div>
          <AuthRRButton
            v-if="item.status === 'pending_accept'"
            variant="neutral-secondary"
            :label="shipmentActionId === item.id ? 'Отмена…' : 'Отменить'"
            :loading="shipmentActionId === item.id"
            :disabled="shipmentActionId != null"
            @click="cancelShipmentRow(item.id)"
          />
        </li>
      </ul>
      <p v-else class="hint">Партий нет</p>
    </CardsContentBlock>

    <div v-if="tab === 'util'">
      <CardsUtilConfirmSection
        :pending="pendingUtils"
        :loading="utilsLoading"
        :action-id="utilActionId"
        :action-kind="utilActionKind"
        @confirm="doConfirmUtil"
        @reject="doRejectUtil"
      />
    </div>

    <CardsContentBlock
      v-if="tab === 'report'"
      title="Склад"
      lead="Где карты сейчас, последние списания и приёмки. Досье — ниже, если есть данные."
      wide
    >
      <CardsAnalyticsSection
        :loading="analyticsLoading"
        :data="analytics"
        @refresh="loadAnalytics"
      />
      <CardsReportSection
        :report="report"
        :report-loading="reportLoading"
        :report-preset="reportPreset"
        :point-name="pointName"
        :exporting="exportingReport"
        @preset-change="setReportPreset"
        @export="exportReport"
      />
    </CardsContentBlock>

    <CardsContentBlock
      v-if="tab === 'api'"
      title="Приёмка и списание API"
      lead="Журнал публичного API: что пришло в Excel и как обработалось (коробки и списания)."
      wide
    >
      <CardsPublicApiJournalSection
        :loading="publicApiCallsLoading"
        :rows="publicApiCalls"
        :partner="partner"
        @refresh="loadPublicApiCalls"
      />
    </CardsContentBlock>
  </CardsPageShell>

  <RrBottomSheet
    v-model="manualBoxOpen"
    title="Новая коробка"
    subtitle="Отсканируйте 3 карты из коробки и укажите, сколько карт внутри."
    height-mode="percent"
    :height-percent="92"
    placement="sheet"
    footer-layout="stack"
    :closing-locked="manualSaving"
  >
    <div class="manual-box manual-box--sheet">
      <div class="balances-threshold__row">
        <label class="balances-threshold__label" for="cards-manual-capacity">Карт в коробке</label>
        <input
          id="cards-manual-capacity"
          v-model="manualCapacity"
          type="number"
          min="3"
          inputmode="numeric"
          class="balances-threshold__input"
          placeholder="100"
        />
      </div>
      <div class="balances-threshold__row">
        <label class="balances-threshold__label" for="cards-manual-name">Название</label>
        <input
          id="cards-manual-name"
          v-model="manualName"
          type="text"
          maxlength="255"
          class="balances-threshold__input manual-box__name"
          placeholder="Необязательно"
        />
      </div>
      <CardScanInput
        default-mode="camera"
        :allowed-modes="['camera', 'hid']"
        start-label="Сканировать карту из коробки"
        :scanned-count="manualCodes.length"
        @decode="onManualScan"
      />
      <p class="balances-threshold__hint">Карты {{ manualCodes.length }} из 3</p>
      <CardsCodeChips :codes="manualCodes" @remove="removeManualCode" />
      <p v-if="manualError" class="scanner-error">{{ manualError }}</p>
    </div>
    <template #footer>
      <AuthRRButton
        type="button"
        variant="brand-primary"
        :label="manualSaving ? 'Создаём…' : 'Создать коробку'"
        :loading="manualSaving"
        :disabled="!canCreateManualBox || manualSaving"
        @click="createManualFromSheet"
      />
    </template>
  </RrBottomSheet>

  </div>
</template>

<script setup lang="ts">
import { computed, onActivated, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "#imports";
import {
  AuthRRButton,
  RrBottomSheet,
  RrMultiSelect,
  RrSegmentTabs,
  type RrSegmentTab,
} from "bibli/shared/ui/rr";
import CardsPageShell from "./CardsPageShell.vue";
import CardsContentBlock from "./CardsContentBlock.vue";
import CardsReportSection from "./CardsReportSection.vue";
import CardsUtilConfirmSection from "./sections/CardsUtilConfirmSection.vue";
import CardsAnalyticsSection from "./sections/CardsAnalyticsSection.vue";
import CardsPublicApiJournalSection from "./sections/CardsPublicApiJournalSection.vue";
import CardsBoxPicker from "./CardsBoxPicker.vue";
import CardScanInput from "./CardScanInput.vue";
import CardsCodeChips from "./CardsCodeChips.vue";
import { useCardsBackOffice } from "../composables/useCardsBackOffice";
import {
  duplicateCardScanMessage,
  scanListHasCode,
} from "../composables/cardsScanCode";
import {
  cardsDraftKey,
  clearCardsDraft,
  loadCardsDraft,
  saveCardsDraft,
} from "../composables/cardsScanDraft";
import { useCardsNotify } from "../composables/useCardsNotify";
import { createManualBox, type CardShipmentStatus } from "@/pages/cards/api";
import "./cards-shared.css";

type TabKey = "balances" | "send" | "shipments" | "util" | "report" | "api";
type RouteTabKey = TabKey | "transfers";

const TAB_KEYS: TabKey[] = ["balances", "send", "shipments", "util", "report", "api"];

const tabs = computed(() =>
  TAB_KEYS.map((key) => ({
    key,
    label: (
      {
        balances: "Остатки",
        send: "Отправка",
        shipments: "Партии",
        util: "Утиль",
        report: "Склад",
        api: "Приёмка / списание",
      } as const
    )[key],
  })),
);

const props = defineProps<{
  /** Фиксированная вкладка с канонического URL реестра (мобильный таббар). */
  routeTab?: RouteTabKey;
}>();

const route = useRoute();
const router = useRouter();

const isTransfersRoute = computed(() => props.routeTab === "transfers");

const shellTabs = computed(() => (props.routeTab ? [] : tabs.value));

const transfersSegmentTabs: RrSegmentTab[] = [
  { id: "send", label: "Создать" },
  { id: "shipments", label: "В пути" },
];

const parseTab = (value: unknown): TabKey => {
  // Убранные вкладки → ближайший смысл.
  if (value === "writeoff" || value === "receive") return "api";
  if (value === "analytics") return "report";
  if (value === "transfers") return "send";
  if (typeof value === "string" && TAB_KEYS.includes(value as TabKey)) {
    return value as TabKey;
  }
  return "balances";
};

function initialTabFromRoute(): TabKey {
  if (props.routeTab === "transfers") {
    const focus = String(route.query.focus || "");
    return focus === "shipments" ? "shipments" : "send";
  }
  if (props.routeTab && props.routeTab !== "transfers") {
    return props.routeTab;
  }
  return parseTab(route.query.tab);
}

const tab = ref<TabKey>(initialTabFromRoute());

const transfersSegment = computed(() =>
  tab.value === "shipments" ? "shipments" : "send",
);

function onTransfersSegment(id: string) {
  if (id === "shipments" || id === "send") {
    tab.value = id;
    void router.replace({
      query: { ...route.query, focus: id === "shipments" ? "shipments" : "send" },
    });
  }
}

const manualBoxOpen = ref(false);

const statusLabel = (status: CardShipmentStatus) =>
  ({ pending_accept: "В пути", accepted: "Принята на точке", cancelled: "Отменена" })[status] || status;

const shipmentStatusOptions = [
  { value: "pending_accept", label: "В пути" },
  { value: "accepted", label: "Принятые на точке" },
  { value: "cancelled", label: "Отменённые" },
  { value: "", label: "Все" },
];

const {
  cardsProjects,
  onProjectChange,
  points,
  pointsLoading,
  balances,
  balancesLoading,
  threshold,
  belowThresholdLocations,
  centralBoxes,
  centralLoading,
  selectedBoxIds,
  selectedCapacity,
  sendLocation,
  sendLoading,
  shipments,
  shipmentsLoading,
  shipmentStatus,
  shipmentActionId,
  report,
  reportLoading,
  reportPreset,
  exportingReport,
  exportReport,
  pointName,
  loadBalances,
  loadCentralBoxes,
  doSend,
  loadShipments,
  cancelShipmentRow,
  loadReport,
  setReportPreset,
  pendingUtils,
  utilsLoading,
  utilActionId,
  utilActionKind,
  loadPendingUtils,
  doConfirmUtil,
  doRejectUtil,
  analytics,
  analyticsLoading,
  loadAnalytics,
  publicApiCalls,
  publicApiCallsLoading,
  loadPublicApiCalls,
  partner,
  reloadTabData,
  loadCardsProjects,
} = useCardsBackOffice();

const goQrLabelsPage = () => {
  void router.push("/cards/qr-labels/");
};

const pointOptions = computed(() => points.value);

const thresholdDraft = ref(String(threshold.value));
watch(
  threshold,
  (value) => {
    thresholdDraft.value = String(value);
  },
  { flush: "sync" },
);

const canApplyThreshold = computed(() => {
  const parsed = Number(thresholdDraft.value);
  return Number.isFinite(parsed) && parsed > 0 && parsed !== threshold.value;
});

const applyThreshold = () => {
  const parsed = Number(thresholdDraft.value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    thresholdDraft.value = String(threshold.value);
    return;
  }
  threshold.value = parsed;
};

const balanceRows = computed(() =>
  points.value.map((point) => ({
    id: point.id,
    name: point.name,
    balance: balances.value[point.location] ?? 0,
    isLow: belowThresholdLocations.value.includes(point.location),
  })),
);

const warehouseCards = computed(() =>
  centralBoxes.value.reduce((sum, box) => sum + Number(box.capacity ?? 0), 0),
);

const warehouseBoxCount = computed(() => centralBoxes.value.length);

const manualBoxCount = computed(
  () => centralBoxes.value.filter((box) => box.meta?.codes_initialized === false).length,
);

const { notifyError, notifyOk, notifyWarn } = useCardsNotify();
const manualCapacity = ref("100");
const manualName = ref("");
const manualCodes = ref<string[]>([]);
const manualError = ref("");
const manualSaving = ref(false);

const manualDraftKey = () => cardsDraftKey("manual-box", partner.value);

const persistManualDraft = () => {
  const key = manualDraftKey();
  if (!manualCodes.value.length && !manualName.value.trim() && manualCapacity.value === "100") {
    clearCardsDraft(key);
    return;
  }
  saveCardsDraft(key, {
    codes: [...manualCodes.value],
    capacity: manualCapacity.value,
    name: manualName.value,
  });
};

const restoreManualDraft = () => {
  const draft = loadCardsDraft<{
    codes?: string[];
    capacity?: string;
    name?: string;
  }>(manualDraftKey());
  if (!draft) return;
  if (Array.isArray(draft.codes) && draft.codes.length) {
    manualCodes.value = draft.codes.map(String).filter(Boolean).slice(0, 3);
  }
  if (draft.capacity) manualCapacity.value = String(draft.capacity);
  if (draft.name != null) manualName.value = String(draft.name);
};

watch([manualCodes, manualCapacity, manualName], () => persistManualDraft(), { deep: true });
onMounted(() => restoreManualDraft());

const canCreateManualBox = computed(() => {
  const capacity = Number(manualCapacity.value);
  return manualCodes.value.length === 3 && Number.isFinite(capacity) && capacity >= 3;
});

const onManualScan = (raw: string) => {
  manualError.value = "";
  const value = raw.trim();
  if (!value) return;
  if (/^(?:CARDBOX|BOX):\d+$/i.test(value)) {
    manualError.value =
      "Это QR коробки (CARDBOX), а не карты. Откройте коробку и сканируйте QR трёх карт изнутри.";
    notifyWarn(manualError.value, "Неверный QR");
    return;
  }
  if (scanListHasCode(manualCodes.value, value)) {
    manualError.value = duplicateCardScanMessage(value);
    notifyWarn(manualError.value, "Повторный скан");
    return;
  }
  if (manualCodes.value.length >= 3) {
    manualError.value =
      "Уже отсканированы 3 карты — столько нужно для ручной коробки. Уберите лишнюю из списка, если ошиблись.";
    notifyWarn(manualError.value, "Лимит");
    return;
  }
  manualCodes.value = [...manualCodes.value, value];
};

const removeManualCode = (code: string) => {
  manualCodes.value = manualCodes.value.filter((item) => item !== code);
  manualError.value = "";
};

const createManual = async () => {
  if (!canCreateManualBox.value || manualSaving.value) return;
  manualSaving.value = true;
  manualError.value = "";
  try {
    const created = await createManualBox(
      manualCodes.value,
      Number(manualCapacity.value),
      manualName.value,
      partner.value,
    );
    notifyOk(`Коробка #${created.box_id} создана, ${created.capacity} карт. Черновик очищен.`);
    manualCodes.value = [];
    manualName.value = "";
    clearCardsDraft(manualDraftKey());
    await Promise.all([loadCentralBoxes(), loadBalances()]);
    return true;
  } catch (error: unknown) {
    manualError.value = notifyError(
      error,
      "Не удалось создать коробку. Отсканированные карты сохранены локально — можно исправить и повторить.",
    );
    return false;
  } finally {
    manualSaving.value = false;
  }
};

const createManualFromSheet = async () => {
  const ok = await createManual();
  if (ok) manualBoxOpen.value = false;
};

const onShellProjectChange = async () => {
  await onProjectChange(tab.value);
  if (isTransfersRoute.value) {
    await reloadTabData(tab.value === "shipments" ? "shipments" : "send");
  }
};

/** Label не labelable для кастомного select — клик вручную открывает RrMultiSelect. */
function openSelectFromLabel(event: Event) {
  const label = event.currentTarget as HTMLElement | null;
  const block = label?.closest(".send-form__select-block");
  block?.querySelector<HTMLElement>(".rr-multi-select")?.click();
}

const onSendLocation = (value: string | number | Array<string | number>) => {
  const next = Array.isArray(value) ? value[0] : value;
  sendLocation.value = next == null || next === "" ? null : String(next);
};

const onSelectedBoxesFromPicker = (value: number | number[] | null) => {
  selectedBoxIds.value = Array.isArray(value)
    ? value.filter((n) => Number.isFinite(n))
    : value == null
      ? []
      : [value];
};

const setShipmentStatus = async (status: string | number | Array<string | number>) => {
  const value = Array.isArray(status) ? status[0] : status;
  shipmentStatus.value = String(value ?? "") as CardShipmentStatus | "";
  await loadShipments();
};

const refreshLoading = computed(() => {
  switch (tab.value) {
    case "balances":
      return balancesLoading.value || pointsLoading.value || centralLoading.value;
    case "send":
      return centralLoading.value;
    case "shipments":
      return shipmentsLoading.value;
    case "util":
      return utilsLoading.value;
    case "report":
      return reportLoading.value || analyticsLoading.value;
    case "api":
      return publicApiCallsLoading.value;
    default:
      return false;
  }
});

const refreshDisabled = computed(() => refreshLoading.value);

const refreshCurrentTab = async () => {
  await reloadTabData(tab.value);
};

const syncTabInUrl = async (value: TabKey) => {
  if (props.routeTab) return;
  if (route.query.tab !== value) {
    await router.replace({ query: { ...route.query, tab: value } });
  }
};

watch(tab, async (value) => {
  await syncTabInUrl(value);
  // При каждом заходе на вкладку — свежие данные (без ручного «Обновить»).
  await reloadTabData(value);
});

watch(
  () => [props.routeTab, route.query.tab, route.query.focus] as const,
  () => {
    const parsed = initialTabFromRoute();
    if (tab.value !== parsed) {
      tab.value = parsed;
    }
  },
);

onMounted(async () => {
  await loadCardsProjects();
  if (
    !props.routeTab &&
    (typeof route.query.tab !== "string" || !TAB_KEYS.includes(route.query.tab as TabKey))
  ) {
    await syncTabInUrl(tab.value);
  }
  await reloadTabData(tab.value);
});

onActivated(async () => {
  const parsed = initialTabFromRoute();
  if (tab.value !== parsed) {
    tab.value = parsed;
    return; // reload сделает watch(tab)
  }
  await reloadTabData(tab.value);
});
</script>

<style scoped>
.cards-root--warehouse {
  padding-bottom: calc(12px + var(--app-mobile-tabbar-content-inset, env(safe-area-inset-bottom, 0px)));
}

.transfers-segments {
  width: fit-content;
  max-width: 100%;
  margin-bottom: 4px;
}

.balances-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
}

.balances-actions :deep(.auth-rr-button) {
  width: 100%;
}

.manual-box--sheet {
  margin-top: 0;
  padding-top: 0;
  border-top: none;
  gap: 12px;
}

.ship-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.ship-row__info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1 1 160px;
}

.ship-row__id {
  font-size: 12px;
  font-weight: 600;
  color: var(--rr-labels-neutral-secondary, #5f6673);
}

.ship-row__name {
  font-size: 15px;
  font-weight: 700;
  color: var(--rr-input-text-default, #101012);
}

.ship-row__qty {
  font-size: 13px;
  color: var(--rr-labels-neutral-secondary, #5f6673);
}

.tag--partial {
  margin-left: 6px;
  font-size: 0.75rem;
  color: #9a3412;
  background: #ffedd5;
  padding: 1px 6px;
  border-radius: 4px;
}

.manual-box {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--rr-input-border-default, #e5e7eb);
}

.manual-box__title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.25;
}

.manual-box__name {
  width: min(100%, 280px);
}

.send-form--huge {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}
.send-form__select-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}
.send-form__label {
  font-size: 13px;
  font-weight: 600;
  color: var(--rr-labels-neutral-secondary, #5f6673);
  cursor: pointer;
  width: fit-content;
}
.send-form__huge-select {
  width: 100%;
  max-width: 100%;
}
.send-form__huge-select :deep(.rr-multi-select),
.shipment-status-filter :deep(.rr-multi-select),
.shipment-status-filter {
  width: 100%;
  max-width: 100%;
}

</style>
