<template>
  <div class="rr-filter-chips-row">
    <slot />
  </div>
</template>

<style scoped>
.rr-filter-chips-row {
  display: inline-flex;
  align-items: stretch;
  gap: 8px;
  min-width: 0;
  max-width: 100%;
}

@media (max-width: 1000px) {
  .rr-filter-chips-row {
    flex-wrap: wrap;
    width: 100%;
  }

  .rr-filter-chips-row :deep(.rr-filter-chip) {
    flex: 1 1 calc(50% - 8px);
    width: auto;
    min-width: 200px;
    max-width: none;
  }
}
</style>
