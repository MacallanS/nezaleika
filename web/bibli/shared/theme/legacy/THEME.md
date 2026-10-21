# Theme System — bibli

> Сводный документ по theme-системе библиотеки: обзор, quick start, цвета, примеры использования.
> Источники объединены 2026-05-18.

## 1. Overview

Система динамических цветовых тем для библиотеки `russ-ui`. Позволяет легко переключаться между различными цветовыми схемами без изменения компонентов.

### 1.1. Быстрый старт

#### Импорт CSS переменных

В вашем главном файле приложения (например, `app.vue` или `nuxt.config.ts`):

```typescript
// app.vue или main.ts
import '@russ-ui/bibli/shared/theme/theme.css'
```

Или в Nuxt через `nuxt.config.ts`:

```typescript
export default defineNuxtConfig({
  css: [
    '@russ-ui/bibli/shared/theme/theme.css'
  ]
})
```

#### Установка темы

В вашем главном компоненте приложения:

```vue
<script setup>
import { useTheme } from '@russ-ui/bibli/shared/theme'

// Установить тему для fintech (синяя)
useTheme('fintech')

// Или для rusaisklad (зеленая)
// useTheme('rusaisklad')
</script>
```

#### Использование в компонентах

Теперь все компоненты `russ-ui` будут использовать цвета из выбранной темы через CSS переменные.

### 1.2. Доступные темы

#### `fintech` (по умолчанию)
Синяя цветовая схема для проекта fintech:
- Основной цвет: `#213e89`
- Вторичный: `#6366f1`
- Акцент: `#2563eb`

#### `rusaisklad`
Зеленая цветовая схема для проекта rusaisklad:
- Основной цвет: `#059669`
- Вторичный: `#10b981`
- Акцент: `#0d9488`

### 1.3. Использование CSS переменных

В ваших компонентах вы можете использовать CSS переменные напрямую:

```vue
<style scoped>
.my-component {
  background-color: var(--russ-primary);
  color: var(--russ-text-inverse);
  border: 1px solid var(--russ-border);
}

.my-button:hover {
  background-color: var(--russ-primary-hover);
}
</style>
```

### 1.4. Программное управление темой

```vue
<script setup>
import { useTheme } from '@russ-ui/bibli/shared/theme'
import { ref } from 'vue'

const { theme, themeName, colors, setTheme } = useTheme('fintech')

// Переключить тему
function switchTheme() {
  const newTheme = themeName.value === 'fintech' ? 'rusaisklad' : 'fintech'
  setTheme(newTheme)
}

// Доступ к цветам
console.log(colors.value.primary) // #213e89
</script>
```

### 1.5. Список CSS переменных

#### Основные цвета
- `--russ-primary` - Основной цвет
- `--russ-primary-dark` - Темный вариант основного
- `--russ-primary-light` - Светлый вариант основного
- `--russ-primary-hover` - Цвет при наведении
- `--russ-primary-active` - Цвет при активации

#### Вторичные цвета
- `--russ-secondary` - Вторичный цвет
- `--russ-secondary-dark` - Темный вариант вторичного
- `--russ-secondary-light` - Светлый вариант вторичного

#### Акцентные цвета
- `--russ-accent` - Акцентный цвет
- `--russ-accent-dark` - Темный вариант акцента
- `--russ-accent-light` - Светлый вариант акцента

#### Цвета текста
- `--russ-text-primary` - Основной текст
- `--russ-text-secondary` - Вторичный текст
- `--russ-text-tertiary` - Третичный текст
- `--russ-text-inverse` - Инвертированный текст (белый)

#### Цвета фона
- `--russ-bg` - Основной фон
- `--russ-bg-secondary` - Вторичный фон
- `--russ-bg-tertiary` - Третичный фон

#### Цвета границ
- `--russ-border` - Основная граница
- `--russ-border-light` - Светлая граница
- `--russ-border-dark` - Темная граница

#### Статусные цвета
- `--russ-success` / `--russ-success-light` / `--russ-success-dark`
- `--russ-error` / `--russ-error-light` / `--russ-error-dark`
- `--russ-warning` / `--russ-warning-light` / `--russ-warning-dark`
- `--russ-info` / `--russ-info-light` / `--russ-info-dark`

