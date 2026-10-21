/** OAuth callback route — suppress global recovery while login is in progress. */

export const OAUTH_CALLBACK_CODE_KEY = 'oauth_callback_code';
export const OAUTH_CALLBACK_STATE_KEY = 'oauth_callback_state';
export const OAUTH_CALLBACK_BUSY_KEY = 'oauth_callback_busy';
export const OAUTH_CALLBACK_PAGE_ACTIVE_KEY = 'oauth_callback_page_active';
export const AUTH_EARLY_REDIRECT_FLAG = 'auth_early_redirect_pending';
export const AUTH_EARLY_REDIRECT_AT_KEY = 'auth_early_redirect_at';
// Ранний редирект на SSO живёт максимум столько. Если флаг висит дольше — редирект
// не ушёл (Safari ITP вытеснил PKCE-слои / устаревший index ссылается на мёртвый
// чанк /auth), и подавлять recovery нельзя, иначе вечный пустой экран на /auth.
// Синхронно с EARLY_TTL в client-storage-migration (10s) + запас на медленный SSO-хоп.
export const AUTH_EARLY_REDIRECT_STALE_MS = 10000;

export function isAuthFlowPath(path?: string): boolean {
  if (typeof path !== 'string' || path === '') {
    if (typeof window === 'undefined') {
      return false;
    }
    path = window.location.pathname;
  }
  const normalized = path.replace(/\/+$/, '') || '/';
  return normalized === '/auth' || normalized.startsWith('/auth/');
}

export function isAuthCallbackPath(path?: string): boolean {
  if (typeof path !== 'string' || path === '') {
    if (typeof window === 'undefined') {
      return false;
    }
    path = window.location.pathname;
  }
  const normalized = path.replace(/\/+$/, '') || '/';
  return normalized === '/auth/callback';
}

export function hasOAuthCallbackParamsInUrl(doc?: Document): boolean {
  const target = doc ?? (typeof document !== 'undefined' ? document : null);
  if (!target) {
    return false;
  }
  try {
    const params = new URLSearchParams(target.defaultView?.location?.search ?? '');
    return Boolean(params.get('code') || params.get('error'));
  } catch {
    return false;
  }
}

export function hasOAuthCallbackParamsInStorage(): boolean {
  if (typeof sessionStorage === 'undefined') {
    return false;
  }
  try {
    return Boolean(sessionStorage.getItem(OAUTH_CALLBACK_CODE_KEY));
  } catch {
    return false;
  }
}

export function hasOAuthCallbackParams(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return hasOAuthCallbackParamsInUrl() || hasOAuthCallbackParamsInStorage();
}

export function setOAuthCallbackBusy(): void {
  if (typeof sessionStorage === 'undefined') {
    return;
  }
  try {
    sessionStorage.setItem(OAUTH_CALLBACK_BUSY_KEY, '1');
  } catch {
    // ignore
  }
}

export function clearOAuthCallbackBusy(): void {
  if (typeof sessionStorage === 'undefined') {
    return;
  }
  try {
    sessionStorage.removeItem(OAUTH_CALLBACK_BUSY_KEY);
  } catch {
    // ignore
  }
}

export function isOAuthCallbackBusy(): boolean {
  if (typeof sessionStorage === 'undefined') {
    return false;
  }
  try {
    return sessionStorage.getItem(OAUTH_CALLBACK_BUSY_KEY) === '1';
  } catch {
    return false;
  }
}

export function setOAuthCallbackPageActive(): void {
  if (typeof sessionStorage === 'undefined') {
    return;
  }
  try {
    sessionStorage.setItem(OAUTH_CALLBACK_PAGE_ACTIVE_KEY, '1');
  } catch {
    // ignore
  }
}

export function clearOAuthCallbackPageActive(): void {
  if (typeof sessionStorage === 'undefined') {
    return;
  }
  try {
    sessionStorage.removeItem(OAUTH_CALLBACK_PAGE_ACTIVE_KEY);
  } catch {
    // ignore
  }
}

export function isOAuthCallbackPageActive(): boolean {
  if (typeof sessionStorage === 'undefined') {
    return false;
  }
  try {
    return sessionStorage.getItem(OAUTH_CALLBACK_PAGE_ACTIVE_KEY) === '1';
  } catch {
    return false;
  }
}

export function isEarlyAuthRedirectPending(): boolean {
  if (typeof sessionStorage === 'undefined') {
    return false;
  }
  try {
    if (sessionStorage.getItem(AUTH_EARLY_REDIRECT_FLAG) !== '1') {
      return false;
    }
    // Флаг без свежей метки времени или старше TTL = зависший редирект: не считаем
    // его «в процессе». Иначе мёртвый чанк /auth + застрявший флаг → recovery
    // подавлён навсегда → вечный пустой экран (полоска висит).
    const startedAt = Number(sessionStorage.getItem(AUTH_EARLY_REDIRECT_AT_KEY));
    if (!Number.isFinite(startedAt) || startedAt <= 0) {
      return false;
    }
    return Date.now() - startedAt <= AUTH_EARLY_REDIRECT_STALE_MS;
  } catch {
    return false;
  }
}

