import { useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router';
import { startInterfaceSounds } from '../utils/audio';
import '../styles/auth.css';

export function Layout() {
  const { pathname } = useLocation();
  const isThemeSelect = pathname === '/';
  const isAuth = pathname === '/login';
  const hideChrome = isThemeSelect || isAuth;
  useEffect(() => startInterfaceSounds(), []);
  /* Full-bleed screens (auth / theme / bet / in-game / result) hide chrome via page CSS. */

  return (
    <div className={isAuth ? 'app app-auth' : isThemeSelect ? 'app app-theme-select' : 'app'}>
      {!hideChrome && (
        <header className="header">
          <Link className="brand" to="/"><span className="brand-icon" aria-hidden="true">●</span><span>Воздушный<br /><strong>Шар</strong></span></Link>
          <div id="game-header-actions" />
        </header>
      )}
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
