import { useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';
import '../styles/modal.css';

interface ModalProps {
  title: string;
  subtitle: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}

export function Modal({ title, subtitle, onClose, children, wide = false }: ModalProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const subtitleId = useId();

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
    <dialog ref={dialog} className={`game-modal${wide ? ' game-modal-wide' : ''}`}
      aria-labelledby={titleId} aria-describedby={subtitleId}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose();
      }}>
      <header className="modal-header">
        <div><p className="eyebrow">Бортовой журнал</p><h2 id={titleId}>{title}</h2><p id={subtitleId}>{subtitle}</p></div>
        <button className="modal-close" onClick={onClose} aria-label="Закрыть окно" autoFocus>×</button>
      </header>
      <div className="modal-content">{children}</div>
    </dialog>
  );
}
