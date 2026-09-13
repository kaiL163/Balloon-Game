import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { authorizedFetch } from '../utils/auth';
import { GAME_CONFIG_UPDATED_EVENT } from '../hooks/useGameConfig';
import landscapeUrl from '../assets/theme-select-landscape.png';
import '../styles/theme-select.css';
import '../styles/admin.css';

interface AdminSettings {
  gameId: string; gameName: string; gameType: 'CRASH'; active: boolean;
  crashDistribution: 'INVERSE_RTP'; houseEdge: number; minCrashMultiplier: number;
  greenMaxMultiplier: number; redMaxMultiplier: number; multiplierGrowthRate: number;
  fps: number; delta: number;
  greenBoosterProbabilities: number[]; redBoosterProbabilities: number[];
  multiplierTier1Value: number; multiplierTier2Value: number;
  multiplierTier3Value: number; multiplierTier4Value: number;
  betTier1Amount: number; betTier2Amount: number; betTier3Amount: number; betTier4Amount: number;
  pointsPerLine: number; pointsCashoutBonus: number; pointsXnBonus: number;
  updatedAt: string;
}

type NumericSettingKey =
  | 'houseEdge' | 'minCrashMultiplier' | 'greenMaxMultiplier' | 'redMaxMultiplier'
  | 'multiplierGrowthRate' | 'fps' | 'multiplierTier1Value' | 'multiplierTier2Value'
  | 'multiplierTier3Value' | 'multiplierTier4Value' | 'pointsPerLine'
  | 'pointsCashoutBonus' | 'pointsXnBonus' | 'betTier1Amount' | 'betTier2Amount'
  | 'betTier3Amount' | 'betTier4Amount';

const defaults: AdminSettings = {
  gameId: 'air-balloon-v1', gameName: 'Воздушный шар', gameType: 'CRASH', active: true,
  crashDistribution: 'INVERSE_RTP', houseEdge: 0.03, minCrashMultiplier: 1,
  greenMaxMultiplier: 10, redMaxMultiplier: 25, multiplierGrowthRate: 0.12,
  fps: 10, delta: 0.1,
  greenBoosterProbabilities: Array(9).fill(1), redBoosterProbabilities: Array(12).fill(1),
  multiplierTier1Value: 1, multiplierTier2Value: 2, multiplierTier3Value: 3, multiplierTier4Value: 4,
  betTier1Amount: 100, betTier2Amount: 200, betTier3Amount: 300, betTier4Amount: 400,
  pointsPerLine: 10, pointsCashoutBonus: 20, pointsXnBonus: 20, updatedAt: '',
};

