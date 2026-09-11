import { Link, Outlet } from 'react-router';

export function Layout() {
  return (
    <div className="app">
      <header className="header">
        <Link className="brand" to="/"><span className="brand-icon" aria-hidden="true">●</span><span>Воздушный<br /><strong>Шар</strong></span></Link>
        <div id="game-header-actions" />
      </header>
      <main><Outlet /></main>
      <footer><span className="status-dot" /> Демо-режим <span>Только игровые бонусы. Впереди — небо.</span></footer>
    </div>
  );
}
