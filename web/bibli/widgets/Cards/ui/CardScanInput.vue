<template>
  <div class="scan-input">
    <div
      v-if="visibleModeOptions.length > 1"
      class="scan-input__modes"
      role="group"
      aria-label="Способ ввода кода"
    >
      <button
        v-for="option in visibleModeOptions"
        :key="option.key"
        type="button"
        class="scan-input__mode"
        :class="{ 'scan-input__mode--active': mode === option.key }"
        @click="setMode(option.key)"
      >
        <i :class="option.icon" aria-hidden="true" />
        {{ option.label }}
      </button>
    </div>

    <!-- HID-сканер: код «печатается» в поле, завершитель ловит useHidScanner -->
    <div v-if="mode === 'hid'" class="scan-input__hid">
      <input
        ref="hidField"
        v-model="hidValue"
        type="text"
        class="scan-input__field"
        placeholder="Курсор здесь — сканируйте карты подряд"
        autocomplete="off"
        autocorrect="off"
        autocapitalize="off"
        spellcheck="false"
        @keydown="handleKeydown"
        @input="handleInput"
        @blur="refocusHid"
      />
      <p class="scan-input__hint">
        Каждый скан добавляется сам. Поле держит фокус — ничего нажимать не нужно.
      </p>
    </div>

    <!-- Камера: fullscreen QR как в оформлении (Passport) -->
    <CardsCameraCapture
      v-else-if="mode === 'camera'"
      :start-label="startLabel"
      :scanned-count="scannedCount"
      @decode="emitDecode"
    />

    <!-- Excel: выгрузка шаблона + загрузка кодов -->
    <div v-else-if="mode === 'excel'" class="scan-input__excel">
      <div class="scan-input__template">
        <div class="scan-input__template-head">
          <strong>Пример шаблона</strong>
          <span>Один столбец «Код» — по коду в строке</span>
        </div>
        <div class="scan-input__template-table" role="table" aria-label="Пример шаблона Excel">
          <div class="scan-input__template-row scan-input__template-row--head" role="row">
            <span role="columnheader">Код</span>
          </div>
          <div
            v-for="sample in TEMPLATE_SAMPLES"
            :key="sample"
            class="scan-input__template-row"
            role="row"
          >
            <span role="cell">{{ sample }}</span>
          </div>
        </div>
      </div>

      <div class="scan-input__excel-actions">
        <AuthRRButton
          type="button"
          variant="neutral-secondary"
          :label="templateLoading ? 'Готовим…' : 'Скачать шаблон'"
          :loading="templateLoading"
          :disabled="templateLoading"
          @click="downloadTemplate"
        />
        <AuthRRButton
          type="button"
          variant="brand-primary"
          :label="importLoading ? 'Загружаем…' : 'Загрузить Excel'"
          :loading="importLoading"
          :disabled="importLoading"
          @click="openFilePicker"
        />
        <input
          ref="fileInputRef"
          type="file"
          accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
          class="scan-input__upload-input"
          :disabled="importLoading"
          @change="onFilePicked"
        />
      </div>

      <p v-if="excelError" class="scan-input__error">{{ excelError }}</p>
      <p v-else-if="importHint" class="scan-input__hint">{{ importHint }}</p>
      <p v-else class="scan-input__hint">
        Скачайте шаблон, заполните коды и загрузите файл — коды добавятся в список.
      </p>
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from "vue";
import { AuthRRButton } from "bibli/shared/ui/rr";
import { getXlsx } from "@/shared/lib/lazy/lazyLibs";
import CardsCameraCapture from "./CardsCameraCapture.vue";
import { useHidScanner } from "../composables/useHidScanner";
import "./cards-shared.css";

type ScanMode = "hid" | "camera" | "excel";

const ALL_MODES: ScanMode[] = ["hid", "camera", "excel"];
const TEMPLATE_SAMPLES = ["QR-001234", "QR-001235", "QR-001236"] as const;
const TEMPLATE_HEADER = "Код";

