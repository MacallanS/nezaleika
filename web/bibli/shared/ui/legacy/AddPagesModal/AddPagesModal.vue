<template>
    <BaseModal
        v-model="modalVisible"
        title="Добавить страницы к роли"
        width="500px"
        @hide="onClose"
    >
        <div class="add-pages-modal">
            <div class="role-selector mb-4">
                <BaseSelect
                    id="roleSelect"
                    :model-value="selectedRoleId ?? undefined"
                    :options="roleOptions"
                    option-label="label"
                    option-value="value"
                    placeholder="Выберите роль для добавления страниц"
                    label="Выберите роль:"
                    @update:model-value="handleRoleChange"
                />
            </div>

            <div v-if="isLoading" class="text-center py-4">
                <div class="loader"></div>
                <p class="mt-2 text-gray-600">Загрузка доступных страниц...</p>
            </div>

            <div v-else-if="selectedRoleId && availablePages.length > 0" class="available-pages-list">
                <h3 class="text-lg font-semibold mb-3">Все страницы:</h3>
                <div class="pages-container">
                    <div v-for="page in availablePages" :key="page.id" class="page-item">
                        <div class="modal-page-content">
                            <div class="page-info">
                                <span class="page-name">{{ page.name }}</span>
                                <span class="page-code">({{ page.code }})</span>
                            </div>
                            <button @click="addPage(page)" class="add-btn" title="Добавить страницу к роли"
                                :disabled="isAdding">
                                ➕
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div v-else-if="selectedRoleId" class="no-pages-message">
                <p>
                    Нет доступных страниц.
                </p>
            </div>
            <div v-else class="select-role-message">
                <p class="text-gray-500 text-center py-4">
                    Выберите роль для добавления страниц.
                </p>
            </div>
        </div>

        <template #footer>
            <Button label="Закрыть" @click="onClose" />
        </template>
    </BaseModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import BaseModal from "../BaseModal/BaseModal.vue";
import { Button, BaseSelect } from "@/shared/ui";
import { useToast } from "../Toast";
import type { Page } from "../RolePagesModal/RolePagesModal.vue";

interface Props {
    visible: boolean;
    roles: Array<{ id: number; name: string; label: string }>;
    fetchRolePages: (roleId: number) => Promise<{ pages: Page[] }>;
    fetchAllPages: () => Promise<{ pages: Page[]; hidden?: Page[] }>;
    addPageToRole: (roleId: number, pageId: number) => Promise<void>;
}

interface Emits {
    (e: 'update:visible', value: boolean): void;
    (e: 'pages-updated'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const toast = useToast();

// Computed для совместимости между visible/update:visible и v-model
const modalVisible = computed({
    get: () => props.visible,
    set: (value: boolean) => emit('update:visible', value)
});

const selectedRoleId = ref<number | null>(null);
const isLoading = ref(false);
const isAdding = ref(false);

const allPages = ref<Page[]>([]);
const addedPages = ref<Page[]>([]);

const roleOptions = computed(() =>
    props.roles.map(role => ({
        label: role.label,
        value: role.id
    }))
);

const onClose = () => {
    emit('update:visible', false);
    selectedRoleId.value = null;
};

const handleRoleChange = async (value: number | string | undefined) => {
    selectedRoleId.value = value as number | null;
    if (!selectedRoleId.value) {
        return;
    }
    await loadAllPages();
};

const loadAllPages = async () => {
    try {
        if (!selectedRoleId.value) return;
        const [allResp, roleResp] = await Promise.all([
            props.fetchAllPages(),
            props.fetchRolePages(selectedRoleId.value)
        ]);
        let all = allResp.pages || [];
        if (allResp.hidden) all = all.concat(allResp.hidden);
        const ids = new Set();
        allPages.value = all.filter(p => {
            if (ids.has(p.id)) return false;
            ids.add(p.id); return true;
        });
        addedPages.value = roleResp.pages || [];
    } catch (error) {
        console.error('Ошибка при загрузке всех страниц:', error);
        toast.add({
            severity: 'error',
            summary: 'Ошибка',
            detail: `Ошибка при загрузке всех страниц: ${error}`,
            life: 5000
        });
        allPages.value = [];
        addedPages.value = [];
    }
};

const availablePages = computed(() => {
    const addedIds = new Set(addedPages.value.map(p => p.id));
    return allPages.value.filter(p => !addedIds.has(p.id));
});

const addPage = async (page: Page) => {
    if (!selectedRoleId.value) return;
    isAdding.value = true;
    try {
        await props.addPageToRole(selectedRoleId.value, page.id);
        emit('pages-updated');
        toast.add({
            severity: 'success',
            summary: 'Успешно',
            detail: `Страница "${page.name}" добавлена к роли`,
            life: 3000
        });
    } catch (error) {
        console.error('Ошибка при добавлении страницы:', error);
        toast.add({
            severity: 'error',
            summary: 'Ошибка',
            detail: `Ошибка при добавлении страницы: ${error}`,
            life: 5000
        });
    } finally {
        isAdding.value = false;
    }
};

watch(() => props.visible, async (newVisible) => {
    if (!newVisible) {
        selectedRoleId.value = null;
    } else {
        await loadAllPages();
    }
});
</script>

<style scoped>
.add-pages-modal {
    min-height: 300px;
}

.pages-container {
    max-height: 400px;
    overflow-y: auto;
    border: 1px solid var(--russ-border);
    border-radius: 8px;
    background: var(--russ-bg-quaternary);
}

.page-item {
    background: var(--russ-bg);
    border-bottom: 1px solid var(--russ-border);
    transition: all 0.2s ease;
}

.page-item:last-child {
    border-bottom: none;
}

.page-item:hover {
    background: var(--russ-bg-disabled);
}

.modal-page-content {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    gap: 12px;
}

.page-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.page-name {
    font-weight: 500;
    color: var(--russ-text-secondary);
}

.page-code {
    font-size: 12px;
    color: var(--russ-text-tertiary);
}

.add-btn {
    background: none;
    border: none;
    color: var(--russ-success);
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: background-color 0.2s ease;
    font-size: 16px;
}

.add-btn:hover:not(:disabled) {
    background: var(--russ-success-light);
}

.add-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.no-pages-message,
.select-role-message {
    text-align: center;
    padding: 40px 20px;
    color: var(--russ-text-tertiary);
}

.mb-4 {
    margin-bottom: 1rem;
}

.mb-3 {
    margin-bottom: 0.75rem;
}

.mb-2 {
    margin-bottom: 0.5rem;
}

.mt-2 {
    margin-top: 0.5rem;
}

.block {
    display: block;
}

.text-sm {
    font-size: 0.875rem;
}

.font-medium {
    font-weight: 500;
}

.text-lg {
    font-size: 1.125rem;
}

.font-semibold {
    font-weight: 600;
}

.text-center {
    text-align: center;
}

.text-gray-500 {
    color: var(--russ-text-tertiary);
}

.text-gray-600 {
    color: var(--russ-text-secondary);
}

.w-full {
    width: 100%;
}

.py-4 {
    padding-top: 1rem;
    padding-bottom: 1rem;
}

.loader {
    width: 40px;
    height: 40px;
    border: 3px solid var(--russ-border);
    border-top: 3px solid var(--russ-primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto;
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
}
</style>
