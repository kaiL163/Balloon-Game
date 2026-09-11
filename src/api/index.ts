import type { GameApi } from './GameApi';
import { MockGameApi } from './MockGameApi';

export type { GameApi } from './GameApi';
export { MockGameApi } from './MockGameApi';

export const gameApi: GameApi = new MockGameApi();
