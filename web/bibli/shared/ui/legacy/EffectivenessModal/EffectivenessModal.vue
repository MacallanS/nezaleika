<template>
    <ResponsiveModal :modelValue="visible" size="sm" max-width="640px" class="effectiveness-base-modal reporting-modal"
        :sheet-height-percent="80"
        :closable="!isExporting"
        :close-on-overlay-click="!isExporting"
        :close-on-escape="!isExporting"
        @update:modelValue="(v: boolean) => { if (!v) closeModal(); }">
        <template #header>
            <div class="modal-title">
                <i class="pi pi-chart-line"></i>
                <h2>Отчет по эффективности агентов</h2>
            </div>
        </template>

        <div class="modal-content">
            <div class="reporting-modal-filters">
                <div class="reporting-modal-filters-head">
                    <span class="reporting-modal-filters-title">Параметры отчёта</span>
                    <span v-if="activeContextLabel" class="reporting-modal-context">
                        <i class="pi pi-map-marker" aria-hidden="true"></i>
                        {{ activeContextLabel }}
                    </span>
                </div>
                <FiltersBar :filters="filterConfigs" :model-value="filterValues" :show-reset-button="false"
                    :show-mobile-button="false" @update:model-value="handleFiltersUpdate"
                    @filter-change="handleFilterChange" />
            </div>
        </div>

        <template #footer>
            <div class="reporting-modal-footer">
                <button
                    type="button"
                    class="reporting-header-action"
                    :disabled="isExporting || !filters.project"
                    :aria-busy="isExporting"
                    @click="handleExport"
                >
                    <span class="reporting-header-action-icon" aria-hidden="true">
                        <i :class="isExporting ? 'pi pi-spin pi-spinner' : 'pi pi-file-excel'"></i>
                    </span>
                    <span class="reporting-header-action-label reporting-header-action-label--single">
                        {{ exportButtonLabel }}
                    </span>
                </button>
                <button
                    type="button"
                    class="reporting-header-action reporting-header-action--text-only"
                    :disabled="isExporting"
                    @click="closeModal"
                >
                    <span class="reporting-header-action-label reporting-header-action-label--single">Закрыть</span>
                </button>
            </div>
        </template>
    </ResponsiveModal>

    <ExcelExportOverlay :active="isExporting" />
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import { FiltersBar, type FilterConfig, ResponsiveModal, ExcelExportOverlay } from '@/shared/ui';
import { useToast } from '../Toast';
import { useProjects, useAgents } from '@/shared/composables';
import { applySingleProjectPointDefaults, getExcelExportErrorToast, downloadBlobFile } from 'bibli/shared/utils';
import type { Agent } from '@/stores/agents';
import '../../../styles/reporting-modal.css';

export interface ShiftReportField {
    id?: number;
    key: string;
    label: string;
    name?: string;
}

interface ShiftReportFieldsByProjectsResponse {
    data: Array<{
        project_id: number;
        project_name: string;
        shift_report_fields: ShiftReportField[];
    }>;
}

interface Props {
    visible: boolean;
    /** Проект из фильтров страницы отчётности (при открытии модалки). */
    initialProject?: number;
    /** Точка из фильтров страницы отчётности (при открытии модалки). */
    initialPoint?: number;
    exportEffectivenessReport: (params: {
        date_from?: string;
        date_to?: string;
        project: number;
        point?: number;
        user_id?: number;
        options?: string;
        sort_by?: string;
    }) => Promise<Blob>;
    fetchShiftReportFieldsByProjects: () => Promise<ShiftReportFieldsByProjectsResponse>;
}