const props = withDefaults(
  defineProps<{
    startLabel?: string;
    defaultMode?: ScanMode;
    allowedModes?: ScanMode[];
    /** На телефоне предпочитать камеру, если она в allowedModes. */
    preferCameraOnTouch?: boolean;
    /** Число принятых сканов — для галочки и счётчика в камере. */
    scannedCount?: number;
  }>(),
  {
    startLabel: "Сканировать",
    defaultMode: "camera",
    allowedModes: () => ["camera"] as ScanMode[],
    preferCameraOnTouch: true,
    scannedCount: undefined,
  },
);

const emit = defineEmits<{
  (e: "decode", value: string): void;
  (e: "excel-import", payload: { sheetName: string; codesCount: number }): void;
}>();

const modeOptions: { key: ScanMode; label: string; icon: string }[] = [
  { key: "hid", label: "Сканер", icon: "pi pi-qrcode" },
  { key: "camera", label: "Камера", icon: "pi pi-camera" },
  { key: "excel", label: "Excel", icon: "pi pi-file-excel" },
];

const allowed = computed(() => {
  const list = props.allowedModes?.length ? props.allowedModes : ALL_MODES;
  return list.filter((m, i, arr) => ALL_MODES.includes(m) && arr.indexOf(m) === i);
});

const visibleModeOptions = computed(() =>
  modeOptions.filter((option) => allowed.value.includes(option.key)),
);

const isTouchDevice = () =>
  typeof window !== "undefined" &&
  (window.matchMedia?.("(pointer: coarse)").matches ||
    navigator.maxTouchPoints > 0);

const resolveInitialMode = (): ScanMode => {
  if (
    props.preferCameraOnTouch &&
    isTouchDevice() &&
    allowed.value.includes("camera")
  ) {
    return "camera";
  }
  if (allowed.value.includes(props.defaultMode)) return props.defaultMode;
  return allowed.value[0] ?? "camera";
};

const mode = ref<ScanMode>(resolveInitialMode());
const hidField = ref<HTMLInputElement | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);
const templateLoading = ref(false);
const importLoading = ref(false);
const excelError = ref("");
const importHint = ref("");

const emitDecode = (code: string) => {
  const value = code.trim();
  if (value) emit("decode", value);
};

const { value: hidValue, handleKeydown, handleInput } = useHidScanner(emitDecode);

const focusHid = () => nextTick(() => hidField.value?.focus());

const refocusHid = () => {
  if (mode.value === "hid") setTimeout(() => hidField.value?.focus(), 0);
};

const setMode = (next: ScanMode) => {
  mode.value = next;
  excelError.value = "";
  importHint.value = "";
  if (next === "hid") focusHid();
};

const downloadTemplate = async () => {
  templateLoading.value = true;
  excelError.value = "";
  try {
    const XLSX = await getXlsx();
    const rows = [[TEMPLATE_HEADER], ...TEMPLATE_SAMPLES.map((code) => [code])];
    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    worksheet["!cols"] = [{ wch: 24 }];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Коды");
    XLSX.writeFile(workbook, "cards-codes-template.xlsx");
  } catch {
    excelError.value = "Не удалось скачать шаблон. Попробуйте ещё раз.";
  } finally {
    templateLoading.value = false;
  }
};

const openFilePicker = () => {
  fileInputRef.value?.click();
};

const cellText = (value: unknown): string => {
  if (value == null) return "";
  return String(value).trim();
};

const parseCodesFromSheet = (rows: unknown[][]): string[] => {
  if (!rows.length) return [];

  const headerCells = (rows[0] ?? []).map(cellText);
  const headerIdx = headerCells.findIndex((cell) =>
    /^(код|code|qr|barcode|штрих.?код)$/i.test(cell),
  );

  const codes: string[] = [];
  const seen = new Set<string>();

  if (headerIdx >= 0) {
    for (let i = 1; i < rows.length; i++) {
      const code = cellText(rows[i]?.[headerIdx]);
      if (!code || seen.has(code)) continue;
      seen.add(code);
      codes.push(code);
    }
    return codes;
  }

  // Без заголовка — берём первый столбец, пропуская строку-пример «Код».
  for (let i = 0; i < rows.length; i++) {
    const code = cellText(rows[i]?.[0]);
    if (!code || /^код$/i.test(code) || seen.has(code)) continue;
    seen.add(code);
    codes.push(code);
  }
  return codes;
};

