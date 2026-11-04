import React, { useState } from 'react';
import { originalsRequest } from '../utils/originalsApi';
export default function OriginalsRoles({ token, projectId, roles = [], readOnly = false }) {
  const [role, setRole] = useState('');
  const [mode, setMode] = useState('search');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [chosen, setChosen] = useState('');
  const [contact, setContact] = useState({ fullName: '', email: '', phone: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const search = async () => {
    if (query.trim().length < 2) return setError('Enter at least two letters of their name.');
    setBusy(true); setError('');
    try { const { data } = await originalsRequest(token, { method: 'get', url: `/projects/${projectId}/musicians`, params: { q: query.trim() } }); setResults(data.musicians); setChosen(''); }
    catch (failure) { setError(failure.response?.data?.message || 'Could not search musicians.'); }
    finally { setBusy(false); }
  };
  const send = async event => {
    event.preventDefault(); if (readOnly) return;
    setBusy(true); setError('');
    try {
      const { data } = await originalsRequest(token, { method: 'post', url: `/projects/${projectId}/referrals`, data: { roleName: role, ...(mode === 'search' ? { musicianId: chosen } : contact) } });
      setSuccess(data.message); setRole(''); setContact({ fullName: '', email: '', phone: '' }); setResults([]); setChosen(''); setQuery('');
    } catch (failure) { setError(failure.response?.data?.message || 'Could not send the recommendation.'); }
    finally { setBusy(false); }
  };
  return <section className="mt-4 rounded-xl border bg-white p-4" aria-label="Project roles"><h2 className="font-semibold">Parts we are building</h2><p className="mt-1 text-sm text-gray-600">Follow each role from the first expression of interest to an approved recording. Recommendations do not reserve a slot.</p>
    <ul className="mt-4 grid gap-3 sm:grid-cols-2">{roles.map(item => <li key={item.name} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-slate-50 p-3"><div><h3 className="font-semibold">{item.name}</h3><p className="mt-1 text-xs text-gray-600">{item.status}</p></div>{item.canRecommend && <button type="button" disabled={readOnly || busy} onClick={() => { setRole(item.name); setError(''); setSuccess(''); setResults([]); setChosen(''); setQuery(''); }} className="rounded border bg-white px-3 py-2 text-sm disabled:opacity-40">Recommend someone for {item.name}</button>}</li>)}</ul>
    {success && <p role="status" className="mt-3 rounded bg-emerald-50 p-3 text-sm text-emerald-900">{success}</p>}
    {role && <form onSubmit={send} className="mt-4 space-y-3 rounded-lg border p-3"><div className="flex items-center justify-between gap-2"><h3 className="font-semibold">Recommend someone for {role}</h3><button type="button" disabled={busy} onClick={() => setRole('')} className="text-sm underline">Cancel</button></div>
      <label className="block text-sm">Find or add a contact<select value={mode} onChange={event => { setMode(event.target.value); setError(''); }} className="mt-1 w-full rounded border p-2"><option value="search">Find a musician on the system</option><option value="new">Add someone new</option></select></label>
      {mode === 'search' ? <><div className="flex gap-2"><input aria-label="Musician name" value={query} maxLength={80} onChange={event => setQuery(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); search(); } }} placeholder="Type their name" className="min-w-0 flex-1 rounded border p-2 text-sm" /><button type="button" disabled={busy} onClick={search} className="rounded border px-3 py-2 text-sm">Search</button></div><label className="block text-sm">Musician<select value={chosen} required onChange={event => setChosen(event.target.value)} className="mt-1 w-full min-w-0 rounded border p-2"><option value="">Choose a result</option>{results.map(item => <option key={item._id} value={item._id}>{item.displayName}{item.instruments.length ? ` — ${item.instruments.join(', ')}` : ''}</option>)}</select></label><p className="text-xs text-gray-600">Cannot find them? Choose “Add someone new” above. Contact details are kept private.</p></> : <div className="grid gap-3 sm:grid-cols-2">{[['fullName','Full name','text'],['email','Email address','email'],['phone','Phone number','tel']].map(([field,label,type]) => <label key={field} className="text-sm">{label}<input required type={type} maxLength={field === 'fullName' ? 160 : field === 'phone' ? 40 : 254} value={contact[field]} onChange={event => setContact(current => ({ ...current, [field]: event.target.value }))} className="mt-1 w-full rounded border p-2" /></label>)}</div>}
      <p className="text-xs text-gray-600">We will email them to say you thought they would be a great fit for {role} on this project. New contacts are saved with the recommendation; they create their own musician account if they want to join. Access is for this project only.</p>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}<button type="submit" disabled={busy || readOnly || (mode === 'search' && !chosen)} className="rounded bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">{busy ? 'Saving…' : 'Send project recommendation'}</button>
    </form>}
  </section>;
}
