<template>
  <div class="input-wrapper">
    <input :id="name" ref="inputRef" :value="inputValue" @input="handleInput" @focus="handleFocus" @blur="handleBlur"
      @paste="handlePaste" @keydown="handleKeydown" :name="name" :placeholder="variant === 'on' ? '' : placeholder"
      :class="['custom-input', { 'input-error': errorMessage }]" :readonly="readonly" inputmode="tel" type="tel"
      maxlength="18" />
    <label v-if="variant === 'on' && placeholder" :for="name"
      :class="['input-label', { 'label-active': displayValue || isFocused }]">
      {{ placeholder }}
    </label>
    <!-- <span v-if="errorMessage" class="text-red-500 text-xs mt-1 block">{{ errorMessage }}</span> -->
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";

const props = defineProps({
  modelValue: {
    type: String,
    default: "",
  },
  placeholder: {
    type: String,
    default: "Номер телефона",
  },
  name: {
    type: String,
    default: "phone",
  },
  variant: {
    type: String,
    default: "on",
  },
  readonly: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: "",
  },
});

const emit = defineEmits(["update:modelValue"]);

const errorMessage = ref("");
const isFocused = ref(false);
const inputRef = ref(null);
const inputValue = ref(props.modelValue || "");

const isAndroid = typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent || "");

const displayValue = computed(() => {
  return inputValue.value || "";
});

function countDigitsUpTo(str, pos) {
  let cnt = 0;
  const upto = Math.min(pos ?? 0, str.length);
  for (let i = 0; i < upto; i++) if (/\d/.test(str[i])) cnt++;
  return cnt;
}

function posForDigitIndex(masked, digitIdx) {
  if (digitIdx <= 0) return 4;
  let cnt = 0;
  for (let i = 0; i < masked.length; i++) {
    if (/\d/.test(masked[i])) {
      cnt++;
      if (cnt === digitIdx) return i + 1;
    }
  }
  const u = masked.indexOf("_");
  return u !== -1 ? u : Math.max(4, masked.length);
}

// Функция для форматирования номера телефона в формате +7 (XXX) XXX-XX-XX
function formatPhone(digits) {
  if (!digits || digits.length === 0) {
    return "+7 (";
  }

  let formatted = "+7 (";
  formatted += digits.slice(0, 3);

  if (digits.length >= 3) {
    formatted += ") " + digits.slice(3, 6);
    if (digits.length > 6) {
      formatted += "-" + digits.slice(6, 8);
      if (digits.length > 8) {
        formatted += "-" + digits.slice(8, 10);
      }
    }
  }

  return formatted;
}

// Функция для вычисления позиции курсора после форматирования
function getCursorPosition(digitsBefore, digitsAfter, oldCursorPos, oldValue) {
  // Подсчитываем количество цифр до курсора в старом значении
  let digitsBeforeCursor = 0;
  for (let i = 0; i < Math.min(oldCursorPos, oldValue.length); i++) {
    if (/\d/.test(oldValue[i])) {
      digitsBeforeCursor++;
    }
  }

  // Находим позицию курсора в новом отформатированном значении
  let newCursorPos = 4; // Начало после "+7 ("
  let digitCount = 0;

  const formatted = formatPhone(digitsAfter);
  for (let i = 0; i < formatted.length; i++) {
    if (/\d/.test(formatted[i])) {
      digitCount++;
      if (digitCount === digitsBeforeCursor) {
        newCursorPos = i + 1;
        break;
      }
    }
  }

  // Если все цифры до курсора обработаны, ставим курсор в конец
  if (digitCount < digitsBeforeCursor) {
    newCursorPos = formatted.length;
  }

  return newCursorPos;
}

