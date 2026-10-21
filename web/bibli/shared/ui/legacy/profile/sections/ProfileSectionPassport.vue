<template>
  <div class="profile-section-card">
    <div class="profile-subcard">
      <div class="profile-row">
        <span class="profile-label">Паспорт:</span>
        <span class="profile-value">{{ filledUserData?.data?.passport || '-' }}</span>
      </div>
      <div class="profile-row">
        <span class="profile-label">Кем выдан:</span>
        <span class="profile-value">{{ filledUserData?.data?.passport_issued || '-' }}</span>
      </div>
      <div class="profile-row">
        <span class="profile-label">Дата выдачи:</span>
        <span class="profile-value">{{ filledUserData?.data?.passport_date || '-' }}</span>
      </div>
      <div class="profile-row">
        <span class="profile-label">Код подразделения:</span>
        <span class="profile-value">{{ filledUserData?.data?.passport_code || '-' }}</span>
      </div>
    </div>

    <div class="profile-subcard user-data-subcard">
      <div class="profile-subcard-title">Личные и банковские данные</div>
      <div class="profile-row">
        <span class="profile-label">Дата рождения:</span>
        <span class="profile-value">{{ filledUserData?.data?.birthday || '-' }}</span>
      </div>
      <div class="profile-row">
        <span class="profile-label">Место рождения:</span>
        <span class="profile-value">{{ filledUserData?.data?.birthday_place || '-' }}</span>
      </div>
      <div class="profile-row">
        <span class="profile-label">Адрес регистрации:</span>
        <span class="profile-value">{{ filledUserData?.data?.registration_address || '-' }}</span>
      </div>
      <div class="profile-row">
        <span class="profile-label">ИНН:</span>
        <span class="profile-value">{{ filledUserData?.data?.inn || '-' }}</span>
      </div>
      <div class="profile-row">
        <span class="profile-label">Расчётный счёт:</span>
        <span class="profile-value">{{ filledUserData?.data?.bank_account || '-' }}</span>
      </div>
      <div class="profile-row">
        <span class="profile-label">БИК банка:</span>
        <span class="profile-value">{{ filledUserData?.data?.bank_bik || '-' }}</span>
      </div>
      <div class="profile-row">
        <span class="profile-label">Банк:</span>
        <span class="profile-value">{{ filledUserData?.data?.bank_name || '-' }}</span>
      </div>
    </div>
  </div>
</template>
<script setup>
defineProps(['filledUserData'])
</script>
<style scoped>
.profile-section-card {
  background: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  box-sizing: border-box;
}

.profile-subcard {
  padding: 1.25rem;
  border-radius: 12px;
  background: var(--russ-bg);
  border: 1px solid var(--russ-border);
  box-shadow: 0 1px 4px var(--russ-shadow-color);
  width: 100%;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  box-sizing: border-box;
}

.user-data-subcard {
  background: var(--russ-bg-blue-light);
  border: 1px solid var(--russ-info-border);
  box-shadow: 0 1px 4px var(--russ-shadow-color);
}

.profile-subcard-title {
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--russ-text-primary);
  margin-bottom: 0.75rem;
  min-width: 0;
  overflow: hidden;
  word-break: break-word;
}
.profile-row {
  display: flex;
  gap: 18px;
  align-items: flex-start;
  font-size: 1.08rem;
  padding-bottom: 0.5rem;
  margin-bottom: 0.5rem;
  border-bottom: 1px solid var(--russ-border);
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
}
.profile-row:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}
.profile-label {
  color: var(--russ-text-secondary);
  min-width: 120px;
  max-width: 45%;
  flex-shrink: 0;
  font-weight: 600;
  font-size: 1.05em;
  overflow: hidden;
  text-overflow: ellipsis;
}
.profile-value {
  color: var(--russ-text-primary);
  font-weight: 500;
  word-break: break-word;
  overflow-wrap: break-word;
  min-width: 0;
  flex: 1;
  max-width: 100%;
  overflow: hidden;
}
@media (max-width: 600px) {
  .profile-section-card {
    padding: 0;
    gap: 0.3rem;
    width: 100%;
  }
  .profile-subcard {
    padding: 0.75rem 0.5rem;
  }
  .profile-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    font-size: 0.95rem;
    padding-bottom: 0.1rem;
    min-width: 0;
    width: 100%;
  }
  .profile-label {
    min-width: 0;
    max-width: none;
    font-size: 0.95em;
  }
  .profile-value {
    max-width: 100%;
    word-break: break-all;
  }
}
</style> 