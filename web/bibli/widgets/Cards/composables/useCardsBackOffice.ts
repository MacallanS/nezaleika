import { ref, computed, watch, onMounted } from "vue";
import {
  fetchCentralBoxes,
  sendBoxes,
  fetchShipments,
  cancelShipment,
  fetchBalances,
  returnDossiers,
  fetchCardsReport,
  exportCardsReport,
  fetchPendingUtils,
  confirmUtil,
  rejectUtil,
  fetchCardsAnalytics,
  fetchPublicApiCalls,
  type CardBox,
  type CardShipment,
  type CardShipmentStatus,
  type BalancesMap,
  type DossierReturnResult,
  type CardsReport,
  type CardUtilRow,
  type CardPublicApiCall,
} from "@/pages/cards/api";

import { duplicateCardScanMessage, scanListHasCode } from "./cardsScanCode";
import {
  cardsDraftKey,
  clearCardsDraft,
  loadCardsDraft,
  saveCardsDraft,
} from "./cardsScanDraft";
import { useCardsNotify } from "./useCardsNotify";
import { useCardsProjectScope } from "./useCardsProjectScope";

/** Пресет периода отчёта. */
type ReportPreset = "4w" | "8w" | "quarter" | "all";

export type BackOfficeTabKey =
  | "balances"
  | "send"
  | "shipments"
  | "util"
  | "report"
  | "api";

