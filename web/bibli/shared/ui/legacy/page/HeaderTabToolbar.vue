<template>
  <div class="header-tab-toolbar">
    <button type="button" class="tab-btn active">
      <slot />
    </button>
    <button
      v-if="showCreate"
      type="button"
      class="invite-btn"
      :disabled="createDisabled"
      @click="emit('create')"
    >
      {{ createLabel }}
    </button>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    showCreate?: boolean
    createLabel?: string
    createDisabled?: boolean
  }>(),
  {
    showCreate: false,
    createLabel: '+ Новый пользователь',
    createDisabled: false,
  },
)

const emit = defineEmits<{ create: [] }>()
</script>

<style scoped>
.header-tab-toolbar { display: flex; align-items: center; justify-content: space-between; gap: var(--ui-tab-gap); width: 100%; min-width: 0; }
.tab-btn { box-sizing: border-box; min-height: var(--header-control-height, var(--ui-header-control-height)); padding: var(--ui-tab-pad-y) var(--ui-tab-pad-x); border-radius: var(--ui-tab-radius); border: 1px solid var(--russ-primary); background: none; color: var(--russ-info-text); font-family: var(--russ-font-family); font-size: var(--ui-tab-font-size); font-weight: var(--ui-tab-font-weight); line-height: var(--ui-tab-line-height); cursor: pointer; display: inline-flex; align-items: center; justify-content: center; white-space: nowrap; }
.tab-btn:hover:not(:disabled) { border-color: var(--russ-primary-dark); color: var(--russ-primary-dark); }
.tab-btn.active { background: var(--russ-primary); color: var(--russ-text-inverse); border-color: var(--russ-primary); }
.tab-btn.active:hover:not(:disabled) { background: var(--russ-primary-dark); border-color: var(--russ-primary-dark); }
.invite-btn { box-sizing: border-box; min-height: var(--header-control-height, var(--ui-header-control-height)); padding: var(--ui-tab-pad-y) var(--ui-tab-pad-x); border-radius: var(--ui-tab-radius); border: none; background: var(--russ-primary); color: var(--russ-text-inverse); font-size: var(--ui-tab-font-size); font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; white-space: nowrap; }
.invite-btn:hover:not(:disabled) { background: var(--russ-primary-dark); }
.invite-btn:disabled { opacity: 0.6; cursor: not-allowed; }
@media (max-width: 768px) {
  .header-tab-toolbar { gap: 8px; }
  .tab-btn, .invite-btn { min-height: 0 !important; padding: 8px 12px !important; font-size: 14px !important; }
}
@media (max-width: 600px) {
  .header-tab-toolbar { flex-direction: column; align-items: stretch; gap: 6px; }
  .tab-btn, .invite-btn { width: 100%; }
}
</style>
