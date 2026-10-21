export * from './types';
export { mergeTheme } from './mergeTheme';
export { applyTheme, clearTheme } from './applyTheme';
export { generateBrandedQr } from './generateBrandedQr';
export {
  extractDominantColorFromLogo,
  extractDominantColorFromImageData,
} from './extractDominantColorFromLogo';
export type { DominantColorInput } from './extractDominantColorFromLogo';
export {
  getPresetTokens,
  platformPreset,
  pilotPreset,
  magnitPreset,
  yandexPreset,
  otpPreset,
  fiveCardsPreset,
} from './presets';

export { default as IssuanceQrShell } from './shells/IssuanceQrShell.vue';
export { default as IssuanceDualQrShell } from './shells/IssuanceDualQrShell.vue';
export { default as IssuanceConsentShell } from './shells/IssuanceConsentShell.vue';

import './issuance-shell.css';
