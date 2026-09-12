import type { Theme } from '../types';

export function BalloonScene({ theme, levels }: { theme: Theme; levels: number }) {
  return (
    <div className={`flight-scene scene-${theme.toLowerCase()}`} aria-hidden="true">
      <div className="orbit orbit-one" /><div className="orbit orbit-two" />
      <span className="star star-one">✦</span><span className="star star-two">✧</span><span className="star star-three">+</span>
      <div className="altitude"><span>МАРШРУТ</span><strong>{String(levels).padStart(2, '0')}</strong><span>УРОВНЕЙ</span></div>
      <div className="air-balloon"><div className="canopy"><div className="canopy-stripe" /></div><div className="ropes" /><div className="basket" /></div>
      <div className="cloud cloud-one" /><div className="cloud cloud-two" />
      <div className="scene-caption"><span className="status-dot" /> {theme} EXPEDITION <span>↑</span></div>
    </div>
  );
}
