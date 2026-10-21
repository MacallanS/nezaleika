<template>
  <span
    class="rr-status-badge"
    :class="[`rr-status-badge--${resolvedPreset.tone}`, `rr-status-badge--${size}`]"
  >
    <span class="rr-status-badge__icon">
      <RrStatusBadgeIcon :icon="resolvedPreset.icon" />
    </span>
    <span v-if="label" class="rr-status-badge__label">{{ label }}</span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import RrStatusBadgeIcon from './RrStatusBadgeIcon.vue'
import {
  resolveRrStatusPreset,
  type RrStatusIcon,
  type RrStatusPreset,
  type RrStatusResolveInput,
  type RrStatusTone,
} from '../lib/rrStatusPresets'
import './rr-status-badge.css'

const props = withDefaults(defineProps<{
  label?: string | null
  id?: string | number | null
  name?: string | null
  kind?: RrStatusResolveInput['kind']
  tone?: RrStatusTone | null
  icon?: RrStatusIcon | null
  preset?: RrStatusPreset | null
  size?: 'sm' | 'md'
}>(), {
  label: null,
  id: null,
  name: null,
  kind: 'auto',
  tone: null,
  icon: null,
  preset: null,
  size: 'sm',
})

const resolvedPreset = computed<RrStatusPreset>(() => {
  if (props.preset) {
    return props.preset
  }

  const base = resolveRrStatusPreset({
    id: props.id,
    name: props.name ?? props.label,
    kind: props.kind,
  })

  return {
    tone: props.tone ?? base.tone,
    icon: props.icon ?? base.icon,
  }
})
</script>
