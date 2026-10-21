<template>
  <div class="staff-profile-skeleton page-skeleton" aria-busy="true" aria-label="Загрузка профиля">
    <!-- Шапка — 1:1 StaffProfileHeader -->
    <div class="staff-profile-page__card">
      <section class="sk-header">
        <div class="sk-header__top">
          <div class="sk-header__top-start">
            <div class="sk-header__badges">
              <SkeletonBone width="104px" height="22px" pill />
              <SkeletonBone width="118px" height="22px" pill />
            </div>
          </div>

          <div class="sk-header__avatar-wrap">
            <SkeletonBone width="96px" height="96px" :rounded="false" class="sk-header__avatar" />
          </div>

          <div class="sk-header__actions">
            <SkeletonBone width="48px" height="48px" class="sk-header__icon-btn" />
            <SkeletonBone width="48px" height="48px" class="sk-header__icon-btn" />
          </div>
        </div>

        <div class="sk-header__identity">
          <SkeletonBone width="min(320px, 72%)" height="32px" class="sk-header__name" />
          <SkeletonBone width="min(180px, 42%)" height="24px" class="sk-header__location" />
        </div>

        <div class="sk-header__contacts">
          <div v-for="n in 3" :key="`contact-${n}`" class="sk-header__contact">
            <SkeletonBone
              :width="n === 1 ? '148px' : n === 2 ? '132px' : '168px'"
              height="40px"
              class="sk-header__contact-main"
            />
            <SkeletonBone width="40px" height="40px" class="sk-header__contact-copy" />
          </div>
        </div>
      </section>
    </div>

    <!-- Табы — 1:1 StaffProfileTabs в card--tabs -->
    <div class="staff-profile-page__card staff-profile-page__card--tabs">
      <div class="sk-tabs" role="presentation">
        <SkeletonBone
          v-for="n in 6"
          :key="`tab-${n}`"
          height="40px"
          class="sk-tabs__btn"
          :class="{ 'sk-tabs__btn--active': n === 1 }"
        />
      </div>
    </div>

    <!-- Обзор — 1:1 StaffProfileOverviewTab -->
    <div class="staff-profile-page__card staff-profile-page__card--plain">
      <section class="sk-overview">
        <div class="sk-overview__summary">
          <article
            v-for="card in summaryCards"
            :key="card.id"
            class="sk-overview-card"
          >
            <div class="sk-overview-card__head">
              <div class="sk-overview-card__lead">
                <SkeletonBone :width="card.titleWidth" height="20px" />
                <SkeletonBone width="48px" height="36px" />
              </div>
              <SkeletonBone width="20px" height="20px" class="sk-overview-card__chevron" />
            </div>
            <ul class="sk-overview-card__metrics" role="presentation">
              <li
                v-for="(metric, idx) in card.metrics"
                :key="`${card.id}-m-${idx}`"
                class="sk-overview-card__metric"
              >
                <SkeletonBone :width="metric.labelWidth" height="18px" />
                <SkeletonBone :width="metric.valueWidth" height="18px" />
              </li>
            </ul>
          </article>
        </div>

        <div class="sk-overview__columns">
          <section class="sk-overview-panel">
            <SkeletonBone width="168px" height="22px" />
            <div class="sk-overview-attention">
              <div
                v-for="n in 4"
                :key="`att-${n}`"
                class="sk-overview-attention__row"
              >
                <div class="sk-overview-attention__main">
                  <SkeletonBone width="40px" height="40px" class="sk-overview-attention__icon" />
                  <div class="sk-overview-attention__body">
                    <SkeletonBone :width="n % 2 ? '112px' : '96px'" height="20px" />
                    <SkeletonBone :width="n % 2 ? '88px' : '104px'" height="18px" />
                  </div>
                  <SkeletonBone
                    v-if="n % 2 === 0"
                    width="24px"
                    height="24px"
                    class="sk-overview-attention__chevron"
                  />
                </div>
                <SkeletonBone
                  v-if="n % 2 === 1"
                  width="48px"
                  height="48px"
                  class="sk-overview-attention__notify"
                />
              </div>
            </div>
          </section>

          <section class="sk-overview-panel">
            <div class="sk-overview-panel__title-row">
              <SkeletonBone width="196px" height="22px" />
              <SkeletonBone width="20px" height="20px" />
            </div>
            <StaffProfileListSkeleton variant="overview-history" :rows="4" />
          </section>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import SkeletonBone from '@/shared/ui/skeleton/SkeletonBone.vue'
import StaffProfileListSkeleton from './StaffProfileListSkeleton.vue'

