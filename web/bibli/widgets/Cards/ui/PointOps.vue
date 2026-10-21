<template>
  <div class="cards-root point-ops">
    <CardsPageShell
      variant="field"
      :refresh-loading="incomingLoading"
      @refresh="refreshLight"
      @project-change="onProjectChange"
    >
      <p v-if="notBound" class="empty-hint">
        Раздел «На точке» доступен сотрудникам с привязкой к точке. За вами точка не закреплена.
      </p>

      <template v-else-if="needsPointPick">
        <header class="point-hero">
          <p class="point-hero__eyebrow">На точке</p>
          <h1 class="point-hero__name">Выбор точки</h1>
        </header>
        <CardsPointPicker
          :options="pointOptions"
          :model-value="''"
          :loading="pointsLoading"
          @update:model-value="selectPoint"
        />
      </template>

      <template v-else>
        <header class="point-hero">
          <p class="point-hero__eyebrow">На точке</p>
          <div class="point-hero__row">
            <h1 class="point-hero__name">{{ pointContext?.point_name || "Точка" }}</h1>
            <button
              v-if="canPickAnyPoint"
              type="button"
              class="point-hero__change"
              @click="changePoint"
            >
              Сменить
            </button>
          </div>
          <p class="point-hero__stock">
            <span class="point-hero__stock-label">Остаток</span>
            <span class="point-hero__stock-value">{{ onHand ?? "—" }}</span>
          </p>
        </header>

        <PointIncomingShipmentsSection
          :incoming="incoming"
          :loading="incomingLoading"
          :action-id="actionId"
          @refresh="loadIncoming"
          @accept="accept"
        />

        <PointUtilSection
          :codes="utilCodes"
          :sending="utilSending"
          :flash="utilFlash"
          :error="utilError"
          :history="utilHistory"
          @scan="onUtilScan"
          @remove-code="removeUtilCode"
          @send="sendUtil"
        />
      </template>
    </CardsPageShell>
  </div>
</template>

<script setup lang="ts">
import { onActivated, onMounted } from "vue";
import CardsPageShell from "./CardsPageShell.vue";
import CardsPointPicker from "./CardsPointPicker.vue";
import PointIncomingShipmentsSection from "./sections/PointIncomingShipmentsSection.vue";
import PointUtilSection from "./sections/PointUtilSection.vue";
import { usePointOps } from "../composables/usePointOps";
import "./cards-shared.css";

const {
  notBound,
  needsPointPick,
  pointContext,
  pointOptions,
  pointsLoading,
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
} = usePointOps();

const changePoint = () => {
  needsPointPick.value = true;
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
.point-ops {
  max-width: 640px;
  padding-bottom: calc(16px + var(--app-mobile-tabbar-content-inset, env(safe-area-inset-bottom, 0px)));
}

.point-hero {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 8px;
  padding: 4px 0 12px;
}

.point-hero__eyebrow {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--rr-labels-neutral-secondary, #5f6673);
}

.point-hero__row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.point-hero__name {
  margin: 0;
  font-size: clamp(1.35rem, 4vw, 1.75rem);
  font-weight: 700;
  line-height: 1.2;
  color: var(--rr-input-text-default, #101012);
  min-width: 0;
}

.point-hero__change {
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

.point-hero__stock {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin: 8px 0 0;
}

.point-hero__stock-label {
  font-size: 14px;
  color: var(--rr-labels-neutral-secondary, #5f6673);
}

.point-hero__stock-value {
  font-size: clamp(1.75rem, 5vw, 2.25rem);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}
</style>
