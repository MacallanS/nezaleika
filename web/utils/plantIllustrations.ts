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

export function illustrationForCategory(category?: string | null): string {
  const slug = (category || 'other').toLowerCase()
  const known = CATEGORIES.includes(slug as PlantCategorySlug) ? slug : 'other'
  const config = useRuntimeConfig()
  const base = String(config.app.baseURL || '/')
  const prefix = base.endsWith('/') ? base : `${base}/`
  return `${prefix}illustrations/${known}.jpg`
}
