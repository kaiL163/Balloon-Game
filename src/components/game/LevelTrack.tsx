import { BoosterChest } from './BoosterChest';
import type { Round } from '../../types';
import { levelMultiplier } from '../../api/flightEngine';

export function LevelTrack({ round }: { round: Round }) {
  return <ol className="level-track" aria-label="Уровни полёта">{Array.from({ length: round.levels }, (_, index) => {
    const level = index + 1;
    return <li key={level} className={`flight-level ${level <= round.reachedLevel ? 'level-passed' : ''} ${level === round.reachedLevel ? 'level-current' : ''}`}
      style={{ bottom: `${level / round.levels * 65 + 5}%` }}>
      <span className="level-number">{String(level).padStart(2, '0')}</span><span className="level-line" />
      <span className="level-value">{levelMultiplier(level).toFixed(1)}x</span>
      {round.boosterLevel === level && <span className={`level-booster booster-${round.boosterState.toLowerCase()}`} aria-label={round.boosterState === 'ACTIVATED' ? `Сундук открыт: x${round.booster}` : 'Сундук со случайным бустером'}><BoosterChest state={round.boosterState} multiplier={round.booster} /></span>}
    </li>;
  })}</ol>;
}
