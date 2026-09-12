import { BoosterChest } from '../components/game/BoosterChest';
import { betPuzzlePaths } from '../components/game/betPuzzlePaths';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { gameApi } from '../api';
import { FlightControls } from '../components/game/FlightControls';
import { FlightSky } from '../components/game/FlightSky';
import { RewardCard } from '../components/game/RewardCard';
import { HistoryModal } from '../components/HistoryModal';
import { RulesModal } from '../components/RulesModal';
import { useFlight } from '../hooks/useFlight';
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
const scenarioLabels = { win: 'Быстрый старт x1', crash: 'Быстрый старт x1', booster: 'Быстрый старт x3' };
const themeLabel = (theme: Theme) => theme === 'RED' ? 'Красный шар' : 'Зелёный шар';
const betDescriptions = ['Базовый рост', 'Ускоренный', 'Высокие шансы', 'Максимальный'];
const RESULT_RETURN_SECONDS = 60;

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
  const [flightPanelCollapsed, setFlightPanelCollapsed] = useState(false);
  const [launchMorphReady, setLaunchMorphReady] = useState(false);
  const [visit] = useState(() => Math.random());
  const submitting = useRef(false);
  const soundedResult = useRef<string | null>(null);
  const launchBalloonRef = useRef<HTMLDivElement | null>(null);
  const activeWorldRef = useRef<HTMLDivElement | null>(null);
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
    if (mode !== 'PRE_GAME' && mode !== 'RESULT') return;
    return startBirdAmbience();
  }, [mode, visit]);
  useEffect(() => {
    if (!result || soundedResult.current === result.roundId) return;
    soundedResult.current = result.roundId;
    playResult(result.outcome);
  }, [result]);
  useEffect(() => {
    if (result?.theme === 'RED' || result?.theme === 'GREEN') setTheme(result.theme);
  }, [result]);
  useEffect(() => setFlightPanelCollapsed(false), [round?.id]);

  const playAgain = useCallback(() => {
    navigate('/', { replace: true });
  }, [navigate]);
  const [seconds, setSeconds] = useState(RESULT_RETURN_SECONDS);
  useEffect(() => {
    if (!result || !isResult) {
      setSeconds(RESULT_RETURN_SECONDS);
      return;
    }
    const startedAt = Date.now();
    setSeconds(RESULT_RETURN_SECONDS);
    const timer = window.setInterval(() => {
      const remaining = Math.max(0, Math.ceil(RESULT_RETURN_SECONDS - (Date.now() - startedAt) / 1000));
      setSeconds(remaining);
      if (remaining === 0) {
        window.clearInterval(timer);
        navigate('/', { replace: true });
      }
    }, 250);
    return () => window.clearInterval(timer);
  }, [result, isResult, navigate]);
  const selectedBet = data?.bets.find((bet) => bet.id === selectedId);
  const selectedTheme = data?.themes.find((option) => option.id === theme);
  const canStart = !!data && !!selectedBet && selectedBet.amount <= data.profile.balance && !starting && !round;
  const activeTheme = (result?.theme ?? round?.theme ?? theme).toLowerCase();
  const isFlying = mode === 'IN_GAME' && !!round;

  useLayoutEffect(() => {
    setLaunchMorphReady(false);
    if (!isFlying || !starting) return;
    const frame = window.requestAnimationFrame(() => {
      const host = launchBalloonRef.current;
      const source = host?.querySelector<HTMLElement>('.air-balloon');
      const target = activeWorldRef.current?.querySelector<HTMLElement>('.flight-balloon');
      const targetPosition = target?.closest<HTMLElement>('.flying-position');
      if (!host || !source || !target || !targetPosition) return;
      const sourceRect = source.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      const targetPositionRect = targetPosition.getBoundingClientRect();
      const sourceCenterX = sourceRect.left + sourceRect.width / 2;
      const sourceCenterY = sourceRect.top + sourceRect.height / 2;
      const targetCenterX = targetRect.left + targetRect.width / 2;
      const targetCenterY = targetRect.top + targetRect.height / 2;
      targetPosition.style.setProperty('--launch-from-x', `${sourceCenterX - targetCenterX}px`);
      targetPosition.style.setProperty('--launch-from-y', `${sourceCenterY - targetCenterY}px`);
      targetPosition.style.setProperty('--launch-from-scale', `${Math.max(1, sourceRect.width / targetRect.width)}`);
      targetPosition.style.setProperty('--launch-target-origin-x', `${targetCenterX - targetPositionRect.left}px`);
      targetPosition.style.setProperty('--launch-target-origin-y', `${targetCenterY - targetPositionRect.top}px`);
      setLaunchMorphReady(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [isFlying, starting, round?.id]);

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
      window.setTimeout(() => setStarting(false), 900);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось начать полёт.');
      setStarting(false);
    } finally { submitting.current = false; }
  }

  if (!data && !round) return <section className="scene-loader" aria-live="polite"><div className="loader-balloon">●</div><h1>Готовим шар к полёту</h1><p>{error || 'Загружаем бонусы и маршрут…'}</p></section>;

  if ((mode === 'PRE_GAME' || mode === 'IN_GAME') && data) {
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
        className={`bet-select bet-flight-stage theme-${activeTheme} ${isFlying ? 'is-flight' : 'is-lobby'} ${flightPanelCollapsed ? 'is-panel-collapsed' : ''} ${starting ? 'is-launching' : ''} ${launchMorphReady ? 'is-balloon-morphing' : ''} ${round?.status === 'crashed' ? 'is-ending' : ''}`}
        aria-label={isFlying ? 'Текущий полёт' : 'Выбор ставки'}
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

        <aside className="bet-select-panel bet-morph-panel">
          {(!isFlying || starting) && <div className="bet-panel-view bet-panel-lobby-view" aria-hidden={isFlying}>
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

                    <span className="puzzle-price">{bet.amount} <i aria-hidden="true">★</i></span>
                    <strong>×{bet.booster}</strong>
                    <small>{unavailable ? 'Мало бонусов' : betDescriptions[index]}</small>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <button className="bet-select-launch" disabled={!canStart} onClick={() => void start()}>
            <span>{starting ? 'Взлетаем…' : 'Начать'}</span>
          </button>
          <p className="bet-select-note">Ставка спишется в момент старта</p>
          {error && <p className="bet-select-error" role="alert">{error}</p>}
          </div>}

          {isFlying && round && <div className="bet-panel-view bet-panel-flight-view">
            <button
              className="flight-panel-toggle"
              type="button"
              aria-expanded={!flightPanelCollapsed}
              aria-label={flightPanelCollapsed ? 'Развернуть панель полёта' : 'Свернуть панель полёта'}
              onClick={() => setFlightPanelCollapsed((value) => !value)}
            >
              <span aria-hidden="true">{flightPanelCollapsed ? '›' : '‹'}</span>
              <small>{flightPanelCollapsed ? 'Развернуть' : 'Свернуть'}</small>
            </button>
            <div className="flight-panel-heading">
              <span>ПОЛЁТ УЖЕ ИДЁТ</span>
              <strong>{themeLabel(round.theme)}</strong>
              <p>{round.levels} уровней · ставка {number.format(round.bet.amount)} бонусов</p>
            </div>
            <FlightControls round={round} pending={pending} onCashout={cashout} />
            {round.scenario && <p className="scenario-banner">Демо · {scenarioLabels[round.scenario]}</p>}
            {flightError && <div className="game-error">{flightError} <button onClick={retry}>Повторить</button></div>}
          </div>}
        </aside>

        <div className="bet-select-balloon">
          {(!isFlying || starting) && <div className="bet-sky-stats bet-lobby-stats" aria-hidden={isFlying}>
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
          </div>}
          {(!isFlying || starting) && <div
            ref={launchBalloonRef}
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
          </div>}

          {isFlying && round && <div ref={activeWorldRef} className="active-world bet-active-world"><FlightSky round={round} /></div>}

          {isFlying && round && flightPanelCollapsed && <div className="flight-floating-controls">
            <button className="flight-panel-reopen" type="button" onClick={() => setFlightPanelCollapsed(false)}>
              <span aria-hidden="true">☰</span><b>{round.multiplier.toFixed(2)}x</b><small>Панель</small>
            </button>
            <button
              className="flight-floating-cashout"
              type="button"
              onClick={cashout}
              disabled={pending || round.status === 'crashed' || round.cashoutMultiplier !== null || round.reachedLevel < 1}
            >
              <strong>{pending ? 'Фиксируем…' : round.status === 'crashed' ? 'Полёт завершён' : round.cashoutMultiplier !== null ? 'Выигрыш зафиксирован' : round.reachedLevel < 1 ? 'Ждём первый уровень' : 'Забрать'}</strong>
              {round.cashoutMultiplier === null && round.status !== 'crashed' && round.reachedLevel > 0 && <small>{number.format(round.bet.amount * round.multiplier * (round.boosterState === 'ACTIVATED' ? round.booster : 1))} бонусов</small>}
            </button>
          </div>}

        </div>

        {modal === 'rules' && <RulesModal onClose={() => setModal(null)} />}
        {modal === 'history' && <HistoryModal onClose={() => setModal(null)} />}
      </section>
    );
  }

  const forestBackdrop = (
    <div
      className="bet-select-backdrop theme-select-backdrop"
      aria-hidden="true"
      style={{ backgroundImage: `url(${landscapeUrl})` }}
    />
  );
  return <section className={`unified-scene mode-${mode.toLowerCase()} theme-${activeTheme} ${starting ? 'is-launching' : ''} ${round?.status === 'crashed' && !isResult ? 'is-ending' : ''}`}>
    {(mode === 'IN_GAME' || mode === 'RESULT') && (portalReady ? createPortal(forestBackdrop, document.body) : forestBackdrop)}
    {mode === 'RESULT' ? (
      <div className="theme-sky" aria-hidden="true">
        {sky.clouds.map((cloud) => (
          <span
            key={cloud.id}
            className="theme-drift-cloud"
            style={{
              top: `${cloud.top}%`,
              left: `${cloud.left}%`,
              '--scale': cloud.scale * 0.55,
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
    ) : (
      <>
        <div className="scene-cloud cloud-a" /><div className="scene-cloud cloud-b" /><div className="scene-cloud cloud-c" />
      </>
    )}
    <div className="scene-topbar">
      <div className="scene-title">
        <h1>{mode === 'IN_GAME' ? <>Лети выше.<br /><em>Забери вовремя!</em></> : <>Как прошёл<br /><em>ваш полёт?</em></>}</h1>
      </div>
    </div>

    <div className="scene-board">
      <div className="world-stage">
        {mode === 'IN_GAME' && round && <div className="active-world"><FlightSky round={round} /></div>}
        {mode === 'RESULT' && <ResultState result={result} seconds={seconds} onAgain={playAgain} />}
      </div>

      {mode === 'IN_GAME' && round && <div className="flight-side"><FlightControls round={round} pending={pending} onCashout={cashout} />{round.scenario && <p className="scenario-banner">Демо · {scenarioLabels[round.scenario]}</p>}{flightError && <div className="game-error">{flightError} <button onClick={retry}>Повторить</button></div>}</div>}
    </div>
    {modal === 'rules' && <RulesModal onClose={() => setModal(null)} />}
    {modal === 'history' && <HistoryModal onClose={() => setModal(null)} />}
  </section>;
}

function ResultState({ result, seconds, onAgain }: { result: GameResult | null; seconds: number; onAgain: () => void }) {
  if (!result) return <div className="result-state result-loading"><h2>Открываем бортовой журнал…</h2></div>;
  const won = result.outcome === 'win';
  return <div className={`result-state ${won ? 'won' : 'lost'}`}>
    <p>{won ? 'УДАЧНАЯ ПОСАДКА' : 'В ЭТОТ РАЗ НЕ ПОВЕЗЛО'}</p>
    <h2>{won ? 'Отличный полёт!' : 'Шар лопнул'}</h2>
    <div className="result-prize">{won ? number.format(result.payout) : `−${number.format(result.bet)}`}<small>бонусов</small></div>
    <div className="result-inline-stats"><span>Ставка <b>{number.format(result.bet)}</b></span><span>Cashout <b>{result.cashoutMultiplier?.toFixed(2) ?? '—'}x</b></span><span>Crash <b>{result.crashMultiplier.toFixed(2)}x</b></span><span>Очки <b>+{result.points}</b></span></div>
    <RewardCard reward={result.reward} /><button className="start-flight play-again" onClick={onAgain}><span>Играть снова</span></button><small className="idle-countdown">Возврат в лобби через {seconds} секунд</small>
  </div>;
}
