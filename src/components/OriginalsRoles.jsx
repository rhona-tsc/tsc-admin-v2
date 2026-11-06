import OriginalsRoleStatus, { OriginalsRoleStatusIcon } from './OriginalsRoleStatus';
import OriginalsApprovedContributor from './OriginalsApprovedContributor';
import OriginalsRoleCard from './OriginalsRoleCard';
import { sortRecordingProgress } from '../utils/originalsRecordingOrder';
import OriginalsRoleTiming from './OriginalsRoleTiming';
import OriginalsDialog from './OriginalsDialog';
import OriginalsMusicianBrowser from './OriginalsMusicianBrowser';
import OriginalsRoleManager from './OriginalsRoleManager';
import OriginalsReservationAgreement from './OriginalsReservationAgreement';
import React, { useState } from 'react';
import { originalsRequest } from '../utils/originalsApi';
export default function OriginalsRoles({ token, projectId, roles = [], readOnly = false, canManage = false, roleManagement, futureReservations = [], onChange, creditPreferences = {} }) {
  const [role, setRole] = useState('');
  const [reservationReview, setReservationReview] = useState(null);
  const [mode, setMode] = useState('search');
  const [chosen, setChosen] = useState('');
  const [contact, setContact] = useState({ fullName: '', email: '', phone: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const approvedCount = roles.filter(item => item.timingState === 'complete').length;
  const completionPercent = roles.length ? Math.round(approvedCount / roles.length * 100) : 0;
  const reserveAhead = name => setReservationReview({ roleName: name, request: { method: 'post', url: `/projects/${projectId}/role-reservations`, data: { roleName: name, ...creditPreferences } } });
  const renewAgreement = reservation => setReservationReview({ roleName: reservation.roleName, request: { method: 'post', url: `/projects/${projectId}/role-reservations/${reservation._id}/agreement` } });
  const releaseAhead = async reservation => {
    setBusy(true); setError('');
    try { await originalsRequest(token, { method: 'post', url: `/projects/${projectId}/role-reservations/${reservation._id}/release` }); setSuccess(`Your ${reservation.roleName} advance place has been released.`); await onChange?.(); }
    catch (failure) { setError(failure.response?.data?.message || 'Could not release this place.'); }
    finally { setBusy(false); }
  };
  const send = async event => {
    event.preventDefault(); if (readOnly) return;
    setBusy(true); setError('');
    try {
      const { data } = await originalsRequest(token, { method: 'post', url: `/projects/${projectId}/referrals`, data: { roleName: role, ...(mode === 'search' ? { musicianId: chosen } : contact) } });
      setSuccess(data.message); setRole(''); setContact({ fullName: '', email: '', phone: '' }); setChosen('');
    } catch (failure) { setError(failure.response?.data?.message || 'Could not send the recommendation.'); }
    finally { setBusy(false); }
  };
  return <section id="project-roles" tabIndex={-1} className="scroll-mt-6 mt-4 rounded-xl border bg-white p-4" aria-label="Project roles">
    <div className="mb-4" aria-label="Recording completion">
      <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm"><p className="font-semibold text-slate-800">{completionPercent}% complete</p><p className="text-xs text-gray-600">{approvedCount} of {roles.length} recording {roles.length === 1 ? 'part' : 'parts'} approved</p></div>
      <div role="progressbar" aria-label="Approved recording parts" aria-valuemin={0} aria-valuemax={100} aria-valuenow={completionPercent} aria-valuetext={`${completionPercent}% complete — ${approvedCount} of ${roles.length} recording parts approved`} className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[var(--tsc-coral)]" style={{ width: `${completionPercent}%` }} /></div>
    </div>
    <h2 className="text-sm font-bold uppercase tracking-wide text-slate-800">Recording progress</h2><p className="mt-1 text-sm text-gray-600">Approved parts appear first, followed by the current round and future roles in the preferred order. Reserve a future place now; your 24 hours starts when its round opens. Recommendations do not reserve a place. Expected dates use UK time (GMT/BST) and include approved extensions.</p>
    {canManage && !readOnly && <OriginalsRoleManager token={token} projectId={projectId} roles={roles} management={roleManagement} onChange={async () => { setRole(''); setReservationReview(null); await onChange?.(); }} />}
    {reservationReview && <OriginalsReservationAgreement token={token} projectId={projectId} {...reservationReview} onCancel={() => setReservationReview(null)} onSaved={() => { setSuccess(`Agreement accepted for your ${reservationReview.roleName} place. We will email when the recording reservation activates.`); setReservationReview(null); onChange?.(); }} />}
    <ul className="originals-role-grid mt-4">{sortRecordingProgress(roles).map(item => {
      const held = futureReservations.find(reservation => reservation.state === 'waiting' && reservation.roleName === item.name);
      return <OriginalsRoleCard key={item.name} roleName={item.name}>
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 font-semibold"><OriginalsRoleStatusIcon role={item} />{item.name}</h3>
          {item.timingState === 'complete' && item.approvedContributors?.length
            ? item.approvedContributors.map((credit, index) => <OriginalsApprovedContributor key={index} credit={credit} />)
            : <OriginalsRoleStatus role={item} />}
          {item.recordingOrder != null && <p className="mt-1 text-xs text-slate-500">Preferred recording order: {item.recordingOrder}</p>}
          <OriginalsRoleTiming role={item} readOnly={readOnly} />
          {(item.canReserveAhead || held) && <p className="mt-1 text-xs text-gray-500">{item.canReserveAhead && `${item.advanceCount || 0}/3 advance places reserved`}{held && <span className="block text-emerald-800">Your future place is held.</span>}</p>}
        </div>
        <div className="mt-2 flex min-w-0 flex-col items-start gap-1.5">
          {held ? <>
            {held.agreementNeedsReview && <button type="button" disabled={readOnly || busy} onClick={() => renewAgreement(held)} className="text-left text-xs text-amber-800 underline">Review agreement before activation</button>}
            <button type="button" disabled={readOnly || busy} onClick={() => releaseAhead(held)} className="text-left text-xs underline">Release advance reservation</button>
          </> : item.canReserveAhead && <button type="button" disabled={readOnly || busy || item.advancePlacesRemaining === 0} onClick={() => reserveAhead(item.name)} aria-label={`Reserve a future place for ${item.name}`} className="max-w-full rounded bg-black px-3 py-1.5 text-left text-sm text-white disabled:opacity-40">{item.advancePlacesRemaining === 0 ? 'Advance places full' : 'Reserve a future place'}</button>}
          {item.canRecommend && <button type="button" disabled={readOnly || busy} onClick={() => { setRole(item.name); setError(''); setSuccess(''); setChosen(''); }} aria-label={`Recommend someone for ${item.name}`} className="max-w-full rounded border bg-white px-3 py-1.5 text-left text-sm disabled:opacity-40">Recommend someone</button>}
        </div>
      </OriginalsRoleCard>;
    })}</ul>
    {error && !role && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
    {success && <p role="status" className="mt-3 rounded bg-emerald-50 p-3 text-sm text-emerald-900">{success}</p>}
    {role && <OriginalsDialog title={`Recommend someone for ${role}`} busy={busy} onClose={() => setRole('')}><form onSubmit={send} className="space-y-4">
      <label className="block text-sm">Find or add a contact<select disabled={busy} value={mode} onChange={event => { setMode(event.target.value); setError(''); }} className="mt-1 w-full rounded border p-2"><option value="search">Find a musician on the system</option><option value="new">Add someone new</option></select></label>
      {mode === 'search' ? <><OriginalsMusicianBrowser key={role} token={token} projectId={projectId} initialInstrument={role} selectedId={chosen} onSelect={musicianId => setChosen(musicianId)} disabled={busy || readOnly} /><p className="text-xs text-gray-600">Cannot find them? Choose “Add someone new” above. Contact details are kept private.</p></> : <div className="grid gap-3 sm:grid-cols-2">{[['fullName','Full name','text'],['email','Email address','email'],['phone','Phone number','tel']].map(([field,label,type]) => <label key={field} className="text-sm">{label}<input required disabled={busy} type={type} maxLength={field === 'fullName' ? 160 : field === 'phone' ? 40 : 254} value={contact[field]} onChange={event => setContact(current => ({ ...current, [field]: event.target.value }))} className="mt-1 w-full rounded border p-2" /></label>)}</div>}
      <p className="text-xs text-gray-600">We will email them to say you thought they would be a great fit for {role} on this project. New contacts are saved with the recommendation; they create their own musician account if they want to join. Access is for this project only.</p>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}<button type="submit" disabled={busy || readOnly || (mode === 'search' && !chosen)} className="rounded bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">{busy ? 'Saving…' : 'Send project recommendation'}</button>
    </form></OriginalsDialog>}
  </section>;
}
