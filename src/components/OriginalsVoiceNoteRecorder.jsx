import { useCallback, useEffect, useRef, useState } from 'react';
import { FiMic, FiPaperclip, FiRotateCcw, FiSquare, FiTrash2 } from 'react-icons/fi';
import { CHAT_MAX_BYTES, recordingExtension, recordingTime } from '../utils/originalsChat';

const stopTracks = stream => stream?.getTracks().forEach(track => track.stop());

export default function OriginalsVoiceNoteRecorder({ value, onChange, onRecordingChange, disabled = false }) {
  const [phase, setPhase] = useState('idle');
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const phaseRef = useRef('idle');
  const recorder = useRef(null);
  const stream = useRef(null);
  const generation = useRef(0);
  const mounted = useRef(false);
  const callbacks = useRef({ onChange, onRecordingChange });
  callbacks.current = { onChange, onRecordingChange };
  const preview = useRef(null);
  const fileInput = useRef(null);

  const updatePhase = useCallback(next => {
    phaseRef.current = next;
    setPhase(next);
    callbacks.current.onRecordingChange?.(next !== 'idle');
  }, []);
  const cancelRecording = useCallback(() => {
    generation.current++;
    if (recorder.current?.state === 'recording') recorder.current.stop();
    stopTracks(stream.current);
    recorder.current = null; stream.current = null;
    updatePhase('idle'); setSeconds(0);
  }, [updatePhase]);
  const stopRecording = useCallback(() => {
    if (recorder.current?.state !== 'recording') return;
    updatePhase('stopping');
    recorder.current.stop();
  }, [updatePhase]);

  useEffect(() => {
    mounted.current = true;
    const lifecycle = generation;
    return () => {
      mounted.current = false; lifecycle.current++;
      if (recorder.current?.state === 'recording') recorder.current.stop();
      stopTracks(stream.current);
    };
  }, []);
  useEffect(() => {
    if (disabled && phaseRef.current !== 'idle') cancelRecording();
  }, [disabled, cancelRecording]);
  useEffect(() => {
    const audio = preview.current;
    audio?.pause();
    if (!value) { setPreviewUrl(''); return; }
    const url = URL.createObjectURL(value);
    setPreviewUrl(url);
    return () => { audio?.pause(); URL.revokeObjectURL(url); };
  }, [value]);
  useEffect(() => {
    if (phase !== 'recording') return;
    const started = Date.now();
    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - started) / 1000);
      setSeconds(Math.min(elapsed, 300));
      if (elapsed >= 300) stopRecording();
    }, 250);
    return () => clearInterval(timer);
  }, [phase, stopRecording]);

  const startRecording = async () => {
    if (disabled || phaseRef.current !== 'idle') return;
    setError('');
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setError('Recording is unavailable in this browser. You can upload an existing voice note instead.');
      return;
    }
    const version = ++generation.current;
    updatePhase('starting');
    let input;
    try {
      input = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!mounted.current || generation.current !== version) { stopTracks(input); return; }
      stream.current = input;
      const mimeType = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg;codecs=opus'].find(type => window.MediaRecorder.isTypeSupported?.(type));
      const device = new window.MediaRecorder(input, mimeType ? { mimeType } : undefined);
      recorder.current = device;
      const chunks = [];
      let bytes = 0;
      device.ondataavailable = event => {
        if (event.data.size) { chunks.push(event.data); bytes += event.data.size; }
        if (bytes >= CHAT_MAX_BYTES && generation.current === version) stopRecording();
      };
      device.onerror = () => {
        stopTracks(input);
        if (!mounted.current || generation.current !== version) return;
        generation.current++;
        if (device.state === 'recording') device.stop();
        updatePhase('idle'); setError('Recording failed. Please try again.');
      };
      device.onstop = () => {
        stopTracks(input);
        if (!mounted.current || generation.current !== version) return;
        recorder.current = null; stream.current = null;
        const type = (device.mimeType || chunks[0]?.type || 'audio/webm').split(';')[0];
        const blob = new Blob(chunks, { type });
        if (!blob.size) setError('No audio was recorded. Please try again.');
        else if (blob.size > CHAT_MAX_BYTES) setError('The voice note is too large. Record a shorter note, up to 10 MB.');
        else callbacks.current.onChange(new File([blob], `Voice-note-${Date.now()}.${recordingExtension(type)}`, { type }));
        updatePhase('idle');
      };
      device.start(1000);
      callbacks.current.onChange(null);
      setSeconds(0); updatePhase('recording');
    } catch (failure) {
      stopTracks(input);
      if (!mounted.current || generation.current !== version) return;
      recorder.current = null; stream.current = null;
      updatePhase('idle');
      setError(failure.name === 'NotAllowedError'
        ? 'Microphone access was denied. Allow it in your browser, or upload an existing voice note.'
        : failure.name === 'NotFoundError' ? 'No microphone was found. Connect one, or upload an existing voice note.'
        : 'Could not start the microphone. Please check it and try again.');
    }
  };
  const attach = event => {
    const file = event.target.files?.[0]; event.target.value = '';
    if (!file || disabled || phaseRef.current !== 'idle') return;
    if (!file.type.startsWith('audio/')) { setError('Choose an audio file for your voice note.'); return; }
    if (!file.size || file.size > CHAT_MAX_BYTES) { setError('Choose a non-empty audio file, up to 10 MB.'); return; }
    setError(''); callbacks.current.onChange(file);
  };
  const deleteVoiceNote = () => { preview.current?.pause(); callbacks.current.onChange(null); setError(''); setSeconds(0); };
  const busy = phase !== 'idle';

  return <section aria-label="Optional voice note explaining the idea" className="min-w-0 rounded-lg border bg-slate-50 p-4">
    <h3 className="text-sm font-medium">Optional voice note explaining the idea</h3>
    <p className="mt-1 text-xs text-gray-600">Talk through your idea. Listen back before submitting, or delete it and record again.</p>
    {value && <div className="mt-3 min-w-0 rounded-lg border bg-white p-3">
      <p className="mb-2 text-sm font-medium">Voice note ready — listen before submitting</p>
      <audio ref={preview} aria-label="Voice note preview" src={previewUrl || undefined} controls preload="metadata" className="w-full max-w-sm" />
      <div className="mt-3 flex flex-wrap gap-3">
        <button type="button" disabled={disabled || busy} onClick={deleteVoiceNote} className="inline-flex items-center gap-2 rounded border px-3 py-2 text-sm text-red-700 disabled:opacity-40"><FiTrash2 aria-hidden="true" />Delete voice note</button>
        <button type="button" disabled={disabled || busy} onClick={startRecording} className="inline-flex items-center gap-2 rounded border px-3 py-2 text-sm disabled:opacity-40"><FiRotateCcw aria-hidden="true" />Record again</button>
      </div>
    </div>}
    {busy && <div className="mt-3 flex flex-wrap items-center gap-3 rounded-lg bg-red-50 p-3 text-sm">
      <span role="status" className="text-red-700">{phase === 'starting' ? 'Waiting for microphone…' : phase === 'stopping' ? 'Preparing voice note…' : `● Recording ${recordingTime(seconds)}`}</span>
      {phase === 'recording' && <button type="button" onClick={stopRecording} className="inline-flex items-center gap-2 rounded border bg-white px-3 py-2"><FiSquare aria-hidden="true" />Stop recording</button>}
      <button type="button" onClick={cancelRecording} className="inline-flex items-center gap-2 text-red-700 underline"><FiTrash2 aria-hidden="true" />Delete / cancel</button>
    </div>}
    {!busy && <div className="mt-3 flex flex-wrap gap-2">
      {!value && <button type="button" disabled={disabled} onClick={startRecording} className="inline-flex items-center gap-2 rounded-lg bg-black px-3 py-2 text-sm font-semibold text-white disabled:opacity-40"><FiMic aria-hidden="true" />Record voice note</button>}
      <button type="button" disabled={disabled} onClick={() => fileInput.current.click()} className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm disabled:opacity-40"><FiPaperclip aria-hidden="true" />{value ? 'Replace with an audio file' : 'Upload an existing voice note'}</button>
    </div>}
    <input ref={fileInput} type="file" accept="audio/*,.m4a,.aac,.mp3,.wav,.ogg,.webm" aria-label="Upload an existing voice note" disabled={disabled || busy} onChange={attach} className="hidden" />
    {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
    <p className="mt-3 text-xs text-gray-500">Record up to 5 minutes · Maximum 10 MB · Added when you submit the project.</p>
  </section>;
}
