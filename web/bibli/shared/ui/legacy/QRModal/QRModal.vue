<template>
  <BaseModal v-model="modalVisible" :class="modalClass" :closable="type === 'default'" :close-on-overlay-click="false"
    :close-on-escape="type === 'default'" @hide="onHide">
    <template #header>
      <h3 v-if="type === 'default' && productName">{{ `QR код - ${productName}` }}</h3>
      <h3 v-else-if="type === 'default'">QR код для выдачи продукта</h3>
    </template>
    <div class="qr-content">
      <button v-if="type === 'yandex' || type === 'yandex-white'" class="qr-close-btn" @click="close"
        aria-label="Закрыть">
        <i class="pi pi-times"></i>
      </button>
      <div v-if="type === 'default'" class="qr-info">
        <p>Сканируйте QR код для получения продукта:</p>
        <p v-if="productName" class="product-name">
          <strong>{{ productName }}</strong>
        </p>
      </div>
      <template v-if="type === 'yandex'">
        <div class="qr-info">
          <img v-if="productLogo" :src="productLogo" alt="Логотип" class="product-logo-yandex" />
          <p>
            <strong>Получите подарки от Яндекса</strong>
            Получите подарки от Яндекса
          </p>
        </div>
        <div class="qr-image-container">
          <canvas ref="canvasRef" class="qr-canvas" :width="canvasSize" :height="canvasSize"></canvas>
        </div>
      </template>
      <template v-else-if="type === 'yandex-white'">
        <div class="qr-image-container">
          <canvas ref="canvasRef" class="qr-canvas" :width="canvasSize" :height="canvasSize"></canvas>
        </div>
      </template>
      <template v-else>
        <div class="qr-image-container">
          <canvas ref="canvasRef" class="qr-canvas" :width="canvasSize" :height="canvasSize"></canvas>
        </div>
      </template>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed, watch, nextTick, ref } from 'vue';
import { BaseModal } from '@/shared/ui';

interface Props {
  visible: boolean;
  qrUrl?: string;
  type?: 'default' | 'yandex' | 'yandex-white';
  productName?: string;
  productLogo?: string;
}

interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'close'): void;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'default'
});

const emit = defineEmits<Emits>();

const canvasRef = ref<HTMLCanvasElement | null>(null);

const modalVisible = computed({
  get: () => props.visible,
  set: (value: boolean) => emit('update:visible', value)
});

const modalClass = computed(() => {
  let cls = 'qr-modal';
  if (props.type === 'yandex') cls += ' qr-modal-yandex';
  if (props.type === 'yandex-white') cls += ' qr-modal-yandex-white';
  return cls;
});

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
  modalVisible.value = false;
  emit('close');
};

const onHide = () => {
  emit('close');
};
</script>

<style scoped>
.qr-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  padding: 1.5rem;
}

.qr-info {
  text-align: center;
}

.qr-info p {
  margin: 0.5rem 0;
  color: var(--russ-text-secondary);
}

.product-name {
  font-weight: 600;
  color: var(--russ-text-primary);
}

.product-logo-yandex {
  max-width: 100px;
  max-height: 100px;
  margin-bottom: 1rem;
}

.qr-image-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 220px;
}

.qr-canvas {
  max-width: 200px;
  max-height: 200px;
  border-radius: 8px;
  display: block;
}

/* Yandex QR Modal - Full Screen Yellow - точно как было */
.qr-modal-yandex .base-modal-overlay {
  background-color: var(--russ-yellow) !important;
  padding: 0 !important;
  position: fixed !important;
  left: 0 !important;
  top: 0 !important;
}

.qr-modal-yandex .base-modal {
  height: 100vh !important;
  max-height: 100vh !important;
  width: 100vw !important;
  max-width: 100vw !important;
  border-radius: 0 !important;
  margin: 0 !important;
  border: 0 !important;
  background-color: var(--russ-yellow) !important;
  box-shadow: none !important;
  position: fixed !important;
  left: 0 !important;
  top: 0 !important;
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
}

.qr-modal-yandex .base-modal-header {
  display: none !important;
}

.qr-modal-yandex .base-modal-content {
  height: 100% !important;
  display: flex !important;
  align-items: center !important;
  padding: 0 !important;
  background-color: transparent !important;
}

.qr-modal-yandex .qr-content {
  padding: 0 !important;
  width: 100% !important;
  height: 100% !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 0 !important;
}

.qr-modal-yandex .qr-info {
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  gap: 30px !important;
}

.qr-modal-yandex .qr-info p {
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  text-align: center !important;
  color: var(--russ-text-primary) !important;
  font-size: clamp(25px, calc(25px + (40 - 25) * ((100vw - 320px) / (600 - 320))), 40px) !important;
  margin: 0 !important;
}

.qr-modal-yandex .product-logo-yandex {
  width: 65% !important;
  max-width: none !important;
  max-height: none !important;
  margin-bottom: 0 !important;
}

.qr-modal-yandex .qr-image-container {
  border: 0 !important;
  background-color: var(--russ-bg) !important;
  padding: 0 !important;
  min-height: 200px !important;
  border-radius: 5px !important;
}

/* Yandex White QR Modal - Full Screen White - точно как было */
.qr-modal-yandex-white .base-modal-overlay {
  background-color: var(--russ-text-inverse) !important;
  padding: 0 !important;
  position: fixed !important;
  left: 0 !important;
  top: 0 !important;
}

.qr-modal-yandex-white .base-modal {
  height: 100vh !important;
  max-height: 100vh !important;
  width: 100vw !important;
  max-width: 100vw !important;
  border-radius: 0 !important;
  margin: 0 !important;
  border: 0 !important;
  background-color: var(--russ-text-inverse) !important;
  box-shadow: none !important;
  position: fixed !important;
  left: 0 !important;
  top: 0 !important;
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
}

.qr-modal-yandex-white .base-modal-header {
  display: none !important;
}

.qr-modal-yandex-white .base-modal-content {
  height: 100% !important;
  display: flex !important;
  align-items: center !important;
  padding: 0 !important;
  background-color: transparent !important;
}

.qr-modal-yandex-white .qr-content {
  padding: 0 !important;
  width: 100% !important;
  height: 100% !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 0 !important;
}

.qr-modal-yandex-white .qr-image-container {
  border: 0 !important;
  background-color: var(--russ-bg) !important;
  padding: 0 !important;
  min-height: 200px !important;
  border-radius: 5px !important;
}

/* Close button for Yandex modals */
.qr-close-btn {
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

.qr-close-btn:hover {
  background: var(--russ-bg);
  transform: scale(1.05);
}

.qr-modal-yandex .qr-content,
.qr-modal-yandex-white .qr-content {
  position: relative;
}
</style>
