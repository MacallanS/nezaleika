<template>
  <section class="section" :class="`section--${tone}`">
    <button type="button" class="section__head" :aria-expanded="open" @click="open = !open">
      <svg class="section__chevron" :class="{ 'section__chevron--open': open }" viewBox="0 0 16 16" aria-hidden="true">
        <path d="M6 4l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
      </svg>
      <span class="section__title">{{ title }}</span>
      <span class="section__count">{{ count }}</span>
    </button>
    <div v-show="open" class="section__list">
      <slot />
    </div>
  </section>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{ title: string; count: number; tone?: 'overdue' | 'normal' | 'done'; defaultOpen?: boolean }>(),
  { tone: 'normal', defaultOpen: true },
)

const open = ref(props.defaultOpen)
</script>

<style scoped>
.section {
  margin: 0 12px 12px;
  border-radius: 16px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 1px 2px rgba(16, 24, 40, 0.05);
}
.section__head {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 12px 16px 8px;
  border: none;
  background: none;
  font: inherit;
  text-align: left;
  cursor: pointer;
  color: #1c2326;
}
.section__chevron {
  width: 14px;
  height: 14px;
  color: #9aa5ad;
  transition: transform 0.18s;
}
.section__chevron--open {
  transform: rotate(90deg);
}
.section__title {
  font-size: 14px;
  font-weight: 700;
}
.section--overdue .section__title {
  color: #d32f2f;
}
.section--done .section__title {
  color: #7b868c;
}
.section__count {
  margin-left: auto;
  font-size: 13px;
  color: #9aa5ad;
  font-variant-numeric: tabular-nums;
}
.section__list {
  padding-bottom: 4px;
}
</style>
