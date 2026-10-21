<!--
  RuchnikBlockRequests — управление ID заявок на странице requests.
  Список на всю ширину + drawer для добавления / массового переноса / редактирования.
-->

<template>
  <div
    class="ruchnik-block"
    :class="{
      'ruchnik-block--modal-embed': embedInModal,
      'ruchnik-block--full-page': fullPage,
    }"
  >
    <div class="ruchnik-main">
      <h4 v-if="!embedInModal" class="ruchnik-section-title">ID заявок</h4>

      <div
        class="ruchnik-toolbar"
        :class="{ 'ruchnik-toolbar--filters-open': mobileFiltersOpen }"
      >
        <div v-if="$slots['toolbar-leading']" class="ruchnik-toolbar-leading">
          <slot name="toolbar-leading" />
        </div>

        <div class="ruchnik-toolbar-controls">
          <div class="ruchnik-toolbar-controls-top">
            <input
              v-model="localSearchQuery"
              type="search"
              enterkeyhint="search"
              autocomplete="off"
              class="ruchnik-toolbar-input ruchnik-toolbar-search"
              :placeholder="searchRequiresTypeChoice ? 'Сначала выберите тип' : 'Поиск по коду...'"
              :readonly="searchRequiresTypeChoice"
              @focus="onSearchFilterInputFocus"
              @input="onSearchInput"
            />

            <button
              v-if="showMobileFilterToggle"
              type="button"
              class="ruchnik-toolbar-filters-btn"
              :class="{ 'ruchnik-toolbar-filters-btn--active': filtersButtonActive }"
              :aria-label="filtersButtonAriaLabel"
              :aria-expanded="mobileFiltersOpen"
              @click="mobileFiltersOpen = !mobileFiltersOpen"
            >
              <i class="pi pi-filter" aria-hidden="true"></i>
            </button>

            <button
              v-if="canManage"
              type="button"
              class="ruchnik-add-btn ruchnik-toolbar-add ruchnik-toolbar-add--inline"
              :disabled="loading"
              @click="openAddDrawer"
            >
              <i class="pi pi-plus" aria-hidden="true"></i>
              Добавить
            </button>
          </div>

          <div class="ruchnik-toolbar-filters">
            <div v-if="singleRuchnikType" class="ruchnik-filter-item ruchnik-toolbar-type">
              <span class="ruchnik-filter-label">Тип</span>
              <Chip :label="singleRuchnikTypeDisplay" selected />
            </div>
            <div v-else-if="showTypeFilterSelect" class="ruchnik-filter-item">
              <span class="ruchnik-filter-label">Тип</span>
              <BaseSelect
                v-model="localSelectedType"
                class="ruchnik-select ruchnik-toolbar-field"
                height=""
                :options="typeSelectOptions"
                option-label="name"
                option-value="id"
                placeholder="Все типы"
                :searchable="true"
                :disabled="typesLoading"
                :loading="typesLoading"
                @update:model-value="onToolbarTypeChange"
              />
            </div>
            <div v-if="canManage" class="ruchnik-filter-item">
              <span class="ruchnik-filter-label">Агент</span>
              <BaseSelect
                v-model="localSelectedUserId"
                class="ruchnik-select ruchnik-toolbar-field"
                height=""
                :options="agentSelectOptions"
                option-label="name"
                option-value="id"
                placeholder="Все агенты"
                :searchable="true"
                :disabled="agentsLoading"
                :loading="agentsLoading"
                @update:model-value="onToolbarAgentChange"
              />
            </div>
            <div v-if="hasActiveFilters" class="ruchnik-filter-item ruchnik-filter-item--reset">
              <span class="ruchnik-filter-label ruchnik-filter-label--spacer" aria-hidden="true">&nbsp;</span>
              <button type="button" class="ruchnik-toolbar-reset-btn" @click="resetFilters">
                <i class="pi pi-filter-slash" aria-hidden="true"></i>
                <span class="ruchnik-toolbar-reset-label">Сбросить</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="ruchnik-content">
        <div
          class="ruchnik-list-area"
          :class="{ 'ruchnik-list-area--busy': loading && items.length > 0 }"
        >
          <div v-if="loading && !items.length" class="ruchnik-loading">
            <span class="loader"></span>
            <span>Загрузка заявок...</span>
          </div>

          <template v-else>
            <div v-if="items.length > 0" class="ruchnik-list">
              <div class="ruchnik-list-head" aria-hidden="true">
                <span class="ruchnik-list-head-code">ID заявки</span>
                <span class="ruchnik-list-head-agent">Агент</span>
                <span v-if="showRowStatus" class="ruchnik-list-head-status">Статус</span>
                <span v-if="canManage" class="ruchnik-list-head-actions"></span>
              </div>
              <div class="ruchnik-list-body">
              <div
                v-for="item in items"
                :key="item.id"
                class="ruchnik-row"
                :title="getRowTooltip(item)"
              >
                <div class="ruchnik-row-main">
                  <span class="ruchnik-row-code">{{ item.code }}</span>
                  <span class="ruchnik-row-agent">{{ formatRowAgent(item) }}</span>
                </div>
                <span
                  v-if="showRowStatus"
                  class="status-indicator ruchnik-row-status"
                  :class="{
                    'status-confirmed': getStatus(item) === 'confirmed',
                    'status-pending': getStatus(item) === 'pending',
                    'status-not-confirmed': getStatus(item) === 'rejected',
                  }"
                >
                  <span class="status-text-full">{{ getStatusText(item) }}</span>
                  <span class="status-text-short">{{ getStatusTextShort(item) }}</span>
                </span>
                <div v-if="canManage" class="ruchnik-row-actions">
                  <button
                    type="button"
                    class="ruchnik-edit-btn"
                    title="Редактировать"
                    :disabled="loading"
                    @click="handleEdit(item)"
                  >
                    <i class="pi pi-pencil" aria-hidden="true"></i>
                  </button>
                  <button
                    type="button"
                    class="ruchnik-remove-btn"
                    title="Удалить"
                    :disabled="loading"
                    @click="handleRemove(item)"
                  >
                    <i class="pi pi-trash" aria-hidden="true"></i>
                  </button>
                </div>
              </div>
              </div>
              <div v-if="showPagination" class="ruchnik-list-footer">
                <div class="pagination-compact">
                  <div class="pagination-info-compact">
                    <span class="page-info-text">{{ currentPage }} / {{ totalPages }}</span>
                    <span class="total-info-text">{{ total }} шт.</span>
                  </div>
                  <div class="pagination-controls-compact">
                    <select
                      v-model.number="localPerPage"
                      class="pagination-select-compact"
                      :disabled="loading"
                      @change="handlePerPageChange"
                    >
                      <option :value="5">5</option>
                      <option :value="10">10</option>
                      <option :value="20">20</option>
                      <option :value="50">50</option>
                    </select>
                    <button
                      type="button"
                      class="page-btn-compact"
                      :disabled="loading || currentPage <= 1"
                      aria-label="Предыдущая страница"
                      @click="handlePageChange(currentPage - 1)"
                    >
                      <i class="pi pi-angle-left" aria-hidden="true"></i>
                    </button>
                    <button
                      type="button"
                      class="page-btn-compact"
                      :disabled="loading || currentPage >= totalPages"
                      aria-label="Следующая страница"
                      @click="handlePageChange(currentPage + 1)"
                    >
                      <i class="pi pi-angle-right" aria-hidden="true"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="ruchnik-empty">
              <div class="ruchnik-empty-text">Нет заявок</div>
              <div class="ruchnik-empty-subtext">ID заявок не найдены</div>
            </div>

            <div
              v-if="loading && items.length"
              class="ruchnik-loading-overlay"
              role="status"
              aria-live="polite"
            >
              <span class="loader"></span>
              <span>Обновление списка…</span>
            </div>
          </template>
        </div>
      </div>

      <Teleport to="body" :disabled="!fullPage">
        <div
          v-if="drawerOpen"
          class="ruchnik-drawer-overlay"
          :class="{ 'ruchnik-drawer-overlay--full-page': fullPage }"
          @click.self="closeDrawerIfAllowed"
        >
          <aside class="ruchnik-drawer" role="dialog" :aria-label="drawerTitle">
          <div class="ruchnik-drawer-body">
            <template v-if="drawerMode === 'add'">
              <div class="bulk-agents-section bulk-agents-section--mode">
                <span class="bulk-agents-label">Режим добавления</span>
                <div class="bulk-agents-modes" role="tablist" aria-label="Режим добавления">
                  <label
                    class="bulk-agents-mode-option"
                    :class="{ 'bulk-agents-mode-option--active': addMode === 'single' }"
                    role="tab"
                    :aria-selected="addMode === 'single'"
                  >
                    <input
                      v-model="addMode"
                      type="radio"
                      name="ruchnik-add-mode"
                      value="single"
                      :disabled="drawerBusy"
                    />
                    <i class="pi pi-tag bulk-agents-mode-icon" aria-hidden="true"></i>
                    <span class="bulk-agents-mode-text">Один ID</span>
                  </label>
                  <label
                    class="bulk-agents-mode-option"
                    :class="{ 'bulk-agents-mode-option--active': addMode === 'bulk' }"
                    role="tab"
                    :aria-selected="addMode === 'bulk'"
                  >
                    <input
                      v-model="addMode"
                      type="radio"
                      name="ruchnik-add-mode"
                      value="bulk"
                      :disabled="drawerBusy"
                    />
                    <i class="pi pi-list bulk-agents-mode-icon" aria-hidden="true"></i>
                    <span class="bulk-agents-mode-text">Массово</span>
                  </label>
                </div>
              </div>

              <div class="bulk-agents-section">
                <span class="bulk-agents-label">Тип ручника</span>
                <div v-if="singleRuchnikType" class="ruchnik-chip-static">
                  <Chip :label="singleRuchnikTypeDisplay" selected />
                </div>
                <BaseSelect
                  v-else
                  v-model="drawerTypeSlug"
                  class="ruchnik-select"
                  :options="typeSelectOptions"
                  option-label="name"
                  option-value="id"
                  placeholder="Выберите тип"
                  :searchable="true"
                  :disabled="typesLoading || drawerBusy"
                  :loading="typesLoading"
                />
              </div>

              <div class="bulk-agents-section">
                <span class="bulk-agents-label">Агент-получатель</span>
                <BaseSelect
                  v-model="drawerUserId"
                  class="ruchnik-select"
                  :options="agentSelectOptions"
                  option-label="name"
                  option-value="id"
                  placeholder="Выберите агента"
                  :searchable="true"
                  :disabled="agentsLoading || drawerBusy"
                  :loading="agentsLoading"
                />
              </div>

              <div v-if="addMode === 'single'" class="bulk-agents-section">
                <label class="bulk-agents-label" for="ruchnik-drawer-code">Код заявки</label>
                <input
                  id="ruchnik-drawer-code"
                  v-model="newRuchnikCode"
                  type="text"
                  class="ruchnik-drawer-input"
                  :class="{ 'ruchnik-drawer-input--conflict': !!singleCodeConflict }"
                  :placeholder="drawerCodeInputAllowed ? 'Введите код...' : 'Сначала выберите тип'"
                  :readonly="!drawerCodeInputAllowed"
                  :disabled="drawerBusy"
                  @focus="onDrawerCodeFocus"
                  @input="onDrawerCodeInput"
                />
                <div
                  v-if="singleCodeLookupLoading"
                  class="ruchnik-code-conflict ruchnik-code-conflict--loading"
                  role="status"
                >
                  <span class="loader"></span>
                  <span>Проверяем ID…</span>
                </div>
                <div
                  v-else-if="singleCodeConflict"
                  class="ruchnik-code-conflict"
                  :class="{
                    'ruchnik-code-conflict--same': isSameAgentConflict,
                    'ruchnik-code-conflict--replace': !isSameAgentConflict,
                  }"
                >
                  <div class="ruchnik-code-conflict-icon" aria-hidden="true">
                    <i :class="isSameAgentConflict ? 'pi pi-check-circle' : 'pi pi-arrows-h'"></i>
                  </div>
                  <div class="ruchnik-code-conflict-body">
                    <p class="ruchnik-code-conflict-title">
                      {{ isSameAgentConflict ? "Уже назначен этому агенту" : "ID уже назначен другому агенту" }}
                    </p>
                    <p class="ruchnik-code-conflict-text">
                      <span class="ruchnik-code-conflict-code">{{ singleCodeConflict.code }}</span>
                      <span class="ruchnik-code-conflict-arrow" aria-hidden="true">→</span>
                      <span class="ruchnik-code-conflict-agent">{{ singleCodeConflict.agentName }}</span>
                    </p>
                    <p v-if="!isSameAgentConflict && selectedDrawerAgentName" class="ruchnik-code-conflict-hint">
                      Можно перенести на <strong>{{ selectedDrawerAgentName }}</strong>
                    </p>
                  </div>
                </div>
              </div>

              <template v-else>
                <div class="bulk-agents-section">
                  <label class="bulk-agents-label" for="ruchnik-bulk-codes">ID заявок</label>
                  <div class="ruchnik-drawer-textarea-wrap">
                    <textarea
                      id="ruchnik-bulk-codes"
                      v-model="bulkCodesText"
                      class="ruchnik-drawer-textarea"
                      rows="10"
                      placeholder="Вставьте ID — по одному на строку или через запятую"
                      :disabled="drawerBusy"
                    />
                  </div>
                  <div class="bulk-agents-meta">
                    <span>Распознано: {{ parsedBulkCodes.valid.length }}</span>
                    <span v-if="parsedBulkCodes.invalid.length > 0" class="ruchnik-bulk-meta--warn">
                      Некорректных: {{ parsedBulkCodes.invalid.length }}
                    </span>
                  </div>
                  <details v-if="parsedBulkCodes.invalid.length > 0" class="ruchnik-bulk-invalid">
                    <summary>Некорректные коды</summary>
                    <ul>
                      <li v-for="code in parsedBulkCodes.invalid" :key="code">{{ code }}</li>
                    </ul>
                  </details>
                </div>
              </template>
            </template>

            <template v-else-if="drawerMode === 'edit'">
              <div class="bulk-agents-section">
                <span class="bulk-agents-label">Тип ручника</span>
                <div v-if="singleRuchnikType" class="ruchnik-chip-static">
                  <Chip :label="singleRuchnikTypeDisplay" selected />
                </div>
                <BaseSelect
                  v-else
                  v-model="editRuchnikTypeSlug"
                  class="ruchnik-select"
                  :options="typeSelectOptions"
                  option-label="name"
                  option-value="id"
                  placeholder="Выберите тип"
                  :searchable="true"
                  :disabled="typesLoading || editLoading"
                  :loading="typesLoading"
                />
              </div>

              <div class="bulk-agents-section">
                <span class="bulk-agents-label">Агент</span>
                <BaseSelect
                  v-model="editUserId"
                  class="ruchnik-select"
                  :options="agentSelectOptions"
                  option-label="name"
                  option-value="id"
                  placeholder="Выберите агента"
                  :searchable="true"
                  :disabled="agentsLoading || editLoading"
                  :loading="agentsLoading"
                />
              </div>

              <div class="bulk-agents-section">
                <label class="bulk-agents-label" for="ruchnik-edit-code">Код заявки</label>
                <input
                  id="ruchnik-edit-code"
                  v-model="editCode"
                  type="text"
                  class="ruchnik-drawer-input"
                  :placeholder="editCodeInputAllowed ? 'Введите код...' : 'Сначала выберите тип'"
                  :readonly="!editCodeInputAllowed"
                  :disabled="editLoading"
                  @focus="onEditCodeFocus"
                  @input="onEditCodeInput"
                />
              </div>
            </template>
          </div>

          <footer class="ruchnik-drawer-footer">
            <div class="form-actions">
              <button
                type="button"
                class="ruchnik-cancel-btn"
                :disabled="drawerBusy"
                @click="closeDrawerIfAllowed"
              >
                Отмена
              </button>
              <button
                v-if="drawerMode === 'add' && addMode === 'single'"
                type="button"
                class="ruchnik-add-btn ruchnik-drawer-submit"
                :class="{ 'ruchnik-add-btn--reassign': singleCodeConflict && !isSameAgentConflict }"
                :disabled="!canSubmitSingleAdd"
                @click="handleAdd"
              >
                <span v-if="addLoading || bulkLoading" class="loader"></span>
                <span v-else-if="isSameAgentConflict">Уже назначен</span>
                <span v-else-if="singleCodeConflict">Перенести</span>
                <span v-else>Добавить</span>
              </button>
              <button
                v-else-if="drawerMode === 'add' && addMode === 'bulk'"
                type="button"
                class="ruchnik-add-btn ruchnik-drawer-submit"
                :disabled="!canSubmitBulk || bulkLoading || addLoading"
                @click="handleBulkAssign"
              >
                <span v-if="bulkLoading" class="loader"></span>
                <span v-else>Перенести {{ parsedBulkCodes.valid.length }} ID</span>
              </button>
              <button
                v-else-if="drawerMode === 'edit'"
                type="button"
                class="ruchnik-add-btn ruchnik-drawer-submit"
                :disabled="!editCode.trim() || editLoading"
                @click="saveEdit"
              >
                <span v-if="editLoading" class="loader"></span>
                <span v-else>Сохранить</span>
              </button>
            </div>
          </footer>
          </aside>
        </div>
      </Teleport>

      <Teleport to="body">
        <button
          v-if="fullPage && canManage"
          type="button"
          class="ruchnik-fab"
          aria-label="Добавить ID заявок"
          :disabled="loading || drawerOpen"
          @click="openAddDrawer"
        >
          <i class="pi pi-plus" aria-hidden="true"></i>
        </button>
      </Teleport>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useAppOverlayBinding } from "bibli/shared/composables/useAppOverlayBinding";
