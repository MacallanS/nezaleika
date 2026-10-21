<template>
  <div class="cards-cam">
    <AuthRRButton
      v-if="!open"
      variant="brand-primary"
      class="cards-cam__start"
      :label="loading ? 'Открываем камеру…' : startLabel"
      :loading="loading"
      :disabled="loading"
      @click="openCamera"
    />

    <Teleport to="body">
      <div
        v-if="open"
        class="cards-cam__overlay"
        role="dialog"
        aria-modal="true"
        :aria-label="startLabel"
      >
        <video
          ref="videoRef"
          class="cards-cam__video"
          playsinline
          webkit-playsinline="true"
          muted
          autoplay
        />

        <div v-if="active && !error" class="cards-cam__dim" aria-hidden="true" />
        <div v-if="active && !error" class="cards-cam__guide" aria-hidden="true">
          <div class="cards-cam__frame" :class="{ 'cards-cam__frame--ok': showOk }">
            <svg
              v-if="showOk"
              class="cards-cam__check"
              width="64"
              height="64"
              viewBox="0 0 64 64"
              fill="none"
              aria-hidden="true"
            >
              <circle cx="32" cy="32" r="30" fill="rgba(52, 199, 89, 0.92)" />
              <path
                d="M18 33.5l9.5 9.5L46 22"
                stroke="#fff"
                stroke-width="4.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>
        </div>

        <button type="button" class="cards-cam__close" aria-label="Закрыть" @click="closeCamera">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M3 3l8 8M11 3L3 11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
          </svg>
        </button>

        <div v-if="error" class="cards-cam__blocked">
          <p class="cards-cam__blocked-title">{{ error }}</p>
          <p v-if="errorHint" class="cards-cam__blocked-hint">{{ errorHint }}</p>
          <button type="button" class="cards-cam__btn" @click="retryCamera">Попробовать ещё раз</button>
          <button type="button" class="cards-cam__btn cards-cam__btn--ghost" @click="closeCamera">
            Закрыть
          </button>
        </div>

        <div v-else-if="loading" class="cards-cam__blocked">
          <p class="cards-cam__blocked-title">Открываем камеру…</p>
        </div>

        <div v-else class="cards-cam__footer">
          <p v-if="hasScannedCount" class="cards-cam__count" aria-live="polite">
            Отсканировано: {{ scannedCount }}
          </p>
          <p class="cards-cam__hint">{{ lastFlash || "Наведите на QR — код добавится сам" }}</p>
          <div class="cards-cam__actions">
            <button
              type="button"
              class="cards-cam__side"
              aria-label="Сменить камеру"
              :disabled="!canSwitchCamera || loading"
              @click="switchCamera"
            >
              <i class="pi pi-sync" aria-hidden="true" />
            </button>
            <button type="button" class="cards-cam__stop" @click="closeCamera">Готово</button>
            <button
              type="button"
              class="cards-cam__side"
              :class="{ 'cards-cam__side--on': torchOn }"
              aria-label="Вспышка"
              :disabled="!torchSupported || loading"
              @click="toggleTorch"
            >
              <i class="pi pi-bolt" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onDeactivated, ref, watch } from "vue";
import { AuthRRButton } from "bibli/shared/ui/rr";
import { useAppOverlayBinding } from "bibli/shared/composables/useAppOverlayBinding";
import { useQrScanner } from "../composables/useQrScanner";

const props = withDefaults(
  defineProps<{
    startLabel?: string;
    /** Текущее число принятых сканов у родителя; рост → галочка в рамке. */
    scannedCount?: number;
  }>(),
  {
    startLabel: "Сканировать камерой",
    scannedCount: undefined,
  },
);

const emit = defineEmits<{ (e: "decode", value: string): void }>();

const open = ref(false);
const lastFlash = ref("");
const showOk = ref(false);
const hasScannedCount = computed(() => typeof props.scannedCount === "number");
const {
  videoRef,
  active,
  loading,
  error,
  errorHint,
  torchSupported,
  torchOn,
  canSwitchCamera,
  start,
  stop,
  resetLast,
  toggleTorch,
  switchCamera,
} = useQrScanner();

useAppOverlayBinding(open);

let flashTimer: number | null = null;
let okTimer: number | null = null;
let bodyOverflowPrev = "";
let htmlOverflowPrev = "";
let scrollLocked = false;

const lockScroll = () => {
  if (typeof document === "undefined" || scrollLocked) return;
  bodyOverflowPrev = document.body.style.overflow;
  htmlOverflowPrev = document.documentElement.style.overflow;
  document.body.style.overflow = "hidden";
  document.documentElement.style.overflow = "hidden";
  scrollLocked = true;
};

const unlockScroll = () => {
  if (typeof document === "undefined" || !scrollLocked) return;
  document.body.style.overflow = bodyOverflowPrev;
  document.documentElement.style.overflow = htmlOverflowPrev;
  scrollLocked = false;
};

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === "Escape" && open.value) {
    event.preventDefault();
    closeCamera();
  }
};

const bindKeys = (enabled: boolean) => {
  if (typeof window === "undefined") return;
  if (enabled) window.addEventListener("keydown", onKeydown);
  else window.removeEventListener("keydown", onKeydown);
};

