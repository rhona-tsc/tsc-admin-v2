import { useState } from 'react';
import { originalsRequest } from '../utils/originalsApi';
import { formatOriginalsDeadline } from '../utils/originalsDeadlines';

export default function OriginalsRevisionControls({ token, submission, reservation, currentRoundId, manager = false, ownerId, viewerId, canModerate = false, disabled = false, onBusyChange, onRefresh }) {
  const [note, setNote] = useState(''), [error, setError] = useState(''), [working, setWorking] = useState(false);
  if (!submission || submission.state !== 'submitted' || String(submission.roundId) !== String(currentRoundId)) return null;
  const request = submission.revisionRequest, session = submission.revisionSession;
  const editing = session?.status === 'editing';
  const pending = request?.status === 'pending';
  const inWindow = reservation && new Date(reservation.expiresAt) > new Date();
  const canDecide = String(ownerId) === String(viewerId) || (canModerate && new Date(request?.responseDueAt) <= new Date());
  const act = async action => {
    if (disabled || working) return;
    setError(''); setWorking(true); onBusyChange(true);
    try {
      await originalsRequest(token, { method: 'post', url: `/submissions/${submission._id}/revision`, data: { action, note, requestId: request?.id } });
      setNote(''); await onRefresh();
    } catch (failure) { setError(failure.response?.data?.message || 'Could not update the revision session. Please try again.'); }
    finally { setWorking(false); onBusyChange(false); }
  };
  return <div className="mt-4 min-w-0 rounded-lg border bg-slate-50 p-3 text-sm" aria-label={`Revisions for ${submission.roleName}`}>
    <h3 className="font-semibold">{editing ? 'Revision session' : pending ? 'Revision request' : 'Need to revise this recording?'}</h3>
    {editing ? <><p className="mt-2">{manager ? 'The contributor is preparing a revision.' : 'Your recording session is open for corrections.'} Submit by {formatOriginalsDeadline(session.expiresAt)}.</p>{session.feedback && <p className="mt-2 whitespace-pre-wrap"><b>Feedback:</b> {session.feedback}</p>}<p className="mt-2 text-xs text-gray-600">The previous submission is kept. {manager ? 'Review the updated version when it arrives.' : 'Choose your files and submit the revised take below.'}</p></> : pending ? <>
      <p className="mt-2 whitespace-pre-wrap">{request.reason}</p>
      <p className="mt-2 text-xs text-gray-600">{request.escalatedAt ? 'TSC has been notified because the owner’s seven-day response window has ended.' : `The owner has until ${formatOriginalsDeadline(request.responseDueAt)} to reply. TSC will be notified if there is no response.`}</p>
      {manager && <><label className="mt-3 block">Feedback (optional)<textarea maxLength={2000} disabled={disabled || working} value={note} onChange={event => setNote(event.target.value)} rows={2} className="mt-1 w-full rounded border p-2" /></label><div className="mt-2 flex flex-wrap gap-2"><button type="button" disabled={disabled || working || !canDecide} onClick={() => act('approve')} className="rounded bg-black px-3 py-2 font-semibold text-white disabled:opacity-40">Approve — open 24 hours</button><button type="button" disabled={disabled || working || !canDecide} onClick={() => act('decline')} className="rounded border px-3 py-2 disabled:opacity-40">Decline request</button></div></>}
    </> : <>
      {request?.status === 'declined' && <p className="mt-2 whitespace-pre-wrap">The last revision request was declined.{request.feedback ? ` Feedback: ${request.feedback}` : ''}</p>}
      <p className="mt-2 text-xs text-gray-600">{manager ? 'Request changes after listening or discussing the take. This gives the contributor a fresh 24 hours.' : inWindow ? `You can correct your submission until ${formatOriginalsDeadline(reservation.expiresAt)}. Reopening keeps this deadline.` : 'Your recording window has ended. Ask the owner to approve a fresh 24 hours for your revision.'}</p>
      {(manager || !inWindow) && <label className="mt-3 block">{manager ? 'Feedback (optional)' : 'What would you like to revise?'}<textarea maxLength={2000} disabled={disabled || working} value={note} onChange={event => setNote(event.target.value)} rows={2} className="mt-1 w-full rounded border p-2" /></label>}
      <button type="button" disabled={disabled || working || (!manager && !inWindow && !note.trim())} onClick={() => act(manager ? 'owner_request' : inWindow ? 'open' : 'request')} className="mt-3 rounded border bg-white px-3 py-2 font-semibold disabled:opacity-40">{working ? 'Saving…' : manager ? 'Request a revision — open 24 hours' : inWindow ? 'Reopen to correct my take' : 'Request permission to revise'}</button>
    </>}
    {error && <p role="alert" className="mt-2 text-red-700">{error}</p>}
  </div>;
}