import { useToast } from "bibli/shared/ui";
import { Chip, BaseSelect } from "@/shared/ui";

export interface RuchnikType {
  id: number;
  name?: string;
  slug?: string;
  [key: string]: unknown;
}

interface Ruchnik {
  id: number;
  code: string;
  user_id?: number;
  date_match: boolean;
  created_at: string;
  updated_at: string;
  ruchnik_type?: RuchnikType | null;
  report?: {
    id: number;
    code: string;
    fio: string;
    type: string;
    date: string;
  } | null;
  user?: {
    id: number;
    name: string;
    surname: string;
    patronymic: string | null;
  };
}

interface Agent {
  id: number;
  name: string;
  surname: string;
  patronymic: string | null;
  email: string | null;
  phone: string;
  role_id: number;
  is_attached: boolean;
}

export type GetAgentsFn = () => Promise<Agent[]>;
export type UpdateRuchnikFn = (
  id: number,
  code: string,
  userId?: number,
  _pointId?: unknown,
  typeSlug?: string
) => Promise<void>;

export type FindRuchnikByCodeFn = (
  code: string,
  typeSlug?: string | null
) => Promise<Ruchnik | null>;

interface Props {
  items: Ruchnik[];
  getAgents: GetAgentsFn;
  updateRuchnik: UpdateRuchnikFn;
  findRuchnikByCode?: FindRuchnikByCodeFn;
  loading?: boolean;
  canManage?: boolean;
  searchQuery?: string;
  addLoading?: boolean;
  bulkLoading?: boolean;
  showReportDetails?: boolean;
  showPagination?: boolean;
  currentPage?: number;
  totalPages?: number;
  total?: number;
  perPage?: number;
  ruchnikTypes?: RuchnikType[];
  selectedType?: string | null;
  typesLoading?: boolean;
  selectedUserId?: number | null;
  embedInModal?: boolean;
  /** Полноэкранная страница — mobile-first: FAB, bottom sheet, сворачиваемые фильтры. */
  fullPage?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  canManage: false,
  searchQuery: "",
  addLoading: false,
  bulkLoading: false,
  showReportDetails: false,
  showPagination: false,
  currentPage: 1,
  totalPages: 1,
  total: 0,
  perPage: 10,
  ruchnikTypes: () => [],
  selectedType: null,
  typesLoading: false,
  selectedUserId: null,
  embedInModal: false,
  fullPage: false,
});

