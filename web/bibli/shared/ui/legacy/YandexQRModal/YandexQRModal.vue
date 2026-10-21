<template>
  <Teleport to="body">
    <div v-if="visible" class="yandex-qr-modal-overlay" :data-white="type === 'yandex-white'" @click.self="close">
      <div class="yandex-qr-modal">
        <button class="yandex-close-btn" @click="close" aria-label="Закрыть">
          <i class="pi pi-times"></i>
        </button>
        <div class="yandex-qr-content">
          <div v-if="actionText" class="yandex-qr-info">
            <img v-if="productLogo" :src="productLogo" alt="Логотип" class="yandex-product-logo" />
            <p class="yandex-keyboards-title">{{ actionText }}</p>
          </div>
          <div v-else-if="type === 'yandex'" class="yandex-qr-info">
            <img v-if="productLogo" :src="productLogo" alt="Логотип" class="yandex-product-logo" />
            <p data-v-50f32d06=""><strong data-v-50f32d06="">Дарит 100 рублей</strong> За смену поиска на IOS </p>
          </div>
          <div v-else-if="type === 'yandex-keyboards'" class="yandex-qr-info">
            <img v-if="productLogo" :src="productLogo" alt="Логотип" class="yandex-product-logo" />
            <p class="yandex-keyboards-title">Выдача</p>
          </div>
          <div class="yandex-qr-image-container">
            <canvas ref="canvasRef" class="yandex-qr-canvas" :width="canvasSize" :height="canvasSize"></canvas>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { watch, nextTick, ref, onUnmounted } from 'vue';
import { useAppOverlayBinding } from 'bibli/shared/composables/useAppOverlayBinding';
import { MODAL_OVERLAY_Z_INDEX } from 'bibli/shared/utils/layerZIndex';

interface Props {
  visible: boolean;
  qrUrl?: string;
  type?: 'yandex' | 'yandex-white' | 'yandex-keyboards';
  productLogo?: string;
  actionText?: string;
}

interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'close'): void;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'yandex'
});

const emit = defineEmits<Emits>();

const canvasRef = ref<HTMLCanvasElement | null>(null);
const canvasSize = 200;

watch(() => props.visible, async (newVal) => {
  if (newVal && props.qrUrl) {
    await nextTick();
    generateQRCode(props.qrUrl);
  }
});

watch(() => props.qrUrl, async (newUrl) => {
  if (props.visible && newUrl) {
    await nextTick();
    generateQRCode(newUrl);
  }
});

const generateQRCode = async (url: string) => {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return;
  }

  try {
    const canvas = canvasRef.value;
    if (!canvas) return;

    const QRCode = (await import('qrcode')).default;

    const qrDataURL = await QRCode.toDataURL(url, {
      width: canvasSize,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      ctx?.drawImage(img, 0, 0);
    };
    img.src = qrDataURL;
  } catch (error) {
    console.error('Ошибка генерации QR кода:', error);
  }
};

const close = () => {
  emit('update:visible', false);
  emit('close');
};

const qrOverlayZIndex = MODAL_OVERLAY_Z_INDEX;
useAppOverlayBinding(() => props.visible);

// Блокировка скролла body при открытой модалке
watch(
  () => props.visible,
  (isOpen) => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  },
  { immediate: true }
);

// Очистка при размонтировании
onUnmounted(() => {
  document.body.style.overflow = '';
});
</script>

<style scoped>
.yandex-qr-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: var(--russ-yellow);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: v-bind(qrOverlayZIndex);
  animation: fadeIn 0.2s ease;
}

.yandex-qr-modal-overlay[data-white="true"] {
  background-color: var(--russ-bg) !important;
}


.yandex-qr-modal {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.yandex-close-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 10;
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 8px var(--russ-shadow-color);
  transition: all 0.2s ease;
  color: var(--russ-text-secondary);
  font-size: 18px;
}

.yandex-close-btn:hover {
  background: var(--russ-bg);
  transform: scale(1.05);
}

.yandex-qr-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 30px;
  width: 100%;
  height: 100%;
  padding: 2rem;
}

.yandex-qr-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 30px;
}

.yandex-qr-info p {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  color: var(--russ-text-primary);
  font-size: clamp(25px, calc(25px + (40 - 25) * ((100vw - 320px) / (600 - 320))), 40px);
  margin: 0;
}

.yandex-product-logo {
  width: 65%;
  max-width: 300px;
}

.yandex-keyboards-title {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  color: var(--russ-text-primary);
  font-size: clamp(25px, calc(25px + (40 - 25) * ((100vw - 320px) / (600 - 320))), 40px);
  margin: 0;
  font-weight: 600;
}

.yandex-qr-image-container {
  border: 0;
  background-color: var(--russ-bg);
  padding: 0;
  min-height: 200px;
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.yandex-qr-canvas {
  max-width: 200px;
  max-height: 200px;
  border-radius: 5px;
  display: block;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}
</style>
