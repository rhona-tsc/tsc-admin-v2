export default function OriginalsRoleStatus({ role }) {
  const approved = role.timingState === 'complete';
  const future = !approved && (role.timingState === 'future_round' || role.canReserveAhead);
  const label = approved ? 'Recording approved' : future ? 'Awaiting its round to open'
    : role.timingState === 'reserved' ? 'Awaiting recording' : role.status || 'Awaiting recording';
  const colour = approved ? 'text-emerald-400' : future ? 'text-red-400' : 'text-orange-400';
  return <p className="mt-1 flex items-center gap-2 text-xs text-gray-600" aria-label="Recording status">
    <svg aria-hidden="true" viewBox="0 0 24 24" className={`h-4 w-4 shrink-0 ${colour}`} fill="currentColor">
      <circle cx="12" cy="12" r="10" />
      {approved ? <path d="m7.5 12 3 3 6-6" fill="none" stroke="#052e16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        : future ? <path d="M8 12h8" stroke="#450a0a" strokeWidth="2" strokeLinecap="round" />
        : <path d="M12 6.5V12l3.5 2" fill="none" stroke="#431407" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
    <span>{label}</span>
  </p>;
}
