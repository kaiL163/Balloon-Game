import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { gameApi } from '../api';
import { BalloonScene } from '../components/BalloonScene';
import { DemoLinks } from '../components/game/DemoLinks';
import { FlightControls } from '../components/game/FlightControls';
import { FlightSky } from '../components/game/FlightSky';
import { RewardCard } from '../components/game/RewardCard';
import { HistoryModal } from '../components/HistoryModal';
import { RulesModal } from '../components/RulesModal';
import { useFlight } from '../hooks/useFlight';
import { useIdleReturn } from '../hooks/useIdleReturn';
import type { BetOption, DemoScenario, GameResult, Theme, ThemeOption, UserProfile } from '../types';
import '../styles/bet.css';
import '../styles/game.css';
import '../styles/scene.css';

interface LobbyData { profile: UserProfile; bets: BetOption[]; themes: ThemeOption[] }
const number = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 });
const scenarioLabels = { win: 'Авто-cashout на 1.60x', crash: 'Ранний crash на 1.30x', booster: 'Бустер x3 на уровне 2' };

export function GameScene() {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const rawScenario = params.get('scenario');
  const scenario = rawScenario && ['win', 'crash', 'booster'].includes(rawScenario) ? rawScenario as DemoScenario : null;
  const { round, error: flightError, pending, cashout, retry } = useFlight(scenario);
  const [data, setData] = useState<LobbyData | null>(null);
  const [theme, setTheme] = useState<Theme>('GREEN');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(false);
  const [modal, setModal] = useState<'rules' | 'history' | null>(null);
  const [result, setResult] = useState<GameResult | null>(null);
  const submitting = useRef(false);
  const isResult = location.pathname.startsWith('/result');
  const resultRoundId = params.get('round') ?? undefined;
  const mode = isResult ? 'RESULT' : round ? 'IN_GAME' : 'PRE_GAME';

  const loadLobby = useCallback(async () => {
    const [profile, bets, themes] = await Promise.all([gameApi.getProfile(), gameApi.getBetOptions(), gameApi.getThemes()]);
    setData({ profile, bets, themes });
    setTheme((current) => data ? current : profile.theme);
  }, []);

  useEffect(() => { loadLobby().catch(() => setError('Не удалось подготовить полёт. Попробуйте ещё раз.')); }, [loadLobby]);
  useEffect(() => {
    if (!isResult) { setResult(null); return; }
    gameApi.getResult(resultRoundId).then(setResult).catch((cause) => setError(cause instanceof Error ? cause.message : 'Не удалось загрузить результат.'));
  }, [isResult, resultRoundId]);

  const backToLobby = useCallback(() => {
    navigate('/', { replace: true });
    setResult(null);
    setSelectedId(null);
    retry();
    loadLobby().catch(() => undefined);
  }, [navigate, retry, loadLobby]);
  const seconds = useIdleReturn(backToLobby, !!result && isResult);
  const selectedBet = data?.bets.find((bet) => bet.id === selectedId);
  const selectedTheme = data?.themes.find((option) => option.id === theme);
  const canStart = !!data && !!selectedBet && selectedBet.amount <= data.profile.balance && !starting && !round;

  async function start() {
    if (!canStart || !selectedBet || submitting.current) return;
    submitting.current = true;
    setStarting(true);
    setError('');
    try {
      await gameApi.startRound(selectedBet.id, theme);
      await loadLobby();
      retry();
      window.setTimeout(() => setStarting(false), 650);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось начать полёт.');
      setStarting(false);
    } finally { submitting.current = false; }
  }

  if (!data && !round) return <section className="scene-loader" aria-live="polite"><div className="loader-balloon">●</div><h1>Готовим шар к полёту</h1><p>{error || 'Загружаем бонусы и маршрут…'}</p></section>;

  return <section className={`unified-scene mode-${mode.toLowerCase()} theme-${(round?.theme ?? theme).toLowerCase()} ${starting ? 'is-launching' : ''}`}>
    <div className="scene-cloud cloud-a" /><div className="scene-cloud cloud-b" /><div className="scene-cloud cloud-c" />
    <div className="scene-topbar">
      <div className="scene-title"><span>{mode === 'PRE_GAME' ? 'ПРИГОТОВЬТЕСЬ К ПОЛЁТУ' : mode === 'IN_GAME' ? 'ВЫ УЖЕ В НЕБЕ' : 'ПОЛЁТ ЗАВЕРШЁН'}</span><h1>{mode === 'PRE_GAME' ? <>Лови удачу<br /><em>выше облаков!</em></> : mode === 'IN_GAME' ? <>Лети выше.<br /><em>Забери вовремя!</em></> : <>Как прошёл<br /><em>ваш полёт?</em></>}</h1></div>
      {createPortal(<div className="scene-actions">
        <button onClick={() => setModal('rules')}><b>?</b><span>Правила</span></button>
        <button onClick={() => setModal('history')}><b>↺</b><span>История</span></button>
        <div className="scene-balance"><i>★</i><span>Баланс<small>{(data?.profile.balance ?? 0).toLocaleString('ru-RU')} бонусов</small></span></div>
      </div>, document.getElementById('game-header-actions')!)}
    </div>

    <div className="scene-board">
      <div className="world-stage">
        {mode === 'PRE_GAME' && <div className="lobby-world"><div className="sun" /><BalloonScene theme={theme} levels={selectedTheme?.levels ?? 0} /><div className="lobby-coefficient"><span>КОЭФФИЦИЕНТ</span><strong>—.—<small>x</small></strong><em>появится после старта</em></div></div>}
        {mode === 'IN_GAME' && round && <div className="active-world"><FlightSky round={round} /></div>}
        {mode === 'RESULT' && <ResultState result={result} seconds={seconds} onAgain={backToLobby} />}
      </div>

      {mode === 'PRE_GAME' && data && <aside className="lobby-panel">
        <div className="panel-heading"><span>НАСТРОЙКА ПОЛЁТА</span><strong>Выберите маршрут</strong></div>
        <fieldset disabled={starting}><legend>Цвет шара</legend><div className="theme-pills">{data.themes.map((option) => <label key={option.id} className={`${theme === option.id ? 'selected' : ''} option-${option.id.toLowerCase()}`}><input type="radio" checked={theme === option.id} onChange={() => setTheme(option.id)} /><i /> <strong>{option.id}</strong><small>{option.levels} уровней</small></label>)}</div></fieldset>
        <fieldset disabled={starting}><legend>Ставка <small>в бонусах</small></legend><div className="stake-grid">{data.bets.map((bet) => { const unavailable = bet.amount > data.profile.balance; return <label key={bet.id} className={`${selectedId === bet.id ? 'selected' : ''} ${unavailable ? 'unavailable' : ''}`}><input type="radio" checked={selectedId === bet.id} disabled={unavailable} onChange={() => setSelectedId(bet.id)} /><span>x{bet.multiplier}</span><strong>{bet.amount}</strong><small>{unavailable ? 'мало бонусов' : 'бонусов'}</small></label>; })}</div></fieldset>
        <button className="start-flight" disabled={!canStart} onClick={start}><span>{starting ? 'Взлетаем…' : 'Начать'}</span><i>↑</i></button>
        <p className="start-note">Ставка спишется в момент старта</p>
        {error && <p className="scene-error" role="alert">{error}</p>}
      </aside>}

      {mode === 'IN_GAME' && round && <div className="flight-side"><FlightControls round={round} pending={pending} onCashout={cashout} />{round.scenario && <p className="scenario-banner">Демо · {scenarioLabels[round.scenario]}</p>}{flightError && <div className="game-error">{flightError} <button onClick={retry}>Повторить</button></div>}</div>}
    </div>
    <div className="scene-footer"><span>★ +10 очков за каждый уровень</span><span>{mode === 'PRE_GAME' ? 'Выбери шар → Сделай ставку → Взлетай' : 'Следи за высотой и забирай бонусы вовремя'}</span></div>
    {mode === 'PRE_GAME' && !round && <DemoLinks />}
    {modal === 'rules' && <RulesModal onClose={() => setModal(null)} />}
    {modal === 'history' && <HistoryModal onClose={() => setModal(null)} />}
  </section>;
}

