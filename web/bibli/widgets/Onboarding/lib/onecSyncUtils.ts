export interface OnecSyncStatusLike {
  status?: string | null;
  error_message?: string | null;
  response_body?: Record<string, unknown> | null;
  request_payload?: Record<string, unknown> | null;
  onec_counterparty_id?: string | null;
  attempts?: number | null;
  synced_at?: string | null;
}

export const ONEC_STATUS_LABELS: Record<string, string> = {
  pending: "В очереди",
  success: "Успешно",
  needs_resync: "Требуется выгрузка в 1С",
  skipped_not_smz: "Не выгружается",
  failed_validation: "Ошибка данных",
  failed_transport: "Ошибка сети",
  failed_onec: "Ошибка 1С",
};

export function onecStatusLabel(status?: string | null): string {
  if (!status) return "—";
  return ONEC_STATUS_LABELS[status] || status;
}

export function extractOnecMessage(
  body: Record<string, unknown> | null | undefined
): string {
  if (!body || typeof body !== "object") return "";
  const candidates = [
    body.message,
    body.error,
    body.Message,
    body.Error,
    body.description,
    body.detail,
  ];
  for (const value of candidates) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  if (Array.isArray(body.errors) && body.errors.length) {
    return body.errors
      .map((entry) => {
        if (typeof entry === "string") return entry;
        if (entry && typeof entry === "object") {
          const obj = entry as Record<string, unknown>;
          return String(obj.message || obj.error || JSON.stringify(entry));
        }
        return String(entry);
      })
      .filter(Boolean)
      .join("; ");
  }
  return "";
}

export function prettyOnecJson(value: unknown): string {
  if (value == null) return "";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function onecPrimaryMessage(sync: OnecSyncStatusLike | null | undefined): string {
  if (!sync) return "";
  if (sync.status === "pending") {
    if (sync.request_payload) {
      return "Запрос отправлен в 1С, ответ ещё не получен.";
    }
    return "Синхронизация в очереди, ожидается обработка.";
  }
  if (sync.status === "needs_resync") {
    return (
      sync.error_message?.trim() ||
      "Данные изменены после последней выгрузки. Нужна повторная выгрузка."
    );
  }
  const fromBody = extractOnecMessage(sync.response_body ?? null);
  return (sync.error_message || fromBody || "").trim();
}

export function hasOnecFailureDetails(sync: OnecSyncStatusLike | null | undefined): boolean {
  if (!sync) return false;
  const failed = String(sync.status || "").startsWith("failed");
  return (
    failed ||
    sync.status === "needs_resync" ||
    Boolean(sync.error_message) ||
    Boolean(sync.response_body)
  );
}

export function shortOnecReason(sync: OnecSyncStatusLike | null | undefined): string {
  const text = onecPrimaryMessage(sync);
  if (!text) return "Ошибка без текста — открыть ответ";
  return text.length > 120 ? `${text.slice(0, 117)}…` : text;
}

/** Старые английские ключи + русские тексты с бэка. */
const ONEC_ERROR_TRANSLATIONS: Record<string, string> = {
  "User not found": "Пользователь не найден",
  "ИНН не проходит проверку контрольной суммы": "ИНН не проходит проверку контрольной суммы",
  "inn is invalid": "ИНН не проходит проверку контрольной суммы",
  "inn is required": "Не указан ИНН",
  "User is not self-employed (SMZ) or individual entrepreneur (IP)":
    "Выгрузка только для самозанятых и ИП",
  "User is not self-employed (SMZ)": "Выгрузка только для самозанятых и ИП",
  "account_type must be self-employed (SMZ) or individual entrepreneur (IP)":
    "Нужен тип оформления «Самозанятый» или «ИП»",
  "account_type must be self-employed (SMZ)":
    "Нужен тип оформления «Самозанятый» или «ИП»",
  "Тип оформления не «Самозанятый» и не «ИП» — выгрузка не выполнялась":
    "Выгрузка только для самозанятых и ИП",
  "Тип оформления должен быть «Самозанятый» или «ИП»":
    "Нужен тип оформления «Самозанятый» или «ИП»",
  "bank_account control digit does not match BIK": "Расчётный счёт не сходится с БИК",
  "bank_account must be 20 digits": "Расчётный счёт должен содержать 20 цифр",
  "bank_bik must be 9 digits": "БИК должен содержать 9 цифр",
  "passport must be 10 digits": "Серия и номер паспорта — 10 цифр",
  "passport_issued is required": "Не указано кем выдан паспорт",
  "passport_date is required": "Не указана дата выдачи паспорта",
  "passport_code is invalid": "Некорректный код подразделения паспорта",
  "birthday is required": "Не указана дата рождения",
  "birthday_place is required": "Не указано место рождения",
  "registration_address is required": "Не указан адрес регистрации",
  "phone must be 11 digits": "Телефон должен содержать 11 цифр",
  "email is required": "Не указан email",
  "full_name is required": "Не заполнено ФИО",
  "project_name is required": "Не указан проект",
};

export function humanizeOnecErrorMessage(message?: string | null): string {
  if (!message?.trim()) return "";

  if (/Could not resolve host/i.test(message)) {
    return "Сервер не достучится до 1С (не резолвится хост). Нужен VPN OpenVPN до сети 1С.";
  }
  if (/Connection timed out|Operation timed out/i.test(message)) {
    return "Таймаут соединения с 1С. Проверьте VPN и доступность базы.";
  }
  if (/Connection refused/i.test(message)) {
    return "1С отклонила соединение. Проверьте адрес базы и VPN.";
  }

  return message
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      if (ONEC_ERROR_TRANSLATIONS[part]) return ONEC_ERROR_TRANSLATIONS[part];
      // Сообщения с конкретными значениями (ИНН/счёт/БИК) уже на русском — не трогаем.
      if (/значение:|счёт:|БИК:/.test(part)) return part;
      for (const [en, ru] of Object.entries(ONEC_ERROR_TRANSLATIONS)) {
        if (part.startsWith(en)) return part.replace(en, ru);
      }
      return part;
    })
    .join("; ");
}

export function onecReasonForTable(sync: OnecSyncStatusLike | null | undefined): string {
  if (!sync?.status) return "—";
  if (sync.status === "pending") {
    return "Ожидает обработки";
  }
  if (sync.status === "success" && sync.onec_counterparty_id) {
    return `ID 1С: ${sync.onec_counterparty_id}`;
  }
  if (sync.status === "needs_resync") {
    const human = humanizeOnecErrorMessage(onecPrimaryMessage(sync));
    return human || "Нужна повторная выгрузка";
  }
  if (sync.status === "skipped_not_smz") {
    return (
      humanizeOnecErrorMessage(sync.error_message) ||
      "Выгрузка только для самозанятых и ИП"
    );
  }
  const human = humanizeOnecErrorMessage(onecPrimaryMessage(sync));
  if (human) return human;
  if (sync.onec_counterparty_id) return `ID 1С: ${sync.onec_counterparty_id}`;
  return "—";
}

export function isOnecRowActionable(item: { user_id?: number | null; fio?: string | null }): boolean {
  return Boolean(item.user_id && item.user_id > 0 && item.fio?.trim());
}
