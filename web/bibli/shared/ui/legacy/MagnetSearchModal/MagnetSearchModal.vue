<template>
    <BaseModal
        v-model="modalVisible"
        width="95vw"
        max-width="1400px"
        max-height="900px"
        class="magnet-search-modal"
    >
        <template #header>
            <div class="magnet-search-header">
                <div class="header-left">
                    <i class="pi pi-credit-card header-icon"></i>
                    <div class="header-info">
                        <h3 class="header-title">Поиск по номеру карты Магнит</h3>
                        <span v-if="flattenedResults.length > 0" class="header-subtitle">
                            Найдено заявок: {{ flattenedResults.length }}
                        </span>
                    </div>
                </div>
            </div>
        </template>

        <!-- Search Input Section -->
        <div class="magnet-search-input-section">
            <div class="search-input-container">
                <InputText v-model="searchNumber" placeholder="Введите номер карты Магнит" variant="off" class="magnet-search-input"
                    @keyup.enter="handleSearch" />
                <button class="magnet-search-button" @click="handleSearch" :disabled="isLoading || !searchNumber.trim()"
                    title="Поиск по номеру карты">
                    <span v-if="isLoading" class="loader"></span>
                    <i v-else class="pi pi-search"></i>
                    Поиск
                </button>
            </div>
        </div>

        <!-- Search Results -->
        <div v-if="flattenedResults.length > 0" class="card-search-content">
            <div class="results-table-container">
                <table class="results-table">
                    <thead>
                        <tr>
                            <th>ID заявки</th>
                            <th>Дата создания</th>
                            <th>Продукт</th>
                            <th>Агент</th>
                            <th>Номер карты</th>
                            <th>Файлы</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="request in flattenedResults" :key="request.id" class="result-row">
                            <td class="id-cell">
                                <div class="copyable-cell" @click="copyToClipboard(request.code)" :title="request.code">
                                    {{ shortenId(request.code) }}
                                    <i class="pi pi-copy copy-icon"></i>
                                </div>
                            </td>
                            <td class="date-cell">
                                {{ formatDate(request.created_at) }}
                            </td>
                            <td class="product-cell">
                                <div class="product-info">
                                    <img v-if="request.product?.logo" :src="request.product.logo"
                                        :alt="request.product.name" class="product-logo" />
                                    <span>{{ request.product?.name || "—" }}</span>
                                </div>
                            </td>
                            <td class="agent-cell">
                                {{ formatAgentName(request.agent) }}
                            </td>
                            <td class="card-cell">
                                <span v-if="getCardNumber(request)" class="card-number">
                                    {{ getCardNumber(request) }}
                                </span>
                                <span v-else class="no-data">—</span>
                            </td>
                            <td class="files-cell">
                                <div v-if="request.files && request.files.length > 0" class="files-preview">
                                    <div v-for="(file, index) in request.files.slice(0, 3)" :key="file.code"
                                        class="file-preview-item">
                                        <a :href="getFileUrl(file)" data-fancybox="magnet-search-photos"
                                            :data-caption="`${file.name} - ${formatFileDate(file.created_at)}`"
                                            @click="handleFileClick($event, getFileUrl(file))"
                                            class="file-preview-link">
                                            <img :src="getFileUrl(file)" :alt="file.name" @error="handleImageError"
                                                class="file-preview-image" loading="lazy" />
                                            <div class="file-preview-overlay">
                                                <i class="pi pi-eye"></i>
                                            </div>
                                        </a>
                                    </div>
                                    <span v-if="request.files.length > 3" class="files-count-more">
                                        +{{ request.files.length - 3 }}
                                    </span>
                                </div>
                                <span v-else class="no-data">—</span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- No Results State -->
        <div v-else-if="!isLoading && hasSearched" class="no-results">
            <i class="pi pi-search"></i>
            <h3>Заявки не найдены</h3>
            <p>По номеру карты "{{ searchNumber }}" заявки не найдены</p>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="loading-state">
            <div class="loader"></div>
            <p>Поиск заявок...</p>
        </div>
    </BaseModal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import BaseModal from '../BaseModal/BaseModal.vue'
