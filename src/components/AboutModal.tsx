import { useEffect, useRef } from 'react';
import '../styles/modal.css';

const ABOUT_TEXT =
  '«Воздушный шар» — демо-игра на удачу: выберите маршрут, сделайте ставку бонусами и поднимайтесь вверх, пока растёт коэффициент. Вовремя нажмите «Забрать», чтобы зафиксировать выигрыш до crash. Все бонусы и награды виртуальные.';

export function AboutModal({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);

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
      aria-label="О игре"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < rect.left
          || event.clientX > rect.right
          || event.clientY < rect.top
          || event.clientY > rect.bottom
        ) {
          onClose();
        }
      }}
    >
      <article className="rules-card about-card" aria-labelledby="about-title">
        <button
          type="button"
          className="rules-card-close"
          onClick={onClose}
          aria-label="Закрыть окно"
          autoFocus
        >
          ×
        </button>
        <h3 id="about-title">Что это?</h3>
        <p>{ABOUT_TEXT}</p>
      </article>
    </dialog>
  );
}
