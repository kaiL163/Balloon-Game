const SESSION_KEY = 'balloon-auth-session';
const ACCOUNTS_KEY = 'balloon-auth-accounts';

export const TEST_ACCOUNT = {
  email: 'test@test.com',
  password: 'test123',
} as const;

type Account = { email: string; password: string };

function readAccounts(): Account[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is Account =>
        !!item
        && typeof item === 'object'
        && typeof (item as Account).email === 'string'
        && typeof (item as Account).password === 'string',
    );
  } catch {
    return [];
  }
}

function writeAccounts(accounts: Account[]) {
  try {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch {
    /* Storage may be unavailable. */
  }
}

export function isAuthenticated(): boolean {
  try {
    return localStorage.getItem(SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

export function setAuthenticated(value: boolean) {
  try {
    if (value) localStorage.setItem(SESSION_KEY, '1');
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    /* Storage may be unavailable. */
  }
}

export function login(email: string, password: string): { ok: true } | { ok: false; error: string } {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !password) {
    return { ok: false, error: 'Введите email и пароль.' };
  }

  const isTest =
    normalized === TEST_ACCOUNT.email
    && password === TEST_ACCOUNT.password;
  const registered = readAccounts().some(
    (account) => account.email === normalized && account.password === password,
  );

  if (!isTest && !registered) {
    return { ok: false, error: 'Неверный email или пароль.' };
  }

  setAuthenticated(true);
  return { ok: true };
}

export function register(
  email: string,
  password: string,
  confirmPassword: string,
): { ok: true } | { ok: false; error: string } {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !password) {
    return { ok: false, error: 'Введите email и пароль.' };
  }
  if (!normalized.includes('@')) {
    return { ok: false, error: 'Укажите корректный email.' };
  }
  if (password.length < 6) {
    return { ok: false, error: 'Пароль должен быть не короче 6 символов.' };
  }
  if (password !== confirmPassword) {
    return { ok: false, error: 'Пароли не совпадают.' };
  }
  if (normalized === TEST_ACCOUNT.email) {
    return { ok: false, error: 'Этот email уже занят.' };
  }

  const accounts = readAccounts();
  if (accounts.some((account) => account.email === normalized)) {
    return { ok: false, error: 'Этот email уже зарегистрирован.' };
  }

  accounts.push({ email: normalized, password });
  writeAccounts(accounts);
  setAuthenticated(true);
  return { ok: true };
}
