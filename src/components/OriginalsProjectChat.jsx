import React, { useCallback, useEffect, useRef, useState } from 'react';
import OriginalsChat from './OriginalsChat';
import { originalsRequest } from '../utils/originalsApi';

export default function OriginalsProjectChat({ token, projectId, viewerId, initialMessages = [], readOnly = false, onAccessLost, blocked = false }) {
  const [open, setOpen] = useState(true);
  const [recording, setRecording] = useState('idle');
  const [unreadCount, setUnreadCount] = useState(0);
  const [statusError, setStatusError] = useState('');
  const sequence = useRef(0);
  const readsPending = useRef(0);
  const mounted = useRef(false);
  useEffect(() => { const lifecycle = sequence; mounted.current = true; return () => { mounted.current = false; lifecycle.current++; }; }, []);
  const accessFailure = useCallback(failure => {
    if (failure.response?.status === 403 || failure.response?.data?.code === 'ORIGINALS_PARTICIPATION_ENDED') onAccessLost?.(failure.response?.data?.message || 'Project access has ended.');
  }, [onAccessLost]);
  useEffect(() => {
    if (readOnly) return;
    const controller = new AbortController();
    const lifecycle = sequence;
    let pending = false;
    const refresh = async () => {
      if (document.hidden || pending || readsPending.current) return;
      pending = true;
      const version = ++sequence.current;
      try {
        const { data } = await originalsRequest(token, { method: 'get', url: `/projects/${projectId}/messages/unread`, signal: controller.signal });
        if (!Number.isSafeInteger(data.unreadCount) || data.unreadCount < 0) throw new Error('Unread count unavailable');
        if (!controller.signal.aborted && sequence.current === version) { setUnreadCount(data.unreadCount); setStatusError(''); }
      } catch (failure) {
        if (!controller.signal.aborted && sequence.current === version) { accessFailure(failure); setStatusError('Unread status is unavailable. Retrying…'); }
      } finally { pending = false; }
    };
    refresh();
    const timer = setInterval(refresh, 5000);
    document.addEventListener('visibilitychange', refresh);
    window.addEventListener('focus', refresh);
    return () => { clearInterval(timer); controller.abort(); lifecycle.current++; document.removeEventListener('visibilitychange', refresh); window.removeEventListener('focus', refresh); };
  }, [token, projectId, readOnly, accessFailure]);
  const viewed = useCallback(async messageId => {
    if (readOnly) return false;
    const version = ++sequence.current;
    readsPending.current++;
    try {
      const { data } = await originalsRequest(token, { method: 'post', url: `/projects/${projectId}/messages/read`, data: { messageId } });
      if (!data.success || !Number.isSafeInteger(data.unreadCount) || data.unreadCount < 0) throw new Error('Read position unavailable');
      if (mounted.current && sequence.current === version) { setUnreadCount(data.unreadCount); setStatusError(''); }
      return true;
    } catch (failure) {
      if (mounted.current && sequence.current === version) { accessFailure(failure); setStatusError('Could not save your read position. Retrying…'); }
      return false;
    } finally { readsPending.current--; }
  }, [token, projectId, readOnly, accessFailure]);
  useEffect(() => {
    const reveal = () => { setOpen(true); requestAnimationFrame(() => document.querySelector('#project-chat textarea')?.focus({ preventScroll: true })); };
    window.addEventListener('originals:open-chat', reveal);
    return () => window.removeEventListener('originals:open-chat', reveal);
  }, []);
  return <aside aria-label="Project chat widget" id="project-chat" tabIndex={-1} className="fixed bottom-3 right-3 z-40 w-[calc(100vw-1.5rem)] max-w-md overflow-hidden rounded-xl border border-slate-300 bg-white shadow-2xl">
    <button type="button" aria-expanded={open} aria-controls="project-chat-body" onClick={() => setOpen(value => !value)} className="flex w-full items-center justify-between gap-3 bg-slate-900 px-4 py-3 text-left text-sm font-bold uppercase tracking-wide text-white"><span>Project chat{recording !== 'idle' && <span className="ml-2 text-xs normal-case text-red-300">● {recording === 'recording' ? 'Recording' : 'Microphone…'}</span>}{!readOnly && unreadCount > 0 && <span role="status" aria-label={`${unreadCount} unread message${unreadCount === 1 ? '' : 's'}`} className="ml-2 inline-flex rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">{unreadCount > 99 ? '99+' : unreadCount} unread</span>}</span><span className="text-xs normal-case font-normal">{open ? 'Minimise −' : 'Open +'}</span></button>
    <div id="project-chat-body" hidden={!open}>
      {!readOnly && statusError && <p role="status" className="px-4 py-2 text-xs text-amber-800">{statusError}</p>}
      <OriginalsChat token={token} projectId={projectId} viewerId={viewerId} initialMessages={initialMessages} readOnly={readOnly} active={open && !blocked} widget onRecordingChange={setRecording} onAccessLost={onAccessLost} onMessagesViewed={viewed} />
    </div>
  </aside>;
}
