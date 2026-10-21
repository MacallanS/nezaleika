# Система тем для russ-ui

Система динамических цветовых тем для библиотеки `russ-ui`. Позволяет легко переключаться между различными цветовыми схемами без изменения компонентов.

## Быстрый старт

### 1. Импорт CSS переменных

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

### 2. Установка темы

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

### 3. Использование в компонентах

Теперь все компоненты `russ-ui` будут использовать цвета из выбранной темы через CSS переменные.

## Доступные темы

### `fintech` (по умолчанию)
Синяя цветовая схема для проекта fintech:
- Основной цвет: `#213e89`
- Вторичный: `#6366f1`
- Акцент: `#2563eb`

### `rusaisklad`
Зеленая цветовая схема для проекта rusaisklad:
- Основной цвет: `#059669`
- Вторичный: `#10b981`
- Акцент: `#0d9488`

## Использование CSS переменных

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

## Программное управление темой

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

## Список CSS переменных

### Основные цвета
- `--russ-primary` - Основной цвет
- `--russ-primary-dark` - Темный вариант основного
- `--russ-primary-light` - Светлый вариант основного
- `--russ-primary-hover` - Цвет при наведении
- `--russ-primary-active` - Цвет при активации

### Вторичные цвета
- `--russ-secondary` - Вторичный цвет
- `--russ-secondary-dark` - Темный вариант вторичного
- `--russ-secondary-light` - Светлый вариант вторичного

### Акцентные цвета
- `--russ-accent` - Акцентный цвет
- `--russ-accent-dark` - Темный вариант акцента
- `--russ-accent-light` - Светлый вариант акцента

### Цвета текста
- `--russ-text-primary` - Основной текст
- `--russ-text-secondary` - Вторичный текст
- `--russ-text-tertiary` - Третичный текст
- `--russ-text-inverse` - Инвертированный текст (белый)

### Цвета фона
- `--russ-bg` - Основной фон
- `--russ-bg-secondary` - Вторичный фон
- `--russ-bg-tertiary` - Третичный фон

### Цвета границ
- `--russ-border` - Основная граница
- `--russ-border-light` - Светлая граница
- `--russ-border-dark` - Темная граница

### Статусные цвета
- `--russ-success` / `--russ-success-light` / `--russ-success-dark`
- `--russ-error` / `--russ-error-light` / `--russ-error-dark`
- `--russ-warning` / `--russ-warning-light` / `--russ-warning-dark`
- `--russ-info` / `--russ-info-light` / `--russ-info-dark`

### Дополнительные
- `--russ-label` - Цвет меток
- `--russ-value` - Цвет значений
- `--russ-checkbox-accent` - Цвет чекбоксов
- `--russ-focus-ring` - Цвет кольца фокуса

## Создание собственной темы

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

## Миграция компонентов

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

## Сохранение выбора темы

Система автоматически сохраняет выбранную тему в `localStorage` под ключом `russ-ui-theme` и восстанавливает её при следующем посещении.