/** Back-office коробочной модели: остатки, приёмка коробок, отправка, партии, возврат досье, потери. */
export function useCardsBackOffice() {
  const { notifyError, notifyWarn, notifyOk } = useCardsNotify();
  const {
    cardsProjects,
    selectedProjectId,
    partner,
    points,
    loading: projectsLoading,
    ensureCardsProjectsLoaded,
  } = useCardsProjectScope();

  const balances = ref<BalancesMap>({});
  const balancesLoading = ref(false);
  const threshold = ref(50);

  // отправка коробок (приёмка — только API)
  const centralBoxes = ref<CardBox[]>([]);
  const centralLoading = ref(false);
  const selectedBoxIds = ref<number[]>([]);
  const sendLocation = ref<string | null>(null);
  const sendLoading = ref(false);

  const shipments = ref<CardShipment[]>([]);
  const shipmentsLoading = ref(false);
  const shipmentStatus = ref<CardShipmentStatus | "">("pending_accept");
  const shipmentActionId = ref<number | null>(null);

  const returnCodes = ref<string[]>([]);
  const returnResult = ref<DossierReturnResult | null>(null);
  const returnLoading = ref(false);

  const report = ref<CardsReport | null>(null);
  const reportLoading = ref(false);
  const reportPreset = ref<ReportPreset>("8w");

  const pointName = (location: string) =>
    points.value.find((p) => p.location === location)?.name || location;

  const belowThresholdLocations = computed(() =>
    points.value
      .filter((p) => (balances.value[p.location] ?? 0) < threshold.value)
      .map((p) => p.location),
  );

  const selectedCapacity = computed(() =>
    centralBoxes.value
      .filter((b) => selectedBoxIds.value.includes(b.id))
      .reduce((sum, b) => sum + (b.capacity || 0), 0),
  );

  const loadCardsProjects = async () => {
    try {
      await ensureCardsProjectsLoaded();
    } catch (error) {
      notifyError(error);
    }
  };

  const loadedTabKeys = ref(new Set<string>());
  const tabLoadKey = (tab: BackOfficeTabKey) => `${tab}:${selectedProjectId.value ?? "none"}`;

  const markTabLoaded = (cacheKey: string) => {
    const next = new Set(loadedTabKeys.value);
    next.add(cacheKey);
    loadedTabKeys.value = next;
  };

  const invalidateTabCache = () => {
    loadedTabKeys.value = new Set();
  };

  const ensureTabData = async (tab: BackOfficeTabKey, options?: { force?: boolean }) => {
    const force = options?.force ?? false;
    const cacheKey = tabLoadKey(tab);
    if (!force && loadedTabKeys.value.has(cacheKey)) {
      return;
    }

    switch (tab) {
      case "balances":
        await Promise.all([loadBalances(), loadCentralBoxes()]);
        break;
      case "send":
        await loadCentralBoxes();
        break;
      case "shipments":
        await loadShipments();
        break;
      case "util":
        await loadPendingUtils();
        break;
      case "report":
        await Promise.all([loadReport(), loadAnalytics()]);
        break;
      case "api":
        await loadPublicApiCalls();
        break;
    }

    markTabLoaded(cacheKey);
  };

  const reloadTabData = async (tab: BackOfficeTabKey) => {
    const next = new Set(loadedTabKeys.value);
    next.delete(tabLoadKey(tab));
    loadedTabKeys.value = next;
    await ensureTabData(tab, { force: true });
  };

  const onProjectChange = async (activeTab?: BackOfficeTabKey) => {
    selectedBoxIds.value = [];
    sendLocation.value = null;
    report.value = null;
    analytics.value = null;
    publicApiCalls.value = [];
    invalidateTabCache();
    if (activeTab) {
      await ensureTabData(activeTab, { force: true });
    }
  };

  const loadBalances = async () => {
    const locations = points.value.map((p) => p.location);
    if (!locations.length) {
      balances.value = {};
      return;
    }
    balancesLoading.value = true;
    try {
      balances.value = await fetchBalances(locations, partner.value);
    } catch (error) {
      notifyError(error);
    } finally {
      balancesLoading.value = false;
    }
  };

  const loadCentralBoxes = async () => {
    centralLoading.value = true;
    try {
      centralBoxes.value = await fetchCentralBoxes(partner.value);
      // отфильтровать выбор от исчезнувших коробок
      selectedBoxIds.value = selectedBoxIds.value.filter((id) =>
        centralBoxes.value.some((b) => b.id === id),
      );
    } catch (error) {
      notifyError(error);
    } finally {
      centralLoading.value = false;
    }
  };

  const toggleBox = (id: number) => {
    selectedBoxIds.value = selectedBoxIds.value.includes(id)
      ? selectedBoxIds.value.filter((x) => x !== id)
      : [...selectedBoxIds.value, id];
  };

  const doSend = async () => {
    if (!sendLocation.value) {
      notifyWarn("Куда отправляем?", "Выберите точку");
      return;
    }
    if (!selectedBoxIds.value.length) {
      notifyWarn("Отметьте коробки к отправке", "Выберите коробки");
      return;
    }
    sendLoading.value = true;
    try {
      await sendBoxes(sendLocation.value, selectedBoxIds.value, partner.value);
      notifyOk(`Отправлено коробок: ${selectedBoxIds.value.length} → ${pointName(sendLocation.value)}`);
      selectedBoxIds.value = [];
      await Promise.all([loadCentralBoxes(), loadShipments(), loadBalances()]);
    } catch (error) {
      notifyError(error);
    } finally {
      sendLoading.value = false;
    }
  };

  const loadShipments = async () => {
    shipmentsLoading.value = true;
    try {
      shipments.value = await fetchShipments(
        shipmentStatus.value
          ? { status: shipmentStatus.value, partner: partner.value }
          : { partner: partner.value },
      );
    } catch (error) {
      notifyError(error);
    } finally {
      shipmentsLoading.value = false;
    }
  };

  const cancelShipmentRow = async (id: number) => {
    shipmentActionId.value = id;
    try {
      await cancelShipment(id);
      notifyOk("Партия отменена");
      await Promise.all([loadShipments(), loadCentralBoxes(), loadBalances()]);
    } catch (error) {
      notifyError(error);
    } finally {
      shipmentActionId.value = null;
    }
  };

  const returnsDraftKey = () => cardsDraftKey("returns", partner.value);

  const persistReturnsDraft = () => {
    const key = returnsDraftKey();
    if (!returnCodes.value.length) {
      clearCardsDraft(key);
      return;
    }
    saveCardsDraft(key, { codes: [...returnCodes.value] });
  };

  const restoreReturnsDraft = () => {
    const draft = loadCardsDraft<{ codes?: string[] }>(returnsDraftKey());
    if (!draft?.codes?.length) return;
    returnCodes.value = draft.codes.map(String).filter(Boolean);
  };

  watch(returnCodes, () => persistReturnsDraft(), { deep: true });
  onMounted(() => restoreReturnsDraft());

  const addReturnCode = (rawCode: string) => {
    const code = rawCode.trim();
    if (!code) return;
    if (scanListHasCode(returnCodes.value, code)) {
      notifyWarn(duplicateCardScanMessage(code), "Повторный скан");
      return;
    }
    returnCodes.value = [code, ...returnCodes.value];
  };

  const removeReturnCode = (code: string) => {
    returnCodes.value = returnCodes.value.filter((c) => c !== code);
  };

  const submitReturns = async () => {
    if (!returnCodes.value.length) return;
    returnLoading.value = true;
    try {
      returnResult.value = await returnDossiers(returnCodes.value, partner.value);
      notifyOk(`Возвращено досье: ${returnResult.value.returned.length}`);
      returnCodes.value = [];
      clearCardsDraft(returnsDraftKey());
    } catch (error) {
      notifyError(
        error,
        "Не удалось вернуть досье. Список карт сохранён локально — можно повторить.",
      );
    } finally {
      returnLoading.value = false;
    }
  };

  // Начало периода по пресету (Y-m-d). 'all' → без нижней границы.
  const presetFrom = (preset: ReportPreset): string | undefined => {
    if (preset === "all") return undefined;
    const days = preset === "4w" ? 28 : preset === "8w" ? 56 : 90;
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().slice(0, 10);
  };

  const loadReport = async () => {
    reportLoading.value = true;
    try {
      report.value = await fetchCardsReport({
        from: presetFrom(reportPreset.value),
        partner: partner.value,
      });
    } catch (error) {
      notifyError(error);
    } finally {
      reportLoading.value = false;
    }
  };

  const setReportPreset = async (preset: ReportPreset) => {
    reportPreset.value = preset;
    await loadReport();
  };

  const exportingReport = ref(false);

  const exportReport = async () => {
    exportingReport.value = true;
    try {
      await exportCardsReport({
        from: presetFrom(reportPreset.value),
        partner: partner.value,
      });
    } catch (error) {
      notifyError(error);
    } finally {
      exportingReport.value = false;
    }
  };

  const pendingUtils = ref<CardUtilRow[]>([]);
  const utilsLoading = ref(false);
  const utilActionId = ref<number | null>(null);
  const utilActionKind = ref<"confirm" | "reject" | null>(null);

  const loadPendingUtils = async () => {
    utilsLoading.value = true;
    try {
      pendingUtils.value = await fetchPendingUtils(partner.value);
    } catch (error) {
      notifyError(error);
    } finally {
      utilsLoading.value = false;
    }
  };

  const doConfirmUtil = async (id: number) => {
    utilActionId.value = id;
    utilActionKind.value = "confirm";
    try {
      await confirmUtil(id);
      notifyOk("Утиль принят", "Утиль");
      await loadPendingUtils();
      await loadBalances();
    } catch (error) {
      notifyError(error);
    } finally {
      utilActionId.value = null;
      utilActionKind.value = null;
    }
  };

  const doRejectUtil = async (id: number, codes: string[]) => {
    utilActionId.value = id;
    utilActionKind.value = "reject";
    try {
      await rejectUtil(id, codes);
      notifyOk("Утиль отклонён, остаток возвращён", "Утиль");
      await loadPendingUtils();
      await loadBalances();
    } catch (error) {
      notifyError(error);
    } finally {
      utilActionId.value = null;
      utilActionKind.value = null;
    }
  };

  const analytics = ref<Record<string, unknown> | null>(null);
  const analyticsLoading = ref(false);
  const loadAnalytics = async () => {
    analyticsLoading.value = true;
    try {
      analytics.value = await fetchCardsAnalytics(partner.value);
    } catch (error) {
      notifyError(error);
    } finally {
      analyticsLoading.value = false;
    }
  };

  const publicApiCalls = ref<CardPublicApiCall[]>([]);
  const publicApiCallsLoading = ref(false);
  const loadPublicApiCalls = async () => {
    publicApiCallsLoading.value = true;
    try {
      publicApiCalls.value = await fetchPublicApiCalls(partner.value);
    } catch (error) {
      notifyError(error);
    } finally {
      publicApiCallsLoading.value = false;
    }
  };

  return {
    cardsProjects,
    selectedProjectId,
    onProjectChange,
    ensureTabData,
    reloadTabData,
    loadCardsProjects,
    points,
    pointsLoading: projectsLoading,
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
    toggleBox,
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
  };
}
