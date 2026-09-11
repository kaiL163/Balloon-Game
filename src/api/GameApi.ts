import type { BetOption, DemoScenario, GameResult, HistoryItem, Round, Theme, ThemeOption, UserProfile } from '../types';

export interface GameApi {
  getProfile(): Promise<UserProfile>;
  getBetOptions(): Promise<BetOption[]>;
  getThemes(): Promise<ThemeOption[]>;
  getActiveRound(): Promise<Round | null>;
  startRound(betOptionId: string, theme: Theme): Promise<Round>;
  startDemoRound(scenario: DemoScenario): Promise<Round>;
  advanceRound(roundId: string): Promise<Round>;
  cashout(roundId: string): Promise<Round>;
  finishRound(roundId: string): Promise<GameResult>;
  getResult(roundId?: string): Promise<GameResult | null>;
  getHistory(): Promise<HistoryItem[]>;
}
