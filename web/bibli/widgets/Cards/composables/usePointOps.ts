import { computed, ref, watch } from "vue";
import {
  acceptShipment,
  fetchIncomingShipments,
  fetchBalances,
  fetchPointUtils,
  sendPointUtil,
  type CardShipment,
  type CardUtilRow,
} from "@/pages/cards/api";
import { useRoles } from "@/shared/composables/roles/useRoles";
import { duplicateCardScanMessage, scanListHasCode } from "./cardsScanCode";
import {
  cardsDraftKey,
  clearCardsDraft,
  loadCardsDraft,
  saveCardsDraft,
} from "./cardsScanDraft";
import { useCardsFieldPoint } from "./useCardsFieldPoint";
import { useCardsNotify } from "./useCardsNotify";
import { useCardsProjectScope } from "./useCardsProjectScope";

export function usePointOps() {
  const { notifyError, notifyWarn, notifyOk } = useCardsNotify();
  const { partner, ensureCardsProjectsLoaded } = useCardsProjectScope();
  const {
    isAdmin,
    isDirector,
    isAccountDirector,
    isSupportHead,
    isSupportManager,
  } = useRoles();
  const canPickAnyPoint = computed(
    () =>
      isAdmin.value ||
      isDirector.value ||
      isAccountDirector.value ||
      isSupportHead.value ||
      isSupportManager.value,
  );
  const field = useCardsFieldPoint({
    canPickAnyPoint: () => canPickAnyPoint.value,
    partner: () => partner.value,
  });

  const incoming = ref<CardShipment[]>([]);
  const incomingLoading = ref(false);
  const actionId = ref<number | null>(null);
  const onHand = ref<number | null>(null);

  const utilCodes = ref<string[]>([]);
  const utilSending = ref(false);
  const utilFlash = ref("");
  const utilError = ref("");
  const utilHistory = ref<CardUtilRow[]>([]);

  let skipUtilDraftPersist = false;

  const utilDraftKey = () => {
    const loc = field.pointContext.value?.location_external_id;
    if (!loc) return null;
    return cardsDraftKey("util", partner.value, loc);
  };

  const persistUtilDraft = () => {
    if (skipUtilDraftPersist) return;
    const key = utilDraftKey();
    if (!key) return;
    if (!utilCodes.value.length) {
      clearCardsDraft(key);
      return;
    }
    saveCardsDraft(key, { codes: [...utilCodes.value] });
  };

  const restoreUtilDraft = () => {
    const key = utilDraftKey();
    if (!key) return;
    const draft = loadCardsDraft<{ codes?: string[] }>(key);
    skipUtilDraftPersist = true;
    try {
      utilCodes.value = draft?.codes?.length
        ? draft.codes.map(String).filter(Boolean)
        : [];
      if (utilCodes.value.length) {
        utilFlash.value = `Восстановлен черновик утиля (${utilCodes.value.length})`;
      }
    } finally {
      skipUtilDraftPersist = false;
    }
  };

  watch(utilCodes, () => persistUtilDraft(), { deep: true });

  const loadIncoming = async () => {
    if (!field.pointContext.value) return;
    incomingLoading.value = true;
    try {
      incoming.value = await fetchIncomingShipments(
        field.pointContext.value.location_external_id,
        partner.value,
      );
    } finally {
      incomingLoading.value = false;
    }
  };

  const loadBalancesLocal = async () => {
    if (!field.pointContext.value) return;
    const bal = await fetchBalances(
      [field.pointContext.value.location_external_id],
      partner.value,
    );
    onHand.value = bal[field.pointContext.value.location_external_id] ?? null;
  };

  const loadUtils = async () => {
    if (!field.pointContext.value) return;
    utilHistory.value = await fetchPointUtils(
      field.pointContext.value.location_external_id,
      partner.value,
    );
  };

  const loadFieldData = async () => {
    await Promise.all([loadIncoming(), loadBalancesLocal(), loadUtils()]);
  };

  const accept = async (id: number) => {
    actionId.value = id;
    try {
      await acceptShipment(id);
      notifyOk("Партия принята на точке");
      await loadIncoming();
      await loadBalancesLocal();
    } catch (e: unknown) {
      notifyError(e, "Не удалось принять партию");
    } finally {
      actionId.value = null;
    }
  };

  const onUtilScan = (raw: string) => {
    utilError.value = "";
    if (/^(?:CARDBOX|BOX):/i.test(raw)) {
      const msg =
        "Это QR коробки (CARDBOX). Для утиля сканируйте QR самих карт — коробку добавить нельзя.";
      utilError.value = msg;
      notifyWarn(msg, "Неверный QR");
      return;
    }
    const code = raw.trim();
    if (!code) return;
    if (scanListHasCode(utilCodes.value, code)) {
      const msg = duplicateCardScanMessage(code);
      utilError.value = msg;
      notifyWarn(msg, "Повторный скан");
      return;
    }
    utilCodes.value = [...utilCodes.value, code];
  };

  const removeUtilCode = (code: string) => {
    utilCodes.value = utilCodes.value.filter((c) => c !== code);
  };

  const sendUtil = async () => {
    if (utilCodes.value.length < 1) {
      const msg = "Отсканируйте хотя бы одну карту";
      utilError.value = msg;
      notifyWarn(msg);
      return;
    }
    utilSending.value = true;
    utilError.value = "";
    utilFlash.value = "";
    try {
      await sendPointUtil(
        utilCodes.value,
        field.pointContext.value?.location_external_id,
        partner.value,
      );
      utilFlash.value = `Заявка на утиль (${utilCodes.value.length}) отправлена`;
      notifyOk(utilFlash.value, "Утиль");
      utilCodes.value = [];
      const key = utilDraftKey();
      if (key) clearCardsDraft(key);
      await loadUtils();
      await loadBalancesLocal();
    } catch (e: unknown) {
      const detail = notifyError(
        e,
        "Не удалось отправить утиль. Список отсканированных карт сохранён локально — можно повторить отправку.",
      );
      utilError.value = detail;
    } finally {
      utilSending.value = false;
    }
  };

  const selectPoint = async (location: string) => {
    await field.selectPoint(location);
    if (field.pointContext.value) {
      incoming.value = [];
      utilHistory.value = [];
      onHand.value = null;
      // Сначала восстановить черновик новой точки (не затирать [] до restore).
      restoreUtilDraft();
      if (!utilCodes.value.length) utilCodes.value = [];
      await loadFieldData();
    }
  };

  const bootstrap = async () => {
    try {
      await ensureCardsProjectsLoaded();
      const ok = await field.resolvePoint();
      if (ok && field.pointContext.value) {
        restoreUtilDraft();
        await loadFieldData();
      }
    } catch (e: any) {
      if (canPickAnyPoint.value) {
        field.needsPointPick.value = true;
        field.notBound.value = false;
        await field.loadPointOptions();
      } else {
        field.notBound.value = true;
      }
    }
  };

  const refreshLight = async () => {
    if (field.notBound.value || field.needsPointPick.value || !field.pointContext.value) {
      await bootstrap();
      return;
    }
    await Promise.all([loadIncoming(), loadBalancesLocal(), loadUtils()]);
  };

  return {
    notBound: field.notBound,
    needsPointPick: field.needsPointPick,
    pointContext: field.pointContext,
    pointOptions: field.pointOptions,
    pointsLoading: field.pointsLoading,
    canPickAnyPoint,
    selectPoint,
    incoming,
    incomingLoading,
    actionId,
    loadIncoming,
    accept,
    onHand,
    utilCodes,
    utilSending,
    utilFlash,
    utilError,
    utilHistory,
    onUtilScan,
    removeUtilCode,
    sendUtil,
    bootstrap,
    refreshLight,
  };
}
