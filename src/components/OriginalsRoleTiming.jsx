import { formatOriginalsDeadline } from '../utils/originalsDeadlines';

export default function OriginalsRoleTiming({ role, readOnly = false }) {
  if (role.timingState === 'complete') return null;
  const slots = (role.slots || []).filter(slot => slot.state === 'submitted' ||
    (slot.state === 'active' && formatOriginalsDeadline(slot.expectedBy)));
  if (slots.length) return <ul aria-label={`${role.name} slot deadlines`} className="mt-2 space-y-2 text-xs text-gray-700">
    {slots.map((slot, index) => <li key={slot.slotNumber || index}>
      <span className="font-medium">{slot.isOwn && !readOnly ? 'Your slot' : `Slot ${slot.slotNumber || index + 1}`}</span>
      {slot.state === 'submitted' ? <span> · Submitted — awaiting review</span> : <span className="block">Expected by: <time dateTime={slot.expectedBy}>{formatOriginalsDeadline(slot.expectedBy)}</time></span>}
    </li>)}
  </ul>;
  const pending = role.timingState === 'future_round' || role.canReserveAhead
    ? 'Date confirmed when this round opens.'
    : role.timingState === 'awaiting_reservation' ? '24 hours after a slot is reserved.'
    : role.timingState === 'review' ? '' : 'Not yet confirmed.';
  return pending ? <p className="mt-2 text-xs text-gray-500">Expected by: {pending}</p> : null;
}
