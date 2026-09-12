import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { gameApi } from '../api';
import type { HistoryItem } from '../types';
import '../styles/modal.css';

const PAGE_SIZE = 10;
const number = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 });
const coefficient = (value: number | null) => value === null ? '—' : `x${number.format(value)}`;

const HISTORY_NOTE =
  'Ваши завершённые раунды сохранены в профиле. Выигрыш включает ставку. «—» означает, что cashout не было.';

function CloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button type="button" className="rules-card-close" onClick={onClose} aria-label="Закрыть окно" autoFocus>×</button>
  );
}

function AttemptRow({ item, ordinal }: { item: HistoryItem; ordinal: number }) {
  return (
    <li className="history-row">
      <span className="history-row-num" aria-hidden="true">{String(ordinal).padStart(2, '0')}</span>
      <span className={`history-theme history-${item.round.theme.toLowerCase()}`}>◆ {item.round.theme}</span>
      <span className="history-row-bet">{number.format(item.round.bet.amount)} <small>б.</small></span>
      <span className="history-booster">{coefficient(item.booster)}</span>
      <span className={`history-outcome outcome-${item.result.outcome}`}>
        {item.result.outcome === 'win' ? 'Win' : 'Lose'}
      </span>
      <span className="history-row-coef" title="Cashout">{coefficient(item.cashout)}</span>
      <span className="history-row-coef" title="Crash">{coefficient(item.crash)}</span>
      <span className={item.result.payout > 0 ? 'history-payout' : undefined}>
        {number.format(item.result.payout)} <small>б.</small>
      </span>
      <span className="history-row-points">{item.points === null ? '—' : number.format(item.points)}</span>
    </li>
  );
}

function HistoryPage({
  items,
  page,
  pageCount,
  onClose,
}: {
  items: HistoryItem[];
  page: number;
  pageCount: number;
  onClose: () => void;
}) {
  const start = page * PAGE_SIZE;
  const pageItems = items.slice(start, start + PAGE_SIZE);

  return (
    <article
      className="rules-card history-card"
      aria-label={`История попыток, страница ${page + 1} из ${pageCount}`}
    >
      <CloseButton onClose={onClose} />
      <span className="rule-number">{String(page + 1).padStart(2, '0')}</span>
      <h3>История попыток</h3>
      <p className="history-page-meta">Последние раунды · {items.length}</p>
      <ul className="history-list" aria-label="Список попыток">
        <li className="history-row history-row-head" aria-hidden="true">
          <span>#</span>
          <span>Тема</span>
          <span>Ставка</span>
          <span>Booster</span>
          <span>Итог</span>
          <span>Cashout</span>
          <span>Crash</span>
          <span>Выигрыш</span>
          <span>Очки</span>
        </li>
        {pageItems.map((item, offset) => (
          <AttemptRow key={item.id} item={item} ordinal={start + offset + 1} />
        ))}
      </ul>
      <p className="history-note">{HISTORY_NOTE}</p>
      <p className="rules-position" aria-hidden="true">{page + 1} / {pageCount}</p>
    </article>
  );
}

export function HistoryModal({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [items, setItems] = useState<HistoryItem[] | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [page, setPage] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setError(false);
    gameApi.getHistory().then((history) => {
      if (!cancelled) {
        setItems(history);
        setPage(0);
      }
    }).catch(() => {
      if (!cancelled) setError(true);
    });
    return () => { cancelled = true; };
  }, [attempt]);

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

  const total = items?.length ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const atStart = page <= 0;
  const atEnd = page >= pageCount - 1;
  const showNav = !error && items !== null && total > PAGE_SIZE;

  let body: ReactNode;
  if (error) {
    body = (
      <article className="rules-card history-card" role="alert">
        <CloseButton onClose={onClose} />
        <h3>История попыток</h3>
        <p>Не удалось загрузить историю.</p>
        <button type="button" className="button history-retry" onClick={() => setAttempt((value) => value + 1)}>Повторить</button>
        <p className="history-note">{HISTORY_NOTE}</p>
      </article>
    );
  } else if (items === null) {
    body = (
      <article className="rules-card history-card" role="status">
        <CloseButton onClose={onClose} />
        <h3>История попыток</h3>
        <p>Загружаем бортовой журнал…</p>
      </article>
    );
  } else if (items.length === 0) {
    body = (
      <article className="rules-card history-card">
        <CloseButton onClose={onClose} />
        <h3>История попыток</h3>
        <p>Полётов пока нет. Ваша история начинается с первой ставки.</p>
        <p className="history-note">{HISTORY_NOTE}</p>
      </article>
    );
  } else {
    body = <HistoryPage key={page} items={items} page={page} pageCount={pageCount} onClose={onClose} />;
  }

  return (
    <dialog
      ref={dialog}
      className="rules-dialog history-dialog"
      aria-label="История попыток"
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
          onClick={() => setPage((value) => Math.max(0, value - 1))}
          disabled={!showNav || atStart}
          aria-label="Предыдущая страница"
        >
          <span aria-hidden="true">‹</span>
        </button>

        {body}

        <button
          type="button"
          className="rules-nav rules-nav-next"
          onClick={() => setPage((value) => Math.min(pageCount - 1, value + 1))}
          disabled={!showNav || atEnd}
          aria-label="Следующая страница"
        >
          <span aria-hidden="true">›</span>
        </button>
      </div>
    </dialog>
  );
}
