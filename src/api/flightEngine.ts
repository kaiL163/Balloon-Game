import type { Round } from '../types';

export const FLIGHT_SPEED = 0.2;
export const LEVEL_STEP = 0.5;
export const money = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
export const levelMultiplier = (level: number) => 1 + level * LEVEL_STEP;

export function lockCashout(round: Round) {
  const payoutBoost = round.boosterState === 'ACTIVATED' ? round.booster : 1;
  round.cashoutBaseMultiplier = money(round.multiplier);
  round.cashoutMultiplier = money(round.multiplier * payoutBoost);
  round.payout = money(round.bet.amount * round.cashoutMultiplier);
  round.status = 'cashed_out';
  if (round.boosterState === 'WAITING') round.boosterState = 'MISSED';
}

/** Ordered events make results independent of frame rate, background tabs and reloads. */
export function advanceFlight(round: Round, now: number) {
  if (round.status !== 'active' && round.status !== 'cashed_out') return;
  let remaining = Math.max(0, now - round.lastTickAt) / 1000;
  round.lastTickAt = Math.max(now, round.lastTickAt);
  while (remaining > 1e-9) {
    const cashoutBase = round.cashoutBaseMultiplier ?? round.multiplier;
    const speed = round.cashoutMultiplier === null ? FLIGHT_SPEED : Math.max(FLIGHT_SPEED, (round.crashMultiplier - cashoutBase) / 2);
    const nextLevel = round.reachedLevel < round.levels ? levelMultiplier(round.reachedLevel + 1) : Infinity;
    const crashAt = round.crashMultiplier;
    const autoCashout = round.cashoutMultiplier === null
      ? round.scenario === 'win' ? 1.6 : round.scenario === 'booster' ? 2.15 : Infinity
      : Infinity;
    const target = Math.min(nextLevel, crashAt, autoCashout);
    const distance = Math.max(0, target - round.baseMultiplier);
    if (remaining * speed + 1e-9 < distance) {
      round.baseMultiplier += remaining * speed;
      round.multiplier = round.baseMultiplier;
      break;
    }
    remaining = Math.max(0, remaining - distance / speed);
    round.baseMultiplier = target;
    round.multiplier = target;
    // At equal boundaries crash wins over cashout and level rewards.
    if (crashAt <= target + 1e-9) {
      round.multiplier = round.crashMultiplier;
      round.status = 'crashed';
      if (round.boosterState === 'WAITING') round.boosterState = 'MISSED';
      break;
    }
    if (nextLevel <= target + 1e-9) {
      round.reachedLevel += 1;
      round.points += 10;
      if (round.reachedLevel === round.boosterLevel && round.boosterState === 'WAITING') {
        round.boosterState = 'ACTIVATED';
        round.points += 20 * round.booster;
      }
    }
    if (autoCashout <= target + 1e-9 && round.cashoutMultiplier === null) {
      lockCashout(round);
    }
  }
}
