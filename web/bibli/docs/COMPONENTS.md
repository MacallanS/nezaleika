# Документация по UI компонентам

## BaseModal

Базовый компонент модального окна.

### Импорт

```typescript
import { BaseModal } from '@russ-ui/bibli'
// или
import { BaseModal } from '@russ-ui/bibli/shared/ui'
```

### Использование

```vue
<template>
  <BaseModal 
    v-model="isOpen" 
    title="Заголовок"
    subtitle="Подзаголовок"
    :closable="true"
    :close-on-overlay="true"
  >
    <p>Содержимое модального окна</p>
    
    <template #footer>
      <Button label="Закрыть" @click="isOpen = false" />
    </template>
  </BaseModal>
</template>

<script setup>
import { ref } from 'vue'
import { BaseModal, Button } from '@russ-ui/bibli'

const isOpen = ref(false)
</script>
```

### Props

- `modelValue` (Boolean, required) - видимость модального окна
- `title` (String, optional) - заголовок модального окна
- `subtitle` (String, optional) - подзаголовок
- `closable` (Boolean, default: true) - показывать кнопку закрытия
- `close-on-overlay` (Boolean, default: true) - закрывать при клике на overlay
- `width` (String, optional) - ширина модального окна
- `max-width` (String, optional) - максимальная ширина

### Slots

- `default` - основное содержимое
- `header` - кастомный заголовок
- `header-actions` - действия в заголовке
- `footer` - футер модального окна

### Events

- `update:modelValue` - обновление видимости
- `close` - событие закрытия

## Button

Кнопка с поддержкой состояний загрузки и иконок.

### Импорт

```typescript
import { Button } from '@russ-ui/bibli'
// или
import { Button } from '@russ-ui/bibli/shared/ui/buttons'
```

### Использование

```vue
<template>
  <Button 
    label="Отправить"
    :loading="isLoading"
    icon="pi pi-check"
    @click="handleSubmit"
  />
</template>

<script setup>
import { ref } from 'vue'
import { Button } from '@russ-ui/bibli'

const isLoading = ref(false)

const handleSubmit = async () => {
  isLoading.value = true
  // ... логика
  isLoading.value = false
}
</script>
```

### Props

- `label` (String, default: 'Далее') - текст кнопки
- `type` (String, default: 'button') - тип кнопки (button, submit, reset)
- `loading` (Boolean, default: false) - состояние загрузки
- `disabled` (Boolean, default: false) - отключена ли кнопка
- `icon` (String, optional) - класс иконки (PrimeIcons)
- `iconRight` (Boolean, default: false) - иконка справа
- `class` (String, optional) - дополнительные CSS классы

### Events

- `click` - клик по кнопке

## SearchInput

Поле поиска с debounce.

### Импорт

```typescript
import { SearchInput } from '@russ-ui/bibli'
```

### Использование

```vue
<template>
  <SearchInput 
    v-model="searchQuery"
    placeholder="Поиск..."
    :debounce="300"
    @search="handleSearch"
  />
</template>

<script setup>
import { ref } from 'vue'
import { SearchInput } from '@russ-ui/bibli'

const searchQuery = ref('')

const handleSearch = (value) => {
  console.log('Поиск:', value)
}
</script>
```

### Props

- `modelValue` (String) - значение поиска
- `placeholder` (String, optional) - placeholder
- `debounce` (Number, default: 300) - задержка debounce в мс

### Events

- `update:modelValue` - обновление значения
- `search` - событие поиска (после debounce)

## DatePicker

Выбор даты.

### Импорт

```typescript
import { DatePicker } from '@russ-ui/bibli'
```

### Использование

```vue
<template>
  <DatePicker 
    v-model="selectedDate"
    placeholder="Выберите дату"
  />
</template>

<script setup>
import { ref } from 'vue'
import { DatePicker } from '@russ-ui/bibli'

const selectedDate = ref(null)
</script>
```

### Props

- `modelValue` (Date | String | null) - выбранная дата
- `placeholder` (String, optional) - placeholder
- `disabled` (Boolean, default: false) - отключен ли компонент

### Events

- `update:modelValue` - обновление даты

## DateRangePicker

Выбор диапазона дат.

### Импорт

```typescript
import { DateRangePicker } from '@russ-ui/bibli'
```

### Использование

```vue
<template>
  <DateRangePicker 
    v-model="dateRange"
    placeholder="Выберите период"
  />
</template>

<script setup>
import { ref } from 'vue'
import { DateRangePicker } from '@russ-ui/bibli'

const dateRange = ref({
  from: null,
  to: null
})
</script>
```

### Props

- `modelValue` (Object: { from: Date | null, to: Date | null }) - диапазон дат
- `placeholder` (String, optional) - placeholder

### Events

- `update:modelValue` - обновление диапазона

## TimePicker

Выбор времени.

### Импорт

```typescript
import { TimePicker } from '@russ-ui/bibli'
```

### Использование

```vue
<template>
  <TimePicker
    v-model="selectedTime"
    label="Время встречи"
  />
</template>

<script setup>
import { ref } from 'vue'
import { TimePicker } from '@russ-ui/bibli'

const selectedTime = ref('09:30')
</script>
```

### Props

- `modelValue` (String) - выбранное время в формате `HH:mm` или `HH:mm:ss`
- `label` (String, optional) - подпись поля
- `disabled` (Boolean, default: false) - отключен ли компонент
- `step` (Number, default: 60) - шаг в секундах (например, 60 = шаг 1 минута)

