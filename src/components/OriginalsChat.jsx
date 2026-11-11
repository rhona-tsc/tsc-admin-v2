import React, { useCallback, useEffect, useRef, useState } from 'react';
import { originalsRequest } from '../utils/originalsApi';
import { CHAT_ACCEPT, chatFileError, recordingExtension, recordingTime } from '../utils/originalsChat';
import OriginalsEmojiPicker from './OriginalsEmojiPicker';

function ChatAttachment({ token, asset, voice = false }) {
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const media = useRef(null);
  const setMedia = useCallback(node => {
    if (media.current && media.current !== node) media.current.pause();
    media.current = node;
  }, []);
  const load = async () => {
    try {
      setBusy(true); setError('');
      const response = await originalsRequest(token, { method: 'get', url: `/assets/${asset._id}/access` });
      setUrl(response.data.url);
    } catch { setError('Could not open this file. Try again.'); } finally { setBusy(false); }
  };
  if (asset.state && asset.state !== 'active') return <p className="text-sm text-gray-500">Attachment unavailable</p>;
  return <div className="mt-2 min-w-0 text-sm">
    {!url ? <button type="button" disabled={busy} onClick={load} className="break-all text-left font-medium underline">{busy ? 'Opening…' : voice ? '▶ Play voice note' : `📎 ${asset.originalName || 'Attachment'}`}</button> : <>
      {voice || asset.mimeType?.startsWith('audio/') ? <audio ref={setMedia} controls preload="metadata" src={url} className="w-full max-w-xs" onError={() => { setUrl(''); setError('Playback link expired or unavailable. Open it again.'); }} /> : asset.mimeType?.startsWith('video/') ? <video ref={setMedia} controls preload="metadata" src={url} className="max-h-64 w-full rounded" /> : asset.mimeType?.startsWith('image/') ? <img src={url} alt={asset.originalName || 'Chat attachment'} className="max-h-64 max-w-full rounded object-contain" /> : null}
      <a href={url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block break-all underline">{voice ? 'Download voice note' : asset.originalName || 'Open attachment'}</a>
    </>}
    {error && <p role="alert" className="mt-1 text-red-700">{error}</p>}
  </div>;
}

export default function OriginalsChat({ token, projectId, viewerId, initialMessages = [], readOnly = false, onAccessLost, onMessagesViewed, active = true, widget = false, onRecordingChange }) {
  const [messages, setMessages] = useState(initialMessages);
  const [body, setBody] = useState('');
  const [files, setFiles] = useState([]);
  const [voice, setVoice] = useState(null);
  const [voiceUrl, setVoiceUrl] = useState('');
  const [recording, setRecording] = useState('idle');
  const [seconds, setSeconds] = useState(0);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [refreshError, setRefreshError] = useState('');
  const [progress, setProgress] = useState('');
  const recorder = useRef(null);
  const stream = useRef(null);
  const generation = useRef(0);
  const discarded = useRef(false);
  const mounted = useRef(true);
  const clientId = useRef(null);
  const uploadIds = useRef(new Map());
  const sendingRef = useRef(false);
  const fileInput = useRef(null);
  const messageInput = useRef(null);
  const previewAudio = useRef(null);
  const setPreviewAudio = useCallback(node => {
    if (previewAudio.current && previewAudio.current !== node) previewAudio.current.pause();
    previewAudio.current = node;
  }, []);
  const list = useRef(null);
  const stickToBottom = useRef(true);
  const endOfMessages = useRef(null);
  const latestMessage = useRef(messages.at(-1));
  latestMessage.current = messages.at(-1);
  const reportedRead = useRef('');
  const pendingReads = useRef(new Set());
  useEffect(() => { onRecordingChange?.(recording); }, [recording, onRecordingChange]);
  const reportViewed = useCallback(() => {
    const messageId = latestMessage.current?._id;
    if (!active || !messageId || !onMessagesViewed || readOnly || document.querySelector('dialog[open]') || document.hidden || !document.hasFocus() || reportedRead.current === messageId || pendingReads.current.has(messageId)) return;
    const end = endOfMessages.current, log = list.current;
    if (!end || !log || !log.clientHeight) return;
    const marker = end.getBoundingClientRect(), box = log.getBoundingClientRect();
    // Both the scrolling message list and the browser viewport must expose the
    // latest rendered message. A collapsed/off-screen chat is not a read receipt.
    if (marker.top < Math.max(0, box.top) || marker.bottom > Math.min(window.innerHeight, box.bottom) || marker.right <= 0 || marker.left >= window.innerWidth) return;
    pendingReads.current.add(messageId);
    Promise.resolve(onMessagesViewed(String(messageId)))
      .then(saved => { if (saved && mounted.current && latestMessage.current?._id === messageId) reportedRead.current = messageId; })
      .catch(() => {})
      .finally(() => pendingReads.current.delete(messageId));
  }, [onMessagesViewed, readOnly, active]);


  useEffect(() => {
    mounted.current = true;
    const lifecycle = generation;
    return () => {
      mounted.current = false; lifecycle.current++; discarded.current = true;
      if (recorder.current?.state === 'recording') recorder.current.stop();
      stream.current?.getTracks().forEach(track => track.stop());
    };
  }, []);
  useEffect(() => {
    if (!readOnly) return;
    generation.current++; discarded.current = true;
    if (recorder.current?.state === 'recording') recorder.current.stop();
    stream.current?.getTracks().forEach(track => track.stop());
    setRecording('idle');
  }, [readOnly]);
  useEffect(() => {
    if (!voice) { setVoiceUrl(''); return; }
    const url = URL.createObjectURL(voice); setVoiceUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [voice]);
  const refresh = useCallback(async (signal) => {
    const response = await originalsRequest(token, { method: 'get', url: `/projects/${projectId}/messages`, signal });
    if (mounted.current && !signal?.aborted) { setMessages(response.data.messages || []); setRefreshError(''); }
  }, [token, projectId]);
  useEffect(() => {
    const controller = new AbortController();
    let active = false;
    const update = async () => {
      if (document.hidden || active) return;
      active = true;
      try { await refresh(controller.signal); }
      catch (failure) { if (failure.response?.status === 403 || failure.response?.data?.code === "ORIGINALS_PARTICIPATION_ENDED") onAccessLost?.(failure.response.data.message); if (!controller.signal.aborted) setRefreshError('Chat could not refresh. Your draft is safe.'); }
      finally { active = false; }
    };
    update();
    const timer = setInterval(update, 5000);
    document.addEventListener('visibilitychange', update);
    return () => { clearInterval(timer); controller.abort(); document.removeEventListener('visibilitychange', update); };
  }, [refresh, onAccessLost]);
  useEffect(() => { if (active && stickToBottom.current && list.current) list.current.scrollTop = list.current.scrollHeight; }, [messages, active]);
  useEffect(() => {
    const observer = typeof IntersectionObserver === 'function' ? new IntersectionObserver(reportViewed, { threshold: 1 }) : null;
    if (endOfMessages.current) observer?.observe(endOfMessages.current);
    const frame = requestAnimationFrame(reportViewed);
    window.addEventListener('scroll', reportViewed, true);
    window.addEventListener('resize', reportViewed);
    window.addEventListener('focus', reportViewed);
    document.addEventListener('visibilitychange', reportViewed);
    document.addEventListener('focusin', reportViewed);
    return () => { observer?.disconnect(); cancelAnimationFrame(frame); window.removeEventListener('scroll', reportViewed, true); window.removeEventListener('resize', reportViewed); window.removeEventListener('focus', reportViewed); document.removeEventListener('visibilitychange', reportViewed); document.removeEventListener('focusin', reportViewed); };
  }, [reportViewed, messages]);

  const cancelRecording = () => {
    generation.current++; discarded.current = true;
    if (recorder.current?.state === 'recording') recorder.current.stop();
    stream.current?.getTracks().forEach(track => track.stop());
    setRecording('idle'); setSeconds(0);
  };
  const stopRecording = () => {
    if (recorder.current?.state === 'recording') { setRecording('stopping'); recorder.current.stop(); }
  };
  useEffect(() => {
    if (recording !== 'recording') return;
    const started = Date.now();
    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - started) / 1000); setSeconds(elapsed);
      if (elapsed >= 300) stopRecording();
    }, 250);
    return () => clearInterval(timer);
  }, [recording]);
  const startRecording = async () => {
    setError('');
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) { setError('Voice recording is unavailable in this browser. You can attach an audio file instead.'); return; }
    const version = ++generation.current; setRecording('starting');
    let input;
    try {
      input = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!mounted.current || generation.current !== version) { input.getTracks().forEach(track => track.stop()); return; }
      stream.current = input;
      const mimeType = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg;codecs=opus'].find(type => MediaRecorder.isTypeSupported(type));
      const device = new MediaRecorder(input, mimeType ? { mimeType } : undefined);
      recorder.current = device; discarded.current = false;
      const chunks = [];
      device.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
      device.onerror = () => { discarded.current = true; if (mounted.current && generation.current === version) { setError('Recording failed. Please try again.'); setRecording('idle'); } input.getTracks().forEach(track => track.stop()); };
      device.onstop = () => {
        input.getTracks().forEach(track => track.stop());
        if (!mounted.current || generation.current !== version) return;
        setRecording('idle');
        if (discarded.current) return;
        const type = (device.mimeType || chunks[0]?.type || 'audio/webm').split(';')[0];
        const blob = new Blob(chunks, { type });
        if (!blob.size) { setError('No audio was recorded. Please try again.'); return; }
        setVoice(new File([blob], `Voice-note-${Date.now()}.${recordingExtension(type)}`, { type }));
        clientId.current = null;
      };
      device.start(1000); setSeconds(0); setRecording('recording');
    } catch (failure) {
      input?.getTracks().forEach(track => track.stop());
      if (mounted.current && generation.current === version) { setRecording('idle'); setError(failure.name === 'NotAllowedError' ? 'Microphone access was denied. Allow it in your browser, or attach an audio file.' : 'Could not start the microphone. Please check it and try again.'); }
    }
  };
  const attach = event => {
    const added = Array.from(event.target.files || []); event.target.value = '';
    const problem = chatFileError(added, files.length);
    if (problem) { setError(problem); return; }
    setFiles(current => [...current, ...added]); setError(''); clientId.current = null;
  };
  const insertEmoji = emoji => {
    if (readOnly || sendingRef.current) return;
    const input = messageInput.current;
    const start = input?.selectionStart ?? body.length;
    const end = input?.selectionEnd ?? start;
    const next = body.slice(0, start) + emoji + body.slice(end);
    if (next.length > 3000) { setError('Messages can contain up to 3,000 characters. Remove some text to add an emoji.'); input?.focus(); return; }
    setBody(next); clientId.current = null; setError('');
    requestAnimationFrame(() => {
      input?.focus(); input?.setSelectionRange(start + emoji.length, start + emoji.length);
    });
  };
  const send = async () => {
    if (readOnly || sendingRef.current || recording !== 'idle' || (!body.trim() && !files.length && !voice)) return;
    sendingRef.current = true; setSending(true); setError('');
    clientId.current ||= crypto.randomUUID();
    const upload = async (file, kind) => {
      if (uploadIds.current.has(file)) return uploadIds.current.get(file);
      const form = new FormData(); form.append('file', file); form.append('kind', kind);
      setProgress(`Uploading ${file.name}…`);
      const response = await originalsRequest(token, { method: 'post', url: `/projects/${projectId}/assets`, data: form });
      uploadIds.current.set(file, response.data.asset._id);
      return response.data.asset._id;
    };
    try {
      const attachmentIds = [];
      for (const file of files) attachmentIds.push(await upload(file, 'chat_attachment'));
      const voiceAssetId = voice ? await upload(voice, 'voice_note') : null;
      setProgress('Sending…');
      const response = await originalsRequest(token, { method: 'post', url: `/projects/${projectId}/messages`, data: { body: body.trim(), attachmentIds, voiceAssetId, clientMessageId: clientId.current } });
      if (!mounted.current) return;
      const sent = { ...response.data.message, attachmentIds: files.map((file, index) => ({ _id: attachmentIds[index], originalName: file.name, mimeType: file.type, state: 'active' })) };
      setMessages(current => current.some(item => item._id === sent._id) ? current : [...current, sent]);
      setBody(''); setFiles([]); setVoice(null); uploadIds.current.clear(); clientId.current = null; stickToBottom.current = true;
      refresh().catch(() => { if (mounted.current) setRefreshError('Message sent. Chat refresh will retry automatically.'); });
    } catch (failure) { if (failure.response?.status === 403 || failure.response?.data?.code === "ORIGINALS_PARTICIPATION_ENDED") onAccessLost?.(failure.response.data.message); if (mounted.current) setError(failure.response?.data?.message || 'Could not send. Your message is saved here; press Send to retry.'); }
    finally { sendingRef.current = false; if (mounted.current) { setSending(false); setProgress(''); } }
  };
  return <section aria-label="Project group chat" className={widget ? "flex h-[min(65dvh,600px)] min-h-0 flex-col overflow-hidden bg-white" : "mt-4 overflow-hidden rounded-xl border bg-white"}>
    {!widget && <div className="border-b px-4 py-3"><h2 className="font-semibold">Project group chat</h2><p className="mt-1 text-xs text-gray-500">Messages and attachments are shared with people who can access this project. Updates every five seconds.</p></div>}
    <div ref={list} role="log" aria-label="Chat messages" aria-live="polite" onScroll={() => { const node = list.current; stickToBottom.current = node.scrollHeight - node.scrollTop - node.clientHeight < 80; }} className={`${widget ? "min-h-24 flex-1" : "h-80"} space-y-3 overflow-y-auto bg-slate-50 p-3 sm:p-4`}>
      {!messages.length && <p className="py-8 text-center text-sm text-gray-500">No messages yet. Start the conversation.</p>}
      {messages.map(message => {
        if (['stem_submitted', 'stem_approved'].includes(message.messageType)) return <div key={message._id} className="flex justify-center"><article className={`min-w-0 max-w-[95%] rounded-lg border px-4 py-3 text-center text-sm ${message.messageType === 'stem_approved' ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-sky-200 bg-sky-50 text-sky-900'}`}>
          <p className="text-xs font-semibold">{message.messageType === 'stem_approved' ? '✓ ' : ''}Project update</p>
          <p className="mt-1 whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{message.body}</p>
          {message.createdAt && <time dateTime={message.createdAt} className="mt-2 block text-[10px] opacity-75">{new Date(message.createdAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</time>}
        </article></div>;
        const own = String(message.authorId) === String(viewerId);
        return <div key={message._id} className={`flex ${own ? 'justify-end' : 'justify-start'}`}><article className={`min-w-0 max-w-[90%] rounded-xl border p-3 text-sm shadow-sm ${own ? 'border-emerald-100 bg-emerald-50' : 'bg-white'}`}>
          <p className="text-xs font-semibold text-gray-600">{message.authorCreditName || (message.authorAnonymous ? 'Anonymous' : 'Project participant')}</p>
          {message.body && <p className="mt-1 whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{message.body}</p>}
          {message.voiceAssetId && <ChatAttachment token={token} asset={{ _id: message.voiceAssetId }} voice />}
          {(message.attachmentIds || []).map(asset => <ChatAttachment key={asset._id || asset} token={token} asset={typeof asset === 'string' ? { _id: asset } : asset} />)}
          {message.createdAt && <time dateTime={message.createdAt} className="mt-2 block text-right text-[10px] text-gray-500">{new Date(message.createdAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</time>}
        </article></div>;
      })}
      <div ref={endOfMessages} className="h-px" aria-hidden="true" />
    </div>
    {refreshError && <p role="status" className="px-4 py-2 text-xs text-amber-800">{refreshError}</p>}
    {readOnly ? <p className="p-4 text-sm text-gray-600">Participant preview is read-only. Return to owner view to send messages.</p> : <div className="max-h-[40dvh] shrink-0 space-y-3 overflow-y-auto border-t p-3 sm:p-4">
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {!!files.length && <ul className="space-y-2">{files.map((file, index) => <li key={index} className="flex items-center justify-between gap-2 rounded border p-2 text-xs"><span className="min-w-0 break-all">📎 {file.name}</span><button type="button" disabled={sending} aria-label={`Remove ${file.name}`} onClick={() => { setFiles(current => current.filter((_, i) => i !== index)); uploadIds.current.delete(file); clientId.current = null; }} className="shrink-0 underline">Remove</button></li>)}</ul>}
      {voice && <div className="rounded border bg-slate-50 p-3"><p className="mb-2 text-sm font-medium">Voice note ready — listen before sending</p><audio ref={setPreviewAudio} src={voiceUrl} controls className="w-full max-w-sm" /><button type="button" disabled={sending} onClick={() => { uploadIds.current.delete(voice); setVoice(null); clientId.current = null; }} className="mt-2 text-sm text-red-700 underline">Delete recording</button></div>}
      {recording !== 'idle' && <div className="flex flex-wrap items-center gap-3 rounded bg-red-50 p-3 text-sm"><span role="status" className="text-red-700">{recording === 'starting' ? 'Waiting for microphone…' : recording === 'stopping' ? 'Preparing voice note…' : `● Recording ${recordingTime(seconds)}`}</span>{recording === 'recording' && <button type="button" onClick={stopRecording} className="rounded border bg-white px-3 py-2">Stop recording</button>}<button type="button" onClick={cancelRecording} className="text-red-700 underline">Delete / cancel</button></div>}
      <textarea ref={messageInput} aria-label="Message" placeholder="Message the group…" maxLength={3000} rows={2} value={body} disabled={sending} onChange={event => { setBody(event.target.value); clientId.current = null; }} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); send(); } }} className="block w-full resize-y rounded-lg border p-3 text-sm disabled:bg-gray-50" />
      <OriginalsEmojiPicker onSelect={insertEmoji} disabled={sending}><input ref={fileInput} type="file" multiple accept={CHAT_ACCEPT} onChange={attach} className="hidden" /><button type="button" disabled={sending || recording !== 'idle'} onClick={() => fileInput.current.click()} className="rounded-lg border px-3 py-2 text-sm disabled:opacity-40">📎 Attach</button><button type="button" disabled={sending || recording !== 'idle' || !!voice} onClick={startRecording} className="rounded-lg border px-3 py-2 text-sm disabled:opacity-40">● Record</button><button type="button" disabled={sending || recording !== 'idle' || (!body.trim() && !voice && !files.length)} onClick={send} className="ml-auto rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">{sending ? 'Sending…' : 'Send'}</button></OriginalsEmojiPicker>
      <p className="text-xs text-gray-500">{progress || 'Up to 5 attachments · 10 MB each · Voice notes up to 5 minutes'}</p>
    </div>}
  </section>;
}
