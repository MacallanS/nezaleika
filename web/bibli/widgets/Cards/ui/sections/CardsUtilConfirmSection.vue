<template>
  <CardsContentBlock
    title="Утиль с точек"
    lead="Склад: примите все карты из заявки точки или отклоните (остаток на точке вернётся). При отклонении отсканируйте полученные карты."
  >
    <p v-if="loading" class="hint">Загрузка…</p>
    <p v-else-if="!pending.length" class="hint">Ожидающих утилей нет.</p>
    <ul v-else class="ship-list">
      <li v-for="u in pending" :key="u.id" class="ship-row util-row">
        <div class="ship-row__info">
          <span class="ship-row__id">#{{ u.id }}</span>
          <span class="ship-row__qty">карт {{ u.qty_sent }}</span>
          <span v-if="requestCodes(u).length" class="ship-row__codes">
            {{ requestCodes(u).slice(0, 6).join(", ")
            }}{{ requestCodes(u).length > 6 ? "…" : "" }}
          </span>
        </div>
        <div class="util-actions">
          <AuthRRButton
            variant="brand-primary"
            label="Принять"
            :loading="actionId === u.id && actionKind === 'confirm'"
            :disabled="actionId != null"
            @click="emit('confirm', u.id)"
          />
          <AuthRRButton
            variant="neutral-secondary"
            label="Отклонить"
            :loading="actionId === u.id && actionKind === 'reject'"
            :disabled="actionId != null"
            @click="startReject(u.id)"
          />
        </div>
      </li>
    </ul>
  </CardsContentBlock>

  <RrBottomSheet
    v-model="rejectSheetOpen"
    title="Отклонить утиль"
    subtitle="Отсканируйте карты, которые реально получили на складе."
    height-mode="percent"
    :height-percent="90"
    placement="sheet"
    footer-layout="stack"
    :closing-locked="actionId != null && actionKind === 'reject'"
    @update:model-value="onRejectSheetToggle"
  >
    <div class="reject-panel">
      <p class="hint">Заявка #{{ rejectingId }} · получено саппортом: <b>{{ rejectCodes.length }}</b></p>
      <CardScanInput
        default-mode="camera"
        :allowed-modes="['camera']"
        start-label="Сканировать полученные карты"
        :scanned-count="rejectCodes.length"
        @decode="onRejectScan"
      />
      <p v-if="rejectScanHint" class="scanner-error">{{ rejectScanHint }}</p>
      <CardsCodeChips :codes="rejectCodes" @remove="removeRejectCode" />
    </div>
    <template #footer>
      <AuthRRButton
        variant="brand-primary"
        label="Подтвердить отклонение"
        :loading="actionId === rejectingId && actionKind === 'reject'"
        :disabled="actionId != null || rejectingId == null"
        @click="confirmReject"
      />
      <AuthRRButton
        variant="neutral-secondary"
        label="Отмена"
        :disabled="actionId != null"
        @click="cancelReject"
      />
    </template>
  </RrBottomSheet>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { AuthRRButton, RrBottomSheet } from "bibli/shared/ui/rr";
import CardsContentBlock from "../CardsContentBlock.vue";
import CardScanInput from "../CardScanInput.vue";
import CardsCodeChips from "../CardsCodeChips.vue";
import type { CardUtilRow } from "@/pages/cards/api";
import "../cards-shared.css";

const props = defineProps<{
  pending: CardUtilRow[];
  loading: boolean;
  actionId: number | null;
  actionKind: "confirm" | "reject" | null;
}>();

const emit = defineEmits<{
  confirm: [id: number];
  reject: [id: number, codes: string[]];
}>();

const rejectingId = ref<number | null>(null);
const rejectCodes = ref<string[]>([]);
const rejectScanHint = ref("");

const rejectSheetOpen = computed({
  get: () => rejectingId.value != null,
  set: (open: boolean) => {
    if (!open) cancelReject();
  },
});

watch(
  () => props.pending,
  (list) => {
    if (rejectingId.value == null) return;
    if (!list.some((u) => u.id === rejectingId.value)) {
      cancelReject();
    }
  },
);

const requestCodes = (u: CardUtilRow): string[] => {
  const raw = u.meta?.codes;
  return Array.isArray(raw) ? raw.map(String) : [];
};

const startReject = (id: number) => {
  rejectingId.value = id;
  rejectCodes.value = [];
  rejectScanHint.value = "";
};

const cancelReject = () => {
  rejectingId.value = null;
  rejectCodes.value = [];
  rejectScanHint.value = "";
};

const onRejectSheetToggle = (open: boolean) => {
  if (!open) cancelReject();
};

const confirmReject = () => {
  if (rejectingId.value == null) return;
  emit("reject", rejectingId.value, rejectCodes.value);
};

const onRejectScan = (raw: string) => {
  if (/^(?:CARDBOX|BOX):/i.test(raw)) return;
  const code = raw.trim();
  if (!code) return;
  if (rejectCodes.value.some((c) => c.trim().toUpperCase() === code.toUpperCase())) {
    rejectScanHint.value = `Карта «${code}» уже в списке отклонения. Повтор не добавлен.`;
    return;
  }
  rejectScanHint.value = "";
  rejectCodes.value = [...rejectCodes.value, code];
};

const removeRejectCode = (code: string) => {
  rejectCodes.value = rejectCodes.value.filter((c) => c !== code);
};
</script>

<style scoped>
.util-row {
  flex-wrap: wrap;
}
.util-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}
@media (max-width: 640px) {
  .util-actions {
    flex-direction: column;
    align-items: stretch;
  }
  .util-actions :deep(.auth-rr-button) {
    width: 100%;
    min-height: 48px;
  }
}
.reject-panel {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.ship-row__codes {
  display: block;
  font-size: 12px;
  color: var(--rr-labels-neutral-secondary, #5f6673);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}
</style>
