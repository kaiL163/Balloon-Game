import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { gameApi } from '../api';
import type { DemoScenario, Round } from '../types';

export function useFlight(scenario: DemoScenario | null) {
  const navigate = useNavigate();
  const [round, setRound] = useState<Round | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const busy = useRef(false);
  const current = useRef<Round | null>(null);
  const live = useRef(false);

  useEffect(() => {
    let cancelled = false;
    live.current = true;
    setLoading(true);
    setError('');
    setRound(null);
    current.current = null;
    const request = scenario ? gameApi.startDemoRound(scenario) : gameApi.getActiveRound();
    request.then((value) => {
      if (cancelled) return;
      current.current = value;
      setRound(value);
    }).catch((cause) => { if (!cancelled) setError(cause instanceof Error ? cause.message : 'Не удалось загрузить полёт.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; live.current = false; };
  }, [scenario, attempt]);

  useEffect(() => {
    if (!round || !['active', 'cashed_out'].includes(round.status) || error) return;
    return gameApi.subscribeToRound(
      round.id,
      (next) => { current.current = next; setRound(next); },
      (cause) => setError(cause.message || 'Не удалось обновить полёт.'),
    );
  }, [round?.id, round?.status, error]);

  useEffect(() => {
    if (!round || round.status !== 'crashed' || error) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      gameApi.finishRound(round.id).then(() => {
        if (!cancelled) navigate(`/result?round=${encodeURIComponent(round.id)}`, { replace: true });
      }).catch((cause) => { if (!cancelled) setError(cause instanceof Error ? cause.message : 'Не удалось сохранить результат.'); });
    }, 1400);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [round?.id, round?.status, navigate, error]);

  async function cashout() {
    if (!current.current || busy.current) return;
    busy.current = true;
    setPending(true);
    try {
      const next = await gameApi.cashout(current.current.id);
      if (live.current) { current.current = next; setRound(next); }
    } catch (cause) {
      // A click at the crash boundary must still complete the flight automatically.
      try {
        const latest = await gameApi.getActiveRound();
        if (live.current && latest?.status === 'crashed') {
          current.current = latest;
          setRound(latest);
        } else if (live.current) setError(cause instanceof Error ? cause.message : 'Не удалось забрать выигрыш.');
      } catch {
        if (live.current) setError('Не удалось сохранить полёт. Проверьте доступность хранилища и повторите.');
      }
    } finally { busy.current = false; if (live.current) setPending(false); }
  }
  return { round, loading, error, pending, cashout, retry: () => setAttempt((value) => value + 1) };
}
