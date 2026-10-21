<template>
  <Teleport to="body">
    <div
      v-if="visible"
      ref="shellRef"
      class="issuance-shell__overlay"
      @click.self="close"
    >
      <div class="issuance-shell__panel issuance-shell--dual_qr">
        <button
          v-if="theme.layout.showCloseButton"
          type="button"
          class="issuance-shell__close-btn"
          aria-label="Закрыть"
          @click="close"
        >
          <i class="pi pi-times"></i>
        </button>

        <p v-if="theme.branding.headline" class="issuance-shell__headline">
          {{ theme.branding.headline }}
        </p>
        <p v-else-if="productName" class="issuance-shell__headline">
          {{ productName }}
        </p>

        <div class="issuance-shell__dual-actions">
          <button type="button" class="issuance-shell__dual-btn" @click="openQr('app')">
            <i class="pi pi-qrcode"></i>
            <span>{{ appLabel }}</span>
            <small>{{ appSubLabel }}</small>
          </button>
          <button type="button" class="issuance-shell__dual-btn" @click="openQr('sub')">
            <i class="pi pi-qrcode"></i>
            <span>{{ subLabel }}</span>
            <small>{{ subSubLabel }}</small>
          </button>
        </div>

        <div class="issuance-shell__dual-form">
          <label class="issuance-shell__field-label" for="issuance-dual-id-card">
            ID КАРТЫ КЛИЕНТА
          </label>
          <div class="issuance-shell__input-row">
            <input
              id="issuance-dual-id-card"
              v-model="idCard"
              type="text"
              class="issuance-shell__input"
              :class="{ 'issuance-shell__input--error': idCard && !isValidMask }"
              placeholder="ID"
            />
            <button
              type="button"
              class="issuance-shell__cam-btn"
              title="Сканировать"
              @click="openScannerModal"
            >
              <i class="pi pi-camera"></i>
            </button>
          </div>
          <small v-if="idCard && !isValidMask" class="issuance-shell__field-error">
            Формат: E + 16 символов + T + 6 символов
          </small>

          <div class="issuance-shell__checks">
            <label class="issuance-shell__check-row">
              <input v-model="isSub" type="checkbox" />
              <span>Подписка оформлена</span>
            </label>
            <label class="issuance-shell__check-row">
              <input v-model="isApp" type="checkbox" />
              <span>Приложение установлено</span>
            </label>
          </div>

          <div class="issuance-shell__dual-form-actions">
            <button type="button" class="issuance-shell__btn issuance-shell__btn--ghost" @click="close">
              Отменить
            </button>
            <button type="button" class="issuance-shell__btn issuance-shell__btn--primary" @click="handleSubmit">
              Записать
            </button>
          </div>
        </div>
      </div>
    </div>

    <IssuanceQrShell
      v-model:visible="qrVisible"
      :theme="qrTheme"
      :qr-url="activeQrUrl"
      :product-name="activeQrTitle"
      :canvas-size="canvasSize"
      @close="onQrClose"
    />

    <div
      v-if="scannerVisible"
      class="issuance-shell__scanner-overlay"
      @click.self="closeScannerModal"
    >
      <div class="issuance-shell__scanner-window">
        <div class="issuance-shell__scanner-header">
          <span>Сканирование QR</span>
          <button
            type="button"
            class="issuance-shell__scanner-x"
            aria-label="Закрыть"
            @click="closeScannerModal"
          >
            <i class="pi pi-times"></i>
          </button>
        </div>
        <div class="issuance-shell__scanner-view">
          <video
            v-show="cameraStream && !cameraError"
            ref="cameraPreviewVideo"
            class="issuance-shell__scanner-video"
            autoplay
            playsinline
            muted
          ></video>
          <div v-if="cameraError" class="issuance-shell__scanner-error">
            <i class="pi pi-exclamation-triangle"></i>
            <p>{{ cameraError }}</p>
          </div>
        </div>
        <div class="issuance-shell__scanner-footer">
          <button
            type="button"
            class="issuance-shell__btn issuance-shell__btn--ghost"
            @click="closeScannerModal"
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, watch } from 'vue';
import { useToast } from '../../ui';
import { applyTheme, clearTheme } from '../applyTheme';
import { resolveShellTheme } from '../mergeTheme';
import type { IssuanceThemeTokens, ThemeOverrides, ThemePreset } from '../types';
import IssuanceQrShell from './IssuanceQrShell.vue';
import '../issuance-shell.css';

