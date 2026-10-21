<template>
  <div class="cards-root split-page">
    <CardsPageShell
      variant="field"
      :refresh-loading="loading"
      @refresh="loadBoxes"
      @project-change="onProjectChange"
    >
      <header class="split-hero">
        <p class="split-hero__eyebrow">Разделение коробки</p>
        <h1 class="split-hero__title">Офис</h1>
      </header>

      <div class="split-body">
        <p v-if="loading" class="hint">Загрузка коробок…</p>
        <template v-else>
          <CardsBoxPicker
            v-model="selectedBoxId"
            :boxes="boxes"
            :confirmed-id="boxConfirmed ? selectedBoxId : null"
            scan-label="Сканировать QR коробки"
            scan-default-mode="camera"
            :scan-allowed-modes="['camera']"
            empty-text="В офисе нет коробок для разделения."
            @box-scanned="onBoxScanned"
          />
        </template>

        <template v-if="boxConfirmed && selectedBoxId != null">
          <p class="hint scan-hint">
            Коробка <strong>#{{ selectedBoxId }}</strong> выбрана — сканируйте QR карт для новой коробки
          </p>
          <p v-if="selectedIsManual" class="hint">
            Карты ещё без накладной. Сканируйте те, что переложили в другую коробку.
            Когда придёт файл API, он привяжется к исходной коробке — даже если её уже отправили.
          </p>

          <CardScanInput
            default-mode="camera"
            :allowed-modes="['camera']"
            start-label="Сканировать карты"
            :scanned-count="codes.length"
            @decode="onCardScan"
          />
          <p v-if="scanFlash" class="hint ok">{{ scanFlash }}</p>
          <p v-if="error" class="scanner-error">{{ error }}</p>
          <CardsCodeChips :codes="codes" @remove="removeCode" />
        </template>
      </div>

      <div v-if="boxConfirmed" class="split-reset">
        <AuthRRButton variant="neutral-secondary" label="Сбросить" @click="fullReset" />
      </div>
      <div class="field-sticky-footer">
        <AuthRRButton
          variant="brand-primary"
          :label="splitting ? 'Делим…' : `Разделить (${codes.length} карт)`"
          :loading="splitting"
          :disabled="!canSplit || splitting"
          @click="doSplit"
        />
      </div>
    </CardsPageShell>
  </div>
</template>

<script setup lang="ts">
import { computed, onActivated, onMounted, ref, watch } from "vue";
import { AuthRRButton } from "bibli/shared/ui/rr";
import CardsPageShell from "./CardsPageShell.vue";
import CardsBoxPicker from "./CardsBoxPicker.vue";
import CardScanInput from "./CardScanInput.vue";
import CardsCodeChips from "./CardsCodeChips.vue";
import { fetchCentralBoxes, splitCentralBox, type CardBox } from "@/pages/cards/api";
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
import { useCardsProjectScope } from "../composables/useCardsProjectScope";
import "./cards-shared.css";

const { notifyError, notifyOk, notifyWarn } = useCardsNotify();
const { partner, ensureCardsProjectsLoaded } = useCardsProjectScope();

const boxes = ref<CardBox[]>([]);
const loading = ref(false);
const selectedBoxId = ref<number | null>(null);
const boxConfirmed = ref(false);
const codes = ref<string[]>([]);
const error = ref("");
const scanFlash = ref("");
const splitting = ref(false);

type SplitDraft = {
  boxId: number | null;
  boxConfirmed: boolean;
  codes: string[];
};

const splitDraftKey = () => cardsDraftKey("split", partner.value);

let skipSplitDraftPersist = false;

const persistSplitDraft = () => {
  if (skipSplitDraftPersist) return;
  const key = splitDraftKey();
  if (!codes.value.length && selectedBoxId.value == null) {
    clearCardsDraft(key);
    return;
  }
  const draft: SplitDraft = {
    boxId: selectedBoxId.value,
    boxConfirmed: boxConfirmed.value,
    codes: [...codes.value],
  };
  saveCardsDraft(key, draft);
};

const restoreSplitDraft = () => {
  const draft = loadCardsDraft<SplitDraft>(splitDraftKey());
  if (!draft) return;
  skipSplitDraftPersist = true;
  try {
    if (draft.boxId != null) {
      selectedBoxId.value = draft.boxId;
      boxConfirmed.value = Boolean(draft.boxConfirmed) || draft.boxId != null;
    }
    if (Array.isArray(draft.codes) && draft.codes.length) {
      codes.value = draft.codes.map(String).filter(Boolean);
      scanFlash.value = `Восстановлен черновик (${codes.value.length} карт)`;
      setTimeout(() => (scanFlash.value = ""), 2000);
    }
  } finally {
    skipSplitDraftPersist = false;
  }
};

