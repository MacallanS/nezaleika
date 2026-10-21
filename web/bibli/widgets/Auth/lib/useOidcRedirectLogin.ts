import { onBeforeUnmount, ref } from 'vue';

const LOGIN_FALLBACK_MS = 5000;

export function useOidcRedirectLogin(startLogin: () => void) {
  const loading = ref(false);
  const authError = ref('');
  let loginFallbackTimer: ReturnType<typeof setTimeout> | null = null;

  const clearLoginFallbackTimer = () => {
    if (!loginFallbackTimer) return;
    clearTimeout(loginFallbackTimer);
    loginFallbackTimer = null;
  };

  const resetLoginState = () => {
    loading.value = false;
    authError.value = '';
    clearLoginFallbackTimer();
  };

  const onLoginClick = () => {
    authError.value = '';
    loading.value = true;
    clearLoginFallbackTimer();

    try {
      startLogin();
    } catch (e) {
      console.error('Ошибка запуска авторизации:', e);
      loading.value = false;
      authError.value = 'Не удалось открыть вход. Проверьте настройки и попробуйте снова.';
      return;
    }

    loginFallbackTimer = setTimeout(() => {
      if (!loading.value) return;
      loading.value = false;
      authError.value =
        'Переход к авторизации не начался. Проверьте доступность сервиса и повторите попытку.';
    }, LOGIN_FALLBACK_MS);
  };

  onBeforeUnmount(() => {
    clearLoginFallbackTimer();
  });

  return {
    loading,
    authError,
    onLoginClick,
    /** Запускает OIDC redirect на SSO (то же, что клик «Войти»). */
    startRedirectLogin: onLoginClick,
    resetLoginState,
    clearLoginFallbackTimer,
  };
}