const emit = defineEmits([
  "add",
  "bulk-assign",
  "remove",
  "edit",
  "search",
  "update",
  "page-change",
  "per-page-change",
  "type-change",
  "user-change",
]);

type DrawerMode = null | "add" | "edit";

const drawerMode = ref<DrawerMode>(null);
const addMode = ref<"single" | "bulk">("single");
const newRuchnikCode = ref("");
const singleCodeConflict = ref<{
  id: number;
  code: string;
  userId: number;
  agentName: string;
} | null>(null);
const singleCodeLookupLoading = ref(false);
let singleCodeLookupTimer: ReturnType<typeof setTimeout> | null = null;
let singleCodeLookupRequestId = 0;
const bulkCodesText = ref("");
const drawerUserId = ref<number | null>(null);
const drawerTypeSlug = ref<string | null>(props.selectedType || null);
const editingRuchnik = ref<Ruchnik | null>(null);
const localSearchQuery = ref(props.searchQuery || "");
const localSelectedType = ref<string | null>(props.selectedType || null);
const localSelectedUserId = ref<number | null>(props.selectedUserId || null);
const agents = ref<Agent[]>([]);
const agentsLoading = ref(false);
const editCode = ref("");
const editUserId = ref<number | null>(null);
const editRuchnikTypeSlug = ref<string | null>(null);
const editLoading = ref(false);
const toast = useToast();
const localPerPage = ref(props.perPage);

const drawerOpen = computed(() => drawerMode.value !== null);
useAppOverlayBinding(() => drawerOpen.value && props.fullPage);
const drawerBusy = computed(
  () => props.addLoading || props.bulkLoading || editLoading.value
);
/** Временно скрыт бейдж статуса в строке списка. */
const showRowStatus = false;

const mobileFiltersOpen = ref(false);
const showMobileFilterToggle = computed(
  () =>
    props.fullPage &&
    (showTypeFilterSelect.value || props.canManage || !!singleRuchnikType.value)
);

const drawerTitle = computed(() => {
  if (drawerMode.value === "edit" && editingRuchnik.value) {
    return `Редактирование · ${editingRuchnik.value.code}`;
  }
  if (drawerMode.value === "add") {
    return "Добавить ID заявок";
  }
  return "";
});

const typeOptions = computed(() => props.ruchnikTypes || []);
const showTypeFilterSelect = computed(() => typeOptions.value.length !== 1);
const singleRuchnikType = computed(() =>
  typeOptions.value.length === 1 ? typeOptions.value[0] : null
);
const singleRuchnikTypeDisplay = computed(() => {
  const t = singleRuchnikType.value;
  if (!t) return "";
  const name = t.name && String(t.name).trim();
  return name || String(t.slug ?? "");
});

const searchRequiresTypeChoice = computed(
  () => showTypeFilterSelect.value && !localSelectedType.value
);

const drawerCodeInputAllowed = computed(() => {
  const types = typeOptions.value;
  if (types.length === 0) return false;
  if (types.length === 1) return true;
  return !!drawerTypeSlug.value;
});

const editCodeInputAllowed = computed(() => {
  const types = typeOptions.value;
  if (types.length === 0) return false;
  if (types.length === 1) return true;
  return !!editRuchnikTypeSlug.value;
});

const typeSelectOptions = computed(() =>
  typeOptions.value.map((t) => ({
    id: t.slug,
    name: (t.name && String(t.name).trim()) || String(t.slug ?? ""),
  }))
);

const sanitizeRuchnikDigits = (value: string, maxLen = 12) =>
  String(value || "").replace(/\D/g, "").slice(0, maxLen);

const formatOtpCode = (digits: string): string => {
  // 6 (дата) + 1 (тип) + до 5 (порядковый) = 12 цифр
  const limited = sanitizeRuchnikDigits(digits, 12);
  const part1 = limited.slice(0, 6);
  const part2 = limited.slice(6, 7);
  const part3 = limited.slice(7, 12);
  let formatted = part1;
  if (part2) formatted += `-${part2}`;
  if (part3) formatted += `-${part3}`;
  return formatted;
};

const formatCodeByType = (raw: string, typeSlug: string | null): string => {
  const slug = (typeSlug || "").toLowerCase();
  if (slug.includes("alfa")) {
    return sanitizeRuchnikDigits(raw, 7);
  }
  if (slug.includes("otp")) {
    return formatOtpCode(raw);
  }
  return String(raw || "").replace(/[^0-9-]/g, "");
};

const resolveTypeSlug = (
  explicitSlug: string | null | undefined,
  fallbackSlug: string | null | undefined = props.selectedType
): string | null => {
  if (explicitSlug) return explicitSlug;
  if (singleRuchnikType.value?.slug) return String(singleRuchnikType.value.slug);
  return fallbackSlug ? String(fallbackSlug) : null;
};

const validateRuchnikCodeByType = (value: string, typeSlug: string | null) => {
  const slug = (typeSlug || "").toLowerCase();
  const digits = sanitizeRuchnikDigits(value, slug.includes("alfa") ? 7 : 12);

  if (slug.includes("alfa")) {
    const normalized = digits.slice(0, 7);
    return {
      normalized,
      valid: /^\d{7}$/.test(normalized),
      error: "Для Альфа-Банк введите 7 цифр без разделителей",
    };
  }

  if (slug.includes("otp")) {
    const normalized = formatOtpCode(digits);
    return {
      normalized,
      valid: /^\d{6}-\d-\d{2,5}$/.test(normalized),
      error: "Для ОТП используйте формат: 251102-2-26",
    };
  }

  const normalized = String(value || "").trim();
  return {
    normalized,
    valid: normalized.length === 7 || /^\d{6}-\d-\d{2,5}$/.test(normalized),
    error: "Введите 7 цифр (Альфа) или формат ОТП: 251102-2-26",
  };
};

const parseBulkCodes = (text: string, typeSlug: string | null) => {
  const parts = text
    .split(/[\s,;]+/)
    .map((part) => part.trim())
    .filter(Boolean);

  const valid: string[] = [];
  const invalid: string[] = [];
  const seen = new Set<string>();

  for (const part of parts) {
    const result = validateRuchnikCodeByType(part, typeSlug);
    if (result.valid && result.normalized) {
      if (!seen.has(result.normalized)) {
        seen.add(result.normalized);
        valid.push(result.normalized);
      }
      continue;
    }
    invalid.push(part);
  }

  return { valid, invalid };
};

const parsedBulkCodes = computed(() =>
  parseBulkCodes(bulkCodesText.value, resolveTypeSlug(drawerTypeSlug.value))
);

const bulkInputAllowed = computed(() => {
  const types = typeOptions.value;
  if (types.length === 0) return false;
  if (types.length === 1) return true;
  return !!drawerTypeSlug.value;
});

const canSubmitBulk = computed(
  () =>
    bulkInputAllowed.value &&
    !!drawerUserId.value &&
    parsedBulkCodes.value.valid.length > 0
);

const selectedDrawerAgentName = computed(() => {
  if (!drawerUserId.value) return "";
  const agent = agentSelectOptions.value.find((item) => item.id === drawerUserId.value);
  return agent?.name || `Агент #${drawerUserId.value}`;
});

const isSameAgentConflict = computed(
  () =>
    !!singleCodeConflict.value &&
    !!drawerUserId.value &&
    singleCodeConflict.value.userId === drawerUserId.value
);

const canSubmitSingleAdd = computed(() => {
  if (!newRuchnikCode.value.trim() || props.addLoading || props.bulkLoading) return false;
  if (singleCodeLookupLoading.value) return false;
  if (isSameAgentConflict.value) return false;
  if (singleCodeConflict.value && !drawerUserId.value) return false;
  return true;
});

const findLocalRuchnikByCode = (normalizedCode: string) =>
  props.items.find((item) => item.code === normalizedCode);

const scheduleSingleCodeLookup = () => {
  if (singleCodeLookupTimer) clearTimeout(singleCodeLookupTimer);
  singleCodeLookupTimer = setTimeout(() => {
    void lookupSingleCodeConflict();
  }, 400);
};

const lookupSingleCodeConflict = async () => {
  const typeSlug = resolveTypeSlug(drawerTypeSlug.value);
  const raw = newRuchnikCode.value.trim();

  if (!raw || addMode.value !== "single" || drawerMode.value !== "add") {
    singleCodeConflict.value = null;
    singleCodeLookupLoading.value = false;
    return;
  }

  const validation = validateRuchnikCodeByType(raw, typeSlug);
  if (!validation.valid) {
    singleCodeConflict.value = null;
    singleCodeLookupLoading.value = false;
    return;
  }

  const normalized = validation.normalized;
  const requestId = ++singleCodeLookupRequestId;

  let found = findLocalRuchnikByCode(normalized);

  if (props.findRuchnikByCode) {
    singleCodeLookupLoading.value = true;
    try {
      const remote = await props.findRuchnikByCode(normalized, typeSlug);
      if (requestId !== singleCodeLookupRequestId) return;
      if (remote) {
        found = remote;
      } else if (!findLocalRuchnikByCode(normalized)) {
        found = undefined;
      }
    } catch {
      if (requestId !== singleCodeLookupRequestId) return;
      found = findLocalRuchnikByCode(normalized);
    } finally {
      if (requestId === singleCodeLookupRequestId) {
        singleCodeLookupLoading.value = false;
      }
    }
  }

  if (requestId !== singleCodeLookupRequestId) return;

  if (!found?.user_id) {
    singleCodeConflict.value = null;
    return;
  }

  singleCodeConflict.value = {
    id: found.id,
    code: found.code,
    userId: found.user_id,
    agentName: formatRowAgent(found),
  };
};

