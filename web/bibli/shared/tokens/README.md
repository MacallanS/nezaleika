# Russ Redesign tokens (RR)

Токены из Figma (W3C Design Tokens) собираются в CSS-переменные `--rr-*`.

## Источник

JSON-файлы:

- `tokens/source/` — каноническая папка (при сборке копируется из `tockens/`, если пусто)
- `tockens/` — legacy-путь (экспорт из Figma, можно продолжать класть сюда)

## Сборка

```bash
cd bibli
npm run tokens:build
```

Результат:

- `shared/tokens/generated/*.css` — слои (primitives, semantic, components, typography, dimensions, density)
- `shared/tokens/generated/index.css` — импорт всех слоёв
- `shared/tokens/tokens.flat.json` — плоский справочник для JS/PrimeVue

## Подключение в приложении

```css
@import '@russ-ui/bibli/shared/theme/legacy/theme.css'; /* legacy --russ-* */
@import '@russ-ui/bibli/shared/tokens/index.css';       /* RR --rr-* */
/* opt-in bridge RR → --russ-*: */
/* @import '@russ-ui/bibli/shared/tokens/bridge/index.css'; */
```

```html
<html data-rr data-color-mode="light" data-rr-density="100" data-rr-viewport="desktop">
```

```ts
document.documentElement.toggleAttribute('data-rr', true);
document.documentElement.dataset.colorMode = 'light'; // | dark
```

## Брейкпоинты (Adaptives)

| Назначение | Токен / константа | Значение |
|------------|-------------------|----------|
| Mobile artboard | `--rr-adaptives-width-mobile` | `390px` |
| Desktop artboard | `--rr-adaptives-width-desktop` | `1440px` |
| Split layout (форма + hero) | `--rr-adaptives-layout-split-min` | `1024px` |

Файлы: `adaptives.css`, `adaptives.js`.

- `data-rr-viewport="mobile"` — ширина &lt; 1024px (или клавиатура).
- `data-rr-layout="split"` — ширина ≥ 1024px (если влезает по высоте).
- CSS desktop-only (main-max, OTP 70px) — `min-width: 1440px`.

## Слои

| Файл | Содержимое |
|------|------------|
| `primitives-*.css` | Палитра 3.1 Primitives |
| `semantic-*.css` | Semantic (фоны, текст, actions) |
| `components-*.css` | Компонентные токены (Button.* и т.д.) |
| `typography-*.css` | Desktop / Mobile шрифты |
| `dimensions-*.css` | Отступы, layout |
| `density-*.css` | Масштаб 75% / 100% / 116% / 133% |

## Мост на старые компоненты

`bridge/legacy-russ.css` подставляет `--russ-*` из `--rr-*`, чтобы `shared/ui/legacy` работали на новых цветах без переписывания.

## Обновление из Figma

1. Экспорт JSON слоёв:
   - `3.1 Primitives` → `Light/Dark-mode.tokens3.1 Primitivies.json`
   - `3.2 Semantic` → `Light/Dark-mode.tokens-semantic.json`
   - `3.3 Component` → `Light/Dark-mode.tokens.json`
2. Положить файлы в `bibli/tokens/source/` (и при желании в `bibli/tockens/`)
3. `npm run tokens:build`
4. Коммит `tokens/source/`, `tockens/`, `shared/tokens/generated/`, `tokens.flat.json`

Канонический пайплайн: `tockens/` синхронизируется в `tokens/source/` при сборке, затем генерируются CSS-слои `--rr-*`.
