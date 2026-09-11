import { useEffect, useState } from 'react';

export function useIdleReturn(onIdle: () => void, enabled: boolean) {
  const [seconds, setSeconds] = useState(10);
  useEffect(() => {
    if (!enabled) return;
    let deadline = Date.now() + 10000;
    const reset = () => { deadline = Date.now() + 10000; setSeconds(10); };
    const events = ['pointerdown', 'pointermove', 'keydown', 'scroll'] as const;
    events.forEach((event) => window.addEventListener(event, reset, { passive: true }));
    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setSeconds(remaining);
      if (remaining === 0) { clearInterval(timer); onIdle(); }
    }, 250);
    return () => { clearInterval(timer); events.forEach((event) => window.removeEventListener(event, reset)); };
  }, [onIdle, enabled]);
  return seconds;
}
