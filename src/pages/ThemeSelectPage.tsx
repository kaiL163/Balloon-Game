import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router';
import { gameApi } from '../api';
import { RulesModal } from '../components/RulesModal';
import type { Theme } from '../types';
import { playWaterDrop, startBirdAmbience } from '../utils/audio';
import { makeBalloonMotion, makeSkyVisit } from '../utils/skyDrift';
import landscapeUrl from '../assets/theme-select-landscape.png';
import '../styles/bet.css';
import '../styles/theme-select.css';

const options: { theme: Theme; title: string; levels: number; route: string }[] = [
  { theme: 'RED', title: 'Красный шар', levels: 12, route: 'Длинный маршрут' },
  { theme: 'GREEN', title: 'Зелёный шар', levels: 9, route: 'Короткий маршрут' },
];

export function ThemeSelectPage() {
  const navigate = useNavigate();
  const [selecting, setSelecting] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [visit] = useState(() => Math.random());
  const [portalReady, setPortalReady] = useState(false);

  const sky = useMemo(() => {
    void visit;
    const drifts = makeSkyVisit();
    return {
      ...drifts,
      motions: {
        RED: makeBalloonMotion(),
        GREEN: makeBalloonMotion(),
      } satisfies Record<Theme, ReturnType<typeof makeBalloonMotion>>,
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
              <span className="theme-balloon-meta">
                <span>{option.route}</span>
                <span>{option.levels} уровней</span>
              </span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        className="theme-balloon-card theme-how-to-play"
        onClick={() => setShowRules(true)}
        aria-haspopup="dialog"
      >
        Как играть?
      </button>

      {showRules && <RulesModal onClose={() => setShowRules(false)} />}
    </section>
  );
}
