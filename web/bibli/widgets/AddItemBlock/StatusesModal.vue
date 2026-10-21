<template>
    <BaseModal
        :model-value="visible"
        @update:model-value="$emit('close')"
        title="Статусы оформления"
        size="lg"
        class="status-modal"
        :close-on-overlay-click="!loading"
    >
                <div class="status-modal-content">
                    <div class="status-list-block">
                        <ul class="status-list">
                            <li v-for="s in allStatuses" :key="s.id" class="status-item">
                                <span v-if="s.color" class="status-badge" :style="{ backgroundColor: s.color }"></span>
                                <span class="status-name">{{ s.name }}</span>
                                <button class="edit-status-btn" @click="$emit('edit', s)">✎</button>
                                <button class="delete-status-btn" @click="$emit('delete', s.id)" :disabled="loading">
                                    Удалить
                                </button>
                            </li>
                        </ul>
                    </div>
                    <div class="status-form-block">
                        <h4 v-if="editingStatus">Редактировать статус</h4>
                        <h4 v-else>Добавить новый статус</h4>
                        <div class="new-status-input">
                            <input type="color" v-model="statusForm.color" class="color-input" />
                            <div class="status-input-wrap">
                                <input v-model="statusForm.name" :class="{ 'input-error': statusFormErrors.name }"
                                    placeholder="Название статуса" />
                                <div v-if="statusFormErrors.name" class="input-error-message">
                                    {{ statusFormErrors.name[0] }}
                                </div>
                            </div>
                        </div>
                        <div class="new-status-actions">
                            <button class="btn-cancel" @click="$emit('close')">
                                Отмена
                            </button>
                            <button class="btn-submit" @click="$emit('save')">
                                {{ editingStatus ? "Сохранить" : "Добавить" }}
                            </button>
                        </div>
                    </div>
                </div>
    </BaseModal>
</template>

<script setup>
import { BaseModal } from '@/shared/ui';

const props = defineProps({
    visible: { type: Boolean, default: false },
    allStatuses: { type: Array, default: () => [] },
    editingStatus: { type: Object, default: null },
    statusForm: { type: Object, required: true },
    statusFormErrors: { type: Object, default: () => ({}) },
    loading: { type: Boolean, default: false },
});

const emit = defineEmits(['close']);
</script>

<style scoped>

/* Скрыть скроллбар контента модалки */
.status-modal .base-modal-content {
    scrollbar-width: none;
    -ms-overflow-style: none;
}
.status-modal .base-modal-content::-webkit-scrollbar {
    display: none;
}

.status-modal-content {
    display: flex;
    gap: 32px;
    align-items: flex-start;
}

.status-list-block {
    flex: 1 1 0;
}

.status-form-block {
    flex: 1 1 0;
    background: #f3f4f6;
    border-radius: 12px;
    padding: 24px 20px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
    min-width: 260px;
}

.status-form-block h4 {
    margin-bottom: 18px;
    font-size: clamp(14px, calc(14px + (18 - 14) * ((100vw - 320px) / (1920 - 320))), 18px);
    color: var(--russ-text-secondary);
    font-weight: 600;
}

.status-list {
    list-style: none;
    margin: 0;
    padding: 0;
}

.status-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 8px;
    border-bottom: 1px solid var(--russ-border);
}

.status-item:last-child {
    border-bottom: none;
}

.status-badge {
    width: 12px;
    height: 12px;
    border-radius: 50%;
}

.status-name {
    flex: 1;
    color: var(--russ-text-primary);
    font-weight: 500;
    font-size: clamp(14px, calc(14px + (18 - 14) * ((100vw - 320px) / (1920 - 320))), 18px);
}

.edit-status-btn {
    background: none;
    border: none;
    color: var(--russ-accent);
    font-size: clamp(14px, calc(14px + (18 - 14) * ((100vw - 320px) / (1920 - 320))), 18px);
    margin-right: 8px;
    cursor: pointer;
    transition: color 0.2s;
}

.edit-status-btn:hover {
    color: var(--russ-accent-dark);
}

.delete-status-btn {
    padding: 6px 12px;
    background-color: var(--russ-error);
    color: white;
    border: none;
    border-radius: 6px;
    font-size: clamp(14px, calc(14px + (18 - 14) * ((100vw - 320px) / (1920 - 320))), 18px);
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
}

.delete-status-btn:hover {
    background-color: var(--russ-error-dark);
}

