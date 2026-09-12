import { useEffect, useMemo, useState, type CSSProperties, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { Navigate, useNavigate } from 'react-router';
import { AboutModal } from '../components/AboutModal';
import {
  ADMIN_ACCOUNT,
  isAuthenticated,
  login,
  register,
  TEST_ACCOUNT,
} from '../utils/auth';
import { playWaterDrop, startBirdAmbience } from '../utils/audio';
import { makeSkyVisit } from '../utils/skyDrift';
import { useGameConfig } from '../hooks/useGameConfig';
import landscapeUrl from '../assets/theme-select-landscape.png';
import '../styles/theme-select.css';
import '../styles/auth.css';

type Mode = 'login' | 'register';

export function AuthPage() {
  const navigate = useNavigate();
  const { gameName } = useGameConfig();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showAbout, setShowAbout] = useState(false);
  const [portalReady, setPortalReady] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [visit] = useState(() => Math.random());

  const sky = useMemo(() => {
    void visit;
    return makeSkyVisit();
  }, [visit]);

  useEffect(() => setPortalReady(true), []);
  useEffect(() => startBirdAmbience(), []);

  if (isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  function switchMode(next: Mode) {
    if (next === mode) return;
    playWaterDrop();
    setMode(next);
    setError(null);
    setPassword('');
    setConfirmPassword('');
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;
    playWaterDrop();
    setSubmitting(true);
    setError(null);

    const result = await (mode === 'login'
      ? login(email, password)
      : register(email, password, confirmPassword));

    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    navigate('/', { replace: true });
  }

  function openAbout() {
    playWaterDrop();
    setShowAbout(true);
  }

  function fillAccount(account: { email: string; password: string }) {
    playWaterDrop();
    setMode('login');
    setEmail(account.email);
    setPassword(account.password);
    setConfirmPassword('');
    setError(null);
  }

  const backdrop = (
    <div
      className="theme-select-backdrop"
      aria-hidden="true"
      style={{ backgroundImage: `url(${landscapeUrl})` }}
    />
  );

  return (
    <section className="auth-page" aria-label="Вход и регистрация">
      {portalReady ? createPortal(backdrop, document.body) : backdrop}

      <div className="theme-sky" aria-hidden="true">
        {sky.clouds.map((cloud) => (
          <span
            key={cloud.id}
            className="theme-drift-cloud"
            style={{
              top: `${cloud.top}%`,
              left: `${cloud.left}%`,
              '--scale': cloud.scale,
              '--duration': `${cloud.duration}s`,
              '--delay': `${cloud.delay}s`,
              '--dx': `${cloud.driftX}px`,
              '--dy': `${cloud.driftY}px`,
            } as CSSProperties}
          />
        ))}
        {sky.birds.map((bird) => (
          <span
            key={bird.id}
            className="theme-drift-bird"
            style={{
              top: `${bird.top}%`,
              left: `${bird.left}%`,
              '--scale': bird.scale,
              '--duration': `${bird.duration}s`,
              '--delay': `${bird.delay}s`,
              '--dx': `${bird.driftX}px`,
              '--dy': `${bird.driftY}px`,
            } as CSSProperties}
          >
            <i /><i />
          </span>
        ))}
      </div>

      <div className="auth-stack">
        <form className="auth-panel" onSubmit={handleSubmit} noValidate>
          <h1 className="auth-title">{gameName}</h1>

          <div className="auth-tabs" role="tablist" aria-label="Режим">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'login'}
              className={mode === 'login' ? 'auth-tab active' : 'auth-tab'}
              onClick={() => switchMode('login')}
            >
              Вход
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'register'}
              className={mode === 'register' ? 'auth-tab active' : 'auth-tab'}
              onClick={() => switchMode('register')}
            >
              Регистрация
            </button>
          </div>

          <label className="auth-field">
            <span>Email</span>
            <input
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="test@test.com"
              required
            />
          </label>

          <label className="auth-field">
            <span>Пароль</span>
            <input
              type="password"
              name="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••"
              required
            />
          </label>

          {mode === 'register' && (
            <label className="auth-field">
              <span>Повторите пароль</span>
              <input
                type="password"
                name="confirmPassword"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="••••••••"
                required
              />
            </label>
          )}

          {error ? <p className="auth-error" role="alert">{error}</p> : null}

          <button type="submit" className="auth-submit" disabled={submitting}>
            {mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
          </button>

          {mode === 'login' ? (
            <div className="auth-account-list" aria-label="Аккаунты для быстрого входа">
              <button type="button" className="auth-account-preset" onClick={() => fillAccount(TEST_ACCOUNT)}>
                <span>Тестовый аккаунт</span>
                <strong>{TEST_ACCOUNT.email}</strong>
                <small>{TEST_ACCOUNT.password}</small>
              </button>
              <button type="button" className="auth-account-preset is-admin" onClick={() => fillAccount(ADMIN_ACCOUNT)}>
                <span>Администратор</span>
                <strong>{ADMIN_ACCOUNT.email}</strong>
                <small>{ADMIN_ACCOUNT.password}</small>
              </button>
            </div>
          ) : null}
        </form>

        <button
          type="button"
          className="auth-about"
          onClick={openAbout}
          aria-haspopup="dialog"
        >
          Что это?
        </button>
      </div>

      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
    </section>
  );
}