function isBootstrapShellVisible(doc?: Document): boolean {
  const target = doc ?? (typeof document !== 'undefined' ? document : null);
  if (!target || typeof target.getElementById !== 'function') {
    return false;
  }
  const shell = target.getElementById('app-bootstrap-shell') as HTMLElement | null;
  if (!shell) {
    return false;
  }
  return shell.style?.display !== 'none';
}

export function isAuthEntryContentPresent(doc?: Document): boolean {
  const target = doc ?? (typeof document !== 'undefined' ? document : null);
  if (!target) {
    return false;
  }
  if (typeof target.querySelector !== 'function') {
    return false;
  }

  // Только готовая форма входа (.auth-page). Промежуточный .auth-template без
  // страницы — ещё не контент (иначе recovery на /auth подавляется навсегда).
  // Пока loading / SSO (data-auth-redirecting) — форму «готовой» не считаем.
  const authPage = target.querySelector('.auth-page');
  if (!authPage) {
    return false;
  }

  // SSO-редирект уже в процессе: страница в DOM есть, но это не «готовый» вход.
  if (
    typeof authPage.getAttribute === 'function'
    && authPage.getAttribute('data-auth-redirecting') === 'true'
  ) {
    return false;
  }

  return true;
}

/** Auth.vue держит data-auth-busy, пока идёт авто-редирект без формы. */
export function isAuthRouteBusy(doc?: Document): boolean {
  const target = doc ?? (typeof document !== 'undefined' ? document : null);
  if (!target || typeof target.querySelector !== 'function') {
    return false;
  }
  const root = target.querySelector('.auth-route-root');
  if (!root || typeof root.getAttribute !== 'function') {
    return false;
  }
  return root.getAttribute('data-auth-busy') === 'true';
}

export function shouldSuppressGlobalRecovery(path?: string): boolean {
  const resolvedPath = path ?? (typeof window !== 'undefined' ? window.location.pathname : '');

  if (isAuthCallbackPath(resolvedPath)) {
    if (isAuthCallbackContentPresent()) {
      return true;
    }
    return isOAuthCallbackPageActive() || isOAuthCallbackBusy();
  }

  if (resolvedPath.replace(/\/+$/, '') === '/auth') {
    if (isAuthEntryContentPresent()) {
      return true;
    }
    if (isEarlyAuthRedirectPending() && isBootstrapShellVisible()) {
      return true;
    }
    // Auth.vue смонтирован и уводит на SSO без формы — не считаем белым экраном.
    // Мёртвый чанк (нет .auth-route-root) по-прежнему не подавляет recovery.
    if (isAuthRouteBusy() && isBootstrapShellVisible()) {
      return true;
    }
    return false;
  }

  return false;
}

/**
 * Настоящий callback UI (Vue AuthCallbackStatusPage), не HTML-близнец
 * внутри `#app-bootstrap-shell` — иначе shell прячется сразу и под ним
 * «пустой» экран без видимого спиннера.
 */
export function isAuthCallbackContentPresent(doc?: Document): boolean {
  const target = doc ?? (typeof document !== 'undefined' ? document : null);
  if (!target) {
    return false;
  }
  if (typeof target.querySelector !== 'function') {
    return false;
  }

  const appShell = target.querySelector('.auth-rr-shell:not(#app-bootstrap-shell)');
  if (appShell && typeof (appShell as Element).querySelector === 'function') {
    return Boolean(
      appShell.querySelector('.auth-rr-callback-status')
        || appShell.querySelector('.auth-rr-callback-actions')
        || appShell.querySelector('.auth-rr-spinner'),
    );
  }

  if (typeof target.querySelectorAll !== 'function') {
    return false;
  }

  const nodes = target.querySelectorAll(
    '.auth-rr-callback-status, .auth-rr-callback-actions, .auth-rr-spinner',
  );
  for (let i = 0; i < nodes.length; i += 1) {
    const node = nodes[i];
    if (!node) continue;
    if (typeof (node as Element).closest === 'function') {
      if ((node as Element).closest('#app-bootstrap-shell')) continue;
    }
    return true;
  }
  return false;
}

/** Reload on callback error screen only when PKCE can be retried (bfcache / iOS). */
export function shouldOfferCallbackReload(
  stage: string,
  hasCode: boolean,
  hasState: boolean,
  hasVerifier: boolean,
): boolean {
  return stage === 'no_payload' && hasCode && hasState && hasVerifier;
}
