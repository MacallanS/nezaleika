# Theme Migration — bibli

> Сводный документ по миграции компонентов библиотеки на CSS-переменные.
> Источники объединены 2026-05-18: MIGRATION + MIGRATION_GUIDE + MIGRATION_PROGRESS + MIGRATION_STATUS.

## 1. Overview

Это руководство поможет мигрировать существующие компоненты с хардкодных цветов на CSS переменные.

### 1.1. Таблица замены цветов

| Старый цвет | CSS переменная | Описание |
|------------|----------------|----------|
| `#213e89` | `var(--russ-primary)` | Основной цвет |
| `#1b3170` | `var(--russ-primary-hover)` | Основной цвет при наведении |
| `#162954` | `var(--russ-primary-active)` | Основной цвет при активации |
| `#6366f1` | `var(--russ-secondary)` или `var(--russ-label)` | Вторичный цвет / цвет меток |
| `#2563eb` | `var(--russ-accent)` или `var(--russ-checkbox-accent)` | Акцентный цвет |
| `#ffffff` | `var(--russ-bg)` или `var(--russ-text-inverse)` | Белый фон / инвертированный текст |
| `#1f2937` | `var(--russ-text-primary)` | Основной текст |
| `#374151` | `var(--russ-text-secondary)` | Вторичный текст |
| `#6b7280` | `var(--russ-text-tertiary)` | Третичный текст |
| `#e5e7eb` | `var(--russ-border)` | Границы |
| `#e2e8f0` | `var(--russ-border-light)` | Светлые границы |
| `#dc3545` | `var(--russ-error)` | Ошибки |
| `#22c55e` | `var(--russ-success)` | Успех |
| `#f59e0b` | `var(--russ-warning)` | Предупреждения |
| `#3b82f6` | `var(--russ-info)` | Информация |

### 1.2. Примеры миграции

#### Пример 1: Кнопка

**Было:**
```css
.button {
  background-color: #213e89;
  color: #ffffff;
}

.button:hover {
  background-color: #1b3170;
}
```

**Стало:**
```css
.button {
  background-color: var(--russ-primary);
  color: var(--russ-text-inverse);
}

.button:hover {
  background-color: var(--russ-primary-hover);
}
```

#### Пример 2: Текст и метки

**Было:**
```css
.label {
  color: #6366f1;
}

.value {
  color: #213e89;
}

.text {
  color: #374151;
}
```

**Стало:**
```css
.label {
  color: var(--russ-label);
}

.value {
  color: var(--russ-value);
}

.text {
  color: var(--russ-text-secondary);
}
```

#### Пример 3: Границы

**Было:**
```css
.border {
  border: 1px solid #e5e7eb;
}
```

**Стало:**
```css
.border {
  border: 1px solid var(--russ-border);
}
```

#### Пример 4: Статусные цвета

**Было:**
```css
.success {
  background: #e0fbe0;
  color: #22c55e;
  border: 1px solid #22c55e;
}

.error {
  background: #fee2e2;
  color: #dc3545;
  border: 1px solid #dc3545;
}
```

**Стало:**
```css
.success {
  background: var(--russ-success-light);
  color: var(--russ-success);
  border: 1px solid var(--russ-success);
}

.error {
  background: var(--russ-error-light);
  color: var(--russ-error);
  border: 1px solid var(--russ-error);
}
```

#### Пример 5: Фокус и активные состояния

**Было:**
```css
.input:focus {
  box-shadow: 0 0 0 2px rgba(33, 62, 137, 0.2);
}

.checkbox {
  accent-color: #2563eb;
}
```

**Стало:**
```css
.input:focus {
  box-shadow: 0 0 0 2px var(--russ-focus-ring);
}

.checkbox {
  accent-color: var(--russ-checkbox-accent);
}
```

### 1.3. Поиск и замена

Для быстрой миграции можно использовать поиск и замену в редакторе:

1. `#213e89` → `var(--russ-primary)`
2. `#6366f1` → `var(--russ-secondary)` или `var(--russ-label)` (в зависимости от контекста)
3. `#2563eb` → `var(--russ-accent)` или `var(--russ-checkbox-accent)`
4. `#ffffff` → `var(--russ-bg)` или `var(--russ-text-inverse)` (в зависимости от контекста)
5. `#e5e7eb` → `var(--russ-border)`
6. `#dc3545` → `var(--russ-error)`
7. `#22c55e` → `var(--russ-success)`

