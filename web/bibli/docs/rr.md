# Russ Redesign (RR)

Правило: **kit в `shared`, фича в `widgets`, папка `rr/` только если рядом ещё живёт `legacy/`**.
Onboarding уже RR-only — отдельную `rr/` не заводим.

Публичный импорт kit: `bibli/shared/ui/rr` (не глубокие пути в `form/` / `list/`, кроме CSS-шиммов).

| Что | Куда импортировать | Не сюда |
|-----|--------------------|---------|
| Кнопки, поля, OTP, правила пароля | `bibli/shared/ui/rr` | `widgets/Auth/rr` (там только layout) |
| Списки, поиск, чипы, бейджи, тулбар | `bibli/shared/ui/rr` | страница onboarding не дублирует kit |
| Шторы / select sheet | `bibli/shared/ui/rr` (`RrBottomSheet`, `RrSelectSheet`) | не `Profile/rr/personal` |
| Токены / `data-rr` | `bibli/shared/tokens`, `bibli/shared/theme/rr` | |
| Auth chrome | `bibli/widgets/Auth/rr` — Layout, loading, callback | |
| Профиль активации | `bibli/widgets/Profile/rr` — wizards + hub | |
| Нав | `bibli/widgets/Layout/rr` | legacy: `Layout/legacy` |
| App shell (nav + header + tabbar + content) | `bibli/widgets/Layout/rr` → `AppShellRR` | auth/session/API в host |
| Оформление таблиц | `bibli/widgets/Onboarding` (`ui/` + `lib/`) | |
| Маршруты / флаги / API / auth | хост (`russ-shell`, fintech, …): `src/app/routes` + `src/pages/*` | UI виджетов в хост не копировать |

Дерево kit:

```
shared/ui/rr/
  form/       AuthRR* (кнопки, поля, OTP)
  list/       RrGridList, toolbar, chips, badges
  overlays/   RrBottomSheet, RrSelectSheet
  lib/        rrStatusPresets
```
