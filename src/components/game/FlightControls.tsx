import type { Round } from '../../types';
import { money } from '../../api/flightEngine';
const number = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 });
const boosterLabels = { WAITING: 'Ждёт на маршруте', ACTIVATED: 'Активирован', MISSED: 'Пропущен' };

export function FlightControls({ round, pending, onCashout }: { round: Round; pending: boolean; onCashout: () => void }) {
  const crashed = round.status === 'crashed';
  const cashedOut = round.cashoutMultiplier !== null;
  const potential = money(round.bet.amount * money(round.multiplier));
  return <aside className="game-controls">
    <p className="eyebrow">{crashed ? 'Финальная высота' : 'Текущий коэффициент'}</p>
    <div className={`live-multiplier ${crashed ? 'multiplier-crashed' : ''}`}>{round.multiplier.toFixed(2)}<span>x</span></div>
    <p className="flight-motto">{cashedOut ? 'Ваш выигрыш уже в безопасности' : crashed ? 'Новая попытка — новая высота' : 'Ловите момент. Небо не ждёт.'}</p>
    <dl className="flight-stats">
      <div><dt>Ставка</dt><dd>{number.format(round.bet.amount)} <small>бонусов</small></dd></div>
      <div><dt>Потенциальный выигрыш</dt><dd>{number.format(potential)} <small>бонусов</small></dd></div>
      <div><dt>Очки за полёт</dt><dd className="points-value">{round.points} <small>очков</small></dd></div>
    </dl>
    <div className={`booster-status booster-${round.boosterState.toLowerCase()}`}>
      <strong>⚡ x{round.booster}</strong><div>{round.booster === 1 ? 'Без бустера' : boosterLabels[round.boosterState]}<small>{round.boosterLevel ? `Уровень ${round.boosterLevel} · +${20 * round.booster} очков` : 'Спокойный полёт'}</small></div>
    </div>
    {cashedOut && <div className="cashout-message" role="status"><strong>Вы забрали {number.format(round.payout)} бонусов</strong><span>Зафиксировано на {round.cashoutMultiplier?.toFixed(2)}x</span><p>Могли бы забрать больше</p><small>Шар продолжает полёт. Выигрыш больше не изменится.</small></div>}
    <button className="button cashout-button" onClick={onCashout} disabled={pending || crashed || cashedOut || round.reachedLevel < 1}>
      {pending ? 'Фиксируем…' : crashed ? 'Полёт завершён' : cashedOut ? 'Выигрыш зафиксирован ✓' : round.reachedLevel < 1 ? 'Ждём первый уровень' : 'Забрать'}
      {!cashedOut && !crashed && round.reachedLevel > 0 && <small>{number.format(potential)} бонусов</small>}
    </button>
    <p className="cashout-hint">{crashed ? 'Открываем итоги полёта…' : cashedOut ? 'Дождитесь crash, чтобы увидеть награду' : 'Заберите бонусы до того, как шар лопнет'}</p>
  </aside>;
}
