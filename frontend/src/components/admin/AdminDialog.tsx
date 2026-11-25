import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../ui/Icon';

type Props = {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
};

export function AdminDialog({ open, title, children, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    if (!open) return;
    const element = dialog.current;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    element?.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      element?.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [open]);

  if (!open) return null;
  return createPortal(<dialog ref={dialog} aria-labelledby={titleId} onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => {
    if (event.target !== event.currentTarget) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
  }} className="admin-dialog m-auto max-h-[calc(100dvh-1.5rem)] w-[calc(100%-1.5rem)] max-w-xl overflow-y-auto rounded-3xl border border-surface-border bg-surface-container-lowest p-0 text-on-surface shadow-modal backdrop:bg-slate-950/35 backdrop:backdrop-blur-sm">
    <section className="p-5 sm:p-6">
      <div className="-mt-5 -mx-5 mb-5 flex items-center justify-between gap-4 border-b border-surface-container bg-surface-container-lowest px-5 py-4 sm:-mt-6 sm:-mx-6 sm:px-6">
        <h3 id={titleId} className="text-headline-md">{title}</h3>
        <button type="button" onClick={onClose} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface" aria-label="Đóng cửa sổ"><Icon name="close" className="text-[22px]" /></button>
      </div>
      {children}
    </section>
  </dialog>, document.body);
}
