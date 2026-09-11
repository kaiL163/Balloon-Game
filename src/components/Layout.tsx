import { Link, Outlet, useLocation } from 'react-router';

export function Layout() {
  const { pathname } = useLocation();
  const isThemeSelect = pathname === '/';

  return (
    <div className={isThemeSelect ? 'app app-theme-select' : 'app'}>
      {!isThemeSelect && (
        <header className="header">
          <Link className="brand" to="/"><span className="brand-icon" aria-hidden="true">●</span><span>Воздушный<br /><strong>Шар</strong></span></Link>
          <div id="game-header-actions" />
        </header>
      )}
      <main
        className={isThemeSelect ? 'main-theme-select' : undefined}
        style={isThemeSelect ? { padding: 0, margin: 0, maxWidth: 'none', width: '100%', height: '100%', background: 'transparent' } : undefined}
      >
        <Outlet />
      </main>
      {!isThemeSelect && (
        <footer><span className="status-dot" /> Демо-режим <span>Только игровые бонусы. Впереди — небо.</span></footer>
      )}
    </div>
  );
}