import { InputText } from '@/shared/ui'
import { useToast } from '../Toast'
import { Fancybox } from '@fancyapps/ui'
import '@fancyapps/ui/dist/fancybox/fancybox.css'

const props = defineProps({
    visible: {
        type: Boolean,
        default: false
    },
    searchResults: {
        type: Array,
        default: () => []
    },
    isLoading: {
        type: Boolean,
        default: false
    },
    baseURL: {
        type: String,
        default: ''
    }
})

defineOptions({ inheritAttrs: false })

const effectiveBaseURL = computed(() => props.baseURL || 'https://server.rusaifin.ru')
function getFileUrl(file) {
    return `${effectiveBaseURL.value}/document/${file.code}`
}

// Flatten the grouped results for display
const flattenedResults = computed(() => {
    if (!props.searchResults || !Array.isArray(props.searchResults)) return []

    // If results are grouped by product (array of arrays), flatten them
    if (props.searchResults.length > 0 && Array.isArray(props.searchResults[0])) {
        return props.searchResults.flat()
    }

    // If results are already flat, return as is
    return props.searchResults
})

// Collect all files from all requests for Fancybox gallery
const allFiles = computed(() => {
    const files = []
    flattenedResults.value.forEach((request) => {
        if (request.files && Array.isArray(request.files)) {
            request.files.forEach((file) => {
                files.push({
                    src: getFileUrl(file),
                    type: 'image',
                    caption: `${file.name} - ${formatFileDate(file.created_at)}`,
                    requestId: request.id,
                    fileCode: file.code
                })
            })
        }
    })
    return files
})

const emit = defineEmits(['update:visible', 'search'])

const toast = useToast()

// Computed для совместимости между visible/update:visible и v-model
const modalVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
})

const searchNumber = ref('')
const hasSearched = ref(false)

function formatFileDate(dateString) {
    if (!dateString) return ''
    try {
        const date = new Date(dateString)
        if (isNaN(date.getTime())) return ''
        return date.toLocaleString('ru-RU')
    } catch (error) {
        console.error('Error formatting file date:', error)
        return ''
    }
}

function getFieldValue(request, fieldName) {
    if (!request?.fields || !Array.isArray(request.fields)) return null
    const field = request.fields.find(f => f.field === fieldName)
    return field ? field.value : null
}

function getCardIssued(request) {
    const value = getFieldValue(request, 'issued')
    if (value === 'true') return true
    if (value === 'false') return false
    return null
}

// Computed properties for analytics
const uniqueProductsCount = computed(() => {
    const products = new Set(flattenedResults.value.map(r => r.product?.name).filter(Boolean))
    return products.size
})

const issuedCardsCount = computed(() => {
    return flattenedResults.value.filter(r => getCardIssued(r) === true).length
})

const notIssuedCardsCount = computed(() => {
    return flattenedResults.value.filter(r => getCardIssued(r) === false).length
})

// Methods
function handleSearch() {
    if (!searchNumber.value.trim()) {
        toast.add({
            severity: 'warn',
            summary: 'Предупреждение',
            detail: 'Введите номер карты',
            life: 3000
        })
        return
    }

    hasSearched.value = true
    emit('search', searchNumber.value.trim())
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text)
    toast.add({
        severity: 'success',
        summary: 'Скопировано',
        detail: 'Текст скопирован в буфер обмена',
        life: 2000
    })
}

function shortenId(id) {
    if (!id || id.length <= 8) return id
    return `${id.slice(0, 2)}...${id.slice(-2)}`
}

function formatDate(dateString) {
    if (!dateString) return '—'
    try {
        const date = new Date(dateString)
        if (isNaN(date.getTime())) return '—'
        return date.toLocaleString('ru-RU')
    } catch (error) {
        console.error('Error formatting date:', error)
        return '—'
    }
}

