import type { GameApi } from './GameApi';
import type { BetOption, DemoScenario, GameResult, HistoryItem, Reward, Round, Theme, ThemeOption, UserProfile } from '../types';
import { authorizedFetch, getAuthToken } from '../utils/auth';

interface UserDto { id: number; username: string; bonusBalance: number; gamePoints: number }
interface RoundDto {
  id: number; theme: Theme; status: string; betAmount: number; boosterMultiplier: number;
  boosterLevel: number | null; themeMaxMultiplier: number;
  currentLevel: number; baseMultiplier: number; currentMultiplier: number; points: number; createdAt: string;
  cashoutMultiplier: number | null; winAmount: number | null;
}
interface FairnessDto { boosterLevel: number | null; crashMultiplier: number }
interface HistoryDto {
  id: number; date: string; theme: Theme; bet: string; betAmount: number; boosterLevel: number | null;
  themeMaxMultiplier: number;
  status: string; result: 'CRASH' | 'CASHOUT' | 'IN_PROGRESS'; crashLevel: number; crashMultiplier: number;
  cashoutMultiplier: number | null; winAmount: number | null; points: number;
}
interface RewardDto { roundId: number; code: 'COMMON' | 'RARE' | 'EPIC' }
interface GameConfigDto { boosterTierValues: number[]; betTierAmounts: number[]; active: boolean }

const themes: ThemeOption[] = [{ id: 'GREEN', levels: 9 }, { id: 'RED', levels: 12 }];
const bets: BetOption[] = [
  { id: 'x1', amount: 100, booster: 1, label: '100 бонусов' },
  { id: 'x2', amount: 200, booster: 2, label: '200 бонусов' },
  { id: 'x3', amount: 300, booster: 3, label: '300 бонусов' },
  { id: 'x4', amount: 400, booster: 4, label: '400 бонусов' },
];

function apiError(body: unknown, fallback: string) {
  if (body && typeof body === 'object' && 'error' in body && typeof body.error === 'string') return body.error;
  return fallback;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body) headers.set('Content-Type', 'application/json');
  const response = await authorizedFetch(path, { ...init, headers });
  const text = await response.text();
  const body = text ? JSON.parse(text) as unknown : null;
  if (!response.ok) throw new Error(apiError(body, 'Ошибка сервера.'));
  return body as T;
}

const asBooster = (value: number): number => Number.isFinite(value) && value >= 1 ? value : 1;
const rewardFor = (code?: RewardDto['code']): Reward => code === 'EPIC' ? 'Trophy' : code === 'RARE' ? 'Cloud' : 'Balloon';
const savedTheme = (): Theme => {
  const value = localStorage.getItem('balloon-theme');
  return value === 'RED' || value === 'GREEN' ? value : 'GREEN';
};

export class HttpGameApi implements GameApi {
  private rounds = new Map<string, Round>();
  private theme: Theme = savedTheme();

  async getProfile(): Promise<UserProfile> {
    const dto = await request<UserDto>('/api/users/me');
    return { id: String(dto.id), name: dto.username, balance: Number(dto.bonusBalance), gamePoints: dto.gamePoints, theme: this.theme };
  }

  async getBetOptions() {
    const config = await request<GameConfigDto>('/api/game/config');
    return bets.map((bet, index) => {
      const amount = Number(config.betTierAmounts[index] ?? bet.amount);
      return {
        ...bet,
        amount,
        booster: asBooster(Number(config.boosterTierValues[index] ?? bet.booster)),
        label: `${amount} бонусов`,
      };
    });
  }
  async getThemes() { return structuredClone(themes); }

  async setTheme(theme: Theme) {
    this.theme = theme;
    localStorage.setItem('balloon-theme', theme);
    return theme;
  }

  async getActiveRound() {
    const dto = await request<RoundDto | null>('/api/game/rounds/active');
    return dto ? this.loadRound(dto) : null;
  }

