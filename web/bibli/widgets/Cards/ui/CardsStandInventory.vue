<template>
  <div class="cards-root inventory-page">
    <CardsPageShell
      variant="field"
      :refresh-loading="inventoryLoading || pointsLoading"
      @refresh="refreshLight"
      @project-change="onProjectChange"
    >
      <p v-if="notBound" class="empty-hint">Нет привязки к точке — инвентаризацию сдаёт сотрудник точки.</p>

      <template v-else-if="needsPointPick">
        <header class="inv-hero">
          <p class="inv-hero__eyebrow">Инвентаризация</p>
          <h1 class="inv-hero__title">Выбор точки</h1>
        </header>
        <CardsPointPicker
          :options="pointOptions"
          :model-value="''"
          :loading="pointsLoading"
          @update:model-value="selectPoint"
        />
      </template>

      <template v-else>
        <header class="inv-hero">
          <p class="inv-hero__eyebrow">Инвентаризация</p>
          <div class="inv-hero__row">
            <h1 class="inv-hero__title">{{ pointContext?.point_name || "Точка" }}</h1>
            <button
              v-if="canPickAnyPoint"
              type="button"
              class="inv-hero__change"
              @click="needsPointPick = true"
            >
              Сменить
            </button>
          </div>
        </header>

        <p v-if="doneThisWeek" class="inv-done-banner" role="status">
          На этой неделе инвентаризация сдана
        </p>

        <div class="inv-stepper" role="list" aria-label="Шаги инвентаризации">
          <div
            class="inv-stepper__item"
            role="listitem"
            :class="{ 'inv-stepper__item--active': step === 1, 'inv-stepper__item--done': step > 1 }"
          >
            <span class="inv-stepper__num">1</span>
            <span class="inv-stepper__label">Закрытые</span>
          </div>
          <div class="inv-stepper__connector" aria-hidden="true" />
          <div
            class="inv-stepper__item"
            role="listitem"
            :class="{ 'inv-stepper__item--active': step === 2 }"
          >
            <span class="inv-stepper__num">2</span>
            <span class="inv-stepper__label">Карты</span>
          </div>
        </div>

        <div class="inv-body">
          <p class="hint info-line">
            <template v-if="step === 1">
              QR закрытых коробок ·
              {{ closedBoxIds.length
              }}<template v-if="closedTargetHint > 0">/{{ closedTargetHint }}+</template>
            </template>
            <template v-else>
              {{ openPoolLabel }} · карт {{ scannedCodes.length }}
            </template>
            <span v-if="scanFlash" class="ok"> · {{ scanFlash }}</span>
          </p>
          <p v-if="step === 2" class="hint">Сканируйте любые карты — привязка к открытой коробке не нужна.</p>

          <CardScanInput
            default-mode="camera"
            :allowed-modes="['camera']"
            :start-label="step === 1 ? 'Сканировать QR коробки' : 'Сканировать карты'"
            :scanned-count="step === 1 ? closedBoxIds.length : scannedCodes.length"
            @decode="step === 1 ? onClosedScan($event) : onOpenScan($event)"
          />

          <CardsCodeChips
            v-if="step === 1"
            :codes="closedBoxIds.map((id) => `CARDBOX:${id}`)"
            @remove="removeClosed"
          />
          <CardsCodeChips v-else :codes="scannedCodes" @remove="removeCode" />

          <div v-if="inventoryResult" class="result-box inv-result" role="status">
            <strong>Инвентаризация сдана</strong>
            <span>Остаток {{ inventoryResult.on_hand }} · выдано {{ inventoryResult.issued }}</span>
            <span
              v-if="inventoryResult.anomaly"
              class="inv-result__anomaly"
            >
              Аномалия:
              {{
                inventoryResult.anomaly.type === "missing_codes"
                  ? "не все ожидаемые карты отсканированы"
                  : inventoryResult.anomaly.type === "on_hand_gt_delivered"
                    ? "остаток больше поставленного"
                    : inventoryResult.anomaly.type
              }}
            </span>
            <span
              v-if="inventoryResult.lost_codes?.length"
              class="inv-result__anomaly"
            >
              Не найдено на точке: {{ inventoryResult.lost_codes.slice(0, 8).join(", ")
              }}{{ inventoryResult.lost_codes.length > 8 ? "…" : "" }}
            </span>
            <span
              v-if="inventoryResult.unknown_codes?.length"
              class="inv-result__anomaly"
            >
              Неизвестные коды: {{ inventoryResult.unknown_codes.slice(0, 8).join(", ")
              }}{{ inventoryResult.unknown_codes.length > 8 ? "…" : "" }}
            </span>
            <ul
              v-if="inventoryResult.transfers?.length"
              class="inv-result__transfers"
            >
              <li
                v-for="(t, idx) in inventoryResult.transfers.slice(0, 12)"
                :key="`${t.code}-${idx}`"
              >
                {{ formatTransfer(t) }}
              </li>
              <li v-if="inventoryResult.transfers.length > 12">
                …ещё {{ inventoryResult.transfers.length - 12 }}
              </li>
            </ul>
          </div>

          <p v-if="error" class="scanner-error">{{ error }}</p>
        </div>

        <div class="actions-row field-sticky-footer">
          <AuthRRButton
            v-if="step === 2"
            variant="neutral-secondary"
            label="Назад"
            :disabled="inventoryLoading"
            @click="goBack"
          />
          <AuthRRButton
            v-if="step === 1"
            variant="brand-primary"
            label="Далее"
            :disabled="!canGoNext"
            @click="goNext"
          />
          <AuthRRButton
            v-else
            variant="brand-primary"
            :label="inventoryLoading ? '…' : 'Сдать инвентаризацию'"
            :loading="inventoryLoading"
            :disabled="inventoryLoading || !canSubmitInventory"
            @click="submit"
          />
        </div>
      </template>
    </CardsPageShell>
  </div>
