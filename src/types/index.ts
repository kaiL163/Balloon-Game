export type Theme = 'GREEN' | 'RED';
export type BoosterMultiplier = 1 | 2 | 3 | 4;
export type BoosterState = 'WAITING' | 'ACTIVATED' | 'MISSED';
export type Reward = 'Balloon' | 'Cloud' | 'Bird' | 'Trophy';
export type DemoScenario = 'win' | 'crash' | 'booster';

export interface ThemeOption { id: Theme; levels: number; }
export interface UserProfile {
  id: string;
  name: string;
  balance: number;
  gamePoints: number;
  theme: Theme;
}
export interface BetOption { id: string; amount: number; booster: BoosterMultiplier; label: string; }
export interface Round {
  id: string;
  bet: BetOption;
  theme: Theme;
  levels: number;
  booster: BoosterMultiplier;
  boosterLevel: number | null;
  boosterState: BoosterState;
  crashMultiplier: number;
  status: 'active' | 'cashed_out' | 'crashed' | 'finished';
  startedAt: string;
  lastTickAt: number;
  baseMultiplier: number;
  multiplier: number;
  reachedLevel: number;
  points: number;
  cashoutMultiplier: number | null;
  cashoutBaseMultiplier: number | null;
  payout: number;
  scenario: DemoScenario | null;
}
export interface GameResult {
  roundId: string;
  outcome: 'win' | 'loss';
  multiplier: number;
  cashoutMultiplier: number | null;
  crashMultiplier: number;
  payout: number;
  points: number;
  reward: Reward;
  bet: number;
  theme: Theme;
  booster: BoosterMultiplier;
  boosterState: BoosterState;
  finishedAt: string;
}
export interface HistoryItem {
  id: string;
  round: Round;
  result: GameResult;
  booster: number | null;
  cashout: number | null;
  crash: number | null;
  points: number | null;
}
