const SESSION_KEY = 'balloon-auth-token';
const USER_KEY = 'balloon-auth-user';

export interface AuthUser {
  id: number;
  username: string;
  role: 'USER' | 'ADMIN';
}

export const TEST_ACCOUNT = {
  email: 'test@test.com',
  password: 'test123',
} as const;

export const ADMIN_ACCOUNT = {
  email: 'admin@admin.com',
  password: 'admin123',
} as const;

type AuthResult = { ok: true } | { ok: false; error: string };

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

function saveToken(token: string | null) {
  try {
    if (token) localStorage.setItem(SESSION_KEY, token);
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    /* Storage may be unavailable. */
  }
}

function saveUser(user: AuthUser | null) {
  try {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  } catch {
    /* Storage may be unavailable. */
  }
}

export function getCurrentUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) as AuthUser : null;
  } catch {
    return null;
  }
}

export function isAdmin(): boolean {
  return getCurrentUser()?.role === 'ADMIN';
}

export function isAuthenticated(): boolean {
  return getAuthToken() !== null;
}

async function authRequest(path: string, email: string, password: string): Promise<AuthResult> {
  try {
    const response = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
    });
    const body = await response.json().catch(() => ({})) as { token?: string; user?: AuthUser; error?: string };
    if (!response.ok || !body.token) {
      return { ok: false, error: body.error || 'Не удалось выполнить вход.' };
    }
    saveToken(body.token);
    saveUser(body.user ?? null);
    return { ok: true };
  } catch {
    return { ok: false, error: 'Сервер недоступен. Попробуйте ещё раз.' };
  }
}

export function login(email: string, password: string): Promise<AuthResult> {
  if (!email.trim() || !password) {
    return Promise.resolve({ ok: false, error: 'Введите email и пароль.' });
  }
  return authRequest('/api/auth/login', email, password);
}

export function register(email: string, password: string, confirmPassword: string): Promise<AuthResult> {
  if (!email.trim() || !password) {
    return Promise.resolve({ ok: false, error: 'Введите email и пароль.' });
  }
  if (password !== confirmPassword) {
    return Promise.resolve({ ok: false, error: 'Пароли не совпадают.' });
  }
  return authRequest('/api/auth/register', email, password);
}

export async function logout() {
  const token = getAuthToken();
  saveToken(null);
  saveUser(null);
  if (!token) return;
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    /* The local session is already cleared. */
  }
}

export async function authorizedFetch(path: string, init: RequestInit = {}) {
  const token = getAuthToken();
  const headers = new Headers(init.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(path, { ...init, headers });
  if (response.status === 401) {
    saveToken(null);
    saveUser(null);
    if (window.location.pathname !== '/login') window.location.assign('/login');
  }
  return response;
}