const summaryCards = [
  {
    id: 'documents',
    titleWidth: '96px',
    metrics: [
      { labelWidth: '108px', valueWidth: '20px' },
      { labelWidth: '128px', valueWidth: '20px' },
      { labelWidth: '84px', valueWidth: '20px' },
    ],
  },
  {
    id: 'projects',
    titleWidth: '72px',
    metrics: [
      { labelWidth: '120px', valueWidth: '56px' },
      { labelWidth: '100px', valueWidth: '72px' },
    ],
  },
  {
    id: 'other',
    titleWidth: '148px',
    metrics: [
      { labelWidth: '108px', valueWidth: '20px' },
      { labelWidth: '128px', valueWidth: '20px' },
      { labelWidth: '84px', valueWidth: '20px' },
    ],
  },
] as const
</script>

<style scoped>
.staff-profile-skeleton {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.staff-profile-page__card {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  padding: var(--rr-spacing-padding-2-xl, 20px);
  border-radius: var(--rr-radius-2-xl, 20px);
  background: var(--rr-backgrounds-primary, #fff);
}

.staff-profile-page__card--tabs {
  display: flex;
  align-items: center;
  width: 100%;
  height: 60px;
  gap: 10px;
  padding: 8px;
  border-radius: var(--rr-radius-2-xl, 20px);
}

.staff-profile-page__card--plain {
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  border-radius: 0;
  background: transparent;
}

/* —— Header —— */
.sk-header {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sk-header__top {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 96px minmax(0, 1fr);
  align-items: start;
  column-gap: 12px;
}

.sk-header__top-start {
  display: flex;
  align-items: flex-start;
  min-width: 0;
}

.sk-header__badges {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  min-width: 0;
}

.sk-header__avatar-wrap {
  display: grid;
  place-items: center;
  width: 96px;
  height: 96px;
  flex-shrink: 0;
  border-radius: 14px;
  overflow: hidden;
}

.sk-header__avatar {
  border-radius: 14px !important;
}

.sk-header__actions {
  justify-self: end;
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 48px;
}

.sk-header__icon-btn {
  border-radius: 8px !important;
}

.sk-header__identity {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  text-align: center;
}

.sk-header__name,
.sk-header__location {
  margin-inline: auto;
}

.sk-header__contacts {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 12px;
}

.sk-header__contact {
  display: flex;
  align-items: stretch;
  height: 40px;
  gap: 1px;
}

.sk-header__contact-main {
  border-radius: 8px 0 0 8px !important;
}

.sk-header__contact-copy {
  border-radius: 0 8px 8px 0 !important;
}

/* —— Tabs —— */
.sk-tabs {
  display: flex;
  flex: 1 1 auto;
  flex-wrap: nowrap;
  align-items: stretch;
  gap: var(--rr-spacing-padding-m, 8px);
  width: 100%;
  min-width: 0;
}

.sk-tabs__btn {
  flex: 1 1 0;
  width: 0;
  min-width: 0;
  border-radius: 10px !important;
}

.sk-tabs__btn--active {
  opacity: 0.85;
}

/* —— Overview —— */
.sk-overview {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  min-width: 0;
}

.sk-overview__summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  align-items: stretch;
}

.sk-overview-card {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 32px;
  min-width: 0;
  height: 100%;
  margin: 0;
  padding: 24px;
  border-radius: 24px;
  background: #ffffff;
  justify-content: space-around;
}

.sk-overview-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.sk-overview-card__lead {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.sk-overview-card__chevron {
  flex: 0 0 auto;
  border-radius: 4px !important;
}

.sk-overview-card__metrics {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.sk-overview-card__metric {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.sk-overview__columns {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  align-items: stretch;
}

.sk-overview-panel {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
  min-height: 0;
  height: 100%;
  padding: 16px;
  border-radius: 16px;
  background: #ffffff;
}

.sk-overview-panel__title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
}

.sk-overview-attention {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 8px;
  min-height: 0;
}

.sk-overview-attention__row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.sk-overview-attention__main {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-width: 0;
}

.sk-overview-attention__icon {
  border-radius: 10px !important;
}

.sk-overview-attention__body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.sk-overview-attention__chevron {
  border-radius: 4px !important;
}

.sk-overview-attention__notify {
  border-radius: 8px !important;
}

@media (max-width: 960px) {
  .sk-overview__summary {
    grid-template-columns: 1fr;
  }

  .sk-overview__columns {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .staff-profile-page__card {
    padding: var(--rr-spacing-padding-2-xl, 20px);
    border-radius: var(--rr-radius-2-xl, 20px);
  }

  .staff-profile-page__card--tabs {
    height: 60px;
    padding: 8px;
  }

  .staff-profile-page__card--plain {
    padding: 0;
    border-radius: 0;
  }
}
</style>
