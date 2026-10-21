<template>
  <div class="app-table-wrap">
    <BibliBaseTable
      v-bind="attrs"
      :columns="props.columns"
      :items="safeItems"
      :loading="props.loading"
      :show-actions="props.showActions"
    >
      <template v-for="(_, slotName) in slots" #[slotName]="slotProps">
        <slot :name="slotName" v-bind="slotProps || {}" />
      </template>
    </BibliBaseTable>
  </div>
</template>

<script setup lang="ts">
import { computed, useAttrs, useSlots } from 'vue'
import BaseTable from '../BaseTable/BaseTable.vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    columns?: any[]
    items?: any[]
    loading?: boolean
    showActions?: boolean
  }>(),
  {
    columns: () => [],
    items: () => [],
    loading: false,
    showActions: false,
  },
)

const attrs = useAttrs()
const slots = useSlots()

const safeItems = computed(() => (props.loading ? [] : props.items))
const BibliBaseTable = BaseTable
</script>

<style scoped>
.app-table-wrap {
  position: relative;
}
</style>
