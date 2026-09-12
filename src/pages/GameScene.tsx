import { BoosterChest } from '../components/game/BoosterChest';
import { betPuzzlePaths } from '../components/game/betPuzzlePaths';
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { gameApi } from '../api';
import { FlightControls } from '../components/game/FlightControls';
import { FlightSky } from '../components/game/FlightSky';
import { RewardCard } from '../components/game/RewardCard';
import { HistoryModal } from '../components/HistoryModal';
import { RulesModal } from '../components/RulesModal';
import { useFlight } from '../hooks/useFlight';
import { useIdleReturn } from '../hooks/useIdleReturn';
import type { BetOption, DemoScenario, GameResult, HistoryItem, Theme, ThemeOption, UserProfile } from '../types';
import { playBetSelection, playLaunch, playResult, prepareGameAudio, startBirdAmbience } from '../utils/audio';
import { makeBalloonMotion, makeSkyVisit } from '../utils/skyDrift';
import landscapeUrl from '../assets/theme-select-landscape.png';
import '../styles/bet.css';
import '../styles/bet-select.css';
import '../styles/game.css';
import '../styles/scene.css';
import '../styles/theme-select.css';

interface LobbyData { profile: UserProfile; bets: BetOption[]; themes: ThemeOption[]; history: HistoryItem[] }
const number = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 });
const coefficient = (value: number | null) => value === null ? '—' : `${value.toFixed(2)}×`;
const crashColor = (value: number) => value < 2 ? 'red' : value < 5 ? 'gold' : value < 10 ? 'blue' : 'green';
const scenarioLabels = { win: 'Авто-cashout на 1.60x', crash: 'Ранний crash на 1.30x', booster: 'Бустер x3 на уровне 2' };
const themeLabel = (theme: Theme) => theme === 'RED' ? 'Красный шар' : 'Зелёный шар';

function readNavTheme(state: unknown): Theme | null {
  const theme = (state as { theme?: Theme } | null)?.theme;
  return theme === 'RED' || theme === 'GREEN' ? theme : null;
}

