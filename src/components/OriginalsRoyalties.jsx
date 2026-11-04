import React, { useState } from 'react';
import { plannedMasterShares, royaltyAmount } from '../utils/originalsRoyalties';

const colors = ['#334155', '#e05265', '#047857', '#0369a1', '#7e22ce', '#b45309', '#0f766e'];
const money = value => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(value);
const percent = value => `${Number(Number(value).toFixed(2))}%`;

function Split({ title, shares }) {
  return <section className="mt-4"><h3 className="font-semibold">{title}</h3>{shares?.length ? <>
    <div className="mt-3 flex h-8 overflow-hidden rounded" role="img" aria-label={shares.map(share => `${share.role}: ${percent(share.percent)}`).join(', ')}>{shares.map((share, index) => <div key={index} title={`${share.role}: ${percent(share.percent)}`} style={{ width: `${share.percent}%`, backgroundColor: colors[index % colors.length] }} />)}</div>
    <ul className="mt-3 space-y-2 text-sm">{shares.map((share, index) => <li key={index} className="flex items-center justify-between gap-3"><span className="flex items-center gap-2"><span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />{share.role}</span><b>{percent(share.percent)}</b></li>)}</ul>
  </> : <p className="mt-2 text-sm text-gray-600">Songwriting shares will be shown once contributions are approved and songwriting choices are known.</p>}</section>;
}

export default function OriginalsRoyalties({ project, preview, credits }) {
  const [view, setView] = useState('planned');
  const [pool, setPool] = useState('master');
  const [recipient, setRecipient] = useState('0');
  const [amounts, setAmounts] = useState([100, 1000, 10000]);
  const shares = view === 'credits' && credits ? { master: credits.masterShares, composition: credits.compositionShares } : view === 'current' && preview ? preview : { master: plannedMasterShares(project.requestedRoles), composition: [] };
  const selectedShares = shares[pool] || [];
  const selected = selectedShares[Number(recipient)] || selectedShares[0];
  return <details className="mt-4 rounded-xl border bg-white p-4">
    <summary className="cursor-pointer font-semibold">Royalty split & earnings examples</summary>
    <label className="mt-4 block text-sm font-medium">Show split<select value={view} onChange={event => { setView(event.target.value); setRecipient('0'); }} className="mt-2 block w-full rounded border p-2"><option value="planned">Expected — planned roles</option><option value="current" disabled={!preview}>So far — approved contributions{!preview ? ' (none yet)' : ''}</option>{credits && <option value="credits">Credit version {credits.version} — {credits.state === 'final' ? 'finalised' : 'awaiting finalisation'}</option>}</select></label>
    <p className="mt-2 text-sm text-gray-600">{view === 'planned' ? 'Assumes one accepted contribution per planned role. The 40% contributor pool is shared equally. Roles and shares may change.' : view === 'current' ? 'Based only on approved contributions so far. Mixing and mastering each retain 10%, even before selection. These shares may change as more contributions are approved.' : 'Uses this credit version. Later approvals or revised credits may change the split.'}</p>
    <div className="grid gap-6 sm:grid-cols-2"><Split title="Recording (master) royalties" shares={shares.master} /><Split title="Songwriting royalties — separate income" shares={shares.composition} /></div>
    <section className="mt-6 border-t pt-4"><h3 className="font-semibold">Low, medium & high examples</h3><p className="mt-1 text-sm text-gray-600">Illustrative amounts, not earnings forecasts. Enter the total income available to distribute for any period you choose. Recording and songwriting income are separate; each percentage applies only to its own pool. These examples do not estimate streams, fees or tax.</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="text-sm">Income pool<select className="mt-1 block w-full rounded border p-2" value={pool} onChange={event => { setPool(event.target.value); setRecipient('0'); }}><option value="master">Recording (master)</option><option value="composition">Songwriting</option></select></label><label className="text-sm">Share to illustrate<select className="mt-1 block w-full rounded border p-2" value={selected ? String(selectedShares.indexOf(selected)) : ''} onChange={event => setRecipient(event.target.value)} disabled={!selectedShares.length}>{selectedShares.length ? selectedShares.map((share, index) => <option key={index} value={index}>{share.role} — {percent(share.percent)}</option>) : <option value="">Shares not yet known</option>}</select></label></div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">{['Low', 'Medium', 'High'].map((label, index) => <div key={label} className="min-w-0 rounded-lg bg-slate-50 p-3"><label className="block text-sm font-semibold">{label} example — total £<input type="number" min="0" max="1000000000" step="1" value={amounts[index]} onChange={event => setAmounts(current => current.map((value, i) => i === index ? event.target.value : value))} className="mt-2 w-full rounded border bg-white p-2 font-normal" /></label><p className="mt-3 text-sm">{selected ? `${selected.role} receives` : 'Select a known split to calculate'}</p>{selected && <p className="mt-1 text-lg font-semibold" aria-live="polite">{money(royaltyAmount(amounts[index], selected.percent))}</p>}</div>)}</div>
    </section>
  </details>;
}
