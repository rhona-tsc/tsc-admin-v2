import { useState } from 'react';
import { toast } from 'react-toastify';
import OriginalsDialog from './OriginalsDialog';
import { originalsRequest } from '../utils/originalsApi';

export default function OriginalsRenameProject({ token, project, onRenamed }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const rename = async event => {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError('');
    try {
      const { data } = await originalsRequest(token, { method: 'patch', url: `/projects/${project._id}/details`, data: { title: title.trim(), description: description.trim(), expectedTitle: project.title, expectedDescription: project.description } });
      onRenamed({ title: data.title, description: data.description });
      setOpen(false);
      toast.success(data.notifyAfter ? 'Project details saved. The team will be notified 15 minutes after your last edit.' : 'Project details saved. No notification needed.');
    } catch (failure) { setError(failure.response?.data?.message || 'Could not update the project. Please try again.'); }
    finally { setBusy(false); }
  };
  return <>
    <button type="button" onClick={() => { setTitle(project.title); setDescription(project.description); setError(''); setOpen(true); }} className="mb-3 rounded border bg-white px-4 py-2 text-sm font-semibold">Edit project details</button>
    {open && <OriginalsDialog title="Edit project details" busy={busy} onClose={() => setOpen(false)}>
      <form onSubmit={rename} className="space-y-4">
        <p className="text-sm">Current name: <strong>{project.title}</strong></p>
        <label className="block text-sm font-semibold">New project name<input autoFocus required maxLength={160} value={title} onChange={event => setTitle(event.target.value)} className="mt-2 block w-full rounded border px-3 py-2 font-normal" /></label>
        <label className="block text-sm font-semibold">Project description<textarea required maxLength={5000} rows={8} value={description} onChange={event => setDescription(event.target.value)} className="mt-2 block w-full rounded border px-3 py-2 font-normal" /></label>
        <p className="text-sm text-gray-600">Current participants and musicians holding advance places will receive one email with the changes, 15 minutes after your last edit. Further edits during that window are combined and restart the timer. Their places and recordings stay with this project.</p>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <button type="submit" disabled={busy || !title.trim() || !description.trim() || (title.trim() === project.title && description.trim() === project.description)} className="rounded bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">{busy ? 'Saving…' : 'Save changes'}</button>
      </form>
    </OriginalsDialog>}
  </>;
}