function formatAgentName(agent) {
    if (!agent) return '—'
    const name = `${agent.surname || ''} ${agent.name || ''} ${agent.patronymic || ''}`.trim()
    return name || '—'
}

function getCardNumber(request) {
    return getFieldValue(request, 'card_number')
}

function handleFileClick(event, href) {
    event.preventDefault()
    event.stopPropagation()

    // Find the index of clicked image in all files
    const currentIndex = allFiles.value.findIndex((file) => file.src === href)

    // Show all files in Fancybox gallery
    if (allFiles.value.length > 0) {
        Fancybox.show(allFiles.value, {
            startIndex: currentIndex >= 0 ? currentIndex : 0
        })
    }
}

function handleImageError(event) {
    console.error('Ошибка загрузки изображения:', event.target.src)
    event.target.style.display = 'none'
    const placeholder = document.createElement('div')
    placeholder.className = 'file-preview-placeholder'
    placeholder.innerHTML = '<i class="pi pi-image"></i>'
    placeholder.style.cssText = `
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--russ-bg-disabled);
        color: var(--russ-text-quaternary);
        font-size: 16px;
    `
    event.target.parentNode.appendChild(placeholder)
}

// Watch for modal visibility changes
watch(() => props.visible, (newVal) => {
    if (!newVal) {
        searchNumber.value = ''
        hasSearched.value = false
    }
})
</script>

<style scoped>
.magnet-search-modal {
    height: 85vh;
    max-height: 900px;
}

.magnet-search-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0;
    margin: 0;
    width: 100%;
    background: linear-gradient(to bottom, var(--russ-bg-secondary) 0%, var(--russ-bg) 100%);
}

.magnet-search-header .header-left {
    display: flex;
    align-items: center;
    gap: 14px;
}

.magnet-search-header .header-icon {
    font-size: 26px;
    color: var(--russ-text-secondary);
    background: linear-gradient(135deg, var(--russ-bg-tertiary) 0%, var(--russ-border-light) 100%);
    border-radius: 8px;
    padding: 10px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
}

.magnet-search-header .header-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.magnet-search-header .header-title {
    font-size: 19px;
    font-weight: 700;
    color: var(--russ-text-primary);
    margin: 0;
    line-height: 1.3;
    letter-spacing: -0.01em;
}

.magnet-search-header .header-subtitle {
    font-size: 13px;
    color: var(--russ-text-tertiary);
    font-weight: 500;
}

.magnet-search-input-section {
    padding: 12px 16px;
    background: var(--russ-bg-secondary);
    border-bottom: 1px solid var(--russ-border);
}

.search-input-container {
    display: flex;
    gap: 14px;
    align-items: center;
    max-width: 650px;
}

.magnet-search-input {
    flex: 1;
    padding: 14px 18px;
    border: 1.5px solid var(--russ-border-dark);
    border-radius: 8px;
    font-size: 14px;
    color: var(--russ-text-primary);
    transition: all 0.2s ease;
    background: var(--russ-bg);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
    width: 100%;
}

.magnet-search-input:focus {
    outline: none;
    border-color: var(--russ-input-border-focus);
    box-shadow: 0 0 0 4px var(--russ-shadow-accent-light), 0 2px 4px var(--russ-shadow-color);
    background: var(--russ-input-bg);
}

.magnet-search-input::placeholder {
    color: var(--russ-text-quaternary);
    font-weight: 400;
}

.magnet-search-button {
    background: linear-gradient(135deg, var(--russ-accent-light) 0%, var(--russ-accent) 100%);
    color: var(--russ-text-inverse);
    border: none;
    padding: 14px 24px;
    border-radius: 8px;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 120px;
    justify-content: center;
    box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
    letter-spacing: 0.01em;
}

.magnet-search-button:hover:not([disabled]) {
    background: linear-gradient(135deg, var(--russ-accent) 0%, var(--russ-accent-dark) 100%);
    box-shadow: 0 4px 8px rgba(59, 130, 246, 0.25);
}

.magnet-search-button:active:not([disabled]) {
    transform: translateY(0);
    box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
}

