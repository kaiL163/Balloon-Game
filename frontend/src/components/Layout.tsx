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
  const hideChrome = isThemeSelect || isAuth;
  useEffect(() => startInterfaceSounds(), []);
  /* Full-bleed screens (auth / theme / bet / in-game / result) hide chrome via page CSS. */

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
  const adminOpen = pathname === '/admin';
  const adminButton = isAdmin() ? (
    <Link className={`admin-link${adminOpen ? ' is-open' : ''}`} to={adminOpen ? '/' : '/admin'}>
      {adminOpen ? 'Свернуть настройки' : 'Настройки'}
    </Link>
  ) : null;

  return (
    <div className={isAuth ? 'app app-auth' : isThemeSelect ? 'app app-theme-select' : 'app'}>
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
      {isThemeSelect ? <div className="floating-session-actions">{adminButton}{logoutButton}</div> : null}
      <main
        className={isAuth ? 'main-auth' : isThemeSelect ? 'main-theme-select' : undefined}
        style={hideChrome ? { padding: 0, margin: 0, maxWidth: 'none', width: '100%', height: '100%', background: 'transparent' } : undefined}
      >
        <Outlet />
      </main>
      {!hideChrome && (
        <footer><span className="status-dot" /> Демо-режим <span>Только игровые бонусы. Впереди — небо.</span></footer>
      )}
    </div>
  );
}
