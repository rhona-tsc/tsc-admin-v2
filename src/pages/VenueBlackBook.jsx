import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { backendUrl } from "../App";

const blankVenue = { name: "", address: "", postcode: "", website: "", photoUrl: "", photoPublicId: "", photoAlt: "", photoSourceUrl: "", googleMapsUrl: "", what3wordsUrl: "", parking: "", generalDirections: "", supplierRequirements: "", generalNotes: "", rooms: [] };
const blankRoom = { name: "", performanceArea: "", accessAndLoading: "", changingRoom: "", soundLimitations: "", soundLimiterDb: "", curfewAndCloseTime: "", paAndLighting: "", powerAndStage: "", capacity: "", notes: "" };
const Field = ({ label, value, onChange, multiline = false, placeholder = "", attention = false }) => (
  <label className="block text-sm font-semibold text-slate-700">
    {label}
    {multiline ? <textarea rows={3} className={`mt-1 w-full rounded-xl border px-3 py-2 font-normal ${attention ? "border-amber-500 bg-amber-50 ring-2 ring-amber-200" : "border-slate-300"}`} value={value || ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} /> : <input className={`mt-1 w-full rounded-xl border px-3 py-2 font-normal ${attention ? "border-amber-500 bg-amber-50 ring-2 ring-amber-200" : "border-slate-300"}`} value={value || ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />}
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
  const [importPreviews, setImportPreviews] = useState([]);
  const [importing, setImporting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
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

  const deleteVenue = async () => {
    if (!selectedId) return;
    const venueName = draft.name || "this venue";
    if (!window.confirm(`Delete ${venueName}? This will remove its rooms, visit history and band feedback from the Venue Little Black Book.`)) return;
    setSaving(true);
    try {
      await axios.delete(`${backendUrl}/api/venues/${selectedId}`, { headers });
      setSelectedId(""); setDraft(blankVenue); await load(); toast.success(`${venueName} deleted`);
    } catch (error) { toast.error(error.response?.data?.message || "Could not delete venue"); }
    finally { setSaving(false); }
  };

  const uploadPhoto = async (files) => {
    const file = files?.[0];
    if (!file) return;
    if (!selectedId) return toast.error("Save the venue before adding its photo");
    setUploadingPhoto(true);
    try {
      const form = new FormData();
      form.append("photo", file);
      form.append("photoAlt", draft.photoAlt || `${draft.name} wedding venue`);
      form.append("photoSourceUrl", draft.photoSourceUrl || draft.website || "");
      const { data } = await axios.post(`${backendUrl}/api/venues/${selectedId}/photo`, form, { headers });
      setDraft((old) => ({ ...old, photoUrl: data.venue.photoUrl, photoPublicId: data.venue.photoPublicId, photoAlt: data.venue.photoAlt, photoSourceUrl: data.venue.photoSourceUrl }));
      await load();
      toast.success("Venue photo saved");
    } catch (error) { toast.error(error.response?.data?.message || "Could not upload the venue photo"); }
    finally { setUploadingPhoto(false); }
  };

  const removePhoto = async () => {
    if (!selectedId || !draft.photoUrl || !window.confirm("Remove this venue photo?")) return;
    setUploadingPhoto(true);
    try {
      await axios.delete(`${backendUrl}/api/venues/${selectedId}/photo`, { headers });
      setDraft((old) => ({ ...old, photoUrl: "", photoPublicId: "", photoAlt: "", photoSourceUrl: "" }));
      await load();
      toast.success("Venue photo removed");
    } catch (error) { toast.error(error.response?.data?.message || "Could not remove the venue photo"); }
    finally { setUploadingPhoto(false); }
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

  const previewEventSheets = async (files) => {
    if (!files?.length) return;
    setImporting(true);
    try {
      const form = new FormData();
      [...files].forEach((file) => form.append("eventSheets", file));
      const { data } = await axios.post(`${backendUrl}/api/venues/imports/event-sheets/preview`, form, { headers });
      setImportPreviews((data.previews || []).map((item) => ({
        ...item,
        selected: true,
        matchVenueId: item.possibleMatch?._id || "",
        roomReviewed: !(item.reviewFlags || []).some((flag) => flag.field === "roomName"),
      })));
      toast.success(`Read ${data.previews?.length || 0} event sheets — please review before importing`);
    } catch (error) { toast.error(error.response?.data?.message || "Could not read the event sheets"); }
    finally { setImporting(false); }
  };

  const updatePreview = (index, path, value) => setImportPreviews((old) => old.map((item, itemIndex) => {
    if (itemIndex !== index) return item;
    const next = structuredClone(item);
    const keys = path.split(".");
    let target = next;
    keys.slice(0, -1).forEach((key) => { target = target[key]; });
    target[keys.at(-1)] = value;
    return next;
  }));

  const confirmEventSheetImport = async () => {
    const imports = importPreviews.filter((item) => item.selected);
    if (!imports.length) return toast.error("Select at least one event sheet to import");
    const unreviewedRoom = imports.find((item) =>
      item.venue?.rooms?.[0]?.name === "Main / unspecified room" && !item.roomReviewed
    );
    if (unreviewedRoom) {
      return toast.error(`Check the room / space for ${unreviewedRoom.fileName} before importing`);
    }
    setImporting(true);
    try {
      const { data } = await axios.post(`${backendUrl}/api/venues/imports/event-sheets/confirm`, { imports }, { headers });
      const created = data.results.filter((item) => item.status === "created").length;
      const merged = data.results.filter((item) => item.status === "merged").length;
      setImportPreviews([]); await load(); toast.success(`Imported ${created} new venues and merged ${merged} existing venues`);
    } catch (error) { toast.error(error.response?.data?.message || "Could not import the reviewed event sheets"); }
    finally { setImporting(false); }
  };

  return <div className="mx-auto max-w-[1500px] p-5 lg:p-8">
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-xs font-bold uppercase tracking-[.24em] text-[#ff6667]">Operations knowledge</p><h1 className="text-3xl font-bold text-slate-900">Venue Little Black Book</h1><p className="mt-1 max-w-3xl text-slate-600">One venue record, separate room details, past bands and practical notes from every event.</p></div>
      <div className="flex flex-wrap gap-2"><label className="cursor-pointer rounded-xl border border-slate-300 bg-white px-4 py-2 font-semibold"><input type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" multiple className="hidden" disabled={importing} onChange={(event) => { previewEventSheets(event.target.files); event.target.value = ""; }} />{importing ? "Reading event sheets…" : "Upload event sheets"}</label><button onClick={syncBookings} disabled={saving} className="rounded-xl border border-slate-300 bg-white px-4 py-2 font-semibold">Import website bookings</button><button onClick={() => { setSelectedId(""); setDraft(blankVenue); }} className="rounded-xl bg-black px-4 py-2 font-semibold text-white">+ Add venue</button></div>
    </div>
    {!!importPreviews.length && <section className="mb-6 rounded-2xl border-2 border-sky-300 bg-sky-50 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-bold text-slate-900">Review event-sheet import</h2><p className="text-sm text-slate-600">Check the extracted venue and room details. Untick anything you do not want to import.</p></div><button onClick={() => setImportPreviews([])} className="text-sm font-semibold underline">Cancel import</button></div>
      <div className="mt-4 space-y-4">{importPreviews.map((item, index) => <article key={`${item.fileName}-${index}`} className="rounded-xl border border-sky-200 bg-white p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3"><label className="flex items-center gap-2 font-bold"><input type="checkbox" checked={item.selected} onChange={(event) => updatePreview(index, "selected", event.target.checked)} />{item.fileName}</label><span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">Review needed</span></div>
        {item.possibleMatch && <label className="mb-3 block rounded-lg bg-amber-50 p-3 text-sm"><span className="font-bold">Possible existing venue:</span> {item.possibleMatch.name} · {item.possibleMatch.address}<select className="ml-3 rounded-lg border bg-white px-2 py-1" value={item.matchVenueId} onChange={(event) => updatePreview(index, "matchVenueId", event.target.value)}><option value={item.possibleMatch._id}>Merge with this venue</option><option value="">Create as a new venue</option></select></label>}
        {(item.reviewFlags || []).some((flag) => flag.field === "roomName") && <div className="mb-3 rounded-xl border border-amber-400 bg-amber-50 p-3 text-sm text-amber-950"><p className="font-bold">Room name needs checking</p><p className="mt-1">We could not confidently identify a room or performance-space name. Check the Performance area text below, then enter the room name or confirm that it genuinely is unspecified.</p><label className="mt-2 flex items-center gap-2 font-semibold"><input type="checkbox" checked={Boolean(item.roomReviewed)} onChange={(event) => updatePreview(index, "roomReviewed", event.target.checked)} />I have checked the room information</label></div>}
        <div className="grid gap-3 md:grid-cols-3"><Field label="Venue name" value={item.venue.name} onChange={(value) => updatePreview(index, "venue.name", value)} /><div className="md:col-span-2"><Field label="Address" value={item.venue.address} onChange={(value) => updatePreview(index, "venue.address", value)} /></div><Field label="Postcode" value={item.venue.postcode} onChange={(value) => updatePreview(index, "venue.postcode", value)} /><Field label="County" value={item.venue.county} onChange={(value) => updatePreview(index, "venue.county", value)} /><Field label="Room / space" value={item.venue.rooms?.[0]?.name} attention={item.venue.rooms?.[0]?.name === "Main / unspecified room" && !item.roomReviewed} onChange={(value) => updatePreview(index, "venue.rooms.0.name", value)} /><Field label="Parking" value={item.venue.parking} onChange={(value) => updatePreview(index, "venue.parking", value)} multiline /><Field label="Access & special directions" value={item.venue.generalDirections} onChange={(value) => { updatePreview(index, "venue.generalDirections", value); updatePreview(index, "venue.rooms.0.accessAndLoading", value); }} multiline /><Field label="Performance area" value={item.venue.rooms?.[0]?.performanceArea} attention={item.venue.rooms?.[0]?.name === "Main / unspecified room" && !item.roomReviewed} onChange={(value) => updatePreview(index, "venue.rooms.0.performanceArea", value)} multiline /><Field label="Changing room" value={item.venue.rooms?.[0]?.changingRoom} onChange={(value) => updatePreview(index, "venue.rooms.0.changingRoom", value)} multiline /><Field label="Sound limitations" value={item.venue.rooms?.[0]?.soundLimitations} onChange={(value) => updatePreview(index, "venue.rooms.0.soundLimitations", value)} multiline /><Field label="Limiter level" value={item.venue.rooms?.[0]?.soundLimiterDb} onChange={(value) => updatePreview(index, "venue.rooms.0.soundLimiterDb", value)} /><Field label="Curfew / close time" value={item.venue.rooms?.[0]?.curfewAndCloseTime} onChange={(value) => updatePreview(index, "venue.rooms.0.curfewAndCloseTime", value)} multiline /><Field label="PA & lighting" value={item.venue.rooms?.[0]?.paAndLighting} onChange={(value) => updatePreview(index, "venue.rooms.0.paAndLighting", value)} multiline /><Field label="Capacity / room size" value={item.venue.rooms?.[0]?.capacity} onChange={(value) => updatePreview(index, "venue.rooms.0.capacity", value)} multiline /></div>
      </article>)}</div>
      <div className="mt-4 flex justify-end"><button onClick={confirmEventSheetImport} disabled={importing} className="rounded-xl bg-sky-700 px-5 py-3 font-bold text-white disabled:opacity-50">{importing ? "Importing…" : `Import ${importPreviews.filter((item) => item.selected).length} reviewed event sheets`}</button></div>
    </section>}
    <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
      <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search venue, address or band" className="mb-3 w-full rounded-xl border border-slate-300 px-3 py-2" />
        <div className="max-h-[72vh] space-y-2 overflow-auto">{loading ? <p className="p-3 text-slate-500">Loading venues…</p> : shown.map((venue) => <button key={venue._id} onClick={() => choose(venue)} className={`w-full rounded-xl border p-3 text-left ${selectedId === venue._id ? "border-[#ff6667] bg-[#fff5f5]" : "border-slate-200 hover:bg-slate-50"}`}><div className="flex gap-3">{venue.photoUrl && <img src={venue.photoUrl} alt="" className="h-16 w-20 shrink-0 rounded-lg object-cover" />}<div className="min-w-0"><div className="font-bold text-slate-900">{venue.name}</div><div className="mt-1 text-xs text-slate-500">{venue.address || "Address to review"}</div><div className="mt-2 flex gap-2 text-xs"><span className="rounded-full bg-slate-100 px-2 py-1">{venue.rooms?.length || 0} rooms</span><span className="rounded-full bg-slate-100 px-2 py-1">{venue.visits?.length || 0} gigs</span></div></div></div></button>)}</div>
      </aside>
      <main className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <section>
          <div className="mb-3"><h2 className="text-xl font-bold">Venue promotional photo</h2><p className="text-sm text-slate-500">Use the main landscape promotional image from the venue's official website. It appears on the public venue profile and wedding-location cards; event-sheet images are not used.</p></div>
          {draft.photoUrl && <img src={draft.photoUrl} alt={draft.photoAlt || `${draft.name} wedding venue`} className="mb-4 aspect-[8/5] max-h-[430px] w-full rounded-2xl object-cover" />}
          <div className="flex flex-wrap items-end gap-3">
            <label className={`rounded-xl border border-slate-300 bg-white px-4 py-2 font-semibold ${!selectedId || uploadingPhoto ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}><input type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="hidden" disabled={!selectedId || uploadingPhoto} onChange={(event) => { uploadPhoto(event.target.files); event.target.value = ""; }} />{uploadingPhoto ? "Uploading…" : draft.photoUrl ? "Replace photo" : "Add venue photo"}</label>
            {draft.photoUrl && <button type="button" onClick={removePhoto} disabled={uploadingPhoto} className="rounded-xl border border-red-300 bg-white px-4 py-2 font-semibold text-red-700 disabled:opacity-50">Remove photo</button>}
            {!selectedId && <span className="text-sm text-slate-500">Save this venue first, then add its photo.</span>}
          </div>
          <div className="mt-3 grid max-w-4xl gap-3 md:grid-cols-2"><Field label="Photo description (for accessibility)" value={draft.photoAlt} placeholder={draft.name ? `${draft.name} wedding venue` : "Describe the venue shown in the photo"} onChange={(v) => set("photoAlt", v)} /><Field label="Photo source page" value={draft.photoSourceUrl} placeholder={draft.website || "Official venue webpage containing the photo"} onChange={(v) => set("photoSourceUrl", v)} /></div>
        </section>
        <div className="grid gap-4 md:grid-cols-2"><Field label="Venue name" value={draft.name} onChange={(v) => set("name", v)} /><Field label="Postcode" value={draft.postcode} onChange={(v) => set("postcode", v)} /><div className="md:col-span-2"><Field label="Address" value={draft.address} onChange={(v) => set("address", v)} /></div><Field label="Venue website" value={draft.website} onChange={(v) => set("website", v)} /><Field label="Google Maps pin" value={draft.googleMapsUrl} onChange={(v) => set("googleMapsUrl", v)} /><Field label="what3words pin" value={draft.what3wordsUrl} onChange={(v) => set("what3wordsUrl", v)} /><Field label="Parking" value={draft.parking} onChange={(v) => set("parking", v)} multiline /><Field label="General arrival / loading directions" value={draft.generalDirections} onChange={(v) => set("generalDirections", v)} multiline /><Field label="Supplier forms and requirements" value={draft.supplierRequirements} onChange={(v) => set("supplierRequirements", v)} multiline /><Field label="General venue notes" value={draft.generalNotes} onChange={(v) => set("generalNotes", v)} multiline /></div>
        <section className="border-t pt-5"><div className="mb-3 flex items-center justify-between"><div><h2 className="text-xl font-bold">Rooms and performance spaces</h2><p className="text-sm text-slate-500">Keep restrictions and access notes against the correct room.</p></div><button onClick={() => set("rooms", [...(draft.rooms || []), { ...blankRoom }])} className="rounded-lg border px-3 py-2 font-semibold">+ Add room</button></div>
          <div className="space-y-4">{(draft.rooms || []).map((room, index) => <div key={room._id || index} className="rounded-xl border border-slate-200 bg-slate-50 p-4"><div className="grid gap-3 md:grid-cols-2"><Field label="Room / space name" value={room.name} onChange={(v) => setRoom(index, "name", v)} /><Field label="Capacity / room size" value={room.capacity} onChange={(v) => setRoom(index, "capacity", v)} /><Field label="Performance area" value={room.performanceArea} onChange={(v) => setRoom(index, "performanceArea", v)} multiline /><Field label="Access and loading" value={room.accessAndLoading} onChange={(v) => setRoom(index, "accessAndLoading", v)} multiline /><Field label="Changing / green room" value={room.changingRoom} onChange={(v) => setRoom(index, "changingRoom", v)} multiline /><Field label="Sound limitations" value={room.soundLimitations} onChange={(v) => setRoom(index, "soundLimitations", v)} multiline /><Field label="Sound limiter dB" value={room.soundLimiterDb} onChange={(v) => setRoom(index, "soundLimiterDb", v)} /><Field label="Curfew / close time" value={room.curfewAndCloseTime} onChange={(v) => setRoom(index, "curfewAndCloseTime", v)} /><Field label="PA and lighting" value={room.paAndLighting} onChange={(v) => setRoom(index, "paAndLighting", v)} multiline /><Field label="Power / stage notes" value={room.powerAndStage} onChange={(v) => setRoom(index, "powerAndStage", v)} multiline /></div></div>)}</div>
        </section>
        {selectedId && <section className="grid gap-4 border-t pt-5 md:grid-cols-2"><div><h2 className="font-bold">Bands that have performed here</h2><div className="mt-2 space-y-2">{(draft.visits || []).length ? [...draft.visits].sort((a,b) => new Date(b.eventDate || 0)-new Date(a.eventDate || 0)).map((visit, i) => <div key={`${visit.bookingId}-${i}`} className="rounded-lg bg-slate-50 p-3 text-sm"><b>{visit.actName || "Act not recorded"}</b>{visit.roomName ? ` · ${visit.roomName}` : ""}<div className="text-slate-500">{visit.eventDate ? new Date(visit.eventDate).toLocaleDateString("en-GB") : "Date not recorded"}</div></div>) : <p className="text-sm text-slate-500">No linked gigs yet.</p>}</div></div><div><h2 className="font-bold">Band member feedback</h2><div className="mt-2 grid gap-2 sm:grid-cols-2"><input className="rounded-lg border px-3 py-2 text-sm" placeholder="Band member name" value={feedbackAuthor} onChange={(e) => setFeedbackAuthor(e.target.value)} /><select className="rounded-lg border px-3 py-2 text-sm" value={feedbackRoom} onChange={(e) => setFeedbackRoom(e.target.value)}><option value="">Venue generally</option>{(draft.rooms || []).map((room, i) => <option key={room._id || i} value={room.name}>{room.name}</option>)}</select><textarea className="rounded-lg border px-3 py-2 text-sm sm:col-span-2" rows={3} placeholder="What should the next band know?" value={feedbackNote} onChange={(e) => setFeedbackNote(e.target.value)} /><button onClick={addFeedback} disabled={saving} className="rounded-lg bg-amber-500 px-3 py-2 text-sm font-bold sm:col-span-2">Add feedback note</button></div><div className="mt-3 space-y-2">{(draft.feedback || []).length ? draft.feedback.map((item) => <div key={item._id} className="rounded-lg bg-amber-50 p-3 text-sm"><b>{item.authorName || "Band member"}</b>{item.roomName ? ` · ${item.roomName}` : ""}<p className="mt-1">{item.note}</p></div>) : <p className="text-sm text-slate-500">No feedback recorded yet.</p>}</div></div></section>}
        <div className="sticky bottom-3 flex flex-wrap justify-end gap-3">{selectedId && <button onClick={deleteVenue} disabled={saving} className="rounded-xl border border-red-300 bg-white px-5 py-3 font-bold text-red-700 shadow-lg disabled:opacity-50">Delete venue</button>}<button onClick={save} disabled={saving} className="rounded-xl bg-emerald-700 px-6 py-3 font-bold text-white shadow-lg disabled:opacity-50">{saving ? "Saving…" : "Save venue"}</button></div>
      </main>
    </div>
  </div>;
}
