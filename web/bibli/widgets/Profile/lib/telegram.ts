/** Убирает @, пробелы и недопустимые символы; максимум 32 символа. */
export function stripTelegramUsername(
  username: string | null | undefined,
): string {
  const noSpaces = username ? username.replace(/\s+/g, "") : "";
  const withoutAt = noSpaces.replace(/^@+/, "");
  return withoutAt.replace(/[^A-Za-z0-9_]/g, "").slice(0, 32);
}

/** Нормализует username с префиксом @ для отображения/ввода. */
export function normalizeTelegramUsername(
  value: string | null | undefined,
): string {
  const cleaned = stripTelegramUsername(value);
  return cleaned ? `@${cleaned}` : "";
}

/** Для отображения: @username или @ если пусто. */
export function normalizeTelegramWithPrefix(
  username: string | null | undefined,
): string {
  const cleaned = stripTelegramUsername(username);
  return cleaned ? `@${cleaned}` : "@";
}

/** Для отправки на API: @username или null. */
export function sanitizeTelegramForSubmit(
  username: string | null | undefined,
): string | null {
  const cleaned = stripTelegramUsername(username);
  return cleaned ? `@${cleaned}` : null;
}

/** Форматирование для UI: @username или «не заполнено». */
export function formatTelegramDisplay(
  username: string | null | undefined,
): string {
  const cleaned = stripTelegramUsername(username);
  return cleaned ? `@${cleaned}` : "не заполнено";
}
