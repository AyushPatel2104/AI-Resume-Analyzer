export const AUTH_COOKIE_NAME = "access_token";
const STORAGE_KEY = "access_token";

const cookieMaxAgeSeconds = 60 * 60 * 24 * 7;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function getClientAccessToken(): string | null {
  if (!isBrowser()) return null;
  return window.localStorage.getItem(STORAGE_KEY);
}

export function setAuthSession(accessToken: string): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, accessToken);
  document.cookie = `${AUTH_COOKIE_NAME}=${encodeURIComponent(accessToken)}; path=/; max-age=${cookieMaxAgeSeconds}; samesite=lax`;
}

export function clearAuthSession(): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(STORAGE_KEY);
  document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0; samesite=lax`;
}

export function authHeaders(accessToken?: string | null): HeadersInit {
  const token = accessToken ?? getClientAccessToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}
