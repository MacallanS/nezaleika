import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';

export const OTP_LENGTH = 6;

export function digitsToCells(value) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, OTP_LENGTH);
  return Array.from({ length: OTP_LENGTH }, (_, i) => digits[i] || '');
}

export function cellsToDigits(cells) {
  return cells.join('').replace(/\D/g, '').slice(0, OTP_LENGTH);
}

export function useAuthRrOtp(props, emit) {
  const inputRef = ref(null);
  const cells = ref(digitsToCells(props.modelValue));
  const activeIndex = ref(0);
  const isFocused = ref(false);

  const digitCount = computed(() => cellsToDigits(cells.value).length);

  function emitValue() {
    emit('update:modelValue', cellsToDigits(cells.value));
  }

  function setCellsFromDigits(digits) {
    cells.value = digitsToCells(digits);
    emitValue();
  }

  function syncActiveFromInput() {
    const el = inputRef.value;
    if (!el) {
      return;
    }
    const len = cellsToDigits(cells.value).length;
    const pos = el.selectionStart ?? len;
    activeIndex.value = Math.min(Math.max(pos, 0), OTP_LENGTH - 1);
    if (len < OTP_LENGTH && pos > len) {
      activeIndex.value = len;
    }
  }

  function focusInput(cursorPos) {
    const el = inputRef.value;
    if (!el) {
      return;
    }
    const len = cellsToDigits(cells.value).length;
    const pos = cursorPos == null ? len : Math.min(Math.max(cursorPos, 0), len);
    el.focus();
    nextTick(() => {
      el.setSelectionRange(pos, pos);
      syncActiveFromInput();
    });
  }

  function focusCell(index) {
    const len = cellsToDigits(cells.value).length;
    const pos = Math.min(index, len);
    focusInput(pos);
  }

  function onInput(event) {
    const raw = (event.target.value || '').replace(/\D/g, '').slice(0, OTP_LENGTH);
    setCellsFromDigits(raw);
    nextTick(() => {
      const el = inputRef.value;
      if (!el) {
        return;
      }
      const pos = Math.min(raw.length, OTP_LENGTH);
      el.setSelectionRange(pos, pos);
      syncActiveFromInput();
    });
  }

  function onKeydown(event) {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      const el = inputRef.value;
      const pos = Math.max((el?.selectionStart ?? 1) - 1, 0);
      focusInput(pos);
      return;
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      const el = inputRef.value;
      const len = digitCount.value;
      const pos = Math.min((el?.selectionStart ?? 0) + 1, len);
      focusInput(pos);
    }
  }

  function onPaste(event) {
    const pasted = (event.clipboardData?.getData('text') || '').replace(/\D/g, '');
    if (!pasted) {
      return;
    }
    event.preventDefault();
    setCellsFromDigits(pasted);
    focusInput(Math.min(pasted.length, OTP_LENGTH));
  }

  function onCellPointer(index, event) {
    event.preventDefault();
    focusCell(index);
  }

  function onFocus() {
    isFocused.value = true;
    syncActiveFromInput();
  }

  function onBlur() {
    isFocused.value = false;
  }

  function onSelect() {
    syncActiveFromInput();
  }

  watch(
    () => props.modelValue,
    (value) => {
      const next = digitsToCells(value);
      if (cellsToDigits(next) !== cellsToDigits(cells.value)) {
        cells.value = next;
      }
    },
  );

  return {
    inputRef,
    cells,
    OTP_LENGTH,
    activeIndex,
    isFocused,
    onInput,
    onKeydown,
    onPaste,
    onCellPointer,
    onFocus,
    onBlur,
    onSelect,
    focusCell,
  };
}

export function useAuthRrOtpResend(secondsInitial = 29) {
  const secondsLeft = ref(secondsInitial);
  let timerId = null;

  function tick() {
    if (secondsLeft.value <= 0) {
      clearInterval(timerId);
      timerId = null;
      return;
    }
    secondsLeft.value -= 1;
  }

  function reset(seconds = secondsInitial) {
    if (timerId) {
      clearInterval(timerId);
    }
    secondsLeft.value = seconds;
    timerId = setInterval(tick, 1000);
  }

  onMounted(() => {
    timerId = setInterval(tick, 1000);
  });

  onBeforeUnmount(() => {
    if (timerId) {
      clearInterval(timerId);
    }
  });

  const canResend = () => secondsLeft.value <= 0;

  return { secondsLeft, reset, canResend };
}
