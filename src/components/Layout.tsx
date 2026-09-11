import { NavLink, Outlet } from 'react-router';

export function Layout() {
  return (
    <div className="app">
      <header className="header">
        <NavLink className="brand" to="/"><span className="brand-icon" aria-hidden="true">◈</span> Воздушный Шар<span className="brand-tag">PLAY</span></NavLink>
        <nav aria-label="Основная навигация">
          <NavLink to="/" end>Выбор ставки</NavLink>
          <NavLink to="/game">Игра</NavLink>
          <NavLink to="/result">Результат</NavLink>
        </nav>
      </header>
      <main><Outlet /></main>
      <footer><span className="status-dot" /> Демо-режим <span>Только игровые бонусы. Впереди — небо.</span></footer>
    </div>
  );
}
