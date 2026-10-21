export type RrStatusTone = 'neutral' | 'info' | 'warning' | 'danger' | 'success'

export type RrStatusIcon = 'disc' | 'play' | 'pause' | 'stop' | 'check' | 'sync'

export interface RrStatusPreset {
  tone: RrStatusTone
  icon: RrStatusIcon
}

export interface RrStatusResolveInput {
  id?: string | number | null
  name?: string | null
  kind?: 'registration' | 'signing' | 'onec' | 'auto'
}

const REGISTRATION_BY_ID: Record<string, RrStatusPreset> = {
  new: { tone: 'neutral', icon: 'disc' },
  filling: { tone: 'info', icon: 'play' },
  review: { tone: 'warning', icon: 'pause' },
  remarks: { tone: 'danger', icon: 'stop' },
  accepted: { tone: 'success', icon: 'check' },
}

const SIGNING_BY_ID: Record<string, RrStatusPreset> = {
  waiting: { tone: 'neutral', icon: 'disc' },
  waiting_send: { tone: 'info', icon: 'play' },
  on_signing: { tone: 'warning', icon: 'pause' },
  signed: { tone: 'success', icon: 'check' },
  suspended: { tone: 'danger', icon: 'stop' },
}

const ONEC_BY_ID: Record<string, RrStatusPreset> = {
  pending: { tone: 'neutral', icon: 'disc' },
  success: { tone: 'success', icon: 'check' },
  needs_resync: { tone: 'warning', icon: 'sync' },
  skipped_not_smz: { tone: 'neutral', icon: 'disc' },
  failed_validation: { tone: 'danger', icon: 'stop' },
  failed_transport: { tone: 'danger', icon: 'stop' },
  failed_onec: { tone: 'danger', icon: 'stop' },
}

const NAME_RULES: Array<{ test: (normalized: string) => boolean; preset: RrStatusPreset }> = [
  {
    test: (n) => n === 'новая',
    preset: { tone: 'neutral', icon: 'disc' },
  },
  {
    test: (n) => n.includes('заполняет'),
    preset: { tone: 'info', icon: 'play' },
  },
  {
    test: (n) => n.includes('ждет отправки') || n.includes('ждёт отправки'),
    preset: { tone: 'info', icon: 'play' },
  },
  {
    test: (n) => n.includes('на проверке') || n.includes('ожидает провер'),
    preset: { tone: 'warning', icon: 'pause' },
  },
  {
    test: (n) =>
      (n.includes('требуетс') && n.includes('доработ'))
      || n.includes('есть замечан')
      || n.includes('внести правк'),
    preset: { tone: 'danger', icon: 'stop' },
  },
  {
    test: (n) =>
      n.includes('готов к приему')
      || n.includes('готов к приёму')
      || n === 'готово',
    preset: { tone: 'success', icon: 'check' },
  },
  {
    test: (n) => n.includes('оформлен'),
    preset: { tone: 'success', icon: 'check' },
  },
  {
    test: (n) => n.includes('выгруз'),
    preset: { tone: 'warning', icon: 'sync' },
  },
  {
    test: (n) => n.includes('ошибка 1с') || n.includes('ошибка 1c') || n.includes('ошибка данн') || n.includes('ошибка сет'),
    preset: { tone: 'danger', icon: 'stop' },
  },
  {
    test: (n) => n.includes('замеч'),
    preset: { tone: 'danger', icon: 'stop' },
  },
  {
    test: (n) => n.startsWith('провер'),
    preset: { tone: 'warning', icon: 'pause' },
  },
  {
    test: (n) => n.startsWith('отправлен'),
    preset: { tone: 'neutral', icon: 'pause' },
  },
  {
    test: (n) => n.startsWith('просроч'),
    preset: { tone: 'danger', icon: 'stop' },
  },
  {
    test: (n) => n.includes('приостанов'),
    preset: { tone: 'danger', icon: 'stop' },
  },
  {
    test: (n) => n.includes('на подписан'),
    preset: { tone: 'warning', icon: 'pause' },
  },
  {
    test: (n) => n.startsWith('подписан'),
    preset: { tone: 'success', icon: 'check' },
  },
  {
    test: (n) => n.includes('успеш'),
    preset: { tone: 'success', icon: 'check' },
  },
  {
    test: (n) => n.startsWith('ожидает'),
    preset: { tone: 'neutral', icon: 'disc' },
  },
  {
    test: (n) => n.includes('вручную') || n.includes('не выгруж'),
    preset: { tone: 'neutral', icon: 'disc' },
  },
]

export const RR_STATUS_NEUTRAL_PRESET: RrStatusPreset = { tone: 'neutral', icon: 'disc' }

export function normalizeRrStatusName(name?: string | null): string {
  return String(name ?? '')
    .trim()
    .toLowerCase()
    .replace(/ё/g, 'е')
}

export function resolveRrStatusPresetByName(name?: string | null): RrStatusPreset | null {
  const normalized = normalizeRrStatusName(name)
  if (!normalized) return null

  for (const rule of NAME_RULES) {
    if (rule.test(normalized)) {
      return rule.preset
    }
  }

  return null
}

export function resolveRrStatusPreset(input: RrStatusResolveInput = {}): RrStatusPreset {
  const id = input.id != null ? String(input.id).trim() : ''
  const kind = input.kind ?? 'auto'

  if (kind === 'registration' || kind === 'auto') {
    if (id && REGISTRATION_BY_ID[id]) {
      return REGISTRATION_BY_ID[id]
    }
  }

  if (kind === 'signing' || kind === 'auto') {
    if (id && SIGNING_BY_ID[id]) {
      return SIGNING_BY_ID[id]
    }
  }

  if (kind === 'onec' || kind === 'auto') {
    if (id && ONEC_BY_ID[id]) {
      return ONEC_BY_ID[id]
    }
    if (id.startsWith('failed_')) {
      return { tone: 'danger', icon: 'stop' }
    }
  }

  const fromName = resolveRrStatusPresetByName(input.name)
  if (fromName) {
    return fromName
  }

  return RR_STATUS_NEUTRAL_PRESET
}

/** Inline style map for legacy callers that still use :style on a span. */
export function rrStatusPresetToInlineStyle(preset: RrStatusPreset): {
  background: string
  color: string
  border: string
} {
  const toneVars: Record<RrStatusTone, { background: string; color: string; border: string }> = {
    neutral: {
      background: 'var(--rr-backgrounds-quaternary, #f2f3f7)',
      color: 'var(--rr-labels-neutral-primary, #101012)',
      border: 'transparent',
    },
    info: {
      background: 'var(--rr-fills-info-primary, rgba(62, 135, 255, 0.12))',
      color: 'var(--rr-labels-info-primary, #3e87ff)',
      border: 'transparent',
    },
    warning: {
      background: 'var(--rr-fills-warning-primary, rgba(255, 161, 0, 0.12))',
      color: 'var(--rr-labels-warning-primary, #ed6702)',
      border: 'transparent',
    },
    danger: {
      background: 'var(--rr-fills-danger-primary, #fbe5e5)',
      color: 'var(--rr-labels-danger-primary, #dc2626)',
      border: 'transparent',
    },
    success: {
      background: 'var(--rr-accent-derivable-mint-mint-12, #e0f8f7)',
      color: 'var(--rr-accent-mint, #00c7be)',
      border: 'transparent',
    },
  }

  return toneVars[preset.tone]
}
