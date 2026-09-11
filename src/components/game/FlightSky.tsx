import type { Round } from '../../types';
import { useFlash } from '../../hooks/useFlash';
import { LevelTrack } from './LevelTrack';

export function FlightSky({ round }: { round: Round }) {
  const levelFlash = useFlash(round.reachedLevel);
  const boosterFlash = useFlash(round.boosterState, 1500);
  const crashed = round.status === 'crashed';
  const height = Math.min(1, (round.baseMultiplier - 1) / (round.levels * 0.5));
  return <div className={`game-sky scene-${round.theme.toLowerCase()} ${crashed ? 'sky-crashed' : ''}`}>
    <div className="sky-label"><span>{round.theme} EXPEDITION</span><span>↑ {round.reachedLevel} / {round.levels}</span></div>
    <div className="sky-stars" aria-hidden="true">✧<span>✦</span>✧</div>
    <div className="sky-cloud sky-cloud-one" aria-hidden="true" /><div className="sky-cloud sky-cloud-two" aria-hidden="true" />
    <LevelTrack round={round} />
    <div className="flying-position" style={{ bottom: `${5 + height * 65}%` }} aria-hidden="true">
      <div className="flight-balloon air-balloon"><div className="canopy"><div className="canopy-stripe" /></div><div className="ropes" /><div className="basket" /></div>
      {crashed && <div className="crash-burst">{Array.from({ length: 12 }, (_, index) => <i key={index} style={{ rotate: `${index * 30}deg` }} />)}</div>}
      {levelFlash && round.reachedLevel > 0 && !crashed && <span key={round.reachedLevel} className="level-points">+10</span>}
    </div>
    {boosterFlash && round.boosterState === 'ACTIVATED' && <div className="booster-flash" role="status">⚡ BOOST x{round.booster}<small>+{round.booster * 20} очков</small></div>}
    {crashed && <div className="crash-caption" role="status">Шар лопнул<span>{round.crashMultiplier.toFixed(2)}x</span></div>}
    <div className="sky-bottom">{crashed ? 'ПОЛЁТ ЗАВЕРШЁН' : 'НАБИРАЕМ ВЫСОТУ'}<span>+10 очков за уровень</span></div>
  </div>;
}
