import { useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router';
import { isAdmin, logout } from '../utils/auth';
import { playWaterDrop, startInterfaceSounds } from '../utils/audio';
import { useGameConfig } from '../hooks/useGameConfig';
import '../styles/auth.css';

export function Layout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { gameName } = useGameConfig();
  const isThemeSelect = pathname === '/';
  const isAuth = pathname === '/login';
  const isAdminPage = pathname === '/admin';
  const hideChrome = isThemeSelect || isAuth || isAdminPage;
  useEffect(() => startInterfaceSounds(), []);
  /* Full-bleed screens (auth / theme / admin / bet / in-game / result) hide chrome via page CSS. */

  function handleLogout() {
    playWaterDrop();
    void logout();
    navigate('/login', { replace: true });
  }

  const logoutButton = (
    <button type="button" className="logout-button" onClick={handleLogout}>
      <span aria-hidden="true">↪</span>
      Выйти
    </button>
  );
  const adminOpen = isAdminPage;
  const adminButton = isAdmin() ? (
    <Link className={`admin-link${adminOpen ? ' is-open' : ''}`} to={adminOpen ? '/' : '/admin'}>
      {adminOpen ? 'Свернуть настройки' : 'Настройки'}
    </Link>
  ) : null;

  const appClass = isAuth
    ? 'app app-auth'
    : isThemeSelect
      ? 'app app-theme-select'
      : isAdminPage
        ? 'app app-admin'
        : 'app';

  return (
    <div className={appClass}>
      {!hideChrome && (
        <header className="header">
          <Link className="brand" to="/"><span className="brand-icon" aria-hidden="true">●</span><strong>{gameName}</strong></Link>
          <div className="header-actions">
            <div id="game-header-actions" />
            {adminButton}
            {logoutButton}
          </div>
        </header>
      )}
      {(isThemeSelect || isAdminPage) ? <div className="floating-session-actions">{adminButton}{logoutButton}</div> : null}
      <main
        className={isAuth ? 'main-auth' : isThemeSelect ? 'main-theme-select' : isAdminPage ? 'main-admin' : undefined}
        style={hideChrome ? { padding: 0, margin: 0, maxWidth: 'none', width: '100%', minHeight: '100%', background: 'transparent' } : undefined}
      >
        <Outlet />
      </main>
      {!hideChrome && (
        <footer><span className="status-dot" /> Демо-режим <span>Только игровые бонусы. Впереди — небо.</span></footer>
      )}
    </div>
  );
}
