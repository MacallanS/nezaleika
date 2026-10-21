<template>
  <div class="current-project-switcher" :class="{ 'is-empty': !hasProjects }">
    <div v-if="!hasProjects" class="project-switcher-empty">
      <i class="pi pi-folder-open"></i>
      <span>Нет доступных проектов</span>
    </div>
    <!-- <div v-else-if="showSingleProjectBadge" class="project-switcher-single">
      <span class="project-switcher-single-label">Ваш проект</span>
      <span class="project-switcher-single-value">{{ currentProjectOption?.name }}</span>
    </div> -->
    <ProjectSelect
      v-else
      :model-value="resolvedValue"
      :options="projectOptions"
      :placeholder="placeholder"
      :disabled="disabled || projectSwitching || projectOptions.length <= 1"
      @update:model-value="handleChange"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ProjectSelect } from '../../shared/ui'

type ProjectOption = { id: string | number; name: string }

const props = withDefaults(
  defineProps<{
    projectOptions?: ProjectOption[]
    currentProjectId?: string | number | null
    projectSwitching?: boolean
    disabled?: boolean
    placeholder?: string
  }>(),
  {
    projectOptions: () => [],
    currentProjectId: null,
    projectSwitching: false,
    disabled: false,
    placeholder: 'Проект',
  },
)

const emit = defineEmits<{ (e: 'change', value: string | number | null): void }>()
const hasProjects = computed(() => props.projectOptions.length > 0)
// const currentProjectOption = computed(() => {
//   if (!props.projectOptions.length) return null
//   if (props.currentProjectId != null && props.currentProjectId !== '') {
//     const matchedProject = props.projectOptions.find((project: ProjectOption) => String(project.id) === String(props.currentProjectId))
//     if (matchedProject) return matchedProject
//   }
//   return props.projectOptions[0] ?? null
// })
// const showSingleProjectBadge = computed(() => props.projectOptions.length === 1 && Boolean(currentProjectOption.value))
const resolvedValue = computed(() => (props.currentProjectId != null && props.currentProjectId !== '' ? props.currentProjectId : null))
function handleChange(value: string | number | null) {
  emit('change', value)
}
</script>

<style scoped>
.current-project-switcher {
  width: 100%;
  min-width: 0;
}

.project-switcher-empty {
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 0 14px;
  border-radius: 12px;
  border: 1px dashed var(--russ-border);
  background: var(--russ-bg-hover);
  color: var(--russ-text-tertiary);
  font-weight: 600;
  font-size: 13px;
  box-sizing: border-box;
}

.project-switcher-empty i {
  color: var(--russ-primary);
  opacity: 0.75;
}

/* .project-switcher-single {
  min-height: 44px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 2px;
  width: 100%;
  padding: 10px 14px;
  border-radius: 12px;
  border: 1px solid var(--russ-border);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(246, 249, 255, 0.98) 100%);
  box-shadow: 0 8px 22px rgba(47, 68, 141, 0.08);
  box-sizing: border-box;
}

.project-switcher-single-label {
  font-size: 11px;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--russ-text-tertiary);
}

.project-switcher-single-value {
  font-size: 14px;
  font-weight: 700;
  line-height: 1.3;
  color: var(--russ-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
} */
</style>
