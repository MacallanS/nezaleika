import { computed, ref, watch } from "vue";
import {
  fetchBoxesAtPoint,
  fetchInventoryStatus,
  performInventory,
  type CardBox,
  type InventoryResult,
  type InventoryStatus,
} from "@/pages/cards/api";
import { useRoles } from "@/shared/composables/roles/useRoles";
import {
  duplicateBoxScanMessage,
  duplicateCardScanMessage,
  scanListHasCode,
} from "./cardsScanCode";
import {
  cardsDraftKey,
  clearCardsDraft,
  loadCardsDraft,
  saveCardsDraft,
} from "./cardsScanDraft";
import { useCardsFieldPoint } from "./useCardsFieldPoint";
import { useCardsNotify } from "./useCardsNotify";
import { useCardsProjectScope } from "./useCardsProjectScope";

type InventoryScanDraft = {
  step: 1 | 2;
  closedBoxIds: number[];
  scannedCodes: string[];
};

function parseCardBoxId(raw: string): number | null {
  const m = raw.trim().match(/^(?:CARDBOX|BOX):(\d+)$/i);
  return m ? Number(m[1]) : null;
}

export function useStandInventory() {
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

  const boxes = ref<CardBox[]>([]);
  const step = ref<1 | 2>(1);
  const closedBoxIds = ref<number[]>([]);
  const openBoxId = ref<number | null>(null);
  const scannedCodes = ref<string[]>([]);
  const inventoryResult = ref<InventoryResult | null>(null);
  const inventoryStatus = ref<InventoryStatus | null>(null);
  const inventoryLoading = ref(false);
  const error = ref("");
  const scanFlash = ref("");

  /** Сдано с дедлайна текущей недели (пн 08:00 МСК). */
  const doneThisWeek = computed(() => {
    const status = inventoryStatus.value;
    if (!status?.last_inventory_at || !status.due_at) return false;
    const last = Date.parse(status.last_inventory_at);
    const due = Date.parse(status.due_at);
    if (!Number.isFinite(last) || !Number.isFinite(due)) return false;
    return last >= due;
  });

  const activeBoxes = computed(() =>
    boxes.value.filter((b) => b.state !== "depleted"),
  );

  const closedTargetHint = computed(() => {
    const n = activeBoxes.value.length;
    if (n <= 1) return 0;
    return n - 1;
  });

  const canSubmitInventory = computed(() => step.value === 2);

  const canGoNext = computed(() => {
    const n = activeBoxes.value.length;
    if (n === 0) return true;
    const closed = closedBoxIds.value.length;
    // все закрыты или одна оставлена как открытый пул карт
    return closed === n || closed === n - 1;
  });

  const openPoolLabel = computed(() => {
    const remaining = activeBoxes.value.filter((b) => !closedBoxIds.value.includes(b.id));
    if (remaining.length === 0) return "карты вне коробок";
    if (remaining.length === 1) {
      const box = remaining[0];
      const ref = box.external_ref ? ` · ${box.external_ref}` : "";
      return `пул #${box.id}${ref}`;
    }
    return `${remaining.length} коробки без CARDBOX`;
  });

  const flash = (msg: string) => {
    scanFlash.value = msg;
    window.setTimeout(() => {
      if (scanFlash.value === msg) scanFlash.value = "";
    }, 2200);
  };

  let skipDraftPersist = false;

  const draftKeyFor = (location?: string | null) => {
    const loc = location ?? field.pointContext.value?.location_external_id;
    if (!loc) return null;
    return cardsDraftKey("inventory", partner.value, loc);
  };

  const persistDraft = () => {
    if (skipDraftPersist) return;
    const key = draftKeyFor();
    if (!key) return;
    if (
      closedBoxIds.value.length === 0 &&
      scannedCodes.value.length === 0 &&
      step.value === 1
    ) {
      clearCardsDraft(key);
      return;
    }
    const draft: InventoryScanDraft = {
      step: step.value,
      closedBoxIds: [...closedBoxIds.value],
      scannedCodes: [...scannedCodes.value],
    };
    saveCardsDraft(key, draft);
  };

  const restoreDraft = (location: string) => {
    const key = draftKeyFor(location);
    if (!key) return;
    const draft = loadCardsDraft<InventoryScanDraft>(key);
    skipDraftPersist = true;
    try {
      if (!draft) {
        step.value = 1;
        closedBoxIds.value = [];
        openBoxId.value = null;
        scannedCodes.value = [];
        return;
      }
      step.value = draft.step === 2 ? 2 : 1;
      closedBoxIds.value = Array.isArray(draft.closedBoxIds)
        ? draft.closedBoxIds.filter((id) => Number.isFinite(id))
        : [];
      scannedCodes.value = Array.isArray(draft.scannedCodes)
        ? draft.scannedCodes.map(String).filter(Boolean)
        : [];
      openBoxId.value = null;
      if (closedBoxIds.value.length || scannedCodes.value.length) {
        flash("Восстановлен черновик сканов");
      }
    } finally {
      skipDraftPersist = false;
    }
  };

  const resetSteps = (opts?: { clearDraft?: boolean }) => {
    const key = draftKeyFor();
    skipDraftPersist = true;
    try {
      step.value = 1;
      closedBoxIds.value = [];
      openBoxId.value = null;
      scannedCodes.value = [];
      inventoryResult.value = null;
      error.value = "";
    } finally {
      skipDraftPersist = false;
    }
    if (opts?.clearDraft !== false && key) clearCardsDraft(key);
  };

  watch(
    [step, closedBoxIds, scannedCodes, () => field.pointContext.value?.location_external_id],
    () => persistDraft(),
    { deep: true },
  );

  const loadInventoryStatus = async () => {
    if (!field.pointContext.value) {
      inventoryStatus.value = null;
      return;
    }
    try {
      inventoryStatus.value = await fetchInventoryStatus(
        field.pointContext.value.location_external_id,
        partner.value,
      );
    } catch {
      inventoryStatus.value = null;
    }
  };

  const loadBoxes = async () => {
    if (!field.pointContext.value) return;
    boxes.value = await fetchBoxesAtPoint(
      field.pointContext.value.location_external_id,
      partner.value,
    );
  };

  const selectPoint = async (location: string) => {
    await field.selectPoint(location);
    if (field.pointContext.value) {
      inventoryResult.value = null;
      error.value = "";
      restoreDraft(field.pointContext.value.location_external_id);
      await Promise.all([loadBoxes(), loadInventoryStatus()]);
    }
  };

  const bootstrap = async () => {
    await ensureCardsProjectsLoaded();
    const ok = await field.resolvePoint();
    if (ok && field.pointContext.value) {
      restoreDraft(field.pointContext.value.location_external_id);
      await Promise.all([loadBoxes(), loadInventoryStatus()]);
    }
  };

  const refreshLight = async () => {
    if (field.notBound.value || field.needsPointPick.value || !field.pointContext.value) {
      await bootstrap();
      return;
    }
    try {
      await Promise.all([loadBoxes(), loadInventoryStatus()]);
    } catch {
      /* keep previous boxes */
    }
  };

  const setScanError = (msg: string) => {
    error.value = msg;
    notifyWarn(msg, "Скан");
  };

  const onClosedScan = (raw: string) => {
    error.value = "";
    const boxId = parseCardBoxId(raw);
    if (boxId == null) {
      setScanError("На этом шаге сканируйте QR коробки (CARDBOX:id)");
      return;
    }
    const box = activeBoxes.value.find((b) => b.id === boxId);
    if (!box) {
      setScanError(`Коробка #${boxId} не на этой точке`);
      return;
    }
    if (closedBoxIds.value.includes(boxId)) {
      const msg = duplicateBoxScanMessage(boxId);
      setScanError(msg);
      return;
    }
    closedBoxIds.value = [...closedBoxIds.value, boxId];
    flash(`Коробка #${boxId} добавлена`);
  };

  const removeClosed = (code: string) => {
    const id = parseCardBoxId(code) ?? Number(String(code).replace(/\D/g, ""));
    if (!Number.isFinite(id)) return;
    closedBoxIds.value = closedBoxIds.value.filter((x) => x !== id);
  };

  const goNext = () => {
    error.value = "";
    if (!canGoNext.value) {
      setScanError("Отсканируйте все закрытые коробки (одну можно оставить для карт)");
      return;
    }
    const remaining = activeBoxes.value.filter((b) => !closedBoxIds.value.includes(b.id));
    if (remaining.length > 1) {
      setScanError("Оставьте не больше одной коробки без CARDBOX — карты из неё сканируйте на шаге 2");
      return;
    }
    // open_box_id в API не шлём — свободный скан карт
    openBoxId.value = null;
    scannedCodes.value = [];
    step.value = 2;
  };

  const goBack = () => {
    step.value = 1;
    openBoxId.value = null;
    scannedCodes.value = [];
    error.value = "";
  };

  const onOpenScan = (raw: string) => {
    error.value = "";
    const boxId = parseCardBoxId(raw);
    if (boxId != null) {
      if (closedBoxIds.value.includes(boxId)) {
        setScanError(`Коробка #${boxId} уже отмечена как закрытая`);
        return;
      }
      const box = activeBoxes.value.find((b) => b.id === boxId);
      if (!box) {
        setScanError(`Коробка #${boxId} не на этой точке`);
        return;
      }
      closedBoxIds.value = [...closedBoxIds.value, boxId];
      flash(`Закрыта #${boxId}`);
      return;
    }

    const code = raw.trim();
    if (!code) return;
    if (scanListHasCode(scannedCodes.value, code)) {
      setScanError(duplicateCardScanMessage(code));
      return;
    }
    scannedCodes.value = [...scannedCodes.value, code];
    flash(`Карта добавлена · всего ${scannedCodes.value.length}`);
  };

  const removeCode = (code: string) => {
    scannedCodes.value = scannedCodes.value.filter((x) => x !== code);
  };

  const submit = async () => {
    if (!field.pointContext.value) return;
    error.value = "";

    const remaining = activeBoxes.value.filter((b) => !closedBoxIds.value.includes(b.id));
    if (remaining.length > 1) {
      setScanError("Слишком много коробок без CARDBOX — закройте лишние на шаге 1");
      return;
    }

    inventoryLoading.value = true;
    try {
      inventoryResult.value = await performInventory(
        field.pointContext.value.location_external_id,
        null,
        scannedCodes.value,
        closedBoxIds.value,
        partner.value,
      );
      const key = draftKeyFor(field.pointContext.value.location_external_id);
      if (key) clearCardsDraft(key);
      notifyOk("Инвентаризация сохранена на сервере. Локальный черновик сканов очищен.");
      await loadInventoryStatus();
      try {
        const { useNavigation } = await import("@/shared/composables/app/useNavigation");
        await useNavigation().refreshCardsInventoryBadge();
      } catch {
        /* nav badge optional */
      }
    } catch (e: unknown) {
      error.value = notifyError(
        e,
        "Не удалось сохранить инвентаризацию. Черновик сканов остался на этом устройстве — можно исправить и отправить снова.",
      );
    } finally {
      inventoryLoading.value = false;
    }
  };

  return {
    notBound: field.notBound,
    needsPointPick: field.needsPointPick,
    pointContext: field.pointContext,
    pointOptions: field.pointOptions,
    pointsLoading: field.pointsLoading,
    canPickAnyPoint,
    selectPoint,
    boxes,
    step,
    closedBoxIds,
    openBoxId,
    openPoolLabel,
    scannedCodes,
    inventoryResult,
    inventoryStatus,
    doneThisWeek,
    inventoryLoading,
    error,
    scanFlash,
    activeBoxes,
    closedTargetHint,
    canGoNext,
    canSubmitInventory,
    bootstrap,
    onClosedScan,
    removeClosed,
    goNext,
    goBack,
    onOpenScan,
    removeCode,
    submit,
    refreshLight,
  };
}
