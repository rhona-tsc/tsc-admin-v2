import React, { useEffect, useMemo, useState } from "react";
import { backendUrl } from "../App";
import { automationSeeds } from "../data/automationSeeds";

const STORAGE_KEY = "tscAutomationPreviewRulesV1";
const boolValue = (value) => (value === true || value === "true" ? "yes" : "no");
const dateOnly = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value).slice(0, 10) : date.toISOString().slice(0, 10);
};
const addDays = (value, days) => {
  if (!value) return "Needs date";
  const date = new Date(`${dateOnly(value)}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "Needs date";
  date.setDate(date.getDate() + Number(days || 0));
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};
const text = (value) => String(value || "").trim();
const rowClient = (row) => text(row.clientFirstNames || row.clientName || row.bookerName || "Unnamed client");
const rowEmail = (row) => text(row.clientEmail || row.userEmail || row.clientEmails?.[0]?.email);
const rowRef = (row) => text(row.bookingRef || row.bookingId);
const rowDate = (row) => row.eventDateISO || row.eventDate || row.date;
const rowDj = (row) => Boolean(row.bookingDetails?.djServicesBooked || row.bookedDj || row.djBooked);
const rowPlaylist = (row) => Boolean(row.bookingDetails?.mannedPlaylist || row.bookedMannedPlaylist);
const rowWedding = (row) => /wedding/i.test(text(row.eventType)) ? "Wedding" : "Non-Wedding";

const matchesChoice = (actual, choice) => choice === "any" || boolValue(actual) === choice;

export default function Automations() {
  const [rows, setRows] = useState([]);
  const [rules, setRules] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      return Array.isArray(saved) && saved.length ? saved : automationSeeds;
    } catch {
      return automationSeeds;
    }
  });
  const [selectedId, setSelectedId] = useState(rules[0]?.id || "");
  const [query, setQuery] = useState("");
  const [global, setGlobal] = useState({ agent: "", eventType: "", bookedDj: "any" });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token") || "";
    const params = new URLSearchParams({ q: "", sortBy: "eventDateISO", sortDir: "asc" });
    fetch(`${backendUrl}/api/board/bookings?${params}`, {
      headers: token ? { Authorization: `Bearer ${token}`, token } : {},
      credentials: "include",
    })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok || !payload?.success) throw new Error(payload?.message || "Bookings could not be loaded");
        setRows(payload.rows || []);
      })
      .catch((error) => setLoadError(error.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
  }, [rules]);

  const selected = rules.find((rule) => rule.id === selectedId) || rules[0];
  const updateRule = (patch) => setRules((current) => current.map((rule) => rule.id === selected.id ? { ...rule, ...patch } : rule));
  const updateFilters = (patch) => updateRule({ filters: { ...selected.filters, ...patch } });
  const agents = useMemo(() => [...new Set(rows.map((row) => text(row.agent)).filter(Boolean))].sort(), [rows]);
  const eventTypes = useMemo(() => [...new Set(rows.map((row) => text(row.eventType)).filter(Boolean))].sort(), [rows]);
  const reviewedCount = rules.filter((rule) => rule.status === "reviewed").length;

  const matchingRows = useMemo(() => {
    if (!selected) return [];
    const f = selected.filters || {};
    return rows.filter((row) => {
      const haystack = `${rowClient(row)} ${rowEmail(row)} ${rowRef(row)}`.toLowerCase();
      if (query && !haystack.includes(query.toLowerCase())) return false;
      if (global.agent && text(row.agent) !== global.agent) return false;
      if (global.eventType && text(row.eventType) !== global.eventType) return false;
      if (!matchesChoice(rowDj(row), global.bookedDj)) return false;
      if (f.agent && text(row.agent) !== f.agent) return false;
      if (f.eventType && text(row.eventType) !== f.eventType) return false;
      if (f.weddingStatus && rowWedding(row) !== f.weddingStatus) return false;
      if (!matchesChoice(rowDj(row), f.bookedDj || "any")) return false;
      if (!matchesChoice(rowPlaylist(row), f.bookedPlaylist || "any")) return false;
      if (f.reviewStatus === "received" && !row.review?.received) return false;
      if (f.reviewStatus === "not_received" && row.review?.received) return false;
      return true;
    });
  }, [rows, selected, query, global]);

  if (!selected) return <div className="p-6">No automation templates were imported.</div>;

  const selectClass = "rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700";
  const inputClass = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-sky-500 focus:outline-none";

  return (
    <div className="min-w-0 space-y-5 bg-[#f6f7fb] p-3 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Automations</h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-600">Preview and reconcile the Monday email rules. Sending is locked while the imported conditions are reviewed.</p>
          <p className="mt-2 text-xs font-medium text-slate-500">Review progress: {reviewedCount} of {rules.length}</p>
        </div>
        <div className="rounded-full border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800">Preview only · sending disabled</div>
      </div>

      <div className="grid gap-3 rounded-xl border bg-white p-4 md:grid-cols-4">
        <input className={inputClass} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search client, email or ref" />
        <select className={selectClass} value={global.agent} onChange={(e) => setGlobal((v) => ({ ...v, agent: e.target.value }))}><option value="">All agents</option>{agents.map((v) => <option key={v}>{v}</option>)}</select>
        <select className={selectClass} value={global.eventType} onChange={(e) => setGlobal((v) => ({ ...v, eventType: e.target.value }))}><option value="">All event types</option>{eventTypes.map((v) => <option key={v}>{v}</option>)}</select>
        <select className={selectClass} value={global.bookedDj} onChange={(e) => setGlobal((v) => ({ ...v, bookedDj: e.target.value }))}><option value="any">DJ: either</option><option value="yes">DJ booked</option><option value="no">No DJ</option></select>
      </div>

      <div className="grid min-h-[680px] gap-4 xl:grid-cols-[280px_minmax(420px,0.9fr)_minmax(520px,1.35fr)]">
        <aside className="overflow-hidden rounded-xl border bg-white">
          <div className="border-b px-4 py-3 text-sm font-semibold text-slate-800">Imported templates ({rules.length})</div>
          <div className="max-h-[760px] overflow-y-auto">
            {rules.map((rule) => <button key={rule.id} type="button" onClick={() => setSelectedId(rule.id)} className={`w-full border-b px-4 py-3 text-left ${rule.id === selected.id ? "bg-sky-50" : "hover:bg-slate-50"}`}><div className="flex items-center justify-between gap-2"><span className="text-sm font-medium text-slate-900">Automation {rule.sourceNumber}</span><span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${rule.status === "reviewed" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>{rule.status === "reviewed" ? "Reviewed" : "Needs review"}</span></div><div className="mt-1 line-clamp-2 text-xs text-slate-500">{rule.subject}</div></button>)}
          </div>
        </aside>

        <section className="space-y-4 rounded-xl border bg-white p-4">
          <div><h2 className="text-lg font-semibold text-slate-900">Rule conditions</h2><p className="text-xs text-slate-500">These start blank where Monday’s screenshots still need reconciling.</p></div>
          <label className="block text-xs font-medium text-slate-600">Rule name<input className={`${inputClass} mt-1`} value={selected.name} onChange={(e) => updateRule({ name: e.target.value })} /></label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs font-medium text-slate-600">Agent<select className={`${inputClass} mt-1`} value={selected.filters.agent} onChange={(e) => updateFilters({ agent: e.target.value })}><option value="">Any agent</option>{agents.map((v) => <option key={v}>{v}</option>)}</select></label>
            <label className="text-xs font-medium text-slate-600">Event type<select className={`${inputClass} mt-1`} value={selected.filters.eventType} onChange={(e) => updateFilters({ eventType: e.target.value })}><option value="">Any event type</option>{eventTypes.map((v) => <option key={v}>{v}</option>)}</select></label>
            <label className="text-xs font-medium text-slate-600">Wedding status<select className={`${inputClass} mt-1`} value={selected.filters.weddingStatus} onChange={(e) => updateFilters({ weddingStatus: e.target.value })}><option value="">Either</option><option>Wedding</option><option>Non-Wedding</option></select></label>
            <label className="text-xs font-medium text-slate-600">DJ<select className={`${inputClass} mt-1`} value={selected.filters.bookedDj} onChange={(e) => updateFilters({ bookedDj: e.target.value })}><option value="any">Either</option><option value="yes">Booked</option><option value="no">Not booked</option></select></label>
            <label className="text-xs font-medium text-slate-600">Manned playlist<select className={`${inputClass} mt-1`} value={selected.filters.bookedPlaylist} onChange={(e) => updateFilters({ bookedPlaylist: e.target.value })}><option value="any">Either</option><option value="yes">Booked</option><option value="no">Not booked</option></select></label>
            <label className="text-xs font-medium text-slate-600">Review<select className={`${inputClass} mt-1`} value={selected.filters.reviewStatus} onChange={(e) => updateFilters({ reviewStatus: e.target.value })}><option value="any">Either</option><option value="received">Received</option><option value="not_received">Not received</option></select></label>
          </div>
          <div className="grid grid-cols-[1fr_120px] gap-3"><label className="text-xs font-medium text-slate-600">Date basis<select className={`${inputClass} mt-1`} value={selected.timing.reference} onChange={(e) => updateRule({ timing: { ...selected.timing, reference: e.target.value } })}><option value="eventDate">Event date</option><option value="fixed">Manual/fixed date</option></select></label><label className="text-xs font-medium text-slate-600">Days offset<input type="number" className={`${inputClass} mt-1`} value={selected.timing.offsetDays} onChange={(e) => updateRule({ timing: { ...selected.timing, offsetDays: Number(e.target.value) } })} /></label></div>
          <button type="button" onClick={() => updateRule({ status: "reviewed" })} className="w-full rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">Mark conditions reviewed</button>

          <div className="border-t pt-4"><h2 className="mb-3 text-lg font-semibold text-slate-900">Email template</h2><label className="block text-xs font-medium text-slate-600">Subject<input className={`${inputClass} mt-1`} value={selected.subject} onChange={(e) => updateRule({ subject: e.target.value })} /></label><label className="mt-3 block text-xs font-medium text-slate-600">Body<textarea className={`${inputClass} mt-1 min-h-[310px] font-mono text-xs leading-5`} value={selected.body} onChange={(e) => updateRule({ body: e.target.value })} /></label><p className="mt-2 text-xs text-slate-500">Changes are saved in this browser while the rule import is reviewed.</p></div>
        </section>

        <section className="overflow-hidden rounded-xl border bg-white">
          <div className="flex items-center justify-between border-b px-4 py-3"><div><h2 className="font-semibold text-slate-900">Matching clients</h2><p className="text-xs text-slate-500">Who would receive this email under the current filters</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">{matchingRows.length}</span></div>
          {loadError && <div className="m-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{loadError}</div>}
          <div className="max-h-[760px] overflow-auto"><table className="min-w-full text-left text-xs"><thead className="sticky top-0 bg-slate-50 text-slate-600"><tr><th className="px-3 py-2">Client</th><th className="px-3 py-2">Event</th><th className="px-3 py-2">Agent</th><th className="px-3 py-2">DJ</th><th className="px-3 py-2">Proposed send</th></tr></thead><tbody>{loading ? <tr><td colSpan={5} className="p-6 text-center">Loading bookings…</td></tr> : matchingRows.map((row) => <tr key={row._id || rowRef(row)} className="border-b-2 border-slate-100 align-top"><td className="px-3 py-3"><div className="font-medium text-slate-900">{rowClient(row)}</div><div className="text-slate-500">{rowEmail(row) || "No email"}</div><div className="text-slate-400">{rowRef(row)}</div></td><td className="px-3 py-3"><div>{text(row.eventType) || "No event type"}</div><div className="text-slate-500">{dateOnly(rowDate(row)) || "No date"}</div></td><td className="px-3 py-3">{text(row.agent) || "—"}</td><td className="px-3 py-3">{rowDj(row) ? "Yes" : "No"}</td><td className="px-3 py-3 font-medium text-slate-800">{selected.timing.reference === "fixed" ? "Manual date" : addDays(rowDate(row), selected.timing.offsetDays)}</td></tr>)}</tbody></table></div>
        </section>
      </div>
    </div>
  );
}