**Важно:** Всегда проверяйте контекст использования цвета перед заменой!

### 1.4. Проверка миграции

После миграции компонента:

1. Убедитесь, что CSS переменные определены (импортирован `theme.css`)
2. Проверьте, что тема установлена в приложении
3. Протестируйте компонент с разными темами (`fintech` и `rusaisklad`)
4. Убедитесь, что все состояния (hover, active, focus) работают корректно

## 2. Migration guide

Руководство по массовой миграции цветов.

### 2.1. Статус миграции

Завершено:
- Все компоненты `inputs/` (text, password, phone, code, passport, date)
- Компоненты `profile/` (ProfileStepPassport, ProfileStepContacts, ProfileSectionEmail, ProfileSectionPassport, ProfileSectionContacts, ProfileSectionType, ProfileSectionPhotos, PhotoModal, FilePreview)
- SearchInput
- Notification
- BaseModal

В процессе:
- Остальные модальные окна
- Остальные компоненты

### 2.2. Массовые замены для оставшихся компонентов

Используйте поиск и замену в вашем редакторе для следующих паттернов:

#### Основные цвета
- `#213e89` → `var(--russ-primary)` или `var(--russ-value)`
- `#1b3170` → `var(--russ-primary-hover)` или `var(--russ-primary-light)`
- `#162954` → `var(--russ-primary-active)` или `var(--russ-primary-dark)`
- `#6366f1` → `var(--russ-secondary)` или `var(--russ-label)`
- `#2563eb` → `var(--russ-accent)` или `var(--russ-checkbox-accent)`
- `#3b82f6` → `var(--russ-accent-light)` или `var(--russ-input-border-focus)`
- `#1d4cd2` → используется в градиентах (заменить на `var(--russ-accent)`)

#### Текст
- `#1f2937` → `var(--russ-text-primary)`
- `#374151` → `var(--russ-text-secondary)` или `var(--russ-input-text)`
- `#6b7280` → `var(--russ-text-tertiary)` или `var(--russ-input-placeholder)`
- `#9ca3af` → `var(--russ-text-quaternary)` или `var(--russ-neutral-light)`
- `#64748b` → `var(--russ-text-muted)`
- `#333` → `var(--russ-text-primary)`
- `#666` → `var(--russ-text-tertiary)`
- `#000` → `var(--russ-text-primary)`

#### Фоны
- `#ffffff` → `var(--russ-bg)` или `var(--russ-input-bg)`
- `#f8fafc` → `var(--russ-bg-secondary)`
- `#f9fafb` → `var(--russ-bg-quaternary)`
- `#f3f4f6` → `var(--russ-bg-hover)` или `var(--russ-bg-disabled)` или `var(--russ-input-bg-disabled)`
- `#f1f5f9` → `var(--russ-bg-tertiary)`
- `#e5e7eb` → `var(--russ-border)` или `var(--russ-bg-active)`
- `#e8edff` → `var(--russ-bg-blue-tint)`
- `#f5f7ff` → `var(--russ-bg-blue-light)`
- `#e0e7ff` → `var(--russ-bg-blue-lighter)`
- `#f4f7fb` → `var(--russ-bg-gray-light)`

#### Границы
- `#e5e7eb` → `var(--russ-border)`
- `#e2e8f0` → `var(--russ-border-light)`
- `#e3e8f0` → `var(--russ-border-light)`
- `#d1d5db` → `var(--russ-border-dark)`
- `#ced4da` → `var(--russ-input-border)` или `var(--russ-border-quaternary)`
- `#cbd5e1` → `var(--russ-border-light)`
- `#d4ddff` → `var(--russ-bg-blue-lighter)`

#### Ошибки
- `#dc3545` → `var(--russ-error)`
- `#ef4444` → `var(--russ-input-error)`
- `#D60000` → `var(--russ-input-border-error)`
- `#ffd6d6` → `var(--russ-input-error-bg)`
- `#fee2e2` → `var(--russ-error-light)`
- `#991b1b` → `var(--russ-error-text)`
- `#f44336` → `var(--russ-error)`

