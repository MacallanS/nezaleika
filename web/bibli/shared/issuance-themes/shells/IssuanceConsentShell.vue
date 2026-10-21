<template>
  <div ref="shellRef" class="issuance-shell issuance-shell--consent">
    <div class="issuance-shell__consent-card">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { applyTheme, clearTheme } from '../applyTheme';
import { mergeTheme } from '../mergeTheme';
import type { IssuanceThemeTokens, ThemeOverrides, ThemePreset } from '../types';
import '../issuance-shell.css';

interface Props {
  theme?: IssuanceThemeTokens;
  preset?: ThemePreset;
  /** Ignored in v1 — consent uses preset tokens only. */
  overrides?: ThemeOverrides | null;
}

const props = withDefaults(defineProps<Props>(), {
  preset: 'platform',
});

const shellRef = ref<HTMLElement | null>(null);

const theme = computed(() =>
  props.theme ??
    mergeTheme(props.preset, props.overrides, {
      variant: 'consent',
      ignoreOverrides: true,
    }),
);

function applyShellTheme() {
  if (shellRef.value) {
    applyTheme(shellRef.value, theme.value);
  }
}

onMounted(applyShellTheme);

watch(theme, applyShellTheme);

onUnmounted(() => {
  if (shellRef.value) {
    clearTheme(shellRef.value);
  }
});
</script>

<style scoped>
.issuance-shell--consent {
  display: flex;
  justify-content: center;
  padding: 24px 16px;
  box-sizing: border-box;
}

.issuance-shell__consent-card {
  width: min(100%, 640px);
  padding: 24px;
  box-sizing: border-box;
}
</style>
