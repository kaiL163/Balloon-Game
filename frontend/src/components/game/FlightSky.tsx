import { useEffect, useRef } from 'react';
import type { Round } from '../../types';
import { useFlash } from '../../hooks/useFlash';
import { playBoosterActivation, playCashout, playCrash, playLevelReached } from '../../utils/audio';
import { FLIGHT_ROUTE_SPAN, FLIGHT_ROUTE_START, flightProgress } from '../../api/flightEngine';
import { LevelTrack } from './LevelTrack';

export function FlightSky({ round }: { round: Round }) {
  const levelFlash = useFlash(round.reachedLevel);
  const boosterFlash = useFlash(round.boosterState, 1500);
  const previous = useRef({
    level: round.reachedLevel,
    boosterState: round.boosterState,
    cashoutMultiplier: round.cashoutMultiplier,
    status: round.status,
  });
  useEffect(() => {
    const last = previous.current;
    if (last.status !== 'crashed' && round.status === 'crashed') playCrash();
    else if (last.cashoutMultiplier === null && round.cashoutMultiplier !== null) playCashout();
    else if (last.boosterState === 'WAITING' && round.boosterState === 'ACTIVATED') playBoosterActivation();
    else if (round.reachedLevel > last.level) playLevelReached();
    previous.current = { level: round.reachedLevel, boosterState: round.boosterState, cashoutMultiplier: round.cashoutMultiplier, status: round.status };
  }, [round.reachedLevel, round.boosterState, round.cashoutMultiplier, round.status]);
  const crashed = round.status === 'crashed';
  // The server uses the same logarithmic mapping for currentLevel. Positioning
  // the balloon by its centre keeps the canopy from crossing a line early.
  const progress = flightProgress(round.baseMultiplier, round.maxMultiplier);
  const altitude = FLIGHT_ROUTE_START + progress * FLIGHT_ROUTE_SPAN;
  return <div className={`game-sky scene-${round.theme.toLowerCase()} ${crashed ? 'sky-crashed' : round.status === 'cashed_out' ? 'sky-fast-forward' : ''}`}>
    <div className="sky-label"><span>{round.theme} EXPEDITION</span><span>↑ {round.reachedLevel} / {round.levels}</span></div>
    <div className="sky-stars" aria-hidden="true">✧<span>✦</span>✧</div>
    <div className="sky-cloud sky-cloud-one" aria-hidden="true" /><div className="sky-cloud sky-cloud-two" aria-hidden="true" />
    <LevelTrack round={round} />
    {round.status === 'cashed_out' && <div className="flight-speed-lines" aria-hidden="true">{Array.from({ length: 8 }, (_, index) => <i key={index} style={{ left: `${10 + index * 11}%`, animationDelay: `${index * -.09}s` }} />)}</div>}
    <div className="flying-position" style={{ bottom: `calc(${altitude}% - var(--flight-anchor-offset))` }} aria-hidden="true">
      <div className="flight-balloon air-balloon"><div className="canopy"><div className="canopy-stripe" /></div><div className="ropes" /><div className="basket" /></div>
      {crashed && <div className="crash-burst"><span className="crash-ring" />{Array.from({ length: 12 }, (_, index) => <i key={index} style={{ rotate: `${index * 30}deg` }} />)}</div>}
      {levelFlash && round.reachedLevel > 0 && !crashed && <span key={round.reachedLevel} className="level-points">+10</span>}
    </div>
    {boosterFlash && round.boosterState === 'ACTIVATED' && <div className="booster-flash" role="status">⚡ BOOST x{round.booster}<small>Бонусные очки начислены</small></div>}
    {crashed && <div className="crash-caption" role="status">Шар лопнул<span>{round.crashMultiplier.toFixed(2)}x</span></div>}
    {(crashed || round.status === 'cashed_out') && (
      <div className="sky-bottom">
        {crashed ? 'ПОЛЁТ ЗАВЕРШЁН' : 'УСКОРЯЕМ ПОЛЁТ · ВЫИГРЫШ ЗАФИКСИРОВАН'}
      </div>
    )}
  </div>;
}