#### Успех
- `#22c55e` → `var(--russ-success)`
- `#10b981` → используется в градиентах (заменить на `var(--russ-success)`)
- `#059669` → primary для rusaisklad
- `#d1fae5` → `var(--russ-success-light)`
- `#065f46` → `var(--russ-success-text)`
- `#34d399` → `var(--russ-success-border)`
- `#4CAF50` → `var(--russ-success)`

#### Предупреждения
- `#f59e0b` → `var(--russ-warning)`
- `#fef3c7` → `var(--russ-warning-light)`
- `#92400e` → `var(--russ-warning-text)`
- `#ff9800` → `var(--russ-warning)`

#### Информация
- `#3b82f6` → `var(--russ-info)` или `var(--russ-accent-light)`
- `#2196F3` → `var(--russ-info)`
- `#dbeafe` → `var(--russ-info-light)`
- `#1e40af` → `var(--russ-info-text)`
- `#bfdbfe` → `var(--russ-info-border)`

#### Тени и оверлеи
- `rgba(0, 0, 0, 0.5)` → `var(--russ-overlay)`
- `rgba(0, 0, 0, 0.3)` → `var(--russ-overlay-light)`
- `rgba(0, 0, 0, 0.1)` → `var(--russ-shadow-color)`
- `rgba(33, 62, 137, 0.1)` → `var(--russ-shadow-primary)`
- `rgba(33, 62, 137, 0.06)` → `var(--russ-shadow-primary-light)`
- `rgba(33, 62, 137, 0.13)` → `var(--russ-shadow-primary)`
- `rgba(37, 99, 235, 0.2)` → `var(--russ-shadow-accent)` или `var(--russ-focus-ring)`
- `rgba(37, 99, 235, 0.1)` → `var(--russ-shadow-accent-light)`
- `rgba(99, 102, 241, 0.1)` → `var(--russ-shadow-secondary)`
- `rgba(29, 76, 210, 0.05)` → `var(--russ-accent-tint-12)`
- `rgba(29, 76, 210, 0.12)` → `var(--russ-accent-tint-12)`
- `rgba(29, 76, 210, 0.18)` → `var(--russ-accent-tint-18)`
- `rgba(29, 76, 210, 0.4)` → `var(--russ-accent-tint-40)`

#### Специальные цвета
- `#fed521` → `var(--russ-yellow)`
- `#fff3cd` → `var(--russ-yellow-light)`
- `#f39c12` → `var(--russ-orange)`
- `#ffeaa7` → `var(--russ-orange-light)`
- `#8b5cf6` → `var(--russ-purple)`
- `#e0e7ff` → `var(--russ-purple-light)`

### 2.3. Проверка после миграции

После замены цветов проверьте:
1. Компонент работает с темой `fintech`
2. Компонент работает с темой `rusaisklad`
3. Все состояния (hover, active, focus, disabled) работают корректно
4. Нет визуальных артефактов

### 2.4. Автоматизация

Для массовой миграции можно использовать регулярные выражения в редакторе:

**Поиск:** `#([0-9a-fA-F]{6})`
**Замена:** Используйте таблицу выше для каждого найденного цвета

Или используйте скрипт для автоматической замены (см. примеры в документации).

## 3. Progress

Прогресс миграции компонентов.

### 3.1. Статистика

- **Начальное количество совпадений:** 754
- **Текущее количество совпадений:** ~501
- **Мигрировано:** ~253 совпадения (33.5%)
- **Осталось файлов:** 22

### 3.2. Полностью мигрировано

1. Все компоненты `inputs/` (text, password, phone, code, passport, date, select)
2. Все компоненты `profile/` (все steps и sections, включая AgentTypeForm)
3. `buttons/button/index.vue`
4. `SearchInput/SearchInput.vue`
5. `notifications/Notification.vue`
6. `BaseModal/BaseModal.vue` (частично)
7. `BaseTable/BaseTable.vue` (частично)
8. `FilterItem/FilterItem.vue` (частично)
9. `FiltersBar/FiltersBar.vue` (частично)
10. `StatusSelect/StatusSelect.vue` (частично)
11. `DatePicker/DatePicker.vue` (частично)
12. `DateRangePicker/DateRangePicker.vue` (частично)
13. `MonthPicker/MonthPicker.vue` (частично)
14. `ConfirmModal/ConfirmModal.vue`
15. `UploadSuccessModal/UploadSuccessModal.vue`
16. `RedirectModal/RedirectModal.vue`
17. `ExtraditionModal/ExtraditionModal.vue`
18. `AddPagesModal/AddPagesModal.vue`
19. `FinalModal/FinalModal.vue`
20. `RolePagesModal/RolePagesModal.vue`
21. `ColumnFilter/ColumnFilter.vue` (частично)
22. `QRModal/QRModal.vue` (частично)
23. `YandexQRModal/YandexQRModal.vue` (частично)

