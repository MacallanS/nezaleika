<template>
  <div class="profile-section-card">
    <div class="profile-row">
      <span class="profile-label">Email:</span>
      <span class="profile-value">{{ filledUserData?.email || '-' }}</span>
    </div>
    <div class="profile-row">
      <span class="profile-label">Статус:</span>
      <span class="profile-status confirmed">
        Подтверждена
      </span>
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
.profile-status {
  font-weight: 600;
  padding: 4px 14px;
  border-radius: 8px;
  font-size: 1.02em;
  display: inline-block;
}
.profile-status.confirmed {
  background: var(--russ-success-light);
  color: var(--russ-success);
  border: 1px solid var(--russ-success);
}
.profile-status.unconfirmed {
  background: var(--russ-error-light);
  color: var(--russ-error);
  border: 1px solid var(--russ-error);
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
  .profile-status {
    font-size: 0.97em;
    padding: 3px 8px;
    border-radius: 6px;
  }
}
</style> 