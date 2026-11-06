import { useCallback, useEffect, useRef, useState } from 'react';
import OriginalsDialog from './OriginalsDialog';
import { originalsRequest } from '../utils/originalsApi';
import { makeOriginalRoughMix } from '../utils/originalsRoughMix';
import { loadOriginalAudio } from '../utils/originalsAudio';

export default function OriginalsStemReview({ token, assetId, confirmed = false, onClose, onConfirmed }) {
  const [preview, setPreview] = useState(null), [url, setUrl] = useState(''), [progress, setProgress] = useState('Preparing your listening preview…');
  const [error, setError] = useState(''), [attempt, setAttempt] = useState(0), [heard, setHeard] = useState(false), [checked, setChecked] = useState(false), [saving, setSaving] = useState(false);
  const audio = useRef(null);
  const alreadyConfirmed = confirmed || Boolean(preview?.stem.alignmentReview?.reviewedAt);
  const setAudio = useCallback(element => { if (!element) audio.current?.pause(); audio.current = element; }, []);
  useEffect(() => {
    const controller = new AbortController(); let objectUrl;
    document.querySelectorAll('audio, video').forEach(element => element.pause());
    setPreview(null); setUrl(''); setError(''); setHeard(false); setChecked(false); setProgress('Preparing your listening preview…');
    const prepare = async () => {
      try {
        const { data } = await originalsRequest(token, { method: 'get', url: `/assets/${assetId}/recording-preview`, signal: controller.signal });
        if (controller.signal.aborted) return;
        setPreview(data);
        const result = await makeOriginalRoughMix({ tracks: [...data.tracks, data.stem], loadAudio: (track, signal) => loadOriginalAudio(token, track, signal), signal: controller.signal, onProgress: setProgress });
        if (controller.signal.aborted) return;
        objectUrl = URL.createObjectURL(result.blob); setUrl(objectUrl); setProgress('');
      } catch (failure) { if (!controller.signal.aborted) setError(failure.response?.data?.message || failure.message || 'Could not prepare the preview.'); }
    };
    prepare();
    return () => { controller.abort(); if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [token, assetId, attempt]);
  const confirm = async () => {
    if (alreadyConfirmed || !heard || !checked || !preview || saving) return;
    setSaving(true); setError('');
    try {
      const { data } = await originalsRequest(token, { method: 'post', url: `/assets/${assetId}/alignment-review`, data: { reviewed: true, contextKey: preview.contextKey } });
      onConfirmed({ assetId, alignmentReview: data.alignmentReview });
    } catch (failure) { setError(failure.response?.data?.message || 'Could not save your confirmation. Please try again.'); }
    finally { setSaving(false); }
  };
  return <OriginalsDialog title={alreadyConfirmed ? 'Listen to your stem with the project' : 'Check your stem with the project'} onClose={onClose} busy={saving}>
    <p className="text-sm text-gray-600">Listen from the start and check your entry and later sections. Every file starts at the same zero point; silence before your part is kept. This is a listening check, not an automatic timing assessment.</p>
    {preview && <><h3 className="mt-4 break-words font-semibold">{preview.stem.originalName}</h3><p className="mt-2 text-sm text-gray-600">{preview.tracks.length ? 'Playing with the current project tracks:' : 'There are no earlier audio references yet. Check this foundation stem on its own against the agreed tempo and count-in.'}</p>{!!preview.tracks.length && <ul className="mt-2 list-disc pl-5 text-xs text-gray-600">{preview.tracks.map(track => <li key={track._id} className="break-words">{track.label || track.originalName}{track.playbackRanges ? ' — approved sections only' : ''}</li>)}</ul>}</>}
    {url ? <audio ref={setAudio} aria-label="Stem alignment preview" controls preload="metadata" src={url} onPlay={event => { const current = event.currentTarget; document.querySelectorAll('audio, video').forEach(element => { if (element !== current) element.pause(); }); }} onTimeUpdate={event => { const element = event.currentTarget; if (element.played.length && element.played.end(element.played.length - 1) >= Math.min(3, element.duration)) setHeard(true); }} onEnded={() => setHeard(true)} className="mt-4 w-full" /> : !error && <p role="status" className="mt-4 text-sm">{progress}</p>}
    {alreadyConfirmed ? <p role="status" className="mt-4 text-sm text-emerald-700">Alignment already checked for this file. You can listen again without confirming it a second time.</p>
      : <><label className="mt-4 flex items-start gap-2 text-sm"><input type="checkbox" disabled={!heard || saving} checked={checked} onChange={event => setChecked(event.target.checked)} className="mt-1" /><span>{preview?.tracks.length ? 'I’ve reviewed this stem with the project tracks, checked its start point and timing, and it fits with the other stems.' : 'I’ve listened to this stem and checked its start point, tempo and count-in.'}</span></label>
      {!heard && <p className="mt-2 text-xs text-gray-500">Play the preview before confirming. Listen through your entry and any sections where timing changes.</p>}</>}
    {error && <div role="alert" className="mt-3 text-sm text-red-700">{error}<button type="button" disabled={saving} onClick={() => setAttempt(value => value + 1)} className="ml-2 underline">Reload preview</button></div>}
    <div className="mt-5 flex flex-wrap gap-3">{!alreadyConfirmed && <button type="button" disabled={!heard || !checked || saving || !url} onClick={confirm} className="rounded bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">{saving ? 'Saving…' : 'Confirm alignment'}</button>}<button type="button" disabled={saving} onClick={onClose} className="rounded border px-4 py-2 text-sm">{alreadyConfirmed ? 'Close preview' : 'Keep file and review later'}</button></div>
    <p className="mt-3 text-xs text-gray-500">If it does not line up, re-export from the project’s zero/start point and upload the corrected file. The file stays in your uploads, visible to you and the owner. Uploading and confirming alignment do not submit it for review.</p>
  </OriginalsDialog>;
}
