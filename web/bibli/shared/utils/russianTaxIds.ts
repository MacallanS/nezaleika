/** Цифры без маски. */
export function taxDigitsOnly(value: string | null | undefined): string {
  return String(value ?? '').replace(/\D+/g, '')
}

function innCheckDigit(digits: number[], coefficients: number[]): number {
  const sum = coefficients.reduce((acc, coef, i) => acc + coef * digits[i], 0)
  return (sum % 11) % 10
}

/** ИНН юрлица / банка: 10 цифр с контрольным разрядом. */
export function isValidInn10(inn: string | null | undefined): boolean {
  const value = taxDigitsOnly(inn)
  if (!/^\d{10}$/.test(value)) return false
  const digits = value.split('').map(Number)
  return innCheckDigit(digits, [2, 4, 10, 3, 5, 9, 4, 6, 8]) === digits[9]
}

/** ИНН физлица / ИП: 12 цифр с двумя контрольными разрядами. */
export function isValidInn12(inn: string | null | undefined): boolean {
  const value = taxDigitsOnly(inn)
  if (!/^\d{12}$/.test(value)) return false
  const digits = value.split('').map(Number)
  const n11 = innCheckDigit(digits, [7, 2, 4, 10, 3, 5, 9, 4, 6, 8])
  const n12 = innCheckDigit(digits, [3, 7, 2, 4, 10, 3, 5, 9, 4, 6, 8])
  return n11 === digits[10] && n12 === digits[11]
}

/**
 * СНИЛС: 11 цифр, контрольное число (последние 2).
 * Номера ≤ 001-001-998 выдавались до введения checksum — для них контроль не применяется.
 */
export function isValidSnils(snils: string | null | undefined): boolean {
  const value = taxDigitsOnly(snils)
  if (!/^\d{11}$/.test(value)) return false

  const body = Number(value.slice(0, 9))
  if (!Number.isSafeInteger(body)) return false
  if (body <= 1_001_998) return true

  let sum = 0
  for (let i = 0; i < 9; i += 1) {
    sum += Number(value[i]) * (9 - i)
  }
  let check = sum % 101
  if (check === 100) check = 0
  return check === Number(value.slice(9, 11))
}

/**
 * ОГРНИП: 15 цифр.
 * Контроль: (число из первых 14 цифр) % 13 % 10 === последняя цифра.
 */
export function isValidOgrnip(ogrnip: string | null | undefined): boolean {
  const value = taxDigitsOnly(ogrnip)
  if (!/^\d{15}$/.test(value)) return false
  const base = Number(value.slice(0, 14))
  if (!Number.isSafeInteger(base)) return false
  return (base % 13) % 10 === Number(value[14])
}
