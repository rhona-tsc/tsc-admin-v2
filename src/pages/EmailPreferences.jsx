import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { loginPathFor } from '../utils/loginReturnPath';
const endpoint = `${String(import.meta.env.VITE_BACKEND_URL || 'https://tsc-backend-v2.onrender.com').replace(/\/+$/, '')}/api/email-preferences`;

export default function EmailPreferences({ token, onProfileDeleted }) {
  const location = useLocation();
  const linkToken = new URLSearchParams(location.search).get('token') || '';
  const [preferences, setPreferences] = useState(null), [error, setError] = useState(''), [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false), [removeProfile, setRemoveProfile] = useState(false), [confirming, setConfirming] = useState(false), [confirmation, setConfirmation] = useState('');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  useEffect(() => {
    const controller = new AbortController();
    const meta = document.createElement('meta'); meta.name = 'referrer'; meta.content = 'no-referrer'; document.head.append(meta);
    axios.get(endpoint, { params: { token: linkToken || undefined }, headers: token ? { Authorization: `Bearer ${token}` } : {}, signal: controller.signal })
      .then(({ data }) => setPreferences(data.preferences))
      .catch(failure => { if (!controller.signal.aborted) setError(failure.response?.data?.message || 'Could not load your preferences. Please try again.'); });
    return () => { controller.abort(); meta.remove(); };
  }, [linkToken, token]);
  const save = async event => {
    event.preventDefault(); setError(''); setMessage('');
    if (removeProfile && !confirming) { setConfirming(true); return; }
    if (removeProfile && (!token || confirmation !== 'DELETE')) return;
    setBusy(true);
    try {
      const { data } = await axios.post(endpoint, { token: linkToken || undefined, deputyOpportunities: preferences.deputyOpportunities, originalsOpportunities: preferences.originalsOpportunities, ...(removeProfile ? { deleteProfile: true, confirmation } : {}) }, { headers });
      setPreferences(data.preferences); setMessage(data.message); setConfirming(false); setRemoveProfile(false); setConfirmation('');
      if (data.preferences.profileDeleted) onProfileDeleted?.();
    } catch (failure) { setError(failure.response?.data?.message || 'Could not save your preferences. Please try again.'); }
    finally { setBusy(false); }
  };
  return <main className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
    <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
      <header className="bg-[#111111] p-6 text-white"><p className="text-xs font-bold tracking-widest text-[#ff8585]">THE SUPREME COLLECTIVE</p><h1 className="mt-3 text-2xl font-semibold">Your email preferences</h1></header>
      <div className="p-5 sm:p-7">
        <p className="text-sm text-gray-600">Choose the opportunity emails you’d like to stop receiving. Nothing changes until you save.</p>
        {error && <p role="alert" className="mt-4 rounded bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        {message && <p role="status" className="mt-4 rounded bg-emerald-50 p-3 text-sm text-emerald-900">{message}</p>}
        {!token && <p className="mt-4 text-sm"><Link to={loginPathFor(location)} state={{ from: `${location.pathname}${location.search}` }} className="font-semibold text-[#b53639] underline">Sign in</Link> to manage your account or confirm profile removal.</p>}
        {!preferences && !error && <p role="status" className="mt-5 text-sm">Loading preferences…</p>}
        {preferences && !preferences.profileDeleted && <form onSubmit={save} className="mt-5 space-y-4">
          <fieldset disabled={busy} className="space-y-4"><legend className="sr-only">Unsubscribe from opportunity emails</legend>
            <label className="flex items-start gap-3 rounded-lg border p-4"><input type="checkbox" checked={!preferences.deputyOpportunities} onChange={event => { setPreferences(value => ({ ...value, deputyOpportunities: !event.target.checked })); setMessage(''); }} className="mt-1 shrink-0" /><span>Unsubscribe me from deputy opportunity emails</span></label>
            <label className="flex items-start gap-3 rounded-lg border p-4"><input type="checkbox" checked={!preferences.originalsOpportunities} onChange={event => { setPreferences(value => ({ ...value, originalsOpportunities: !event.target.checked })); setMessage(''); }} className="mt-1 shrink-0" /><span>Unsubscribe me from original project opportunities</span></label>
            <p className="text-xs leading-5 text-gray-500">Messages about bookings and projects you’ve already joined, including agreements, deadlines and royalties, will continue. Untick an unsubscribe option and save to receive those opportunities again.</p>
            <label className="flex items-start gap-3 rounded-lg border border-red-200 p-4"><input type="checkbox" checked={removeProfile} onChange={event => { setRemoveProfile(event.target.checked); setConfirming(false); setConfirmation(''); }} className="mt-1 shrink-0" /><span>Delete my profile from The Supreme Collective<span className="mt-1 block text-xs leading-5 text-gray-500">Removes your public musician profile and stops both opportunity email lists. Existing booking, agreement, payment and royalty records are retained. You’ll need to sign in and confirm separately.</span></span></label>
          </fieldset>
          {confirming && removeProfile && <div className="rounded-lg border border-red-200 bg-red-50 p-4"><h2 className="font-semibold text-red-900">Confirm profile removal</h2><p className="mt-2 text-sm text-red-900">Your public profile will be removed. This does not cancel existing bookings or remove your agreed royalty credits.</p>{token ? <label className="mt-3 block text-sm">Type DELETE to confirm<input autoComplete="off" value={confirmation} disabled={busy} onChange={event => setConfirmation(event.target.value)} className="mt-1 block w-full rounded border bg-white p-2" /></label> : <Link to={loginPathFor(location)} state={{ from: `${location.pathname}${location.search}` }} className="mt-3 inline-block font-semibold underline">Sign in to confirm profile removal</Link>}</div>}
          <button type="submit" disabled={busy || (confirming && removeProfile && (!token || confirmation !== 'DELETE'))} className="rounded-lg bg-[#ff6667] px-5 py-3 text-sm font-semibold text-black disabled:opacity-40">{busy ? 'Saving…' : confirming && removeProfile ? 'Confirm profile removal' : 'Save preferences'}</button>
        </form>}
      </div>
    </div>
  </main>;
}
