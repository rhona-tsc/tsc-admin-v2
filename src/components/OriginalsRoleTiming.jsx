import { formatOriginalsDeadline, originalsRoleDeadlineRange } from '../utils/originalsDeadlines';

export default function OriginalsRoleTiming({ role, readOnly = false }) {
  if (role.timingState === 'complete' || role.timingState === 'future_round' || role.canReserveAhead) return null;
  const slots = role.slots || [];
  const range = originalsRoleDeadlineRange(slots);
  const submitted = slots.filter(slot => slot.state === 'submitted');
  const own = !readOnly && slots.find(slot => slot.isOwn && slot.state === 'active' && formatOriginalsDeadline(slot.expectedBy));
  return <>
    {range && <div aria-label={`${role.name} recording deadlines`} className="mt-2 space-y-1 text-xs text-gray-700">
      {range.count === 1 ? <p><span className="font-medium">{own ? 'Your slot expires:' : 'Slot expires:'}</span> <time dateTime={range.earliest}>{formatOriginalsDeadline(range.earliest)}</time></p> : <>
        <p><span className="font-medium">Earliest slot expiry:</span> <time dateTime={range.earliest}>{formatOriginalsDeadline(range.earliest)}</time></p>
        <p><span className="font-medium">Latest slot expiry:</span> <time dateTime={range.latest}>{formatOriginalsDeadline(range.latest)}</time></p>
        {own && <p className="font-medium text-emerald-800">Your slot expires: <time dateTime={own.expectedBy}>{formatOriginalsDeadline(own.expectedBy)}</time></p>}
      </>}
    </div>}
    {!!submitted.length && <ul aria-label={`${role.name} submitted slots`} className="mt-2 space-y-1 text-xs text-gray-700">
      {submitted.map((slot, index) => <li key={slot.slotNumber || index}><span className="font-medium">{slot.isOwn && !readOnly ? 'Your slot' : `Slot ${slot.slotNumber || index + 1}`}</span> · Submitted — awaiting review</li>)}
    </ul>}
    {!range && !submitted.length && role.timingState === 'awaiting_reservation' && <p className="mt-2 text-xs text-gray-500">Expected by: 24 hours after a slot is reserved.</p>}
  </>;
}
