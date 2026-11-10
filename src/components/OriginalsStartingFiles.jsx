import { addOriginalStartingFiles } from '../utils/originalsStartingFiles';

export default function OriginalsStartingFiles({ files, onChange, disabled, uploaded = {}, finalConfirmed, onFinalConfirmed, roles = [], editing = false }) {
  const change = (id, updates) => { onChange(files.map(item => item.id === id ? { ...item, ...updates } : item)); onFinalConfirmed(false); };
  return <section className="space-y-3 rounded-xl border bg-gray-50 p-4" aria-labelledby="starting-files-title">
    <h2 id="starting-files-title" className="font-semibold">Starting material</h2>
    <p className="text-sm text-gray-600">Add your drums, keys and other stems together. You can also add a separate click or reference idea. Each file can be up to 100 MB.</p>
    <label className="block text-sm font-medium">Add starting files
      <input type="file" multiple disabled={disabled} accept="audio/*,video/mp4,video/quicktime,.wav,.aiff,.flac,.m4a,.mp4,.mov" onChange={event => { onChange(addOriginalStartingFiles(files, Array.from(event.target.files || []))); onFinalConfirmed(false); event.target.value = ''; }} className="mt-2 block w-full min-w-0" />
    </label>
    {files.length ? <ul className="space-y-3">{files.map(item => {
      const saved = Boolean(uploaded[item.id]);
      const video = item.file.type?.startsWith('video/') || /\.(mp4|mov)$/i.test(item.file.name);
      return <li key={item.id} className="space-y-2 rounded-lg border bg-white p-3">
        <div className="flex items-start justify-between gap-3"><p className="min-w-0 break-words text-sm font-semibold">{item.file.name}<span className="ml-2 text-xs font-normal text-gray-500">{(item.file.size / 1024 / 1024).toFixed(1)} MB{saved ? ' · Uploaded' : ''}</span></p><button type="button" disabled={disabled || (saved && !editing)} aria-label={`Remove ${item.file.name}`} onClick={() => { onChange(files.filter(file => file.id !== item.id)); onFinalConfirmed(false); }} className="text-sm underline disabled:opacity-40">Remove</button></div>
        <label className="block text-sm">Use this file as<select value={item.kind} disabled={disabled || (saved && !editing)} onChange={event => change(item.id, { kind: event.target.value })} className="mt-1 w-full rounded border bg-white p-2">
          {video ? <option value="video_submission">Video reference — excluded from mixes</option> : <>{item.kind === 'voice_note' && <option value="voice_note">Voice note — reference only</option>}<option value="initial_stem">Production stem — intended for the final track</option><option value="temporary_stem">Temporary production stem — replace before completion</option><option value="guide_track">Idea / demo / guide — reference only, excluded from mixes</option><option value="click_track">Click track — recording aid only</option></>}
        </select></label>
        {['initial_stem', 'temporary_stem', 'click_track'].includes(item.kind) && <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={item.createdEntirelyWithAi} disabled={disabled || (saved && !editing)} onChange={event => change(item.id, { createdEntirelyWithAi: event.target.checked })} />This whole file was created with AI.</label>}
        {item.kind === 'temporary_stem' && <div className="space-y-2 rounded bg-amber-50 p-3 text-sm">
          <label className="block">Replace when this role is approved<select required value={item.replacementRoleName || ''} disabled={disabled || (saved && !editing)} onChange={event => change(item.id, { replacementRoleName: event.target.value })} className="mt-1 w-full rounded border bg-white p-2"><option value="">Choose replacement role</option>{roles.map(role => <option key={role.name} value={role.name}>{role.name}</option>)}</select></label>
          <p className="text-xs text-amber-900">Included in working mixes until an approved recording replaces it. It cannot be used in the final production. Add the replacement role above if it is missing.</p>
        </div>}
        {item.kind === 'click_track' && <p className="text-xs text-gray-600">Optional in recording mixes; excluded from the final production.</p>}
      </li>;
    })}</ul> : <p className="text-sm text-gray-600">No starting files yet. Choose a foundation role above if musicians will create the first recording.</p>}
    {files.some(item => item.kind === 'initial_stem') && <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={finalConfirmed} disabled={disabled} onChange={event => onFinalConfirmed(event.target.checked)} />Stems marked “intended for the final track” can be used in the finished production. Temporary stems must be replaced; ideas and demos are reference-only.</label>}
    <p className="text-xs text-gray-600">Export production stems and the click from the same start point. Reference-only files remain available to listen to separately.</p>
  </section>;
}
