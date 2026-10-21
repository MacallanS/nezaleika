# Auth RR — статика (FSD: `shared/assets/auth/rr`)

Единственная точка импорта для виджетов: `bibli/shared/assets/auth/rr`.

## Структура

```
rr/
  brand/          — логотип
  icons/          — SVG UI (очистка, глаз, галочка правил)
  flags/          — флаг в поле телефона
  heroes/         — иллюстрации справа (desktop, .webp)
  index.ts        — публичный API
```

## API

| Экспорт | Назначение |
|---------|------------|
| `authRrBrand` | `{ logo }` |
| `authRrIcons` | `{ clear, eyeOpen, eyeOff, checkContained }` |
| `authRrFlags` | `{ ru }` |
| `authRrHeroByVariant` / `getAuthRrHero(variant)` | `login`, `password-recovery`, `enter-code`, `referral-invalid` |
| `authRrAssets` | обратная совместимость (плоский объект) |

## Файлы

| Путь | Экран / использование |
|------|------------------------|
| `heroes/login.webp` | Вход (телефон / пароль) |
| `heroes/enter-code.webp` | Ввод кода из SMS |
| `heroes/password-recovery.webp` | Восстановление пароля |
| `heroes/referral-invalid.webp` | Регистрация без / с неверной реферальной ссылкой (desktop, 3483×1335) |
| `heroes/referral-invalid-mobile.webp` | Тот же экран на mobile (984×1200) |
| `brand/logo.svg` | Шапка layout |
| `flags/ru.webp` | Префикс поля телефона |
| `icons/clear.svg` | Очистить телефон |
| `icons/eye-open.svg` / `eye-off.svg` | Показать пароль |
| `icons/check-contained.svg` | Правила пароля |

Замена hero: сохраняйте пропорции **2085×2739** (см. `authRrHeroByVariant` в `index.ts`).