.magnet-search-button[disabled] {
    background: var(--russ-border);
    color: var(--russ-text-quaternary);
    cursor: not-allowed;
    box-shadow: none;
    transform: none;
}

.magnet-search-button .loader {
    width: 16px;
    height: 16px;
    border: 2px solid var(--russ-text-inverse);
    border-top: 2px solid transparent;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

.results-summary {
    padding: 16px 24px;
    background: var(--russ-bg-secondary);
    border-bottom: 1px solid var(--russ-border);
}

.summary-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
}

.stat-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background: var(--russ-bg);
    border-radius: 4px;
    border: 1px solid var(--russ-border);
}

.stat-label {
    font-size: 13px;
    font-weight: 500;
    color: var(--russ-text-tertiary);
}

.stat-value {
    font-size: 14px;
    font-weight: 600;
    color: var(--russ-text-primary);
}

.card-search-content {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.results-summary {
    padding: 16px 24px;
    background: var(--russ-bg-secondary);
    border-bottom: 1px solid var(--russ-border);
}

.summary-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
}

.stat-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background: var(--russ-bg);
    border-radius: 4px;
    border: 1px solid var(--russ-border);
}

.stat-label {
    font-size: 13px;
    font-weight: 500;
    color: var(--russ-text-tertiary);
}

.stat-value {
    font-size: 14px;
    font-weight: 600;
    color: var(--russ-text-primary);
}

.results-table-container {
    flex: 1;
    overflow: auto;
    background: var(--russ-bg);
}

.results-table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    font-size: 13px;
    background: var(--russ-bg);
}

.results-table th,
.results-table td {
    padding: 14px 18px;
    text-align: left;
    border-bottom: 1px solid var(--russ-bg-disabled);
}

.results-table th {
    background: linear-gradient(to bottom, var(--russ-bg-secondary) 0%, var(--russ-bg-tertiary) 100%);
    font-weight: 700;
    color: var(--russ-text-secondary);
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    position: sticky;
    top: 0;
    z-index: 2;
    border-bottom: 2px solid var(--russ-border);
    white-space: nowrap;
}

.results-table tbody tr {
    transition: background-color 0.15s ease;
    background: var(--russ-bg);
}

.results-table tbody tr:nth-child(even) {
    background: var(--russ-bg-secondary);
}

.results-table tbody tr:hover {
    background: var(--russ-bg-disabled);
}

.results-table tbody tr:last-child td {
    border-bottom: none;
}

.result-row {
    cursor: pointer;
}

.id-cell {
    font-family: var(--russ-font-family-mono);
    font-weight: 700;
    color: var(--russ-text-primary);
    font-size: 13px;
}

.copyable-cell {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    padding: 6px 10px;
    border-radius: 6px;
    transition: all 0.2s ease;
    background: transparent;
}

.copyable-cell:hover {
    background: var(--russ-info-light);
    color: var(--russ-info-text);
}

.copy-icon {
    font-size: 13px;
    color: var(--russ-text-quaternary);
    opacity: 0.6;
    transition: all 0.2s ease;
}

.copyable-cell:hover .copy-icon {
    opacity: 1;
    color: var(--russ-accent-light);
}

.date-cell {
    color: var(--russ-text-secondary);
    font-size: 12px;
    font-weight: 500;
}

.product-cell {
    min-width: 150px;
}

.product-info {
    display: flex;
    align-items: center;
    gap: 10px;
}

