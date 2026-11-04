import React, { useEffect, useRef, useState } from 'react';
import { originalsRequest } from '../utils/originalsApi';

// One review step for current rounds, advance reservations and renewed terms.
export default function OriginalsReservationAgreement({ token, projectId, type = 'contributor', roleName, request, onCancel, onSaved }) {
  const dialog = useRef(null);
  const [agreement, setAgreement] = useState(null);
  const [accepted, setAccepted] = useState(false);
  const [fullName, setFullName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    return () => element.close();
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    setAccepted(false); setAgreement(null); setError('');
    originalsRequest(token, { method: 'get', url: `/projects/${projectId}/reservation-agreements`, signal: controller.signal })
      .then(({ data }) => { if (!controller.signal.aborted) { const terms = data.agreements.find(item => item.type === type); if (!terms?.acknowledgement) throw new Error('Agreement unavailable'); setAgreement(terms); } })
      .catch(failure => { if (!controller.signal.aborted) setError(failure.response?.data?.message || 'Could not load the agreement. Please try again.'); });
    return () => controller.abort();
  }, [token, projectId, type, reload]);
  const submit = async event => {
    event.preventDefault();
    if (!agreement || !accepted || !fullName.trim() || busy) return;
    setBusy(true); setError('');
    try {
      await originalsRequest(token, { ...request, data: { ...request.data, agreement: { accepted: true, fullName: fullName.trim(), version: agreement.version, textHash: agreement.textHash, acknowledgement: agreement.acknowledgement } } });
      onSaved();
    } catch (failure) {
      setError(failure.response?.data?.message || 'Could not save your reservation. Please try again.');
      if (failure.response?.data?.code === 'ORIGINALS_AGREEMENT_REQUIRED') { setAccepted(false); setAgreement(null); }
    } finally { setBusy(false); }
  };
  return <dialog ref={dialog} aria-labelledby="reservation-agreement-title" onCancel={event => { event.preventDefault(); if (!busy) onCancel(); }} className="m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-2xl overflow-y-auto rounded-xl border p-0 text-slate-800 shadow-xl backdrop:bg-black/50">
    <form onSubmit={submit} className="space-y-4 p-5 sm:p-7">
      <div className="flex items-start justify-between gap-3"><h2 id="reservation-agreement-title" className="text-xl font-semibold">Review your {roleName} reservation agreement</h2><button type="button" aria-label="Close agreement" disabled={busy} onClick={onCancel} className="shrink-0 rounded border px-2 py-1 text-sm disabled:opacity-40">Close</button></div>
      <p className="text-sm text-slate-600">Read the terms and confirm below before your place is reserved.</p>
      {agreement && <>
        <div className="space-y-4 text-sm leading-6">{agreement.sections.map(section => <section key={section.title}><h3 className="font-semibold">{section.title}</h3><p>{section.text}</p></section>)}</div>
        <label className="block border-t pt-4 text-sm font-medium">Your full name<input required autoComplete="name" maxLength={160} value={fullName} onChange={event => setFullName(event.target.value)} disabled={busy} className="mt-1 w-full rounded border px-3 py-2" /></label>
        <p className="text-xs text-slate-600">This acknowledgement is linked to your signed-in account and kept private. It does not replace your chosen public credit name.</p>
        <label className="flex items-start gap-3 text-sm"><input required type="checkbox" checked={accepted} onChange={event => setAccepted(event.target.checked)} disabled={busy} className="mt-1" /><span>{agreement.acknowledgement}</span></label>
      </>}
      {!agreement && !error && <p role="status">Loading agreement…</p>}
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <div className="flex flex-wrap gap-3 border-t pt-4">
        {!agreement && error && <button type="button" onClick={() => setReload(value => value + 1)} className="rounded border px-4 py-2 text-sm">Reload agreement</button>}
        <button type="submit" disabled={busy || !agreement || !accepted || !fullName.trim()} className="rounded bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">{busy ? 'Saving…' : 'Agree and confirm reservation'}</button>
        <button type="button" disabled={busy} onClick={onCancel} className="rounded border px-4 py-2 text-sm disabled:opacity-40">Cancel</button>
      </div>
    </form>
  </dialog>;
}
