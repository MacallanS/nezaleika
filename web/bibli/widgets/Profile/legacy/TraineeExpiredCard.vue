<template>
  <div class="trainee-expired-card" role="alert">
    <h2 class="trainee-expired-card__title">Тестовый период завершён</h2>
    <p class="trainee-expired-card__text">
      <template v-if="detailed">
        Срок стажировки истёк. Разделы смен и отчётов недоступны — ваша роль изменена.
        Для продолжения работы обратитесь в поддержку: уточните продление тестового периода
        или подтверждение в штат агента.
      </template>
      <template v-else>
        Срок стажировки истёк. Разделы смен и отчётов недоступны.
        Для продолжения работы обратитесь в поддержку.
      </template>
    </p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  detailed?: boolean;
}>();
</script>

<style scoped>
.trainee-expired-card {
  margin-bottom: 1.25rem;
  padding: 1rem 1.25rem;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 10px;
  color: #7f1d1d;
}

.trainee-expired-card__title {
  margin: 0 0 0.5rem;
  font-size: 1.1rem;
  font-weight: 700;
}

.trainee-expired-card__text {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.5;
}
</style>
