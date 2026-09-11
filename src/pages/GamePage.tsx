import { Link, useSearchParams } from 'react-router';
import { FlightSky } from '../components/game/FlightSky';
import { FlightControls } from '../components/game/FlightControls';
import { DemoLinks } from '../components/game/DemoLinks';
import { useFlight } from '../hooks/useFlight';
import type { DemoScenario } from '../types';
import '../styles/bet.css';
import '../styles/game.css';

const scenarioLabels = { win: 'Авто-cashout на 1.60x', crash: 'Ранний crash на 1.30x', booster: 'Бустер x3 на уровне 2 · затем авто-cashout' };

export function GamePage() {
  const [params] = useSearchParams();
  const value = params.get('scenario');
  const scenario = value && ['win', 'crash', 'booster'].includes(value) ? value as DemoScenario : null;
  const { round, loading, error, pending, cashout, retry } = useFlight(scenario);
  if (loading) return <section className="card"><p role="status">Готовим воздушный шар…</p></section>;
  if (!round) return <section className="card"><h1>Небо ждёт</h1><p role="status">{error || 'Сначала выберите тему и ставку для нового полёта.'}</p><Link className="button" to="/">Выбрать ставку</Link><DemoLinks /></section>;
  return <section className={`game-page theme-${round.theme.toLowerCase()}`}>
    <div className="game-heading"><div><p className="eyebrow">Воздушный Шар · в полёте</p><h1>Навстречу высоте.</h1></div><span className="game-route">{round.theme} / {round.levels} уровней</span></div>
    {round.scenario && <p className="scenario-banner">Демо-автопилот · {scenarioLabels[round.scenario]}</p>}
    {error && <div className="game-error" role="alert">{error} <button className="button" onClick={retry}>Продолжить</button></div>}
    <div className="game-panel"><FlightSky round={round} /><FlightControls round={round} pending={pending} onCashout={cashout} /></div>
  </section>;
}
