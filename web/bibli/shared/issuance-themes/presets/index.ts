import type { IssuanceShellVariant, IssuanceThemeTokens, ThemePreset } from '../types';
import { fiveCardsPreset } from './five-cards';
import { magnitPreset } from './magnit';
import { otpPreset } from './otp';
import { pilotPreset } from './pilot';
import { platformPreset } from './platform';
import { yandexPreset } from './yandex';

type PresetFactory = (variant?: IssuanceShellVariant) => IssuanceThemeTokens;

const PRESET_FACTORIES: Record<ThemePreset, PresetFactory> = {
  platform: platformPreset,
  pilot: pilotPreset,
  magnit: magnitPreset,
  yandex: yandexPreset,
  otp: otpPreset,
  five_cards: fiveCardsPreset,
};

export function getPresetTokens(
  preset: ThemePreset,
  variant: IssuanceShellVariant = 'qr',
): IssuanceThemeTokens {
  const factory = PRESET_FACTORIES[preset] ?? PRESET_FACTORIES.platform;
  return factory(variant);
}

export {
  platformPreset,
  pilotPreset,
  magnitPreset,
  yandexPreset,
  otpPreset,
  fiveCardsPreset,
};
