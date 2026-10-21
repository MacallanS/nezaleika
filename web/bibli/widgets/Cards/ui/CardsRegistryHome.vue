<template>
  <section class="cards-registry-home">
    <CardsPageShell
      v-model="activeTab"
      :tabs="homeTabs"
      :variant="warehouse ? 'warehouse' : 'field'"
      :show-toolbar="true"
      :refresh-loading="refreshLoading && hasLoadedOnce"
      @refresh="() => reload({ force: true })"
      @project-change="onProjectChange"
    >
      <div
        v-if="showHomeSkeleton"
        class="crh-skeleton"
        aria-busy="true"
        role="status"
        aria-label="Загрузка реестра"
      >
        <div class="crh-skel-kpis">
          <div v-for="i in 4" :key="`crh-kpi-${i}`" class="crh-skel-kpi"></div>
        </div>
        <div v-for="row in 5" :key="`crh-row-${row}`" class="crh-skel-row"></div>
      </div>

      <!-- Warehouse -->
      <template v-else-if="warehouse">
        <div v-if="activeTab === 'overview'" class="crh-pane">
          <p class="crh-lead">Сводка по выбранному проекту — что есть сейчас и куда смотреть дальше.</p>

          <div class="crh-kpis">
            <div class="crh-kpi">
              <span class="crh-kpi__label">Всего карт</span>
              <span class="crh-kpi__value">{{ formatNum(totalCards) }}</span>
            </div>
            <div class="crh-kpi">
              <span class="crh-kpi__label">На точках</span>
              <span class="crh-kpi__value">{{ formatNum(onPoints) }}</span>
            </div>
            <div class="crh-kpi">
              <span class="crh-kpi__label">На складе</span>
              <span class="crh-kpi__value">{{ formatNum(warehouseCards) }}</span>
            </div>
            <div class="crh-kpi">
              <span class="crh-kpi__label">В пути</span>
              <span class="crh-kpi__value">{{ formatNum(inTransit) }}</span>
            </div>
          </div>

          <div class="crh-focus">
            <h3 class="crh-focus__title">Сейчас важно</h3>
            <button type="button" class="crh-focus__card" @click="activeTab = 'points'">
              <span class="crh-focus__label">Низкий запас на точках</span>
              <strong class="crh-focus__value" :class="{ 'is-alert': lowRows.length }">
                {{ lowRows.length }}
              </strong>
            </button>
            <button type="button" class="crh-focus__card" @click="activeTab = 'queue'">
              <span class="crh-focus__label">Нужно подтвердить</span>
              <strong class="crh-focus__value" :class="{ 'is-alert': attentionTotal }">
                {{ attentionTotal }}
              </strong>
            </button>
          </div>

          <div class="crh-quick">
            <button type="button" class="crh-action" @click="go('/cards/transfers/?focus=send')">
              Создать передачу
            </button>
            <button type="button" class="crh-action crh-action--secondary" @click="go('/cards/stock/')">
              Остатки и склад
            </button>
          </div>
        </div>

        <div v-else-if="activeTab === 'points'" class="crh-pane">
          <div class="crh-pane__head">
            <div class="crh-pane__intro">
              <h3 class="crh-pane__title">Остатки по точкам</h3>
              <p class="crh-pane__hint">Красный статус — запас ниже порога, можно сразу создать передачу.</p>
            </div>
            <label class="crh-filter">
              <input v-model="onlyLowStock" type="checkbox" />
              <span>Только низкий запас</span>
            </label>
          </div>

          <ul v-if="visiblePointRows.length" class="crh-list" role="list">
            <li
              v-for="row in visiblePointRows"
              :key="row.id"
              class="crh-list__row"
              :class="{ 'crh-list__row--low': row.isLow }"
            >
              <div class="crh-list__main">
                <span class="crh-list__name">{{ row.name }}</span>
                <span class="crh-list__meta">{{ row.partnerLabel }}</span>
              </div>
              <div class="crh-list__side">
                <span class="crh-list__qty">{{ row.balance }} карт</span>
                <span class="crh-list__badge" :class="{ 'is-low': row.isLow }">
                  {{ row.isLow ? 'Низкий запас' : 'Норма' }}
                </span>
              </div>
              <button
                v-if="row.isLow"
                type="button"
                class="crh-list__cta"
                @click="go('/cards/transfers/?focus=send')"
              >
                Создать передачу
              </button>
            </li>
          </ul>
          <p v-else class="crh-hint">
            {{ onlyLowStock ? 'Точек с низким запасом нет' : 'Нет точек в выбранном проекте' }}
          </p>
        </div>

        <div v-else-if="activeTab === 'queue'" class="crh-pane">
          <div class="crh-pane__intro">
            <h3 class="crh-pane__title">Очередь внимания</h3>
            <p class="crh-pane__hint">То, что ждёт действия сейчас — без лишних списков.</p>
          </div>

          <ul class="crh-queue" role="list">
            <li class="crh-queue__item">
              <div class="crh-queue__text">
                <span class="crh-queue__label">Неподтверждённые приёмки</span>
                <span class="crh-queue__desc">Точки ещё не приняли коробки</span>
              </div>
              <strong class="crh-queue__count" :class="{ 'is-alert': pendingIncoming }">
                {{ pendingIncoming }}
              </strong>
              <button type="button" class="crh-queue__cta" @click="go('/cards/transfers/?focus=shipments')">
                Открыть передачи
              </button>
            </li>
            <li class="crh-queue__item">
              <div class="crh-queue__text">
                <span class="crh-queue__label">Передачи в ожидании</span>
                <span class="crh-queue__desc">Отправлены, но не закрыты</span>
              </div>
              <strong class="crh-queue__count" :class="{ 'is-alert': pendingShipments }">
                {{ pendingShipments }}
              </strong>
              <button type="button" class="crh-queue__cta" @click="go('/cards/transfers/?focus=shipments')">
                Открыть передачи
              </button>
            </li>
            <li class="crh-queue__item">
              <div class="crh-queue__text">
                <span class="crh-queue__label">Проблемные операции</span>
                <span class="crh-queue__desc">Списания и утиль без решения</span>
              </div>
              <strong class="crh-queue__count" :class="{ 'is-alert': pendingUtils }">
                {{ pendingUtils }}
              </strong>
              <button type="button" class="crh-queue__cta" @click="go('/cards/writeoff/')">
                Открыть списания
              </button>
            </li>
          </ul>
        </div>

        <div v-else class="crh-pane">
          <div class="crh-pane__intro">
            <h3 class="crh-pane__title">Последние события</h3>
            <p class="crh-pane__hint">Краткая лента по передачам и приёмкам.</p>
          </div>
          <ul v-if="recentEvents.length" class="crh-events" role="list">
            <li v-for="(ev, i) in recentEvents" :key="i" class="crh-events__item">{{ ev }}</li>
          </ul>
          <p v-else class="crh-empty">Событий пока нет — как только появятся передачи, они будут здесь.</p>
        </div>
      </template>

      <!-- Field -->
      <template v-else>
        <div v-if="activeTab === 'overview'" class="crh-pane">
          <p class="crh-lead">Ваши карты и то, что ждёт действия на точке.</p>

          <div class="crh-kpis">
            <div class="crh-kpi">
              <span class="crh-kpi__label">На моих точках</span>
              <span class="crh-kpi__value">{{ formatNum(fieldOnHand) }}</span>
            </div>
            <div class="crh-kpi">
              <span class="crh-kpi__label">Ждут приёмки</span>
              <span class="crh-kpi__value">{{ fieldIncomingCount }}</span>
            </div>
            <div class="crh-kpi">
              <span class="crh-kpi__label">В пути ко мне</span>
              <span class="crh-kpi__value">{{ formatNum(fieldInTransit) }}</span>
            </div>
            <div class="crh-kpi">
              <span class="crh-kpi__label">Низкий запас</span>
              <span class="crh-kpi__value" :class="{ 'is-alert': fieldLowStock }">
                {{ fieldLowStock }}
              </span>
            </div>
          </div>

          <div class="crh-focus">
            <h3 class="crh-focus__title">Сейчас важно</h3>
            <button
              type="button"
              class="crh-focus__card"
              @click="activeTab = 'actions'"
            >
              <span class="crh-focus__label">Коробки ждут приёмки</span>
              <strong class="crh-focus__value" :class="{ 'is-alert': fieldIncomingCount }">
                {{ fieldIncomingCount }}
              </strong>
            </button>
          </div>
        </div>

        <div v-else-if="activeTab === 'point'" class="crh-pane">
          <div class="crh-pane__intro">
            <h3 class="crh-pane__title">Моя точка</h3>
            <p class="crh-pane__hint">Текущая точка и остаток карт.</p>
          </div>
          <div v-if="fieldPointName" class="crh-point">
            <span class="crh-point__name">{{ fieldPointName }}</span>
            <span class="crh-point__qty">{{ fieldOnHand ?? '—' }} карт</span>
          </div>
          <p v-else class="crh-empty">Точка не выбрана — выберите проект или точку в шапке.</p>
        </div>

        <div v-else-if="activeTab === 'actions'" class="crh-pane">
          <div class="crh-pane__intro">
            <h3 class="crh-pane__title">Быстрые действия</h3>
            <p class="crh-pane__hint">Самые частые операции с карты — в один тап.</p>
          </div>
          <div class="crh-actions">
            <button type="button" class="crh-action" @click="go('/cards/point/')">
              Принять коробку
            </button>
            <button type="button" class="crh-action crh-action--secondary" @click="go('/cards/point/')">
              Списать / утиль
            </button>
            <button type="button" class="crh-action crh-action--secondary" @click="go('/cards/inventory/')">
              Провести инвентаризацию
            </button>
          </div>
        </div>

        <div v-else class="crh-pane">
          <div class="crh-pane__intro">
            <h3 class="crh-pane__title">Последние операции</h3>
            <p class="crh-pane__hint">Недавние приёмки и движения по точке.</p>
          </div>
          <ul v-if="fieldRecent.length" class="crh-events" role="list">
            <li v-for="(line, i) in fieldRecent" :key="i" class="crh-events__item">{{ line }}</li>
          </ul>
          <p v-else class="crh-empty">Операций пока нет.</p>
        </div>
      </template>
    </CardsPageShell>
  </section>
