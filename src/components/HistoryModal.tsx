import { useEffect, useState } from 'react';
import { gameApi } from '../api';
import type { HistoryItem } from '../types';
import { Modal } from './Modal';

const number = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 });
const coefficient = (value: number | null) => value === null ? '—' : `x${number.format(value)}`;

export function HistoryModal({ onClose }: { onClose: () => void }) {
  const [items, setItems] = useState<HistoryItem[] | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setError(false);
    gameApi.getHistory().then((history) => { if (!cancelled) setItems(history); })
      .catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, [attempt]);

  return (
    <Modal title="История полётов" subtitle="Ваши взлёты, смелые решения и удачные приземления." onClose={onClose} wide>
      {error ? <div role="alert" className="history-state"><p>Не удалось загрузить историю.</p><button className="button" onClick={() => setAttempt((value) => value + 1)}>Повторить</button></div>
        : items === null ? <p className="history-state" role="status">Загружаем бортовой журнал…</p>
        : items.length === 0 ? <p className="history-state">Полётов пока нет. Ваша история начинается с первой ставки.</p>
        : <div className="history-scroll" tabIndex={0} role="region" aria-label="Таблица истории игр, доступна горизонтальная прокрутка"><table className="history-table">
          <caption>Последние раунды · {items.length}</caption>
          <thead><tr>{['Тема', 'Ставка', 'Booster', 'Win / Lose', 'Cashout', 'Crash', 'Выигрыш', 'Очки'].map((title) => <th key={title} scope="col">{title}</th>)}</tr></thead>
          <tbody>{items.map((item) => <tr key={item.id}>
            <td><span className={`history-theme history-${item.round.theme.toLowerCase()}`}>◆ {item.round.theme}</span></td>
            <td>{number.format(item.round.bet.amount)} <small>б.</small></td>
            <td><span className="history-booster">{coefficient(item.booster)}</span></td>
            <td><span className={`history-outcome outcome-${item.result.outcome}`}>{item.result.outcome === 'win' ? 'Win' : 'Lose'}</span></td>
            <td>{coefficient(item.cashout)}</td><td>{coefficient(item.crash)}</td>
            <td className={item.result.payout > 0 ? 'history-payout' : ''}>{number.format(item.result.payout)} <small>б.</small></td>
            <td>{item.points === null ? '—' : number.format(item.points)}</td>
          </tr>)}</tbody>
        </table></div>}
      <p className="modal-note">Ваши завершённые раунды сохранены на этом устройстве. В конце списка — 6 примеров, не влияющих на баланс. Выигрыш включает ставку. «—» означает, что cashout не было.</p>
    </Modal>
  );
}
