<template>
    <BaseModal
        v-model="modalVisible"
        title="Управление страницами роли"
        width="600px"
        @hide="onClose"
    >
        <div class="role-pages-modal">
            <div class="role-selector mb-4">
                <BaseSelect
                    id="roleSelect"
                    :model-value="selectedRoleId ?? undefined"
                    :options="roleOptions"
                    option-label="label"
                    option-value="value"
                    placeholder="Выберите роль для управления страницами"
                    label="Выберите роль:"
                    @update:model-value="handleRoleChange"
                />
            </div>

            <div v-if="isLoading" class="text-center py-4">
                <div class="loader"></div>
                <p class="mt-2 text-gray-600">Загрузка страниц роли...</p>
            </div>

            <div v-else-if="selectedRoleId && rolePages.length > 0" class="role-pages-list">
                <h3 class="text-lg font-semibold mb-3">Страницы роли:</h3>
                <div class="pages-container">
                    <div v-for="(page, index) in rolePages" :key="page.id" class="page-item"
                        :class="{ 'dragging': draggedIndex === index }" draggable="true"
                        @dragstart="onDragStart(index, $event)" @dragover.prevent @drop="onDrop(index, $event)"
                        @dragend="onDragEnd">
                        <div class="modal-page-content">
                            <div class="drag-handle">⋮⋮</div>
                            <div class="page-info">
                                <span class="page-name">{{ page.name }}</span>
                                <span class="page-code">({{ page.code }})</span>
                            </div>
                            <button @click="removePage(page)" class="remove-btn" title="Удалить страницу из роли"
                                :disabled="isRemoving">
                                🗑
                            </button>
                        </div>
                    </div>
                </div>

                <div class="mt-4 text-right">
                    <Button label="Сохранить порядок" :loading="isSavingOrder"
                        :disabled="isSavingOrder || !hasOrderChanged" @click="savePageOrder" />
                </div>

                <div v-if="setRoleMobileSlots" class="mobile-slots mt-6">
                    <h3 class="text-lg font-semibold mb-2">Мобильный таббар (4 слота)</h3>
                    <p class="mobile-slots__hint">
                        Профиль всегда 5-й слот. Пустой слот = пустое место в таббаре.
                    </p>
                    <div class="mobile-slots__grid">
                        <label
                            v-for="slot in 4"
                            :key="slot"
                            class="mobile-slots__field"
                        >
                            <span>Слот {{ slot }}</span>
                            <select
                                class="mobile-slots__select"
                                :value="mobileSlotPageIds[slot - 1] ?? ''"
                                @change="onMobileSlotChange(slot - 1, ($event.target as HTMLSelectElement).value)"
                            >
                                <option value="">— пусто —</option>
                                <option
                                    v-for="page in rolePages"
                                    :key="page.id"
                                    :value="String(page.id)"
                                    :disabled="isPageUsedInOtherSlot(page.id, slot - 1)"
                                >
                                    {{ page.name }} ({{ page.code }})
                                </option>
                            </select>
                        </label>
                    </div>
                    <div class="mt-3 text-right">
                        <Button
                            label="Сохранить мобильные слоты"
                            :loading="isSavingMobileSlots"
                            :disabled="isSavingMobileSlots || !hasMobileSlotsChanged"
                            @click="saveMobileSlots"
                        />
                    </div>
                </div>
            </div>

            <div v-else-if="selectedRoleId" class="no-pages-message">
                <p class="text-gray-500 text-center py-4">
                    У выбранной роли нет назначенных страниц.
                </p>
            </div>

            <div v-else class="select-role-message">
                <p class="text-gray-500 text-center py-4">
                    Выберите роль для управления её страницами.
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

export interface Page {
    id: number;
    name: string;
    code: string;
    mobile_slot?: number | null;
    pivot?: { mobile_slot?: number | null; position?: number };
}

