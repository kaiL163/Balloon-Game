import { BoosterChest } from './BoosterChest';
import { CashoutOnboarding } from './CashoutOnboarding';
import type { Round } from '../../types';
import { money } from '../../api/flightEngine';
const number = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 });
const boosterLabels = { WAITING: 'Сундук на маршруте', ACTIVATED: 'Сундук открыт', MISSED: 'Сундук пропущен' };

export function FlightControls({ round, pending, onCashout }: { round: Round; pending: boolean; onCashout: () => void }) {
  const crashed = round.status === 'crashed';
  const cashedOut = round.cashoutMultiplier !== null;
  const payoutBoost = round.boosterState === 'ACTIVATED' ? round.booster : 1;
  const potential = money(round.bet.amount * money(round.multiplier * payoutBoost));
  return <aside className="game-controls">
    <p className="eyebrow">{crashed ? 'Финальная высота' : 'Текущий коэффициент'}</p>
    <div className={`live-multiplier multiplier-level-${Math.min(3, round.reachedLevel)}`}>{round.multiplier.toFixed(2)}<span>x</span></div>
    <p className="flight-motto">{cashedOut ? 'Ваш выигрыш уже в безопасности' : crashed ? 'Новая попытка — новая высота' : 'Ловите момент. Небо не ждёт.'}</p>
    <dl className="flight-stats">
      <div><dt>Ставка</dt><dd>{number.format(round.bet.amount)} <small>бонусов</small></dd></div>
      <div><dt>Потенциальный выигрыш</dt><dd>{number.format(potential)} <small>бонусов</small></dd></div>
      <div><dt>Очки за полёт</dt><dd className="points-value">{round.points} <small>очков</small></dd></div>
    </dl>
    <div className={`booster-status booster-${round.boosterState.toLowerCase()}`}>
      <BoosterChest state={round.boosterState} multiplier={round.booster} /><div>{round.booster === 1 ? 'Без бустера' : boosterLabels[round.boosterState]}<small>{round.boosterState === 'ACTIVATED' ? `Выплата ×${round.booster} · +${20 * round.booster} очков` : round.boosterLevel ? `Сундук на уровне ${round.boosterLevel}` : 'В этом раунде множителя нет'}</small></div>
    </div>
    {cashedOut && <div className="cashout-message" role="status"><strong>Вы забрали {number.format(round.payout)} бонусов</strong><span>Зафиксировано на {round.cashoutMultiplier?.toFixed(2)}x</span><small>Ускоряем полёт до финала. Ваш выигрыш не изменится.</small></div>}
    <div className="cashout-action">
    <CashoutOnboarding key={round.id} active={round.status === 'active' && !cashedOut} />
    <button
      className={[
        'button cashout-button',
        cashedOut ? 'is-cashed-out' : '',
        !cashedOut && !crashed && !pending && round.reachedLevel < 1 ? 'is-waiting-level' : '',
      ].filter(Boolean).join(' ')}
      onClick={onCashout}
      disabled={pending || crashed || cashedOut || round.reachedLevel < 1}
    >
      {pending ? 'Фиксируем…' : crashed ? 'Полёт завершён' : cashedOut ? 'Выигрыш зафиксирован' : round.reachedLevel < 1 ? 'Ждём первый уровень' : 'Забрать'}
      {!cashedOut && !crashed && round.reachedLevel > 0 && <small>{number.format(potential)} бонусов</small>}
    </button>
    </div>
    <p className="cashout-hint">{crashed ? 'Открываем итоги полёта…' : cashedOut ? 'Скоро финал — выигрыш уже ваш'  : 'Заберите бонусы до того, как шар лопнет'}</p>
  </aside>;
}
