<template>
  <div class="card-scanner">
    <div class="scanner-controls">
      <AuthRRButton
        v-if="!active"
        variant="brand-primary"
        :label="loading ? 'Открываем камеру…' : startLabel"
        :loading="loading"
        :disabled="loading"
        @click="onStart"
      />
      <AuthRRButton
        v-else
        variant="neutral-secondary"
        label="Остановить"
        @click="stop"
      />
    </div>

    <div class="scanner-viewport" :class="{ 'scanner-viewport--active': active }">
      <video
        v-show="active && !error"
        ref="videoRef"
        class="scanner-video"
        autoplay
        playsinline
        webkit-playsinline="true"
        muted
      ></video>
      <div v-if="active && !error" class="scanner-frame" aria-hidden="true"></div>
      <p v-if="error" class="scanner-error">
        {{ error }}
        <span v-if="errorHint" class="scanner-error__hint">{{ errorHint }}</span>
      </p>
      <p v-else-if="!active" class="scanner-hint">
        Нажмите «{{ startLabel }}» и наведите на QR досье
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { AuthRRButton } from "bibli/shared/ui/rr";
import { useQrScanner } from "../composables/useQrScanner";
import "./cards-shared.css";

withDefaults(defineProps<{ startLabel?: string }>(), {
  startLabel: "Сканировать",
});

const emit = defineEmits<{ (e: "decode", value: string): void }>();

const { videoRef, active, loading, error, errorHint, start, stop, resetLast } = useQrScanner();

const onStart = () => start((value) => emit("decode", value));

defineExpose({ active, stop, resetLast });
</script>

<style scoped>
.card-scanner {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.scanner-controls {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.scanner-viewport {
  position: relative;
  width: 100%;
  aspect-ratio: 3 / 4;
  max-height: 60vh;
  background: #101012;
  border-radius: var(--rr-radius-2-xl, 20px);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid color-mix(in srgb, var(--rr-input-border-default, #e5e7eb) 40%, #101012);
}

.scanner-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.scanner-frame {
  position: absolute;
  inset: 18%;
  border: 3px solid rgba(255, 255, 255, 0.85);
  border-radius: 16px;
  box-shadow: 0 0 0 100vmax rgba(0, 0, 0, 0.25);
}

.scanner-error {
  color: #ffb4b4;
  font-size: 14px;
  text-align: center;
  padding: 16px;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.scanner-error__hint {
  color: rgba(255, 255, 255, 0.7);
  font-size: 13px;
}

.scanner-hint {
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  text-align: center;
  padding: 16px;
  margin: 0;
}
</style>