#### Дополнительные
- `--russ-label` - Цвет меток
- `--russ-value` - Цвет значений
- `--russ-checkbox-accent` - Цвет чекбоксов
- `--russ-focus-ring` - Цвет кольца фокуса

### 1.6. Создание собственной темы

```typescript
import type { ThemeConfig } from '@russ-ui/bibli/shared/theme'
import { applyTheme } from '@russ-ui/bibli/shared/theme'

const myCustomTheme: ThemeConfig = {
  name: 'custom',
  colors: {
    primary: '#your-color',
    // ... остальные цвета
  }
}

// Применить тему
applyTheme(myCustomTheme)
```

### 1.7. Миграция компонентов

Для миграции существующих компонентов с хардкодных цветов на CSS переменные:

**Было:**
```css
.button {
  background-color: #213e89;
  color: #ffffff;
}
```

**Стало:**
```css
.button {
  background-color: var(--russ-primary);
  color: var(--russ-text-inverse);
}
```

### 1.8. Сохранение выбора темы

Система автоматически сохраняет выбранную тему в `localStorage` под ключом `russ-ui-theme` и восстанавливает её при следующем посещении.

## 2. Quick start

### 2.1. Что было сделано

Создана система динамических цветовых тем для `russ-ui`, которая позволяет:
- Использовать разные цветовые схемы для разных проектов (fintech - синяя, rusaisklad - зеленая)
- Легко переключаться между темами
- Использовать CSS переменные вместо хардкодных цветов

### 2.2. Быстрая настройка

#### Шаг 1: Импорт CSS в проекте

**Для fintech:**
```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  css: [
    '@russ-ui/bibli/shared/theme/theme.css'
  ],
})
```

**Для rusaisklad_front:**
```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  css: [
    '@russ-ui/bibli/shared/theme/theme.css'
  ],
})
```

#### Шаг 2: Установка темы

**Для fintech (app.vue):**
```vue
<script setup lang="ts">
import { useTheme } from '@russ-ui/bibli/shared/theme'

// Установить синюю тему для fintech
useTheme('fintech')

// ... остальной код
</script>
```

**Для rusaisklad_front (app.vue):**
```vue
<script setup lang="ts">
import { useTheme } from '@russ-ui/bibli/shared/theme'

// Установить зеленую тему для rusaisklad
useTheme('rusaisklad')

// ... остальной код
</script>
```

### 2.3. Готово

Теперь все компоненты `russ-ui` будут использовать цвета из выбранной темы.

### 2.4. Что дальше

1. **Обновить компоненты** — постепенно мигрировать остальные компоненты с хардкодных цветов на CSS переменные (см. MIGRATION.md)
2. **Настроить цвета** — при необходимости изменить цвета темы `rusaisklad` в файле `themes.ts`
3. **Использовать в своих компонентах** — использовать CSS переменные `--russ-*` в компонентах проектов

### 2.5. Документация

- Раздел 1 (Overview) — полная документация
- MIGRATION.md — руководство по миграции компонентов
- Раздел 5 (Usage examples) — примеры использования

## 3. Colors structure

Структура системы цветов russ-ui.

### 3.1. Принципы организации цветов

Система цветов организована по следующим принципам:

1. **Семантические имена** — цвета названы по их назначению, а не по внешнему виду
2. **Группировка по функциональности** — цвета сгруппированы по областям использования
3. **Единообразие** — похожие цвета объединены под одни переменные
4. **Расширяемость** — легко добавлять новые цвета и темы

### 3.2. Группы цветов

#### 3.2.1. Основные цвета (Primary)
Используются для основных действий, кнопок, ссылок
- `primary` - основной цвет бренда
- `primaryDark`, `primaryLight` - варианты основного цвета
- `primaryHover`, `primaryActive` - состояния интерактивных элементов
- `primaryGradientStart`, `primaryGradientEnd` - для градиентов

#### 3.2.2. Вторичные цвета (Secondary)
Используются для второстепенных элементов
- `secondary` - вторичный цвет
- `secondaryDark`, `secondaryLight` - варианты

#### 3.2.3. Акцентные цвета (Accent)
Используются для выделения важных элементов
- `accent` - акцентный цвет
- `accentDark`, `accentLight` - варианты
- `accentTint-*` - полупрозрачные варианты для фонов

