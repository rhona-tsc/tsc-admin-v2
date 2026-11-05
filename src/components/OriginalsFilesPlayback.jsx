import { OriginalsAiStatus } from './OriginalsAiDeclaration';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { EmbeddedReference } from './OriginalsProjectListening';
import OriginalsLayeredPlayer from './OriginalsLayeredPlayer';
import { originalProjectListening } from '../utils/originalsListening';
function FilePlayer({ token, asset }) {
  const [open, setOpen] = useState(false);
  return <details className="rounded-lg border p-3" onToggle={event => setOpen(event.currentTarget.open)}><summary className="cursor-pointer break-all text-sm font-medium">{asset.originalName} <OriginalsAiStatus asset={asset} /><span className="ml-2 text-xs font-normal text-gray-500">{asset.state === 'active' ? 'Play / preview' : 'Unavailable'}</span></summary>{open && asset.state === 'active' && <EmbeddedReference token={token} asset={asset} showDownload hideName />}</details>;
}
export default function OriginalsFilesPlayback({ token, assets = [], submissions = [], viewerId, canManage }) {
  const root = useRef(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const parent = root.current?.closest('details');
    const toggle = () => setOpen(parent ? parent.open : true);
    toggle(); parent?.addEventListener('toggle', toggle);
    return () => parent?.removeEventListener('toggle', toggle);
  }, []);
  const { tracks, selected } = useMemo(() => {
    const listening = originalProjectListening({ assets, submissions });
    const approved = [...listening.projectTracks, ...listening.references.filter(asset => asset.kind === 'initial_stem' || asset.listeningLabel === 'Listen to the approved stem')];
    const approvedMap = new Map(approved.map(track => [String(track._id), track]));
    const wet = new Set(submissions.flatMap(item => (item.takes || []).map(take => String(take.wetStemAssetId || ''))));
    const tracks = assets.filter(asset => asset.state === 'active' && ['take_stem','initial_stem'].includes(asset.kind) && (canManage || String(asset.ownerId) === String(viewerId) || approvedMap.has(String(asset._id)))).map(asset => ({ ...(approvedMap.get(String(asset._id)) || asset), label: asset.originalName }));
    return { tracks, selected: tracks.filter(track => !wet.has(String(track._id))).map(track => String(track._id)) };
  }, [assets, submissions, viewerId, canManage]);
  return <div ref={root}>{open && <div className="mt-4 space-y-3">
    {!!tracks.length && <section className="rounded-lg border p-3"><h3 className="font-semibold">Play stems together</h3><p className="mt-1 mb-3 text-xs text-gray-600">Tick the stems you want to include, then play them on one timeline. Listening mixes, guides and effects alternatives are not added automatically to the approved project mix.</p><OriginalsLayeredPlayer token={token} tracks={tracks} initialSelectedIds={selected} /></section>}
    {assets.length ? assets.map(asset => <FilePlayer key={asset._id} token={token} asset={asset} />) : <p className="rounded bg-gray-50 p-3 text-sm text-gray-600">No files uploaded yet.</p>}
  </div>}</div>;
}
