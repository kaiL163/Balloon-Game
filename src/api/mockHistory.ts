import type { BoosterMultiplier, HistoryItem, Theme } from '../types';

// Примеры для истории. Не участвуют в балансе и чередовании новых раундов.
const examples: { theme: Theme; amount: number; booster: BoosterMultiplier; cashout: number | null; crash: number; points: number }[] = [
  { theme: 'GREEN', amount: 150, booster: 2, cashout: 2.4, crash: 3.85, points: 240 },
  { theme: 'RED', amount: 400, booster: 4, cashout: null, crash: 1.32, points: 0 },
  { theme: 'RED', amount: 250, booster: 3, cashout: 3.1, crash: 4.6, points: 465 },
  { theme: 'GREEN', amount: 100, booster: 1, cashout: 1.8, crash: 2.75, points: 90 },
  { theme: 'GREEN', amount: 150, booster: 2, cashout: null, crash: 1.14, points: 0 },
  { theme: 'RED', amount: 400, booster: 4, cashout: 4.25, crash: 6.8, points: 850 },
];

export const mockHistory: HistoryItem[] = examples.map((entry, index) => {
  const id = `demo-history-${index + 1}`;
  const startedAt = new Date(Date.UTC(2026, 8, 10, 18 - index, 0)).toISOString();
  return {
    id,
    round: {
      id, theme: entry.theme, levels: entry.theme === 'GREEN' ? 9 : 12,
      bet: { id: `bet-${entry.amount}`, amount: entry.amount, booster: entry.booster, label: `${entry.amount} бонусов` },
      status: 'finished', startedAt,
      booster: entry.booster, boosterLevel: entry.booster > 1 ? 2 : null,
      boosterState: entry.booster > 1 && entry.cashout !== null ? 'ACTIVATED' : 'MISSED',
      crashMultiplier: entry.crash, lastTickAt: Date.parse(startedAt),
      baseMultiplier: entry.crash, multiplier: entry.crash, reachedLevel: 0,
      points: entry.points, cashoutMultiplier: entry.cashout,
      cashoutBaseMultiplier: entry.cashout === null ? null : entry.cashout / (entry.booster > 1 ? entry.booster : 1),
      payout: Math.round(entry.amount * (entry.cashout ?? 0)), scenario: null,
    },
    result: {
      roundId: id, outcome: entry.cashout === null ? 'loss' : 'win',
      multiplier: entry.cashout ?? 0, payout: Math.round(entry.amount * (entry.cashout ?? 0)),
      finishedAt: new Date(Date.parse(startedAt) + 45000).toISOString(),
      cashoutMultiplier: entry.cashout, crashMultiplier: entry.crash,
      points: entry.points, reward: 'Cloud', bet: entry.amount, theme: entry.theme,
      booster: entry.booster, boosterState: entry.booster > 1 && entry.cashout !== null ? 'ACTIVATED' : 'MISSED',
    },
    booster: entry.booster, cashout: entry.cashout, crash: entry.crash, points: entry.points,
  };
});