type DualSlot = 'app' | 'sub';

export type DualQrSubmitPayload = {
  id_card: string;
  is_app: boolean;
  is_sub: boolean;
};

interface Props {
  visible: boolean;
  qrAppUrl: string;
  qrSubUrl: string;
  theme?: IssuanceThemeTokens;
  preset?: ThemePreset;
  overrides?: ThemeOverrides | null;
  productName?: string;
  qrAppCode?: string;
  qrSubCode?: string;
  closeQrSignal?: number;
  qrRefreshSignal?: number;
  appLabel?: string;
  subLabel?: string;
  appSubLabel?: string;
  subSubLabel?: string;
  canvasSize?: number;
}

interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'close'): void;
  (e: 'qr-open', slot: DualSlot): void;
  (e: 'qr-switch', code: string): void;
  (e: 'submit', payload: DualQrSubmitPayload): void;
}

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<Props>(), {
  preset: 'magnit',
  qrAppCode: '',
  qrSubCode: '',
  closeQrSignal: 0,
  qrRefreshSignal: 0,
  appLabel: 'Приложение',
  subLabel: 'Подписка',
  appSubLabel: 'Открыть QR-код',
  subSubLabel: 'Открыть QR-код',
  canvasSize: 200,
});

const emit = defineEmits<Emits>();
const toast = useToast();

const shellRef = ref<HTMLElement | null>(null);
const qrVisible = ref(false);
const activeSlot = ref<DualSlot>('app');
const idCard = ref('');
const isSub = ref(false);
const isApp = ref(false);

const scannerVisible = ref(false);
const cameraPreviewVideo = ref<HTMLVideoElement | null>(null);
const cameraStream = ref<MediaStream | null>(null);
const cameraError = ref('');
const scanLoop = ref<number | null>(null);
let barcodeDetector: any = null;
let lastInvalidToast = 0;

const isValidMask = computed(() =>
  /^E[a-zA-Z0-9]{16}T[a-zA-Z0-9]{6}$/.test(idCard.value.trim()),
);

const theme = computed(() =>
  resolveShellTheme(props.theme, props.preset, props.overrides, { variant: 'dual_qr' }),
);

const qrTheme = computed(() => ({
  ...theme.value,
  variant: 'qr' as const,
  layout: {
    ...theme.value.layout,
    fullscreen: false,
  },
}));

const activeQrUrl = computed(() =>
  activeSlot.value === 'app' ? props.qrAppUrl : props.qrSubUrl,
);

const activeQrTitle = computed(() =>
  activeSlot.value === 'app' ? props.appLabel : props.subLabel,
);

function applyShellTheme() {
  if (shellRef.value) {
    applyTheme(shellRef.value, theme.value);
  }
}

function openQr(slot: DualSlot) {
  activeSlot.value = slot;
  qrVisible.value = true;
  emit('qr-open', slot);
  const code = slot === 'app' ? props.qrAppCode : props.qrSubCode;
  if (code) {
    emit('qr-switch', code);
  }
}

function handleSubmit() {
  if (!idCard.value.trim() || !isValidMask.value || (!isSub.value && !isApp.value)) {
    return;
  }

  emit('submit', {
    id_card: idCard.value.trim(),
    is_app: isApp.value,
    is_sub: isSub.value,
  });
}

function close() {
  closeScannerModal();
  emit('update:visible', false);
  emit('close');
}

function onQrClose() {
  qrVisible.value = false;
}

