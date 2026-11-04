import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { originalsRequest } from '../utils/originalsApi';
import { originalProjectListening } from '../utils/originalsListening';
import OriginalsLayeredPlayer from './OriginalsLayeredPlayer';

function EmbeddedReference({ token, asset }) {
  const mediaRef = useRef(null);
  const setMediaRef = useCallback(element => {
    if (!element) mediaRef.current?.pause();
    mediaRef.current = element;
  }, []);
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let cancelled = false;
    setUrl(''); setError('');
    originalsRequest(token, { method: 'get', url: `/assets/${asset._id}/access` })
      .then(({ data }) => {
        if (!data.url) throw new Error('The audio link is unavailable.');
        if (!cancelled) setUrl(data.url);
      })
      .catch(() => { if (!cancelled) setError('Could not load this file. Please try again.'); });
    return () => { cancelled = true; };
  }, [asset._id, token, attempt]);
  const video = asset.kind === 'video_submission' || asset.mimeType?.startsWith('video/');
  return <div className="mt-3 space-y-2">
    <p className="break-words text-xs text-gray-500">{asset.originalName}</p>
    {error ? <div role="alert" className="text-sm text-red-700">{error}<button type="button" onClick={() => setAttempt(value => value + 1)} className="ml-2 underline">Try again</button></div>
      : url ? video
        ? <video ref={setMediaRef} aria-label={asset.listeningLabel} controls playsInline preload="metadata" src={url} onError={() => setError('This video could not be played. Reload its secure link and try again.')} className="max-h-96 w-full rounded-lg bg-black" />
        : <audio ref={setMediaRef} aria-label={asset.listeningLabel} controls preload="metadata" src={url} onError={() => setError('This audio could not be played. Reload its secure link and try again.')} className="w-full" />
        : <p role="status" className="text-sm text-gray-500">Preparing secure playback…</p>}
  </div>;
}

function ListeningPanel({ title, children }) {
  const [open, setOpen] = useState(false);
  return <details className="mt-4 rounded-xl border bg-white p-4" onToggle={event => setOpen(event.currentTarget.open)}>
    <summary className="cursor-pointer font-semibold">{title}</summary>
    {open ? children : null}
  </details>;
}

export default memo(function OriginalsProjectListening({ token, assets, submissions }) {
  const { references, projectTracks } = useMemo(() => originalProjectListening({ assets, submissions }), [assets, submissions]);
  return <>
    {!references.length && !projectTracks.length && <p className="mt-3 text-sm text-gray-500">No guide, sample or approved recording uploaded yet. Read the brief and check the project chat before you start.</p>}
    {references.map(asset => <ListeningPanel key={asset._id} title={asset.listeningLabel}>{asset.playbackRanges ? <OriginalsLayeredPlayer token={token} tracks={[asset]} autoLoad /> : <EmbeddedReference token={token} asset={asset} />}</ListeningPanel>)}
    {projectTracks.length > 1 && <ListeningPanel title="Listen to the project">
      <p className="my-3 text-sm text-gray-600">Approved stems, played together. Guides, samples and click tracks are separate references.</p>
      <OriginalsLayeredPlayer token={token} tracks={projectTracks} autoLoad />
    </ListeningPanel>}
  </>;
});
