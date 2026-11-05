export default function OriginalsAiDeclaration({ checked, onChange, disabled = false }) {
  return <div className="mt-3 rounded border bg-gray-50 p-3 text-sm">
    <label className="flex items-start gap-2"><input type="checkbox" className="mt-1" checked={checked} disabled={disabled} onChange={event => onChange(event.target.checked)} />This stem file was created entirely with AI.</label>
    <p className="mt-1 text-xs text-gray-600">Tick this only if the whole recording was AI-generated. This declaration applies to this file and will be visible during review.</p>
  </div>;
}

export function OriginalsAiStatus({ asset }) {
  if (!['initial_stem', 'take_stem', 'click_track'].includes(asset?.kind)) return null;
  const label = asset.createdEntirelyWithAi === true ? 'Declared entirely AI-created' : asset.createdEntirelyWithAi === false ? 'Not declared as entirely AI-created' : 'AI declaration not recorded';
  return <span className={`inline-block rounded px-2 py-1 text-xs font-normal ${asset.createdEntirelyWithAi === true ? 'bg-amber-100 text-amber-900' : 'bg-gray-100 text-gray-600'}`}>{label}</span>;
}
