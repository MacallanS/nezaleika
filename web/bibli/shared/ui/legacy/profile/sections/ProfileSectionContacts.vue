<template>
  <div class="profile-section-card">
    <div class="profile-row">
      <span class="profile-label">Фамилия:</span>
      <span class="profile-value">{{ filledUserData?.surname || '-' }}</span>
    </div>
    <div class="profile-row">
      <span class="profile-label">Имя:</span>
      <span class="profile-value">{{ filledUserData?.name || '-' }}</span>
    </div>
    <div v-if="!isYandexHost" class="profile-row">
      <span class="profile-label">Отчество:</span>
      <span class="profile-value">{{ filledUserData?.patronymic || 'По паспорту нет отчества' }}</span>
    </div>
    <div class="profile-row">
      <span class="profile-label">Телефон:</span>
      <span class="profile-value">{{ filledUserData?.phone || '-' }}</span>
    </div>
    <div v-if="!isYandexHost" class="profile-row">
      <span class="profile-label">Email:</span>
      <span class="profile-value">{{ filledUserData?.email || '-' }}</span>
    </div>
    <div v-if="!isYandexHost" class="profile-row">
      <span class="profile-label">ТГ:</span>
      <span class="profile-value">{{ formatTelegram(filledUserData?.telegram_username) }}</span>
    </div>
  </div>
</template>
<script setup>
import { useYandexHost } from "@/shared/composables";

const formatTelegram = (username) => {
  const trimmed = username ? String(username).trim() : '';
  if (!trimmed) return 'не заполнено';
  return trimmed.startsWith('@') ? trimmed : `@${trimmed}`;
};

const { isYandexHost } = useYandexHost();

defineProps(['filledUserData'])
</script>
<style scoped>
.profile-section-card {
  background: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}
.profile-row {
  display: flex;
  gap: 18px;
  align-items: center;
  font-size: 1.08rem;
  padding-bottom: 0.5rem;
  margin-bottom: 0.5rem;
  border-bottom: 1px solid var(--russ-border);
}
.profile-row:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}
.profile-label {
  color: var(--russ-text-secondary);
  min-width: 120px;
  font-weight: 600;
  font-size: 1.05em;
}
.profile-value {
  color: var(--russ-text-primary);
  font-weight: 500;
  word-break: break-word;
}
@media (max-width: 600px) {
  .profile-section-card {
    padding: 0;
    gap: 0.3rem;
  }
  .profile-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    font-size: 0.95rem;
    padding-bottom: 0.1rem;
  }
  .profile-label {
    min-width: 0;
    font-size: 0.95em;
  }
}
</style> 