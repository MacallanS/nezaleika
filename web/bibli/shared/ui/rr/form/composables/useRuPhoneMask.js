import { ref, watch, onMounted, onBeforeUnmount } from 'vue';

/** Визуальный и DOM-префикс. Позже сменится с кодом страны; PM всё равно читает полный input.value. */
export const RU_PHONE_PREFIX = '+7 (';
const PREFIX = RU_PHONE_PREFIX;

export function formatRuPhone(digits) {
  if (!digits || digits.length === 0) {
    return PREFIX;
  }
  let formatted = PREFIX;
  formatted += digits.slice(0, 3);
  if (digits.length >= 3) {
    formatted += ') ' + digits.slice(3, 6);
    if (digits.length > 6) {
      formatted += '-' + digits.slice(6, 8);
      if (digits.length > 8) {
        formatted += '-' + digits.slice(8, 10);
      }
    }
  }
  return formatted;
}

export function formatLocalPart(digits) {
  if (!digits || digits.length === 0) {
    return '';
  }
  let formatted = digits.slice(0, 3);
  if (digits.length >= 3) {
    formatted += ') ' + digits.slice(3, 6);
    if (digits.length > 6) {
      formatted += '-' + digits.slice(6, 8);
      if (digits.length > 8) {
        formatted += '-' + digits.slice(8, 10);
      }
    }
  }
  return formatted;
}

export function normalizeRuPhoneDigits(raw) {
  let digits = String(raw || '').replace(/\D/g, '');
  if (!digits) {
    return '';
  }

  while (digits.length > 10 && (digits[0] === '7' || digits[0] === '8')) {
    digits = digits.slice(1);
  }

  return digits.slice(0, 10);
}

