# @russ-ui/bibli

Библиотека общих UI компонентов, composables, API утилит и виджетов для Vue 3 проектов.

**[Полная документация](./docs/README.md)** | [Компоненты](./docs/COMPONENTS.md) | [Composables](./docs/COMPOSABLES.md) | [API](./docs/API.md) | [Утилиты](./docs/UTILS.md) | [Виджеты](./docs/WIDGETS.md) | [RR](./docs/rr.md)

## Установка

### Шаг 1: Установка через npm

Добавьте зависимость в `package.json`:

```json
{
  "dependencies": {
    "@russ-ui/bibli": "git+https://github.com/RUSSMARKET/russ-ui.git#v1.0.0"
  }
}
```

**Важно:** Используйте правильный URL: `git+https://github.com/RUSSMARKET/russ-ui.git#v1.0.0`

Затем выполните:

```bash
npm install
```

### Шаг 2: Установка зависимостей

Библиотека требует следующие зависимости:

```bash
# Обязательные зависимости
npm install vue@^3.0.0 axios@^1.0.0

```

### Варианты установки

- Конкретная версия: `git+https://github.com/RUSSMARKET/russ-ui.git#v1.0.0`
- Последний коммит: `git+https://github.com/RUSSMARKET/russ-ui.git#main`
- Конкретный коммит: `git+https://github.com/RUSSMARKET/russ-ui.git#abc1234`

## Обновление библиотеки

### Обновление до новой версии

1. Обновите версию в `package.json`:
```json
{
  "dependencies": {
    "@russ-ui/bibli": "git+https://github.com/RUSSMARKET/russ-ui.git#v1.0.1"
  }
}
```

2. Удалите старую версию и установите новую:
```bash
# Очистить кэш и переустановить
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Использование последней версии из main

Для получения последних изменений (не рекомендуется для production):
```json
{
  "dependencies": {
    "@russ-ui/bibli": "git+https://github.com/RUSSMARKET/russ-ui.git#main"
  }
}
```

Подробная инструкция по обновлению: [UPDATE.md](./UPDATE.md)

## Быстрый старт

### Базовое использование

```vue
<template>
  <div>
    <BaseModal v-model="isOpen" title="Заголовок">
      <p>Содержимое модального окна</p>
    </BaseModal>
    
    <Button label="Открыть" @click="isOpen = true" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { BaseModal, Button } from '@russ-ui/bibli'

const isOpen = ref(false)
</script>
```

> Подробные примеры и документация по каждому компоненту: [docs/COMPONENTS.md](./docs/COMPONENTS.md)

## Документация

Полная документация по всем компонентам, composables, API и утилитам доступна в папке [docs/](./docs/).

### Быстрая навигация по документации

- **[Документация - Главная](./docs/README.md)** - навигация и обзор всей документации
- **[UI Компоненты](./docs/COMPONENTS.md)** - BaseModal, Button, SearchInput, DatePicker, InputText и другие
- **[Composables](./docs/COMPOSABLES.md)** - useNavigation, useRoles, useProjects, useAgents и другие
- **[API](./docs/API.md)** - HTTP клиент, функции для работы с API
- **[Утилиты](./docs/UTILS.md)** - шифрование, localStorage, определение устройства
- **[Виджеты](./docs/WIDGETS.md)** - ClientRegistration, NotificationsPanel, ClientList и другие

После установки библиотеки документация также доступна в `node_modules/@russ-ui/bibli/docs/`

## Структура библиотеки

```
@russ-ui/bibli/
├── shared/
│   ├── api/          # API функции и HTTP клиент
│   ├── composables/  # Vue composables
│   ├── ui/           # UI компоненты
│   └── utils/        # Утилиты
└── widgets/          # Виджеты (сложные компоненты)
```

## Импорт компонентов

### Полный импорт

```typescript
import { 
  BaseModal,
  Button,
  SearchInput,
  DatePicker,
  useNavigation,
  useRoles,
  http
} from '@russ-ui/bibli'
```

### Частичный импорт

```typescript
// Только UI компоненты
import { BaseModal, Button } from '@russ-ui/bibli/shared/ui'

// Только composables
import { useNavigation, useRoles } from '@russ-ui/bibli/shared/composables'

// Только API
import { http } from '@russ-ui/bibli/shared/api'

// Только утилиты
import { encryptData, decryptData } from '@russ-ui/bibli/shared/utils'

// Только виджеты
import { ClientRegistration } from '@russ-ui/bibli/widgets'
```

## Важные замечания

### Внешние зависимости проекта

Некоторые части библиотеки требуют наличия в вашем проекте:

- `@/entities` - сущность `User` (для авторизации)
- `@/stores` или `~/stores` - stores (roles, projects, agents)
- Настроенные алиасы путей (`@/`, `~/`)

### Настройка алиасов

В вашем проекте должны быть настроены алиасы путей:

```typescript
// vite.config.ts
import path from 'path'

export default {
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '~': path.resolve(__dirname, './src')
    }
  }
}
```

## Версионирование

Библиотека использует семантическое версионирование:

- MAJOR (2.0.0) - несовместимые изменения API
- MINOR (1.1.0) - новая функциональность с обратной совместимостью
- PATCH (1.0.1) - исправления ошибок

## Лицензия

MIT
