const CATEGORIES = [
  'succulent',
  'tropical',
  'fern',
  'orchid',
  'cactus',
  'herb',
  'palm',
  'flowering',
  'foliage',
  'other',
] as const

export type PlantCategorySlug = (typeof CATEGORIES)[number]

function appAssetPrefix(): string {
  const config = useRuntimeConfig()
  const base = String(config.app.baseURL || '/')
  return base.endsWith('/') ? base : `${base}/`
}

export function illustrationForCategory(category?: string | null): string {
  const slug = (category || 'other').toLowerCase()
  const known = CATEGORIES.includes(slug as PlantCategorySlug) ? slug : 'other'
  return `${appAssetPrefix()}illustrations/${known}.svg`
}

/** Prefer species photo; fall back to category illustration. */
export function resolveSpeciesImage(imageUrl?: string | null, category?: string | null): string {
  const raw = String(imageUrl || '').trim()
  if (!raw) return illustrationForCategory(category)
  if (/^https?:\/\//i.test(raw) || raw.startsWith('data:')) return raw
  const prefix = appAssetPrefix().replace(/\/$/, '')
  const path = raw.startsWith('/') ? raw : `/${raw.replace(/^\.\//, '')}`
  // Encode path segments so Cyrillic filenames work in CSS url() / <img>
  const encoded = path
    .split('/')
    .map((seg, i) => (i === 0 ? seg : encodeURIComponent(seg)))
    .join('/')
  return `${prefix}${encoded}`
}
