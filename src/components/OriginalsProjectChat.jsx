import React, { useCallback, useEffect, useRef, useState } from 'react';
import OriginalsChat from './OriginalsChat';
import { originalsRequest } from '../utils/originalsApi';

export default function OriginalsProjectChat({ token, projectId, viewerId, initialMessages = [], readOnly = false, onAccessLost }) {
  const [open, setOpen] = useState(false);
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
  return <details id="project-chat" tabIndex={-1} onToggle={event => setOpen(event.currentTarget.open)} className="scroll-mt-6 mt-4 rounded-xl border bg-white p-4">
    <summary className="cursor-pointer font-semibold">Project chat{!readOnly && unreadCount > 0 && <span role="status" aria-label={`${unreadCount} unread message${unreadCount === 1 ? '' : 's'}`} className="ml-2 inline-flex rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">{unreadCount > 99 ? '99+' : unreadCount} unread</span>}</summary>
    {!readOnly && statusError && <p role="status" className="mt-2 text-xs text-amber-800">{statusError}</p>}
    {open && <OriginalsChat token={token} projectId={projectId} viewerId={viewerId} initialMessages={initialMessages} readOnly={readOnly} onAccessLost={onAccessLost} onMessagesViewed={viewed} />}
  </details>;
}
