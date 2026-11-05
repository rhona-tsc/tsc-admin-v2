import { recordingOrderError } from '../utils/originalsRecordingOrder';
import { useEffect, useState } from 'react';
import { originalsRequest } from '../utils/originalsApi';

export default function OriginalsRoleManager({ token, projectId, roles, management, onChange }) {
  const [name, setName] = useState('');
  const [order, setOrder] = useState({});
  useEffect(() => { setOrder(Object.fromEntries(roles.map(role => [role.name, role.recordingOrder ?? '']))); }, [roles]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const change = async (action, roleName) => {
    if (busy) return;
    setBusy(true); setError(''); setSuccess('');
    try {
      const { data } = await originalsRequest(token, { method: 'post', url: `/projects/${projectId}/roles`, data: { action, roleName, ...(action === 'set_order' ? { recordingOrder: roles.map(role => ({ name: role.name, recordingOrder: order[role.name] ?? null })) } : {}) } });
      if (action === 'add') setName('');
      setSuccess(data.message || (action === 'add' ? 'Part added.' : 'Part removed.'));
      await onChange?.();
    } catch (failure) {
      setError(failure.response?.data?.message || 'Could not update the project parts.');
      if (failure.response?.status === 409) await onChange?.();
    }
    finally { setBusy(false); }
  };
  return <details className="mt-4 min-w-0 rounded-lg border p-3" aria-label="Manage project parts"><summary className="cursor-pointer text-sm font-semibold">Owner tools: recording plan</summary>
    <p className="mt-3 text-xs text-gray-600">Add another instrument or a custom part such as Click track. New parts are for future rounds; opening their stage is a separate step. Accepted recording roles share the existing contributor royalty pool.</p>
    {management?.canEdit ? <><form onSubmit={event => { event.preventDefault(); change('add', name); }} className="mt-3 flex flex-wrap items-end gap-2"><label className="min-w-0 flex-1 text-sm font-medium">New part<input aria-label="New project part" value={name} onChange={event => setName(event.target.value)} required maxLength={80} placeholder="e.g. Click track, Saxophone, Percussion" list="originals-part-suggestions" disabled={busy} className="mt-1 w-full min-w-0 rounded border p-2 font-normal" /></label><datalist id="originals-part-suggestions">{['Vocal', 'Guitar', 'Bass', 'Keys', 'Drums', 'Percussion', 'Saxophone', 'Strings', 'Click track'].map(part => <option key={part} value={part} />)}</datalist><button type="submit" disabled={busy || !name.trim() || roles.length >= 30} className="rounded bg-black px-3 py-2 text-sm font-semibold text-white disabled:opacity-40">Add part</button></form>
      <p className="mt-4 text-xs text-gray-600">Optional recording order: number the roles you want first (1–30), leaving others blank. This suggests the next round after approval and helps TSC follow your plan if a review is overdue. Changes do not open or close a round.</p>
      <ul className="mt-3 space-y-2">{roles.map(role => <li key={role.name} className="flex min-w-0 items-start justify-between gap-3 border-t pt-2"><div className="min-w-0 text-sm"><p className="break-words font-medium">{role.name}</p>{role.removeReason && <p className="mt-1 text-xs text-gray-600">{role.removeReason}</p>}</div><label className="ml-auto shrink-0 text-xs">Order<input type="number" min="1" max="30" step="1" aria-label={`Recording order for ${role.name}`} value={order[role.name] ?? ''} disabled={busy} onChange={event => setOrder(current => ({ ...current, [role.name]: event.target.value }))} placeholder="—" className="mt-1 block w-16 rounded border p-2" /></label><button type="button" aria-label={`Remove ${role.name} part`} disabled={busy || role.canRemove !== true} onClick={() => change('remove', role.name)} className="shrink-0 rounded border px-3 py-1 text-sm disabled:opacity-40">Remove</button></li>)}</ul>
      <button type="button" disabled={busy} onClick={() => { const message = recordingOrderError(roles.map(role => ({ ...role, recordingOrder: order[role.name] }))); if (message) { setError(message); return; } change('set_order'); }} className="mt-3 rounded bg-black px-3 py-2 text-sm font-semibold text-white disabled:opacity-40">{busy ? 'Saving…' : 'Save recording order'}</button>
    </> : <p className="mt-3 text-sm text-gray-600">{management?.reason || 'Part editing is unavailable. Refresh the project to check again.'}</p>}
    {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}{success && <p role="status" className="mt-3 text-sm text-emerald-800">{success}</p>}
  </details>;
}
