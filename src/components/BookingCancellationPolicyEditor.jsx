import React, { useState } from "react";

export default function BookingCancellationPolicyEditor({ row, onSave }) {
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState("");
  const [paymentBasis, setPaymentBasis] = useState("existing_terms");
  const [saving, setSaving] = useState(false);
  const show = () => {
    setSummary(row.musicianCancellationPolicy?.summary || row.musicianCancellationNotice?.summary || "");
    setPaymentBasis(row.musicianCancellationPolicy?.paymentBasis || row.musicianCancellationNotice?.paymentBasis || "existing_terms");
    setOpen(true);
  };
  const save = async () => {
    setSaving(true);
    try {
      const saved = await onSave(row._id, { musicianCancellationPolicy: { summary, paymentBasis } });
      if (saved) setOpen(false);
    } finally { setSaving(false); }
  };
  return <>
    <button type="button" onClick={show} className="mt-2 text-xs text-blue-600 underline">Musician cancellation terms</button>
    {open && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label="Musician cancellation terms">
      <div className="w-full max-w-xl rounded-xl bg-white p-5 text-left text-sm shadow-xl">
        <h2 className="text-lg font-semibold">Musician cancellation terms</h2>
        <p className="mt-1 text-gray-600">Booking {row.bookingRef || row.bookingId}. Shown on the band event sheet and Your Gigs, without naming the agency. Check the contract for this specific booking.</p>
        <label className="mt-4 block font-medium">Client cancellation summary
          <textarea value={summary} onChange={e => setSummary(e.target.value)} maxLength={4000} rows={7} className="mt-1 w-full rounded border p-2 font-normal" placeholder="Record this booking’s actual cancellation timescales and payments." />
        </label>
        <label className="mt-3 block font-medium">Musician cancellation payment
          <select value={paymentBasis} onChange={e => setPaymentBasis(e.target.value)} className="mt-1 w-full rounded border p-2 font-normal">
            <option value="existing_terms">Existing agreed musician terms</option>
            <option value="receipts_share">Agreed share of cancellation money actually received</option>
          </select>
        </label>
        <p className="mt-3 text-xs text-gray-600">Saving displays the notice and withdrawal link. It sends no message and does not change existing musician agreements. Agree any new payment terms with each musician before they accept the gig.</p>
        <div className="mt-4 flex justify-end gap-3">
          <button type="button" disabled={saving} onClick={() => setOpen(false)} className="rounded border px-3 py-2">Cancel</button>
          <button type="button" disabled={saving || !summary.trim()} onClick={save} className="rounded bg-black px-3 py-2 text-white disabled:opacity-50">{saving ? "Saving…" : "Save notice"}</button>
        </div>
      </div>
    </div>}
  </>;
}