#### 3.2.4. Цвета текста (Text)
Иерархия цветов текста от самого темного до самого светлого
- `textPrimary` - основной текст (самый темный)
- `textSecondary` - вторичный текст
- `textTertiary` - третичный текст
- `textQuaternary` - четвертичный текст
- `textMuted` - приглушенный текст
- `textInverse` - инвертированный текст (белый на темном фоне)

#### 3.2.5. Цвета фона (Background)
Иерархия фоновых цветов
- `background` - основной фон (белый)
- `backgroundSecondary` - вторичный фон
- `backgroundTertiary` - третичный фон
- `backgroundQuaternary` - четвертичный фон
- `backgroundHover` - фон при наведении
- `backgroundActive` - фон при активации
- `backgroundDisabled` - фон отключенных элементов
- Специальные фоны: `bg-blue-tint`, `bg-blue-light`, `bg-gray-light`

#### 3.2.6. Цвета границ (Border)
Иерархия цветов границ
- `border` - основная граница
- `borderLight` - светлая граница
- `borderDark` - темная граница
- `borderQuaternary` - четвертичная граница

#### 3.2.7. Цвета для инпутов (Input)
Специализированные цвета для полей ввода
- `inputBorder`, `inputBorderFocus`, `inputBorderError` - границы
- `inputBg`, `inputBgDisabled`, `inputBgHover` - фоны
- `inputText`, `inputPlaceholder` - текст
- `inputError`, `inputErrorBg` - ошибки

#### 3.2.8. Статусные цвета (Status)
Цвета для отображения статусов
- **Success**: `success`, `successLight`, `successDark`, `successText`, `successBorder`
- **Error**: `error`, `errorLight`, `errorDark`, `errorText`
- **Warning**: `warning`, `warningLight`, `warningDark`, `warningText`
- **Info**: `info`, `infoLight`, `infoDark`, `infoText`, `infoBorder`

#### 3.2.9. Нейтральные цвета (Neutral)
Серые оттенки для нейтральных элементов
- `neutral` - нейтральный цвет
- `neutralLight` - светлый нейтральный
- `neutralDark` - темный нейтральный

#### 3.2.10. Специальные цвета
Цвета для специфических случаев
- `yellow`, `yellowLight` - желтые оттенки
- `orange`, `orangeLight` - оранжевые оттенки
- `purple`, `purpleLight` - фиолетовые оттенки

#### 3.2.11. Дополнительные цвета
Специфичные цвета для определенных элементов
- `label` - цвет меток
- `value` - цвет значений
- `checkboxAccent` - цвет чекбоксов
- `focusRing` - цвет кольца фокуса

#### 3.2.12. Тени и оверлеи
- `overlay`, `overlayLight` - оверлеи для модальных окон
- `shadowColor` - базовый цвет тени
- `shadowPrimary`, `shadowPrimaryLight` - тени с primary цветом
- `shadowAccent`, `shadowAccentLight` - тени с accent цветом
- `shadowSecondary` - тень с secondary цветом

### 3.3. Объединение похожих цветов

Похожие цвета объединены под одни переменные:

#### Белый цвет
- `#ffffff` → `var(--russ-bg)` или `var(--russ-input-bg)` или `var(--russ-text-inverse)`

#### Серые оттенки текста
- `#1f2937` → `var(--russ-text-primary)`
- `#374151` → `var(--russ-text-secondary)` или `var(--russ-input-text)`
- `#6b7280` → `var(--russ-text-tertiary)` или `var(--russ-input-placeholder)`
- `#9ca3af` → `var(--russ-text-quaternary)` или `var(--russ-neutral-light)`
- `#64748b` → `var(--russ-text-muted)`

#### Серые оттенки фона
- `#f8fafc` → `var(--russ-bg-secondary)`
- `#f9fafb` → `var(--russ-bg-quaternary)`
- `#f3f4f6` → `var(--russ-bg-hover)` или `var(--russ-bg-disabled)` или `var(--russ-input-bg-disabled)`
- `#f1f5f9` → `var(--russ-bg-tertiary)`
- `#e5e7eb` → `var(--russ-border)` или `var(--russ-bg-active)`