### 3.3. Частично мигрировано (требуют доработки)

Эти компоненты имеют остаточные цвета, в основном в сложных селекторах или специфичных случаях:

- `BaseModal/BaseModal.vue` - 12 совпадений
- `DatePicker/DatePicker.vue` - 23 совпадения (внутренние элементы календаря)
- `DateRangePicker/DateRangePicker.vue` - 26 совпадений (внутренние элементы календаря)
- `MonthPicker/MonthPicker.vue` - 21 совпадение (внутренние элементы календаря)
- `StatusSelect/StatusSelect.vue` - 17 совпадений (специфичные статусы)
- `BaseTable/BaseTable.vue` - 10 совпадений
- `QRModal/QRModal.vue` - 9 совпадений
- `ColumnFilter/ColumnFilter.vue` - 6 совпадений
- `FilterItem/FilterItem.vue` - 5 совпадений
- `FiltersBar/FiltersBar.vue` - 15 совпадений
- `ProfileSectionPhotos.vue` - 5 совпадений
- `AgentTypeForm.vue` - 1 совпадение (rgba для границы)
- `YandexQRModal.vue` - 3 совпадения

### 3.4. Требуют миграции

- `StaffResultsModal/StaffResultsModal.vue` - 80 совпадений
- `MagnetSearchModal/MagnetSearchModal.vue` - 80 совпадений
- `EditShiftsModal/EditShiftsModal.vue` - 92 совпадения
- `EffectivenessModal/EffectivenessModal.vue` - 27 совпадений
- `ProductModal/ProductModal.vue` - 22 совпадения
- `CategoryModal/CategoryModal.vue` - 21 совпадение
- `Handler4FinalModal/Handler4FinalModal.vue` - 10 совпадений

### 3.5. Прогресс по категориям

#### Inputs: 100%
- Все компоненты полностью мигрированы

#### Profile: 100%
- Все компоненты полностью мигрированы

#### Базовые компоненты: ~90%
- Button, SearchInput, Notification - полностью
- BaseModal, BaseTable - частично

#### Модальные окна: ~60%
- Простые модалки - полностью
- Сложные модалки - требуют миграции

#### Date/Time компоненты: ~70%
- Основные стили мигрированы
- Внутренние элементы календаря требуют доработки

### 3.6. Следующие шаги

1. Завершить миграцию DatePicker/DateRangePicker/MonthPicker (внутренние элементы календаря)
2. Мигрировать крупные модальные окна (StaffResultsModal, MagnetSearchModal, EditShiftsModal)
3. Завершить миграцию остальных модальных окон
4. Провести финальную проверку всех компонентов

### 3.7. Рекомендации

Для ускорения миграции оставшихся компонентов:

1. Используйте таблицу замен из раздела 2 (Migration guide)
2. Применяйте поиск и замену по паттернам
3. Проверяйте работу с обеими темами после миграции
4. Обращайте внимание на специфичные цвета (например, желтый для YandexQRModal)

## 4. Status by component

Статус миграции компонентов на CSS переменные.

### 4.1. Полностью мигрировано

#### Inputs (100%)
- `inputs/text/index.vue`
- `inputs/password/index.vue`
- `inputs/phone/index.vue`
- `inputs/code/index.vue`
- `inputs/passport/index.vue`
- `inputs/date/index.vue`
- `inputs/select/BaseSelect.vue` — частично (23 совпадения осталось)