interface Props {
    visible: boolean;
    roles: Array<{ id: number; name: string; label: string }>;
    fetchRolePages: (roleId: number) => Promise<{ pages: Page[] }>;
    removePageFromRole: (roleId: number, pageId: number) => Promise<void>;
    updateRolePagePositions: (roleId: number, pageIds: number[]) => Promise<void>;
    setRoleMobileSlots?: (
        roleId: number,
        slots: Array<{ slot: 1 | 2 | 3 | 4; page_id: number | null }>,
    ) => Promise<void>;
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
const rolePages = ref<Page[]>([]);
const isLoading = ref(false);
const isRemoving = ref(false);
const isSavingOrder = ref(false);
const isSavingMobileSlots = ref(false);
const draggedIndex = ref<number | null>(null);
const originalOrder = ref<number[]>([]);
/** page id or null for each of 4 mobile slots */
const mobileSlotPageIds = ref<Array<number | null>>([null, null, null, null]);
const originalMobileSlotPageIds = ref<Array<number | null>>([null, null, null, null]);

const roleOptions = computed(() =>
    props.roles.map(role => ({
        label: role.label,
        value: role.id
    }))
);

const hasOrderChanged = computed(() => {
    if (originalOrder.value.length !== rolePages.value.length) return false;
    return !originalOrder.value.every((id, index) => rolePages.value[index]?.id === id);
});

const hasMobileSlotsChanged = computed(() =>
    mobileSlotPageIds.value.some(
        (id, i) => id !== originalMobileSlotPageIds.value[i],
    ),
);

function readPageMobileSlot(page: Page): number | null {
    const raw = page.mobile_slot ?? page.pivot?.mobile_slot;
    if (raw == null || raw === '') return null;
    const n = Number(raw);
    return Number.isFinite(n) && n >= 1 && n <= 4 ? n : null;
}

function syncMobileSlotsFromPages(pages: Page[]) {
    const next: Array<number | null> = [null, null, null, null];
    for (const page of pages) {
        const slot = readPageMobileSlot(page);
        if (slot == null) continue;
        next[slot - 1] = page.id;
    }
    mobileSlotPageIds.value = next;
    originalMobileSlotPageIds.value = [...next];
}

function isPageUsedInOtherSlot(pageId: number, slotIndex: number) {
    return mobileSlotPageIds.value.some(
        (id, i) => i !== slotIndex && id === pageId,
    );
}

function onMobileSlotChange(slotIndex: number, value: string) {
    const next = [...mobileSlotPageIds.value];
    next[slotIndex] = value ? Number(value) : null;
    mobileSlotPageIds.value = next;
}

const onClose = () => {
    emit('update:visible', false);
    selectedRoleId.value = null;
    rolePages.value = [];
    originalOrder.value = [];
    mobileSlotPageIds.value = [null, null, null, null];
    originalMobileSlotPageIds.value = [null, null, null, null];
};

const handleRoleChange = async (value: number | string | undefined) => {
    selectedRoleId.value = value as number | null;
    if (!selectedRoleId.value) {
        rolePages.value = [];
        originalOrder.value = [];
        return;
    }

    await loadRolePages();
};

const loadRolePages = async () => {
    if (!selectedRoleId.value) return;

    isLoading.value = true;
    try {
        const response = await props.fetchRolePages(selectedRoleId.value);
        rolePages.value = response.pages;
        originalOrder.value = response.pages.map(page => page.id);
        syncMobileSlotsFromPages(response.pages);
    } catch (error) {
        console.error('Ошибка при загрузке страниц роли:', error);
        toast.add({
            severity: 'error',
            summary: 'Ошибка',
            detail: `Ошибка при загрузке страниц роли: ${error}`,
            life: 5000
        });
    } finally {
        isLoading.value = false;
    }
};

const removePage = async (page: Page) => {
    if (!selectedRoleId.value) return;

    isRemoving.value = true;
    try {
        await props.removePageFromRole(selectedRoleId.value, page.id);
        rolePages.value = rolePages.value.filter(p => p.id !== page.id);
        mobileSlotPageIds.value = mobileSlotPageIds.value.map((id) =>
            id === page.id ? null : id,
        );
        emit('pages-updated');
        toast.add({
            severity: 'success',
            summary: 'Успешно',
            detail: `Страница "${page.name}" удалена из роли`,
            life: 3000
        });
    } catch (error) {
        console.error('Ошибка при удалении страницы:', error);
        toast.add({
            severity: 'error',
            summary: 'Ошибка',
            detail: `Ошибка при удалении страницы: ${error}`,
            life: 5000
        });
    } finally {
        isRemoving.value = false;
    }
};

const onDragStart = (index: number, event: DragEvent) => {
    draggedIndex.value = index;
    if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = 'move';
    }
};

