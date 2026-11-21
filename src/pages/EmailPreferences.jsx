import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { loginPathFor } from '../utils/loginReturnPath';
import { activeSessionToken } from '../utils/sessionToken';
const endpoint = `${String(import.meta.env.VITE_BACKEND_URL || 'https://tsc-backend-v2.onrender.com').replace(/\/+$/, '')}/api/email-preferences`;
const control = 'inline-flex min-h-11 items-center justify-center rounded-lg px-5 py-3 text-sm font-semibold disabled:opacity-40';

export default function EmailPreferences({ token, onProfileDeleted }) {
  const location = useLocation();
  const linkToken = new URLSearchParams(location.search).get('token') || '';
  const sessionToken = activeSessionToken(token);
  const [preferences, setPreferences] = useState(null), [saved, setSaved] = useState(null);
  const [error, setError] = useState(''), [message, setMessage] = useState(''), [invalidLink, setInvalidLink] = useState(false);
  const [busy, setBusy] = useState(false), [loading, setLoading] = useState(false), [reload, setReload] = useState(0);
  const [removeProfile, setRemoveProfile] = useState(false), [confirming, setConfirming] = useState(false), [confirmation, setConfirmation] = useState('');
  // Email links already identify the subscription. A stale account session must
  // not prevent an unsubscribe or change which recipient the link belongs to.
  const headers = sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {};
  const signInPath = `${loginPathFor(invalidLink ? { ...location, search: '' } : location)}&reauth=1`;
  useEffect(() => {
    const controller = new AbortController();
    const meta = document.createElement('meta'); meta.name = 'referrer'; meta.content = 'no-referrer'; document.head.append(meta);
    setPreferences(null); setSaved(null); setError(''); setMessage(''); setInvalidLink(false); setLoading(Boolean(linkToken || sessionToken));
    setRemoveProfile(false); setConfirming(false); setConfirmation('');
    if (linkToken || sessionToken) axios.get(endpoint, {
      params: { token: linkToken || undefined }, headers: sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}, signal: controller.signal, timeout: 15000,
    }).then(({ data }) => { if (!controller.signal.aborted) { setPreferences(data.preferences); setSaved(data.preferences); } })
      .catch(failure => { if (!controller.signal.aborted) { setError(failure.response?.data?.message || 'Could not load your preferences. Please try again.'); setInvalidLink(Boolean(linkToken && failure.response?.status === 400)); } })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => { controller.abort(); meta.remove(); };
  }, [linkToken, sessionToken, reload]);

  const persist = async (choices, deletion = false) => {
    setBusy(true); setError(''); setMessage('');
    try {
      const { data } = await axios.post(endpoint, {
        token: linkToken || undefined,
        deputyOpportunities: choices.deputyOpportunities, originalsOpportunities: choices.originalsOpportunities,
        ...(deletion ? { deleteProfile: true, confirmation } : {}),
      }, { headers, timeout: 15000 });
      setPreferences(data.preferences); setSaved(data.preferences);
      setMessage(!data.preferences.deputyOpportunities && !data.preferences.originalsOpportunities
        ? 'You’re unsubscribed from deputy and original project opportunity emails. Your preferences have been saved.' : data.message);
      setConfirming(false); setRemoveProfile(false); setConfirmation('');
      if (data.preferences.profileDeleted) onProfileDeleted?.();
    } catch (failure) { setError(failure.response?.data?.message || 'Could not save your preferences. Please try again.'); }
    finally { setBusy(false); }
  };
  const save = event => { event.preventDefault(); if (!busy) persist(preferences); };
  const deleteProfile = event => {
    event.preventDefault();
    if (!removeProfile || busy) return;
    if (!confirming) { setConfirming(true); return; }
    if (sessionToken && confirmation === 'DELETE') persist(preferences, true);
  };
  const bothStopped = saved && !saved.deputyOpportunities && !saved.originalsOpportunities;
  const profileDeleted = preferences?.profileDeleted;
  return <main className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
    <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
      <header className="bg-[#111111] p-6 text-white"><p className="text-xs font-bold tracking-widest text-[#ff8585]">THE SUPREME COLLECTIVE</p><h1 className="mt-3 text-2xl font-semibold">Your email preferences</h1></header>
      <div className="p-5 sm:p-7">
        {profileDeleted ? <div role="status" className="rounded-lg bg-emerald-50 p-4 text-emerald-900"><h2 className="font-semibold">You’re unsubscribed</h2><p className="mt-2 text-sm">You won’t receive deputy or original project opportunity emails. Your musician profile has already been removed from public view.</p><p className="mt-2 text-sm">Existing booking, agreement, payment and royalty records are retained. Contact TSC if you’d like to rejoin.</p></div> : <>
          <p className="text-sm text-gray-600">Choose the opportunity emails you’d like to stop receiving, then save your preferences.</p>
          {linkToken && !invalidLink && <p className="mt-3 rounded-lg bg-gray-50 p-3 text-sm font-medium text-gray-800">You don’t need to sign in to unsubscribe using this email link.</p>}
        </>}
        {error && <div role="alert" className="mt-4 rounded bg-red-50 p-3 text-sm text-red-800"><p>{error}</p><button type="button" onClick={() => setReload(value => value + 1)} className="mt-2 min-h-11 font-semibold underline">Try again</button>{sessionToken && linkToken && <Link to="/email-preferences" className="ml-4 inline-block min-h-11 py-3 font-semibold underline">Use my signed-in account</Link>}</div>}
        {message && !profileDeleted && <p role="status" className="mt-4 rounded bg-emerald-50 p-3 text-sm text-emerald-900">{message}</p>}
        {loading && <p role="status" className="mt-5 text-sm">Loading preferences…</p>}
        {!loading && !profileDeleted && !preferences && <p className="mt-5 text-sm">{!linkToken && !sessionToken ? 'Open the unsubscribe link in your email to manage these choices without a password, or sign in to your account.' : 'You can also sign in to manage your own email preferences.'}<Link to={signInPath} className={`${control} mt-4 block w-fit bg-[#ff6667] text-black`}>Sign in</Link></p>}
        {preferences && !profileDeleted && <>
          {bothStopped && !message && <p role="status" className="mt-4 rounded bg-emerald-50 p-3 text-sm text-emerald-900">You’re already unsubscribed from both opportunity email lists.</p>}
          <form onSubmit={save} className="mt-5 space-y-4">
            <fieldset disabled={busy} className="space-y-4"><legend className="sr-only">Unsubscribe from opportunity emails</legend>
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-4"><input type="checkbox" checked={!preferences.deputyOpportunities} onChange={event => { setPreferences(value => ({ ...value, deputyOpportunities: !event.target.checked })); setMessage(''); }} className="mt-1 shrink-0" /><span>Unsubscribe me from deputy opportunity emails</span></label>
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-4"><input type="checkbox" checked={!preferences.originalsOpportunities} onChange={event => { setPreferences(value => ({ ...value, originalsOpportunities: !event.target.checked })); setMessage(''); }} className="mt-1 shrink-0" /><span>Unsubscribe me from original project opportunities</span></label>
              <p className="text-xs leading-5 text-gray-500">Messages about bookings and projects you’ve already joined, including agreements, deadlines and royalties, will continue. Untick an unsubscribe option and save to receive those opportunities again.</p>
            </fieldset>
            <div className="flex flex-wrap gap-3"><button type="submit" disabled={busy} className={`${control} bg-[#ff6667] text-black`}>{busy ? 'Saving…' : 'Save preferences'}</button>{!bothStopped && <button type="button" disabled={busy} onClick={() => persist({ ...preferences, deputyOpportunities: false, originalsOpportunities: false })} className={`${control} border text-gray-800`}>Unsubscribe from both lists</button>}</div>
          </form>
          <details className="mt-7 border-t pt-5">
            <summary className="min-h-11 cursor-pointer py-2 text-sm font-semibold text-gray-700">Remove my musician profile</summary>
            <p className="mt-2 text-sm text-gray-600">Unsubscribing above keeps your profile. Removing it also hides your public musician profile. Existing booking, agreement, payment and royalty records are retained.</p>
            {sessionToken ? <form onSubmit={deleteProfile} className="mt-4 space-y-4">
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-red-200 p-4"><input type="checkbox" checked={removeProfile} disabled={busy} onChange={event => { setRemoveProfile(event.target.checked); setConfirming(false); setConfirmation(''); }} className="mt-1 shrink-0" /><span>Delete my profile from The Supreme Collective</span></label>
              {confirming && removeProfile && <label className="block text-sm">Type DELETE to confirm profile removal<input autoComplete="off" value={confirmation} disabled={busy} onChange={event => setConfirmation(event.target.value)} className="mt-2 block w-full rounded border bg-white p-3" /></label>}
              <button type="submit" disabled={busy || !removeProfile || (confirming && confirmation !== 'DELETE')} className={`${control} border border-red-300 text-red-800`}>{confirming ? 'Confirm profile removal' : 'Continue to profile removal'}</button>
            </form> : <p className="mt-3 text-sm">For your security, profile removal needs a separate sign-in and confirmation.<Link to={signInPath} className={`${control} mt-3 block w-fit border text-[#b53639]`}>Sign in to remove my profile</Link></p>}
          </details>
        </>}
      </div>
    </div>
  </main>;
}
