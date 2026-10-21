# Документация по виджетам

## ClientRegistration

Виджет регистрации клиента.

### Импорт

```typescript
import { ClientRegistration } from '@russ-ui/bibli'
// или
import { ClientRegistration } from '@russ-ui/bibli/widgets'
```

### Использование

```vue
<template>
  <ClientRegistration 
    @success="handleSuccess"
    @cancel="handleCancel"
  />
</template>

<script setup>
import { ClientRegistration } from '@russ-ui/bibli'

const handleSuccess = (clientData) => {
  console.log('Клиент зарегистрирован:', clientData)
}

const handleCancel = () => {
  console.log('Регистрация отменена')
}
</script>
```

### Events

- `success` - успешная регистрация клиента
- `cancel` - отмена регистрации

## NotificationsPanel

Панель уведомлений.

### Импорт

```typescript
import { NotificationsPanel } from '@russ-ui/bibli'
```

### Использование

```vue
<template>
  <NotificationsPanel />
</template>

<script setup>
import { NotificationsPanel } from '@russ-ui/bibli'
</script>
```

## ClientList

Список клиентов.

### Импорт

```typescript
import { ClientList } from '@russ-ui/bibli/widgets'
```

### Использование

```vue
<template>
  <ClientList 
    :clients="clients"
    @select="handleSelect"
  />
</template>

<script setup>
import { ref } from 'vue'
import { ClientList } from '@russ-ui/bibli/widgets'

const clients = ref([...])

const handleSelect = (client) => {
  console.log('Выбран клиент:', client)
}
</script>
```

### Props

- `clients` (Array, required) - список клиентов

### Events

- `select` - выбор клиента

## AddItemBlock

Блок добавления элемента.

### Импорт

```typescript
import { AddItemBlock } from '@russ-ui/bibli/widgets'
```

### Использование

```vue
<template>
  <AddItemBlock 
    title="Добавить элемент"
    @add="handleAdd"
  />
</template>

<script setup>
import { AddItemBlock } from '@russ-ui/bibli/widgets'

const handleAdd = (itemData) => {
  console.log('Добавлен элемент:', itemData)
}
</script>
```

### Props

- `title` (String, optional) - заголовок блока

### Events

- `add` - добавление элемента

## RuchnikBlock

Блок "Ручник".

### Импорт

```typescript
import { RuchnikBlock } from '@russ-ui/bibli/widgets'
```

### Использование

```vue
<template>
  <RuchnikBlock 
    :data="ruchnikData"
  />
</template>

<script setup>
import { ref } from 'vue'
import { RuchnikBlock } from '@russ-ui/bibli/widgets'

const ruchnikData = ref({...})
</script>
```

### Props

- `data` (Object, optional) - данные блока

## UploadModal

Модальное окно загрузки файлов.

### Импорт

```typescript
import { UploadModal } from '@russ-ui/bibli/widgets'
```

### Использование

```vue
<template>
  <UploadModal 
    v-model="isOpen"
    @upload="handleUpload"
  />
</template>

<script setup>
import { ref } from 'vue'
import { UploadModal } from '@russ-ui/bibli/widgets'

const isOpen = ref(false)

const handleUpload = (files) => {
  console.log('Загружены файлы:', files)
}
</script>
```

### Props

- `modelValue` (Boolean) - видимость модального окна

### Events

- `update:modelValue` - обновление видимости
- `upload` - загрузка файлов

## ProjectInfoModal

Модальное окно с информацией о проекте.

### Импорт

```typescript
import { ProjectInfoModal } from '@russ-ui/bibli/widgets'
```

### Использование

```vue
<template>
  <ProjectInfoModal 
    v-model="isOpen"
    :project-id="projectId"
  />
</template>

<script setup>
import { ref } from 'vue'
import { ProjectInfoModal } from '@russ-ui/bibli/widgets'

const isOpen = ref(false)
const projectId = ref(1)
</script>
```

### Props

- `modelValue` (Boolean) - видимость
- `projectId` (Number, optional) - ID проекта

### Events

- `update:modelValue` - обновление видимости

## TaskDetailsModal

Модальное окно с деталями задачи.

### Импорт

```typescript
import { TaskDetailsModal } from '@russ-ui/bibli/widgets'
```

### Использование

```vue
<template>
  <TaskDetailsModal 
    v-model="isOpen"
    :task-id="taskId"
  />
</template>

<script setup>
import { ref } from 'vue'
import { TaskDetailsModal } from '@russ-ui/bibli/widgets'

const isOpen = ref(false)
const taskId = ref(1)
</script>
```

### Props

- `modelValue` (Boolean) - видимость
- `taskId` (Number, optional) - ID задачи

### Events

- `update:modelValue` - обновление видимости

## ArticlesStories

Виджет stories для статей.

### Импорт

```typescript
import { ArticlesStories } from '@russ-ui/bibli/widgets'
```

### Использование

```vue
<template>
  <ArticlesStories />
</template>

<script setup>
import { ArticlesStories } from '@russ-ui/bibli/widgets'
</script>
```
