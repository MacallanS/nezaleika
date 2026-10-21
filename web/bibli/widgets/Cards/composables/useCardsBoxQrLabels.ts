import { computed, onMounted, ref, watch } from "vue";

import {

  exportBoxQrLabels,

  fetchAllBoxes,

  fetchCentralBoxes,

  type CardBox,

} from "@/pages/cards/api";

import { useCardsNotify } from "./useCardsNotify";

import { useCardsProjectScope } from "./useCardsProjectScope";



export type QrLabelsMode = "all_office" | "pick";



export function useCardsBoxQrLabels() {

  const { notifyError, notifyWarn } = useCardsNotify();

  const { partner, ensureCardsProjectsLoaded } = useCardsProjectScope();



  const mode = ref<QrLabelsMode>("all_office");

  const pickedBoxIds = ref<number[]>([]);

  const centralBoxes = ref<CardBox[]>([]);

  const allBoxes = ref<CardBox[]>([]);

  const centralLoading = ref(false);

  const allBoxesLoading = ref(false);

  const includeAllBoxes = ref(false);

  const downloading = ref(false);



  const warehouseBoxCount = computed(() => centralBoxes.value.length);



  const pickerBoxes = computed(() =>

    includeAllBoxes.value ? allBoxes.value : centralBoxes.value,

  );



  const pickerLoading = computed(() =>

    includeAllBoxes.value ? allBoxesLoading.value : centralLoading.value,

  );



  const downloadDisabled = computed(

    () => mode.value === "pick" && !pickedBoxIds.value.length,

  );



  const boxCountForExport = computed(() =>

    mode.value === "pick" ? pickedBoxIds.value.length : warehouseBoxCount.value,

  );



  const summaryLine = computed(() => {

    const count = boxCountForExport.value;

    const boxes =

      count === 0

        ? "нет коробок"

        : count === 1

          ? "1 коробка"

          : `${count} коробок`;

    return `${boxes} · PNG 58×40 мм · архив .zip`;

  });



  const downloadLabel = computed(() =>

    downloading.value ? "Скачиваем…" : "Скачать архив PNG",

  );



  const loadCentral = async () => {

    centralLoading.value = true;

    try {

      centralBoxes.value = await fetchCentralBoxes(partner.value);

    } catch (error) {

      notifyError(error);

      centralBoxes.value = [];

    } finally {

      centralLoading.value = false;

    }

  };



  const loadAllBoxes = async () => {

    allBoxesLoading.value = true;

    try {

      allBoxes.value = await fetchAllBoxes(partner.value);

      pickedBoxIds.value = pickedBoxIds.value.filter((id) =>

        allBoxes.value.some((b) => b.id === id),

      );

    } catch (error) {

      notifyError(error);

      allBoxes.value = [];

    } finally {

      allBoxesLoading.value = false;

    }

  };



  const onPickedBoxes = (value: number | number[] | null) => {

    pickedBoxIds.value = Array.isArray(value)

      ? value.filter((n) => Number.isFinite(n))

      : value == null

        ? []

        : [value];

  };



  const download = async () => {

    if (mode.value === "pick" && !pickedBoxIds.value.length) {

      notifyWarn("Выберите хотя бы одну коробку", "QR коробок");

      return;

    }

    downloading.value = true;

    try {

      const ids = mode.value === "pick" ? pickedBoxIds.value : undefined;

      await exportBoxQrLabels(ids, partner.value, "png_zip");

    } catch (error) {

      notifyError(error);

    } finally {

      downloading.value = false;

    }

  };



  watch(includeAllBoxes, (on) => {

    if (on && !allBoxes.value.length && !allBoxesLoading.value) {

      void loadAllBoxes();

    }

  });



  const reload = async () => {

    await loadCentral();

    if (includeAllBoxes.value) {

      await loadAllBoxes();

    }

  };



  onMounted(async () => {

    await ensureCardsProjectsLoaded();

    await loadCentral();

  });



  return {

    mode,

    pickedBoxIds,

    centralBoxes,

    allBoxes,

    pickerBoxes,

    includeAllBoxes,

    centralLoading,

    allBoxesLoading,

    pickerLoading,

    downloading,

    warehouseBoxCount,

    downloadDisabled,

    downloadLabel,

    summaryLine,

    boxCountForExport,

    onPickedBoxes,

    download,

    reload,

    partner,

  };

}


