<template>
  <section class="cards-shell" :class="shellClass">
    <CardsMobileSectionNav v-if="showMobileSectionNav" />

    <div v-if="showToolbar" class="cards-shell__toolbar">
      <CardsHeaderActions
        :model-value="selectedProjectId ?? ''"
        :options="projectOptions"
        :show-project="showProject"
        :refresh-loading="refreshLoading"
        :refresh-disabled="refreshDisabled"
        inline
        @update:model-value="onProjectSelect"
        @refresh="emit('refresh')"
      />
    </div>

    <div v-if="tabs?.length" class="cards-shell__tabs-wrap">
      <RrSegmentTabs
        class="cards-shell__tabs"
        :tabs="rrTabs"
        :model-value="modelValue || rrTabs[0]?.id || ''"
        aria-label="Разделы учёта карт"
        @update:model-value="emit('update:modelValue', $event)"
      />
    </div>

    <div class="cards-shell__content">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from "vue";
import { RrSegmentTabs, type RrSegmentTab } from "bibli/shared/ui/rr";
import { useRoles } from "@/shared/composables/roles/useRoles";
import CardsMobileSectionNav from "./CardsMobileSectionNav.vue";
import CardsHeaderActions from "./CardsHeaderActions.vue";
import { useCardsProjectScope } from "../composables/useCardsProjectScope";
import "./cards-shared.css";

export interface CardsTabItem {
  key: string;
  label: string;
}

const props = withDefaults(
  defineProps<{
    tabs?: CardsTabItem[];
    modelValue?: string;
    variant?: "warehouse" | "field";
    showToolbar?: boolean;
    refreshLoading?: boolean;
    refreshDisabled?: boolean;
    /** Горизонтальный rail — заменён нижним таббаром реестра на мобилке. */
    showMobileSectionNav?: boolean;
  }>(),
  {
    variant: "warehouse",
    showToolbar: true,
    refreshLoading: false,
    refreshDisabled: false,
    showMobileSectionNav: false,
  },
);

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "refresh"): void;
  (e: "project-change", projectId: number): void;
}>();

const {
  isAdmin,
  isDirector,
  isAccountDirector,
  isSupportHead,
  isSupportManager,
} = useRoles();
const {
  selectedProjectId,
  projectOptions,
  cardsProjects,
  ensureCardsProjectsLoaded,
  selectCardsProject,
} = useCardsProjectScope();

const warehouse = computed(
  () =>
    isAdmin.value ||
    isDirector.value ||
    isAccountDirector.value ||
    isSupportHead.value ||
    isSupportManager.value,
);

const showProject = computed(
  () => warehouse.value && cardsProjects.value.length > 0,
);

const shellClass = computed(() =>
  props.variant === "field" ? "cards-shell--field" : "cards-shell--warehouse",
);

const rrTabs = computed<RrSegmentTab[]>(() =>
  (props.tabs ?? []).map((tab) => ({ id: tab.key, label: tab.label })),
);

function onProjectSelect(raw: string | number | Array<string | number>) {
  const id = Number(Array.isArray(raw) ? raw[0] : raw);
  if (!Number.isFinite(id)) return;
  selectCardsProject(id);
  emit("project-change", id);
}

onMounted(() => {
  void ensureCardsProjectsLoaded();
});

watch(
  () => props.showToolbar,
  (show) => {
    if (show) void ensureCardsProjectsLoaded();
  },
);
</script>

<style scoped>
.cards-shell {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 12px;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

.cards-shell__toolbar {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  min-width: 0;
}

.cards-shell__toolbar :deep(.cards-toolbar) {
  width: 100%;
  max-width: 420px;
}

.cards-shell__tabs-wrap {
  display: flex;
  justify-content: flex-start;
  width: 100%;
  min-width: 0;
}

.cards-shell__tabs {
  flex: 0 1 auto;
  width: fit-content;
  max-width: 100%;
  min-width: 0;
}

.cards-shell__content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
  width: 100%;
}

.cards-shell--field {
  max-width: 640px;
}

.cards-shell--field .cards-shell__content {
  gap: 10px;
}

.cards-shell--warehouse .cards-shell__tabs {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.cards-shell--warehouse .cards-shell__tabs::-webkit-scrollbar {
  display: none;
}

@media (max-width: 1024px) {
  .cards-shell {
    gap: 10px;
  }

  .cards-shell__toolbar :deep(.cards-toolbar) {
    max-width: none;
  }

  .cards-shell__content {
    gap: 12px;
  }
}

@media (max-width: 768px) {
  .cards-shell--field .cards-shell__content {
    gap: 8px;
  }

  /* Компактный сегмент по контенту — не растягивать на всю ширину */
  .cards-shell :deep(.rr-segment-tabs) {
    width: fit-content;
    max-width: 100%;
    height: 40px;
    min-height: 40px;
    padding: 3px;
    border-radius: 12px;
  }

  .cards-shell :deep(.rr-segment-tabs__tab) {
    padding: 0 10px;
    font-size: 13px;
  }
}
</style>