const sanitizeRuchnikValue = (value: string) => value.replace(/[^0-9-]/g, "");

const getStatus = (item: Ruchnik): "confirmed" | "pending" | "rejected" => {
  const hasReport = !!item.report;
  if (hasReport) return "confirmed";
  if (item.date_match === true) return "pending";
  return "rejected";
};

const getStatusText = (item: Ruchnik): string => {
  const s = getStatus(item);
  if (s === "confirmed") return "Подтверждено";
  if (s === "pending") return "Ожидает";
  return "Не подтверждено";
};

const getStatusTextShort = (item: Ruchnik): string => {
  const s = getStatus(item);
  if (s === "confirmed") return "OK";
  if (s === "pending") return "Ждёт";
  return "Нет";
};

const formatReportDate = (dateStr: string) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr.replace(" ", "T"));
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleString();
};

const formatFio = (fio: string) => {
  if (!fio || typeof fio !== "string") return "—";
  const parts = fio
    .split(" ")
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0) return "—";
  const surname = parts[0];
  const nameInitial = parts[1] ? parts[1].charAt(0) + "." : "";
  const patronymicInitial = parts[2] ? parts[2].charAt(0) + "." : "";
  return `${surname} ${nameInitial}${patronymicInitial}`.trim();
};

const formatUser = (user: { surname: string; name: string; patronymic?: string | null }) => {
  if (!user) return "—";
  const surname = user.surname || "";
  const nameInitial = user.name ? user.name.charAt(0) + "." : "";
  const patronymicInitial = user.patronymic ? user.patronymic.charAt(0) + "." : "";
  return `${surname} ${nameInitial}${patronymicInitial}`.trim();
};

const formatRowAgent = (item: Ruchnik) => {
  if (item.user) return formatUser(item.user);
  if (item.report?.fio) return formatFio(item.report.fio);
  return "—";
};

const getRowTooltip = (item: Ruchnik) => {
  const parts: string[] = [];
  if (item.ruchnik_type?.name) parts.push(String(item.ruchnik_type.name));
  if (item.report?.type !== undefined && item.report?.type !== null) {
    parts.push(item.report.type === "" ? "Пустая" : item.report.type);
  }
  if (item.report?.date) parts.push(formatReportDate(item.report.date));
  return parts.length ? parts.join(" · ") : "";
};

const agentOptions = computed(() =>
  agents.value.map((agent) => {
    const fullName = [agent.surname, agent.name, agent.patronymic].filter(Boolean).join(" ");
    return {
      ...agent,
      name: fullName || `Агент #${agent.id}`,
    };
  })
);

const agentSelectOptions = computed(() =>
  agentOptions.value.map((a) => ({ id: a.id, name: a.name }))
);

function onToolbarTypeChange(value: string | null) {
  const normalized = value || null;
  localSelectedType.value = normalized;
  emit("type-change", normalized);
}

function onToolbarAgentChange(value: number | null) {
  const normalized = value ?? null;
  localSelectedUserId.value = normalized;
  emit("user-change", normalized);
}

function onSearchInput() {
  const slug = localSelectedType.value;
  const formatted = slug
    ? formatCodeByType(localSearchQuery.value, slug)
    : sanitizeRuchnikValue(localSearchQuery.value);
  if (formatted !== localSearchQuery.value) {
    localSearchQuery.value = formatted;
  }
  emit("search", localSearchQuery.value);
  emit("page-change", 1);
}

function onSearchFilterInputFocus(e: FocusEvent) {
  if (!searchRequiresTypeChoice.value) return;
  e.preventDefault();
  (e.target as HTMLInputElement).blur();
}

function onDrawerCodeFocus(e: FocusEvent) {
  if (drawerCodeInputAllowed.value) return;
  e.preventDefault();
  (e.target as HTMLInputElement).blur();
}

function onEditCodeFocus(e: FocusEvent) {
  if (editCodeInputAllowed.value) return;
  e.preventDefault();
  (e.target as HTMLInputElement).blur();
}

function onDrawerCodeInput() {
  const slug = resolveTypeSlug(drawerTypeSlug.value);
  const next = slug
    ? formatCodeByType(newRuchnikCode.value, slug)
    : sanitizeRuchnikValue(newRuchnikCode.value);
  if (next !== newRuchnikCode.value) newRuchnikCode.value = next;
}

function onEditCodeInput() {
  const slug = resolveTypeSlug(editRuchnikTypeSlug.value);
  const next = slug
    ? formatCodeByType(editCode.value, slug)
    : sanitizeRuchnikValue(editCode.value);
  if (next !== editCode.value) editCode.value = next;
}

function resetFilters() {
  localSearchQuery.value = "";
  emit("search", "");
  if (props.canManage) {
    localSelectedUserId.value = null;
    emit("user-change", null);
  }
  if (showTypeFilterSelect.value) {
    localSelectedType.value = null;
    emit("type-change", null);
  }
  emit("page-change", 1);
}

const hasActiveFilters = computed(() => {
  const search = !!localSearchQuery.value;
  const user = !!localSelectedUserId.value;
  const typeChosen = showTypeFilterSelect.value && !!localSelectedType.value;
  return search || user || typeChosen;
});

const activeFilterFieldsCount = computed(() => {
  let count = 0;
  if (localSelectedUserId.value) count += 1;
  if (showTypeFilterSelect.value && localSelectedType.value) count += 1;
  return count;
});

const filtersButtonAriaLabel = computed(() => {
  const count = activeFilterFieldsCount.value;
  return count > 0 ? `Фильтры, активно: ${count}` : "Фильтры";
});

const filtersButtonActive = computed(() => activeFilterFieldsCount.value > 0);

watch(
  activeFilterFieldsCount,
  (count) => {
    if (count > 0) mobileFiltersOpen.value = true;
  },
  { immediate: true }
);

function openAddDrawer() {
  drawerMode.value = "add";
  addMode.value = "single";
  drawerTypeSlug.value =
    localSelectedType.value ||
    (singleRuchnikType.value?.slug ? String(singleRuchnikType.value.slug) : null) ||
    props.selectedType ||
    null;
  drawerUserId.value = localSelectedUserId.value;
  singleCodeConflict.value = null;
  singleCodeLookupLoading.value = false;
  loadAgents();
}

function closeDrawer() {
  drawerMode.value = null;
  editingRuchnik.value = null;
  editCode.value = "";
  editUserId.value = null;
  editRuchnikTypeSlug.value = null;
  newRuchnikCode.value = "";
  singleCodeConflict.value = null;
  singleCodeLookupLoading.value = false;
  if (singleCodeLookupTimer) {
    clearTimeout(singleCodeLookupTimer);
    singleCodeLookupTimer = null;
  }
}

function closeDrawerIfAllowed() {
  if (drawerBusy.value) return;
  closeDrawer();
}

const handleReassignSingle = () => {
  const typeSlug = resolveTypeSlug(drawerTypeSlug.value);
  if (!typeSlug || !drawerUserId.value || !singleCodeConflict.value) return;

  const validation = validateRuchnikCodeByType(newRuchnikCode.value.trim(), typeSlug);
  if (!validation.valid) return;

  emit("bulk-assign", {
    codes: [validation.normalized],
    userId: drawerUserId.value,
    ruchnikTypeSlug: typeSlug,
    agentName: selectedDrawerAgentName.value,
    previousAgentName: singleCodeConflict.value.agentName,
  });
};

const handleAdd = () => {
  if (!newRuchnikCode.value.trim()) return;
  if (singleCodeConflict.value && !isSameAgentConflict.value) {
    handleReassignSingle();
    return;
  }
  emit("add", {
    code: newRuchnikCode.value.trim(),
    userId: drawerUserId.value || undefined,
    ruchnikTypeSlug: resolveTypeSlug(drawerTypeSlug.value) || undefined,
  });
};

const handleBulkAssign = () => {
  const typeSlug = resolveTypeSlug(drawerTypeSlug.value);
  const { valid } = parseBulkCodes(bulkCodesText.value, typeSlug);

  if (!typeSlug) {
    toast.add({
      severity: "warn",
      summary: "Тип ручника не выбран",
      detail: "Сначала выберите тип ручника",
      life: 3000,
    });
    return;
  }

  if (!drawerUserId.value) {
    toast.add({
      severity: "warn",
      summary: "Агент не выбран",
      detail: "Выберите агента для назначения",
      life: 3000,
    });
    return;
  }

  if (valid.length === 0) {
    toast.add({
      severity: "warn",
      summary: "Нет кодов",
      detail: "Вставьте корректные ID заявок",
      life: 3000,
    });
    return;
  }

  emit("bulk-assign", {
    codes: valid,
    userId: drawerUserId.value,
    ruchnikTypeSlug: typeSlug,
    agentName: selectedDrawerAgentName.value,
  });
};

const handleRemove = (ruchnik: Ruchnik) => {
  emit("remove", ruchnik.id);
};

const handleEdit = (ruchnik: Ruchnik) => {
  editingRuchnik.value = ruchnik;
  editCode.value = ruchnik.code;
  editUserId.value = ruchnik.user_id || null;
  editRuchnikTypeSlug.value = ruchnik.ruchnik_type?.slug || null;
  drawerMode.value = "edit";
  emit("edit", ruchnik);
  loadAgents();
};

const loadAgents = async () => {
  if (agentsLoading.value) return;
  agentsLoading.value = true;
  try {
    agents.value = await props.getAgents();
  } catch (error) {
    console.error("Ошибка загрузки агентов:", error);
    toast.add({
      severity: "error",
      summary: "Ошибка",
      detail: "Не удалось загрузить список агентов",
      life: 3000,
    });
  } finally {
    agentsLoading.value = false;
  }
};

