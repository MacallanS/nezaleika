# Документация по Composables

## useNavigation

Composable для навигации и управления страницами.

### Импорт

```typescript
import { useNavigation } from '@russ-ui/bibli'
// или
import { useNavigation } from '@russ-ui/bibli/shared/composables'
```

### Использование

```typescript
import { useNavigation } from '@russ-ui/bibli'

const {
  pages,
  currentPage,
  navigateTo,
  canAccessPage,
  isLoading
} = useNavigation()

// Переход на страницу
navigateTo('/dashboard')

// Проверка доступа
if (canAccessPage('/admin')) {
  // ...
}
```

### Возвращаемые значения

- `pages` (ComputedRef) - список доступных страниц
- `currentPage` (ComputedRef) - текущая страница
- `navigateTo` (Function) - функция перехода на страницу
- `canAccessPage` (Function) - проверка доступа к странице
- `isLoading` (ComputedRef) - состояние загрузки

## useRoles

Composable для работы с ролями пользователя.

### Импорт

```typescript
import { useRoles } from '@russ-ui/bibli'
```

### Использование

```typescript
import { useRoles } from '@russ-ui/bibli'

const {
  userRole,
  isAdmin,
  isAgent,
  isDirector,
  canBlockUser
} = useRoles()

// Проверка роли
if (isAdmin.value) {
  // Администратор
}

// Проверка возможности блокировки пользователя
if (canBlockUser(otherUserRole)) {
  // Можно заблокировать
}
```

### Возвращаемые значения

- `userRole` (ComputedRef) - роль текущего пользователя
- `isAdmin` (ComputedRef) - является ли администратором
- `isAgent` (ComputedRef) - является ли агентом
- `isDirector` (ComputedRef) - является ли директором
- `isSupportOrAdmin` (ComputedRef) - поддержка или админ
- `canBlockUser` (Function) - может ли заблокировать пользователя
- `isRoleAbove` (Function) - проверка иерархии ролей

## useProjects

Composable для работы с проектами.

### Импорт

```typescript
import { useProjects } from '@russ-ui/bibli'
```

### Использование

```typescript
import { useProjects } from '@russ-ui/bibli'

const {
  projects,
  points,
  isLoading,
  loadProjects,
  getProjectById,
  getPointsByProjectId
} = useProjects()

// Загрузка проектов
await loadProjects()

// Получение проекта по ID
const project = getProjectById(1)

// Получение точек проекта
const projectPoints = getPointsByProjectId(1)
```

### Возвращаемые значения

- `projects` (ComputedRef) - список проектов
- `points` (ComputedRef) - список точек
- `isLoading` (ComputedRef) - состояние загрузки
- `loadProjects` (Function) - загрузка проектов
- `getProjectById` (Function) - получение проекта по ID
- `getPointsByProjectId` (Function) - получение точек проекта
- `clearCache` (Function) - очистка кэша

## useAgents

Composable для работы с агентами.

### Импорт

```typescript
import { useAgents } from '@russ-ui/bibli'
```

### Использование

```typescript
import { useAgents } from '@russ-ui/bibli'

const {
  agents,
  isLoading,
  loadAgents,
  getAgentsByProject,
  getAgentsByProjectAndPoint
} = useAgents()

// Загрузка агентов
await loadAgents()

// Получение агентов проекта
const projectAgents = getAgentsByProject(projectId)

// Получение агентов проекта и точки
const pointAgents = getAgentsByProjectAndPoint(projectId, pointId)
```

### Возвращаемые значения

- `agents` (ComputedRef) - список агентов
- `isLoading` (ComputedRef) - состояние загрузки
- `loadAgents` (Function) - загрузка агентов
- `getAgentsByProject` (Function) - получение агентов проекта
- `getAgentsByProjectAndPoint` (Function) - получение агентов проекта и точки

## useStories

Composable для работы со stories.

### Импорт

```typescript
import { useStories } from '@russ-ui/bibli'
```

### Использование

```typescript
import { useStories } from '@russ-ui/bibli'

const storiesGroups = ref([...])

const {
  showStoriesModal,
  currentStoriesGroupIndex,
  currentStoriesIndex,
  currentStories,
  currentStory,
  openGroup,
  closeStoriesModal,
  nextStory,
  prevStory,
  pauseStory,
  resumeStory
} = useStories(storiesGroups)

// Открыть группу stories
openGroup(0)

// Следующая story
nextStory()

// Предыдущая story
prevStory()
```

### Параметры

- `storiesGroups` (Ref) - группы stories

### Возвращаемые значения

- `showStoriesModal` (ComputedRef) - видимость модального окна
- `currentStoriesGroupIndex` (ComputedRef) - индекс текущей группы
- `currentStoriesIndex` (ComputedRef) - индекс текущей story
- `currentStories` (ComputedRef) - текущие stories
- `currentStory` (ComputedRef) - текущая story
- `openGroup` (Function) - открыть группу
- `closeStoriesModal` (Function) - закрыть модальное окно
- `nextStory` (Function) - следующая story
- `prevStory` (Function) - предыдущая story
- `pauseStory` (Function) - приостановить story
- `resumeStory` (Function) - возобновить story

## useAppUpdate

Composable для проверки обновлений приложения.

### Импорт

```typescript
import { useAppUpdate } from '@russ-ui/bibli'
```

### Использование

```typescript
import { useAppUpdate } from '@russ-ui/bibli'

const {
  isUpdateAvailable,
  checkForUpdate,
  updateApp
} = useAppUpdate()

// Проверка обновлений
await checkForUpdate()

if (isUpdateAvailable.value) {
  // Доступно обновление
  await updateApp()
}
```

### Возвращаемые значения

- `isUpdateAvailable` (ComputedRef) - доступно ли обновление
- `checkForUpdate` (Function) - проверить обновления
- `updateApp` (Function) - обновить приложение

## useYandexHost

Composable для определения Yandex хоста.

### Импорт

```typescript
import { useYandexHost } from '@russ-ui/bibli'
```

### Использование

```typescript
import { useYandexHost } from '@russ-ui/bibli'

const { isYandexHost } = useYandexHost()

if (isYandexHost.value) {
  // Работа на Yandex хосте
}
```

### Возвращаемые значения

- `isYandexHost` (ComputedRef) - является ли Yandex хостом