function resetForm() {
  idCard.value = '';
  isSub.value = false;
  isApp.value = false;
  qrVisible.value = false;
  activeSlot.value = 'app';
  closeScannerModal();
}

async function openScannerModal() {
  scannerVisible.value = true;
  cameraError.value = '';

  if (!barcodeDetector && typeof window !== 'undefined' && 'BarcodeDetector' in window) {
    try {
      barcodeDetector = new (window as any).BarcodeDetector({
        formats: ['qr_code'],
      });
    } catch {
      barcodeDetector = null;
    }
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'environment',
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    });
    cameraStream.value = stream;
    await nextTick();
    if (cameraPreviewVideo.value) {
      cameraPreviewVideo.value.srcObject = stream;
      await cameraPreviewVideo.value.play();
      startScanning();
    }
  } catch {
    cameraError.value =
      'Не удалось получить доступ к камере. Проверьте разрешения браузера.';
  }
}

function closeScannerModal() {
  scannerVisible.value = false;
  if (scanLoop.value !== null) {
    clearTimeout(scanLoop.value);
    scanLoop.value = null;
  }
  cameraStream.value?.getTracks().forEach((t) => t.stop());
  cameraStream.value = null;
  if (cameraPreviewVideo.value) {
    cameraPreviewVideo.value.srcObject = null;
  }
}

async function decodeWithJsQr(video: HTMLVideoElement): Promise<string | null> {
  try {
    const { default: jsQR } = await import('jsqr');
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return (
      jsQR(img.data, img.width, img.height, {
        inversionAttempts: 'attemptBoth',
      })?.data ?? null
    );
  } catch {
    return null;
  }
}

function startScanning() {
  if (scanLoop.value !== null) clearTimeout(scanLoop.value);

  const scan = async () => {
    if (!scannerVisible.value) return;

    try {
      const video = cameraPreviewVideo.value;
      if (
        video &&
        video.readyState >= video.HAVE_CURRENT_DATA &&
        video.videoWidth > 0
      ) {
        let rawValue: string | null = null;

        if (barcodeDetector) {
          try {
            const codes = await barcodeDetector.detect(video);
            rawValue = codes?.[0]?.rawValue ?? null;
          } catch {
            /* ignore */
          }
        }

        if (!rawValue) {
          rawValue = await decodeWithJsQr(video);
        }

        if (rawValue) {
          idCard.value = rawValue.trim();
          if (isValidMask.value) {
            toast.add({
              severity: 'success',
              summary: 'Готово',
              detail: 'Код успешно считан',
              life: 2000,
            });
            qrVisible.value = false;
            closeScannerModal();
            return;
          }

          const now = Date.now();
          if (now - lastInvalidToast > 3000) {
            lastInvalidToast = now;
            toast.add({
              severity: 'warn',
              summary: 'Неверный код',
              detail: 'QR не соответствует формату E...T...',
              life: 2500,
            });
          }
        }
      }
    } catch (err) {
      console.error('[IssuanceDualQrShell scan error]', err);
    }

    if (scannerVisible.value) {
      scanLoop.value = window.setTimeout(scan, 200);
    }
  };

  void scan();
}

watch(
  () => props.qrRefreshSignal,
  () => {
    if (!qrVisible.value || !activeSlot.value) {
      return;
    }
    qrVisible.value = false;
    void nextTick(() => {
      qrVisible.value = true;
    });
  },
);

watch(
  () => props.closeQrSignal,
  () => {
    qrVisible.value = false;
    activeSlot.value = 'app';
  },
);

watch(
  () => props.visible,
  async (isOpen) => {
    if (isOpen) {
      resetForm();
      document.body.style.overflow = 'hidden';
      await nextTick();
      applyShellTheme();
      return;
    }

    document.body.style.overflow = '';
    resetForm();
    if (shellRef.value) {
      clearTheme(shellRef.value);
    }
  },
  { immediate: true },
);

onUnmounted(() => {
  document.body.style.overflow = '';
  closeScannerModal();
  if (shellRef.value) {
    clearTheme(shellRef.value);
  }
});
</script>
