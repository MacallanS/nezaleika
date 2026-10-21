import { useToast } from "bibli/shared/ui";
import { parseApiErrorDetail } from "@/shared/lib/errors/parseApiError";

const ERROR_LIFE = 12000;
const WARN_LIFE = 7000;
const SUCCESS_LIFE = 2500;

const HTTP_HINT_RU: Record<number, string> = {
  400: "Запрос отклонён: проверьте отсканированные данные и поля формы.",
  401: "Сессия истекла — войдите снова и повторите действие.",
  403: "Недостаточно прав для этого действия в учёте карт.",
  404: "Нужная запись не найдена (коробка, партия, точка или заявка).",
  409: "Конфликт данных: возможно, запись уже изменили. Обновите экран.",
  422: "Сервер не принял данные. Ниже — детали проверки.",
  429: "Слишком много запросов. Подождите несколько секунд и повторите.",
  500: "Внутренняя ошибка сервера. Попробуйте ещё раз; если повторится — напишите в поддержку.",
  502: "Сервер временно недоступен (шлюз). Повторите через минуту.",
  503: "Сервис учёта карт временно недоступен. Повторите позже.",
};

function httpStatus(error: unknown): number | null {
  const status = (error as { response?: { status?: number } })?.response?.status;
  return typeof status === "number" ? status : null;
}

function enrichErrorDetail(error: unknown, fallback: string): string {
  const parsed = parseApiErrorDetail(error, "") || "";
  const status = httpStatus(error);
  const hint = status != null ? HTTP_HINT_RU[status] : "";
  const body = parsed || fallback;

  if (hint && parsed && !parsed.includes(hint)) {
    return `${hint} ${parsed}`.trim();
  }
  if (hint && !parsed) {
    return `${hint} ${fallback}`.trim();
  }
  if (!body || /request failed with status code/i.test(body) || body === "Network Error") {
    if (status === null && /network error/i.test(String((error as Error)?.message || ""))) {
      return "Нет связи с сервером. Проверьте интернет и повторите. Черновик сканов сохранён на этом устройстве.";
    }
    return hint ? `${hint} ${fallback}`.trim() : fallback;
  }
  return body;
}

/** Единые toast для Cards: подробный текст API-ошибок и увеличенный life. */
export function useCardsNotify() {
  const toast = useToast();

  const notifyError = (error: unknown, fallback = "Произошла ошибка") => {
    const detail = enrichErrorDetail(error, fallback);
    toast.add({
      severity: "error",
      summary: "Ошибка",
      detail,
      life: ERROR_LIFE,
    });
    return detail;
  };

  const notifyWarn = (detail: string, summary = "Внимание") => {
    toast.add({
      severity: "warn",
      summary,
      detail,
      life: WARN_LIFE,
    });
  };

  const notifyOk = (detail: string, summary = "Готово") => {
    toast.add({
      severity: "success",
      summary,
      detail,
      life: SUCCESS_LIFE,
    });
  };

  return { notifyError, notifyWarn, notifyOk };
}
