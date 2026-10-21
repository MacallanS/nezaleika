import { onBeforeUnmount, ref } from "vue";

/**
 * HID-сканер как keyboard-wedge: сканер (или Windows-программа поверх serial-сканера)
 * «печатает» код в сфокусированное поле и шлёт завершитель. Composable развязан от
 * конкретной модели: код завершается любым из Enter/Tab/ArrowDown (разные сканеры шлют
 * разное), а для сканеров вовсе без суффикса — по паузе ввода (IDLE_FLUSH_MS). Один и тот
 * же контракт, что у камерного useQrScanner: наружу отдаётся decode(code). Нормализацию
 * (срез суффикса продукта) делает бэк — сюда прилетает сырая строка.
 *
 * Поле привязывается так: <input v-model="value" @keydown="handleKeydown" @input="handleInput">.
 */
const TERMINATOR_KEYS = new Set(["Enter", "Tab", "ArrowDown"]);

// Пауза без ввода, после которой считаем код завершённым (сканер без суффикса-терминатора).
// Сканер сыплет символы залпом (<10 мс между ними), поэтому 150 мс их не рвёт, но ручной
// набор здесь не ведётся (для него отдельный режим), так что преждевременный флаш не грозит.
const IDLE_FLUSH_MS = 150;

export function useHidScanner(onCode: (code: string) => void) {
  const value = ref("");
  let idleTimer: ReturnType<typeof setTimeout> | null = null;

  const clearTimer = () => {
    if (idleTimer !== null) {
      clearTimeout(idleTimer);
      idleTimer = null;
    }
  };

  const flush = () => {
    clearTimer();
    const code = value.value.trim();
    value.value = "";
    if (code) onCode(code);
  };

  const handleKeydown = (event: KeyboardEvent) => {
    if (TERMINATOR_KEYS.has(event.key)) {
      // не даём Tab увести фокус и ArrowDown/Enter сделать что-то со страницей —
      // поле остаётся сфокусированным, можно сканировать следующую карту сразу.
      event.preventDefault();
      flush();
    }
  };

  const handleInput = () => {
    clearTimer();
    idleTimer = setTimeout(flush, IDLE_FLUSH_MS);
  };

  onBeforeUnmount(clearTimer);

  return { value, handleKeydown, handleInput, flush };
}
