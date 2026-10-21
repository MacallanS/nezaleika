import { computed, ref } from "vue";
import { fetchCardsConfig } from "@/pages/cards/api";
import { useProjectsStore } from "@/stores/projects";

export type CardsScopePoint = {
  id: number;
  name: string;
  location: string;
};

export type CardsScopeProject = {
  id: number;
  name: string;
  partner: string;
  points: CardsScopePoint[];
};

/** Общий scope проекта для всех экранов учёта карт (склад / точка / разделение / инвент.). */
const cardsProjects = ref<CardsScopeProject[]>([]);
const selectedProjectId = ref<number | null>(null);
const loading = ref(false);
let loadPromise: Promise<void> | null = null;

const selectedProject = computed(
  () => cardsProjects.value.find((p) => p.id === selectedProjectId.value) ?? null,
);
const partner = computed(() => selectedProject.value?.partner ?? "otp");
const points = computed(() => selectedProject.value?.points ?? []);
const projectOptions = computed(() =>
  cardsProjects.value.map((p) => ({ id: p.id, name: p.name })),
);

function countScopedLocations(list: any[], enabledIds: Set<number>): number {
  let n = 0;
  for (const p of list) {
    if (!enabledIds.has(Number(p.id))) continue;
    for (const pt of p.points ?? []) {
      if (pt?.core_location_external_id) n += 1;
    }
  }
  return n;
}

async function ensureCardsProjectsLoaded(): Promise<void> {
  if (loadPromise) return loadPromise;
  loadPromise = (async () => {
    loading.value = true;
    try {
      const projectsStore = useProjectsStore();
      const cfg = await fetchCardsConfig();
      const enabled = new Map(
        (cfg.projects ?? []).map((p) => [Number(p.id), p.partner] as const),
      );
      const enabledIds = new Set(enabled.keys());

      let list: any[] = projectsStore.projects ?? [];
      let fetchErr: string | null = null;
      const needFetch =
        !list.length || countScopedLocations(list, enabledIds) === 0;
      if (needFetch) {
        try {
          list = (await projectsStore.fetchProjects(true)) ?? [];
        } catch (e: any) {
          fetchErr = String(e?.message || e);
          list = projectsStore.projects ?? [];
        }
      }

      cardsProjects.value = list
        .filter((p) => enabled.has(Number(p.id)))
        .map((p) => ({
          id: Number(p.id),
          name: p.name,
          partner: enabled.get(Number(p.id)) as string,
          points: (p.points ?? [])
            .map((pt: any) => ({
              id: pt.id,
              name: pt.name,
              location: pt.core_location_external_id,
            }))
            .filter((pt: CardsScopePoint) => Boolean(pt.location)),
        }));

      const stillValid = cardsProjects.value.some((p) => p.id === selectedProjectId.value);
      if (!stillValid) {
        selectedProjectId.value = cardsProjects.value[0]?.id ?? null;
      }

    } catch (e: any) {
      throw e;
    } finally {
      loading.value = false;
      loadPromise = null;
    }
  })();
  return loadPromise;
}

function selectCardsProject(id: number | null) {
  selectedProjectId.value = id;
}

export function useCardsProjectScope() {
  return {
    cardsProjects,
    selectedProjectId,
    selectedProject,
    partner,
    points,
    projectOptions,
    loading,
    ensureCardsProjectsLoaded,
    selectCardsProject,
  };
}
