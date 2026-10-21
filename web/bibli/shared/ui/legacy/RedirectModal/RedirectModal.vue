<template>
  <BaseModal
    v-model="modalVisible"
    width="90vw"
    max-width="500px"
    class="redirect-modal"
    @hide="onHide"
  >
    <template #header>
      <h3 class="modal-title">Заявка успешно создана</h3>
    </template>
    <div class="modal-body">
      <Button label="Перейти в Альфа-Селфи" class="redirect-btn" @click="handleRedirect" />
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { BaseModal, Button } from '@/shared/ui';

interface Props {
  visible: boolean;
  redirectUrl?: string;
}

interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'redirect'): void;
  (e: 'close'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const modalVisible = computed({
  get: () => props.visible,
  set: (value: boolean) => emit('update:visible', value)
});

const handleRedirect = () => {
  if (props.redirectUrl) {
    window.open(props.redirectUrl, '_blank');
  }
  emit('redirect');
};

const onHide = () => {
  emit('close');
};
</script>

<style scoped>
.modal-title {
  font-size: clamp(18px, calc(18px + (28 - 18) * ((100vw - 320px) / (1920 - 320))), 28px);
  font-weight: 600;
  color: var(--russ-text-secondary);
  margin: 0;
  line-height: 1.3;
}

.modal-body {
  display: flex;
  justify-content: center;
  padding: 1.5rem 0;
}

.redirect-btn {
  padding: 0.75rem 2rem;
  font-weight: 600;
  border-radius: 8px;
}
</style>
