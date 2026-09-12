import { useCallback, useEffect, useState } from 'react';

interface PublicGameConfig {
  gameId: string;
  gameName: string;
  gameType: string;
  active: boolean;
  greenMaxMultiplier: number;
  redMaxMultiplier: number;
  boosterTierValues: number[];
  betTierAmounts: number[];
}

const fallback: PublicGameConfig = {
  gameId: 'air-balloon-v1',
  gameName: 'Воздушный шар',
  gameType: 'CRASH',
  active: true,
  greenMaxMultiplier: 10,
  redMaxMultiplier: 25,
  boosterTierValues: [1, 2, 3, 4],
  betTierAmounts: [100, 200, 300, 400],
};

export const GAME_CONFIG_UPDATED_EVENT = 'game-config-updated';

export function useGameConfig() {
  const [config, setConfig] = useState(fallback);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch('/api/game/config');
      if (!response.ok) return;
      const value = await response.json() as PublicGameConfig;
      setConfig(value);
      document.title = value.gameName;
    } catch {
      /* Keep the last known/default title while the server is unavailable. */
    }
  }, []);

  useEffect(() => {
    void refresh();
    const update = () => void refresh();
    window.addEventListener(GAME_CONFIG_UPDATED_EVENT, update);
    return () => window.removeEventListener(GAME_CONFIG_UPDATED_EVENT, update);
  }, [refresh]);

  return config;
}
