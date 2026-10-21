/**
 * Resolve a raw OCR address string through DaData suggest API.
 * Returns the best suggestion value, or the original query on miss/error.
 */
export async function resolveAddressViaSuggest(
  suggestAddress: ((payload: {
    query: string
    count?: number
  }) => Promise<{ suggestions?: Array<{ value?: string }> } | null | undefined>) | undefined,
  rawAddress: string,
): Promise<string> {
  const query = String(rawAddress || '')
    .replace(/\[рукопись\]/gi, '')
    .replace(/\n+/g, ', ')
    .replace(/\s+,/g, ',')
    .replace(/,\s*,+/g, ', ')
    .replace(/^[\s,]+|[\s,]+$/g, '')
    .trim()
  if (!query || typeof suggestAddress !== 'function') return query

  try {
    const res = await suggestAddress({ query, count: 5 })
    const list = Array.isArray(res?.suggestions) ? res.suggestions : []
    const best = list.find((item) => String(item?.value || '').trim())
    if (best?.value) return String(best.value).trim()
  } catch {
    /* keep OCR text */
  }
  return query
}
