<template>
  <section class="point-util">
    <div class="point-util__head">
      <h2 class="point-util__title">Утиль</h2>
      <p class="point-util__lead">Отсканируйте брак и отправьте заявку.</p>
    </div>

    <CardScanInput
      default-mode="camera"
      :allowed-modes="['camera']"
      start-label="Сканировать бракованные карты"
      :scanned-count="codes.length"
      @decode="emit('scan', $event)"
    />

    <p class="hint">Отсканировано: <b>{{ codes.length }}</b></p>
    <CardsCodeChips :codes="codes" @remove="emit('remove-code', $event)" />

    <div class="point-util__footer field-sticky-footer">
      <AuthRRButton
        variant="brand-primary"
        label="Отправить заявку"
        :loading="sending"
        :disabled="sending || codes.length < 1"
        @click="emit('send')"
      />
    </div>

    <p v-if="flash" class="hint ok">{{ flash }}</p>
    <p v-if="error" class="scanner-error">{{ error }}</p>

    <div v-if="history.length" class="point-util__history">
      <button
        type="button"
        class="point-util__history-toggle"
        :aria-expanded="historyOpen"
        @click="historyOpen = !historyOpen"
      >
        <span>Заявки ({{ history.length }})</span>
        <i :class="historyOpen ? 'pi pi-chevron-up' : 'pi pi-chevron-down'" aria-hidden="true" />
      </button>
      <ul v-if="historyOpen" class="ship-list">
        <li v-for="u in history" :key="u.id" class="ship-row">
          <div class="ship-row__info">
            <span class="ship-row__id">#{{ u.id }} · {{ statusLabel(u.status) }}</span>
            <span class="ship-row__qty"
              >карт {{ u.qty_sent
              }}{{ u.qty_received != null && u.status === "confirmed" ? ` / принято ${u.qty_received}` : "" }}</span
            >
          </div>
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { AuthRRButton } from "bibli/shared/ui/rr";
import CardScanInput from "../CardScanInput.vue";
import CardsCodeChips from "../CardsCodeChips.vue";
import type { CardUtilRow } from "@/pages/cards/api";
import "../cards-shared.css";

defineProps<{
  codes: string[];
  sending: boolean;
  flash: string;
  error: string;
  history: CardUtilRow[];
}>();

const emit = defineEmits<{
  scan: [value: string];
  "remove-code": [value: string];
  send: [];
}>();

const historyOpen = ref(false);

const statusLabel = (status: CardUtilRow["status"]) => {
  if (status === "confirmed") return "принято";
  if (status === "rejected") return "отклонено";
  return "в пути";
};
</script>

<style scoped>
.point-util {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 8px;
  padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px));
  border-top: 1px solid color-mix(in srgb, var(--rr-input-border-default, #e5e7eb) 80%, transparent);
}

.point-util__head {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.point-util__title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 650;
}

.point-util__lead {
  margin: 0;
  font-size: 12px;
  color: var(--rr-labels-neutral-secondary, #5f6673);
}

.point-util__footer {
  margin-top: 2px;
}

.point-util__history {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 4px;
}

.point-util__history-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  padding: 8px 0;
  border: none;
  background: transparent;
  color: var(--rr-labels-neutral-secondary, #5f6673);
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  text-align: left;
}

.point-util__history-toggle i {
  font-size: 11px;
}

.ok {
  color: #1a7f37;
}

@media (max-width: 640px) {
  .point-util__footer :deep(.auth-rr-button) {
    width: 100%;
    min-height: 48px;
  }

  .point-util__lead {
    display: none;
  }
}
</style>
