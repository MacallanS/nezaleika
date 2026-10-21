/**
 * Единые тексты загрузочного экрана Auth RR.
 * SSO, fintech overlay и Vue-страницы обязаны брать copy отсюда —
 * иначе на склейке origin’ов меняется заголовок и кажется, что это другой экран.
 */
export const AUTH_RR_LOADING_COPY = {
  title: 'Сейчас войдём...',
  subtitle: 'Проверяем вход и открываем сервис.',
} as const

export const AUTH_RR_BOOT_COPY = {
  title: 'Загрузка...',
  subtitle: 'Открываем приложение',
} as const

export const AUTH_RR_LOGOUT_COPY = {
  title: 'Выход…',
  subtitle: 'Завершаем сессию…',
} as const

export type AuthRrLoadingCopy = {
  title: string
  subtitle: string
}
