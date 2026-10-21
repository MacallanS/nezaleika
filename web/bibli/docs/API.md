# Документация по API

## http

HTTP клиент на основе axios с настроенными interceptors.

### Импорт

```typescript
import { http } from '@russ-ui/bibli'
// или
import { http } from '@russ-ui/bibli/shared/api'
```

### Использование

```typescript
import { http } from '@russ-ui/bibli'

// GET запрос
const response = await http.get('/api/users')

// POST запрос
const data = await http.post('/api/users', {
  name: 'John',
  email: 'john@example.com'
})

// PUT запрос
await http.put('/api/users/1', {
  name: 'John Doe'
})

// DELETE запрос
await http.delete('/api/users/1')
```

### Особенности

- Автоматическое добавление токена авторизации из `User.getToken()`
- Автоматический редирект на `/auth` при 401/403 ошибках
- Автоматическое определение базового URL в зависимости от хоста
- Поддержка FormData

### Базовые URL

- Production: `https://server.rusaifin.ru`
- Development: `https://dev.server.rusaifin.ru` (для dev.*, localhost, 192.168.*, 172.20.*)
- Yandex: `https://yandex.server.rusaifin.ru` (для хостов с yandex.*)

## fetchUserPages

Получение страниц пользователя.

### Импорт

```typescript
import { fetchUserPages } from '@russ-ui/bibli/shared/api'
```

### Использование

```typescript
import { fetchUserPages } from '@russ-ui/bibli/shared/api'

const pages = await fetchUserPages()
```

### Возвращаемое значение

Promise с массивом страниц пользователя.

## API функции для продуктов

### Импорт

```typescript
import { 
  fetchProducts,
  fetchProductById,
  createProduct,
  updateProduct,
  deleteProduct
} from '@russ-ui/bibli/shared/api'
```

### Использование

```typescript
// Получить все продукты
const products = await fetchProducts()

// Получить продукт по ID
const product = await fetchProductById(1)

// Создать продукт
const newProduct = await createProduct({
  name: 'Новый продукт',
  price: 1000
})

// Обновить продукт
await updateProduct(1, {
  name: 'Обновленный продукт'
})

// Удалить продукт
await deleteProduct(1)
```

## API функции для профиля

### Импорт

```typescript
import {
  fetchProfile,
  updateProfile,
  uploadAvatar
} from '@russ-ui/bibli/shared/api'
```

### Использование

```typescript
// Получить профиль
const profile = await fetchProfile()

// Обновить профиль
await updateProfile({
  name: 'Иван Иванов',
  email: 'ivan@example.com'
})

// Загрузить аватар
const formData = new FormData()
formData.append('avatar', file)
await uploadAvatar(formData)
```

## API функции для приглашения друзей

### Импорт

```typescript
import {
  fetchFriends,
  createFriend,
  deleteFriend
} from '@russ-ui/bibli/shared/api'
```

### Использование

```typescript
// Получить список друзей
const friends = await fetchFriends()

// Пригласить друга
await createFriend({
  name: 'Друг',
  phone: '+79991234567'
})

// Удалить друга
await deleteFriend(friendId)
```
