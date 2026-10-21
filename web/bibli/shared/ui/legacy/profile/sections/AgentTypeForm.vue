<template>
  <div class="agent-type-form">
    <section class="form-section">
      <label for="agentType" class="form-label">Выберите способ оформления:</label>
      <div class="select-wrapper">
        <select v-model="selectedAgentType" id="agentType" class="form-select">
          <option value="" disabled>Выберите...</option>
          <option v-for="type in agentTypes" :key="type.id" :value="type.id">{{ type.name }}</option>
        </select>
        <div class="select-arrow">
          <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
            <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
              stroke-linejoin="round" />
          </svg>
        </div>
      </div>

      <div v-if="getAgentTypeNameById(selectedAgentType) === 'Самозанятый'" class="conditional-section">
        <div class="section-header">
          <div class="section-icon">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 1L13.09 6.26L19 7L14.5 11.24L15.18 17L10 14.27L4.82 17L5.5 11.24L1 7L6.91 6.26L10 1Z"
                fill="currentColor" />
            </svg>
          </div>
          <h3>Данные самозанятого</h3>
        </div>

        <div class="file-upload-group">
          <label class="file-label">
            <span class="file-label-text">Скан/фото справки о статусе самозанятого *</span>
            <div class="file-input-wrapper">
              <input type="file" @change="onSzFileChange($event, 'file_self_employed')" class="file-input"
                accept="image/*,.pdf" />
              <div class="file-input-display">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2Z"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                  <path d="M14 2V8H20" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                    stroke-linejoin="round" />
                  <path d="M16 13H8" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                    stroke-linejoin="round" />
                  <path d="M16 17H8" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                    stroke-linejoin="round" />
                  <path d="M10 9H8" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                    stroke-linejoin="round" />
                </svg>
                <span>Выберите файл</span>
              </div>
            </div>
          </label>
        </div>

        <div class="file-upload-group">
          <label class="file-label">
            <span class="file-label-text">Скан/фото справки о доходах *</span>
            <div class="file-input-wrapper">
              <input type="file" @change="onSzFileChange($event, 'file_income_statement')" class="file-input"
                accept="image/*,.pdf" />
              <div class="file-input-display">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2Z"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                  <path d="M14 2V8H20" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                    stroke-linejoin="round" />
                  <path d="M16 13H8" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                    stroke-linejoin="round" />
                  <path d="M16 17H8" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                    stroke-linejoin="round" />
                  <path d="M10 9H8" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                    stroke-linejoin="round" />
                </svg>
                <span>Выберите файл</span>
              </div>
            </div>
          </label>
        </div>
      </div>

      <div v-else-if="getAgentTypeNameById(selectedAgentType) === 'Индивидуальный предприниматель'"
        class="conditional-section">
        <div class="section-header">
          <div class="section-icon">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M3 4C3 3.44772 3.44772 3 4 3H16C16.5523 3 17 3.44772 17 4V16C17 16.5523 16.5523 17 16 17H4C3.44772 17 3 16.5523 3 16V4Z"
                stroke="currentColor" stroke-width="2" />
              <path d="M7 7H13" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              <path d="M7 11H13" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              <path d="M7 15H10" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            </svg>
          </div>
          <h3>Данные ИП</h3>
        </div>

        <div class="form-grid">
          <div class="form-group">
            <InputText v-model="ipForm.name" placeholder="ФИО *" variant="off" class="form-input" />
          </div>
          <div class="form-group">
            <InputText v-model="ipForm.inn" placeholder="ИНН *" variant="off" class="form-input" />
          </div>
          <div class="form-group">
            <InputText v-model="ipForm.ogrnip" placeholder="ОГРНИП *" variant="off" class="form-input" />
          </div>
        </div>

        <div class="file-upload-group">
          <label class="file-label">
            <span class="file-label-text">Скан/фото ОГРНИП *</span>
            <div class="file-input-wrapper">
              <input type="file" @change="onIpFileChange($event, 'file_ogrnip')" class="file-input"
                accept="image/*,.pdf" />
              <div class="file-input-display">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2Z"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                  <path d="M14 2V8H20" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                    stroke-linejoin="round" />
                  <path d="M16 13H8" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                    stroke-linejoin="round" />
                  <path d="M16 17H8" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                    stroke-linejoin="round" />
                  <path d="M10 9H8" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                    stroke-linejoin="round" />
                </svg>
                <span>Выберите файл</span>
              </div>
            </div>
          </label>
        </div>

        <div class="form-grid">
          <div class="form-group">
            <InputText v-model="ipForm.payment_account" placeholder="Расчетный счет *" variant="off" class="form-input" />
          </div>
          <div class="form-group">
            <InputText v-model="ipForm.bank" placeholder="Банк *" variant="off" class="form-input" />
          </div>
          <div class="form-group">
            <InputText v-model="ipForm.bank_bik" placeholder="БИК банка *" variant="off" class="form-input" />
          </div>
          <div class="form-group">
            <InputText v-model="ipForm.bank_inn" placeholder="ИНН банка *" variant="off" class="form-input" />
          </div>
          <div class="form-group">
            <InputText v-model="ipForm.correspondent_account" placeholder="Корр. счет *" variant="off" class="form-input" />
          </div>
        </div>

        <div class="file-upload-group">
          <label class="file-label">
            <span class="file-label-text">Скан/фото банковских реквизитов *</span>
            <div class="file-input-wrapper">
              <input type="file" @change="onIpFileChange($event, 'file_banking_details')" class="file-input"
                accept="image/*,.pdf" />
              <div class="file-input-display">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.89 22 5.99 22H18C19.1 22 20 21.1 20 20V8L14 2Z"
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                  <path d="M14 2V8H20" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                    stroke-linejoin="round" />
                  <path d="M16 13H8" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                    stroke-linejoin="round" />
                  <path d="M16 17H8" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                    stroke-linejoin="round" />
                  <path d="M10 9H8" stroke="currentColor" stroke-width="2" stroke-linecap="round"
                    stroke-linejoin="round" />
                </svg>
                <span>Выберите файл</span>
              </div>
            </div>
          </label>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { InputText } from '@/shared/ui'

