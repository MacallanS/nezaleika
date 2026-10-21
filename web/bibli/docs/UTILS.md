# Документация по утилитам

## encryptData / decryptData

Шифрование и расшифровка данных.

### Импорт

```typescript
import { encryptData, decryptData } from '@russ-ui/bibli'
// или
import { encryptData, decryptData } from '@russ-ui/bibli/shared/utils'
```

### Использование

```typescript
import { encryptData, decryptData } from '@russ-ui/bibli'

// Шифрование
const encrypted = encryptData('секретные данные')
console.log(encrypted) // зашифрованная строка

// Расшифровка
const decrypted = decryptData(encrypted)
console.log(decrypted) // 'секретные данные'
```

### Функции

- `encryptData(data: string): string` - шифрует данные
- `decryptData(encryptedData: string): string` - расшифровывает данные

## isEncrypted

Проверка, зашифрованы ли данные.

### Импорт

```typescript
import { isEncrypted } from '@russ-ui/bibli/shared/utils'
```

### Использование

```typescript
import { isEncrypted } from '@russ-ui/bibli/shared/utils'

const data = 'some data'
if (isEncrypted(data)) {
  // Данные зашифрованы
  const decrypted = decryptData(data)
}
```

## createUserEncryptionKey

Создание ключа шифрования для пользователя.

### Импорт

```typescript
import { createUserEncryptionKey } from '@russ-ui/bibli/shared/utils'
```

### Использование

```typescript
import { createUserEncryptionKey } from '@russ-ui/bibli/shared/utils'

const key = createUserEncryptionKey(userId)
```

## localStorage утилиты

### Импорт

```typescript
import {
  setLocalStorage,
  getLocalStorage,
  removeLocalStorage,
  clearLocalStorage
} from '@russ-ui/bibli/shared/utils'
```

### Использование

```typescript
import { 
  setLocalStorage, 
  getLocalStorage, 
  removeLocalStorage 
} from '@russ-ui/bibli/shared/utils'

// Сохранить данные
setLocalStorage('key', 'value')

// Получить данные
const value = getLocalStorage('key')

// Удалить данные
removeLocalStorage('key')
```

### Функции

- `setLocalStorage(key: string, value: any): void` - сохранить в localStorage
- `getLocalStorage(key: string): any` - получить из localStorage
- `removeLocalStorage(key: string): void` - удалить из localStorage
- `clearLocalStorage(): void` - очистить весь localStorage

## deviceDetection

Утилиты для определения устройства.

### Импорт

```typescript
import { 
  isMobile,
  isTablet,
  isDesktop,
  deviceType
} from '@russ-ui/bibli/shared/utils'
```

### Использование

```typescript
import { isMobile, isDesktop } from '@russ-ui/bibli/shared/utils'

if (isMobile.value) {
  // Мобильное устройство
}

if (isDesktop.value) {
  // Десктоп
}
```

### Возвращаемые значения

- `isMobile` (ComputedRef) - мобильное устройство
- `isTablet` (ComputedRef) - планшет
- `isDesktop` (ComputedRef) - десктоп
- `deviceType` (ComputedRef) - тип устройства ('mobile' | 'tablet' | 'desktop')

## globalUtils

Глобальные утилиты.

### Импорт

```typescript
import {
  formatDate,
  formatCurrency,
  debounce,
  throttle
} from '@russ-ui/bibli/shared/utils'
```

### Использование

```typescript
import { formatDate, debounce } from '@russ-ui/bibli/shared/utils'

// Форматирование даты
const formatted = formatDate(new Date(), 'DD.MM.YYYY')

// Debounce функция
const debouncedSearch = debounce((query) => {
  console.log('Поиск:', query)
}, 300)

debouncedSearch('запрос')
```

### Функции

- `formatDate(date: Date, format: string): string` - форматирование даты
- `formatCurrency(amount: number, currency: string): string` - форматирование валюты
- `debounce(func: Function, delay: number): Function` - debounce функция
- `throttle(func: Function, delay: number): Function` - throttle функция