</template>

<script setup lang="ts">
import { computed, onActivated, onMounted, ref, watch } from 'vue'
import { navigateTo } from '#imports'
import { useRoles } from '@/shared/composables/roles/useRoles'
import CardsPageShell from './CardsPageShell.vue'
import { useCardsBackOffice } from '../composables/useCardsBackOffice'
import { usePointOps } from '../composables/usePointOps'
import './cards-registry-home.css'

const {
  isAdmin,
  isDirector,
  isAccountDirector,
  isSupportHead,
  isSupportManager,
} = useRoles()

const warehouse = computed(
  () =>
    isAdmin.value ||
    isDirector.value ||
    isAccountDirector.value ||
    isSupportHead.value ||
    isSupportManager.value,
)

const refreshLoading = ref(false)
const hasLoadedOnce = ref(false)
const showHomeSkeleton = computed(() => refreshLoading.value && !hasLoadedOnce.value)
const activeTab = ref('overview')
const onlyLowStock = ref(false)

const bo = useCardsBackOffice()
const point = usePointOps()

const balanceRows = computed(() =>
  bo.points.value.map((p) => ({
    id: p.location,
    name: p.name || p.location,
    partnerLabel: 'ОТП',
    balance: bo.balances.value[p.location] ?? 0,
    isLow: bo.belowThresholdLocations.value.includes(p.location),
  })),
)