#### Синие оттенки (для fintech)
- `#213e89` → `var(--russ-primary)` или `var(--russ-value)`
- `#1b3170` → `var(--russ-primary-hover)` или `var(--russ-primary-light)`
- `#162954` → `var(--russ-primary-active)` или `var(--russ-primary-dark)`
- `#6366f1` → `var(--russ-secondary)` или `var(--russ-label)`
- `#2563eb` → `var(--russ-accent)` или `var(--russ-checkbox-accent)`
- `#3b82f6` → `var(--russ-accent-light)` или `var(--russ-input-border-focus)`
- `#1d4cd2` → используется в градиентах и тенях

#### Цвета ошибок
- `#dc3545` → `var(--russ-error)`
- `#ef4444` → `var(--russ-input-error)`
- `#D60000` → `var(--russ-input-border-error)`
- `#ffd6d6` → `var(--russ-input-error-bg)`
- `#fee2e2` → `var(--russ-error-light)`
- `#991b1b` → `var(--russ-error-text)`

#### Цвета успеха
- `#22c55e` → `var(--russ-success)`
- `#10b981` → используется в градиентах (rusaisklad)
- `#059669` → primary для rusaisklad
- `#d1fae5` → `var(--russ-success-light)`
- `#065f46` → `var(--russ-success-text)`
- `#34d399` → `var(--russ-success-border)`

### 3.4. Правила использования

1. **Всегда используйте CSS переменные** вместо хардкодных цветов
2. **Выбирайте семантически правильную переменную** — не используйте `primary` там, где нужен `text-primary`
3. **Используйте правильную иерархию** — для текста используйте `text-primary`, `text-secondary` и т.д.
4. **Для инпутов используйте специализированные переменные** — `input-border`, `input-bg` и т.д.
5. **Для статусов используйте статусные цвета** — `success`, `error`, `warning`, `info`
6. **Для теней используйте переменные теней** — они автоматически адаптируются под тему

### 3.5. Миграция существующих компонентов

При миграции компонентов:

1. Найдите все хардкодные цвета (`#...`, `rgb(...)`, `rgba(...)`)
2. Определите семантическое назначение цвета
3. Найдите соответствующую CSS переменную в справочнике
4. Замените хардкодный цвет на переменную
5. Проверьте, что компонент работает с обеими темами

### 3.6. Примеры миграции

См. MIGRATION.md для подробных примеров миграции компонентов.

## 4. Colors reference

Полный список всех CSS переменных для системы тем russ-ui.

### 4.1. Основные цвета