.delete-status-btn:disabled {
    background-color: var(--russ-error-light);
    cursor: not-allowed;
}

.new-status-input {
    display: flex;
    gap: 12px;
    margin-bottom: 24px;
    min-width: 0;
    max-width: 100%;
}

.color-input {
    width: 48px;
    height: 48px;
    padding: 0;
    cursor: pointer;
    border-radius: 8px;
    transition: all 0.2s ease;
}

.color-input:hover {
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.status-input-wrap {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
    max-width: 100%;
    overflow: hidden;
}

.status-input-wrap .input-wrapper,
.status-input-wrap .custom-input {
    min-width: 0;
    max-width: 100%;
    box-sizing: border-box;
}

.status-input-wrap input {
    min-width: 0;
    max-width: 100%;
    box-sizing: border-box;
}

.input-error {
    border-color: var(--russ-error) !important;
    background: var(--russ-error-light);
    border-radius: 8px;
}

.input-error-message {
    color: var(--russ-error);
    font-size: clamp(14px, calc(14px + (18 - 14) * ((100vw - 320px) / (1920 - 320))), 18px);
    margin-top: 4px;
    margin-left: 2px;
}

.new-status-actions {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
}

.btn-cancel {
    padding: 12px 24px 12px 22px;
    background: #fff;
    border: 1.5px solid var(--russ-border);
    border-radius: 8px;
    color: var(--russ-text-secondary);
    font-size: clamp(14px, calc(14px + (18 - 14) * ((100vw - 320px) / (1920 - 320))), 18px);
    font-weight: 500;
    cursor: pointer;
    transition: background 0.18s, color 0.18s, box-shadow 0.18s;
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.04);
}

.btn-cancel:hover {
    background: #f3f4f6;
    color: var(--russ-accent);
    border-color: #2563eb;
}

.btn-submit {
    background: linear-gradient(90deg, var(--russ-accent) 0%, var(--russ-accent-light) 100%);
    color: #fff;
    border: none;
    border-radius: 8px;
    padding: 12px 24px;
    font-weight: 500;
    min-width: 140px;
    box-shadow: 0 2px 8px rgba(37, 99, 235, 0.08);
    transition: background 0.18s, box-shadow 0.18s;
}

.btn-submit:hover {
    background: linear-gradient(90deg, var(--russ-accent-dark) 0%, var(--russ-accent) 100%);
    box-shadow: 0 4px 16px rgba(37, 99, 235, 0.13);
    cursor: pointer;
}


@media (max-width: 900px) {
    .status-modal--styled {
        max-width: 100%;
        padding: 1.2rem 0.5rem;
        border-radius: 12px;
        max-height: calc(100vh - 16px);
    }

    .status-modal-content {
        flex-direction: column;
        gap: 18px;
        align-items: stretch;
    }

    .status-list-block,
    .status-form-block {
        width: 100%;
        min-width: 0;
        padding: 0;
        box-sizing: border-box;
    }

    .status-form-block {
        padding: 16px 8px;
        border-radius: 10px;
    }
}

@media (max-width: 600px) {
    .status-modal--styled {
        max-width: 100%;
        width: 100%;
        padding: 0.7rem;
        border-radius: 9px;
        max-height: calc(100vh - 16px);
    }

    .status-modal-content {
        flex-direction: column;
        gap: 10px;
        align-items: stretch;
    }

    .status-list-block,
    .status-form-block {
        width: 100%;
        min-width: 0;
        padding: 0;
        box-sizing: border-box;
    }

    .status-form-block {
        padding: 10px 4px;
        border-radius: 8px;
    }

    .status-form-block h4 {
        font-size: clamp(14px, calc(14px + (18 - 14) * ((100vw - 320px) / (1920 - 320))), 18px);
        margin-bottom: 10px;
    }

    .new-status-input {
        flex-direction: column;
        gap: 8px;
        margin-bottom: 14px;
    }

    .color-input {
        width: 36px;
        height: 36px;
    }

    .status-input-wrap input {
        padding: 8px;
    }

    .new-status-actions {
        flex-direction: column;
        gap: 8px;
    }

    .new-status-actions button {
        width: 100%;
        font-size: clamp(14px, calc(14px + (18 - 14) * ((100vw - 320px) / (1920 - 320))), 18px);
        padding: 10px 0;
        border-radius: 7px;
    }
}
</style>
