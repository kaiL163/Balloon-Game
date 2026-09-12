import { useEffect, useId, useRef, useState } from 'react';

const STORAGE_KEY = 'balloon-cashout-onboarding-v1';
let shownThisSession = false;

export function CashoutOnboarding({ active }: { active: boolean }) {
  const id = useId();
  const eligible = useRef<boolean | null>(null);
  const [phase, setPhase] = useState<'hidden' | 'visible' | 'leaving'>('hidden');

  useEffect(() => {
    if (!active) {
      setPhase('hidden');
      return;
    }
    if (eligible.current === null) {
      let seen = shownThisSession;
      try { seen ||= localStorage.getItem(STORAGE_KEY) === 'seen'; } catch { /* Storage may be unavailable. */ }
      eligible.current = !seen;
      if (!seen) {
        shownThisSession = true;
        try { localStorage.setItem(STORAGE_KEY, 'seen'); } catch { /* Keep the session fallback. */ }
      }
    }
    if (!eligible.current) return;
    setPhase('visible');
    const fade = window.setTimeout(() => setPhase('leaving'), 4000);
    const hide = window.setTimeout(() => setPhase('hidden'), 4400);
    return () => {
      window.clearTimeout(fade);
      window.clearTimeout(hide);
    };
  }, [active]);

  if (!active || phase === 'hidden') return null;
  return <div id={id} className={`cashout-onboarding ${phase === 'leaving' ? 'is-leaving' : ''}`} role="status">
    <span>Нажми 'Забрать' до того, как шар лопнет</span>
    <svg className="cashout-onboarding-arrow" viewBox="0 0 32 40" aria-hidden="true">
      <path d="M16 3v30M5 23l11 11 11-11" />
    </svg>
  </div>;
}
