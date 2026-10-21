<template>
  <BaseModal
    v-model="modalVisible"
    width="90vw"
    max-width="500px"
    class="upload-success-modal"
    @hide="onHide"
  >
    <div class="success-section">
      <h3 class="success-title">Документы успешно загружены!</h3>
      <p class="success-description">
        Ваши документы для заявки "5 карт" были успешно загружены.
        Теперь вы можете перейти к оформлению заявки.
      </p>
    </div>
  </BaseModal>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { BaseModal } from '@/shared/ui';

interface Props {
  visible: boolean;
}

interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'close'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const modalVisible = computed({
  get: () => props.visible,
  set: (value: boolean) => emit('update:visible', value)
});

const onHide = () => {
  emit('close');
};
</script>

<style scoped>
.success-section {
  text-align: center;
  padding: 0;
}

.success-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--russ-text-primary);
  margin-bottom: 16px;
}

.success-description {
  font-size: 16px;
  color: var(--russ-text-tertiary);
  margin-bottom: 0;
  line-height: 1.5;
}
</style>
