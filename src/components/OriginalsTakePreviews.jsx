import { OriginalsAiStatus } from './OriginalsAiDeclaration';
import { useState } from 'react';
import { EmbeddedReference } from './OriginalsProjectListening';

function TakePreview({ token, take, index, assets }) {
  const [open, setOpen] = useState(false);
  const stem = assets.find(asset => String(asset._id) === String(take.stemAssetId));
  const mix = assets.find(asset => String(asset._id) === String(take.mixdownAssetId) && asset.state === 'active');
  const stems = (take.stemAssetIds?.length ? take.stemAssetIds : [take.stemAssetId]).map(id => assets.find(asset => String(asset._id) === String(id) && asset.state === 'active')).filter(Boolean);
  const additionalStems = [...new Set([...(take.stemAssetIds || []), take.wetStemAssetId].filter(Boolean))]
    .map(id => assets.find(asset => String(asset._id) === String(id)))
    .filter(asset => asset && String(asset._id) !== String(stem?._id));
  return <details className="min-w-0 rounded border p-3" onToggle={event => setOpen(event.currentTarget.open)}>
    <summary className="cursor-pointer break-words text-sm font-semibold">Listen to option {index + 1} — {take.label || stem?.originalName || 'Submitted take'} <OriginalsAiStatus asset={stem} /></summary>
    {open && <>{additionalStems.map(asset => <p key={asset._id} className="mt-2 break-words text-xs">{asset.originalName} <OriginalsAiStatus asset={asset} /></p>)}<p className="mt-2 break-words text-xs text-gray-600">{take.stemAssetIds?.length > 1 ? 'Stems' : 'Stem'}: {(take.stemAssetIds?.length ? take.stemAssetIds : [take.stemAssetId]).map(id => assets.find(asset => String(asset._id) === String(id))?.originalName || 'Unavailable recording').join(', ')}</p>{mix ? <EmbeddedReference token={token} asset={{ ...mix, listeningLabel: `Listening mix for option ${index + 1}` }} /> : !take.mixdownAssetId && stems.length ? <><p className="mt-2 text-xs text-gray-600">Foundation option — listen to the submitted stem directly.</p>{stems.map(asset => <EmbeddedReference key={asset._id} token={token} asset={asset} />)}</> : <p className="mt-2 text-sm text-gray-500">This listening mix is unavailable.</p>}</>}
  </details>;
}

export default function OriginalsTakePreviews({ token, takes = [], assets = [] }) {
  if (!takes.length) return null;
  return <section className="mb-4 min-w-0 space-y-2" aria-label="Submitted recordings for review"><h3 className="text-sm font-semibold">Review each option</h3><p className="text-xs text-gray-600">Listen to each matching mix, or the stem itself for a foundation option, then choose the take to approve below. The separate stem is used in the project mix.</p>{takes.map((take, index) => <TakePreview key={`${take._id || index}:${take.mixdownAssetId}`} token={token} take={take} index={index} assets={assets} />)}</section>;
}
