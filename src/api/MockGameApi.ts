import type { GameApi } from './GameApi';
import { mockHistory } from './mockHistory';
import { advanceFlight, lockCashout, money } from './flightEngine';
import type { BetOption, DemoScenario, GameResult, HistoryItem, Reward, Round, Theme, ThemeOption, UserProfile } from '../types';

export const STORAGE_KEY = 'balloon-game-v1';
interface SavedGame {
  version: 1;
  bonusBalance: number;
  gamePoints: number;
  theme: Theme;
  activeRound: Round | null;
  history: HistoryItem[];
}
interface Dependencies {
  storage?: Pick<Storage, 'getItem' | 'setItem'>;
  now?: () => number;
  random?: () => number;
}
const initialState = (): SavedGame => ({ version: 1, bonusBalance: 1000, gamePoints: 0, theme: 'GREEN', activeRound: null, history: [] });

export class MockGameApi implements GameApi {
  private state: SavedGame;
  private storage: Dependencies['storage'];
  private now: () => number;
  private random: () => number;
  private readonly bets: BetOption[] = [
    { id: 'bet-100', amount: 100, multiplier: 1, label: '100 бонусов' },
    { id: 'bet-150', amount: 150, multiplier: 2, label: '150 бонусов' },
    { id: 'bet-250', amount: 250, multiplier: 3, label: '250 бонусов' },
    { id: 'bet-400', amount: 400, multiplier: 4, label: '400 бонусов' },
  ];
  private readonly themes: ThemeOption[] = [{ id: 'GREEN', levels: 9 }, { id: 'RED', levels: 12 }];

  constructor(dependencies: Dependencies = {}) {
    this.storage = dependencies.storage ?? (typeof localStorage !== 'undefined' ? localStorage : undefined);
    this.now = dependencies.now ?? Date.now;
    this.random = dependencies.random ?? Math.random;
    this.state = this.read();
  }

  private read(): SavedGame {
    const raw = this.storage?.getItem(STORAGE_KEY);
    if (!raw) return initialState();
    try {
      const value = JSON.parse(raw) as SavedGame;
      if (value.version === 1 && Number.isFinite(value.bonusBalance) && value.bonusBalance >= 0
        && Number.isFinite(value.gamePoints) && value.gamePoints >= 0
        && ['GREEN', 'RED'].includes(value.theme) && Array.isArray(value.history)
        && (value.activeRound === null || (typeof value.activeRound?.id === 'string'
          && Number.isFinite(value.activeRound.lastTickAt) && Number.isFinite(value.activeRound.crashMultiplier)))) return value;
    } catch { /* An invalid save starts a new demo profile. */ }
    return initialState();
  }

  // A single storage write commits balance, points and history together.
  private commit(state: SavedGame) {
    this.storage?.setItem(STORAGE_KEY, JSON.stringify(state));
    this.state = state;
  }
  private fresh() { this.state = this.storage ? this.read() : this.state; return structuredClone(this.state); }
  private requireRound(state: SavedGame, id: string) {
    if (!state.activeRound || state.activeRound.id !== id) throw new Error('Раунд не найден. Вернитесь к выбору ставки.');
    return state.activeRound;
  }
  private reward(): Reward {
    return (['Balloon', 'Cloud', 'Bird', 'Trophy'] as const)[Math.floor(this.random() * 4)];
  }
  private settle(state: SavedGame, round: Round) {
    if (round.status !== 'crashed' || state.history.some((item) => item.id === round.id)) return;
    const result: GameResult = {
      roundId: round.id, outcome: round.cashoutMultiplier === null ? 'loss' : 'win',
      multiplier: round.cashoutMultiplier ?? 0, cashoutMultiplier: round.cashoutMultiplier,
      crashMultiplier: round.crashMultiplier, payout: round.payout, points: round.points,
      reward: this.reward(), bet: round.bet.amount, theme: round.theme,
      booster: round.booster, boosterState: round.boosterState, finishedAt: new Date(this.now()).toISOString(),
    };
    state.gamePoints += round.points;
    state.history.unshift({ id: round.id, round: { ...structuredClone(round), status: 'finished' }, result,
      booster: round.booster, cashout: round.cashoutMultiplier, crash: round.crashMultiplier, points: round.points });
  }
  private tick(state: SavedGame, round: Round) {
    const previousPayout = round.payout;
    advanceFlight(round, this.now());
    // Includes automatic cashout in deterministic demo scenarios.
    state.bonusBalance = money(state.bonusBalance + round.payout - previousPayout);
    this.settle(state, round);
  }

