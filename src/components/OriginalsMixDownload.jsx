import { useEffect, useRef, useState } from 'react';
import { loadOriginalAudio } from '../utils/originalsAudio';
import { makeOriginalRoughMix, originalDownloadTracks, originalRoughMixName } from '../utils/originalsRoughMix';
export default function OriginalsMixDownload({ token, tracks, mix, duration = 0, title = 'Project' }) {
  const selectedTracks = originalDownloadTracks(tracks, mix);
  const controller = useRef(null), objectUrl = useRef('');
  const [busy, setBusy] = useState(false), [progress, setProgress] = useState(''), [error, setError] = useState('');
  const trackKey = tracks.map(track => String(track._id)).join(':');
  useEffect(() => { setBusy(false); setProgress(''); setError(''); return () => { controller.current?.abort(); if (objectUrl.current) URL.revokeObjectURL(objectUrl.current); }; }, [token, trackKey]);
  const download = async () => {
    controller.current?.abort(); const request = new AbortController(); controller.current = request;
    setBusy(true); setError('');
    try {
      const result = await makeOriginalRoughMix({ tracks: selectedTracks, minDuration: duration, loadAudio: (track, signal) => loadOriginalAudio(token, track, signal), signal: request.signal, onProgress: setProgress });
      if (request.signal.aborted) return;
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
      objectUrl.current = URL.createObjectURL(result.blob);
      const link = document.createElement('a'); link.href = objectUrl.current; link.download = originalRoughMixName(title); document.body.append(link); link.click(); link.remove();
      setProgress(result.peakAdjusted ? 'Downloaded. Overall level reduced to prevent clipping.' : 'Rough mix downloaded.');
    } catch (failure) { if (!request.signal.aborted) setError(failure instanceof RangeError ? 'This mix is too large for this browser. Try fewer stems or a desktop browser.' : failure.message || 'Could not make this rough mix. Please try again.'); }
    finally { if (!request.signal.aborted) setBusy(false); }
  };
  return <div className="mt-4 border-t border-gray-700 pt-3 text-xs"><button type="button" disabled={busy || !selectedTracks.length} onClick={download} className="rounded bg-white px-3 py-2 font-semibold text-black disabled:opacity-40">{busy ? 'Preparing rough mix…' : 'Download selected mix (WAV)'}</button>{busy && <button type="button" onClick={() => { controller.current?.abort(); setBusy(false); setProgress(''); }} className="ml-3 underline">Cancel</button>}<p className="mt-2 text-gray-300">Merged recording reference, using your included stems, Solo and volume settings. Starts at zero; keep that start point when recording. Originals stay intact. Up to 10 minutes.</p>{progress && <p role="status" className="mt-2 text-gray-300">{progress}</p>}{error && <p role="alert" className="mt-2 text-red-300">{error}</p>}</div>;
}