function Section({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return <section className="admin-section">
    <div className="admin-section-heading">
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
    <div className="admin-grid">{children}</div>
  </section>;
}

export function AdminPage() {
  const [settings, setSettings] = useState(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [portalReady, setPortalReady] = useState(false);

  useEffect(() => { void load(); }, []);
  useEffect(() => setPortalReady(true), []);

  async function load() {
    setLoading(true); setError('');
    try {
      const response = await authorizedFetch('/api/admin/settings');
      const body = await response.json().catch(() => ({})) as AdminSettings & { error?: string };
      if (!response.ok) throw new Error(body.error || 'Не удалось загрузить настройки');
      setSettings(body);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Не удалось загрузить настройки');
    } finally { setLoading(false); }
  }

  async function save(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError(''); setMessage('');
    try {
      const response = await authorizedFetch('/api/admin/settings', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings),
      });
      const body = await response.json().catch(() => ({})) as AdminSettings & { error?: string };
      if (!response.ok) throw new Error(body.error || 'Не удалось сохранить настройки');
      setSettings(body);
      window.dispatchEvent(new Event(GAME_CONFIG_UPDATED_EVENT));
      setMessage('Конфигурация сохранена и применяется сервером. Лимиты crash фиксируются для каждого нового раунда.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Не удалось сохранить настройки');
    } finally { setSaving(false); }
  }

  function set<K extends keyof AdminSettings>(key: K, value: AdminSettings[K]) {
    setSettings((current) => {
      const next = { ...current, [key]: value };
      if (key === 'fps') next.delta = 1 / Number(value);
      return next;
    });
  }

  function numberField(key: NumericSettingKey, title: string, hint: string, min: number, max: number, step: number) {
    return <label><span>{title}</span><small>{hint}</small><input type="number" min={min} max={max} step={step} required
      disabled={loading || saving} value={settings[key] as number}
      onChange={(event) => set(key, Number(event.target.value))} /></label>;
  }

  function probabilityFields(theme: 'green' | 'red', count: number) {
    const key = theme === 'green' ? 'greenBoosterProbabilities' : 'redBoosterProbabilities';
    return Array.from({ length: count }, (_, index) => <label className="admin-probability" key={`${theme}-${index}`}>
      <span>Линия {index + 1}</span><small>Вес 0–1</small><input type="number" min="0" max="1" step="0.01" required
        disabled={loading || saving} value={settings[key][index] ?? 0}
        onChange={(event) => {
          const values = [...settings[key]]; values[index] = Number(event.target.value); set(key, values);
        }} /></label>);
  }

  const backdrop = (
    <div
      className="theme-select-backdrop"
      aria-hidden="true"
      style={{ backgroundImage: `url(${landscapeUrl})` }}
    />
  );

  return <section className="admin-page" aria-label="Настройки администратора">
    {portalReady ? createPortal(backdrop, document.body) : backdrop}

    <div className="admin-page-inner">
      <div className="admin-heading"><p className="eyebrow">Управление игрой</p><h1>Конфигурация версии</h1>
        <p>Все значения хранятся в PostgreSQL, проверяются сервером и применяются без редактирования файлов.</p></div>

      <form className="admin-form" onSubmit={save}>
        <Section title="Базовые настройки" description="Идентификация версии и возможность остановить запуск новых раундов.">
          <label><span>game_id</span><small>Уникальный код версии, до 50 символов</small><input required maxLength={50} disabled={loading || saving}
            value={settings.gameId} onChange={(e) => set('gameId', e.target.value)} /></label>
          <label><span>game_name</span><small>Отображаемое название игры</small><input required maxLength={100} disabled={loading || saving}
            value={settings.gameName} onChange={(e) => set('gameName', e.target.value)} /></label>
          <label><span>game_type</span><small>Тип математической модели</small><input value={settings.gameType} disabled /></label>
          <label className="admin-switch"><span>Игра активна</span><small>При выключении новые раунды недоступны</small>
            <input type="checkbox" checked={settings.active} disabled={loading || saving} onChange={(e) => set('active', e.target.checked)} /></label>
        </Section>

        <Section title="Математическая модель" description="INVERSE_RTP: вероятность достижения x примерно равна (1 − houseEdge) / x.">
          <label><span>Распределение crash</span><small>Детерминированная inverse-RTP модель</small><input value={settings.crashDistribution} disabled /></label>
          {numberField('houseEdge', 'houseEdge (alpha)', 'Преимущество системы: 0–0.25', 0, 0.25, 0.001)}
          {numberField('minCrashMultiplier', 'Минимальный crash', 'Допустимо 1.00–2.00×', 1, 2, 0.01)}
          {numberField('greenMaxMultiplier', 'Максимум зелёного', '9-я линия соответствует этому коэффициенту', 1.01, 100, 0.01)}
          {numberField('redMaxMultiplier', 'Максимум красного', '12-я линия соответствует этому коэффициенту', 1.01, 100, 0.01)}
          {numberField('multiplierGrowthRate', 'Темп роста', 'Экспоненциальная скорость: 0.03–0.50', 0.03, 0.5, 0.01)}
          {numberField('fps', 'FPS сервера', 'Частота расчёта и отправки состояния: 1–60', 1, 60, 1)}
          <label><span>delta</span><small>Вычисляется автоматически: 1 / FPS</small><input value={settings.delta.toFixed(4)} disabled /></label>
        </Section>

        <Section title="Бустер — зелёная тема" description="Вес появления бустера на каждой из 9 линий. Нули запрещают соответствующие позиции.">
          {probabilityFields('green', 9)}
        </Section>

        <Section title="Бустер — красная тема" description="Вес появления бустера на каждой из 12 линий. Сервер нормализует заданные веса; бустер за точкой crash считается пропущенным.">
          {probabilityFields('red', 12)}
        </Section>

        <Section title="Множители бустеров" description="Значения xN для четырёх вариантов ставки, допустимо 1–10×.">
          {numberField('multiplierTier1Value', 'Tier 1', 'Первая ставка, обычно 1×', 1, 10, 0.01)}
          {numberField('multiplierTier2Value', 'Tier 2', 'Вторая ставка', 1, 10, 0.01)}
          {numberField('multiplierTier3Value', 'Tier 3', 'Третья ставка', 1, 10, 0.01)}
          {numberField('multiplierTier4Value', 'Tier 4', 'Четвёртая ставка', 1, 10, 0.01)}
        </Section>

        <Section title="Размеры ставок" description="Сумма, которая списывается с бонусного баланса для каждого tier.">
          {numberField('betTier1Amount', 'Ставка Tier 1', 'Начальное значение 100 бонусов', 1, 1000000, 0.01)}
          {numberField('betTier2Amount', 'Ставка Tier 2', 'Начальное значение 200 бонусов', 1, 1000000, 0.01)}
          {numberField('betTier3Amount', 'Ставка Tier 3', 'Начальное значение 300 бонусов', 1, 1000000, 0.01)}
          {numberField('betTier4Amount', 'Ставка Tier 4', 'Начальное значение 400 бонусов', 1, 1000000, 0.01)}
        </Section>

        <Section title="Начисление очков" description="Изменения видны в следующем раунде и позволяют экспертам проверить влияние конфигурации.">
          {numberField('pointsPerLine', 'Очки за линию', 'Начисляются при прохождении уровня', 0, 100000, 1)}
          {numberField('pointsCashoutBonus', 'Бонус за cashout', 'Разовое начисление при фиксации выигрыша', 0, 100000, 1)}
          {numberField('pointsXnBonus', 'Бонус xN', 'Умножается на значение активированного бустера', 0, 100000, 1)}
        </Section>

        <div className="admin-savebar">
          <div>{error && <p className="admin-message is-error" role="alert">{error}</p>}
            {message && <p className="admin-message is-success" role="status">{message}</p>}
            {settings.updatedAt && <small>Последнее сохранение: {new Date(settings.updatedAt).toLocaleString('ru-RU')}</small>}</div>
          <button className="button" type="submit" disabled={loading || saving}>{loading ? 'Загрузка…' : saving ? 'Сохраняем…' : 'Сохранить и применить'}</button>
        </div>
      </form>
    </div>
  </section>;
}