const lowRows = computed(() => balanceRows.value.filter((r) => r.isLow))

const visiblePointRows = computed(() =>
  onlyLowStock.value ? lowRows.value : balanceRows.value,
)

const onPoints = computed(() =>
  balanceRows.value.reduce((sum, r) => sum + r.balance, 0),
)

const warehouseCards = computed(() =>
  bo.centralBoxes.value.reduce((sum, b) => sum + (b.capacity || 0), 0),
)

const inTransit = computed(() =>
  bo.shipments.value
    .filter((s) => s.status === 'pending_accept')
    .reduce((sum, s) => sum + (s.units_count || 0), 0),
)

const totalCards = computed(() => onPoints.value + warehouseCards.value + inTransit.value)

const pendingShipments = computed(
  () => bo.shipments.value.filter((s) => s.status === 'pending_accept').length,
)
const pendingIncoming = computed(() => pendingShipments.value)
const pendingUtils = computed(() => bo.pendingUtils.value.length)
const attentionTotal = computed(
  () => pendingIncoming.value + pendingShipments.value + pendingUtils.value,
)

const recentEvents = computed(() => {
  const lines: string[] = []
  for (const s of bo.shipments.value.slice(0, 8)) {
    const label =
      s.status === 'pending_accept'
        ? 'Передача на точку'
        : s.status === 'accepted'
          ? 'Подтверждение приёмки'
          : 'Партия'
    lines.push(`${label}: ${s.to_location_external_id} · ${s.units_count ?? '—'} карт`)
  }
  return lines
})