export function extractUserDigits(value) {
  let raw = String(value || '').trim();
  if (!raw) {
    return '';
  }

  if (raw.startsWith(PREFIX)) {
    raw = raw.slice(PREFIX.length);
  } else {
    raw = raw.replace(/^\+7[\s\u00a0(-]*/u, '');
    raw = raw.replace(/^8[\s\u00a0(-]*/u, '');
    raw = raw.replace(/^7[\s\u00a0(-]*/u, '');
  }

  return normalizeRuPhoneDigits(raw);
}

export function toRuPhoneE164(digits) {
  const normalized = normalizeRuPhoneDigits(digits);
  return normalized.length > 0 ? `+7${normalized}` : '';
}

export function countRuPhoneDigits(value) {
  return extractUserDigits(value).length;
}

export function localMaskGhost(digits) {
  const padded = `${digits || ''}0000000000`.slice(0, 10);
  const sample = formatLocalPart(padded);
  const current = formatLocalPart(digits);
  if (!sample || current.length >= sample.length) {
    return '';
  }
  return sample.slice(current.length);
}

/**
 * Диапазон пользовательских цифр (0..9), попадающих в selection input.value.
 * @returns {{ fromDigit: number, toDigit: number } | null}
 */
export function digitSelectionRange(rawValue, selStart, selEnd) {
  const raw = String(rawValue || '');
  const start = Math.min(selStart ?? 0, selEnd ?? 0);
  const end = Math.max(selStart ?? 0, selEnd ?? 0);
  if (end <= start) {
    return null;
  }

  const prefixLen = raw.startsWith(PREFIX) ? PREFIX.length : 0;
  let digitIndex = 0;
  let fromDigit = null;
  let toDigit = null;

  for (let i = prefixLen; i < raw.length; i++) {
    if (!/\d/.test(raw[i])) {
      continue;
    }
    if (i >= start && i < end) {
      if (fromDigit === null) {
        fromDigit = digitIndex;
      }
      toDigit = digitIndex;
    }
    digitIndex++;
  }

  // Ctrl+A / выделение с префикса: цифры целиком в selection.
  if (fromDigit === null && digitIndex > 0 && start <= prefixLen && end > prefixLen) {
    fromDigit = 0;
    toDigit = digitIndex - 1;
  }

  if (fromDigit === null || toDigit === null) {
    return null;
  }
  return { fromDigit, toDigit };
}

/** Разбить локальную маску на before / selected / after по диапазону цифр. */
export function splitLocalByDigitSelection(local, fromDigit, toDigit) {
  const text = String(local || '');
  if (
    fromDigit == null ||
    toDigit == null ||
    fromDigit > toDigit ||
    !text
  ) {
    return { before: text, selected: '', after: '' };
  }

  let digitIdx = 0;
  let before = '';
  let selected = '';
  let after = '';
  let sawSelected = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    let isSelected = false;

    if (/\d/.test(ch)) {
      isSelected = digitIdx >= fromDigit && digitIdx <= toDigit;
      digitIdx += 1;
    } else {
      const afterDigit = digitIdx - 1;
      const beforeDigit = digitIdx;
      const leftOk = afterDigit >= fromDigit && afterDigit <= toDigit;
      const rightOk = beforeDigit >= fromDigit && beforeDigit <= toDigit;
      isSelected = leftOk && rightOk;
    }

    if (isSelected) {
      selected += ch;
      sawSelected = true;
    } else if (!sawSelected) {
      before += ch;
    } else {
      after += ch;
    }
  }

  return { before, selected, after };
}

function cursorAfterDigits(formatted, digitsBeforeCursor) {
  if (digitsBeforeCursor <= 0) {
    return 0;
  }
  let count = 0;
  for (let i = 0; i < formatted.length; i++) {
    if (/\d/.test(formatted[i])) {
      count++;
      if (count === digitsBeforeCursor) {
        return i + 1;
      }
    }
  }
  return formatted.length;
}

/** Для emit/model: пусто без цифр (не отдаём голый +7 (). */
function fullValueForDom(digits) {
  return digits.length > 0 ? formatRuPhone(digits) : '';
}

/** В input: на фокусе без цифр держим PREFIX — caret сразу в зоне набора, indent не прыгает. */
function inputValueForDom(digits, focused) {
  if (digits.length > 0) {
    return formatRuPhone(digits);
  }
  return focused ? PREFIX : '';
}

function cursorInFull(digits, cursorDigits, focused = false) {
  if (digits.length === 0) {
    return focused ? PREFIX.length : 0;
  }
  const local = formatLocalPart(digits);
  const localPos = cursorAfterDigits(local, cursorDigits);
  return PREFIX.length + localPos;
}

function clampCursorOutOfPrefix(el, digits) {
  if (!el) {
    return;
  }
  const hasPrefix = digits.length > 0 || (el.value || '').startsWith(PREFIX);
  if (!hasPrefix) {
    return;
  }
  const start = el.selectionStart ?? 0;
  const end = el.selectionEnd ?? 0;
  const min = PREFIX.length;
  if (start < min || end < min) {
    el.setSelectionRange(Math.max(start, min), Math.max(end, min));
  }
}

export function useRuPhoneMask(props, emit) {
  const errorMessage = ref('');
  const isFocused = ref(false);
  const inputRef = ref(null);
  const localValue = ref('');
  /** Кастомная подсветка выделения на видимых цифрах (не ::selection прозрачного input). */
  const selectionHighlight = ref(null);
  let autofillSyncTimers = [];
  let layoutObserver = null;
  let fontsReadyHooked = false;
  let maskPausedForAutofill = false;
  let autofillSettleTimer = null;
  /** Последняя удачная ширина префикса — не даём indent упасть в 0 на кадр reflow. */
  let lastPrefixIndentPx = 0;
  /**
   * Пользователь уже набирает руками. Тогда autofill-поллинг обязан молчать:
   * иначе он ставит маску на паузу и ввод уходит в input «сырым» (лишние пробелы).
   */
  let userTyped = false;
  /**
   * Пользователь набирает руками. Пока флаг стоит, autofill-поллинг выключен:
   * иначе опрос сразу после загрузки/фокуса принимал набор за вставку,
   * оставлял в input сырой текст и рвал выравнивание.
   */
  let userIsTyping = false;
  let userTypingTimer = null;

  function clearPollTimers() {
    for (const id of autofillSyncTimers) {
      clearTimeout(id);
    }
    autofillSyncTimers = [];
  }

  function clearAutofillTimers() {
    clearPollTimers();
    if (autofillSettleTimer) {
      clearTimeout(autofillSettleTimer);
      autofillSettleTimer = null;
    }
  }

  /** Первое касание клавиатуры: гасим поллинг и снимаем возможную паузу маски. */
  function noteUserTyping() {
    if (!userTyped) {
      userTyped = true;
    }
    clearPollTimers();
    if (autofillSettleTimer) {
      clearTimeout(autofillSettleTimer);
      autofillSettleTimer = null;
    }
    maskPausedForAutofill = false;
    syncAutofillVisualState();
  }

  function isAutofillInputType(inputType) {
    return (
      inputType === 'insertReplacementText' ||
      inputType === 'insertFromPaste' ||
      inputType === 'insertFromDrop' ||
      inputType === 'insertFromYank'
    );
  }

  /**
   * iOS Keychain шлёт номер кусками (часто «+797» → «+7 (97»).
   * Пока идёт вставка — не трогаем value и selection, иначе Safari обрывает остаток.
   */
  function pauseMaskForAutofill({ bumpSettle = true } = {}) {
    maskPausedForAutofill = true;
    syncAutofillVisualState();
    if (!bumpSettle && autofillSettleTimer) {
      return;
    }
    if (autofillSettleTimer) {
      clearTimeout(autofillSettleTimer);
    }
    autofillSettleTimer = setTimeout(flushAutofillMask, 180);
  }

  function previewDigitsWithoutRewriting(el, digits) {
    // Сразу рисуем тот же формат, что при ручном вводе — без смены layout.
    ensurePrefixIndent(el);
    setLocalDisplay(formatLocalPart(digits), digits);
    emitModel(digits);
    if (el) {
      syncPrefixIndent(el, digits);
    }
    syncAutofillVisualState();
  }

  function flushAutofillMask() {
    if (autofillSettleTimer) {
      clearTimeout(autofillSettleTimer);
      autofillSettleTimer = null;
    }
    maskPausedForAutofill = false;
    const el = inputRef.value;
    if (!el) {
      syncAutofillVisualState();
      return;
    }
    const digits = extractUserDigits(el.value || '');
    applyDigits(digits, el);
    neutralizeAutofillPaint(el);
    if (digits.length >= 10) {
      notifyAutofillSettled();
    }
    syncAutofillVisualState();
  }

  function hasUserSelection(el = inputRef.value) {
    if (!el || typeof document === 'undefined' || document.activeElement !== el) {
      return false;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    return typeof start === 'number' && typeof end === 'number' && start !== end;
  }

  function restoreSelection(el, start, end) {
    if (!el) {
      return;
    }
    const len = (el.value || '').length;
    const nextStart = Math.max(0, Math.min(start, len));
    const nextEnd = Math.max(0, Math.min(end, len));
    try {
      el.setSelectionRange(nextStart, nextEnd);
    } catch {
      /* ignore */
    }
  }

  function measureTextWidth(el, text) {
    if (!el || !text) {
      return 0;
    }
    const root = el.closest('.auth-rr-input-phone');
    const probe = root?.querySelector('[data-auth-rr-phone-probe]');
    if (!(probe instanceof HTMLElement)) {
      return 0;
    }
    const cs = getComputedStyle(el);
    probe.style.fontFamily = cs.fontFamily;
    probe.style.fontSize = cs.fontSize;
    probe.style.fontWeight = cs.fontWeight;
    probe.style.fontStyle = cs.fontStyle;
    probe.style.letterSpacing = cs.letterSpacing;
    probe.style.fontKerning = cs.fontKerning;
    probe.style.fontVariant = cs.fontVariant;
    probe.style.fontFeatureSettings = cs.fontFeatureSettings;
    probe.style.textRendering = cs.textRendering;
    probe.style.fontStretch = cs.fontStretch;
    probe.textContent = text;
    return probe.getBoundingClientRect().width;
  }

  function syncPrefixIndent(el = inputRef.value, digitsOverride, { force = false } = {}) {
    if (!el) {
      return;
    }
    const root = el.closest('.auth-rr-input-phone');
    if (!(root instanceof HTMLElement)) {
      return;
    }
    const digits =
      digitsOverride !== undefined
        ? normalizeRuPhoneDigits(digitsOverride)
        : extractUserDigits(el.value || localValue.value);

    // Indent сбрасываем только когда поле пустое и не в фокусе.
    // На фокусе indent уже стоит — первый символ не двигает caret.
    if (digits.length === 0 && !isFocused.value) {
      lastPrefixIndentPx = 0;
      root.style.setProperty('--auth-rr-phone-indent', '0px');
      return;
    }

    if (!force && lastPrefixIndentPx > 0) {
      root.style.setProperty('--auth-rr-phone-indent', `-${lastPrefixIndentPx}px`);
      return;
    }

    const prefixEl = root.querySelector('.auth-rr-input-phone__prefix');
    const fromDom =
      prefixEl instanceof HTMLElement ? prefixEl.getBoundingClientRect().width : 0;

    let prefixW = fromDom >= 1 ? fromDom : measureTextWidth(el, PREFIX);

    if (prefixW < 1) {
      prefixW = lastPrefixIndentPx > 0 ? lastPrefixIndentPx : 0;
    } else {
      // floor, не ceil: при округлении вверх caret пустого поля уходит на
      // субпиксель левее контент-бокса, а input по UA-стилю `overflow: clip`
      // — и курсор просто не виден. Текст input прозрачный, префикс не выглянет.
      prefixW = Math.floor(prefixW);
      lastPrefixIndentPx = prefixW;
    }

    if (prefixW < 1) {
      // ch-fallback из CSS :focus-within / --filled
      root.style.removeProperty('--auth-rr-phone-indent');
    } else {
      root.style.setProperty('--auth-rr-phone-indent', `-${prefixW}px`);
    }
  }

  /**
   * Заранее мерим indent до первой цифры — иначе caret улетает вправо.
   * force — на фокусе: шрифт мог догрузиться после первого замера.
   */
  function ensurePrefixIndent(el = inputRef.value, { force = false } = {}) {
    if (!el) {
      return;
    }
    syncPrefixIndent(el, '1', { force: force || lastPrefixIndentPx < 1 });
  }

  function emitModel(digits) {
    const next = digits.length > 0 ? formatRuPhone(digits) : '';
    emit('update:modelValue', next);
    return next;
  }

  /**
   * Display через Vue (localValue → typedParts / maskTail).
   * Нельзя писать textContent в __typed/__mask — там Vue-дети (подсветка выделения),
   * иначе следующий patch падает с null.type.
   */
  function setLocalDisplay(local, _digits = extractUserDigits(local)) {
    localValue.value = local;
  }

  function applyDigits(digits, el, cursorDigits = digits.length) {
    const local = formatLocalPart(digits);
    const full = inputValueForDom(digits, isFocused.value);

    // Indent ДО value: иначе один кадр с indent=0 → caret улетает вправо.
    if (el) {
      ensurePrefixIndent(el);
    }

    setLocalDisplay(local, digits);
    emitModel(digits);

    if (el) {
      el.value = full;
      const cursorPos = cursorInFull(digits, cursorDigits, isFocused.value);
      try {
        el.setSelectionRange(cursorPos, cursorPos);
        clampCursorOutOfPrefix(el, digits);
      } catch {
        /* ignore */
      }
    }

    return local;
  }

  function clearField(el) {
    selectionHighlight.value = null;
    setLocalDisplay('', '');
    emitModel('');
    if (el) {
      if (isFocused.value) {
        ensurePrefixIndent(el);
        el.value = PREFIX;
        try {
          el.setSelectionRange(PREFIX.length, PREFIX.length);
        } catch {
          /* ignore */
        }
      } else {
        el.value = '';
        syncPrefixIndent(el);
        try {
          el.setSelectionRange(0, 0);
        } catch {
          /* ignore */
        }
      }
    }
  }

  /**
   * Жёлтый слой Safari. Не трогаем DOM, пока номер неполный —
   * remount / value='' на середине autofill обрывает вставку («+7 (97»).
   */
  function neutralizeAutofillPaint(el) {
    if (!el || hasUserSelection(el)) {
      return;
    }
    const digits = extractUserDigits(el.value || localValue.value);
    if (digits.length < 10) {
      return;
    }
    const value = el.value;
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const ac = el.getAttribute('autocomplete');
    el.setAttribute('autocomplete', 'off');
    el.value = '';
    el.value = value;
    if (ac == null) {
      el.removeAttribute('autocomplete');
    } else {
      el.setAttribute('autocomplete', ac);
    }
    restoreSelection(el, start, end);
    requestAnimationFrame(() => {
      if (!el || hasUserSelection(el)) {
        return;
      }
      restoreSelection(el, start, end);
    });
  }

  function notifyAutofillSettled() {
    if (typeof document === 'undefined') {
      return;
    }
    document.dispatchEvent(new CustomEvent('auth-rr-autofill-settled'));
  }

  function syncFromDom({ fromAutofill = false } = {}) {
    const el = inputRef.value;
    if (!el) {
      return;
    }

    // Ctrl+A / выделение мышью: не трогаем value и selection (иначе таймеры autofill сбрасывают).
    if (hasUserSelection(el)) {
      syncPrefixIndent(el);
      return;
    }

    const raw = el.value || '';
    const digits = extractUserDigits(raw);
    const currentDigits = extractUserDigits(localValue.value);

    // immediate watch syncFromModel часто бежит до mount → input.value пустой,
    // а localValue/model уже с номером. Без этого applyDigits('') стирает телефон
    // (типично: шаг контактов профиля после loadInitial / переход 1→2).
    if (
      digits.length === 0 &&
      currentDigits.length > 0 &&
      !fromAutofill &&
      !maskPausedForAutofill
    ) {
      el.value = fullValueForDom(currentDigits);
      setLocalDisplay(formatLocalPart(currentDigits), currentDigits);
      syncPrefixIndent(el);
      return;
    }

    if (fromAutofill || maskPausedForAutofill) {
      // Пустое поле (или только «+7 (») — автозаполнения не было, паузу не ставим.
      if (digits.length === 0) {
        syncPrefixIndent(el);
        return;
      }
      // Ничего не изменилось с прошлой синхронизации — это не autofill.
      if (digits === currentDigits && !maskPausedForAutofill) {
        syncPrefixIndent(el);
        return;
      }
      if (digits.length < 10) {
        pauseMaskForAutofill({ bumpSettle: false });
        previewDigitsWithoutRewriting(el, digits);
        return;
      }
      flushAutofillMask();
      return;
    }

    if (digits !== currentDigits) {
      applyDigits(digits, el, digits.length);
      return;
    }

    const normalized = fullValueForDom(digits);
    if (raw !== normalized) {
      const start = el.selectionStart ?? normalized.length;
      const end = el.selectionEnd ?? normalized.length;
      el.value = normalized;
      syncPrefixIndent(el);
      restoreSelection(el, start, end);
    } else {
      syncPrefixIndent(el);
    }

    // Жёлтый autofill-слой гасим в ветках выше (fromAutofill / смена цифр).
  }

  /** force — пришёл реальный autofill (:autofill animation): поллинг нужен даже после ручного ввода. */
  function scheduleAutofillSync({ force = false } = {}) {
    clearPollTimers();
    if (force) {
      userTyped = false;
    } else if (userTyped) {
      return;
    }
    const run = () => {
      if (userTyped) {
        clearPollTimers();
        return;
      }
      syncFromDom({ fromAutofill: true });
    };
    requestAnimationFrame(run);
    for (const delay of [50, 150, 350, 700, 1200, 2000, 3200]) {
      autofillSyncTimers.push(setTimeout(run, delay));
    }
  }

  function syncFromModel(newValue) {
    // Readonly: всегда зеркалим model → DOM (фокус не для ввода).
    // Иначе при клике на locked-поле профиль может «не подставиться».
    if (isFocused.value && !props.readonly) {
      return;
    }

    const digits = extractUserDigits(newValue);
    const local = formatLocalPart(digits);
    const full = fullValueForDom(digits);

    setLocalDisplay(local, digits);
    if (inputRef.value) {
      inputRef.value.value = full;
      syncPrefixIndent(inputRef.value);
    }

    if (full && !full.startsWith('+7')) {
      errorMessage.value = 'Телефон должен начинаться с +7';
    } else {
      errorMessage.value = props.error || '';
    }
  }

  /**
   * Во время вставки из профиля браузера только класс-маркер для CSS-прикрытия
   * UA-превью. Layout (+7(, display, indent) не меняем — иначе всё «улетает».
   */
  function syncAutofillVisualState() {
    const el = inputRef.value;
    const root = el?.closest?.('.auth-rr-input-phone');
    if (!(root instanceof HTMLElement)) {
      return;
    }
    root.classList.toggle('auth-rr-input-phone--autofilling', maskPausedForAutofill);
    root.classList.remove('auth-rr-input-phone--native-text');
    root.classList.remove('auth-rr-input-phone--selecting');
  }

  function updateSelectionHighlight(el = inputRef.value) {
    if (!el || typeof document === 'undefined' || document.activeElement !== el) {
      selectionHighlight.value = null;
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    if (typeof start !== 'number' || typeof end !== 'number' || start === end) {
      selectionHighlight.value = null;
      return;
    }
    selectionHighlight.value = digitSelectionRange(el.value || '', start, end);
  }

  const handleSelect = () => {
    updateSelectionHighlight();
  };

  const handleFocus = () => {
    isFocused.value = true;
    errorMessage.value = '';
    const el = inputRef.value;
    if (el) {
      // Readonly: только показать model, без PREFIX для пустого ввода.
      if (props.readonly) {
        syncFromModel(props.modelValue);
        syncAutofillVisualState();
        return;
      }
      // Сразу готовим indent + PREFIX, чтобы быстрый ввод не слал caret вправо.
      ensurePrefixIndent(el, { force: true });
      const digits = extractUserDigits(el.value || localValue.value);
      if (digits.length === 0) {
        el.value = PREFIX;
        try {
          el.setSelectionRange(PREFIX.length, PREFIX.length);
        } catch {
          /* ignore */
        }
      } else {
        clampCursorOutOfPrefix(el, digits);
      }
    }
    syncAutofillVisualState();
    scheduleAutofillSync();
  };

  const handleBlur = () => {
    isFocused.value = false;
    selectionHighlight.value = null;
    maskPausedForAutofill = false;
    syncAutofillVisualState();
    clearAutofillTimers();
    if (props.readonly) {
      syncFromModel(props.modelValue);
      return;
    }
    const digits = extractUserDigits(localValue.value);
    const local = formatLocalPart(digits);
    const full = fullValueForDom(digits);

    setLocalDisplay(local, digits);
    emitModel(digits);

    if (inputRef.value) {
      inputRef.value.value = full;
      syncPrefixIndent(inputRef.value);
    }

    errorMessage.value = props.error || '';
  };

  const handleInput = (event) => {
    const el = event.target;
    const oldRaw = el.value || '';
    const oldCursorPos = el.selectionStart ?? 0;
    const inputType = event.inputType || '';
    const prevDigits = extractUserDigits(localValue.value);
    const digits = extractUserDigits(oldRaw);
    const rawDigits = oldRaw.replace(/\D/g, '');
    const isUnmaskedIncoming =
      Boolean(oldRaw) &&
      !oldRaw.startsWith(PREFIX) &&
      (oldRaw.includes('+') || oldRaw.startsWith('8') || oldRaw.startsWith('7'));
    const isBulkInsert =
      maskPausedForAutofill ||
      isAutofillInputType(inputType) ||
      isUnmaskedIncoming ||
      rawDigits.length - prevDigits.length > 1;

    if (isBulkInsert) {
      pauseMaskForAutofill();
      previewDigitsWithoutRewriting(el, digits);
      if (digits.length >= 10) {
        flushAutofillMask();
      }
      return;
    }

    // Курсор в полном значении: «7» из «+7 (» не считаем пользовательской цифрой
    let digitsBeforeCursor = 0;
    const start = Math.min(oldCursorPos, oldRaw.length);
    const countFrom = oldRaw.startsWith(PREFIX) ? PREFIX.length : 0;
    for (let i = countFrom; i < start; i++) {
      if (/\d/.test(oldRaw[i])) {
        digitsBeforeCursor++;
      }
    }

    applyDigits(digits, el, digitsBeforeCursor);
  };

  const handleBeforeInput = (event) => {
    // Autofill / bulk: не трогаем — Safari обрывает вставку при preventDefault.
    if (isAutofillInputType(event.inputType || '') || maskPausedForAutofill) {
      pauseMaskForAutofill();
      return;
    }

    const el = event.target;
    if (!(el instanceof HTMLInputElement)) {
      return;
    }

    const inputType = event.inputType || '';
    const data = event.data || '';

    // Живой ввод — выключаем autofill-поллинг, он бы сбил маску.
    if (inputType.startsWith('insert') || inputType.startsWith('delete')) {
      noteUserTyping();
    }

    // Обычный набор цифры — сами вставляем уже отформатированное, без кадра «сырого» ввода.
    if (inputType === 'insertText' && /^\d$/.test(data)) {
      event.preventDefault();
      const prev = extractUserDigits(el.value || localValue.value);
      const selStart = el.selectionStart ?? (el.value || '').length;
      const selEnd = el.selectionEnd ?? selStart;
      const raw = el.value || '';
      const prefixLen = raw.startsWith(PREFIX) ? PREFIX.length : 0;

      let digitsBefore = 0;
      const from = Math.min(selStart, raw.length);
      for (let i = prefixLen; i < from; i++) {
        if (/\d/.test(raw[i])) {
          digitsBefore++;
        }
      }
      let digitsInSelection = 0;
      for (let i = Math.min(selStart, selEnd); i < Math.max(selStart, selEnd); i++) {
        if (i >= prefixLen && /\d/.test(raw[i] || '')) {
          digitsInSelection++;
        }
      }

      // Поле уже полное — можно только заменить выделенное (в т.ч. Ctrl+A), иначе no-op.
      if (prev.length >= 10 && digitsInSelection === 0) {
        return;
      }

      const next =
        prev.slice(0, digitsBefore) + data + prev.slice(digitsBefore + digitsInSelection);
      applyDigits(normalizeRuPhoneDigits(next), el, digitsBefore + 1);
      selectionHighlight.value = null;
      return;
    }

    if (
      inputType === 'deleteContentBackward' ||
      inputType === 'deleteContentForward' ||
      inputType === 'deleteByCut'
    ) {
      const raw = el.value || '';
      const selStart = el.selectionStart ?? 0;
      const selEnd = el.selectionEnd ?? 0;
      const prev = extractUserDigits(raw);
      if (!prev) {
        event.preventDefault();
        clearField(el);
        return;
      }

      // Полное выделение — чистим сразу.
      if (selStart === 0 && selEnd === raw.length && raw.length > 0) {
        event.preventDefault();
        clearField(el);
        return;
      }

      const prefixLen = raw.startsWith(PREFIX) ? PREFIX.length : 0;
      if (selStart === selEnd) {
        // Backspace в префиксе — игнор.
        if (inputType === 'deleteContentBackward' && selStart <= prefixLen) {
          event.preventDefault();
          return;
        }
        if (inputType === 'deleteContentForward' && selStart < prefixLen) {
          event.preventDefault();
          return;
        }
      }

      event.preventDefault();

      let digitsBefore = 0;
      for (let i = prefixLen; i < Math.min(selStart, raw.length); i++) {
        if (/\d/.test(raw[i])) {
          digitsBefore++;
        }
      }
      let digitsInSelection = 0;
      for (let i = Math.min(selStart, selEnd); i < Math.max(selStart, selEnd); i++) {
        if (i >= prefixLen && /\d/.test(raw[i] || '')) {
          digitsInSelection++;
        }
      }

      let next = prev;
      let cursorDigits = digitsBefore;
      if (digitsInSelection > 0) {
        next = prev.slice(0, digitsBefore) + prev.slice(digitsBefore + digitsInSelection);
      } else if (inputType === 'deleteContentBackward' && digitsBefore > 0) {
        next = prev.slice(0, digitsBefore - 1) + prev.slice(digitsBefore);
        cursorDigits = digitsBefore - 1;
      } else if (inputType === 'deleteContentForward' && digitsBefore < prev.length) {
        next = prev.slice(0, digitsBefore) + prev.slice(digitsBefore + 1);
      }

      applyDigits(next, el, cursorDigits);
    }
  };

  const handlePaste = (event) => {
    const el = event.target;
    let pasted = (event.clipboardData || window.clipboardData)?.getData('text') || '';
    pasted = pasted.trim();
    if (!pasted) {
      return;
    }
    event.preventDefault();
    selectionHighlight.value = null;
    pauseMaskForAutofill();
    applyDigits(extractUserDigits(pasted), el);
    if (extractUserDigits(pasted).length >= 10) {
      neutralizeAutofillPaint(el);
      notifyAutofillSettled();
    }
  };

  const handleKeydown = (event) => {
    const el = event.target;
    if (/^\d$/.test(event.key) || event.key === 'Backspace' || event.key === 'Delete') {
      noteUserTyping();
    }
    const selectionStart = el.selectionStart ?? 0;
    const selectionEnd = el.selectionEnd ?? 0;
    const value = el.value || '';
    const digits = extractUserDigits(value);
    const isFullSelection = selectionStart === 0 && selectionEnd === value.length && value.length > 0;
    const min = digits.length > 0 || value.startsWith(PREFIX) ? PREFIX.length : 0;

    if ((event.key === 'Backspace' || event.key === 'Delete') && isFullSelection) {
      event.preventDefault();
      clearField(el);
      return;
    }

    if (min > 0) {
      if (event.key === 'Backspace' && selectionStart === selectionEnd && selectionStart <= min) {
        event.preventDefault();
        return;
      }
      if (event.key === 'Delete' && selectionStart === selectionEnd && selectionStart < min) {
        event.preventDefault();
        return;
      }
      if (event.key === 'Home' || (event.key === 'ArrowLeft' && selectionStart <= min && selectionStart === selectionEnd)) {
        event.preventDefault();
        el.setSelectionRange(min, min);
        return;
      }
    }

    const allowed = [
      'Tab', 'Shift', 'Control', 'Alt', 'Meta',
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End',
      'Backspace', 'Delete',
    ];
    if (allowed.includes(event.key) || event.ctrlKey || event.metaKey) {
      return;
    }
    if (!/^\d$/.test(event.key)) {
      event.preventDefault();
    }
  };

  const syncFromCredentialInput = () => {
    syncFromDom({ fromAutofill: true });
  };

  watch(() => props.error, (val) => {
    errorMessage.value = val || '';
  });

  watch(() => props.modelValue, syncFromModel, { immediate: true });

  const syncFromInputElement = () => {
    syncFromDom({ fromAutofill: true });
  };

  function onDocumentSelectionChange() {
    const el = inputRef.value;
    if (!el || document.activeElement !== el) {
      return;
    }
    updateSelectionHighlight(el);
  }

  onMounted(() => {
    const syncLayout = (force = false) => {
      const el = inputRef.value;
      if (!el) {
        return;
      }
      // Во время набора не пересчитываем indent — от этого прыгает caret.
      if (!force && isFocused.value && lastPrefixIndentPx > 0) {
        syncPrefixIndent(el);
        return;
      }
      syncPrefixIndent(el, isFocused.value || extractUserDigits(el.value) ? '1' : undefined, {
        force,
      });
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('selectionchange', onDocumentSelectionChange);
    }

    requestAnimationFrame(() => {
      // Сначала доливаем model в input (ref уже есть), потом DOM-sync.
      syncFromModel(props.modelValue);
      syncFromDom();
      if (!props.readonly) {
        scheduleAutofillSync();
      }
      syncLayout(true);
      const el = inputRef.value;
      const root = el?.closest('.auth-rr-input-phone');
      if (root && typeof ResizeObserver !== 'undefined') {
        layoutObserver = new ResizeObserver(() => {
          if (isFocused.value && lastPrefixIndentPx > 0) {
            return;
          }
          syncLayout(true);
        });
        layoutObserver.observe(root);
      }
    });

    if (typeof document !== 'undefined' && document.fonts?.ready && !fontsReadyHooked) {
      fontsReadyHooked = true;
      document.fonts.ready.then(() => syncLayout(true)).catch(() => {});
    }
  });

  onBeforeUnmount(() => {
    if (typeof document !== 'undefined') {
      document.removeEventListener('selectionchange', onDocumentSelectionChange);
    }
    layoutObserver?.disconnect();
    layoutObserver = null;
    clearAutofillTimers();
  });

  const clear = () => {
    clearField(inputRef.value);
    requestAnimationFrame(() => inputRef.value?.focus());
  };

  return {
    inputRef,
    localValue,
    selectionHighlight,
    errorMessage,
    handleFocus,
    handleBlur,
    handleSelect,
    handleInput,
    handleBeforeInput,
    handlePaste,
    handleKeydown,
    clear,
    syncFromInputElement,
    scheduleAutofillSync,
    syncFromCredentialInput,
  };
}