interface Emits {
    (e: 'close'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const toast = useToast();
const { projects, points, isLoading: isLoadingProjects, loadProjects, getPointsByProjectId } = useProjects();
const { agents, isLoading: isLoadingAgents, loadAgents, getAgentsByProject, getAgentsByProjectAndPoint } = useAgents();

const filters = ref({
    dateRange: { from: undefined as Date | undefined, to: undefined as Date | undefined },
    project: undefined as number | undefined,
    point: undefined as number | undefined,
    user_id: undefined as number | undefined,
    options: undefined as string | undefined,
    sort_by: undefined as string | undefined,
});

const shiftReportFields = ref<Array<{ project_id: number; project_name: string; shift_report_fields: ShiftReportField[] }>>([]);
const isExporting = ref(false);
const isLoadingData = ref(false);
const isLoadingMetrics = ref(false);

const metricOptions = computed(() => {
    if (!filters.value.project) {
        return [{ id: undefined, name: 'Все метрики' }];
    }

    const projectFields = shiftReportFields.value.find(p => p.project_id === filters.value.project);
    if (!projectFields || !projectFields.shift_report_fields.length) {
        return [{ id: undefined, name: 'Все метрики' }];
    }

    return [
        { id: undefined, name: 'Все метрики' },
        ...projectFields.shift_report_fields.map(field => ({
            id: field.key,
            name: field.label
        }))
    ];
});

const sortByOptions = computed(() => {
    const baseOptions = [
        { id: undefined, name: 'По фамилии' },
        { id: 'shifts_count', name: 'По количеству смен' },
    ];

    // efficiency и total доступны только при указании options
    if (filters.value.options !== undefined) {
        baseOptions.push(
            { id: 'efficiency', name: 'По эффективности' },
            { id: 'total', name: 'По сумме выдач' }
        );
    }

    return baseOptions;
});

const projectOptions = computed(() =>
    projects.value.map(p => ({ id: p.id, name: p.name }))
);

const pointOptions = computed(() => {
    if (!filters.value.project) {
        return [{ id: undefined, name: 'Все точки' }];
    }
    const projectPoints = getPointsByProjectId(filters.value.project);
    return [
        { id: undefined, name: 'Все точки' },
        ...projectPoints.map(p => ({ id: p.id, name: p.name }))
    ];
});

const showProjectFilter = computed(() => projects.value.length !== 1);

const showPointFilter = computed(() => {
    if (!filters.value.project) return false;
    return getPointsByProjectId(filters.value.project).length !== 1;
});

const exportButtonLabel = computed(() => {
    if (isExporting.value) return 'Формируем Excel…';
    if (!filters.value.project) return 'Выберите проект';
    return 'Скачать Excel';
});

const activeContextLabel = computed(() => {
    const parts: string[] = [];

    if (!showProjectFilter.value && filters.value.project) {
        const project = projects.value.find(p => p.id === filters.value.project);
        if (project?.name) parts.push(project.name);
    }

    if (!showPointFilter.value && filters.value.project && filters.value.point) {
        const point = getPointsByProjectId(filters.value.project).find(p => p.id === filters.value.point);
        if (point?.name) parts.push(point.name);
    }

    return parts.join(' · ');
});

const userOptions = computed(() => {
    // Если выбран проект и точка, показываем агентов только для этой точки
    // Если выбран только проект, показываем агентов для этого проекта
    // Если ничего не выбрано, показываем всех агентов
    let agentsToShow: Agent[] = [];
    if (filters.value.project) {
        agentsToShow = getAgentsByProjectAndPoint(
            filters.value.project,
            filters.value.point
        );
    } else {
        // Если проект не выбран, показываем всех агентов (из кэша 'all' или объединенных)
        agentsToShow = agents.value;
    }

    return [
        { id: undefined, name: 'Все агенты' },
        ...agentsToShow.map(a => ({
            id: a.id,
            name: `${a.surname || ''} ${a.name || ''} ${a.patronymic || ''}`.trim() || a.phone
        }))
    ];
});

const filterValues = computed(() => ({
    dateRange: filters.value.dateRange || { from: undefined, to: undefined },
    project: filters.value.project,
    point: filters.value.point,
    userId: filters.value.user_id,
    options: filters.value.options,
    sortBy: filters.value.sort_by,
}));

const filterConfigs = computed((): FilterConfig[] => {
    const configs: FilterConfig[] = [
        {
            key: 'dateRange',
            type: 'date-range' as const,
            label: 'Период',
            placeholder: 'Выберите период',
        },
    ];

    if (showProjectFilter.value) {
        configs.push({
            key: 'project',
            type: 'select' as const,
            label: 'Проект',
            placeholder: (isLoadingData.value || isLoadingProjects.value) ? 'Загрузка...' : 'Проект',
            options: projectOptions.value,
            optionLabel: 'name',
            optionValue: 'id',
            searchable: false,
            disabled: isLoadingData.value || isLoadingProjects.value,
            onChange: () => onProjectChange(),
        });
    }

    if (showPointFilter.value) {
        configs.push({
            key: 'point',
            type: 'select' as const,
            label: 'Точка',
            placeholder: isLoadingData.value ? 'Загрузка точек...' : (filters.value.project && filters.value.project !== undefined) ? 'Выберите точку' : 'Сначала выберите проект',
            options: pointOptions.value,
            optionLabel: 'name',
            optionValue: 'id',
            searchable: false,
            disabled: isLoadingData.value || !filters.value.project || filters.value.project === undefined,
        });
    }

    configs.push(
        {
            key: 'userId',
            type: 'select' as const,
            label: 'Агент',
            placeholder: (isLoadingData.value || isLoadingAgents.value) ? 'Загрузка агентов...' : 'Выберите агента',
            options: userOptions.value,
            optionLabel: 'name',
            optionValue: 'id',
            searchable: true,
            disabled: isLoadingData.value || isLoadingAgents.value,
        },
        {
            key: 'options',
            type: 'select' as const,
            label: 'Метрика',
            placeholder: isLoadingMetrics.value ? 'Загрузка метрик...' : (!filters.value.project || filters.value.project === undefined) ? 'Сначала выберите проект' : 'Все метрики',
            options: metricOptions.value,
            optionLabel: 'name',
            optionValue: 'id',
            searchable: false,
            disabled: isLoadingMetrics.value || !filters.value.project || filters.value.project === undefined,
        },
        {
            key: 'sortBy',
            type: 'select' as const,
            label: 'Сортировка',
            placeholder: 'По фамилии',
            options: sortByOptions.value,
            optionLabel: 'name',
            optionValue: 'id',
            searchable: false,
        },
    );

    return configs;
});

const handleFiltersUpdate = (values: Record<string, any>) => {
    const oldProject = filters.value.project;
    filters.value.dateRange = values.dateRange || { from: undefined, to: undefined };
    filters.value.project = values.project || undefined;
    filters.value.point = values.point || undefined;
    filters.value.user_id = values.userId || undefined;
    filters.value.options = values.options || undefined;
    filters.value.sort_by = values.sortBy || undefined;

    if (oldProject !== filters.value.project) {
        filters.value.point = undefined;
        if (filters.value.project) {
            applySingleProjectPointDefaults(filters.value, projects.value, getPointsByProjectId);
        }
    }
};

const handleFilterChange = (key: string, value: any) => {
    if (key === 'project') {
        onProjectChange();
    }
};

const onProjectChange = () => {
    filters.value.point = undefined;
    filters.value.options = undefined;
    if (filters.value.project) {
        applySingleProjectPointDefaults(filters.value, projects.value, getPointsByProjectId);
    }
};

// Сбрасываем sort_by при изменении options, если выбраны опции, требующие options
watch(() => filters.value.options, (newOptions) => {
    if (!newOptions && (filters.value.sort_by === 'efficiency' || filters.value.sort_by === 'total')) {
        filters.value.sort_by = undefined;
    }
});

const isValidId = (val: unknown): val is number => {
    if (val === null || val === undefined) return false;
    if (typeof val === 'string') {
        const trimmed = val.trim().toLowerCase();
        if (trimmed === '' || trimmed === 'undefined' || trimmed === 'null') return false;
        const num = Number(val);
        return Number.isFinite(num) && num > 0;
    }
    if (typeof val === 'number') {
        return Number.isFinite(val) && val > 0;
    }
    return false;
};

const formatDateForAPI = (date: Date | undefined): string | undefined => {
    if (!date) return undefined;
    const normalized = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const year = normalized.getFullYear();
    const month = String(normalized.getMonth() + 1).padStart(2, '0');
    const day = String(normalized.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};


const handleExport = async () => {
    if (isExporting.value) return;

    // Проверяем, что проект выбран (обязательное поле)
    if (!filters.value.project || filters.value.project === undefined) {
        toast.add({
            severity: 'warn',
            summary: 'Внимание',
            detail: 'Необходимо выбрать проект для экспорта',
            life: 4000,
        });
        return;
    }

    isExporting.value = true;

    try {
        await nextTick();
        const params: any = {};
        const dateRange = filters.value.dateRange || { from: undefined, to: undefined };

        const dateFrom = formatDateForAPI(dateRange.from);
        const dateTo = formatDateForAPI(dateRange.to);

        if (dateFrom) {
            params.date_from = dateFrom;
        }
        if (dateTo) {
            params.date_to = dateTo;
        }
        // Проект обязателен
        params.project = filters.value.project;
        if (isValidId(filters.value.point)) {
            params.point = Number(filters.value.point);
        }
        if (isValidId(filters.value.user_id)) {
            params.user_id = Number(filters.value.user_id);
        }
        if (filters.value.options !== undefined) {
            params.options = filters.value.options;
        }
        if (filters.value.sort_by !== undefined) {
            params.sort_by = filters.value.sort_by;
        }

        const blob = await props.exportEffectivenessReport(params);

        if (!blob || !(blob instanceof Blob)) {
            throw new Error('Получен неверный формат файла');
        }

        if (blob.size === 0) {
            throw new Error('Получен пустой файл');
        }

        const excelBlob = blob.type
            ? blob
            : new Blob([blob], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

        downloadBlobFile(excelBlob, `staff_effectiveness_${dateFrom || 'from'}_${dateTo || 'to'}.xlsx`);

        toast.add({
            severity: 'success',
            summary: 'Успешно',
            detail: 'Excel-файл скачан',
            life: 3000,
        });
    } catch (error: any) {
        console.error('Ошибка экспорта:', error);
        const toastPayload = getExcelExportErrorToast(error);
        toast.add(toastPayload);
    } finally {
        isExporting.value = false;
    }
};

const loadProjectsAndPoints = async () => {
    try {
        // Всегда вызываем loadProjects - он сам проверит кэш внутри
        const loadedProjects = await loadProjects(false);
        console.log('[EffectivenessModal] Проекты загружены/из кэша:', loadedProjects.length);
        await nextTick();
    } catch (error) {
        console.error('Ошибка загрузки проектов и точек:', error);
        toast.add({
            severity: 'error',
            summary: 'Ошибка загрузки',
            detail: 'Не удалось загрузить список проектов и точек',
            life: 4000,
        });
    }
};

const loadAgentsData = async (projectId?: number) => {
    try {
        // Загружаем агентов для конкретного проекта, если он выбран
        // Store проверит кэш внутри
        const loadedAgents = await loadAgents(projectId, false);
        console.log('[EffectivenessModal] Агенты загружены/из кэша для проекта', projectId || 'all', ':', loadedAgents.length);
        await nextTick();
    } catch (error) {
        console.error('Ошибка загрузки агентов:', error);
        toast.add({
            severity: 'error',
            summary: 'Ошибка загрузки',
            detail: 'Не удалось загрузить список агентов',
            life: 4000,
        });
    }
};

const loadMetricsForProject = async (projectId: number) => {
    isLoadingMetrics.value = true;
    try {
        const response = await props.fetchShiftReportFieldsByProjects();
        shiftReportFields.value = response.data;
        await nextTick();
    } catch (error) {
        console.error('Ошибка загрузки метрик:', error);
        toast.add({
            severity: 'error',
            summary: 'Ошибка загрузки',
            detail: 'Не удалось загрузить метрики для проекта',
            life: 4000,
        });
    } finally {
        isLoadingMetrics.value = false;
    }
};

let lastSyncedParentProject: number | undefined;
let lastSyncedParentPoint: number | undefined;

function normalizedParentProject(): number | undefined {
    const projectId = Number(props.initialProject);
    return Number.isFinite(projectId) && projectId > 0 ? projectId : undefined;
}

function normalizedParentPoint(): number | undefined {
    const pointId = Number(props.initialPoint);
    return Number.isFinite(pointId) && pointId > 0 ? pointId : undefined;
}

function shouldSyncParentFilters(): boolean {
    const projectId = normalizedParentProject();
    const pointId = normalizedParentPoint();
    return projectId !== lastSyncedParentProject || pointId !== lastSyncedParentPoint;
}

function applyInitialFiltersFromParent() {
    const projectId = normalizedParentProject();
    const pointId = normalizedParentPoint();
    const projectChanged = filters.value.project !== projectId;
    const pointChanged = filters.value.point !== pointId;

    filters.value.project = projectId;
    filters.value.point = pointId;

    if (projectChanged || pointChanged) {
        filters.value.user_id = undefined;
        filters.value.options = undefined;
        filters.value.sort_by = undefined;
    }

    lastSyncedParentProject = projectId;
    lastSyncedParentPoint = pointId;
}

async function applyParentFiltersFromPage() {
    applyInitialFiltersFromParent();
    if (normalizedParentProject() !== undefined) {
        applySingleProjectPointDefaults(filters.value, projects.value, getPointsByProjectId);
    }
    await loadAgentsData(filters.value.project);

    if (filters.value.project) {
        await loadMetricsForProject(filters.value.project);
    }
}

/** Подтянуть проект/точку со страницы отчётности только при замене фильтра, не при закрытии модалки. */
async function syncParentFiltersIfNeeded(): Promise<boolean> {
    if (!shouldSyncParentFilters()) {
        return false;
    }

    await applyParentFiltersFromPage();
    return true;
}

const closeModal = async () => {
    if (isExporting.value) return;

    try {
        await nextTick();
        emit('close');
    } catch (error) {
        console.error('Error closing modal:', error);
        emit('close');
    }
};

watch(() => props.visible, async (newVal) => {
    if (newVal) {
        const now = new Date();
        const dateRange = filters.value.dateRange || { from: undefined, to: undefined };
        if (!dateRange.from) {
            dateRange.from = new Date(now.getFullYear(), now.getMonth(), 1);
        }
        if (!dateRange.to) {
            dateRange.to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        }
        filters.value.dateRange = dateRange;

        isLoadingData.value = true;

        try {
            await Promise.all([
                loadProjectsAndPoints(),
                props.fetchShiftReportFieldsByProjects().then(response => {
                    shiftReportFields.value = response.data;
                }).catch(error => {
                    console.error('Ошибка загрузки метрик:', error);
                }),
            ]);

            await applyParentFiltersFromPage();
        } finally {
            isLoadingData.value = false;
        }
    }
});

watch(
    () => [props.initialProject, props.initialPoint],
    async () => {
        if (!props.visible) {
            return;
        }

        await syncParentFiltersIfNeeded();
    },
);

// При изменении проекта перезагружаем агентов для этого проекта
watch(() => filters.value.project, async (newProjectId, oldProjectId) => {
    if (!newProjectId) {
        filters.value.options = undefined;
        filters.value.user_id = undefined;
        filters.value.point = undefined;
        return;
    }

    if (newProjectId !== oldProjectId) {
        if (newProjectId) {
            applySingleProjectPointDefaults(filters.value, projects.value, getPointsByProjectId);
        }
        try {
            await loadAgentsData(newProjectId);
            filters.value.user_id = undefined;
        } catch (error) {
            console.error('Ошибка загрузки агентов для проекта:', error);
        }
    }
});

onMounted(() => {
    const now = new Date();
    filters.value.dateRange = {
        from: new Date(now.getFullYear(), now.getMonth(), 1),
        to: new Date(now.getFullYear(), now.getMonth() + 1, 0)
    };
});
</script>

<style scoped>
.modal-title {
    display: flex;
    align-items: center;
    gap: 12px;
}

.modal-title i {
    font-size: 24px;
    color: var(--russ-primary);
    background: var(--russ-bg-blue-lighter);
    padding: 8px;
    border-radius: 8px;
}

.modal-title h2 {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
    color: var(--russ-primary);
}

.modal-content {
    display: flex;
    flex-direction: column;
    gap: 16px;
}
</style>
