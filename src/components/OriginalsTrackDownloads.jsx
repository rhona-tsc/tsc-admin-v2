import { EmbeddedReference } from './OriginalsProjectListening';
import { useState } from 'react';
import { OriginalsAiStatus } from './OriginalsAiDeclaration';

function Track({ token, asset }) {
  const [open, setOpen] = useState(false);
  return <details className="mt-2 rounded border p-2" onToggle={event => setOpen(event.currentTarget.open)}><summary className="cursor-pointer break-words text-sm">{asset.originalName} <OriginalsAiStatus asset={asset} /></summary>{open && <EmbeddedReference token={token} asset={asset} showDownload hideName />}</details>;
}

export default function OriginalsTrackDownloads({ token, tracks = [] }) {
  return <details className="mt-3 rounded border p-3"><summary className="cursor-pointer text-sm font-semibold">Separate production tracks — {tracks.length} file{tracks.length === 1 ? '' : 's'}</summary><p className="mt-2 text-xs text-gray-600">Download the original files individually. Keep each at the same zero/start point. These are the complete source recordings; any approved time ranges still apply.</p>{tracks.map(asset => <Track key={asset._id} token={token} asset={asset} />)}</details>;
}