#### Profile (100%)
- `profile/steps/ProfileStepPassport.vue`
- `profile/steps/ProfileStepContacts.vue`
- `profile/steps/PhotoModal.vue`
- `profile/sections/ProfileSectionEmail.vue`
- `profile/sections/ProfileSectionPassport.vue`
- `profile/sections/ProfileSectionContacts.vue`
- `profile/sections/ProfileSectionType.vue`
- `profile/sections/ProfileSectionPhotos.vue`
- `profile/sections/FilePreview.vue`
- `profile/sections/AgentTypeForm.vue` — частично (33 совпадения осталось)

#### Базовые компоненты
- `buttons/button/index.vue`
- `SearchInput/SearchInput.vue`
- `notifications/Notification.vue`
- `BaseModal/BaseModal.vue` — частично (12 совпадений осталось)

### 4.2. Требуют миграции

#### Модальные окна
- `UploadSuccessModal/UploadSuccessModal.vue` (2 совпадения)
- `YandexQRModal/YandexQRModal.vue` (8 совпадений)
- `StatusSelect/StatusSelect.vue` (45 совпадений)
- `StaffResultsModal/StaffResultsModal.vue` (80 совпадений)
- `RolePagesModal/RolePagesModal.vue` (15 совпадений)
- `QRModal/QRModal.vue` (12 совпадений)
- `RedirectModal/RedirectModal.vue` (1 совпадение)
- `ProductModal/ProductModal.vue` (22 совпадения)
- `MonthPicker/MonthPicker.vue` (35 совпадений)
- `MagnetSearchModal/MagnetSearchModal.vue` (80 совпадений)
- `Handler4FinalModal/Handler4FinalModal.vue` (10 совпадений)
- `FinalModal/FinalModal.vue` (6 совпадений)
- `ExtraditionModal/ExtraditionModal.vue` (3 совпадения)
- `EffectivenessModal/EffectivenessModal.vue` (27 совпадений)
- `EditShiftsModal/EditShiftsModal.vue` (92 совпадения)
- `DateRangePicker/DateRangePicker.vue` (40 совпадений)
- `DatePicker/DatePicker.vue` (37 совпадений)
- `ConfirmModal/ConfirmModal.vue` (14 совпадений)
- `CategoryModal/CategoryModal.vue` (21 совпадение)

#### Другие компоненты
- `FiltersBar/FiltersBar.vue` (26 совпадений)
- `FilterItem/FilterItem.vue` (20 совпадений)
- `ColumnFilter/ColumnFilter.vue` (9 совпадений)
- `BaseTable/BaseTable.vue` (17 совпадений)
- `AddPagesModal/AddPagesModal.vue` (13 совпадений)

### 4.3. Статистика

- **Всего файлов:** 29
- **Полностью мигрировано:** ~10 файлов
- **Частично мигрировано:** ~5 файлов
- **Требуют миграции:** ~14 файлов
- **Осталось совпадений:** ~709

### 4.4. Приоритеты миграции

#### Высокий приоритет (часто используемые)
1. `inputs/select/BaseSelect.vue` - используется везде
2. `StatusSelect/StatusSelect.vue` - важный компонент
3. `DatePicker/DatePicker.vue` - часто используется
4. `DateRangePicker/DateRangePicker.vue` - часто используется
5. `ConfirmModal/ConfirmModal.vue` - базовый компонент

#### Средний приоритет
6. `BaseTable/BaseTable.vue` - таблицы
7. `FiltersBar/FiltersBar.vue` - фильтры
8. `FilterItem/FilterItem.vue` - элементы фильтров
9. `MonthPicker/MonthPicker.vue` - выбор месяца

#### Низкий приоритет (специфичные модалки)
10. Остальные модальные окна

### 4.5. Инструкции по миграции

См. раздел 2 (Migration guide) для подробных инструкций по массовой замене цветов.

### 4.6. Автоматизация

Для ускорения миграции можно использовать:
1. Поиск и замену по паттернам из раздела 2 (Migration guide)
2. Регулярные выражения для массовой замены
3. Скрипты автоматизации (при необходимости)

### 4.7. Проверка после миграции

После миграции каждого компонента проверьте:
1. Компонент работает с темой `fintech`
2. Компонент работает с темой `rusaisklad`
3. Все состояния (hover, active, focus, disabled) работают
4. Нет визуальных артефактов
5. Нет ошибок линтера
