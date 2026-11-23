import React, { useEffect, useState } from 'react';
import axios from 'axios';
const api = `${import.meta.env.VITE_BACKEND_URL || 'https://tsc-backend-v2.onrender.com'}/api/peer-reviews`;
const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('token') || localStorage.getItem('musicianToken') || ''}` });

export default function PeerFeedback() {
  const [data, setData] = useState(null), [error, setError] = useState(''), [active, setActive] = useState(null), [ratings, setRatings] = useState({}), [comment, setComment] = useState(''), [busy, setBusy] = useState(false), [notice, setNotice] = useState('');
  const load = () => axios.get(`${api}/tasks`, { headers: headers() }).then(r => setData(r.data)).catch(() => setError('We could not load your feedback tasks. Please try again.'));
  useEffect(() => { load(); }, []);
  const save = async () => {
    setBusy(true); setError('');
    try { await axios.post(api, { bookingKey: active.bookingKey, recipientId: active.peer.id, ratings, comment }, { headers: headers() }); setActive(null); setNotice('Thank you — your feedback has been sent privately to TSC.'); await load(); }
    catch (e) { setError(e.response?.data?.message || 'Could not submit feedback. Please try again.'); }
    finally { setBusy(false); }
  };
  const tasks = data?.tasks || [];
  const remaining = tasks.reduce((n, t) => n + t.peers.filter(p => !p.submitted).length, 0);
  return <section id="peer-feedback" className="scroll-mt-8 rounded-2xl border border-rose-100 bg-white p-6 shadow-sm my-6">
    <div className="flex items-center justify-between gap-3"><div><p className="text-xs uppercase tracking-widest text-rose-600">After the applause</p><h2 className="mt-1 text-xl font-semibold">Review your bandmates</h2></div><span className="rounded-full bg-rose-50 px-3 py-1 text-sm text-rose-800">{remaining} to complete</span></div>
    <p className="mt-3 text-sm text-gray-600">Share what went well and what could improve. Only TSC staff can read your feedback. Your bandmates cannot see your ratings, comments or identity, and nothing is published on profiles.</p>
    <p className="mt-2 text-xs text-gray-500">TSC retains your identity privately to investigate concerns. Feedback is optional. Tasks open the day after each gig.</p>
    {notice && <p role="status" className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-800">{notice}</p>}
    {error && <div role="alert" className="mt-3 text-sm text-red-700">{error} <button onClick={() => { setError(''); load(); }} className="underline">Retry</button></div>}
    {!data && !error && <p className="mt-4 text-sm">Loading your gigs…</p>}
    {data && !tasks.length && <div className="mt-5 rounded-xl bg-stone-50 p-5 text-sm text-gray-600">You’re all caught up. Feedback tasks will appear here after your next gig.</div>}
    {tasks.map(t => <div key={t.bookingKey} className="mt-5 border-t pt-4"><p className="font-semibold">{t.actName} <span className="font-normal text-gray-500">· {new Date(`${t.eventDate}T12:00:00`).toLocaleDateString('en-GB')}</span></p><div className="mt-3 flex flex-wrap gap-2">{t.peers.map(p => <button key={p.id} disabled={p.submitted} onClick={() => { setActive({ ...t, peer: p }); setRatings({}); setComment(''); setError(''); }} className="rounded-lg border px-4 py-2 text-sm hover:border-rose-400 disabled:bg-green-50 disabled:text-green-800">{p.name} · {p.submitted ? 'Submitted' : 'Give feedback'}</button>)}</div></div>)}
    {active && <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label="Private bandmate feedback"><div className="max-h-[90vh] w-full max-w-xl overflow-auto rounded-2xl bg-white p-6"><h2 className="text-xl font-semibold">Feedback for {active.peer.name}</h2><p className="mt-2 text-sm text-gray-500">{active.actName} · {active.eventDate}. Private to TSC staff.</p><div className="mt-5 space-y-3">{data.categories.map(label => (
      <fieldset key={label} className="min-w-0" disabled={busy}>
        <legend className="text-sm font-medium">{label}</legend>
        <div className="flex flex-wrap items-center gap-1">
          {[1, 2, 3, 4, 5].map(stars => (
            <label key={stars} className="cursor-pointer">
              <input
                type="radio"
                name={`peer-rating-${label}`}
                checked={ratings[label] === stars}
                onChange={() => setRatings(current => ({ ...current, [label]: stars }))}
                className="peer sr-only"
              />
              <span className="sr-only">{stars} {stars === 1 ? 'star' : 'stars'} out of 5</span>
              <span
                aria-hidden="true"
                className={`grid h-11 w-11 place-items-center rounded text-3xl leading-none peer-focus-visible:ring-2 peer-focus-visible:ring-rose-600 ${stars <= ratings[label] ? 'text-amber-600' : 'text-gray-500'}`}
              >
                {stars <= ratings[label] ? '★' : '☆'}
              </span>
            </label>
          ))}
          <label className="ml-1 flex min-h-11 cursor-pointer items-center gap-2 text-sm text-gray-700">
            <input
              type="radio"
              name={`peer-rating-${label}`}
              checked={ratings[label] == null}
              onChange={() => setRatings(current => ({ ...current, [label]: null }))}
              className="accent-rose-600"
            />
            Not observed
          </label>
        </div>
      </fieldset>
    ))}</div><label className="mt-5 block text-sm font-medium">Comments or a concern for TSC<textarea maxLength={2000} rows={4} value={comment} onChange={e => setComment(e.target.value)} className="mt-2 w-full rounded-lg border p-3" placeholder="Keep feedback specific, fair and based on this gig." /></label>{error && <p role="alert" className="mt-2 text-red-700">{error}</p>}<div className="mt-5 flex justify-end gap-3"><button disabled={busy} onClick={() => setActive(null)} className="rounded-lg border px-4 py-2">Cancel</button><button disabled={busy} onClick={save} className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50">{busy ? 'Submitting…' : 'Send privately to TSC'}</button></div></div></div>}
  </section>;
}

export function PeerFeedbackModeration() {
  const [rows, setRows] = useState([]), [error, setError] = useState(''), [filter, setFilter] = useState('pending'), [busy, setBusy] = useState(''), [notes, setNotes] = useState({});
  const load = () => axios.get(`${api}/moderation`, { headers: headers() }).then(r => setRows(r.data.reviews)).catch(e => setError(e.response?.data?.message || 'Could not load feedback.'));
  useEffect(() => { load(); }, []);
  const decide = async (id, status) => { setBusy(id); setError(''); try { await axios.patch(`${api}/moderation/${id}`, { status, note: notes[id] || '' }, { headers: headers() }); await load(); } catch { setError('Could not save moderation decision.'); } finally { setBusy(''); } };
  return <section className="mb-8 rounded-xl border bg-white p-5"><h2 className="text-xl font-bold">Private bandmate feedback</h2><p className="mt-2 text-sm text-gray-600">Staff only. Reviewing a submission does not publish it or notify the musician.</p><select className="my-4 rounded border p-2" value={filter} onChange={e => setFilter(e.target.value)}>{['pending', 'reviewed', 'flagged', 'dismissed', 'all'].map(s => <option key={s}>{s}</option>)}</select>{error && <p role="alert" className="text-red-700">{error}</p>}{rows.filter(r => filter === 'all' || r.status === filter).map(r => <article key={r._id} className="mb-4 rounded-xl border p-4"><p className="font-semibold">{r.recipientName} · {r.actName} · {r.eventDate}</p><p className="mt-1 text-xs text-gray-500">Submitted by {r.reviewerName} ({r.reviewerEmail}) · {r.status}</p><div className="mt-3 flex flex-wrap gap-3 text-sm">{Object.entries(r.ratings || {}).map(([k, v]) => <span key={k}>{k}: {v}/5</span>)}</div><p className="my-3 whitespace-pre-wrap">{r.comment || 'No written comment'}</p><textarea className="w-full rounded border p-2 text-sm" placeholder="Private moderation note" maxLength={2000} value={notes[r._id] ?? r.moderationNote ?? ''} onChange={e => setNotes({ ...notes, [r._id]: e.target.value })} /><div className="mt-3 flex gap-2">{['reviewed', 'flagged', 'dismissed'].map(s => <button key={s} disabled={Boolean(busy)} onClick={() => decide(r._id, s)} className="rounded border px-3 py-2 text-sm disabled:opacity-50">{s === 'reviewed' ? 'Mark reviewed' : s === 'flagged' ? 'Flag for follow-up' : 'Dismiss'}</button>)}</div></article>)}{!rows.filter(r => filter === 'all' || r.status === filter).length && <p className="text-sm text-gray-500">No {filter === 'all' ? '' : filter} bandmate feedback.</p>}</section>;
}
