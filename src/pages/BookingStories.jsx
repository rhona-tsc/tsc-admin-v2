import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { backendUrl } from '../App';

export default function BookingStories({ token }) {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState('');
  const headers = { Authorization: `Bearer ${token || localStorage.getItem('token') || ''}` };
  const base = `${backendUrl}/api/booking-stories`;
  const load = async () => { const response = await axios.get(base, { headers }); setData(response.data); };
  useEffect(() => { load().catch(e => toast.error(e.response?.data?.message || 'Could not load story queue')); }, []);
  const run = async (key, action) => {
    setBusy(key);
    try { await action(); await load(); }
    catch (e) { toast.error(e.response?.data?.message || e.message); }
    finally { setBusy(''); }
  };
  const patch = (job, changes) => axios.patch(`${base}/${job._id}`, changes, { headers });
  const upload = async file => {
    const form = new FormData(); form.append('file', file);
    return (await axios.post(`${base}/assets`, form, { headers })).data.url;
  };
  if (!data) return <p className="p-8">Loading booking stories…</p>;
  const settings = data.settings;
  return <main className="mx-auto max-w-6xl p-5 lg:p-8 text-slate-900">
    <p className="text-xs font-bold uppercase tracking-widest text-rose-500">Social stories</p>
    <h1 className="mt-2 text-3xl font-bold">Just booked</h1>
    <p className="mt-2 text-slate-600">One booking per day, shared to Instagram and Facebook. Missing stickers or photos wait here. Client names and fees stay off stories.</p>
    <section className="my-6 rounded-2xl border bg-white p-5 space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <button disabled={!!busy} className={`rounded-full px-5 py-2 font-bold text-white ${settings.enabled ? 'bg-emerald-700' : 'bg-slate-700'}`} onClick={() => run('settings', () => axios.patch(`${base}/settings`, { enabled: !settings.enabled }, { headers }))}>{settings.enabled ? 'Auto-posting on — pause' : 'Auto-posting paused — enable'}</button>
        <label className="text-sm font-semibold">Daily time (UK) <input aria-label="Daily posting time" className="ml-2 rounded border p-2" type="time" defaultValue={`${String(settings.hour).padStart(2,'0')}:${String(settings.minute).padStart(2,'0')}`} onBlur={e => { const [hour, minute] = e.target.value.split(':').map(Number); if (Number.isInteger(hour)) run('time', () => axios.patch(`${base}/settings`, { hour, minute }, { headers })); }} /></label>
        <button disabled={!!busy} className="rounded border px-4 py-2" onClick={() => run('sync', () => axios.post(`${base}/sync`, {}, { headers }))}>Refresh new bookings</button>
      </div>
      <label className="block text-sm"><input disabled={!!busy} type="checkbox" checked={settings.autoApprove === true} onChange={e => run('auto-approve', () => axios.patch(`${base}/settings`, { autoApprove: e.target.checked }, { headers }))} /> Automatically approve new stories when a saved venue photo and act sticker are available</label>
      <div className={`rounded-xl p-4 ${data.connection.ready ? 'bg-emerald-50' : 'bg-amber-50'}`}>
        <b>{data.connection.ready ? 'Publishing account ready' : 'Publishing connection needs attention'}</b>
        <p className="mt-1 text-sm">{data.connection.reason || `Instagram ${data.connection.instagramId} · Facebook Page ${data.connection.pageId}`}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button disabled={!!busy} className="rounded bg-black px-4 py-2 text-sm font-bold text-white" onClick={() => run('connect', async () => { const r = await axios.get(`${backendUrl}/api/social-oauth/meta/start?bookingStories=true`, { headers }); window.location.assign(r.data.authUrl); })}>Connect Meta for story publishing</button>
          <button disabled={!!busy} className="rounded border px-4 py-2 text-sm" onClick={() => run('account', () => axios.patch(`${base}/settings`, { useMyConnection: true }, { headers }))}>Use my connected TSC account</button>
        </div>
      </div>
    </section>
    {!data.jobs.length && <p className="rounded-2xl border bg-white p-8">New bookings will appear here automatically.</p>}
    <div className="space-y-5">{data.jobs.map((job, index) => {
      const locked = ['rendering','processing','published','needs_check'].includes(job.status);
      const asset = data.assets.find(a => a.actId === job.actId);
      return <article key={job._id} className="rounded-2xl border bg-white p-5">
        <div className="flex flex-wrap justify-between gap-3"><div><p className="text-sm text-slate-500">#{index + 1} · {job.bookingRef} · {job.eventDateISO}</p><h2 className="mt-1 text-xl font-bold">{job.actName}</h2><p>{job.venueName || 'Venue details needed'}</p></div><span className="h-fit rounded-full bg-slate-100 px-3 py-1 text-sm font-bold capitalize">{job.status.replaceAll('_',' ')}</span></div>
        <div className="mt-4 grid gap-5 md:grid-cols-[240px_1fr]">
          {job.mediaUrl ? <video className="aspect-[9/16] w-full rounded-xl bg-slate-900" src={job.mediaUrl} controls preload="metadata" /> : <div className="grid aspect-[9/16] place-items-center rounded-xl bg-slate-100 p-5 text-center text-slate-500">{!job.confirmed ? 'Waiting for booking confirmation' : 'Add the venue photo and act sticker to create a story'}</div>}
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-semibold">Venue name<input disabled={locked || !!busy} className="mt-1 w-full rounded border p-2 font-normal" defaultValue={job.venueName} onBlur={e => { if (e.target.value !== job.venueName) run(job._id, () => patch(job, { venueName: e.target.value })); }} /></label>
              <label className="text-sm font-semibold">Location<input disabled={locked || !!busy} className="mt-1 w-full rounded border p-2 font-normal" defaultValue={job.venueLocation} onBlur={e => { if (e.target.value !== job.venueLocation) run(job._id, () => patch(job, { venueLocation: e.target.value })); }} /></label>
            </div>
            <label className="block text-sm font-semibold">Venue photo {job.venuePhotoUrl && '✓'}<input disabled={locked || !!busy} className="mt-1 block text-sm" type="file" accept="image/jpeg,image/png,image/webp" onChange={e => { const file=e.target.files[0]; if(file) run(job._id, async () => patch(job, { venuePhotoUrl: await upload(file) })); }} /></label>
            <label className="block text-sm font-semibold">Reusable act sticker {asset?.transparencyVerified ? '✓ saved' : '— transparent WebM needed'}<input disabled={locked || !!busy || !job.actId} className="mt-1 block text-sm" type="file" accept="video/webm" onChange={e => { const file=e.target.files[0]; if(file) run(job._id, async () => { const url=await upload(file); await axios.put(`${base}/act/${job.actId}/sticker`, { actName:job.actName, stickerUrl:url, transparencyVerified:true }, { headers }); }); }} /><span className="mt-1 block font-normal text-slate-500">Upload only a background-free animation. This saves it for future bookings by this act.</span></label>
            <div className="flex gap-4 text-sm">{['instagram','facebook'].map(p => <label key={p} className="capitalize"><input disabled={locked || !!busy} type="checkbox" checked={job.platforms.includes(p)} onChange={e => run(job._id, () => patch(job, { platforms:e.target.checked ? [...job.platforms,p] : job.platforms.filter(x=>x!==p) }))} /> {p}</label>)}</div>
            <label className="block text-sm">Not before <input disabled={locked || !!busy} className="ml-2 rounded border p-2" type="date" defaultValue={job.notBefore?.slice(0,10) || ''} onChange={e=>run(job._id,()=>patch(job,{notBefore:e.target.value ? `${e.target.value}T00:00:00Z` : null}))} /></label>
            <div className="flex flex-wrap gap-2">
              <button disabled={locked || !!busy || !job.confirmed} className="rounded bg-slate-900 px-4 py-2 text-sm font-bold text-white disabled:opacity-40" onClick={()=>run(job._id,()=>axios.post(`${base}/${job._id}/render`,{}, {headers}))}>{busy===job._id ? 'Working…' : 'Generate preview'}</button>
              <button disabled={locked || !!busy || !job.mediaUrl || !job.confirmed} className="rounded bg-emerald-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-40" onClick={()=>run(job._id,()=>patch(job,{approved:!job.approved}))}>{job.approved ? 'Remove approval' : 'Approve for queue'}</button>
              <button disabled={!!busy || !job.approved || !data.connection.ready || ['published','needs_check'].includes(job.status)} className="rounded border px-4 py-2 text-sm disabled:opacity-40" onClick={()=> { if(window.confirm('Publish this story now to the selected social accounts? This uses today’s one-booking slot.')) run(job._id,async()=>{const r=await axios.post(`${base}/${job._id}/publish`,{}, {headers});toast.info(r.data.reason || r.data.state);}); }}>Publish / check processing</button>
              <button disabled={locked || !!busy} className="rounded border px-4 py-2 text-sm disabled:opacity-40" onClick={()=>run(job._id,()=>patch(job,{skip:true}))}>Skip</button>
            </div>
            <p className="text-sm text-slate-500">Instagram: {job.instagram.state} · Facebook: {job.facebook.state}</p>
            {(job.instagram.error || job.facebook.error || job.lastError) && <p className="rounded bg-amber-50 p-3 text-sm">{job.instagram.error || job.facebook.error || job.lastError}</p>}
          </div>
        </div>
      </article>;
    })}</div>
  </main>;
}
