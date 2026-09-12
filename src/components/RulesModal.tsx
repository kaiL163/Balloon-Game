import { useEffect, useRef, useState } from 'react';
import '../styles/modal.css';

const rules: { title?: string; description: string }[] = [
  { title: 'Ставка — билет в полёт', description: 'Выберите одну ставку в бонусах. Она спишется при нажатии «Начать». GREEN — 9 уровней, RED — 12.' },
  { title: 'Коэффициент растёт', description: 'По мере подъёма шара коэффициент увеличивается. Чем он выше, тем больше потенциальный выигрыш.' },
  { title: 'Cashout — забрать вовремя', description: 'Зафиксируйте коэффициент до crash, чтобы забрать выигрыш: ставка × коэффициент cashout.' },
  { title: 'Crash — конец полёта', description: 'Если шар лопнет раньше cashout, ставка сгорает и выигрыш равен нулю. Момент crash заранее неизвестен.' },
  { title: 'Booster — усилитель', description: 'Бустер зависит от ставки: 100 бонусов — без бустера, 150 — ×2, 250 — ×3, 400 — ×4. При ×2–×4 сундук заранее размещается на случайном уровне. Достигните его до cashout: коэффициент полёта продолжит плавно расти, а бустер умножит выплату и добавит очки. При раннем cashout сундук будет пропущен.' },
  { title: 'Очки и награда', description: 'Каждый пройденный уровень приносит 10 очков — они учитываются отдельно от бонусного баланса. После любого раунда вы получаете случайную награду: Balloon, Cloud, Bird или Trophy. Она не меняет баланс.' },
  { description: '«Забрать» доступно после первого уровня. После cashout выигрыш фиксируется, а шар ускоряется до краша. Очки за пройденные уровни продолжают начисляться. После взрыва открываются итоги. Все бонусы и награды виртуальные.' },
];

export function RulesModal({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState(0);
  const total = rules.length;
  const rule = rules[index];
  const atStart = index === 0;
  const atEnd = index === total - 1;

  useEffect(() => {
    const element = dialog.current;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    element?.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      element?.close();
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, []);

  return (
    <dialog
      ref={dialog}
      className="rules-dialog"
      aria-label="Правила игры"
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose();
      }}
    >
      <div className="rules-carousel" aria-live="polite">
        <button
          type="button"
          className="rules-nav rules-nav-prev"
          onClick={() => setIndex((value) => Math.max(0, value - 1))}
          disabled={atStart}
          aria-label="Предыдущее правило"
        >
          <span aria-hidden="true">‹</span>
        </button>

        <article
          key={index}
          className="rules-card"
          aria-label={rule.title ? `${rule.title}. ${index + 1} из ${total}` : `Правило ${index + 1} из ${total}`}
        >
          <button type="button" className="rules-card-close" onClick={onClose} aria-label="Закрыть окно" autoFocus>×</button>
          <span className="rule-number">{String(index + 1).padStart(2, '0')}</span>
          {rule.title ? <h3>{rule.title}</h3> : null}
          <p>{rule.description}</p>
          <p className="rules-position" aria-hidden="true">{index + 1} / {total}</p>
        </article>

        <button
          type="button"
          className="rules-nav rules-nav-next"
          onClick={() => setIndex((value) => Math.min(total - 1, value + 1))}
          disabled={atEnd}
          aria-label="Следующее правило"
        >
          <span aria-hidden="true">›</span>
        </button>
      </div>
    </dialog>
  );
}
