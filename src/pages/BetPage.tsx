import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { DemoLinks } from '../components/game/DemoLinks';
import { gameApi } from '../api';
import { BalloonScene } from '../components/BalloonScene';
import { RulesModal } from '../components/RulesModal';
import { HistoryModal } from '../components/HistoryModal';
import type { BetOption, Round, Theme, ThemeOption, UserProfile } from '../types';
import '../styles/bet.css';

interface BetData {
  profile: UserProfile;
  bets: BetOption[];
  themes: ThemeOption[];
  activeRound: Round | null;
}

export function BetPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<BetData | null>(null);
  const [theme, setTheme] = useState<Theme>('GREEN');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const submitting = useRef(false);
  const [modal, setModal] = useState<'rules' | 'history' | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError('');
    Promise.all([gameApi.getProfile(), gameApi.getBetOptions(), gameApi.getThemes(), gameApi.getActiveRound()])
      .then(([profile, bets, themes, activeRound]) => {
        if (cancelled) return;
        setData({ profile, bets, themes, activeRound });
        setTheme(activeRound?.theme ?? profile.theme);
        setSelectedId(activeRound?.bet.id ?? null);
      })
      .catch(() => { if (!cancelled) setError('Не удалось подготовить полёт. Попробуйте ещё раз.'); });
    return () => { cancelled = true; };
  }, [attempt]);

  const selectedBet = data?.bets.find((bet) => bet.id === selectedId);
  const selectedTheme = data?.themes.find((option) => option.id === theme);
  const canStart = !!data && !!selectedBet && selectedBet.amount <= data.profile.balance && !starting && !data.activeRound;

  if (!data) return <section className="card" aria-live="polite"><h1>Готовим полёт</h1><p>{error || 'Собираем бонусы, маршруты и ваш воздушный шар…'}</p>{error && <button className="button" onClick={() => setAttempt((value) => value + 1)}>Повторить</button>}</section>;

  const controls = <div className="flight-controls">
    <fieldset disabled={starting || !!data.activeRound}><legend><span className="step">01</span> Выберите тему</legend><div className="theme-options">{data.themes.map((option) => <label key={option.id} className={`theme-option option-${option.id.toLowerCase()} ${theme === option.id ? 'selected' : ''}`}><input type="radio" name="theme" value={option.id} checked={theme === option.id} onChange={() => setTheme(option.id)} /><span className="theme-gem" aria-hidden="true">◆</span><strong>{option.id}</strong><span>{option.levels} уровней</span><span className="selection-mark" aria-hidden="true">{theme === option.id ? '✓' : '○'}</span></label>)}</div></fieldset>
    <fieldset disabled={starting || !!data.activeRound}><legend><span className="step">02</span> Выберите ставку <span className="legend-note">в бонусах</span></legend><div className="bet-options">{data.bets.map((bet) => {
      const unavailable = bet.amount > data.profile.balance;
      return <label key={bet.id} className={`bet-option ${selectedId === bet.id ? 'selected' : ''} ${unavailable ? 'unavailable' : ''}`}><input type="radio" name="bet" value={bet.id} checked={selectedId === bet.id} disabled={unavailable} onChange={() => setSelectedId(bet.id)} /><strong>{bet.amount}</strong><span className="bet-note">{unavailable ? 'Мало бонусов' : bet.booster === 1 ? 'Без бустера' : `Бустер ×${bet.booster}`}</span></label>;
    })}</div></fieldset>
    <div className="launch-area"><div className="launch-summary"><span>{selectedBet ? 'Ваша ставка' : 'Всё готово к приключению'}</span><strong>{selectedBet ? `${selectedBet.amount} бонусов` : 'Выберите ставку'}</strong></div>
      {data.activeRound ? <button className="button launch-button" onClick={() => navigate('/game')}>Продолжить полёт <span aria-hidden="true">↗</span></button> : <button className="button launch-button" disabled={!canStart} onClick={start}>{starting ? 'Взлетаем…' : 'Начать'}<span aria-hidden="true">↗</span></button>}
      <p className="launch-hint">{data.activeRound ? 'У вас уже есть незавершённый раунд' : 'Бонусы спишутся при старте полёта'}</p>
      {error && <p className="error" role="alert">{error}</p>}
    </div>
  </div>;

  async function start() {
    if (!canStart || !selectedBet || submitting.current) return;
    submitting.current = true;
    setStarting(true);
    setError('');
    try {
      await gameApi.startRound(selectedBet.id, theme);
      navigate('/game');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Не удалось начать полёт.');
      try {
        const [profile, activeRound] = await Promise.all([gameApi.getProfile(), gameApi.getActiveRound()]);
        setData((previous) => previous ? { ...previous, profile, activeRound } : previous);
      } catch { /* Сохраняем исходную ошибку старта для пользователя. */ }
    } finally {
      submitting.current = false;
      setStarting(false);
    }
  }

  return (
    <section className={`bet-page theme-${theme.toLowerCase()}`}>
      <div className="bet-heading"><div><p className="eyebrow">Небо ближе, чем кажется</p><h1>Выше — только <span>облака.</span></h1><p>Выберите свой маршрут. И пусть приключение начнётся.</p></div>
        <div className="balance"><span className="coin" aria-hidden="true">✦</span><div><span>Ваш баланс · {data.profile.gamePoints.toLocaleString('ru-RU')} очков</span><strong>{data.profile.balance.toLocaleString('ru-RU')} <small>бонусов</small></strong></div></div>
      </div>
      <div className="bet-utilities" aria-label="Информация об игре">
        <button onClick={() => setModal('rules')} aria-haspopup="dialog"><span aria-hidden="true">?</span> Правила</button>
        <button onClick={() => setModal('history')} aria-haspopup="dialog"><span aria-hidden="true">↺</span> История игр</button>
      </div>
      <div className="flight-panel">
        <div className="flight-preview"><div className="preview-label"><span>ВОЗДУШНЫЙ ШАР</span><span>01 / ПОДГОТОВКА</span></div><BalloonScene theme={theme} levels={selectedTheme?.levels ?? 0} /><div className="preview-copy"><span className="eyebrow">Время взлетать</span><h2>Большой полёт<br />начинается с выбора.</h2><p>Ваш шар. Ваш маршрут. Ваша высота.</p></div></div>
        {controls}
      </div>
      <div className="flight-footnote"><span>✧ Только вы и новая высота</span><span>Выберите тему → Сделайте ставку → Взлетайте</span></div>
      {!data.activeRound && <DemoLinks />}
      {modal === 'rules' && <RulesModal onClose={() => setModal(null)} />}
      {modal === 'history' && <HistoryModal onClose={() => setModal(null)} />}
    </section>
  );
}