const handleFocus = (event) => {
  isFocused.value = true;
  const el = event.target;
  const currentValue = el.value || "";
  const isEffectivelyEmpty = !currentValue ||
    currentValue === "" ||
    currentValue === null ||
    currentValue === undefined ||
    currentValue === "+7 (" ||
    currentValue === "+7" ||
    currentValue === "+7 ";

  if (isEffectivelyEmpty) {
    const initialValue = "+7 (";
    inputValue.value = initialValue;
    emit("update:modelValue", initialValue);
    requestAnimationFrame(() => {
      el.value = initialValue;
      el.setSelectionRange(4, 4);
    });
  } else {
    requestAnimationFrame(() => {
      if (el.selectionStart < 4) el.setSelectionRange(4, 4);
    });
  }
  errorMessage.value = "";
};

const handleBlur = () => {
  isFocused.value = false;

  const currentValue = inputValue.value || "";
  let digits = currentValue.replace(/\D/g, "");

  // Убираем первую 7 если есть
  if (digits.length > 0 && digits[0] === "7") {
    digits = digits.slice(1);
  }

  // Ограничиваем до 10 цифр
  if (digits.length > 10) {
    digits = digits.slice(0, 10);
  }

  // Форматируем с скобками и дефисами
  const formatted = formatPhone(digits);
  inputValue.value = formatted;
  emit("update:modelValue", formatted);

  // Обновляем значение в DOM
  if (inputRef.value) {
    inputRef.value.value = formatted;
  }

  if (displayValue.value && !displayValue.value.startsWith("+7")) {
    errorMessage.value = "Телефон должен начинаться с +7";
  } else {
    errorMessage.value = props.error || "";
  }
};

const handleInput = (event) => {
  const el = event.target;
  let value = el.value;
  const oldCursorPos = el.selectionStart ?? 0;

  // Защита от удаления "+7 ("
  if (value.length < 4 || !value.startsWith("+7 (")) {
    value = "+7 (";
  }

  // Извлекаем цифры ТОЛЬКО из части после префикса "+7 (",
  // иначе при наборе/вставке полного 11-значного номера первая 7 префикса
  // сливается с цифрами пользователя и slice(1) ниже съедает его первую цифру.
  const userPart = value.slice(4);
  let digits = userPart.replace(/\D/g, "");

  // Юзер мог вставить полный номер (11 цифр) внутри маски — убираем код страны
  if (digits.length > 10 && (digits[0] === "8" || digits[0] === "7")) {
    digits = digits.slice(1);
  }

  // Ограничиваем до 10 цифр номера
  if (digits.length > 10) {
    digits = digits.slice(0, 10);
  }

  // Ограничиваем до 10 цифр
  if (digits.length > 10) {
    digits = digits.slice(0, 10);
  }

  // Форматируем с скобками и дефисами
  const formatted = formatPhone(digits);

  // Вычисляем позицию курсора
  let newCursorPos;
  if (digits.length === 0) {
    // Если нет цифр, курсор на позиции 4 (после "+7 (")
    newCursorPos = 4;
  } else {
    // Подсчитываем количество цифр до курсора в старом значении
    let digitsBeforeCursor = 0;
    for (let i = 0; i < Math.min(oldCursorPos, value.length); i++) {
      if (/\d/.test(value[i])) {
        digitsBeforeCursor++;
      }
    }

    // Находим позицию курсора в новом отформатированном значении
    newCursorPos = 4; // Начало после "+7 ("
    let digitCount = 0;

    for (let i = 0; i < formatted.length; i++) {
      if (/\d/.test(formatted[i])) {
        digitCount++;
        if (digitCount === digitsBeforeCursor) {
          newCursorPos = i + 1;
          break;
        }
      }
    }

    // Если все цифры до курсора обработаны, ставим курсор в конец
    if (digitCount < digitsBeforeCursor) {
      newCursorPos = formatted.length;
    }

    // Обеспечиваем, что курсор не может быть раньше позиции 4
    if (newCursorPos < 4) {
      newCursorPos = 4;
    }
  }

  inputValue.value = formatted;
  emit("update:modelValue", formatted);

  // Обновляем значение в input и позицию курсора
  requestAnimationFrame(() => {
    el.value = formatted;
    el.setSelectionRange(newCursorPos, newCursorPos);
  });
};

