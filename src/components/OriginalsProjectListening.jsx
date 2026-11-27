import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { originalsRequest } from '../utils/originalsApi';
import { originalProjectListening } from '../utils/originalsListening';
import OriginalsLayeredPlayer from './OriginalsLayeredPlayer';
import OriginalsSectionLink from './OriginalsSectionLink';
import OriginalsSubmittedBy from './OriginalsSubmittedBy';
import OriginalsDialog from './OriginalsDialog';
import OriginalsTrackDownloads from './OriginalsTrackDownloads';

export function EmbeddedReference({ token, asset, showDownload = false, hideName = false }) {
  const mediaRef = useRef(null);
  const setMediaRef = useCallback(element => {
    if (!element) mediaRef.current?.pause();
    mediaRef.current = element;
  }, []);
  const [url, setUrl] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setUrl(''); setDownloadUrl(''); setError('');
    originalsRequest(token, { method: 'get', url: `/assets/${asset._id}/access` })
      .then(({ data }) => {
        if (!data.url) throw new Error('The audio link is unavailable.');
        if (!cancelled) { setUrl(data.url); setDownloadUrl(data.downloadUrl || data.url); }
      })
      .catch(() => { if (!cancelled) setError('Could not load this file. Please try again.'); });
    return () => { cancelled = true; };
  }, [asset._id, token, attempt]);
  const video = asset.kind === 'video_submission' || asset.mimeType?.startsWith('video/');
  return <div className="mt-3 space-y-2">
    {!hideName && <p className="break-words text-xs text-gray-500">{asset.originalName}</p>}
    <OriginalsSubmittedBy credit={asset.submittedBy} />
    {error ? <div role="alert" className="text-sm text-red-700">{error}<button type="button" onClick={() => setAttempt(value => value + 1)} className="ml-2 underline">Try again</button></div>
      : url ? video
        ? <video ref={setMediaRef} aria-label={asset.listeningLabel || asset.originalName} controls playsInline preload="metadata" src={url} onError={() => setError('This video could not be played. Reload its secure link and try again.')} className="max-h-96 w-full rounded-lg bg-black" />
        : asset.mimeType?.startsWith("image/") ? <img src={url} alt={asset.originalName} className="max-h-72 max-w-full rounded object-contain" /> : asset.mimeType && !asset.mimeType.startsWith("audio/") ? <p className="text-sm">This file is ready to download below.</p> : <audio ref={setMediaRef} aria-label={asset.listeningLabel || asset.originalName} controls preload="metadata" src={url} onError={() => setError('This audio could not be played. Reload its secure link and try again.')} className="w-full" />
        : <p role="status" className="text-sm text-gray-500">Preparing secure playback…</p>}
    {showDownload && downloadUrl && <a href={downloadUrl} download={asset.originalName} target="_blank" rel="noopener noreferrer" className="inline-block text-sm underline">Download original file</a>}
  </div>;
}

function ListeningPanel({ title, children }) {
  const [open, setOpen] = useState(false);
  return <details className="mt-4 rounded-xl border bg-white p-4" onToggle={event => setOpen(event.currentTarget.open)}>
    <summary className="cursor-pointer font-semibold">{title}</summary>
    {open ? children : null}
  </details>;
}