const props = defineProps({
  selectedAgentType: String,
  agentTypes: Array,
  ipForm: Object,
  getAgentTypeNameById: Function,
  onSzFileChange: Function,
  onIpFileChange: Function
})

const emit = defineEmits(['update:selectedAgentType'])

const selectedAgentType = computed({
  get: () => props.selectedAgentType,
  set: (value) => emit('update:selectedAgentType', value)
})
</script>

<style scoped>
.agent-type-form {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
}

.form-section {
  background: linear-gradient(135deg, var(--russ-bg-secondary) 0%, var(--russ-bg-tertiary) 100%);
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 4px 20px var(--russ-shadow-color);
  border: 1px solid rgba(255, 255, 255, 0.8);
}

.form-label {
  display: block;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--russ-text-primary);
  margin-bottom: 1rem;
  text-align: center;
}

.select-wrapper {
  position: relative;
  margin-bottom: 2rem;
}

.form-select {
  width: 100%;
  padding: 1rem 1.5rem;
  font-size: 1rem;
  border: 2px solid var(--russ-border-light);
  border-radius: 12px;
  background: var(--russ-bg);
  color: var(--russ-text-primary);
  appearance: none;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px var(--russ-shadow-color);
}

.form-select:focus {
  outline: none;
  border-color: var(--russ-secondary);
  box-shadow: inset 0 0 0 3px var(--russ-shadow-secondary);
}

.form-select:hover {
  border-color: var(--russ-border-light);
}

.select-arrow {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--russ-text-muted);
  pointer-events: none;
  transition: transform 0.3s ease;
}

.form-select:focus+.select-arrow {
  transform: translateY(-50%) rotate(180deg);
}

.conditional-section {
  background: var(--russ-bg);
  border-radius: 16px;
  padding: 1.5rem;
  margin-top: 1.5rem;
  border: 1px solid var(--russ-border-light);
  box-shadow: 0 2px 12px var(--russ-shadow-color);
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.section-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid var(--russ-bg-tertiary);
}

.section-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, var(--russ-secondary) 0%, var(--russ-purple) 100%);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--russ-text-inverse);
  box-shadow: 0 4px 12px var(--russ-shadow-secondary);
}

.section-header h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--russ-text-primary);
  margin: 0;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-input {
  width: 100%;
  padding: 0.875rem 1rem;
  font-size: 0.95rem;
  border: 2px solid var(--russ-border-light);
  border-radius: 10px;
  background: var(--russ-bg);
  color: var(--russ-text-primary);
  transition: all 0.3s ease;
  box-shadow: 0 1px 4px var(--russ-shadow-color);
}

.form-input:focus {
  outline: none;
  border-color: var(--russ-input-border-focus);
  box-shadow: inset 0 0 0 3px var(--russ-shadow-accent-light);
}

.form-input:hover {
  border-color: var(--russ-border-light);
}

.file-upload-group {
  margin-bottom: 1.5rem;
}

.file-label {
  display: block;
  cursor: pointer;
}

.file-label-text {
  display: block;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--russ-text-secondary);
  margin-bottom: 0.75rem;
}

.file-input-wrapper {
  position: relative;
}

.file-input {
  position: absolute;
  opacity: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
}

.file-input-display {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  background: var(--russ-bg);
  border: 2px dashed var(--russ-border-light);
  border-radius: 12px;
  color: var(--russ-text-muted);
  transition: all 0.3s ease;
  min-height: 60px;
}

.file-input-display:hover {
  border-color: var(--russ-secondary);
  background: var(--russ-bg-secondary);
  color: var(--russ-secondary);
}

.file-input-display svg {
  flex-shrink: 0;
}

.file-input-display span {
  font-weight: 500;
  font-size: 0.95rem;
}

/* Мобильные стили */
@media (max-width: 768px) {
  .form-section {
    padding: 1.5rem;
    border-radius: 16px;
  }

  .conditional-section {
    padding: 1.25rem;
    border-radius: 12px;
  }

  .form-grid {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }

  .section-header {
    margin-bottom: 1.25rem;
  }

  .section-icon {
    width: 36px;
    height: 36px;
  }

  .section-header h3 {
    font-size: 1.1rem;
  }

  .form-select,
  .form-input {
    padding: 0.75rem 1rem;
    font-size: 0.9rem;
  }

  .file-input-display {
    padding: 0.875rem 1rem;
    min-height: 56px;
  }
}

@media (max-width: 480px) {
  .form-section {
    padding: 1.25rem;
    margin: 0 0.5rem;
  }

  .conditional-section {
    padding: 1rem;
  }

  .form-label {
    font-size: 1rem;
    margin-bottom: 0.875rem;
  }

  .section-header {
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .section-icon {
    width: 32px;
    height: 32px;
  }

  .section-header h3 {
    font-size: 1rem;
  }
}
</style>