function formatToMask(raw) {
  let digits = raw.replace(/\D/g, "");

  if ((digits.length === 11) && (digits[0] === "8" || digits[0] === "7")) {
    digits = digits.slice(1);
  }

  if (digits.length >= 3) {
    const codeOperator = digits.substring(0, 3);
    if (codeOperator.startsWith('7') || codeOperator.startsWith('8')) {
      return raw;
    }
  }

  if (digits.length === 10) {
    return `+7 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 8)}-${digits.slice(8, 10)}`;
  }
  if (digits.length === 11 && digits[0] === "7") {
    return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`;
  }
  if (/^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/.test(raw)) {
    return raw;
  }
  return raw;
}

const handlePaste = (event) => {
  const el = event.target;
  let pasted = (event.clipboardData || window.clipboardData).getData("text") || "";
  pasted = pasted.trim();
  if (!pasted) return;

  event.preventDefault();

  // Извлекаем только цифры
  let digits = pasted.replace(/\D/g, "");

  // Убираем первую 7 или 8 если есть
  if (digits.length > 0 && (digits[0] === "7" || digits[0] === "8")) {
    digits = digits.slice(1);
  }

  // Ограничиваем до 10 цифр
  if (digits.length > 10) {
    digits = digits.slice(0, 10);
  }

  // Форматируем с скобками и дефисами
  const formatted = formatPhone(digits);
  inputValue.value = formatted;
  emit("update:modelValue", formatted);
  el.value = formatted;

  requestAnimationFrame(() => {
    const cursorPos = formatted.length;
    el.setSelectionRange(cursorPos, cursorPos);
  });
};

const handleKeydown = (event) => {
  const el = event.target;
  const selectionStart = el.selectionStart ?? 0;
  const selectionEnd = el.selectionEnd ?? 0;
  const value = el.value || "";
  const isFullSelection = selectionStart === 0 && selectionEnd === value.length;

  const navKeys = ["Tab", "Shift", "Control", "Alt", "Meta", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"];

  // Обрабатываем Backspace и Delete ПЕРВЫМИ, до других проверок
  if (event.key === "Backspace" || event.key === "Delete") {
    // Если выделен весь текст (CTRL+A) или выделение включает "+7 (" и текст после
    if (isFullSelection || (selectionStart < 4 && selectionEnd > 4)) {
      event.preventDefault();
      // Устанавливаем значение в "+7 (" и позиционируем курсор
      inputValue.value = "+7 (";
      emit("update:modelValue", "+7 (");
      requestAnimationFrame(() => {
        el.value = "+7 (";
        el.setSelectionRange(4, 4);
      });
      return;
    }

    // Если курсор на позиции 4 и нажимается Backspace - блокируем удаление "+7 ("
    if (event.key === "Backspace" && selectionStart <= 4 && selectionEnd <= 4) {
      event.preventDefault();
      requestAnimationFrame(() => el.setSelectionRange(4, 4));
      return;
    }

    // Если Delete на позиции 4 или раньше - блокируем
    if (event.key === "Delete" && selectionStart < 4) {
      event.preventDefault();
      requestAnimationFrame(() => el.setSelectionRange(4, 4));
      return;
    }

    // Если выделение частично попадает в защищённую область
    if (selectionStart < 4 && selectionEnd <= 4) {
      event.preventDefault();
      requestAnimationFrame(() => el.setSelectionRange(4, 4));
      return;
    }

    // Во всех остальных случаях разрешаем удаление (оно обработается в handleInput)
    return;
  }

  // Защищаем область "+7 (" от изменений (первые 4 символа)
  // Но разрешаем навигационные клавиши и специальные комбинации
  if (selectionStart < 4 && !navKeys.includes(event.key) && !(event.ctrlKey || event.metaKey)) {
    event.preventDefault();
    requestAnimationFrame(() => el.setSelectionRange(4, 4));
    return;
  }
};

watch(() => props.error, (val) => {
  errorMessage.value = val;
});

watch(() => props.modelValue, (newValue) => {
  // Не обновляем inputValue если пользователь активно вводит (isFocused)
  if (isFocused.value) {
    return;
  }

  if (!newValue || newValue === "" || newValue === null || newValue === undefined) {
    inputValue.value = "";
    errorMessage.value = "";
    return;
  }

  // Извлекаем цифры и форматируем
  let digits = newValue.replace(/\D/g, "");
  if (digits.length > 0 && (digits[0] === "7" || digits[0] === "8")) {
    digits = digits.slice(1);
  }
  if (digits.length > 10) {
    digits = digits.slice(0, 10);
  }

  const formatted = formatPhone(digits);
  if (formatted !== inputValue.value) {
    inputValue.value = formatted;
    if (inputRef.value) {
      inputRef.value.value = formatted;
    }
  }

  // Используем отформатированное значение для проверки,
  // иначе при начальном значении без "+7" инпут будет красным,
  // даже если визуально уже форматирован корректно.
  if (formatted && !formatted.startsWith("+7")) {
    errorMessage.value = "Телефон должен начинаться с +7";
  } else {
    errorMessage.value = "";
  }
}, { immediate: true });

onMounted(() => {
  if (!props.modelValue || props.modelValue === "" || props.modelValue === null || props.modelValue === undefined) {
    emit("update:modelValue", "");
  }
});
</script>

<style scoped>
.input-wrapper {
  position: relative;
  display: block;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
  overflow: visible;
}

.custom-input {
  display: block;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
  min-height: var(--filter-control-height, var(--filter-control-height-md, 40px));
  height: var(--filter-control-height, var(--filter-control-height-md, 40px));
  padding: 0 var(--filter-control-padding-x, 12px);
  border: 1px solid var(--russ-input-border);
  border-radius: var(--filter-control-radius, 10px);
  font-size: var(--filter-control-font-size, var(--filter-control-font-size-md, 14px));
  font-family: var(--filter-control-font-family, var(--russ-font-family));
  font-weight: var(--filter-control-font-weight, 500);
  line-height: var(--filter-control-line-height, 1.2);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  background: var(--russ-input-bg);
  color: var(--russ-input-text);
}

.custom-input:focus {
  outline: none;
  border-color: var(--russ-input-border-focus);
}

.custom-input:readonly {
  background-color: var(--russ-input-bg-disabled);
  cursor: not-allowed;
  opacity: 0.6;
}

.input-error {
  border: 1px solid var(--russ-input-border-error) !important;
  /* Внутренняя обводка, чтобы ring не выходил за границы поля */
  box-shadow: inset 0 0 0 2px var(--russ-input-error-bg);
}

.input-label {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  z-index: 2;
  font-size: clamp(12px,
      calc(12px + (14 - 12) * ((100vw - 320px) / (1920 - 320))),
      14px);
  color: var(--russ-input-placeholder);
  pointer-events: none;
  transition: all 0.2s ease;
  background: var(--russ-input-bg);
  padding: 0 0.25rem;
  line-height: 1.2;
  transform: translateY(-50%);
}

.custom-input:focus ~ .input-label,
.label-active {
  top: -0.625rem;
  left: 0.5rem;
  transform: none;
  font-size: clamp(10px,
      calc(10px + (12 - 10) * ((100vw - 320px) / (1920 - 320))),
      12px);
  color: var(--russ-input-border-focus);
  border-radius: 5px 5px 0 0;
}

.custom-input:disabled~.input-label,
.custom-input[readonly]~.input-label {
  background: var(--russ-input-bg-disabled);
  opacity: 0.6;
}

.text-red-500 {
  color: var(--russ-input-error);
  font-size: clamp(10px,
      calc(10px + (12 - 10) * ((100vw - 320px) / (1920 - 320))),
      12px);
  margin-top: 0.25rem;
  display: block;
}
</style>