  async startRound(betOptionId: string, theme: Theme) {
    const dto = await request<RoundDto>('/api/game/rounds', {
      method: 'POST',
      body: JSON.stringify({ theme, bet: betOptionId }),
    });
    await this.setTheme(theme);
    return this.loadRound(dto);
  }

  async startDemoRound(scenario: DemoScenario) {
    const active = await this.getActiveRound();
    if (active) return active;
    const bet = scenario === 'booster' ? 'x3' : 'x1';
    const round = await this.startRound(bet, this.theme);
    round.scenario = scenario;
    this.rounds.set(round.id, round);
    return round;
  }

  async advanceRound(roundId: string) {
    const dto = await request<RoundDto>(`/api/game/rounds/${encodeURIComponent(roundId)}`);
    return this.loadRound(dto);
  }

  async cashout(roundId: string) {
    await request(`/api/game/rounds/${encodeURIComponent(roundId)}/cashout`, { method: 'POST' });
    return this.advanceRound(roundId);
  }

  async finishRound(roundId: string) {
    const result = await this.getResult(roundId);
    if (!result) throw new Error('Результат ещё не готов.');
    return result;
  }

  async getResult(roundId?: string) {
    const history = await this.getHistory();
    return (roundId ? history.find((item) => item.id === roundId) : history[0])?.result ?? null;
  }

  async getHistory() {
    const [rows, rewards] = await Promise.all([
      request<HistoryDto[]>('/api/game/history'),
      request<RewardDto[]>('/api/users/me/rewards'),
    ]);
    const rewardByRound = new Map(rewards.map((item) => [String(item.roundId), item.code]));
    return rows.filter((row) => row.result !== 'IN_PROGRESS').map((row) => this.mapHistory(row, rewardByRound.get(String(row.id))));
  }

