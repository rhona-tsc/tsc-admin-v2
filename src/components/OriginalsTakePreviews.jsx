import { OriginalsAiStatus } from './OriginalsAiDeclaration';
import { useState } from 'react';
import { EmbeddedReference } from './OriginalsProjectListening';
import OriginalsLayeredPlayer from './OriginalsLayeredPlayer';

function TakePreview({ token, take, index, assets, backgroundTracks }) {
  const [open, setOpen] = useState(false);
  const stem = assets.find(asset => String(asset._id) === String(take.stemAssetId));
  const mix = assets.find(asset => String(asset._id) === String(take.mixdownAssetId) && asset.state === 'active');
  const stems = (take.stemAssetIds?.length ? take.stemAssetIds : [take.stemAssetId]).map(id => assets.find(asset => String(asset._id) === String(id) && asset.state === 'active')).filter(Boolean);
  const additionalStems = [...new Set([...(take.stemAssetIds || []), take.wetStemAssetId].filter(Boolean))]
    .map(id => assets.find(asset => String(asset._id) === String(id)))
    .filter(asset => asset && String(asset._id) !== String(stem?._id));
  return <details className="min-w-0 rounded border p-3" onToggle={event => setOpen(event.currentTarget.open)}>
    <summary className="cursor-pointer break-words text-sm font-semibold">Listen to option {index + 1} — {take.label || stem?.originalName || 'Submitted take'} {['with_effects', 'without_effects'].includes(take.effects) && <span className="ml-1 inline-block rounded bg-slate-100 px-2 py-1 text-xs font-normal text-slate-700">{take.effects === 'with_effects' ? 'With effects' : 'Without effects'}</span>} <OriginalsAiStatus asset={stem} /></summary>
    {open && <>{additionalStems.map(asset => <p key={asset._id} className="mt-2 break-words text-xs">{asset.originalName} <OriginalsAiStatus asset={asset} /></p>)}<p className="mt-2 break-words text-xs text-gray-600">{take.stemAssetIds?.length > 1 ? 'Stems' : 'Stem'}: {(take.stemAssetIds?.length ? take.stemAssetIds : [take.stemAssetId]).map(id => assets.find(asset => String(asset._id) === String(id))?.originalName || 'Unavailable recording').join(', ')}</p>{stems.length ? <><p className="mt-2 mb-3 text-xs text-gray-600">This option plays with the approved project stems on the same timeline. Other submitted alternatives are excluded.</p><OriginalsLayeredPlayer token={token} tracks={[...backgroundTracks.filter(asset => !stems.some(stem => String(stem._id) === String(asset._id))), ...stems]} />{mix && <details className="mt-3"><summary className="cursor-pointer text-xs">Optional uploaded listening mix</summary><EmbeddedReference token={token} asset={mix} /></details>}</> : <p className="mt-2 text-sm text-gray-500">This stem is unavailable.</p>}</>}
  </details>;
}

export default function OriginalsTakePreviews({ token, takes = [], assets = [], backgroundTracks = [] }) {
  if (!takes.length) return null;
  return <section className="mb-4 min-w-0 space-y-2" aria-label="Submitted recordings for review"><h3 className="text-sm font-semibold">Review each option</h3><p className="text-xs text-gray-600">Listen to each option with the project stems, then choose the take to approve below. The separate stem is used in the project mix.</p>{takes.map((take, index) => <TakePreview key={`${take._id || index}:${take.mixdownAssetId}`} token={token} take={take} index={index} assets={assets} backgroundTracks={backgroundTracks} />)}</section>;
}
