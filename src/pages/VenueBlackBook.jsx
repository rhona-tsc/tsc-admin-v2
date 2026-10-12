import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { backendUrl } from "../App";

const blankVenue = { name: "", address: "", postcode: "", googleMapsUrl: "", what3wordsUrl: "", parking: "", generalDirections: "", supplierRequirements: "", generalNotes: "", rooms: [] };
const blankRoom = { name: "", performanceArea: "", accessAndLoading: "", changingRoom: "", soundLimitations: "", soundLimiterDb: "", curfewAndCloseTime: "", paAndLighting: "", powerAndStage: "", capacity: "", notes: "" };
const Field = ({ label, value, onChange, multiline = false, placeholder = "" }) => (
  <label className="block text-sm font-semibold text-slate-700">
    {label}
    {multiline ? <textarea rows={3} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 font-normal" value={value || ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} /> : <input className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 font-normal" value={value || ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />}
  </label>
);

export default function VenueBlackBook({ token }) {
  const [venues, setVenues] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [draft, setDraft] = useState(blankVenue);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedbackNote, setFeedbackNote] = useState("");
  const [feedbackAuthor, setFeedbackAuthor] = useState("");
  const [feedbackRoom, setFeedbackRoom] = useState("");
  const headers = useMemo(() => ({ Authorization: `Bearer ${token || localStorage.getItem("token") || ""}` }), [token]);

  const load = async () => {
    setLoading(true);
    try { const { data } = await axios.get(`${backendUrl}/api/venues`, { headers }); setVenues(data.venues || []); }
    catch (error) { toast.error(error.response?.data?.message || "Could not load venues"); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const shown = venues.filter((v) => [v.name, v.address, v.postcode, ...(v.aliases || []), ...(v.visits || []).map((x) => x.actName)].join(" ").toLowerCase().includes(query.toLowerCase()));
  const choose = (venue) => { setSelectedId(venue._id); setDraft(JSON.parse(JSON.stringify(venue))); };
  const set = (key, value) => setDraft((old) => ({ ...old, [key]: value }));
  const setRoom = (index, key, value) => setDraft((old) => ({ ...old, rooms: old.rooms.map((room, i) => i === index ? { ...room, [key]: value } : room) }));

  const save = async () => {
    if (!draft.name.trim()) return toast.error("Please add a venue name");
    setSaving(true);
    try {
      const { data } = selectedId
        ? await axios.put(`${backendUrl}/api/venues/${selectedId}`, draft, { headers })
        : await axios.post(`${backendUrl}/api/venues`, draft, { headers });
      setSelectedId(data.venue._id); setDraft(data.venue); await load(); toast.success("Venue saved");
    } catch (error) { toast.error(error.response?.data?.message || "Could not save venue"); }
    finally { setSaving(false); }
  };

  const syncBookings = async () => {
    setSaving(true);
    try { const { data } = await axios.post(`${backendUrl}/api/venues/sync/bookings`, {}, { headers }); await load(); toast.success(`Checked ${data.total} bookings and updated ${data.imported} venue records`); }
    catch (error) { toast.error(error.response?.data?.message || "Could not import bookings"); }
    finally { setSaving(false); }
  };

  const addFeedback = async () => {
    if (!selectedId || !feedbackNote.trim()) return toast.error("Please add the band member's note");
    setSaving(true);
    try {
      const { data } = await axios.post(`${backendUrl}/api/venues/${selectedId}/feedback`, { note: feedbackNote, authorName: feedbackAuthor, roomName: feedbackRoom }, { headers });
      setDraft(data.venue); setFeedbackNote(""); setFeedbackAuthor(""); setFeedbackRoom(""); await load(); toast.success("Feedback added");
    } catch (error) { toast.error(error.response?.data?.message || "Could not add feedback"); }
    finally { setSaving(false); }
  };

  return <div className="mx-auto max-w-[1500px] p-5 lg:p-8">
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-xs font-bold uppercase tracking-[.24em] text-[#ff6667]">Operations knowledge</p><h1 className="text-3xl font-bold text-slate-900">Venue Little Black Book</h1><p className="mt-1 max-w-3xl text-slate-600">One venue record, separate room details, past bands and practical notes from every event.</p></div>
      <div className="flex gap-2"><button onClick={syncBookings} disabled={saving} className="rounded-xl border border-slate-300 bg-white px-4 py-2 font-semibold">Import website bookings</button><button onClick={() => { setSelectedId(""); setDraft(blankVenue); }} className="rounded-xl bg-black px-4 py-2 font-semibold text-white">+ Add venue</button></div>
    </div>
    <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
      <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search venue, address or band" className="mb-3 w-full rounded-xl border border-slate-300 px-3 py-2" />
        <div className="max-h-[72vh] space-y-2 overflow-auto">{loading ? <p className="p-3 text-slate-500">Loading venues…</p> : shown.map((venue) => <button key={venue._id} onClick={() => choose(venue)} className={`w-full rounded-xl border p-3 text-left ${selectedId === venue._id ? "border-[#ff6667] bg-[#fff5f5]" : "border-slate-200 hover:bg-slate-50"}`}><div className="font-bold text-slate-900">{venue.name}</div><div className="mt-1 text-xs text-slate-500">{venue.address || "Address to review"}</div><div className="mt-2 flex gap-2 text-xs"><span className="rounded-full bg-slate-100 px-2 py-1">{venue.rooms?.length || 0} rooms</span><span className="rounded-full bg-slate-100 px-2 py-1">{venue.visits?.length || 0} gigs</span></div></button>)}</div>
      </aside>
      <main className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2"><Field label="Venue name" value={draft.name} onChange={(v) => set("name", v)} /><Field label="Postcode" value={draft.postcode} onChange={(v) => set("postcode", v)} /><div className="md:col-span-2"><Field label="Address" value={draft.address} onChange={(v) => set("address", v)} /></div><Field label="Google Maps pin" value={draft.googleMapsUrl} onChange={(v) => set("googleMapsUrl", v)} /><Field label="what3words pin" value={draft.what3wordsUrl} onChange={(v) => set("what3wordsUrl", v)} /><Field label="Parking" value={draft.parking} onChange={(v) => set("parking", v)} multiline /><Field label="General arrival / loading directions" value={draft.generalDirections} onChange={(v) => set("generalDirections", v)} multiline /><Field label="Supplier forms and requirements" value={draft.supplierRequirements} onChange={(v) => set("supplierRequirements", v)} multiline /><Field label="General venue notes" value={draft.generalNotes} onChange={(v) => set("generalNotes", v)} multiline /></div>
        <section className="border-t pt-5"><div className="mb-3 flex items-center justify-between"><div><h2 className="text-xl font-bold">Rooms and performance spaces</h2><p className="text-sm text-slate-500">Keep restrictions and access notes against the correct room.</p></div><button onClick={() => set("rooms", [...(draft.rooms || []), { ...blankRoom }])} className="rounded-lg border px-3 py-2 font-semibold">+ Add room</button></div>
          <div className="space-y-4">{(draft.rooms || []).map((room, index) => <div key={room._id || index} className="rounded-xl border border-slate-200 bg-slate-50 p-4"><div className="grid gap-3 md:grid-cols-2"><Field label="Room / space name" value={room.name} onChange={(v) => setRoom(index, "name", v)} /><Field label="Capacity / room size" value={room.capacity} onChange={(v) => setRoom(index, "capacity", v)} /><Field label="Performance area" value={room.performanceArea} onChange={(v) => setRoom(index, "performanceArea", v)} multiline /><Field label="Access and loading" value={room.accessAndLoading} onChange={(v) => setRoom(index, "accessAndLoading", v)} multiline /><Field label="Changing / green room" value={room.changingRoom} onChange={(v) => setRoom(index, "changingRoom", v)} multiline /><Field label="Sound limitations" value={room.soundLimitations} onChange={(v) => setRoom(index, "soundLimitations", v)} multiline /><Field label="Sound limiter dB" value={room.soundLimiterDb} onChange={(v) => setRoom(index, "soundLimiterDb", v)} /><Field label="Curfew / close time" value={room.curfewAndCloseTime} onChange={(v) => setRoom(index, "curfewAndCloseTime", v)} /><Field label="PA and lighting" value={room.paAndLighting} onChange={(v) => setRoom(index, "paAndLighting", v)} multiline /><Field label="Power / stage notes" value={room.powerAndStage} onChange={(v) => setRoom(index, "powerAndStage", v)} multiline /></div></div>)}</div>
        </section>
        {selectedId && <section className="grid gap-4 border-t pt-5 md:grid-cols-2"><div><h2 className="font-bold">Bands that have performed here</h2><div className="mt-2 space-y-2">{(draft.visits || []).length ? [...draft.visits].sort((a,b) => new Date(b.eventDate || 0)-new Date(a.eventDate || 0)).map((visit, i) => <div key={`${visit.bookingId}-${i}`} className="rounded-lg bg-slate-50 p-3 text-sm"><b>{visit.actName || "Act not recorded"}</b>{visit.roomName ? ` · ${visit.roomName}` : ""}<div className="text-slate-500">{visit.eventDate ? new Date(visit.eventDate).toLocaleDateString("en-GB") : "Date not recorded"}</div></div>) : <p className="text-sm text-slate-500">No linked gigs yet.</p>}</div></div><div><h2 className="font-bold">Band member feedback</h2><div className="mt-2 grid gap-2 sm:grid-cols-2"><input className="rounded-lg border px-3 py-2 text-sm" placeholder="Band member name" value={feedbackAuthor} onChange={(e) => setFeedbackAuthor(e.target.value)} /><select className="rounded-lg border px-3 py-2 text-sm" value={feedbackRoom} onChange={(e) => setFeedbackRoom(e.target.value)}><option value="">Venue generally</option>{(draft.rooms || []).map((room, i) => <option key={room._id || i} value={room.name}>{room.name}</option>)}</select><textarea className="rounded-lg border px-3 py-2 text-sm sm:col-span-2" rows={3} placeholder="What should the next band know?" value={feedbackNote} onChange={(e) => setFeedbackNote(e.target.value)} /><button onClick={addFeedback} disabled={saving} className="rounded-lg bg-amber-500 px-3 py-2 text-sm font-bold sm:col-span-2">Add feedback note</button></div><div className="mt-3 space-y-2">{(draft.feedback || []).length ? draft.feedback.map((item) => <div key={item._id} className="rounded-lg bg-amber-50 p-3 text-sm"><b>{item.authorName || "Band member"}</b>{item.roomName ? ` · ${item.roomName}` : ""}<p className="mt-1">{item.note}</p></div>) : <p className="text-sm text-slate-500">No feedback recorded yet.</p>}</div></div></section>}
        <div className="sticky bottom-3 flex justify-end"><button onClick={save} disabled={saving} className="rounded-xl bg-emerald-700 px-6 py-3 font-bold text-white shadow-lg disabled:opacity-50">{saving ? "Saving…" : "Save venue"}</button></div>
      </main>
    </div>
  </div>;
}
