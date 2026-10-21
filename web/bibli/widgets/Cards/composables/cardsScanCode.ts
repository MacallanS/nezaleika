/** Нормализация для сравнения дублей (бэк отдельно нормализует при сохранении). */
export function normalizeScanCode(raw: string): string {
  return String(raw || "")
    .trim()
    .replace(/\s+/g, "")
    .toUpperCase()
}

export function scanListHasCode(list: readonly string[], raw: string): boolean {
  const needle = normalizeScanCode(raw)
  if (!needle) return false
  return list.some((item) => normalizeScanCode(item) === needle)
}

/** Подробное сообщение при повторном скане той же карты. */
export function duplicateCardScanMessage(raw: string): string {
  const code = String(raw || "").trim()
  const short =
    code.length > 28 ? `${code.slice(0, 24)}…` : code || "без номера"
  return `Карта «${short}» уже была отсканирована в этом списке. Повтор не добавлен — проверьте чипы ниже.`
}

export function duplicateBoxScanMessage(boxId: number): string {
  return `Коробка #${boxId} уже отмечена. Повторный скан не добавил её снова.`
}
