const RS_COEFFICIENTS = [
  7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1,
] as const;

export function digitsOnly(value: string | null | undefined): string {
  return String(value ?? "").replace(/\D+/g, "");
}

/** БИК банка: ровно 9 цифр. */
export function isValidBik(bik: string | null | undefined): boolean {
  return /^\d{9}$/.test(digitsOnly(bik));
}

/**
 * Проверка расчётного счёта (РС) по контрольному числу с учётом БИК.
 * Алгоритм: 3 последних цифры БИК + 20 цифр счёта → сумма произведений на
 * коэффициенты 7,1,3,…; младший разряд суммы должен быть 0.
 */
export function validateRs(
  rs: string | null | undefined,
  bik: string | null | undefined
): boolean {
  const account = digitsOnly(rs);
  const bankBik = digitsOnly(bik);

  if (!/^\d{20}$/.test(account) || !/^\d{9}$/.test(bankBik)) {
    return false;
  }

  const bikRs = bankBik.slice(-3) + account;
  let checksum = 0;
  for (let i = 0; i < RS_COEFFICIENTS.length; i++) {
    checksum += RS_COEFFICIENTS[i] * (Number(bikRs[i]) % 10);
  }

  return checksum % 10 === 0;
}

export function getBankAccountValidationError(
  rs: string | null | undefined,
  bik: string | null | undefined
): string | null {
  const account = digitsOnly(rs);
  const bankBik = digitsOnly(bik);

  if (!bankBik) {
    return "БИК банка обязателен для заполнения";
  }
  if (!/^\d{9}$/.test(bankBik)) {
    return "БИК банка должен содержать ровно 9 цифр";
  }
  if (!account) {
    return "Расчётный счёт обязателен для заполнения";
  }
  if (!/^\d{20}$/.test(account)) {
    return "Расчётный счёт должен содержать ровно 20 цифр";
  }
  if (!validateRs(account, bankBik)) {
    return "Контрольное число расчётного счёта не совпадает с БИК банка";
  }

  return null;
}

/**
 * Проверка корреспондентского счёта (КС) по контрольному числу с учётом БИК.
 * Алгоритм: «0» + цифры БИК[5..6] + 20 цифр счёта → те же коэффициенты, что у РС.
 */
export function validateKs(
  ks: string | null | undefined,
  bik: string | null | undefined
): boolean {
  const account = digitsOnly(ks);
  const bankBik = digitsOnly(bik);

  if (!/^\d{20}$/.test(account) || !/^\d{9}$/.test(bankBik)) {
    return false;
  }

  const bikKs = `0${bankBik.slice(4, 6)}${account}`;
  let checksum = 0;
  for (let i = 0; i < RS_COEFFICIENTS.length; i++) {
    checksum += RS_COEFFICIENTS[i] * (Number(bikKs[i]) % 10);
  }

  return checksum % 10 === 0;
}

export function getCorrespondentAccountValidationError(
  ks: string | null | undefined,
  bik: string | null | undefined
): string | null {
  const account = digitsOnly(ks);
  const bankBik = digitsOnly(bik);

  if (!bankBik) {
    return "БИК банка обязателен для заполнения";
  }
  if (!/^\d{9}$/.test(bankBik)) {
    return "БИК банка должен содержать ровно 9 цифр";
  }
  if (!account) {
    return "Корреспондентский счёт обязателен для заполнения";
  }
  if (!/^\d{20}$/.test(account)) {
    return "Корреспондентский счёт должен содержать ровно 20 цифр";
  }
  if (!validateKs(account, bankBik)) {
    return "Контрольное число корреспондентского счёта не совпадает с БИК банка";
  }

  return null;
}
