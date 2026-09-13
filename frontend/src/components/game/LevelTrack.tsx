import { BoosterChest } from './BoosterChest';
import type { Round } from '../../types';
import { FLIGHT_ROUTE_SPAN, FLIGHT_ROUTE_START, levelMultiplier } from '../../api/flightEngine';

export function LevelTrack({ round }: { round: Round }) {
  return <ol className="level-track" aria-label="Уровни полёта">{Array.from({ length: round.levels }, (_, index) => {
    const level = index + 1;
    return <li key={level} className={`flight-level ${level <= round.reachedLevel ? 'level-passed' : ''} ${level === round.reachedLevel ? 'level-current' : ''}`}
      style={{ bottom: `${FLIGHT_ROUTE_START + level / round.levels * FLIGHT_ROUTE_SPAN}%` }}>
      <span className="level-number">{String(level).padStart(2, '0')}</span><span className="level-line" />
      <span className="level-value">{levelMultiplier(level, round.levels, round.maxMultiplier).toFixed(2)}x</span>
      {round.boosterLevel === level && <span className={`level-booster booster-${round.boosterState.toLowerCase()}`} aria-label={round.boosterState === 'ACTIVATED' ? `Сундук открыт: ×${round.booster}` : `Сундук с бустером ×${round.booster}`}><BoosterChest state={round.boosterState} multiplier={round.booster} /></span>}
    </li>;
  })}</ol>;
}
