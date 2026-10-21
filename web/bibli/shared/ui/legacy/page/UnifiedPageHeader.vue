<template>
  <section
    class="unified-page-header"
    :class="{
      compact,
      'stack-on-mobile': stackOnMobile,
      'actions-nowrap': !actionsWrap,
      'has-tabs-row': !!$slots.tabs,
    }"
  >
    <div v-if="showHeaderMain" class="header-main">
      <div v-if="hasTitleBlock" class="title-block">
        <div v-if="$slots.leading" class="leading">
          <slot name="leading" />
        </div>
        <h1 v-if="title" class="title">{{ title }}</h1>
        <div v-if="hasSubtitle" class="subtitle">
          <slot name="subtitle">{{ subtitle }}</slot>
        </div>
      </div>

      <div v-if="$slots.actions" class="actions">
        <slot name="actions" />
      </div>
    </div>

    <div v-if="$slots.tabs" class="tabs">
      <slot name="tabs" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, useSlots } from 'vue'

const props = withDefaults(
  defineProps<{
    title?: string
    subtitle?: string
    compact?: boolean
    stackOnMobile?: boolean
    actionsWrap?: boolean
  }>(),
  {
    title: '',
    subtitle: '',
    compact: false,
    stackOnMobile: true,
    actionsWrap: true,
  },
)

const slots = useSlots()
const hasSubtitle = computed(() => !!props.subtitle || !!slots.subtitle)
const hasTitleBlock = computed(() => !!props.title || hasSubtitle.value || !!slots.leading)
const showHeaderMain = computed(() => hasTitleBlock.value || !!slots.actions)
</script>

<style scoped>
.unified-page-header {
  --header-control-height: var(--ui-header-control-height, 48px);
  display: flex;
  flex-direction: column;
  min-width: 0;
  width: 100%;
  margin-bottom: var(--ui-tabs-wrapper-margin-bottom);
}
.header-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-width: 0;
  width: 100%;
}
.title-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  flex: 1 1 auto;
}
.title {
  margin: 0;
  font-size: 24px;
  font-weight: 800;
  color: var(--russ-text-primary);
  line-height: 1.2;
}
.subtitle {
  font-size: 14px;
  color: var(--russ-text-tertiary);
}
.actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  flex-wrap: wrap;
  min-width: 0;
  flex: 0 1 auto;
}
.actions-nowrap .actions {
  flex-wrap: nowrap;
}
.actions > * {
  min-width: 0;
}
.tabs {
  min-width: 0;
  width: 100%;
}
.unified-page-header.has-tabs-row {
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
}
.unified-page-header.has-tabs-row .header-main {
  flex: 0 0 auto;
  min-width: 0;
  width: auto;
  max-width: 100%;
  order: 2;
}
.unified-page-header.has-tabs-row .tabs {
  width: auto;
  flex: 1 1 auto;
  min-width: 0;
  white-space: nowrap;
  order: 1;
}
.unified-page-header.has-tabs-row .actions {
  flex-wrap: nowrap;
  white-space: nowrap;
}
.compact {
  margin-bottom: 14px;
}
@media (max-width: 1024px) {
  .actions {
    gap: 10px;
  }
}
@media (max-width: 768px) {
  .unified-page-header.has-tabs-row .header-main {
    flex-direction: row !important;
    align-items: center !important;
    flex-wrap: nowrap;
  }
  .unified-page-header.has-tabs-row .actions {
    width: auto !important;
    justify-content: flex-end !important;
  }
  .unified-page-header.has-tabs-row .actions > * {
    width: auto !important;
  }
  .stack-on-mobile .header-main {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  .stack-on-mobile .actions {
    justify-content: stretch;
    width: 100%;
  }
  .stack-on-mobile .actions > * {
    width: 100%;
  }
}
</style>