const onDrop = (dropIndex: number, event: DragEvent) => {
    event.preventDefault();
    if (draggedIndex.value === null || draggedIndex.value === dropIndex) return;

    const pages = [...rolePages.value];
    const draggedPage = pages[draggedIndex.value];
    pages.splice(draggedIndex.value, 1);
    pages.splice(dropIndex, 0, draggedPage);
    rolePages.value = pages;
};

const onDragEnd = () => {
    draggedIndex.value = null;
};

const savePageOrder = async () => {
    if (!selectedRoleId.value || !hasOrderChanged.value) return;

    isSavingOrder.value = true;
    try {
        const pageIds = rolePages.value.map(page => page.id);
        await props.updateRolePagePositions(selectedRoleId.value, pageIds);
        originalOrder.value = [...pageIds];
        emit('pages-updated');
        toast.add({
            severity: 'success',
            summary: 'Успешно',
            detail: 'Порядок страниц успешно сохранен',
            life: 3000
        });
    } catch (error) {
        console.error('Ошибка при сохранении порядка страниц:', error);
        toast.add({
            severity: 'error',
            summary: 'Ошибка',
            detail: `Ошибка при сохранении порядка страниц: ${error}`,
            life: 5000
        });
    } finally {
        isSavingOrder.value = false;
    }
};

const saveMobileSlots = async () => {
    if (!selectedRoleId.value || !props.setRoleMobileSlots || !hasMobileSlotsChanged.value) return;

    isSavingMobileSlots.value = true;
    try {
        const slots = mobileSlotPageIds.value.map((pageId, index) => ({
            slot: (index + 1) as 1 | 2 | 3 | 4,
            page_id: pageId,
        }));
        await props.setRoleMobileSlots(selectedRoleId.value, slots);
        originalMobileSlotPageIds.value = [...mobileSlotPageIds.value];
        emit('pages-updated');
        toast.add({
            severity: 'success',
            summary: 'Успешно',
            detail: 'Мобильные слоты сохранены',
            life: 3000,
        });
        await loadRolePages();
    } catch (error) {
        console.error('Ошибка при сохранении мобильных слотов:', error);
        toast.add({
            severity: 'error',
            summary: 'Ошибка',
            detail: `Ошибка при сохранении мобильных слотов: ${error}`,
            life: 5000,
        });
    } finally {
        isSavingMobileSlots.value = false;
    }
};

watch(() => props.visible, (newVisible) => {
    if (!newVisible) {
        selectedRoleId.value = null;
        rolePages.value = [];
        originalOrder.value = [];
        mobileSlotPageIds.value = [null, null, null, null];
        originalMobileSlotPageIds.value = [null, null, null, null];
    }
});
</script>

<style scoped>
.role-pages-modal {
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

.page-item.dragging {
    opacity: 0.5;
    background: var(--russ-border);
}

.modal-page-content {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    gap: 12px;
}

.drag-handle {
    color: var(--russ-text-quaternary);
    cursor: grab;
    font-size: 14px;
    user-select: none;
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

.remove-btn {
    background: none;
    border: none;
    color: var(--russ-error);
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: background-color 0.2s ease;
}

.remove-btn:hover:not(:disabled) {
    background: var(--russ-error-light);
}

.remove-btn:disabled {
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

.mt-4 {
    margin-top: 1rem;
}

.mt-2 {
    margin-top: 0.5rem;
}

.mb-2 {
    margin-bottom: 0.5rem;
}

.mb-3 {
    margin-bottom: 0.75rem;
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

.text-right {
    text-align: right;
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

.px-4 {
    padding-left: 1rem;
    padding-right: 1rem;
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

.mobile-slots {
    padding-top: 8px;
    border-top: 1px solid var(--russ-border);
}

.mobile-slots__hint {
    margin: 0 0 12px;
    font-size: 13px;
    color: var(--russ-text-tertiary);
}

.mobile-slots__grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
}

.mobile-slots__field {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 13px;
    font-weight: 600;
}

.mobile-slots__select {
    width: 100%;
    padding: 8px 10px;
    border: 1px solid var(--russ-border);
    border-radius: 8px;
    background: var(--russ-bg);
    font: inherit;
    font-weight: 400;
}

.mt-6 {
    margin-top: 1.5rem;
}

.mt-3 {
    margin-top: 0.75rem;
}
</style>
