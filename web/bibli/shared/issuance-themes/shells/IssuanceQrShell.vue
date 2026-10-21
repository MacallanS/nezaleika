<template>
  <Teleport to="body">
    <div
      v-if="visible"
      ref="shellRef"
      class="issuance-shell__overlay"
      @click.self="close"
    >
      <div
        class="issuance-shell__panel"
        :class="{
          'issuance-shell__card': hasBackgroundImage,
        }"
      >
        <button
          v-if="theme.layout.showCloseButton"
          type="button"
          class="issuance-shell__close-btn"
          aria-label="Закрыть"
          @click="close"
        >
          <i class="pi pi-times"></i>
        </button>

        <img
          v-if="hasBackgroundImage"
          :src="theme.layout.backgroundImage!"
          alt=""
          class="issuance-shell__card-bg"
        />

        <div v-if="showBrandingBlock" class="issuance-shell__branding">
          <img
            v-if="showLogo"
            :src="productLogo!"
            alt="Логотип"
            class="issuance-shell__product-logo"
          />
          <p v-if="displayHeadline" class="issuance-shell__headline">
            {{ displayHeadline }}
          </p>
          <p v-if="displaySubheadline" class="issuance-shell__subheadline">
            {{ displaySubheadline }}
          </p>
          <p v-if="productName && !displayHeadline" class="issuance-shell__headline">
            {{ productName }}
          </p>
        </div>

        <div class="issuance-shell__qr-frame">
          <canvas
            ref="canvasRef"
            class="issuance-shell__qr-canvas"
            :width="canvasSize"
            :height="canvasSize"
          ></canvas>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, watch } from 'vue';
import { applyTheme, clearTheme } from '../applyTheme';
import { generateBrandedQr } from '../generateBrandedQr';
import { resolveShellTheme } from '../mergeTheme';
import type { IssuanceThemeTokens, ThemeOverrides, ThemePreset } from '../types';
import '../issuance-shell.css';

interface Props {
  visible: boolean;
  qrUrl?: string;
  theme?: IssuanceThemeTokens;
  preset?: ThemePreset;
  overrides?: ThemeOverrides | null;
  productName?: string;
  productLogo?: string | null;
  canvasSize?: number;
  /** @deprecated Ignored — shell variant is always QR. Kept for Products.vue compat. */
  variant?: string;
}

interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'close'): void;
}

defineOptions({ inheritAttrs: false });

const props = withDefaults(defineProps<Props>(), {
  preset: 'platform',
  canvasSize: 200,
});

const emit = defineEmits<Emits>();

const shellRef = ref<HTMLElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);

const theme = computed(() =>
  resolveShellTheme(props.theme, props.preset, props.overrides, { variant: 'qr' }),
);

const hasBackgroundImage = computed(() => Boolean(theme.value.layout?.backgroundImage));

const showLogo = computed(
  () => theme.value.branding.showLogo && Boolean(props.productLogo),
);

const displayHeadline = computed(() => theme.value.branding.headline ?? null);
const displaySubheadline = computed(() => theme.value.branding.subheadline ?? null);

const showBrandingBlock = computed(
  () =>
    showLogo.value ||
    Boolean(displayHeadline.value) ||
    Boolean(displaySubheadline.value) ||
    Boolean(props.productName && !hasBackgroundImage.value),
);

async function renderQr(url: string) {
  const canvas = canvasRef.value;
  if (!canvas) {
    return;
  }

  await generateBrandedQr(canvas, url, null, { size: props.canvasSize });
}

function applyShellTheme() {
  if (shellRef.value) {
    applyTheme(shellRef.value, theme.value);
  }
}

function close() {
  emit('update:visible', false);
  emit('close');
}

watch(
  () => props.visible,
  async (isOpen) => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      await nextTick();
      applyShellTheme();
      if (props.qrUrl) {
        await renderQr(props.qrUrl);
      }
      return;
    }

    document.body.style.overflow = '';
    if (shellRef.value) {
      clearTheme(shellRef.value);
    }
  },
  { immediate: true },
);

watch(
  () => [props.qrUrl, props.visible, theme.value] as const,
  async ([url, isOpen]) => {
    if (isOpen && url) {
      await nextTick();
      await renderQr(url);
    }
  },
);

onUnmounted(() => {
  document.body.style.overflow = '';
  if (shellRef.value) {
    clearTheme(shellRef.value);
  }
});
</script>
