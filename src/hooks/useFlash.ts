import { useEffect, useState } from 'react';

export function useFlash(value: number | string, duration = 1100) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), duration);
    return () => clearTimeout(timer);
  }, [value, duration]);
  return visible;
}
