<template>
  <section class="point-incoming">
    <div class="point-incoming__head">
      <h2 class="point-incoming__title">Входящие партии</h2>
      <ToolbarRefreshButton
        :loading="loading"
        :disabled="loading"
        @click="emit('refresh')"
      />
    </div>

    <p v-if="!incoming.length && !loading" class="hint">Новых партий нет — можно заняться утилем ниже.</p>

    <ul v-else class="point-incoming__list">
      <li v-for="shipment in incoming" :key="shipment.id" class="point-incoming__item">
        <div class="point-incoming__info">
          <span class="point-incoming__id">Партия #{{ shipment.id }}</span>
          <span class="point-incoming__qty">{{ shipment.units_count ?? "—" }} карт</span>
        </div>
        <AuthRRButton
          variant="brand-primary"
          :label="actionId === shipment.id ? 'Принимаем…' : 'Принять'"
          :loading="actionId === shipment.id"
          :disabled="actionId != null"
          @click="emit('accept', shipment.id)"
        />
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { AuthRRButton } from "bibli/shared/ui/rr";
import ToolbarRefreshButton from "../ToolbarRefreshButton.vue";
import type { CardShipment } from "@/pages/cards/api";
import "../cards-shared.css";

defineProps<{
  incoming: CardShipment[];
  loading: boolean;
  actionId: number | null;
}>();

const emit = defineEmits<{
  refresh: [];
  accept: [id: number];
}>();
</script>

<style scoped>
.point-incoming {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.point-incoming__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.point-incoming__title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 650;
  color: var(--rr-input-text-default, #101012);
}

.point-incoming__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.point-incoming__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid color-mix(in srgb, var(--rr-input-border-default, #e5e7eb) 88%, transparent);
  background: var(--rr-backgrounds-primary, #fff);
}

.point-incoming__info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.point-incoming__id {
  font-weight: 600;
  font-size: 14px;
}

.point-incoming__qty {
  font-size: 12px;
  color: var(--rr-labels-neutral-secondary, #5f6673);
}

@media (max-width: 640px) {
  .point-incoming__item {
    flex-direction: column;
    align-items: stretch;
  }

  .point-incoming__item :deep(.auth-rr-button) {
    width: 100%;
    min-height: 48px;
  }
}
</style>