.product-logo {
    width: 24px;
    height: 24px;
    border-radius: 4px;
    object-fit: cover;
    border: 1px solid var(--russ-border);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.agent-cell {
    color: var(--russ-text-secondary);
    font-size: 13px;
    font-weight: 500;
}

.card-cell {
    font-family: var(--russ-font-family-mono);
    font-weight: 600;
    color: var(--russ-text-primary);
    font-size: 13px;
}

.card-number {
    background: linear-gradient(135deg, var(--russ-bg-gray-light) 0%, var(--russ-bg-blue-lighter) 100%);
    padding: 4px 10px;
    border-radius: 5px;
    font-size: 12px;
    border: 1px solid var(--russ-info-light);
    color: var(--russ-info-text);
}

.status-cell {
    font-size: 12px;
}

.status-issued {
    display: flex;
    align-items: center;
    gap: 4px;
    color: var(--russ-success-dark);
    font-weight: 500;
}

.status-not-issued {
    display: flex;
    align-items: center;
    gap: 4px;
    color: var(--russ-error);
    font-weight: 500;
}

.status-issued i,
.status-not-issued i {
    font-size: 12px;
}

.files-cell {
    color: var(--russ-text-tertiary);
    font-size: 12px;
}

.files-preview {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
}

.file-preview-item {
    position: relative;
    width: 44px;
    height: 44px;
    border-radius: 6px;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.2s ease;
    flex-shrink: 0;
    border: 2px solid transparent;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.file-preview-item:hover {
    transform: scale(1.08);
    border-color: var(--russ-accent-light);
    box-shadow: 0 4px 8px rgba(59, 130, 246, 0.2);
}

.file-preview-link {
    display: block;
    width: 100%;
    height: 100%;
    position: relative;
    text-decoration: none;
}

.file-preview-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}

.file-preview-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.2s ease;
}

.file-preview-item:hover .file-preview-overlay {
    opacity: 1;
}

.file-preview-overlay i {
    color: var(--russ-text-inverse);
    font-size: 16px;
}

.files-count-more {
    background: linear-gradient(135deg, var(--russ-info-light) 0%, var(--russ-info-border) 100%);
    color: var(--russ-info-text);
    padding: 6px 10px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 700;
    white-space: nowrap;
    border: 1px solid var(--russ-info-border);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.file-preview-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--russ-bg-disabled);
    color: var(--russ-text-quaternary);
    font-size: 16px;
}

.no-data {
    color: var(--russ-text-quaternary);
    font-style: italic;
    font-size: 13px;
}

.no-results {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 24px;
    text-align: center;
    background: var(--russ-bg-secondary);
    flex: 1;
}

.no-results i {
    font-size: 56px;
    color: var(--russ-border-dark);
    margin-bottom: 20px;
    opacity: 0.7;
}

.no-results h3 {
    font-size: 20px;
    font-weight: 700;
    color: var(--russ-text-secondary);
    margin: 0 0 10px 0;
    letter-spacing: -0.01em;
}

.no-results p {
    font-size: 14px;
    color: var(--russ-text-tertiary);
    margin: 0;
    font-weight: 500;
}

.loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 24px;
    text-align: center;
    flex: 1;
    background: var(--russ-bg-secondary);
}

.loading-state .loader {
    width: 40px;
    height: 40px;
    border: 4px solid var(--russ-border);
    border-top: 4px solid var(--russ-accent-light);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 20px;
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
}

.loading-state p {
    font-size: 15px;
    font-weight: 600;
    color: var(--russ-text-secondary);
    margin: 0;
    letter-spacing: 0.01em;
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }

    100% {
        transform: rotate(360deg);
    }
}

/* Мобильная адаптация */
@media (max-width: 900px) {
    .magnet-search-modal {
        width: 95vw !important;
        max-width: 95vw !important;
        height: 90vh !important;
        max-height: none !important;
    }

    .search-input-container {
        flex-direction: column;
        gap: 8px;
    }

    .magnet-search-button {
        width: 100%;
    }

    .summary-stats {
        grid-template-columns: 1fr;
        gap: 8px;
    }

    .results-table {
        font-size: 12px;
    }

    .results-table th,
    .results-table td {
        padding: 8px 12px;
    }
}

@media (max-width: 600px) {
    .magnet-search-header {
        padding: 16px 20px;
    }

    .magnet-search-input-section {
        padding: 16px 20px;
    }

    .results-summary {
        padding: 12px 20px;
    }

    .results-table th,
    .results-table td {
        padding: 6px 8px;
    }

    .product-cell {
        min-width: 120px;
    }
}
</style>