const triggerOk = () => {
  showOk.value = true;
  lastFlash.value = "Готово";
  if (okTimer != null) window.clearTimeout(okTimer);
  if (flashTimer != null) window.clearTimeout(flashTimer);
  okTimer = window.setTimeout(() => {
    showOk.value = false;
  }, 1200);
  flashTimer = window.setTimeout(() => {
    lastFlash.value = "";
  }, 1400);
};

const runStart = async () => {
  await nextTick();
  await start((value) => {
    emit("decode", value);
  });
};

const openCamera = async () => {
  open.value = true;
  lastFlash.value = "";
  showOk.value = false;
  lockScroll();
  bindKeys(true);
  await runStart();
};

const retryCamera = async () => {
  lastFlash.value = "";
  showOk.value = false;
  await runStart();
};

const closeCamera = () => {
  stop();
  open.value = false;
  lastFlash.value = "";
  showOk.value = false;
  unlockScroll();
  bindKeys(false);
};

watch(open, (v) => {
  if (!v) {
    stop();
    unlockScroll();
    bindKeys(false);
  }
});

watch(
  () => props.scannedCount,
  (next, prev) => {
    if (!open.value) return;
    if (typeof next !== "number" || typeof prev !== "number") return;
    if (next > prev) triggerOk();
  },
);

onDeactivated(() => {
  closeCamera();
});

onBeforeUnmount(() => {
  if (flashTimer != null) window.clearTimeout(flashTimer);
  if (okTimer != null) window.clearTimeout(okTimer);
  closeCamera();
});

defineExpose({ open, closeCamera, resetLast });
</script>

<style scoped>
.cards-cam__start {
  width: 100%;
  min-height: 48px;
}

.cards-cam__overlay {
  position: fixed;
  inset: 0;
  z-index: 10050;
  background: #1c1c1e;
  color: #fff;
  font-family: var(--rr-font-family-font-family, Manrope, system-ui, sans-serif);
  touch-action: none;
}

.cards-cam__video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: #1c1c1e;
}

.cards-cam__dim {
  position: absolute;
  inset: 0;
  background: rgba(28, 28, 30, 0.28);
  pointer-events: none;
}

.cards-cam__guide {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  pointer-events: none;
  z-index: 1;
}

.cards-cam__frame {
  position: relative;
  display: grid;
  place-items: center;
  width: min(72vw, 280px);
  aspect-ratio: 1;
  border: 2px solid rgba(255, 255, 255, 0.92);
  border-radius: 20px;
  box-shadow: 0 0 0 9999px rgba(28, 28, 30, 0.45);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.cards-cam__frame--ok {
  border-color: #34c759;
  box-shadow:
    0 0 0 9999px rgba(28, 28, 30, 0.45),
    inset 0 0 0 2px rgba(52, 199, 89, 0.35);
}

.cards-cam__check {
  animation: cards-cam-check-in 0.28s ease-out;
}

@keyframes cards-cam-check-in {
  from {
    opacity: 0;
    transform: scale(0.7);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.cards-cam__close {
  position: absolute;
  top: calc(16px + env(safe-area-inset-top, 0px));
  right: max(16px, env(safe-area-inset-right, 0px));
  z-index: 3;
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 999px;
  background: #78788080;
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  color: #fff;
  cursor: pointer;
  display: grid;
  place-items: center;
}

.cards-cam__blocked {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 24px;
  text-align: center;
}

.cards-cam__blocked-title {
  margin: 0;
  max-width: 320px;
  font-size: 17px;
  font-weight: 600;
  line-height: 24px;
}

.cards-cam__blocked-hint {
  margin: 0;
  max-width: 320px;
  font-size: 14px;
  line-height: 20px;
  color: rgba(255, 255, 255, 0.72);
}

.cards-cam__btn,
.cards-cam__stop {
  border: none;
  border-radius: 12px;
  padding: 12px 18px;
  min-height: 48px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  background: #fff;
  color: #101012;
}

.cards-cam__btn--ghost {
  background: transparent;
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.35);
}

.cards-cam__footer {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 3;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 16px 16px calc(20px + env(safe-area-inset-bottom, 0px));
}

.cards-cam__count {
  margin: 0;
  padding: 8px 18px;
  border-radius: 999px;
  background: rgba(52, 199, 89, 0.92);
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  line-height: 22px;
  letter-spacing: 0.01em;
  font-variant-numeric: tabular-nums;
}

.cards-cam__hint {
  margin: 0;
  max-width: calc(100% - 32px);
  padding: 10px 16px;
  border-radius: 12px;
  background: #78788080;
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  font-size: 15px;
  line-height: 22px;
  text-align: center;
  word-break: break-word;
}

.cards-cam__actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  width: 100%;
}

.cards-cam__side {
  width: 48px;
  height: 48px;
  border: none;
  border-radius: 999px;
  background: #78788080;
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  color: #fff;
  cursor: pointer;
  display: grid;
  place-items: center;
  font-size: 16px;
}

.cards-cam__side:disabled {
  opacity: 0.35;
  cursor: default;
}

.cards-cam__side--on {
  background: #f59e0b;
  color: #101012;
}

.cards-cam__stop {
  min-width: 132px;
}
</style>