const fieldOnHand = computed(() => point.onHand.value)
const fieldIncomingCount = computed(() => point.incoming.value.length)
const fieldInTransit = computed(() =>
  point.incoming.value.reduce((sum, s) => sum + (s.units_count || 0), 0),
)
const fieldPointName = computed(() => point.pointContext.value?.point_name || '')
const fieldLowStock = computed(() => (fieldOnHand.value != null && fieldOnHand.value < 50 ? 1 : 0))
const fieldRecent = computed(() =>
  point.incoming.value.slice(0, 5).map(
    (s) => `Ожидает приёмки: ${s.units_count ?? '—'} карт`,
  ),
)

const homeTabs = computed(() => {
  if (warehouse.value) {
    const low = lowRows.value.length
    const attn = attentionTotal.value
    return [
      { key: 'overview', label: 'Сводка' },
      { key: 'points', label: low ? `Точки · ${low}` : 'Точки' },
      { key: 'queue', label: attn ? `Очередь · ${attn}` : 'Очередь' },
      { key: 'history', label: 'События' },
    ]
  }
  const wait = fieldIncomingCount.value
  return [
    { key: 'overview', label: 'Сводка' },
    { key: 'point', label: 'Точка' },
    { key: 'actions', label: wait ? `Действия · ${wait}` : 'Действия' },
    { key: 'history', label: 'История' },
  ]
})

watch(warehouse, () => {
  activeTab.value = 'overview'
  onlyLowStock.value = false
})

function go(to: string) {
  void navigateTo(to)
}

function formatNum(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return '—'
  return String(n)
}

let reloadInflight: Promise<void> | null = null

async function reload(options: { force?: boolean } = {}) {
  if (reloadInflight) return reloadInflight
  const force = options.force !== false
  refreshLoading.value = true
  reloadInflight = (async () => {
    try {
      if (warehouse.value) {
        await bo.loadCardsProjects()
        await Promise.all([
          bo.ensureTabData('balances', { force }),
          bo.ensureTabData('shipments', { force }),
          bo.ensureTabData('util', { force }),
        ])
      } else {
        await point.refreshLight()
      }
    } finally {
      hasLoadedOnce.value = true
      refreshLoading.value = false
      reloadInflight = null
    }
  })()
  return reloadInflight
}

async function onProjectChange() {
  activeTab.value = 'overview'
  await reload({ force: true })
}

onMounted(() => {
  void reload({ force: true })
})

onActivated(() => {
  // keepalive: onMounted + onActivated оба вызываются при первом заходе —
  // второй reload не стартуем, иначе balances/shipments/util уходят дублями.
  if (hasLoadedOnce.value || refreshLoading.value || reloadInflight) return
  void reload({ force: true })
})
</script>