- `--russ-primary` - Основной цвет (по умолчанию: #213e89 для fintech, #059669 для rusaisklad)
- `--russ-primary-dark` - Темный вариант основного цвета
- `--russ-primary-light` - Светлый вариант основного цвета
- `--russ-primary-hover` - Цвет при наведении
- `--russ-primary-active` - Цвет при активации
- `--russ-primary-gradient-start` - Начало градиента для primary
- `--russ-primary-gradient-end` - Конец градиента для primary

### 4.2. Вторичные цвета

- `--russ-secondary` - Вторичный цвет
- `--russ-secondary-dark` - Темный вариант вторичного
- `--russ-secondary-light` - Светлый вариант вторичного

### 4.3. Акцентные цвета

- `--russ-accent` - Акцентный цвет
- `--russ-accent-dark` - Темный вариант акцента
- `--russ-accent-light` - Светлый вариант акцента
- `--russ-accent-tint-12` - Акцент с прозрачностью 12%
- `--russ-accent-tint-18` - Акцент с прозрачностью 18%
- `--russ-accent-tint-40` - Акцент с прозрачностью 40%

### 4.4. Цвета текста

- `--russ-text-primary` - Основной текст (#1f2937)
- `--russ-text-secondary` - Вторичный текст (#374151)
- `--russ-text-tertiary` - Третичный текст (#6b7280)
- `--russ-text-quaternary` - Четвертичный текст (#9ca3af)
- `--russ-text-muted` - Приглушенный текст (#64748b)
- `--russ-text-inverse` - Инвертированный текст (белый)

### 4.5. Цвета фона

- `--russ-bg` - Основной фон (#ffffff)
- `--russ-bg-secondary` - Вторичный фон (#f8fafc)
- `--russ-bg-tertiary` - Третичный фон (#f1f5f9)
- `--russ-bg-quaternary` - Четвертичный фон (#f9fafb)
- `--russ-bg-hover` - Фон при наведении (#f3f4f6)
- `--russ-bg-active` - Фон при активации (#e5e7eb)
- `--russ-bg-disabled` - Фон для отключенных элементов (#f3f4f6)
- `--russ-bg-blue-tint` - Голубоватый оттенок фона
- `--russ-bg-blue-light` - Светлый голубой фон
- `--russ-bg-blue-lighter` - Еще более светлый голубой фон
- `--russ-bg-gray-light` - Светло-серый фон (#f4f7fb)

### 4.6. Цвета границ

- `--russ-border` - Основная граница (#e5e7eb)
- `--russ-border-light` - Светлая граница (#e2e8f0)
- `--russ-border-dark` - Темная граница (#d1d5db)
- `--russ-border-quaternary` - Четвертичная граница (#ced4da)

### 4.7. Цвета для инпутов

- `--russ-input-border` - Граница инпута (#ced4da)
- `--russ-input-border-focus` - Граница инпута при фокусе (#3b82f6)
- `--russ-input-border-error` - Граница инпута при ошибке (#D60000)
- `--russ-input-bg` - Фон инпута (#ffffff)
- `--russ-input-bg-disabled` - Фон отключенного инпута (#f3f4f6)
- `--russ-input-bg-hover` - Фон инпута при наведении
- `--russ-input-text` - Текст в инпуте (#374151)
- `--russ-input-placeholder` - Плейсхолдер инпута (#6b7280)
- `--russ-input-error` - Цвет ошибки инпута (#ef4444)
- `--russ-input-error-bg` - Фон ошибки инпута (#ffd6d6)

### 4.8. Статусные цвета

#### Успех
- `--russ-success` - Цвет успеха (#22c55e)
- `--russ-success-light` - Светлый фон успеха (#d1fae5)
- `--russ-success-dark` - Темный вариант успеха (#16a34a)
- `--russ-success-text` - Текст успеха (#065f46)
- `--russ-success-border` - Граница успеха (#34d399)

#### Ошибка
- `--russ-error` - Цвет ошибки (#dc3545)
- `--russ-error-light` - Светлый фон ошибки (#fee2e2)
- `--russ-error-dark` - Темный вариант ошибки (#c82333)
- `--russ-error-text` - Текст ошибки (#991b1b)

#### Предупреждение
- `--russ-warning` - Цвет предупреждения (#f59e0b)
- `--russ-warning-light` - Светлый фон предупреждения (#fef3c7)
- `--russ-warning-dark` - Темный вариант предупреждения (#d97706)
- `--russ-warning-text` - Текст предупреждения (#92400e)

#### Информация
- `--russ-info` - Цвет информации (#3b82f6)
- `--russ-info-light` - Светлый фон информации (#dbeafe)
- `--russ-info-dark` - Темный вариант информации (#2563eb)
- `--russ-info-text` - Текст информации (#1e40af)
- `--russ-info-border` - Граница информации (#bfdbfe)

### 4.9. Нейтральные цвета

- `--russ-neutral` - Нейтральный цвет (#6b7280)
- `--russ-neutral-light` - Светлый нейтральный (#9ca3af)
- `--russ-neutral-dark` - Темный нейтральный (#374151)

### 4.10. Специальные цвета

- `--russ-yellow` - Желтый (#fed521)
- `--russ-yellow-light` - Светлый желтый (#fff3cd)
- `--russ-orange` - Оранжевый (#f39c12)
- `--russ-orange-light` - Светлый оранжевый (#ffeaa7)
- `--russ-purple` - Фиолетовый (#8b5cf6)
- `--russ-purple-light` - Светлый фиолетовый (#e0e7ff)

### 4.11. Дополнительные цвета

- `--russ-label` - Цвет меток (обычно secondary)
- `--russ-value` - Цвет значений (обычно primary)
- `--russ-checkbox-accent` - Цвет чекбоксов (обычно accent)
- `--russ-focus-ring` - Цвет кольца фокуса (rgba с прозрачностью)

### 4.12. Цвета для теней и оверлеев

- `--russ-overlay` - Оверлей модальных окон (rgba(0, 0, 0, 0.5))
- `--russ-overlay-light` - Светлый оверлей (rgba(0, 0, 0, 0.3))
- `--russ-shadow-color` - Базовый цвет тени (rgba(0, 0, 0, 0.1))
- `--russ-shadow-primary` - Тень с primary цветом
- `--russ-shadow-primary-light` - Светлая тень с primary цветом
- `--russ-shadow-accent` - Тень с accent цветом
- `--russ-shadow-accent-light` - Светлая тень с accent цветом
- `--russ-shadow-secondary` - Тень с secondary цветом

### 4.13. Примеры использования

```css
/* Основная кнопка */
.button {
  background-color: var(--russ-primary);
  color: var(--russ-text-inverse);
}

.button:hover {
  background-color: var(--russ-primary-hover);
}

/* Инпут */
.input {
  border: 1px solid var(--russ-input-border);
  background: var(--russ-input-bg);
  color: var(--russ-input-text);
}

.input:focus {
  border-color: var(--russ-input-border-focus);
  box-shadow: 0 0 0 2px var(--russ-focus-ring);
}

.input.error {
  border-color: var(--russ-input-error);
}

/* Статусный бейдж */
.badge-success {
  background: var(--russ-success-light);
  color: var(--russ-success-text);
  border: 1px solid var(--russ-success-border);
}

/* Модальное окно */
.modal-overlay {
  background: var(--russ-overlay);
}

.modal-content {
  background: var(--russ-bg);
  box-shadow: 0 4px 12px var(--russ-shadow-color);
}
```

## 5. Usage examples

Примеры использования системы тем.

### 5.1. Для проекта fintech

#### Добавить CSS в nuxt.config.ts

```typescript
export default defineNuxtConfig({
  css: [
    '@russ-ui/bibli/shared/theme/theme.css'
  ],
  // ... остальная конфигурация
})
```

#### Установить тему в app.vue

```vue
<script setup lang="ts">
import { useTheme } from '@russ-ui/bibli/shared/theme'
// ... другие импорты

// Установить тему fintech (синяя)
useTheme('fintech')

// ... остальной код
</script>
```

### 5.2. Для проекта rusaisklad_front

#### Добавить CSS в nuxt.config.ts

```typescript
export default defineNuxtConfig({
  css: [
    '@russ-ui/bibli/shared/theme/theme.css'
  ],
  // ... остальная конфигурация
})
```

#### Установить тему в app.vue

```vue
<script setup lang="ts">
import { useTheme } from '@russ-ui/bibli/shared/theme'
// ... другие импорты

// Установить тему rusaisklad (зеленая)
useTheme('rusaisklad')

// ... остальной код
</script>
```

### 5.3. Динамическое переключение тем

Если нужно переключать темы во время выполнения:

```vue
<script setup>
import { useTheme } from '@russ-ui/bibli/shared/theme'
import { ref } from 'vue'

const { themeName, setTheme } = useTheme('fintech')

function toggleTheme() {
  const newTheme = themeName.value === 'fintech' ? 'rusaisklad' : 'fintech'
  setTheme(newTheme)
}
</script>

<template>
  <button @click="toggleTheme">
    Текущая тема: {{ themeName }}
  </button>
</template>
```

### 5.4. Использование цветов в компонентах проекта

В ваших собственных компонентах проектов также можно использовать CSS переменные:

```vue
<style scoped>
.my-component {
  background-color: var(--russ-bg);
  color: var(--russ-text-primary);
  border: 1px solid var(--russ-border);
}

.my-button {
  background-color: var(--russ-primary);
  color: var(--russ-text-inverse);
}

.my-button:hover {
  background-color: var(--russ-primary-hover);
}
</style>
```

### 5.5. Программный доступ к цветам

Если нужно получить цвет программно:

```vue
<script setup>
import { useTheme } from '@russ-ui/bibli/shared/theme'

const { colors } = useTheme('fintech')

// Использовать цвет в JavaScript
const primaryColor = colors.value.primary // '#213e89'
</script>
```
