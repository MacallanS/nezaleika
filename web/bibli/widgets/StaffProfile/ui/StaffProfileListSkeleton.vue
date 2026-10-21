<template>
  <div
    class="staff-list-skeleton"
    :class="`staff-list-skeleton--${variant}`"
    aria-busy="true"
    aria-label="Загрузка"
  >
    <div
      v-for="n in rows"
      :key="n"
      class="staff-list-skeleton__row"
      :class="`staff-list-skeleton__row--${rowKind}`"
    >
      <template v-if="rowKind === 'history'">
        <SkeletonBone width="24px" height="24px" pill />
        <div class="staff-list-skeleton__history-line">
          <SkeletonBone :width="lineWidth(n, 0)" height="20px" />
        </div>
        <SkeletonBone :width="n % 2 ? '42px' : '36px'" height="16px" class="staff-list-skeleton__time" />
      </template>

      <template v-else-if="rowKind === 'attention'">
        <SkeletonBone width="40px" height="40px" class="staff-list-skeleton__icon" />
        <div class="staff-list-skeleton__lines">
          <SkeletonBone :width="lineWidth(n, 1)" height="20px" />
          <SkeletonBone :width="lineWidth(n, 2)" height="18px" />
        </div>
        <SkeletonBone
          :width="n % 2 ? '48px' : '24px'"
          :height="n % 2 ? '48px' : '24px'"
          class="staff-list-skeleton__trail"
        />
      </template>

      <template v-else-if="rowKind === 'notes'">
        <SkeletonBone width="36px" height="36px" pill />
        <div class="staff-list-skeleton__notes-body">
          <div class="staff-list-skeleton__notes-head">
            <SkeletonBone :width="lineWidth(n, 3)" height="18px" />
            <SkeletonBone width="48px" height="14px" />
          </div>
          <SkeletonBone :width="lineWidth(n, 4)" height="18px" />
          <SkeletonBone v-if="n % 3 !== 0" :width="lineWidth(n, 5)" height="18px" />
        </div>
      </template>

      <template v-else>
        <SkeletonBone width="36px" height="36px" pill />
        <div class="staff-list-skeleton__lines">
          <SkeletonBone size="md" width="58%" />
          <SkeletonBone size="sm" width="34%" />
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import SkeletonBone from '@/shared/ui/skeleton/SkeletonBone.vue'

const props = withDefaults(
  defineProps<{
    rows?: number
    /** history = вкладка История; overview-history = блок на Обзоре */
    variant?: 'history' | 'overview-history' | 'attention' | 'notes' | 'simple'
  }>(),
  {
    rows: 5,
    variant: 'simple',
  },
)

const rowKind = computed(() => {
  if (props.variant === 'overview-history') return 'history'
  if (props.variant === 'history') return 'history'
  return props.variant
})

function lineWidth(n: number, slot: number): string {
  const widths = [
    ['72%', '64%', '80%', '58%'],
    ['112px', '96px', '128px', '104px'],
    ['88px', '104px', '72px', '96px'],
    ['120px', '96px', '140px', '108px'],
    ['92%', '78%', '86%', '70%'],
    ['64%', '52%', '74%', '48%'],
  ]
  const list = widths[slot] ?? widths[0]
  return list[(n - 1) % list.length]!
}
</script>

<style scoped>
.staff-list-skeleton {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: 0;
}

.staff-list-skeleton--history {
  gap: 24px;
  padding: 0;
}

.staff-list-skeleton--overview-history {
  gap: 14px;
  padding: 0;
}

.staff-list-skeleton--attention {
  gap: 8px;
}

.staff-list-skeleton--notes,
.staff-list-skeleton--simple {
  gap: 16px;
  padding: 4px 0;
}

.staff-list-skeleton__row--history {
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
}

.staff-list-skeleton--overview-history .staff-list-skeleton__row--history {
  gap: 10px;
  align-items: flex-start;
}

.staff-list-skeleton__row--attention {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.staff-list-skeleton__row--notes,
.staff-list-skeleton__row--simple {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.staff-list-skeleton__history-line {
  min-width: 0;
}

.staff-list-skeleton--overview-history .staff-list-skeleton__history-line {
  padding-top: 2px;
}

.staff-list-skeleton__time {
  border-radius: 4px !important;
}

.staff-list-skeleton--overview-history .staff-list-skeleton__time {
  margin-top: 2px;
}

.staff-list-skeleton__icon {
  border-radius: 10px !important;
}

.staff-list-skeleton__lines {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.staff-list-skeleton__trail {
  border-radius: 8px !important;
}

.staff-list-skeleton__notes-body {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.staff-list-skeleton__notes-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

@media (max-width: 640px) {
  .staff-list-skeleton__row--history {
    grid-template-columns: 24px minmax(0, 1fr);
  }

  .staff-list-skeleton__time {
    grid-column: 2;
    margin-top: 0;
    justify-self: start;
  }
}
</style>