watch([selectedBoxId, boxConfirmed, codes], () => persistSplitDraft(), { deep: true });

const canSplit = computed(
  () => selectedBoxId.value != null && boxConfirmed.value && codes.value.length > 0,
);

const selectedIsManual = computed(
  () => boxes.value.find((box) => box.id === selectedBoxId.value)?.meta?.codes_initialized === false,
);

watch(selectedBoxId, (next, prev) => {
  if (next !== prev && prev != null) {
    // Смена коробки сбрасывает карты (не при первом restore).
    boxConfirmed.value = next != null;
    codes.value = [];
    error.value = "";
  } else if (next != null) {
    boxConfirmed.value = true;
  }
});

const loadBoxes = async () => {
  loading.value = true;
  try {
    boxes.value = await fetchCentralBoxes(partner.value);
  } catch (e: unknown) {
    error.value = notifyError(e, "Не удалось загрузить коробки");
  } finally {
    loading.value = false;
  }
};

const onProjectChange = async () => {
  selectedBoxId.value = null;
  boxConfirmed.value = false;
  codes.value = [];
  await loadBoxes();
};

const onBoxScanned = (id: number) => {
  selectedBoxId.value = id;
  boxConfirmed.value = true;
  codes.value = [];
  error.value = "";
  scanFlash.value = `Коробка #${id} подтверждена`;
  setTimeout(() => (scanFlash.value = ""), 1500);
};

const onCardScan = (raw: string) => {
  error.value = "";
  if (/^(?:CARDBOX|BOX):\d+$/i.test(raw.trim())) {
    // повторный скан коробки — ок, уже подтверждена
    const m = raw.trim().match(/^(?:CARDBOX|BOX):(\d+)$/i);
    const id = m ? Number(m[1]) : null;
    if (id != null && id !== selectedBoxId.value) {
      error.value = `Сейчас выбрана #${selectedBoxId.value}, а отсканирована #${id}`;
    }
    return;
  }
  if (!boxConfirmed.value || selectedBoxId.value == null) {
    error.value = "Сначала выберите коробку";
    return;
  }
  const code = raw.trim();
  if (!code) return;
  if (scanListHasCode(codes.value, code)) {
    const msg = duplicateCardScanMessage(code);
    error.value = msg;
    notifyWarn(msg, "Повторный скан");
    return;
  }
  codes.value = [...codes.value, code];
  scanFlash.value = `Карта добавлена · всего ${codes.value.length}`;
  setTimeout(() => (scanFlash.value = ""), 1200);
};

const removeCode = (code: string) => {
  codes.value = codes.value.filter((c) => c !== code);
};

const reset = () => {
  codes.value = [];
  boxConfirmed.value = false;
  error.value = "";
};

const fullReset = () => {
  reset();
  selectedBoxId.value = null;
  clearCardsDraft(splitDraftKey());
};

const doSplit = async () => {
  if (!canSplit.value || selectedBoxId.value == null) return;
  splitting.value = true;
  error.value = "";
  try {
    await splitCentralBox(selectedBoxId.value, codes.value, partner.value);
    notifyOk("Коробка разделена. Локальный черновик очищен.");
    clearCardsDraft(splitDraftKey());
    fullReset();
    await loadBoxes();
  } catch (e: unknown) {
    error.value = notifyError(
      e,
      "Не удалось разделить коробку. Отсканированные карты сохранены локально.",
    );
  } finally {
    splitting.value = false;
  }
};

onMounted(async () => {
  await ensureCardsProjectsLoaded();
  await loadBoxes();
  restoreSplitDraft();
});

onActivated(async () => {
  await loadBoxes();
});
</script>

<style scoped>
.split-hero {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 2px;
  padding: 2px 0 4px;
}

.split-page {
  padding-bottom: calc(16px + var(--app-mobile-tabbar-content-inset, env(safe-area-inset-bottom, 0px)));
}

.split-hero__eyebrow {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--rr-labels-neutral-secondary, #5f6673);
}

.split-hero__title {
  margin: 0;
  font-size: clamp(1.25rem, 4vw, 1.5rem);
  font-weight: 700;
  line-height: 1.2;
}

.split-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}

.scan-hint code {
  font-size: 12px;
}

.ok {
  color: #1a7f37;
}

.split-reset {
  margin-top: 8px;
}

.split-reset :deep(.auth-rr-button) {
  width: 100%;
}
</style>
