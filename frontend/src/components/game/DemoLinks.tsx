import { Link } from 'react-router';
import '../../styles/game.css';

export function DemoLinks() {
  return <details className="demo-links"><summary>Быстрый тест</summary>
    <p>Запускает обычный серверный раунд с заранее выбранной ставкой. Исход полёта по-прежнему определяет backend.</p>
    <div><Link to="/game?scenario=win">↗ Быстрый старт x1</Link><Link to="/game?scenario=booster">⚡ Быстрый старт x3</Link></div>
  </details>;
}