const saveEdit = async () => {
  if (!editingRuchnik.value || !editCode.value.trim()) return;

  editLoading.value = true;
  try {
    await props.updateRuchnik(
      editingRuchnik.value.id,
      editCode.value,
      editUserId.value || undefined,
      undefined,
      editRuchnikTypeSlug.value || undefined
    );

    toast.add({
      severity: "success",
      summary: "Успешно",
      detail: "ID заявки обновлено",
      life: 3000,
    });

    const updatedRuchnik = {
      ...editingRuchnik.value,
      code: editCode.value,
      user_id: editUserId.value || undefined,
      ruchnik_type: editRuchnikTypeSlug.value
        ? typeOptions.value.find((type) => type.slug === editRuchnikTypeSlug.value) || null
        : null,
    };
    emit("update", updatedRuchnik);
    closeDrawer();
  } catch (error) {
    console.error("Ошибка сохранения:", error);
    toast.add({
      severity: "error",
      summary: "Ошибка",
      detail: "Не удалось сохранить",
      life: 3000,
    });
  } finally {
    editLoading.value = false;
  }
};

const handlePageChange = (page: number) => {
  if (page >= 1 && page <= props.totalPages) {
    emit("page-change", page);
  }
};

const handlePerPageChange = () => {
  emit("per-page-change", localPerPage.value);
};

watch(
  () => props.searchQuery,
  (newValue) => {
    localSearchQuery.value = newValue || "";
  }
);

watch(
  () => props.perPage,
  (newValue) => {
    localPerPage.value = newValue;
  }
);

watch(
  () => [props.ruchnikTypes, props.selectedType] as const,
  ([types, selected]) => {
    const opts = types || [];
    if (opts.length === 1) {
      const slug = opts[0]?.slug;
      if (slug != null && slug !== "") {
        if (localSelectedType.value !== slug) {
          localSelectedType.value = slug;
          emit("type-change", slug);
        }
        if (!drawerTypeSlug.value) {
          drawerTypeSlug.value = slug;
        }
      }
      return;
    }
    localSelectedType.value = selected || null;
    if (!drawerTypeSlug.value) {
      drawerTypeSlug.value = selected || null;
    }
  },
  { deep: true, immediate: true }
);

watch(
  () => props.selectedUserId,
  (newValue) => {
    localSelectedUserId.value = newValue || null;
  }
);

watch(
  () => props.selectedType,
  (newValue) => {
    if (!drawerTypeSlug.value) {
      drawerTypeSlug.value = newValue || null;
    }
  }
);

watch(localSelectedType, (slug) => {
  const q = localSearchQuery.value;
  if (!q) return;
  const next = slug ? formatCodeByType(q, slug) : sanitizeRuchnikValue(q);
  if (next !== q) {
    localSearchQuery.value = next;
    emit("search", next);
  }
});

watch(
  [newRuchnikCode, drawerTypeSlug, drawerUserId, addMode, drawerMode],
  () => {
    scheduleSingleCodeLookup();
  }
);

watch(drawerTypeSlug, (slug) => {
  const q = newRuchnikCode.value;
  if (!q) return;
  const next = slug ? formatCodeByType(q, slug) : sanitizeRuchnikValue(q);
  if (next !== q) newRuchnikCode.value = next;
});

watch(editRuchnikTypeSlug, (slug) => {
  if (drawerMode.value !== "edit") return;
  const q = editCode.value;
  if (!q) return;
  const next = slug ? formatCodeByType(q, slug) : sanitizeRuchnikValue(q);
  if (next !== q) editCode.value = next;
});

onMounted(() => {
  if (props.canManage) loadAgents();
});

watch(
  () => props.canManage,
  (canManage) => {
    if (canManage && agents.value.length === 0) loadAgents();
  },
  { immediate: true }
);

const resetBulkForm = () => {
  bulkCodesText.value = "";
};

defineExpose({ resetBulkForm, closeDrawer });
</script>

<style scoped>
.ruchnik-block {
  --ruchnik-list-viewport-min: 280px;
  --ruchnik-toolbar-control-height: 36px;
  --base-select-height: 40px;
  --base-select-radius: 10px;
  width: 100%;
  max-height: 650px;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.ruchnik-block--modal-embed {
  flex: 1 1 0%;
  min-height: 0;
  max-height: none;
  overflow: hidden;
}

.ruchnik-block--modal-embed .ruchnik-list-area {
  flex: 1 1 0%;
  min-height: 0;
}

.ruchnik-block--modal-embed .ruchnik-list {
  flex: 1 1 0%;
  min-height: 0;
}

.ruchnik-block--modal-embed .ruchnik-list-body {
  flex: 1 1 0%;
  min-height: 0;
  overflow-y: auto;
}

.ruchnik-main {
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 1 1 0%;
  min-height: 0;
  overflow: hidden;
}

.ruchnik-section-title {
  flex-shrink: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--russ-text-primary);
  margin: 0 0 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--russ-border);
}

.ruchnik-toolbar {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 0;
  flex-shrink: 0;
}

.ruchnik-toolbar-leading {
  display: none;
}

.ruchnik-toolbar-controls {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
  width: 100%;
}

.ruchnik-toolbar-controls-top {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  width: 100%;
}

.ruchnik-toolbar-search {
  flex: 1 1 0;
  min-width: 0;
}

.ruchnik-toolbar-filters {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 10px 12px;
  min-width: 0;
  width: 100%;
}

.ruchnik-toolbar-filters-btn {
  display: none;
}

.ruchnik-filter-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.ruchnik-filter-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--russ-text-tertiary);
  line-height: 1.2;
}

.ruchnik-filter-label--spacer {
  visibility: hidden;
  user-select: none;
}

.ruchnik-filter-item--reset {
  flex-shrink: 0;
}

.ruchnik-toolbar-field {
  width: 100%;
  min-width: 0;
}

.ruchnik-toolbar-type {
  flex: 0 0 auto;
}

.ruchnik-toolbar-reset-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: var(--ruchnik-toolbar-control-height);
  padding: 0 12px;
  border: 1px solid var(--russ-border);
  border-radius: 10px;
  background: var(--russ-bg-secondary);
  color: var(--russ-text-secondary);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
}

.ruchnik-toolbar-reset-btn:hover {
  background: var(--russ-bg-hover);
  color: var(--russ-text-primary);
}

.ruchnik-toolbar-input {
  width: 100%;
  height: var(--ruchnik-toolbar-control-height);
  padding: 0 12px;
  border: 1px solid var(--russ-border);
  border-radius: 10px;
  font-size: 14px;
  color: var(--russ-text-primary);
  background: var(--russ-bg-secondary);
  box-sizing: border-box;
  -webkit-appearance: none;
  appearance: none;
}

.ruchnik-toolbar-input:focus {
  outline: none;
  border-color: var(--russ-secondary-dark);
}

.ruchnik-toolbar-add--inline {
  margin-left: auto;
  flex-shrink: 0;
}

/* FAB в Teleport→body: стили только по .ruchnik-fab (без родителя .ruchnik-block) */
.ruchnik-fab {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: fixed;
  right: max(16px, env(safe-area-inset-right, 0px));
  /* над мобильным таббаром, иначе уезжает под меню / home indicator */
  bottom: calc(var(--app-mobile-tabbar-inset, 68px) + 16px);
  z-index: 900;
  width: 56px;
  height: 56px;
  border: none;
  border-radius: 50%;
  background: var(--russ-accent);
  color: var(--russ-text-inverse);
  font-size: 20px;
  cursor: pointer;
  box-shadow: 0 4px 16px var(--russ-shadow-primary);
  touch-action: manipulation;
}

.ruchnik-fab:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.ruchnik-fab:active:not(:disabled) {
  transform: scale(0.96);
}

.ruchnik-select :deep(.base-select-combo) {
  height: var(--base-select-height);
  border-radius: var(--base-select-radius);
  background: var(--russ-bg-secondary);
  border: 1px solid var(--russ-border);
}

.ruchnik-select :deep(.base-select-combo--readonly) {
  background: var(--russ-bg-secondary);
  border: 1px solid var(--russ-border);
}

.ruchnik-toolbar-field.ruchnik-select {
  --base-select-min-height: 0;
  --base-select-padding: 0 36px 0 12px;
  --base-select-font-size: 13px;
}

.ruchnik-toolbar-field.ruchnik-select :deep(.base-select-container) {
  min-height: 0;
  height: auto;
}

.ruchnik-toolbar-field.ruchnik-select :deep(.base-select-combo) {
  height: auto;
  min-height: 0;
  padding-top: 7px;
  padding-bottom: 7px;
  line-height: 1.2;
}

.ruchnik-toolbar-field.ruchnik-select :deep(.base-select-arrow) {
  right: 12px;
  width: 16px;
  height: 16px;
  background-size: 16px;
}

.ruchnik-content {
  flex: 1 1 0%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
  overflow: hidden;
}

.ruchnik-list-area {
  position: relative;
  flex: 0 1 auto;
  min-height: var(--ruchnik-list-viewport-min);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  width: 100%;
}

.ruchnik-list-area--busy .ruchnik-list {
  opacity: 0.55;
}

.ruchnik-loading-overlay {
  position: absolute;
  inset: 0;
  z-index: 3;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  color: var(--russ-text-secondary);
  background: color-mix(in srgb, var(--russ-bg) 92%, transparent);
  pointer-events: none;
}

.ruchnik-loading {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px;
  color: var(--russ-text-primary);
  justify-content: center;
  background: var(--russ-bg-secondary);
  border-radius: 10px;
  border: 1px dashed var(--russ-border-dark);
  flex: 1 1 0%;
  min-height: 0;
  width: 100%;
  box-sizing: border-box;
}

.ruchnik-list {
  display: flex;
  flex-direction: column;
  flex: 0 1 auto;
  min-height: 0;
  width: 100%;
}

.ruchnik-list-head {
  display: none;
}

.ruchnik-list-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 0 1 auto;
  overflow-y: auto;
  min-height: 0;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  scrollbar-color: var(--russ-border-dark) var(--russ-bg-secondary);
}

.ruchnik-list-body::-webkit-scrollbar,
.ruchnik-drawer-body::-webkit-scrollbar {
  width: 8px;
}

.ruchnik-list-body::-webkit-scrollbar-track,
.ruchnik-drawer-body::-webkit-scrollbar-track {
  background: var(--russ-bg-secondary);
  border-radius: 4px;
}

