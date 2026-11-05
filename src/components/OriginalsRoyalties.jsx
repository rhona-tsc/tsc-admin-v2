import React, { useState } from 'react';
import { plannedMasterShares, royaltyAmount, streamsForAnnualIncome, remainingMasterRoyaltyPool, isTscRoyaltyShare, royaltyIllustrationAmount } from '../utils/originalsRoyalties';

import OriginalsMasterRoyaltySplit from './OriginalsMasterRoyaltySplit';
import OriginalsRoyaltySplit from './OriginalsRoyaltySplit';

const money = value => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(value);
const percent = value => `${Number(Number(value).toFixed(2))}%`;
// Restore the calculator once the project's income sources are better established.
const SHOW_EARNINGS_EXAMPLES = false;

export default function OriginalsRoyalties({ project, preview, credits, canIllustrateTscShare = false }) {
  const [view, setView] = useState('planned');
  const [pool, setPool] = useState('master');
  const [recipient, setRecipient] = useState('0');
  const [streamAssumption, setStreamAssumption] = useState('0.004');
  const [amounts, setAmounts] = useState([100, 1000, 10000]);
  const shares = view === 'credits' && credits ? { master: credits.masterShares, composition: credits.compositionShares } : view === 'current' && preview ? preview : { master: plannedMasterShares(project.requestedRoles), composition: [] };
  const masterPool = remainingMasterRoyaltyPool(shares.master);
  const selectedShares = pool === 'master'
    ? [...(canIllustrateTscShare ? (shares.master || []).filter(isTscRoyaltyShare) : []), ...masterPool.shares]
    : shares.composition || [];
  const selected = selectedShares[Number(recipient)] || selectedShares[0];
  return <details id="project-royalties" tabIndex={-1} className="scroll-mt-6 mt-4 rounded-xl border bg-white p-4">
    <summary className="cursor-pointer font-semibold">Royalty split</summary>
    <label className="mt-4 block text-sm font-medium">Show split<select value={view} onChange={event => { setView(event.target.value); setRecipient('0'); }} className="mt-2 block w-full rounded border p-2"><option value="planned">Expected — planned roles</option><option value="current" disabled={!preview}>So far — approved contributions{!preview ? ' (none yet)' : ''}</option>{credits && <option value="credits">Credit version {credits.version} — {credits.state === 'final' ? 'finalised' : 'awaiting finalisation'}</option>}</select></label>
    <p className="mt-2 text-sm text-gray-600">{view === 'planned' ? 'Assumes one accepted contribution per planned role. Accepted contributor roles share 50% of the remaining master pool equally. Roles and shares may change.' : view === 'current' ? 'Based only on approved contributions so far. Mixing and mastering each retain 12.5% of the remaining master pool, even before selection. These shares may change as more contributions are approved.' : 'Uses this credit version. Later approvals or revised credits may change the split.'}</p>
    <div className="grid gap-6 sm:grid-cols-2"><OriginalsMasterRoyaltySplit shares={shares.master} roles={project.requestedRoles} columns={2} /><OriginalsRoyaltySplit title="Songwriting royalties — separate income" shares={shares.composition} roles={project.requestedRoles} /></div>
    {SHOW_EARNINGS_EXAMPLES && <section className="mt-6 border-t pt-4"><h3 className="font-semibold">Low, medium & high examples — per year</h3><p className="mt-1 text-sm text-gray-600">Possible yearly income for this project, using illustrative assumptions rather than earnings forecasts. For recording examples, enter annual master receipts before TSC’s separate management share. The calculator takes that share out once, then applies the participant percentage to the remaining pool. Songwriting uses its own separate income and is unaffected by this master-income share. Personal tax is not estimated.</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="text-sm">Income pool<select className="mt-1 block w-full rounded border p-2" value={pool} onChange={event => { setPool(event.target.value); setRecipient('0'); }}><option value="master">Recording (master)</option><option value="composition">Songwriting</option></select></label><label className="text-sm">Share to illustrate<select className="mt-1 block w-full rounded border p-2" value={selected ? String(selectedShares.indexOf(selected)) : ''} onChange={event => setRecipient(event.target.value)} disabled={!selectedShares.length}>{selectedShares.length ? selectedShares.map((share, index) => <option key={index} value={index}>{share.role} — {percent(share.percent)}{pool === 'master' ? isTscRoyaltyShare(share) ? ' of master receipts' : ' of remaining pool' : ''}</option>) : <option value="">Shares not yet known</option>}</select></label></div>
      {pool === 'master' ? <div className="mt-4 rounded-lg border bg-white p-3"><label className="block text-sm font-medium">Streaming example assumption — £ in master receipts per eligible stream, before TSC’s share<input aria-label="Assumed recording income per stream" type="number" min="0.000001" step="any" value={streamAssumption} onChange={event => setStreamAssumption(event.target.value)} className="mt-2 block w-full max-w-xs rounded border p-2 font-normal" /></label><p className="mt-2 text-xs text-gray-600">The starting £0.004 is an example chosen for this calculator, not a quoted or guaranteed platform rate. Actual receipts vary. <a href="https://artists.spotify.com/en/royalties-guide" target="_blank" rel="noopener noreferrer" className="underline">How streaming royalties work</a></p></div> : <p className="mt-3 text-xs text-gray-600">Songwriting examples use annual songwriting receipts. The recording-stream assumption does not apply to this separate pool.</p>}
      <div className="mt-4 grid gap-3 sm:grid-cols-3">{['Low', 'Medium', 'High'].map((label, index) => {
        const streams = streamsForAnnualIncome(amounts[index], streamAssumption);
        return <div key={label} className="min-w-0 rounded-lg bg-slate-50 p-3"><label className="block text-sm font-semibold">{label} example — {pool === 'master' ? 'master receipts £ per year (before TSC)' : 'songwriting receipts £ per year'}<input aria-label={`${label} annual income`} type="number" min="0" max="1000000000" step="1" value={amounts[index]} onChange={event => setAmounts(current => current.map((value, i) => i === index ? event.target.value : value))} className="mt-2 w-full rounded border bg-white p-2 font-normal" /></label>
          <p className="mt-3 text-xs text-gray-600" data-example="activity">{pool === 'master' ? streams === null ? 'Enter a positive streaming assumption to see an example.' : `For example: approximately ${streams.toLocaleString('en-GB')} eligible streams per year, at the assumption above, would produce ${money(royaltyAmount(amounts[index], 100))} in master receipts before TSC’s share.` : `For example: yearly songwriting receipts of ${money(royaltyAmount(amounts[index], 100))} — equivalent to an average ${money(royaltyAmount(amounts[index], 100) / 12)} per month, rather than an assumed stream payout.`}</p>
          {pool === 'master' && <p className="mt-2 text-xs text-gray-600" data-example="remaining-pool">Remaining participant pool after TSC’s {percent(masterPool.tscPercent)}: {money(royaltyAmount(amounts[index], masterPool.remainingPercent))} / year.</p>}
          <p className="mt-3 text-sm">{selected ? `${selected.role} receives per year` : 'Select a known split to calculate'}</p>{selected && <p className="mt-1 text-lg font-semibold" aria-live="polite">{money(royaltyIllustrationAmount({ annualIncome: amounts[index], share: selected, pool, remainingPercent: masterPool.remainingPercent }))} / year</p>}</div>;
      })}</div>
    </section>}
  </details>;
}