export default memo(function OriginalsProjectListening({ token, assets, submissions, title, canManage = false, onGuideRemoved }) {
  const [removing, setRemoving] = useState(null);
  const [busy, setBusy] = useState(false);
  const [removeError, setRemoveError] = useState('');
  const removeGuide = async () => {
    setBusy(true); setRemoveError('');
    try {
      await originalsRequest(token, { method: 'delete', url: `/assets/${removing._id}/guide` });
      onGuideRemoved?.(removing._id);
      setRemoving(null);
    } catch (error) { setRemoveError(error.response?.data?.message || 'Could not remove the guide. Please try again.'); }
    finally { setBusy(false); }
  };
  const { references, projectTracks } = useMemo(() => originalProjectListening({ assets, submissions }), [assets, submissions]);
  const productionTracks = useMemo(() => originalProjectListening({ assets, submissions, useListeningMixes: false }).projectTracks, [assets, submissions]);
  return <>
    <h2 className="text-sm font-bold uppercase tracking-wide text-slate-800">{projectTracks.some(track => track.kind === 'temporary_stem') ? 'Listen & download the working stems' : projectTracks.length ? 'Listen & download the approved stems' : 'Guidance for the project'}</h2>
    <p className="mt-1 text-sm text-gray-600">Listen to the guide or sample and any approved stems before recording.</p>
    {canManage && assets.filter(asset => asset.state === 'active' && asset.kind === 'temporary_stem' && !asset.reservationId).map(asset => <div key={asset._id} className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded border p-3"><span className="break-words text-sm">{asset.originalName} <span className="text-gray-500">(temporary starting stem)</span></span><button type="button" onClick={() => { setRemoving(asset); setRemoveError(''); }} className="text-sm text-red-700 underline">Remove guide / temporary stem</button></div>)}
    {!references.length && !projectTracks.length && <p className="mt-3 text-sm text-gray-500">No guide, sample or approved recording uploaded yet. Read the <OriginalsSectionLink to="project-brief">brief</OriginalsSectionLink> and check the <OriginalsSectionLink to="project-chat">project chat</OriginalsSectionLink> before you start.</p>}
    {references.map(asset => <ListeningPanel key={asset._id} title={asset.listeningLabel}>
      <p className="mt-2 break-words text-sm text-gray-600">{asset.originalName}</p>
      {asset.kind !== 'click_track' && <p className="mt-2 text-xs text-amber-800">Reference only — excluded from mix downloads and the final production.</p>}
      {asset.playbackRanges || asset.mimeType?.startsWith('audio/') ? <OriginalsLayeredPlayer token={token} tracks={[asset]} title={title} allowMixDownload={asset.kind === 'click_track'} /> : <EmbeddedReference token={token} asset={asset} showDownload />}
      {canManage && !asset.reservationId && ['guide_track', 'demo', 'voice_note', 'video_submission'].includes(asset.kind) && <button type="button" onClick={() => { setRemoving(asset); setRemoveError(''); }} className="mt-3 text-sm text-red-700 underline">Remove guide</button>}
    </ListeningPanel>)}
    {removing && <OriginalsDialog title="Remove guide recording?" busy={busy} onClose={() => setRemoving(null)}>
      <p className="break-words font-semibold">{removing.originalName}</p>
      {removing.kind === 'temporary_stem' && <p className="mt-3 text-sm text-amber-800">This temporary stem will also be removed from future working mixes and recording downloads.</p>}
      <p className="mt-3 text-sm">This guide will no longer be available in the project or through guide listening links. Other guides and contributor recordings will stay available. The stored file is retained for administrator recovery.</p>
      {removeError && <p role="alert" className="mt-3 text-sm text-red-700">{removeError}</p>}
      <div className="mt-5 flex gap-3"><button type="button" disabled={busy} onClick={removeGuide} className="rounded bg-red-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">{busy ? 'Removing…' : 'Remove guide'}</button><button type="button" disabled={busy} onClick={() => setRemoving(null)} className="rounded border px-4 py-2 text-sm">Cancel</button></div>
    </OriginalsDialog>}
    {projectTracks.some(track => track.kind === 'temporary_stem') && <p className="mt-2 text-sm text-amber-800">Temporary stems are included for recording. Approve replacement recordings for their roles before moving to the final mix.</p>}
    {projectTracks.length > 0 && <div className="mt-4" aria-label="Approved stems">
      <p className="my-3 text-sm text-gray-600">Adjust the volume of each stem to your preference for your recording, then download the selected stems together as one WAV track. Keep its start point at zero in your recording software.</p>
      <OriginalsLayeredPlayer token={token} tracks={[...projectTracks, ...references.filter(asset => asset.kind === "click_track")]} initialSelectedIds={projectTracks.map(track => String(track._id))} title={title} />
      <OriginalsTrackDownloads token={token} tracks={productionTracks} />
    </div>}
  </>;
});