const onFilePicked = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;

  importLoading.value = true;
  excelError.value = "";
  importHint.value = "";
  try {
    const XLSX = await getXlsx();
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      excelError.value = "В файле нет листов.";
      return;
    }
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      blankrows: false,
      defval: "",
    }) as unknown[][];

    const codes = parseCodesFromSheet(rows);
    if (!codes.length) {
      excelError.value = "В файле не найдены коды. Скачайте шаблон и заполните столбец «Код».";
      return;
    }

    for (const code of codes) emitDecode(code);
    emit("excel-import", { sheetName, codesCount: codes.length });
    importHint.value = `Добавлено кодов: ${codes.length}`;
  } catch {
    excelError.value = "Не удалось прочитать Excel. Проверьте формат файла.";
  } finally {
    importLoading.value = false;
  }
};

onMounted(() => {
  if (mode.value === "hid") focusHid();
});
</script>

<style scoped>
.scan-input {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.scan-input__modes {
  display: inline-flex;
  gap: 4px;
  padding: 4px;
  background: var(--rr-backgrounds-tetriary, #e7e8ee);
  border-radius: 14px;
  width: fit-content;
  max-width: 100%;
  overflow-x: auto;
}

.scan-input__mode {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: var(--rr-labels-neutral-secondary, #5f6673);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  white-space: nowrap;
}

.scan-input__mode--active {
  background: var(--rr-backgrounds-primary, #fff);
  color: var(--rr-input-text-default, #101012);
}

.scan-input__hid,
.scan-input__excel {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.scan-input__field {
  flex: 1;
  padding: 12px 14px;
  border: 1px solid color-mix(in srgb, var(--rr-input-border-default, #e5e7eb) 88%, transparent);
  border-radius: 12px;
  background: var(--rr-backgrounds-primary, #fff);
  color: var(--rr-input-text-default, #101012);
  font-size: 15px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.scan-input__field:focus {
  outline: none;
  border-color: var(--rr-button-brand-primary-background-default, #5b7dec);
  box-shadow: 0 0 0 3px rgba(91, 125, 236, 0.22);
}

.scan-input__hint {
  font-size: 12px;
  color: var(--rr-labels-neutral-secondary, #5f6673);
  margin: 0;
}

.scan-input__error {
  margin: 0;
  font-size: 13px;
  font-weight: 500;
  color: #cf1322;
}

.scan-input__template {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 16px;
  border-radius: 14px;
  border: 1px solid color-mix(in srgb, var(--rr-input-border-default, #e5e7eb) 88%, transparent);
  background: var(--rr-backgrounds-secondary, #f5f5f7);
}

.scan-input__template-head {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.scan-input__template-head strong {
  font-size: 14px;
  color: var(--rr-input-text-default, #101012);
}

.scan-input__template-head span {
  font-size: 12px;
  color: var(--rr-labels-neutral-secondary, #5f6673);
}

.scan-input__template-table {
  overflow: hidden;
  border-radius: 10px;
  border: 1px solid color-mix(in srgb, var(--rr-input-border-default, #e5e7eb) 88%, transparent);
  background: var(--rr-backgrounds-primary, #fff);
}

.scan-input__template-row {
  display: grid;
  grid-template-columns: 1fr;
  padding: 10px 14px;
  font-size: 13px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  color: var(--rr-input-text-default, #101012);
  border-top: 1px solid color-mix(in srgb, var(--rr-input-border-default, #e5e7eb) 70%, transparent);
}

.scan-input__template-row--head {
  border-top: none;
  font-family: inherit;
  font-weight: 600;
  font-size: 12px;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: var(--rr-labels-neutral-secondary, #5f6673);
  background: color-mix(in srgb, var(--rr-backgrounds-tetriary, #e7e8ee) 55%, #fff);
}

.scan-input__excel-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.scan-input__upload-input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

@media (max-width: 640px) {
  .scan-input__modes {
    width: 100%;
  }

  .scan-input__mode {
    flex: 1;
    justify-content: center;
    min-height: 44px;
    padding: 10px 12px;
  }

  .scan-input__excel-actions :deep(.auth-rr-button) {
    width: 100%;
    min-height: 48px;
  }

  .scan-input__field {
    min-height: 48px;
    font-size: 16px; /* iOS: меньше 16px → автозум */
  }

  .scan-input__excel-actions {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
