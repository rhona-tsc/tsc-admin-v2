import { OriginalsAiStatus } from './OriginalsAiDeclaration';
import { useState } from 'react';
import OriginalsLayeredPlayer from './OriginalsLayeredPlayer';
import OriginalsTrackDownloads from './OriginalsTrackDownloads';

function TakePreview({ token, take, index, assets, backgroundTracks }) {
  const [open, setOpen] = useState(false);
  const stem = assets.find(asset => String(asset._id) === String(take.stemAssetId));
  const mix = take.groupedContribution && assets.find(asset => String(asset._id) === String(take.mixdownAssetId) && asset.kind === 'take_mixdown' && asset.state === 'active');
  const ids = [...new Set([...(take.stemAssetIds?.length ? take.stemAssetIds : [take.stemAssetId]), take.wetStemAssetId].filter(Boolean).map(String))];
  const stems = ids.map(id => assets.find(asset => String(asset._id) === id && asset.state === 'active')).filter(Boolean);
  const playback = mix ? [{ ...mix, contributionMix: true, label: 'Contribution listening mix' }] : stems.filter(asset => String(asset._id) !== String(take.wetStemAssetId));
  return <details className="min-w-0 rounded border p-3" onToggle={event => setOpen(event.currentTarget.open)}>
    <summary className="cursor-pointer break-words text-sm font-semibold">Listen to option {index + 1} — {take.label || stem?.originalName || 'Submitted contribution'} {['with_effects', 'without_effects'].includes(take.effects) && <span className="ml-1 inline-block rounded bg-slate-100 px-2 py-1 text-xs font-normal text-slate-700">{take.effects === 'with_effects' ? 'With effects' : 'Without effects'}</span>} <OriginalsAiStatus asset={stem} /></summary>
    {open && <>{playback.length ? <><p className="mt-2 mb-3 text-xs text-gray-600">{mix ? 'The stereo mix represents this contribution for listening. Its separate tracks are grouped for approval and available below for production.' : 'This option plays with the approved project tracks. Other submitted alternatives are excluded.'}</p><OriginalsLayeredPlayer token={token} tracks={[...backgroundTracks.filter(asset => !ids.includes(String(asset._id)) && String(asset._id) !== String(mix?._id)), ...playback]} /><OriginalsTrackDownloads token={token} tracks={stems} /></> : <p className="mt-2 text-sm text-gray-500">This recording is unavailable.</p>}</>}
  </details>;
}

export default function OriginalsTakePreviews({ token, takes = [], assets = [], backgroundTracks = [] }) {
  if (!takes.length) return null;
  return <section className="mb-4 min-w-0 space-y-2" aria-label="Submitted recordings for review"><h3 className="text-sm font-semibold">Review each contribution or alternative</h3><p className="text-xs text-gray-600">Choose the contribution to approve below. All tracks in a grouped contribution are selected together; the stereo mix is used for listening.</p>{takes.map((take, index) => <TakePreview key={`${take._id || index}:${take.mixdownAssetId}`} token={token} take={take} index={index} assets={assets} backgroundTracks={backgroundTracks} />)}</section>;
}
