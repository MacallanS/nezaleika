/** Shared fetch for profile security APIs: BFF cookies + OIDC Bearer. */

const ACCESS_TOKEN_KEY = 'access_token'
const LEGACY_TOKEN_KEY = 'token'

export function profileCsrfHeaders(): Record<string, string> {
  if (typeof document === 'undefined') return {}
  const match = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]*)/)
  if (!match?.[1]) return {}
  return { 'X-XSRF-TOKEN': decodeURIComponent(match[1]) }
}

function oidcAuthHeaders(): Record<string, string> {
  if (typeof localStorage === 'undefined') return {}
  try {
    const token =
      localStorage.getItem(ACCESS_TOKEN_KEY) ||
      localStorage.getItem(LEGACY_TOKEN_KEY)
    if (token && token !== 'null' && token !== '') {
      return { Authorization: `Bearer ${token}` }
    }
  } catch {
    // ignore storage errors
  }
  return {}
}

/** Same auth as fintech axios: cookies always; Bearer when access_token is present (OIDC). */
export async function profileAuthFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const headers = {
    Accept: 'application/json',
    ...profileCsrfHeaders(),
    ...oidcAuthHeaders(),
    ...(init.headers as Record<string, string> | undefined),
  }

  return fetch(input, {
    ...init,
    credentials: 'include',
    headers,
  })
}