function ResultState({ result, seconds, onAgain }: { result: GameResult | null; seconds: number; onAgain: () => void }) {
  if (!result) return <div className="result-state result-loading"><h2>Открываем бортовой журнал…</h2></div>;
  const won = result.outcome === 'win';
  return <div className={`result-state ${won ? 'won' : 'lost'}`}>
    <div className="result-sun">{won ? '★' : '✦'}</div><p>{won ? 'УДАЧНАЯ ПОСАДКА' : 'В ЭТОТ РАЗ НЕ ПОВЕЗЛО'}</p>
    <h2>{won ? 'Отличный полёт!' : 'Шар лопнул'}</h2>
    <div className="result-prize">{won ? number.format(result.payout) : `−${number.format(result.bet)}`}<small>бонусов</small></div>
    <div className="result-inline-stats"><span>Ставка <b>{number.format(result.bet)}</b></span><span>Cashout <b>{result.cashoutMultiplier?.toFixed(2) ?? '—'}x</b></span><span>Crash <b>{result.crashMultiplier.toFixed(2)}x</b></span><span>Очки <b>+{result.points}</b></span></div>
    <RewardCard reward={result.reward} /><button className="start-flight play-again" onClick={onAgain}><span>Играть снова</span><i>↻</i></button><small className="idle-countdown">Возврат в лобби через {seconds} сек.</small>
  </div>;
}