export function GameScene() {
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const rawScenario = params.get('scenario');
  const scenario = rawScenario && ['win', 'crash', 'booster'].includes(rawScenario) ? rawScenario as DemoScenario : null;
  const navTheme = readNavTheme(location.state);
  const { round, error: flightError, pending, cashout, retry } = useFlight(scenario);
  const [data, setData] = useState<LobbyData | null>(null);
  const [theme, setTheme] = useState<Theme>(() => navTheme ?? 'GREEN');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(false);
  const [modal, setModal] = useState<'rules' | 'history' | null>(null);
  const [result, setResult] = useState<GameResult | null>(null);
  const [portalReady, setPortalReady] = useState(false);
  const [visit] = useState(() => Math.random());
  const submitting = useRef(false);
  const soundedResult = useRef<string | null>(null);
  const isResult = location.pathname.startsWith('/result');
  const resultRoundId = params.get('round') ?? undefined;
  const mode = isResult ? 'RESULT' : round ? 'IN_GAME' : 'PRE_GAME';

  const sky = useMemo(() => {
    void visit;
    return {
      ...makeSkyVisit(),
      motion: makeBalloonMotion(),
    };
  }, [visit]);

  const loadLobby = useCallback(async () => {
    const [profile, bets, themes, history] = await Promise.all([gameApi.getProfile(), gameApi.getBetOptions(), gameApi.getThemes(), gameApi.getHistory()]);
    setData({ profile, bets, themes, history });
    setTheme((current) => {
      if (navTheme) return navTheme;
      if (current === 'RED' || current === 'GREEN') return current;
      return profile.theme;
    });
  }, [navTheme]);

  useEffect(() => { loadLobby().catch(() => setError('Не удалось подготовить полёт. Попробуйте ещё раз.')); }, [loadLobby]);
  useEffect(() => {
    if (navTheme) setTheme(navTheme);
  }, [navTheme]);
  useEffect(() => {
    if (!isResult) { setResult(null); return; }
    gameApi.getResult(resultRoundId).then(setResult).catch((cause) => setError(cause instanceof Error ? cause.message : 'Не удалось загрузить результат.'));
  }, [isResult, resultRoundId]);
  useEffect(() => setPortalReady(true), []);
  useEffect(() => {
    if (mode !== 'PRE_GAME') return;
    return startBirdAmbience();
  }, [mode, visit]);
  useEffect(() => {
    if (!result || soundedResult.current === result.roundId) return;
    soundedResult.current = result.roundId;
    playResult(result.outcome);
  }, [result]);

  const backToLobby = useCallback(() => {
    navigate('/bet', { replace: true, state: { theme } });
    setResult(null);
    setSelectedId(null);
    retry();
    loadLobby().catch(() => undefined);
  }, [navigate, retry, loadLobby, theme]);
  const playAgain = useCallback(() => {
    navigate('/', { replace: true });
  }, [navigate]);
  const seconds = useIdleReturn(backToLobby, !!result && isResult);
  const selectedBet = data?.bets.find((bet) => bet.id === selectedId);
  const selectedTheme = data?.themes.find((option) => option.id === theme);
  const canStart = !!data && !!selectedBet && selectedBet.amount <= data.profile.balance && !starting && !round;

  async function start() {
    if (!canStart || !selectedBet || submitting.current) return;
    prepareGameAudio();
    playLaunch();
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

  if (mode === 'PRE_GAME' && data) {
    const recentCrashes = data.history.filter((item) => item.crash !== null).slice(0, 8);
    const lastGame = data.history[0] ?? null;
    const backdrop = (
      <div
        className="bet-select-backdrop theme-select-backdrop"
        aria-hidden="true"
        style={{ backgroundImage: `url(${landscapeUrl})` }}
      />
    );

    return (
      <section
        className={`bet-select theme-${theme.toLowerCase()}`}
        aria-label="Выбор ставки"
      >
        {portalReady ? createPortal(backdrop, document.body) : backdrop}

        <div className="theme-sky" aria-hidden="true">
          {sky.clouds.map((cloud) => (
            <span
              key={cloud.id}
              className="theme-drift-cloud"
              style={{
                top: `${cloud.top}%`,
                left: `${cloud.left}%`,
                '--scale': cloud.scale,
                '--duration': `${cloud.duration}s`,
                '--delay': `${cloud.delay}s`,
                '--dx': `${cloud.driftX}px`,
                '--dy': `${cloud.driftY}px`,
              } as CSSProperties}
            />
          ))}
          {sky.birds.map((bird) => (
            <span
              key={bird.id}
              className="theme-drift-bird"
              style={{
                top: `${bird.top}%`,
                left: `${bird.left}%`,
                '--scale': bird.scale,
                '--duration': `${bird.duration}s`,
                '--delay': `${bird.delay}s`,
                '--dx': `${bird.driftX}px`,
                '--dy': `${bird.driftY}px`,
              } as CSSProperties}
            >
              <i /><i />
            </span>
          ))}
        </div>

        <aside className="bet-select-panel">
          <button className="bet-select-back" type="button" disabled={starting} onClick={() => navigate('/')} aria-label="Назад к выбору шара">
            <span aria-hidden="true">←</span> Назад
          </button>


          <div className="bet-select-heading">
            <span>ВЫБРАННЫЙ ШАР</span>
            <strong>{themeLabel(theme)}</strong>
            <p>{selectedTheme?.levels ?? 0} уровней · {theme === 'RED' ? 'Длинный маршрут' : 'Короткий маршрут'}</p>
          </div>

          <div className="bet-select-balance">
            <i aria-hidden="true">★</i>
            <div>
              <span>Ваш баланс</span>
              <strong>{data.profile.balance.toLocaleString('ru-RU')} <small>бонусов</small></strong>
            </div>
          </div>

          <div className="bet-select-utilities" aria-label="Информация об игре">
            <button type="button" onClick={() => setModal('rules')} aria-haspopup="dialog"><span aria-hidden="true">?</span> Правила</button>
            <button type="button" onClick={() => setModal('history')} aria-haspopup="dialog"><span aria-hidden="true">↺</span> История</button>
          </div>

<div className="bet-chest-note"><BoosterChest /><div><strong>Чем выше ставка, тем сильнее бустер</strong><small>100 — без бустера, 150 — ×2,<br />250 — ×3, 400 — ×4.</small></div></div>
          <fieldset disabled={starting}>
            <legend>Выберите ставку <small>в бонусах</small></legend>
            <div className="bet-puzzle-grid">
              {data.bets.map((bet, index) => {
                const unavailable = bet.amount > data.profile.balance;
                return (
                  <label
                    key={bet.id}
                    className={`bet-puzzle ${selectedId === bet.id ? 'selected' : ''} ${unavailable ? 'unavailable' : ''}`}
                  >
                    <svg className="bet-puzzle-shape" viewBox="0 0 180 120" preserveAspectRatio="none" aria-hidden="true">
                      <defs><linearGradient id={`puzzle-gradient-${index}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="var(--piece-highlight)" /><stop offset="0.52" stopColor="var(--piece-face)" /><stop offset="1" stopColor="var(--piece-shadow)" /></linearGradient></defs>
                      <path className="puzzle-depth" d={betPuzzlePaths[index % 4]} />
                      <path className="puzzle-face" style={{ fill: `url(#puzzle-gradient-${index})` }} d={betPuzzlePaths[index % 4]} />
                    </svg>
                    <input
                      type="radio"
                      name="bet"
                      checked={selectedId === bet.id}
                      disabled={unavailable}
                      onChange={() => { playBetSelection(); setSelectedId(bet.id); }}
                    />
                    {selectedId === bet.id && <i className="puzzle-check" aria-hidden="true">✓</i>}

                    <span className="puzzle-kicker">СТАВКА {String(index + 1).padStart(2, '0')}</span>
                    <strong>{bet.amount}</strong>
                    <small>{unavailable ? 'мало бонусов' : 'бонусов'}</small>
                    <span className="puzzle-booster-seal">{bet.booster === 1 ? 'BASE' : `×${bet.booster}`}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <button className="bet-select-launch" disabled={!canStart} onClick={() => void start()}>
            <span>{starting ? 'Взлетаем…' : 'Начать'}</span>
            <i aria-hidden="true">↑</i>
          </button>
          <p className="bet-select-note">Ставка спишется в момент старта</p>
          {error && <p className="bet-select-error" role="alert">{error}</p>}
        </aside>

        <div className="bet-select-balloon">
          <div className="bet-sky-stats">
            <section className="bet-recent" aria-label="Последние коэффициенты crash">
              <div className="bet-recent-heading"><span>ЭФИР ПОЛЁТОВ</span><strong>Последние crash</strong></div>
              <div className="bet-crash-list">
                {recentCrashes.map((item) => <span key={item.id} className={`bet-crash bet-crash-${crashColor(item.crash!)}`}>{coefficient(item.crash)}</span>)}
              </div>
            </section>
            {lastGame && <section className={`bet-last-game last-${lastGame.result.outcome}`} aria-label="Последняя игра">
              <div className="last-game-result"><small>ПОСЛЕДНИЙ ПОЛЁТ</small><strong>{lastGame.result.outcome === 'win' ? 'Выигрыш' : 'Проигрыш'}</strong><b>{number.format(lastGame.result.payout)} <em>бонусов</em></b></div>
              <dl><div><dt>Cashout</dt><dd>{coefficient(lastGame.cashout)}</dd></div><div><dt>Crash</dt><dd>{coefficient(lastGame.crash)}</dd></div></dl>
            </section>}
          </div>
          <div
            aria-hidden="true" className={`theme-balloon-float scene-${theme.toLowerCase()}`}
            style={{
              '--float-duration': `${sky.motion.duration}s`,
              '--float-rise': `${sky.motion.rise}px`,
              '--float-tilt': `${sky.motion.tilt}deg`,
              '--float-delay': `${sky.motion.delay}s`,
            } as CSSProperties}
          >
            <div className="air-balloon">
              <div className="canopy"><div className="canopy-stripe" /></div>
              <div className="ropes" />
              <div className="basket" />
            </div>
          </div>

        </div>

        {modal === 'rules' && <RulesModal onClose={() => setModal(null)} />}
        {modal === 'history' && <HistoryModal onClose={() => setModal(null)} />}
      </section>
    );
  }

  return <section className={`unified-scene mode-${mode.toLowerCase()} theme-${(round?.theme ?? theme).toLowerCase()} ${starting ? 'is-launching' : ''} ${round?.status === 'crashed' && !isResult ? 'is-ending' : ''}`}>
    <div className="scene-cloud cloud-a" /><div className="scene-cloud cloud-b" /><div className="scene-cloud cloud-c" />
    <div className="scene-topbar">
      <div className="scene-title"><span>{mode === 'IN_GAME' ? 'ВЫ УЖЕ В НЕБЕ' : 'ПОЛЁТ ЗАВЕРШЁН'}</span><h1>{mode === 'IN_GAME' ? <>Лети выше.<br /><em>Забери вовремя!</em></> : <>Как прошёл<br /><em>ваш полёт?</em></>}</h1></div>
      {createPortal(<div className="scene-actions">
        <button onClick={() => setModal('rules')}><b>?</b><span>Правила</span></button>
        <button onClick={() => setModal('history')}><b>↺</b><span>История</span></button>
        <div className="scene-balance"><i>★</i><span>Баланс<small>{(data?.profile.balance ?? 0).toLocaleString('ru-RU')} бонусов</small></span></div>
      </div>, document.getElementById('game-header-actions')!)}
    </div>

    <div className="scene-board">
      <div className="world-stage">
        {mode === 'IN_GAME' && round && <div className="active-world"><FlightSky round={round} /></div>}
        {mode === 'RESULT' && <ResultState result={result} seconds={seconds} onAgain={playAgain} />}
      </div>

      {mode === 'IN_GAME' && round && <div className="flight-side"><FlightControls round={round} pending={pending} onCashout={cashout} />{round.scenario && <p className="scenario-banner">Демо · {scenarioLabels[round.scenario]}</p>}{flightError && <div className="game-error">{flightError} <button onClick={retry}>Повторить</button></div>}</div>}
    </div>
    <div className="scene-footer"><span>★ +10 очков за каждый уровень</span><span>Следи за высотой и забирай бонусы вовремя</span></div>
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