  async getProfile(): Promise<UserProfile> {
    const state = this.fresh();
    return { id: 'demo-user', name: 'Пилот', balance: state.bonusBalance, gamePoints: state.gamePoints, theme: state.theme };
  }
  async getBetOptions() { return structuredClone(this.bets); }
  async getThemes() { return structuredClone(this.themes); }
  async setTheme(theme: Theme) {
    if (!this.themes.some((option) => option.id === theme)) throw new Error('Тема не найдена.');
    const state = this.fresh();
    state.theme = theme;
    this.commit(state);
    return theme;
  }
  async getActiveRound() { return structuredClone(this.fresh().activeRound); }

  private create(state: SavedGame, bet: BetOption, theme: Theme, scenario: DemoScenario | null): Round {
    const levels = this.themes.find((option) => option.id === theme)?.levels;
    if (!levels) throw new Error('Тема не найдена.');
    if (state.activeRound) throw new Error('Сначала завершите текущий раунд.');
    if (state.bonusBalance < bet.amount) throw new Error('Недостаточно бонусов.');
    const boosterLevel = bet.multiplier === 1 ? null : scenario === 'booster' ? 2 : 2 + Math.floor(this.random() * (levels - 2));
    const crashMultiplier = scenario === 'win' ? 3.2 : scenario === 'crash' ? 1.3 : scenario === 'booster' ? 8.4
      : money(1.15 + this.random() * (1 + levels * 0.5 - 1.15) * bet.multiplier);
    const round: Round = {
      id: crypto.randomUUID(), bet: { ...bet }, theme, levels, booster: bet.multiplier, boosterLevel,
      boosterState: boosterLevel === null ? 'MISSED' : 'WAITING', crashMultiplier,
      status: 'active', startedAt: new Date(this.now()).toISOString(), lastTickAt: this.now(),
      baseMultiplier: 1, multiplier: 1, reachedLevel: 0, points: 0,
      cashoutMultiplier: null, payout: 0, scenario,
    };
    state.bonusBalance = money(state.bonusBalance - bet.amount);
    state.theme = theme;
    state.activeRound = round;
    this.commit(state);
    return structuredClone(round);
  }
  async startRound(betOptionId: string, theme: Theme) {
    const bet = this.bets.find((option) => option.id === betOptionId);
    if (!bet) throw new Error('Вариант ставки не найден.');
    return this.create(this.fresh(), bet, theme, null);
  }
  async startDemoRound(scenario: DemoScenario) {
    if (!['win', 'crash', 'booster'].includes(scenario)) throw new Error('Неизвестный сценарий.');
    const state = this.fresh();
    // Idempotent for StrictMode/reloads; never replace an unfinished paid round.
    if (state.activeRound) return structuredClone(state.activeRound);
    const bet = scenario === 'booster' ? this.bets[2] : this.bets[0];
    // Demo links remain usable on an exhausted profile. Only the missing amount is credited.
    state.bonusBalance = Math.max(state.bonusBalance, bet.amount);
    return this.create(state, bet, state.theme, scenario);
  }
  async advanceRound(roundId: string) {
    const state = this.fresh();
    const round = this.requireRound(state, roundId);
    this.tick(state, round);
    this.commit(state);
    return structuredClone(round);
  }
  async cashout(roundId: string) {
    const state = this.fresh();
    const round = this.requireRound(state, roundId);
    this.tick(state, round);
    if (round.cashoutMultiplier !== null) { this.commit(state); return structuredClone(round); }
    if (round.status !== 'active') { this.commit(state); throw new Error('Шар уже лопнул.'); }
    if (round.reachedLevel < 1) { this.commit(state); throw new Error('Забрать можно после первого уровня.'); }
    lockCashout(round);
    state.bonusBalance = money(state.bonusBalance + round.payout);
    this.commit(state);
    return structuredClone(round);
  }
  async finishRound(roundId: string): Promise<GameResult> {
    const state = this.fresh();
    if (state.activeRound?.id === roundId) {
      this.tick(state, state.activeRound);
      if (state.activeRound.status !== 'crashed') { this.commit(state); throw new Error('Полёт ещё продолжается.'); }
      state.activeRound = null;
    }
    const result = state.history.find((item) => item.id === roundId)?.result;
    if (!result) throw new Error('Результат не найден.');
    this.commit(state);
    return structuredClone(result);
  }
  async getResult(roundId?: string) {
    const state = this.fresh();
    return structuredClone((roundId ? state.history.find((item) => item.id === roundId) : state.history[0])?.result ?? null);
  }
  async getHistory() { return structuredClone([...this.fresh().history, ...mockHistory]); }
}
