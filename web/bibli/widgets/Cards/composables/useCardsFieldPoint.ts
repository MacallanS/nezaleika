import { computed, ref } from "vue";
import {
  fetchCardsConfig,
  fetchMyPoint,
  type PointContext,
} from "@/pages/cards/api";
import { useProjectsStore } from "@/stores/projects";

const STORAGE_KEY = "cards.field.selected_point";

export type CardsFieldPointOption = {
  id: string;
  name: string;
  location: string;
  projectName: string;
};

type StoredPoint = {
  location_external_id: string;
  point_name: string;
};

function readStoredPoint(): StoredPoint | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredPoint;
    if (!parsed?.location_external_id) return null;
    return {
      location_external_id: String(parsed.location_external_id),
      point_name: String(parsed.point_name || "Точка"),
    };
  } catch {
    return null;
  }
}

function writeStoredPoint(ctx: PointContext | null): void {
  if (typeof window === "undefined") return;
  try {
    if (!ctx) {
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        location_external_id: ctx.location_external_id,
        point_name: ctx.point_name,
      }),
    );
  } catch {
    /* ignore quota */
  }
}

/**
 * Контекст точки для field-экранов.
 * Warehouse/admin без личной привязки выбирают точку из проектов.
 */
export function useCardsFieldPoint(options: {
  canPickAnyPoint: () => boolean;
  partner?: string | (() => string);
}) {
  const resolvePartner = () =>
    typeof options.partner === "function"
      ? options.partner()
      : (options.partner ?? "otp");
  const projectsStore = useProjectsStore();

  const notBound = ref(false);
  const needsPointPick = ref(false);
  const pointContext = ref<PointContext | null>(null);
  const pointOptions = ref<CardsFieldPointOption[]>([]);
  const pointsLoading = ref(false);

  const pointSelectValue = computed({
    get: () => pointContext.value?.location_external_id ?? "",
    set: (location: string) => {
      void selectPoint(location);
    },
  });

  const loadPointOptions = async () => {
    pointsLoading.value = true;
    try {
      const cfg = await fetchCardsConfig();
      const enabled = new Set((cfg.projects ?? []).map((p) => Number(p.id)));

      let list: any[] = projectsStore.projects ?? [];
      let fetchErr: string | null = null;
      const locationCount = () => {
        let n = 0;
        for (const p of list) {
          if (!enabled.has(Number(p.id))) continue;
          for (const pt of p.points ?? []) {
            if (pt?.core_location_external_id) n += 1;
          }
        }
        return n;
      };
      if (!list.length || locationCount() === 0) {
        try {
          list = (await projectsStore.fetchProjects(true)) ?? [];
        } catch (e: any) {
          fetchErr = String(e?.message || e);
          list = projectsStore.projects ?? [];
        }
      }

      const opts: CardsFieldPointOption[] = [];
      for (const p of list) {
        if (!enabled.has(Number(p.id))) continue;
        for (const pt of p.points ?? []) {
          const location = pt.core_location_external_id;
          if (!location) continue;
          opts.push({
            id: String(location),
            name: pt.name || `Точка #${pt.id}`,
            location: String(location),
            projectName: p.name || "",
          });
        }
      }
      pointOptions.value = opts;
    } catch (e: any) {
      pointOptions.value = [];
    } finally {
      pointsLoading.value = false;
    }
  };

  const selectPoint = async (location: string) => {
    const found = pointOptions.value.find((p) => p.location === location);
    if (!found) return;
    pointContext.value = {
      location_external_id: found.location,
      point_name: found.projectName ? `${found.name} · ${found.projectName}` : found.name,
    };
    writeStoredPoint(pointContext.value);
    needsPointPick.value = false;
    notBound.value = false;
  };

  const applyStoredOrPick = async () => {
    await loadPointOptions();
    const stored = readStoredPoint();
    if (stored && pointOptions.value.some((p) => p.location === stored.location_external_id)) {
      pointContext.value = stored;
      needsPointPick.value = false;
      notBound.value = false;
      return true;
    }
    pointContext.value = null;
    needsPointPick.value = true;
    notBound.value = false;
    return false;
  };

  /**
   * @returns true если точка выбрана и можно грузить field-данные
   */
  const resolvePoint = async (): Promise<boolean> => {
    notBound.value = false;
    needsPointPick.value = false;

    // Склад/саппорт: без личной привязки — сразу picker/stored, без GET /api/cards/point (403/needs_pick).
    if (options.canPickAnyPoint()) {
      return applyStoredOrPick();
    }

    try {
      pointContext.value = await fetchMyPoint(resolvePartner());
      writeStoredPoint(pointContext.value);
      return true;
    } catch {
      /* нет личной привязки */
    }

    pointContext.value = null;
    notBound.value = true;
    return false;
  };

  const clearPickedPoint = () => {
    pointContext.value = null;
    writeStoredPoint(null);
    if (options.canPickAnyPoint()) {
      needsPointPick.value = true;
      notBound.value = false;
    } else {
      needsPointPick.value = false;
      notBound.value = true;
    }
  };

  return {
    notBound,
    needsPointPick,
    pointContext,
    pointOptions,
    pointsLoading,
    pointSelectValue,
    resolvePoint,
    selectPoint,
    loadPointOptions,
    clearPickedPoint,
  };
}
