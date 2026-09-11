import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router';
import { gameApi } from '../api';
import type { Theme } from '../types';
import { playWaterDrop, startBirdAmbience } from '../utils/audio';
import landscapeUrl from '../assets/theme-select-landscape.png';
import '../styles/bet.css';
import '../styles/theme-select.css';

interface DriftSpec {
  id: string;
  top: number;
  left: number;
  scale: number;
  duration: number;
  delay: number;
  driftX: number;
  driftY: number;
}

interface BalloonMotion {
  duration: number;
  rise: number;
  tilt: number;
  delay: number;
}

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function makeDrifters(kind: 'bird' | 'cloud', count: number): DriftSpec[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `${kind}-${index}-${Math.random().toString(36).slice(2, 7)}`,
    /* Keep birds/clouds in the open sky above the landscape horizon. */
    top: rand(4, kind === 'bird' ? 36 : 40),
    left: rand(-8, 88),
    scale: kind === 'bird' ? rand(0.7, 1.25) : rand(0.75, 1.45),
    duration: kind === 'bird' ? rand(9, 18) : rand(28, 48),
    delay: rand(-12, 0),
    driftX: kind === 'bird' ? rand(90, 220) * (Math.random() < 0.5 ? 1 : -1) : rand(40, 120) * (Math.random() < 0.5 ? 1 : -1),
    driftY: kind === 'bird' ? rand(-40, 40) : rand(-18, 18),
  }));
}

function makeBalloonMotion(): BalloonMotion {
  return {
    duration: rand(3.6, 5.8),
    rise: rand(8, 16),
    tilt: rand(4, 10),
    delay: rand(-2.5, 0),
  };
}

const options: { theme: Theme; title: string; levels: number; hint: string }[] = [
  { theme: 'RED', title: 'Красный шар', levels: 12, hint: 'Длинный маршрут · 12 уровней' },
  { theme: 'GREEN', title: 'Зелёный шар', levels: 9, hint: 'Короткий маршрут · 9 уровней' },
];

export function ThemeSelectPage() {
  const navigate = useNavigate();
  const [selecting, setSelecting] = useState(false);
  const [visit] = useState(() => Math.random());
  const [portalReady, setPortalReady] = useState(false);

  const sky = useMemo(() => {
    void visit;
    return {
      birds: makeDrifters('bird', 1 + Math.floor(Math.random() * 3)),
      clouds: makeDrifters('cloud', 1 + Math.floor(Math.random() * 3)),
      motions: {
        RED: makeBalloonMotion(),
        GREEN: makeBalloonMotion(),
      } satisfies Record<Theme, BalloonMotion>,
    };
  }, [visit]);

  useEffect(() => startBirdAmbience(), []);
  useEffect(() => setPortalReady(true), []);

  async function choose(theme: Theme) {
    if (selecting) return;
    setSelecting(true);
    playWaterDrop();
    try {
      await gameApi.setTheme(theme);
    } catch { /* Theme still applied via navigation state if storage write fails. */ }
    navigate('/bet', { state: { theme } });
  }

  const backdrop = (
    <div
      className="theme-select-backdrop"
      aria-hidden="true"
      style={{ backgroundImage: `url(${landscapeUrl})` }}
    />
  );

  return (
    <section className="theme-select" aria-label="Выбор темы">
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

      <div className="theme-select-copy">
        <p className="eyebrow">Воздушный Шар</p>
        <h1>Выберите свой шар</h1>
        <p>Два маршрута — разная высота. Красный длиннее, зелёный короче.</p>
      </div>

      <div className="theme-balloon-row" role="list">
        {options.map((option) => {
          const motion = sky.motions[option.theme];
          return (
            <button
              key={option.theme}
              type="button"
              role="listitem"
              className={`theme-balloon-card option-${option.theme.toLowerCase()}`}
              disabled={selecting}
              onClick={() => void choose(option.theme)}
              aria-label={`${option.title}, ${option.levels} уровней`}
            >
              <div
                className={`theme-balloon-float scene-${option.theme.toLowerCase()}`}
                style={{
                  '--float-duration': `${motion.duration}s`,
                  '--float-rise': `${motion.rise}px`,
                  '--float-tilt': `${motion.tilt}deg`,
                  '--float-delay': `${motion.delay}s`,
                } as CSSProperties}
              >
                <div className="air-balloon">
                  <div className="canopy"><div className="canopy-stripe" /></div>
                  <div className="ropes" />
                  <div className="basket" />
                </div>
              </div>
              <strong>{option.title}</strong>
              <span>{option.hint}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
