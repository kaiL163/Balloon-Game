import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { gameApi } from '../api';
import { RewardCard } from '../components/game/RewardCard';
import { useIdleReturn } from '../hooks/useIdleReturn';
import type { GameResult } from '../types';
import '../styles/game.css';

const number = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 });
export function ResultPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const roundId = params.get('round') ?? undefined;
  const [result, setResult] = useState<GameResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const goBack = useCallback(() => navigate('/', { replace: true }), [navigate]);
  const seconds = useIdleReturn(goBack, !!result);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    async function load() {
      const active = await gameApi.getActiveRound();
      if (active && (!roundId || active.id === roundId)) {
        if (active.status === 'crashed') await gameApi.finishRound(active.id);
        else { if (!cancelled) navigate('/game', { replace: true }); return null; }
      }
      return gameApi.getResult(roundId);
    }
    load().then((value) => { if (!cancelled) setResult(value); })
      .catch((cause) => { if (!cancelled) setError(cause instanceof Error ? cause.message : 'Не удалось загрузить результат.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [roundId, navigate]);
  if (loading || !result) return <section className="card"><h1>Итоги полёта</h1><p role="status">{loading ? 'Открываем бортовой журнал…' : error || 'Завершённых полётов пока нет.'}</p><Link className="button" to="/">К выбору ставки</Link></section>;
  const won = result.outcome === 'win';
  return <section className={`result-page result-${result.outcome}`}>
    <p className="eyebrow">{result.theme} EXPEDITION · {won ? 'WIN' : 'LOSE'}</p>
    <div className="result-symbol" aria-hidden="true">{won ? '✦' : '✧'}</div>
    <h1>{won ? 'Отличный полёт!' : 'Шар лопнул'}</h1>
    <p>{won ? 'Вы поймали свой момент. Бонусы уже на балансе.' : 'Ставка потеряна, но новая высота ещё впереди.'}</p>
    <div className="result-amount">{won ? number.format(result.payout) : `−${number.format(result.bet)}`}<span>{won ? 'бонусов · ваш выигрыш' : 'бонусов · потерянная ставка'}</span></div>
    <dl className="result-stats"><div><dt>Ставка</dt><dd>{number.format(result.bet)}</dd></div><div><dt>Cashout</dt><dd>{result.cashoutMultiplier === null ? '—' : `${result.cashoutMultiplier.toFixed(2)}x`}</dd></div><div><dt>Crash</dt><dd>{result.crashMultiplier.toFixed(2)}x</dd></div><div><dt>Игровые очки</dt><dd>+{result.points}</dd></div></dl>
    {won && <p className="could-win">Могли бы забрать больше <strong>до {number.format(result.bet * result.crashMultiplier)} бонусов</strong><small>Теоретически перед crash · выплата зафиксирована на cashout</small></p>}
    <RewardCard reward={result.reward} />
    <button className="button play-again" onClick={goBack}>Играть снова ↗</button>
    <p className="idle-countdown">Вернёмся к выбору ставки через {seconds} сек. бездействия</p>
  </section>;
}