.ruchnik-list-body::-webkit-scrollbar-thumb,
.ruchnik-drawer-body::-webkit-scrollbar-thumb {
  background: var(--russ-border-dark);
  border-radius: 4px;
  border: 2px solid var(--russ-bg-secondary);
}

.ruchnik-list-body::-webkit-scrollbar-thumb:hover,
.ruchnik-drawer-body::-webkit-scrollbar-thumb:hover {
  background: var(--russ-text-tertiary);
}

.ruchnik-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 8px 7px 10px;
  min-height: 40px;
  background: var(--russ-bg-secondary);
  border: 1px solid var(--russ-border);
  border-radius: 8px;
  touch-action: manipulation;
}

.ruchnik-row:hover {
  background: var(--russ-bg-tertiary);
}

.ruchnik-row-main {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.ruchnik-row-code {
  flex: 0 1 auto;
  max-width: 52%;
  font-weight: 600;
  font-size: 13px;
  color: var(--russ-text-primary);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  letter-spacing: -0.01em;
}

.ruchnik-row-agent {
  flex: 1 1 0;
  min-width: 0;
  font-size: 12px;
  color: var(--russ-text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ruchnik-row-agent::before {
  content: "·";
  margin-right: 8px;
  color: var(--russ-border-dark);
  font-weight: 700;
}

.ruchnik-row-status {
  flex-shrink: 0;
}

.ruchnik-row-actions {
  flex-shrink: 0;
  display: flex;
  gap: 4px;
  margin-left: auto;
}

.status-text-short {
  display: none;
}

.status-indicator {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}

.status-confirmed {
  background-color: var(--russ-success-light);
  color: var(--russ-success-text);
  border: 1px solid var(--russ-success-border);
}

.status-pending {
  background-color: var(--russ-warning-light, var(--russ-bg-blue-lighter));
  color: var(--russ-warning-text, var(--russ-accent-dark));
  border: 1px solid var(--russ-warning-border, var(--russ-info-border));
}

.status-not-confirmed {
  background-color: var(--russ-error-light);
  color: var(--russ-error-text);
  border: 1px solid var(--russ-error-light);
}

.ruchnik-edit-btn,
.ruchnik-remove-btn {
  border-radius: 8px;
  padding: 0;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  min-width: 32px;
  min-height: 32px;
  font-size: 13px;
  touch-action: manipulation;
}

.ruchnik-edit-btn {
  background: var(--russ-info-light);
  border: 1px solid var(--russ-info-border);
  color: var(--russ-info-dark);
}

.ruchnik-edit-btn:hover:not(:disabled) {
  background: var(--russ-info-border);
  color: var(--russ-accent-dark);
}

.ruchnik-remove-btn {
  background: var(--russ-error-light);
  border: 1px solid var(--russ-error-light);
  color: var(--russ-error-dark);
}

.ruchnik-remove-btn:hover:not(:disabled) {
  border-color: var(--russ-error);
}

.ruchnik-edit-btn:disabled,
.ruchnik-remove-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.ruchnik-empty {
  text-align: center;
  padding: 40px 20px;
  color: var(--russ-text-muted);
  flex: 1 1 0%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.ruchnik-empty-text {
  font-size: 16px;
  font-weight: 600;
  color: var(--russ-text-secondary);
  margin-bottom: 8px;
}

.ruchnik-empty-subtext {
  font-size: 14px;
  color: var(--russ-text-tertiary);
}

.ruchnik-add-btn {
  background: var(--russ-accent);
  color: var(--russ-text-inverse);
  border: none;
  border-radius: 10px;
  padding: 0 16px;
  height: 40px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: background 0.2s ease;
}

.ruchnik-add-btn:hover:not(:disabled) {
  background: var(--russ-accent-dark);
}

.ruchnik-add-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.ruchnik-cancel-btn {
  background: var(--russ-bg-hover);
  color: var(--russ-text-tertiary);
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.ruchnik-cancel-btn:hover:not(:disabled) {
  background: var(--russ-border);
}

.ruchnik-list-footer {
  flex-shrink: 0;
  padding: 8px 0 0;
  margin-top: 2px;
}

.pagination-compact {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0;
  width: 100%;
}

.pagination-info-compact {
  display: flex;
  gap: 10px;
  font-size: 13px;
  color: var(--russ-text-secondary);
}

.pagination-controls-compact {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pagination-select-compact {
  height: 32px;
  border: 1px solid var(--russ-border);
  border-radius: 8px;
  padding: 0 8px;
  font-size: 13px;
  background: var(--russ-bg-secondary);
  color: var(--russ-text-primary);
}

.page-btn-compact {
  width: 32px;
  height: 32px;
  border: 1px solid var(--russ-border);
  border-radius: 8px;
  background: var(--russ-bg-secondary);
  color: var(--russ-text-secondary);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  touch-action: manipulation;
}

.page-btn-compact:hover:not(:disabled) {
  background: var(--russ-bg-tertiary);
}

.page-btn-compact:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

/* Drawer */
.ruchnik-drawer-overlay {
  position: absolute;
  inset: 0;
  z-index: 10;
  background: color-mix(in srgb, var(--russ-bg) 40%, transparent);
  display: flex;
  justify-content: flex-end;
}

.ruchnik-drawer {
  width: min(380px, 100%);
  height: 100%;
  background: var(--russ-bg);
  border-left: 1px solid var(--russ-border);
  display: flex;
  flex-direction: column;
  box-shadow: -4px 0 24px var(--russ-shadow, rgba(0, 0, 0, 0.08));
}

.ruchnik-drawer-body {
  flex: 1 1 0%;
  min-height: 0;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  scrollbar-color: var(--russ-border-dark) var(--russ-bg-secondary);
}

.ruchnik-drawer-footer {
  flex-shrink: 0;
  padding: 12px 16px;
  border-top: 1px solid var(--russ-border);
}

.bulk-agents-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.bulk-agents-section--mode {
  gap: 8px;
}

.bulk-agents-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--russ-text-primary);
}

.bulk-agents-section--mode .bulk-agents-label {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.01em;
  color: var(--russ-text-secondary);
}

.bulk-agents-modes {
  display: flex;
  width: 100%;
  gap: 4px;
  padding: 4px;
  background: var(--russ-bg-secondary);
  border: 1.5px solid var(--russ-border);
  border-radius: 12px;
  box-sizing: border-box;
}

.bulk-agents-mode-option {
  position: relative;
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: transparent;
  border: none;
  border-radius: 8px;
  padding: 10px 12px;
  min-height: 44px;
  color: var(--russ-text-secondary);
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
  user-select: none;
  transition: background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
}

.bulk-agents-mode-option input {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}

.bulk-agents-mode-icon {
  font-size: 15px;
  line-height: 1;
  flex-shrink: 0;
  opacity: 0.85;
}

.bulk-agents-mode-text {
  line-height: 1.2;
}

.bulk-agents-mode-option:hover:not(.bulk-agents-mode-option--active):not(:has(input:disabled)) {
  color: var(--russ-primary);
  background: var(--russ-bg);
}

.bulk-agents-mode-option--active {
  background: var(--russ-primary);
  color: var(--russ-text-inverse);
  box-shadow: 0 2px 8px var(--russ-shadow-accent-light);
}

.bulk-agents-mode-option--active .bulk-agents-mode-icon {
  opacity: 1;
}

.bulk-agents-mode-option:has(input:disabled) {
  opacity: 0.55;
  cursor: not-allowed;
}

.bulk-agents-meta {
  font-size: 12px;
  color: var(--russ-text-secondary);
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.ruchnik-bulk-meta--warn {
  color: var(--russ-error-dark);
}

.ruchnik-bulk-invalid {
  font-size: 12px;
  color: var(--russ-text-secondary);
}

.ruchnik-bulk-invalid ul {
  margin: 8px 0 0;
  padding-left: 18px;
}

.ruchnik-drawer-body .ruchnik-select {
  --base-select-radius: 10px;
  width: 100%;
}

.ruchnik-drawer-body .ruchnik-select :deep(.base-select-container) {
  border-radius: var(--base-select-radius);
}

.ruchnik-drawer-body .ruchnik-select :deep(.base-select-combo) {
  border: 1px solid var(--russ-border);
  border-radius: var(--base-select-radius);
  background: var(--russ-bg-secondary);
  box-shadow: none;
  font-family: inherit;
}

.ruchnik-drawer-body .ruchnik-select :deep(.base-select-combo:focus) {
  border-color: var(--russ-secondary-dark);
  box-shadow: none;
  background: var(--russ-bg-secondary);
}

.ruchnik-drawer-input {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--russ-border);
  border-radius: 10px;
  font-size: 14px;
  color: var(--russ-text-primary);
  background: var(--russ-bg-secondary);
  box-sizing: border-box;
  font-family: inherit;
}

.ruchnik-drawer-input:focus {
  outline: none;
  border-color: var(--russ-secondary-dark);
}

.ruchnik-drawer-input--conflict {
  border-color: var(--russ-warning-border, var(--russ-info-border));
}

.ruchnik-code-conflict {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid var(--russ-border);
  background: var(--russ-bg-secondary);
}

.ruchnik-code-conflict--loading {
  align-items: center;
  color: var(--russ-text-tertiary);
  font-size: 13px;
}

.ruchnik-code-conflict--replace {
  border-color: var(--russ-info-border);
  background: var(--russ-info-light);
}

.ruchnik-code-conflict--same {
  border-color: var(--russ-success-border);
  background: var(--russ-success-light);
}

.ruchnik-code-conflict-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: var(--russ-bg);
  flex-shrink: 0;
}

.ruchnik-code-conflict--replace .ruchnik-code-conflict-icon {
  color: var(--russ-info-dark);
}

.ruchnik-code-conflict--same .ruchnik-code-conflict-icon {
  color: var(--russ-success-text);
}

.ruchnik-code-conflict-body {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ruchnik-code-conflict-title {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  color: var(--russ-text-primary);
  line-height: 1.3;
}

.ruchnik-code-conflict-text {
  margin: 0;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 13px;
  color: var(--russ-text-secondary);
  line-height: 1.4;
}

.ruchnik-code-conflict-code {
  font-weight: 600;
  color: var(--russ-text-primary);
  font-variant-numeric: tabular-nums;
}

.ruchnik-code-conflict-arrow {
  color: var(--russ-text-tertiary);
  font-weight: 600;
}

.ruchnik-code-conflict-agent {
  font-weight: 600;
  color: var(--russ-text-primary);
}

.ruchnik-code-conflict-hint {
  margin: 0;
  font-size: 12px;
  color: var(--russ-text-tertiary);
  line-height: 1.4;
}

.ruchnik-code-conflict-hint strong {
  color: var(--russ-text-secondary);
  font-weight: 600;
}

.ruchnik-add-btn--reassign {
  background: var(--russ-info-dark, var(--russ-accent));
}

.ruchnik-add-btn--reassign:hover:not(:disabled) {
  background: var(--russ-accent-dark);
}

.ruchnik-drawer-textarea-wrap {
  width: 100%;
  border: 1px solid var(--russ-border);
  border-radius: 10px;
  overflow: hidden;
  background: var(--russ-bg-secondary);
  transition: border-color 0.2s ease;
}

.ruchnik-drawer-textarea-wrap:focus-within {
  border-color: var(--russ-secondary-dark);
}

.ruchnik-drawer-textarea-wrap .ruchnik-drawer-textarea {
  display: block;
  width: 100%;
  min-height: 160px;
  max-height: 280px;
  padding: 12px 4px 12px 12px;
  border: none;
  border-radius: 0;
  font-size: 14px;
  color: var(--russ-text-primary);
  background: transparent;
  box-sizing: border-box;
  font-family: inherit;
  resize: vertical;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  scrollbar-color: var(--russ-border-dark) transparent;
}

.ruchnik-drawer-textarea-wrap .ruchnik-drawer-textarea:focus {
  outline: none;
}

.ruchnik-drawer-textarea-wrap .ruchnik-drawer-textarea::-webkit-scrollbar {
  width: 6px;
}

.ruchnik-drawer-textarea-wrap .ruchnik-drawer-textarea::-webkit-scrollbar-track {
  background: transparent;
  margin: 8px 2px;
}

.ruchnik-drawer-textarea-wrap .ruchnik-drawer-textarea::-webkit-scrollbar-thumb {
  background: var(--russ-border-dark);
  border-radius: 999px;
  border: 1px solid transparent;
  background-clip: padding-box;
}

.ruchnik-drawer-textarea-wrap .ruchnik-drawer-textarea::-webkit-scrollbar-thumb:hover {
  background: var(--russ-text-tertiary);
  background-clip: padding-box;
}

.ruchnik-drawer-textarea-wrap .ruchnik-drawer-textarea:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.ruchnik-chip-static {
  display: inline-flex;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  align-items: center;
}

.ruchnik-drawer-submit {
  min-width: 120px;
  justify-content: center;
}

/* --- Полноэкранная страница --- */
.ruchnik-block--full-page {
  --ruchnik-list-viewport-min: 0;
  max-height: none;
  overflow: visible;
  min-width: 0;
  box-sizing: border-box;
}

.ruchnik-block--full-page .ruchnik-main {
  overflow: visible;
}

.ruchnik-block--full-page .ruchnik-toolbar {
  gap: 0;
  padding: 0;
  background: transparent;
}

.ruchnik-block--full-page .ruchnik-toolbar-leading {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 10px;
  padding: 14px 16px 10px;
}

.ruchnik-block--full-page .ruchnik-toolbar-controls {
  gap: 12px;
  padding: 12px 16px 14px;
  box-sizing: border-box;
  min-width: 0;
  max-width: 100%;
  overflow-x: clip;
}

.ruchnik-block--full-page .ruchnik-toolbar-controls-top {
  gap: 10px;
}

.ruchnik-block--full-page .ruchnik-toolbar-search {
  flex: 1 1 0;
  min-width: 0;
  max-width: none;
}

.ruchnik-block--full-page .ruchnik-toolbar-filters {
  gap: 12px 14px;
}

.ruchnik-block--full-page .ruchnik-filter-item:not(.ruchnik-toolbar-type):not(.ruchnik-filter-item--reset) {
  flex: 0 0 168px;
  width: 168px;
}

.ruchnik-block--full-page .ruchnik-toolbar-field.ruchnik-select {
  --base-select-padding: 0 36px 0 12px;
  --base-select-font-size: 14px;
}

.ruchnik-block--full-page .ruchnik-toolbar-field.ruchnik-select :deep(.base-select-combo) {
  height: var(--ruchnik-toolbar-control-height);
  min-height: var(--ruchnik-toolbar-control-height);
  padding-top: 0;
  padding-bottom: 0;
  border: 1px solid var(--russ-border);
  border-radius: 10px;
  box-shadow: none;
  background: var(--russ-bg-secondary);
}

.ruchnik-block--full-page .ruchnik-toolbar-field.ruchnik-select :deep(.base-select-combo:focus) {
  border-color: var(--russ-secondary-dark);
  box-shadow: none;
}

.ruchnik-block--full-page .ruchnik-toolbar-field.ruchnik-select :deep(.base-select-arrow) {
  right: 12px;
  width: 16px;
  height: 16px;
  background-size: 16px;
}

.ruchnik-block--full-page .ruchnik-toolbar-input {
  background: var(--russ-bg-secondary);
}

.ruchnik-block--full-page .ruchnik-add-btn.ruchnik-toolbar-add--inline {
  min-height: var(--ruchnik-toolbar-control-height);
  height: var(--ruchnik-toolbar-control-height);
  margin-left: auto;
  border-radius: 10px;
  padding: 0 16px;
  font-size: 14px;
  box-shadow: 0 1px 3px var(--russ-shadow-accent-light);
}

.ruchnik-block--full-page .ruchnik-main {
  flex: 0 1 auto;
}

.ruchnik-block--full-page .ruchnik-content {
  flex: 0 1 auto;
  overflow: visible;
  gap: 0;
  padding-bottom: calc(12px + env(safe-area-inset-bottom, 0px));
}

.ruchnik-block--full-page .ruchnik-list-area {
  min-height: 0;
  overflow: visible;
  flex: 0 1 auto;
}

.ruchnik-block--full-page .ruchnik-list {
  max-height: none;
  flex: 0 1 auto;
}

.ruchnik-block--full-page .ruchnik-list-body {
  overflow: visible;
  flex: 0 1 auto;
}

.ruchnik-block--full-page .ruchnik-toolbar-add--inline {
  display: none;
}

.ruchnik-drawer-overlay--full-page {
  position: fixed;
  inset: 0;
  z-index: 10050;
  background: var(--russ-overlay);
}

.ruchnik-drawer-overlay--full-page .ruchnik-drawer {
  width: 100%;
  max-height: min(92dvh, 100%);
  height: auto;
  border-left: none;
  border-radius: 16px 16px 0 0;
  box-shadow: 0 -8px 32px var(--russ-shadow-color);
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

.ruchnik-drawer-overlay--full-page .ruchnik-drawer-body {
  padding-top: 20px;
}

@media (max-width: 768px) {
  .ruchnik-block--full-page {
    --base-select-height: 44px;
    --ruchnik-toolbar-control-height: 44px;
  }

  .ruchnik-block--full-page .ruchnik-toolbar {
    min-width: 0;
    max-width: 100%;
  }

  .ruchnik-block--full-page .ruchnik-toolbar-search,
  .ruchnik-toolbar-search {
    height: var(--ruchnik-toolbar-control-height);
    font-size: 16px;
    border-radius: 12px;
    padding: 0 14px;
    box-sizing: border-box;
  }

  .ruchnik-block--full-page .ruchnik-toolbar-controls {
    gap: 8px;
    padding: 0 12px 12px;
    box-sizing: border-box;
    min-width: 0;
    max-width: 100%;
    overflow-x: clip;
  }

  .ruchnik-block--full-page .ruchnik-toolbar-controls-top {
    gap: 8px;
    min-width: 0;
    max-width: 100%;
  }

  .ruchnik-block--full-page .ruchnik-toolbar-search {
    flex: 1 1 auto;
    min-width: 0;
    width: 0;
    max-width: 100%;
  }

  .ruchnik-block--full-page .ruchnik-toolbar-filters {
    display: none;
    flex-direction: column;
    align-items: stretch;
    flex-wrap: nowrap;
    gap: 10px;
    box-sizing: border-box;
    width: 100%;
    min-width: 0;
    max-width: 100%;
    padding: 12px;
    border: 1px solid var(--russ-border);
    border-radius: 12px;
    background: var(--russ-bg-secondary);
  }

  .ruchnik-block--full-page .ruchnik-toolbar--filters-open .ruchnik-toolbar-filters {
    display: flex;
  }

  .ruchnik-block--full-page .ruchnik-toolbar-filters-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    flex: 0 0 auto;
    flex-shrink: 0;
    min-height: var(--ruchnik-toolbar-control-height);
    padding: 0 10px;
    border: 1px solid var(--russ-border);
    border-radius: 12px;
    background: var(--russ-bg-secondary);
    color: var(--russ-text-tertiary);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    touch-action: manipulation;
    transition:
      background 0.15s ease,
      border-color 0.15s ease,
      color 0.15s ease,
      box-shadow 0.15s ease;
  }

  .ruchnik-block--full-page .ruchnik-toolbar-filters-btn--active {
    border-color: var(--russ-primary);
    background: color-mix(in srgb, var(--russ-primary) 10%, var(--russ-bg-secondary));
    color: var(--russ-primary);
  }

  .ruchnik-block--full-page .ruchnik-toolbar-filters-btn:focus-visible {
    outline: 2px solid var(--russ-accent);
    outline-offset: 2px;
  }

  .ruchnik-block--full-page .ruchnik-toolbar-filters-btn:active:not(:disabled) {
    transform: scale(0.97);
  }

  .ruchnik-block--full-page .ruchnik-filter-item,
  .ruchnik-block--full-page .ruchnik-toolbar-type {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    flex: 1 1 auto;
  }

  .ruchnik-block--full-page
    .ruchnik-filter-item:not(.ruchnik-toolbar-type):not(.ruchnik-filter-item--reset) {
    flex: 1 1 auto;
    width: 100%;
    max-width: 100%;
  }

  .ruchnik-block--full-page .ruchnik-toolbar-type :deep(.p-chip) {
    display: inline-flex;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    box-sizing: border-box;
  }

  .ruchnik-block--full-page .ruchnik-toolbar-filters .ruchnik-toolbar-field,
  .ruchnik-block--full-page .ruchnik-toolbar-filters .ruchnik-toolbar-field.ruchnik-select {
    width: 100%;
    max-width: 100%;
    min-width: 0;
  }

  .ruchnik-block--full-page .ruchnik-filter-label--spacer {
    display: none;
  }

  .ruchnik-block--full-page .ruchnik-filter-item--reset {
    padding-top: 2px;
  }

  .ruchnik-block--full-page .ruchnik-toolbar-field.ruchnik-select :deep(.base-select-wrapper) {
    width: 100%;
    max-width: 100%;
    min-width: 0;
  }

  .ruchnik-block--full-page .ruchnik-toolbar-field.ruchnik-select :deep(.base-select-container) {
    width: 100%;
    max-width: 100%;
    min-width: 0;
  }

  .ruchnik-block--full-page .ruchnik-toolbar-field.ruchnik-select :deep(.base-select-combo) {
    width: 100%;
    max-width: 100%;
    min-height: var(--ruchnik-toolbar-control-height);
    border: 1px solid var(--russ-border);
    border-radius: 12px;
    background: var(--russ-bg);
    font-size: 16px;
    box-sizing: border-box;
  }

  .ruchnik-block--full-page .ruchnik-toolbar-reset-btn {
    width: 100%;
    min-height: 44px;
    height: auto;
    border-radius: 12px;
    background: var(--russ-bg);
    font-size: 14px;
  }

  .ruchnik-block--full-page .ruchnik-content {
    /* FAB 56 + gap 16 + tabbar inset */
    padding-bottom: calc(72px + var(--app-mobile-tabbar-inset, 68px));
  }
}

@media (max-width: 640px) {
  .ruchnik-block {
    --base-select-height: 44px;
    --ruchnik-toolbar-control-height: 44px;
    --ruchnik-list-viewport-min: 100px;
  }

  .ruchnik-toolbar {
    gap: 8px;
    padding: 8px 0 10px;
  }

  .ruchnik-block--full-page .ruchnik-toolbar-leading {
    display: flex;
    padding: 0 0 2px;
  }

  .ruchnik-toolbar-controls {
    gap: 8px;
  }

  .ruchnik-toolbar-search {
    height: var(--ruchnik-toolbar-control-height);
    font-size: 16px;
    border-radius: 12px;
    padding: 0 14px;
  }

  .ruchnik-row {
    padding: 6px 6px 6px 8px;
    gap: 6px;
    min-height: 36px;
  }

  .ruchnik-row-main {
    gap: 6px;
  }

  .ruchnik-row-code {
    font-size: 12px;
    max-width: 48%;
  }

  .ruchnik-row-agent {
    font-size: 11px;
  }

  .ruchnik-row-agent::before {
    margin-right: 6px;
  }

  .ruchnik-edit-btn,
  .ruchnik-remove-btn {
    width: 28px;
    height: 28px;
    font-size: 12px;
  }

  .status-text-full {
    display: none;
  }

  .status-text-short {
    display: inline;
  }

  .status-indicator {
    padding: 5px 8px;
    font-size: 11px;
  }

  .pagination-compact {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
    padding-top: 10px;
  }

  .pagination-info-compact {
    justify-content: center;
    font-size: 12px;
  }

  .pagination-controls-compact {
    justify-content: center;
    gap: 10px;
  }

  .pagination-select-compact,
  .page-btn-compact {
    min-height: 44px;
    min-width: 44px;
    font-size: 14px;
  }

  .pagination-select-compact {
    flex: 1;
    max-width: 88px;
  }

  .bulk-agents-modes {
    gap: 4px;
    padding: 4px;
    border-radius: 12px;
  }

  .bulk-agents-mode-option {
    flex: 1;
    justify-content: center;
    min-height: 44px;
    padding: 10px 8px;
    font-size: 13px;
    line-height: 1.2;
    touch-action: manipulation;
  }

  .bulk-agents-mode-icon {
    font-size: 14px;
  }

  .ruchnik-drawer-body .ruchnik-select {
    --base-select-radius: 12px;
  }

  .ruchnik-drawer-body .ruchnik-select :deep(.base-select-combo) {
    font-size: 16px;
  }

  .ruchnik-drawer-input {
    font-size: 16px;
    border-radius: 12px;
    padding: 14px;
  }

  .ruchnik-drawer-textarea-wrap {
    border-radius: 12px;
  }

  .ruchnik-drawer-textarea-wrap .ruchnik-drawer-textarea {
    min-height: 140px;
    font-size: 16px;
    padding: 14px 4px 14px 14px;
  }

  .ruchnik-drawer-overlay--full-page {
    align-items: flex-end;
  }

  .ruchnik-drawer-overlay--full-page .form-actions {
    flex-direction: column-reverse;
    align-items: stretch;
    gap: 10px;
  }

  .ruchnik-drawer-overlay--full-page .ruchnik-cancel-btn,
  .ruchnik-drawer-overlay--full-page .ruchnik-drawer-submit {
    width: 100%;
    min-height: 48px;
    justify-content: center;
    border-radius: 12px;
    font-size: 15px;
    font-weight: 600;
  }

  .ruchnik-drawer-overlay--full-page .ruchnik-drawer-footer {
    padding: 12px 16px calc(12px + env(safe-area-inset-bottom, 0px));
  }
}

@media (min-width: 769px) {
  .ruchnik-block--full-page {
    --ruchnik-toolbar-control-height: 40px;
  }

  .ruchnik-fab {
    display: none;
  }

  .ruchnik-block--full-page .ruchnik-toolbar-add--inline {
    display: inline-flex;
  }

  .ruchnik-list {
    gap: 0;
    border: 1px solid var(--russ-border);
    border-radius: 8px;
    background: var(--russ-bg);
    overflow: hidden;
  }

  .ruchnik-list-head {
    display: grid;
    grid-template-columns: 168px minmax(0, 1fr) 68px;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: var(--russ-bg-secondary);
    border-bottom: 1px solid var(--russ-border);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--russ-text-tertiary);
    flex-shrink: 0;
  }

  .ruchnik-list-body {
    gap: 0;
    flex: 0 1 auto;
    min-height: 0;
  }

  .ruchnik-list-head:has(.ruchnik-list-head-status) {
    grid-template-columns: 168px minmax(0, 1fr) 100px 68px;
  }

  .ruchnik-list-head-actions {
    width: 68px;
  }

  .ruchnik-list-footer {
    padding: 8px 12px;
    margin-top: 0;
    border-top: 1px solid var(--russ-border);
    background: var(--russ-bg-secondary);
  }

  .ruchnik-list-footer .pagination-compact {
    gap: 8px;
  }

  .ruchnik-list-footer .pagination-info-compact {
    font-size: 14px;
    gap: 8px;
  }

  .ruchnik-list-footer .pagination-select-compact,
  .ruchnik-list-footer .page-btn-compact {
    height: 32px;
    min-height: 32px;
    font-size: 14px;
  }

  .ruchnik-list-footer .page-btn-compact {
    width: 32px;
  }

  .ruchnik-row {
    display: grid;
    grid-template-columns: 168px minmax(0, 1fr) 68px;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    min-height: 40px;
    background: transparent;
    border: none;
    border-bottom: 1px solid var(--russ-border-light);
    border-radius: 0;
  }

  .ruchnik-row:has(.ruchnik-row-status) {
    grid-template-columns: 168px minmax(0, 1fr) 100px 68px;
  }

  .ruchnik-row:last-child {
    border-bottom: none;
  }

  .ruchnik-row:hover {
    background: var(--russ-bg-secondary);
  }

  .ruchnik-row-main {
    display: contents;
  }

  .ruchnik-row-code {
    font-size: 15px;
    max-width: none;
    font-variant-numeric: tabular-nums;
    line-height: 1.25;
  }

  .ruchnik-row-agent {
    font-size: 14px;
    line-height: 1.25;
  }

  .ruchnik-row-agent::before {
    display: none;
  }

  .ruchnik-row-actions {
    margin-left: 0;
    width: 68px;
    gap: 4px;
    justify-content: flex-end;
  }

  .ruchnik-edit-btn,
  .ruchnik-remove-btn {
    width: 32px;
    height: 32px;
    min-width: 32px;
    min-height: 32px;
    font-size: 13px;
    border-radius: 6px;
  }

  .ruchnik-row-status {
    justify-self: start;
  }

  .status-text-full {
    display: inline;
  }

  .status-text-short {
    display: none;
  }

  .ruchnik-block--full-page .ruchnik-content {
    padding-bottom: 12px;
  }

  .ruchnik-drawer-overlay--full-page {
    justify-content: flex-end;
    align-items: stretch;
  }

  .ruchnik-drawer-overlay--full-page .ruchnik-drawer {
    width: min(420px, 100vw);
    height: 100%;
    max-height: none;
    border-left: 1px solid var(--russ-border);
    border-radius: 0;
    box-shadow: -8px 0 32px var(--russ-shadow-color);
    padding-bottom: 0;
  }

  .ruchnik-drawer-overlay--full-page .ruchnik-drawer-body {
    padding: 18px;
  }

  .ruchnik-drawer-overlay--full-page .ruchnik-drawer-footer {
    padding: 14px 18px;
  }
}
</style>