### Events

- `update:modelValue` - обновление времени

## InputText

Текстовое поле ввода.

### Импорт

```typescript
import { InputText } from '@russ-ui/bibli/shared/ui/inputs'
```

### Использование

```vue
<template>
  <InputText 
    v-model="text"
    placeholder="Введите текст"
    :disabled="false"
  />
</template>

<script setup>
import { ref } from 'vue'
import { InputText } from '@russ-ui/bibli'

const text = ref('')
</script>
```

### Props

- `modelValue` (String) - значение
- `placeholder` (String, optional) - placeholder
- `disabled` (Boolean, default: false) - отключен ли input
- `type` (String, default: 'text') - тип input

### Events

- `update:modelValue` - обновление значения

## InputPhone

Поле ввода телефона с маской.

### Импорт

```typescript
import { InputPhone } from '@russ-ui/bibli/shared/ui/inputs'
```

### Использование

```vue
<template>
  <InputPhone 
    v-model="phone"
    placeholder="+7 (___) ___-__-__"
  />
</template>

<script setup>
import { ref } from 'vue'
import { InputPhone } from '@russ-ui/bibli'

const phone = ref('')
</script>
```

### Props

- `modelValue` (String) - номер телефона
- `placeholder` (String, optional) - placeholder

### Events

- `update:modelValue` - обновление номера

## InputPassword

Поле ввода пароля с переключением видимости.

### Импорт

```typescript
import { InputPassword } from '@russ-ui/bibli/shared/ui/inputs'
```

### Использование

```vue
<template>
  <InputPassword 
    v-model="password"
    placeholder="Введите пароль"
  />
</template>

<script setup>
import { ref } from 'vue'
import { InputPassword } from '@russ-ui/bibli'

const password = ref('')
</script>
```

### Props

- `modelValue` (String) - пароль
- `placeholder` (String, optional) - placeholder

### Events

- `update:modelValue` - обновление пароля

## BaseTable

Таблица с сортировкой и фильтрацией.

### Импорт

```typescript
import { BaseTable } from '@russ-ui/bibli'
```

### Использование

```vue
<template>
  <BaseTable 
    :columns="columns"
    :data="tableData"
    :loading="isLoading"
  />
</template>

<script setup>
import { ref } from 'vue'
import { BaseTable } from '@russ-ui/bibli'

const columns = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'name', label: 'Название', sortable: true }
]

const tableData = ref([
  { id: 1, name: 'Элемент 1' },
  { id: 2, name: 'Элемент 2' }
])

const isLoading = ref(false)
</script>
```

### Props

- `columns` (Array, required) - колонки таблицы
- `data` (Array, required) - данные таблицы
- `loading` (Boolean, default: false) - состояние загрузки

## FiltersBar

Панель фильтров.

### Импорт

```typescript
import { FiltersBar, type FilterConfig } from '@russ-ui/bibli'
```

### Использование

```vue
<template>
  <FiltersBar 
    :filters="filterConfig"
    v-model="filterValues"
    @apply="handleFilterApply"
  />
</template>

<script setup>
import { ref } from 'vue'
import { FiltersBar, type FilterConfig } from '@russ-ui/bibli'

const filterConfig: FilterConfig[] = [
  {
    key: 'search',
    type: 'text',
    label: 'Поиск'
  },
  {
    key: 'date',
    type: 'date',
    label: 'Дата'
  }
]

const filterValues = ref({})

const handleFilterApply = (values) => {
  console.log('Применены фильтры:', values)
}
</script>
```

### Props

- `filters` (FilterConfig[], required) - конфигурация фильтров
- `modelValue` (Object) - значения фильтров

### Events

- `update:modelValue` - обновление значений
- `apply` - применение фильтров

## QRModal

Модальное окно с QR кодом.

### Импорт

```typescript
import { QRModal } from '@russ-ui/bibli'
```

### Использование

```vue
<template>
  <QRModal 
    v-model="isOpen"
    :qr-url="qrCodeUrl"
    product-name="Название продукта"
  />
</template>

<script setup>
import { ref } from 'vue'
import { QRModal } from '@russ-ui/bibli'

const isOpen = ref(false)
const qrCodeUrl = ref('https://example.com/qr')
</script>
```

### Props

- `modelValue` (Boolean) - видимость модального окна
- `qrUrl` (String, optional) - URL для генерации QR кода
- `type` (String, default: 'default') - тип модального окна
- `productName` (String, optional) - название продукта
- `productLogo` (String, optional) - логотип продукта

### Events

- `update:modelValue` - обновление видимости
- `close` - закрытие модального окна

## ConfirmModal

Модальное окно подтверждения.

### Импорт

```typescript
import { ConfirmModal } from '@russ-ui/bibli'
```

### Использование

```vue
<template>
  <ConfirmModal 
    v-model="isOpen"
    title="Подтверждение"
    message="Вы уверены?"
    @confirm="handleConfirm"
  />
</template>

<script setup>
import { ref } from 'vue'
import { ConfirmModal } from '@russ-ui/bibli'

const isOpen = ref(false)

const handleConfirm = () => {
  console.log('Подтверждено')
  isOpen.value = false
}
</script>
```

### Props

- `modelValue` (Boolean) - видимость
- `title` (String, optional) - заголовок
- `message` (String, optional) - сообщение

### Events

- `update:modelValue` - обновление видимости
- `confirm` - подтверждение
- `cancel` - отмена
