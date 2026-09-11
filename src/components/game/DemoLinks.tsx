import { Link } from 'react-router';
import '../../styles/game.css';

export function DemoLinks() {
  return <details className="demo-links"><summary>Тестовые полёты</summary>
    <p>Автопилот покажет нужный исход. Сценарии используют бонусный баланс; при нехватке добавляется только сумма для ставки. Текущий полёт всегда продолжается первым.</p>
    <div><Link to="/game?scenario=win">↗ Успешный cashout</Link><Link to="/game?scenario=crash">✧ Ранний crash</Link><Link to="/game?scenario=booster">⚡ Активация x3</Link></div>
  </details>;
}
