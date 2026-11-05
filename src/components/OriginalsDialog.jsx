import { useEffect, useId, useRef } from 'react';

export default function OriginalsDialog({ title, children, onClose, busy = false }) {
  const dialog = useRef(null);
  const titleId = useId();
  useEffect(() => {
    const element = dialog.current;
    const returnFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    element.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      element.close();
      document.body.style.overflow = previousOverflow;
      if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
    };
  }, []);
  return <dialog ref={dialog} aria-labelledby={titleId} onCancel={event => { event.preventDefault(); if (!busy) onClose(); }} onClick={event => {
    if (busy || event.target !== event.currentTarget) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
  }} className="m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-4xl overflow-y-auto overscroll-contain rounded-xl border bg-white p-0 text-slate-800 shadow-xl backdrop:bg-black/60">
    <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b bg-white p-5">
      <h2 id={titleId} className="text-lg font-semibold">{title}</h2>
      <button type="button" disabled={busy} onClick={onClose} aria-label={`Close ${title}`} className="shrink-0 rounded border px-3 py-1 text-sm disabled:opacity-40">Close</button>
    </div>
    <div className="p-5">{children}</div>
  </dialog>;
}