  subscribeToRound(roundId: string, onRound: (round: Round) => void, onError: (error: Error) => void) {
    const token = getAuthToken();
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${window.location.host}/ws/game/${encodeURIComponent(roundId)}?token=${encodeURIComponent(token || '')}`);
    let stopped = false;
    let refreshing = false;
    let queued = false;
    let fallbackTimer: number | null = null;

    const refresh = async () => {
      if (refreshing) { queued = true; return; }
      refreshing = true;
      try {
        const round = await this.advanceRound(roundId);
        if (!stopped) onRound(round);
      } catch (cause) {
        if (!stopped) onError(cause instanceof Error ? cause : new Error('Не удалось обновить полёт.'));
      } finally {
        refreshing = false;
        if (queued && !stopped) { queued = false; void refresh(); }
      }
    };

    const stopFallback = () => {
      if (fallbackTimer === null) return;
      window.clearInterval(fallbackTimer);
      fallbackTimer = null;
    };
    const startFallback = () => {
      if (stopped || fallbackTimer !== null) return;
      void refresh();
      fallbackTimer = window.setInterval(() => void refresh(), 500);
    };

    socket.onopen = stopFallback;
    socket.onmessage = (message) => {
      try {
        const event = JSON.parse(String(message.data)) as { type?: string; level?: number; error?: string };
        if (event.type === 'ERROR') throw new Error(event.error || 'Ошибка игрового канала.');
        if (event.type === 'BOOSTER_ACTIVATED' && typeof event.level === 'number') {
          const cached = this.rounds.get(roundId);
          if (cached) this.rounds.set(roundId, { ...cached, boosterLevel: event.level, boosterState: 'ACTIVATED' });
        }
        void refresh();
      } catch (cause) {
        if (!stopped) onError(cause instanceof Error ? cause : new Error('Некорректное сообщение сервера.'));
      }
    };
    socket.onerror = startFallback;
    socket.onclose = startFallback;
    return () => { stopped = true; stopFallback(); socket.close(); };
  }

  private async loadRound(dto: RoundDto) {
    const terminal = dto.status === 'CRASHED' || dto.status === 'FINISHED';
    let fairness: FairnessDto | undefined;
    if (terminal) {
      fairness = await request<FairnessDto>(`/api/game/rounds/${dto.id}/fairness`);
    }
    const previous = this.rounds.get(String(dto.id));
    const booster = asBooster(Number(dto.boosterMultiplier));
    const boosterLevel = dto.boosterLevel ?? fairness?.boosterLevel ?? previous?.boosterLevel ?? null;
    const boosterState = previous?.boosterState === 'ACTIVATED'
      ? 'ACTIVATED'
      : boosterLevel !== null && dto.currentLevel >= boosterLevel
        ? 'ACTIVATED'
        : terminal ? 'MISSED' : 'WAITING';
    const baseMultiplier = Number(dto.baseMultiplier);
    const round: Round = {
      id: String(dto.id),
      bet: { id: `x${booster}`, amount: Number(dto.betAmount), booster, label: `${dto.betAmount} бонусов` },
      theme: dto.theme,
      levels: dto.theme === 'RED' ? 12 : 9,
      maxMultiplier: Number(dto.themeMaxMultiplier),
      booster,
      boosterLevel,
      boosterState,
      crashMultiplier: fairness?.crashMultiplier ?? previous?.crashMultiplier ?? 0,
      status: terminal ? 'crashed' : dto.status === 'CASHED_OUT' ? 'cashed_out' : 'active',
      startedAt: dto.createdAt,
      lastTickAt: Date.now(),
      baseMultiplier,
      multiplier: baseMultiplier,
      reachedLevel: dto.currentLevel,
      points: dto.points,
      cashoutMultiplier: dto.cashoutMultiplier === null ? null : Number(dto.cashoutMultiplier),
      cashoutBaseMultiplier: dto.cashoutMultiplier === null ? null : baseMultiplier,
      payout: Number(dto.winAmount ?? 0),
      scenario: previous?.scenario ?? null,
    };
    this.rounds.set(round.id, round);
    return round;
  }

  private mapHistory(row: HistoryDto, rewardCode?: RewardDto['code']): HistoryItem {
    const booster = asBooster(Number(row.bet.replace('x', '')));
    const outcome = row.result === 'CASHOUT' ? 'win' : 'loss';
    const round: Round = {
      id: String(row.id), bet: { id: row.bet, amount: Number(row.betAmount), booster, label: `${row.betAmount} бонусов` },
      theme: row.theme, levels: row.theme === 'RED' ? 12 : 9, maxMultiplier: Number(row.themeMaxMultiplier), booster, boosterLevel: row.boosterLevel,
      boosterState: row.boosterLevel !== null && row.crashLevel > row.boosterLevel ? 'ACTIVATED' : 'MISSED',
      crashMultiplier: Number(row.crashMultiplier), status: 'finished', startedAt: row.date, lastTickAt: Date.parse(row.date),
      baseMultiplier: Number(row.crashMultiplier), multiplier: Number(row.crashMultiplier), reachedLevel: Math.max(0, row.crashLevel - 1),
      points: row.points, cashoutMultiplier: row.cashoutMultiplier === null ? null : Number(row.cashoutMultiplier),
      cashoutBaseMultiplier: row.cashoutMultiplier === null ? null : Number(row.cashoutMultiplier), payout: Number(row.winAmount ?? 0), scenario: null,
    };
    const result: GameResult = {
      roundId: round.id, outcome, multiplier: round.cashoutMultiplier ?? 0, cashoutMultiplier: round.cashoutMultiplier,
      crashMultiplier: round.crashMultiplier, payout: round.payout, points: row.points, reward: rewardFor(rewardCode),
      bet: round.bet.amount, theme: round.theme, booster, boosterState: round.boosterState, finishedAt: row.date,
    };
    return { id: round.id, round, result, booster, cashout: round.cashoutMultiplier, crash: round.crashMultiplier, points: row.points };
  }
}
