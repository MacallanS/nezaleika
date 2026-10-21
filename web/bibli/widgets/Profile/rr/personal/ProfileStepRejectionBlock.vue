<template>
  <div class="profile-step-rejection">
    <button
      type="button"
      class="profile-step-rejection__toggle"
      :aria-expanded="expanded"
      @click="expanded = !expanded"
    >
      <span class="profile-step-rejection__title">Причина отклонения раздела</span>
      <span class="profile-step-rejection__chevron" :class="{ 'is-open': expanded }" aria-hidden="true">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
            d="M7.5 9.5L12 14l4.5-4.5"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </span>
    </button>

    <div v-show="expanded" class="profile-step-rejection__body">
      <p v-if="reasonLabel" class="profile-step-rejection__reason">{{ reasonLabel }}</p>
      <p v-if="comment" class="profile-step-rejection__hint">{{ comment }}</p>
      <p v-else-if="hint" class="profile-step-rejection__hint">{{ hint }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  reasonLabel: { type: String, default: '' },
  comment: { type: String, default: '' },
  hint: { type: String, default: '' },
})

const expanded = ref(true)
</script>

<style scoped>
.profile-step-rejection {
  display: flex;
  flex-direction: column;
  gap: var(--rr-spacing-padding-s);
  padding: var(--rr-spacing-padding-l) 0;
  border-radius: var(--rr-radius-xl);
  background: var(--rr-backgrounds-primary);
  box-shadow: 0 var(--rr-px-1, 1px) var(--rr-px-2, 2px) var(--rr-fx-shadow-penumbra);
}

.profile-step-rejection__toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--rr-spacing-padding-m);
  width: 100%;
  margin: 0;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--rr-labels-neutral-primary);
  cursor: pointer;
  text-align: left;
}

.profile-step-rejection__title {
  font-family: var(--rr-font-family-font-family, Manrope, system-ui, sans-serif);
  font-weight: 600;
  font-size: var(--rr-font-size-font-size-m);
  line-height: var(--rr-line-height-line-height-m);
  letter-spacing: var(--rr-tracking-tracking-m);
}

.profile-step-rejection__chevron {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  color: var(--rr-labels-neutral-primary);
  transition: transform 0.2s ease;
}

.profile-step-rejection__chevron.is-open {
  transform: rotate(180deg);
}

.profile-step-rejection__body {
  display: flex;
  flex-direction: column;
  gap: var(--rr-spacing-padding-xs);
}

.profile-step-rejection__reason {
  margin: 0;
  font-size: var(--rr-font-size-font-size-m);
  line-height: var(--rr-line-height-line-height-m);
  color: var(--rr-labels-neutral-primary);
}

.profile-step-rejection__hint {
  margin: 0;
  font-size: var(--rr-font-size-font-size-s);
  line-height: var(--rr-line-height-line-height-s);
  color: var(--rr-labels-neutral-secondary);
}
</style>
