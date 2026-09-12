import type { BoosterState } from '../../types';
import '../../styles/booster-chest.css';

export function BoosterChest({ state = 'WAITING', multiplier }: { state?: BoosterState; multiplier?: number }) {
  const opened = state === 'ACTIVATED';
  return <span className={`booster-chest chest-${state.toLowerCase()}`} aria-hidden="true">
    <span className="chest-lid" /><span className="chest-body" /><span className="chest-lock">{opened ? `×${multiplier}` : '?'}</span>
  </span>;
}
