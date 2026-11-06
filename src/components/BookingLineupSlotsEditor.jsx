import React from "react";
import { BOOKING_LINEUP_ROLE_OPTIONS, buildBespokeLineupPatch } from "../utils/bookingLineup.js";

export default function BookingLineupSlotsEditor({ slots, onChange, label, disabled = false }) {
  const patch = buildBespokeLineupPatch(slots);
  const update = (index, changes) => onChange(slots.map((slot, i) => i === index ? { ...slot, ...changes } : slot));
  return (
    <div className="flex flex-col gap-2 rounded-md border border-gray-200 bg-white p-2 text-xs">
      <div className="font-semibold text-gray-800" aria-live="polite">{label || patch.lineupSelected}</div>
      <p className="text-[11px] text-gray-500">One row per musician. A singer who also plays an instrument counts once.</p>
      {slots.map((slot, index) => (
        <div key={index} className={`flex items-center gap-2 ${slot.excluded ? "text-gray-400" : "text-gray-800"}`}>
          <select
            aria-label={`Musician ${index + 1} role`}
            className={`min-w-0 flex-1 rounded border px-2 py-1 ${slot.excluded ? "bg-gray-100 line-through" : "bg-white"}`}
            value={slot.role} disabled={slot.excluded || disabled}
            onChange={event => update(index, { role: event.target.value })}
          >
            {!BOOKING_LINEUP_ROLE_OPTIONS.includes(slot.role) && <option value={slot.role}>{slot.role}</option>}
            {BOOKING_LINEUP_ROLE_OPTIONS.map(role => <option key={role} value={role}>{role}</option>)}
          </select>
          <button type="button" disabled={disabled} onClick={() => update(index, { excluded: !slot.excluded })}
            className="rounded border px-2 py-1 hover:bg-gray-50"
            aria-label={`${slot.excluded ? "Restore" : "Remove"} musician ${index + 1}`}>
            {slot.excluded ? "Restore" : "×"}
          </button>
        </div>
      ))}
      <button type="button" disabled={disabled} className="rounded border border-dashed px-2 py-1 text-left hover:bg-gray-50"
        onClick={() => onChange([...slots, { role: "Electric Guitar", excluded: false }])}>+ Add musician</button>
      {!patch.bandSize && <p className="text-amber-700">Add or restore at least one musician before saving.</p>}
    </div>
  );
}
