const AUTH_TOKEN_KEY = 'mediachips_auth_token'

export function getAuthToken(): string | null {
  try {
    return sessionStorage.getItem(AUTH_TOKEN_KEY)
  } catch {
    return null
  }
}

export function setAuthToken(token: string): void {
  try {
    sessionStorage.setItem(AUTH_TOKEN_KEY, token)
  } catch {
    // ignore storage failures
  }
}

export function clearAuthToken(): void {
  try {
    sessionStorage.removeItem(AUTH_TOKEN_KEY)
  } catch {
    // ignore storage failures
  }
}