</template>

<script setup lang="ts">
import { onActivated, onMounted } from "vue";
import { AuthRRButton } from "bibli/shared/ui/rr";
import CardsPageShell from "./CardsPageShell.vue";
import CardsPointPicker from "./CardsPointPicker.vue";
import CardScanInput from "./CardScanInput.vue";
import CardsCodeChips from "./CardsCodeChips.vue";
import type { InventoryTransfer } from "@/pages/cards/api";
import { useStandInventory } from "../composables/useStandInventory";
import "./cards-shared.css";

const {
  notBound,
  needsPointPick,
  pointContext,
  pointOptions,
  pointsLoading,
  canPickAnyPoint,
  selectPoint,
  step,
  closedBoxIds,
  openPoolLabel,
  scannedCodes,
  inventoryResult,
  doneThisWeek,
  inventoryLoading,
  error,
  scanFlash,
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
} = useStandInventory();

const formatTransfer = (t: InventoryTransfer) => {
  const from =
    t.kind === "from_closed_box"
      ? `коробка #${t.from_batch_id ?? "?"}`
      : `${t.from_state}${t.from_location ? ` @ ${t.from_location.slice(0, 8)}…` : ""}`;
  const to =
    t.kind === "from_closed_box"
      ? "открытый пул"
      : `${t.to_state} @ точка`;
  return `${t.code}: ${from} → ${to}`;
};

const onProjectChange = () => {
  void bootstrap();
};

onMounted(() => bootstrap());
onActivated(() => {
  void refreshLight();
});
</script>

<style scoped>
.inventory-page {
  max-width: 640px;
  padding-bottom: calc(16px + var(--app-mobile-tabbar-content-inset, env(safe-area-inset-bottom, 0px)));
}

.inv-hero {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 2px;
  padding: 2px 0 4px;
}

.inv-hero__eyebrow {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--rr-labels-neutral-secondary, #5f6673);
}

.inv-hero__row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.inv-hero__title {
  margin: 0;
  font-size: clamp(1.25rem, 4vw, 1.5rem);
  font-weight: 700;
  line-height: 1.2;
  min-width: 0;
}

.inv-hero__change {
  flex-shrink: 0;
  border: none;
  background: transparent;
  padding: 0;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  color: var(--rr-labels-brand-primary, #1c4ae5);
  cursor: pointer;
}

.inv-done-banner {
  margin: 0 0 10px;
  padding: 10px 12px;
  border-radius: 10px;
  background: color-mix(in srgb, #52c41a 14%, #fff);
  color: #237804;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.35;
}

.inv-stepper {
  margin: 0 0 8px;
  padding: 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.inv-stepper__item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 0;
  color: var(--rr-labels-neutral-secondary, #5f6673);
  font-size: 13px;
  font-weight: 500;
}

.inv-stepper__item--active {
  color: var(--rr-input-text-default, #101012);
  font-weight: 650;
}

.inv-stepper__item--done {
  opacity: 0.7;
}

.inv-stepper__num {
  display: inline-grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--rr-backgrounds-tetriary, #e7e8ee);
  font-size: 12px;
  font-weight: 700;
}

.inv-stepper__item--active .inv-stepper__num {
  background: var(--rr-button-brand-primary-background-default, #5b7dec);
  color: #fff;
}

.inv-stepper__item--done .inv-stepper__num {
  background: color-mix(in srgb, #52c41a 28%, #fff);
  color: #389e0d;
}

.inv-stepper__connector {
  flex: 1 1 16px;
  min-width: 12px;
  max-width: 40px;
  height: 2px;
  border-radius: 1px;
  background: var(--rr-backgrounds-tetriary, #e7e8ee);
}

.inv-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

.actions-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 4px;
}

.info-line {
  margin: 0;
  font-variant-numeric: tabular-nums;
  font-size: 13px;
}

.ok {
  color: #1a7f37;
}

.inv-result {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.inv-result__anomaly {
  color: #b54708;
  font-size: 13px;
  line-height: 1.35;
  word-break: break-word;
}

.inv-result__transfers {
  margin: 4px 0 0;
  padding-left: 1.1em;
  font-size: 12px;
  line-height: 1.4;
  color: var(--rr-labels-neutral-secondary, #5f6673);
  word-break: break-word;
}

@media (max-width: 768px) {
  .actions-row :deep(.auth-rr-button--neutral-secondary) {
    min-height: 40px;
  }
}
</style>
