import type { GameApi } from './GameApi';
import { HttpGameApi } from './HttpGameApi';

export type { GameApi } from './GameApi';
export { MockGameApi } from './MockGameApi';
export { HttpGameApi } from './HttpGameApi';

export const gameApi: GameApi = new HttpGameApi();
