<template>
  <nav
    v-if="ready && items.length > 1"
    class="cards-mnav"
    aria-label="Разделы учёта карт"
  >
    <div class="cards-mnav__head">
      <p class="cards-mnav__eyebrow">Учёт карт</p>
      <p class="cards-mnav__hint">{{ activeHint }}</p>
    </div>
    <div class="cards-mnav__rail" role="list">
      <button
        v-for="item in items"
        :key="item.key"
        type="button"
        role="listitem"
        class="cards-mnav__item"
        :class="{ 'cards-mnav__item--active': item.active }"
        :aria-current="item.active ? 'page' : undefined"
        @click="go(item.to)"
      >
        <span class="cards-mnav__label">{{ item.shortLabel }}</span>
        <span
          v-if="item.badge"
          class="cards-mnav__badge"
          aria-label="Требует внимания"
        />
      </button>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { navigateTo, useRoute } from "#imports";
import { useRoles } from "@/shared/composables/roles/useRoles";
import { useNavigation } from "@/shared/composables/app/useNavigation";

type NavItem = {
  key: string;
  to: string;
  label: string;
  shortLabel: string;
  active: boolean;
  badge?: boolean;
};

/** Не монтировать до client — меньше гонок KeepAlive при первом paint. */
const ready = ref(false);
onMounted(() => {
  ready.value = true;
});

const route = useRoute();
const {
  isAdmin,
  isDirector,
  isAccountDirector,
  isSupportHead,
  isSupportManager,
} = useRoles();
const { cardsFieldAccess, cardsInventoryNeeded } = useNavigation();

const warehouse = computed(
  () =>
    isAdmin.value ||
    isDirector.value ||
    isAccountDirector.value ||
    isSupportHead.value ||
    isSupportManager.value,
);

const pathNorm = computed(() => route.path.replace(/\/+$/, "") || "/");

function isActive(prefix: string): boolean {
  const p = pathNorm.value;
  const base = prefix.replace(/\/+$/, "");
  if (base === "/cards") {
    return p === "/cards";
  }
  return p === base || p.startsWith(`${base}/`);
}

const items = computed<NavItem[]>(() => {
  const out: NavItem[] = [];
  const field = warehouse.value || cardsFieldAccess.value;

  if (warehouse.value) {
    out.push({
      key: "cards",
      to: "/cards/",
      label: "Склад",
      shortLabel: "Склад",
      active: isActive("/cards"),
    });
  }

  if (field) {
    out.push({
      key: "cards_point",
      to: "/cards/point/",
      label: "На точке",
      shortLabel: "Точка",
      active: isActive("/cards/point"),
    });
  }

  if (warehouse.value) {
    out.push({
      key: "cards_qr_labels",
      to: "/cards/qr-labels/",
      label: "QR коробок",
      shortLabel: "QR",
      active: isActive("/cards/qr-labels"),
    });
    out.push({
      key: "cards_split",
      to: "/cards/split/",
      label: "Разделение коробки",
      shortLabel: "Разделение",
      active: isActive("/cards/split"),
    });
  }

  if (field) {
    out.push({
      key: "inventory",
      to: "/cards/inventory/",
      label: "Инвентаризация",
      shortLabel: "Инвент.",
      active: isActive("/cards/inventory"),
      badge: Boolean(cardsInventoryNeeded.value),
    });
  }

  return out;
});

const activeHint = computed(() => {
  const active = items.value.find((i) => i.active);
  return active?.label ?? "Разделы";
});

function go(to: string) {
  if (isActive(to)) return;
  void navigateTo(to);
}
</script>

<style scoped>
.cards-mnav {
  display: none;
}

@media (max-width: 768px) {
  .cards-mnav {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin: 0 0 4px;
    padding: 0;
    border: none;
    background: transparent;
    min-width: 0;
  }

  .cards-mnav__head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 10px;
    min-width: 0;
  }

  .cards-mnav__eyebrow {
    margin: 0;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #5f6673;
  }

  .cards-mnav__hint {
    margin: 0;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 12px;
    font-weight: 600;
    color: #101012;
  }

  .cards-mnav__rail {
    display: flex;
    gap: 4px;
    min-width: 0;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    padding: 4px;
    border-radius: 14px;
    background: var(--rr-backgrounds-tetriary, #e7e8ee);
  }

  .cards-mnav__rail::-webkit-scrollbar {
    display: none;
  }

  .cards-mnav__item {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 1 0 auto;
    min-width: 4.5rem;
    min-height: 36px;
    padding: 0 12px;
    border: none;
    border-radius: 10px;
    background: transparent;
    color: #5f6673;
    font: inherit;
    font-size: 13px;
    font-weight: 600;
    line-height: 1.2;
    white-space: nowrap;
    cursor: pointer;
  }

  .cards-mnav__item--active {
    background: #fff;
    color: #101012;
  }

  .cards-mnav__label {
    min-width: 0;
  }

  .cards-mnav__badge {
    position: absolute;
    top: 7px;
    right: 7px;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #e11d48;
    box-shadow: 0 0 0 2px #fff;
  }
}
</style>
