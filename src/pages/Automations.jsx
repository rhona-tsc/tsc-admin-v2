import React, { useEffect, useMemo, useRef, useState } from "react";
import { backendUrl } from "../App";
import { automationSeeds } from "../data/automationSeeds";
import { EVENT_TYPE_OPTIONS, normalizeEventType } from "../constants/eventTypes";

const STORAGE_KEY = "tscAutomationPreviewRulesV2";
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
const rowWedding = (row) => normalizeEventType(row.eventType) === "Wedding" ? "Wedding" : "Non-Wedding";
const rowRole = (row) => text(row.contactRole || "direct_client");
const rowService = (row) => text(row.bookingDetails?.playlistService || (rowDj(row) ? "pro_dj" : ""));
const parseDate = (value) => {
  const date = new Date(`${dateOnly(value)}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};
const formatDate = (date) => date?.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) || "";
const monthBefore = (value) => { const date = parseDate(value); if (!date) return ""; date.setMonth(date.getMonth() - 1); return formatDate(date); };
const invoiceDueDate = (row) => {
  if (row.invoiceDueDateISO) return friendlyDate(row.invoiceDueDateISO);
  const date = parseDate(rowDate(row));
  if (!date) return "";
  const monday = new Date(date);
  monday.setDate(date.getDate() - ((date.getDay() + 6) % 7) - 11);
  return formatDate(monday);
};
const specialRequestLabel = (row) => {
  if (rowWedding(row) === "Wedding") return "First Dance";
  const count = Number(row.offRepertoireRequestCount || row.actData?.offRepertoireRequestCount || 1);
  return /r\s*&?\s*b knights/i.test(rowAct(row)) || count > 1 ? "Off Repertoire Requests" : "Off Repertoire Request";
};
const vocalistNames = (row) => [...new Set([...(row.assignedMusicians || []), ...(row.bookingMusicians || [])].filter((member) => /vocal|singer/i.test(`${member.role || ""} ${member.instrument || ""}`)).map((member) => text(member.name || `${member.firstName || ""} ${member.lastName || ""}`)).filter(Boolean))].join(", ");
const proposedSendAt = (row, timing = {}) => {
  const event = parseDate(rowDate(row));
  if (!event) return null;
  if (timing.strategy === "post_event") {
    event.setDate(event.getDate() + 1);
    event.setHours(18, 0, 0, 0);
    return event;
  }
  const booked = parseDate(row.bookingDateISO || row.enquiryDateISO);
  if (timing.strategy === "setlist" || timing.strategy === "initial") {
    const leadDays = booked ? Math.round((event - booked) / 86400000) : 999;
    if (leadDays < 35 && booked) {
      const midway = new Date(booked.getTime() + ((event - booked) / 2));
      if (timing.strategy === "setlist") midway.setDate(midway.getDate() - 1);
      return midway;
    }
    event.setDate(event.getDate() - (timing.strategy === "setlist" ? 31 : 21));
    return event;
  }
  event.setDate(event.getDate() + Number(timing.offsetDays || 0));
  return event;
};
const proposedSendDate = (row, timing = {}) => {
  const date = proposedSendAt(row, timing);
  if (!date) return "Needs date";
  return timing.strategy === "post_event"
    ? `${formatDate(date)} at 18:00`
    : formatDate(date);
};

const TEMPLATE_TAGS = [
  { tag: "{{client_first_name}}", label: "Client first name" },
  { tag: "{{client_names}}", label: "Client name(s)" },
  { tag: "{{act_name}}", label: "Band / act name" },
  { tag: "{{event_type}}", label: "Event type" },
  { tag: "{{event_date}}", label: "Event date" },
  { tag: "{{venue_name}}", label: "Venue" },
  { tag: "{{event_sheet_link}}", label: "Event sheet link" },
  { tag: "{{invoice_link}}", label: "Invoice link" },
  { tag: "{{booking_reference}}", label: "Booking reference" },
  { tag: "{{agent_name}}", label: "Agent" },
  { tag: "{{special_request_label}}", label: "First dance / off-repertoire label" },
  { tag: "{{song_request_due_date}}", label: "Song request due date" },
  { tag: "{{invoice_due_date}}", label: "Invoice / event sheet due date" },
  { tag: "{{vocalist_names}}", label: "Vocalist names" },
  { tag: "{{draft_setlist_link}}", label: "Draft setlist link" },
  { tag: "{{whatsapp_group_link}}", label: "WhatsApp group link" },
];

const rowAct = (row) => text(
  row.actName || row.bandName || row.act?.name || row.bookingDetails?.actName || row.bookingDetails?.bandName,
);
const rowVenue = (row) => text(
  row.venue || row.venueName || row.eventSheet?.answers?.venue_name || row.bookingDetails?.venue,
);
const rowEventSheetLink = (row) => text(row.eventSheetLink || row.eventSheet?.url || row.eventSheet?.link);
const rowInvoiceLink = (row) => text(
  row.payments?.boardInvoicePdfUrl || row.invoicePdfUrl || row.payments?.hosted_invoice_url || row.payments?.invoiceUrl || row.invoiceUrl || row.invoice?.url,
);
const friendlyDate = (value) => {
  if (!value) return "";
  const date = new Date(`${dateOnly(value)}T12:00:00`);
  return Number.isNaN(date.getTime())
    ? text(value)
    : date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
};
const firstName = (value) => text(value).split(/\s+|&/)[0] || "";
const templateValues = (row = {}) => ({
  "{{client_first_name}}": firstName(rowClient(row)),
  "{{client_names}}": rowClient(row),
  "{{act_name}}": rowAct(row),
  "{{event_type}}": normalizeEventType(row.eventType),
  "{{event_date}}": friendlyDate(rowDate(row)),
  "{{venue_name}}": rowVenue(row),
  "{{event_sheet_link}}": rowEventSheetLink(row),
  "{{invoice_link}}": rowInvoiceLink(row),
  "{{booking_reference}}": rowRef(row),
  "{{agent_name}}": text(row.agent),
  "{{special_request_label}}": specialRequestLabel(row),
  "{{song_request_due_date}}": monthBefore(rowDate(row)),
  "{{invoice_due_date}}": invoiceDueDate(row),
  "{{vocalist_names}}": vocalistNames(row),
  "{{draft_setlist_link}}": text(row.draftSetlistLink),
  "{{whatsapp_group_link}}": text(row.whatsappGroupLink),
  // Imported Monday.com tags remain supported while templates are migrated.
  "{pulse.text7}": firstName(rowClient(row)),
  "{pulse.dropdown}": rowAct(row),
  "{pulse.event_type}": normalizeEventType(row.eventType),
  "{pulse.dup__of_event_type}": normalizeEventType(row.eventType),
  "{pulse.text04}": friendlyDate(rowDate(row)),
  "{pulse.date}": friendlyDate(rowDate(row)),
  "{pulse.link}": rowEventSheetLink(row),
  "{pulse.link7}": rowInvoiceLink(row),
  "{pulse.text3}": specialRequestLabel(row),
  "{pulse.text94}": monthBefore(rowDate(row)),
  "{pulse.text60}": invoiceDueDate(row),
  "{pulse.dup__of_vocalist}": vocalistNames(row),
});
const renderTemplate = (template, row) => {
  const values = templateValues(row);
  return Object.entries(values).reduce(
    (rendered, [tag, value]) => rendered.split(tag).join(value || `[${tag.replace(/[{}]/g, "")}]`),
    String(template || ""),
  );
};

const matchesChoice = (actual, choice) => choice === "any" || boolValue(actual) === choice;
const prepareRules = (source) => source
  .filter((rule) => Number(rule.sourceNumber) !== 7)
  .map((rule) => {
    const number = Number(rule.sourceNumber);
    const filters = { ...rule.filters };
    const timing = { ...rule.timing };
    let body = String(rule.body || "")
      .replace(/Warmest wishes,\s*\nRhona(?:\s*x|\s*✨)?/gi, "Warmest wishes,\nRhona ✨")
      .replace(/\n?https:\/\/res\.cloudinary\.com\/[^\s]+invoice[^\s]*/gi, "")
      .replace(/\{pulse\.link7\}/g, "Invoice attached");
    if ([1, 6, 8, 9].includes(number)) {
      body = body.replace(/\{pulse\.link\}/g, "EVENT SHEET: {pulse.link}");
      timing.strategy = "initial";
    }
    if (number === 1) filters.agentIncludes = "Entertainment Nation";
    if ([2, 3].includes(number)) filters.weddingStatus = "Wedding";
    if (number === 3) timing.strategy = "post_event";
    if (number === 4) timing.strategy = "setlist";
    if (number === 5) filters.playlistService = "manned_playlist";
    if (
      [2, 3].includes(number) ||
      /review request|leave .*review|google review/i.test(
        `${rule.name || ""} ${rule.subject || ""} ${rule.body || ""}`,
      )
    ) {
      filters.reviewPermission = "allowed";
    }
    if (number === 6) filters.recipientRole = "direct_client";
    if (number === 8) filters.recipientRole = "end_client_via_agent";
    if (number === 9) filters.recipientRole = "agent";
    return { ...rule, body, filters, timing };
  });

export default function Automations() {
  const [rows, setRows] = useState([]);
  const [rules, setRules] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      return prepareRules(Array.isArray(saved) && saved.length ? saved : automationSeeds);
    } catch {
      return prepareRules(automationSeeds);
    }
  });
  const [selectedId, setSelectedId] = useState(rules[0]?.id || "");
  const [query, setQuery] = useState("");
  const [global, setGlobal] = useState({ agent: "", eventType: "", bookedDj: "any" });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [activeTemplateField, setActiveTemplateField] = useState("body");
  const [previewRowId, setPreviewRowId] = useState("");
  const subjectRef = useRef(null);
  const bodyRef = useRef(null);

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
  const eventTypes = EVENT_TYPE_OPTIONS;
  const reviewedCount = rules.filter((rule) => rule.status === "reviewed").length;

  const matchingRows = useMemo(() => {
    if (!selected) return [];
    const f = selected.filters || {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const eligible = rows.filter((row) => {
      const haystack = `${rowClient(row)} ${rowEmail(row)} ${rowRef(row)}`.toLowerCase();
      if (query && !haystack.includes(query.toLowerCase())) return false;
      if (global.agent && text(row.agent) !== global.agent) return false;
      if (global.eventType && normalizeEventType(row.eventType) !== global.eventType) return false;
      if (!matchesChoice(rowDj(row), global.bookedDj)) return false;
      if (f.agent && text(row.agent) !== f.agent) return false;
      if (f.agentIncludes && !text(row.agent).toLowerCase().includes(f.agentIncludes.toLowerCase())) return false;
      if (f.eventType && normalizeEventType(row.eventType) !== f.eventType) return false;
      if (f.recipientRole && rowRole(row) !== f.recipientRole) return false;
      if (f.playlistService && rowService(row) !== f.playlistService) return false;
      if (f.weddingStatus && rowWedding(row) !== f.weddingStatus) return false;
      if (!matchesChoice(rowDj(row), f.bookedDj || "any")) return false;
      if (!matchesChoice(rowPlaylist(row), f.bookedPlaylist || "any")) return false;
      if (f.reviewStatus === "received" && !row.review?.received) return false;
      if (f.reviewStatus === "not_received" && row.review?.received) return false;
      if (f.reviewPermission === "allowed" && row.review?.doNotRequest) return false;
      if (f.reviewPermission === "suppressed" && !row.review?.doNotRequest) return false;
      if (selected.timing?.reference !== "fixed") {
        const sendAt = proposedSendAt(row, selected.timing);
        if (sendAt && sendAt < today) return false;
      }
      return true;
    });
    const uniqueBookings = new Map();
    eligible.forEach((row) => {
      const key = rowRef(row).toLowerCase() || String(row._id || "");
      if (!uniqueBookings.has(key)) uniqueBookings.set(key, row);
    });
    return [...uniqueBookings.values()];
  }, [rows, selected, query, global]);

  const previewRow = matchingRows.find((row) => String(row._id || rowRef(row)) === previewRowId) || matchingRows[0];
  const insertTag = (tag) => {
    const field = activeTemplateField === "subject" ? "subject" : "body";
    const target = field === "subject" ? subjectRef.current : bodyRef.current;
    const currentValue = selected[field] || "";
    const start = target?.selectionStart ?? currentValue.length;
    const end = target?.selectionEnd ?? start;
    updateRule({ [field]: `${currentValue.slice(0, start)}${tag}${currentValue.slice(end)}` });
    requestAnimationFrame(() => {
      target?.focus();
      target?.setSelectionRange(start + tag.length, start + tag.length);
    });
  };

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
            <label className="text-xs font-medium text-slate-600">Review requests<select className={`${inputClass} mt-1`} value={selected.filters.reviewPermission || "any"} onChange={(e) => updateFilters({ reviewPermission: e.target.value })}><option value="any">Either</option><option value="allowed">Allowed only</option><option value="suppressed">Do not request</option></select></label>
            <label className="text-xs font-medium text-slate-600">Recipient<select className={`${inputClass} mt-1`} value={selected.filters.recipientRole || ""} onChange={(e) => updateFilters({ recipientRole: e.target.value })}><option value="">Any contact</option><option value="direct_client">Direct client</option><option value="agent">Agent / planner</option><option value="end_client_via_agent">End client via agent</option></select></label>
            <label className="text-xs font-medium text-slate-600">Music service<select className={`${inputClass} mt-1`} value={selected.filters.playlistService || ""} onChange={(e) => updateFilters({ playlistService: e.target.value })}><option value="">Any service</option><option value="spotify_playlist">Spotify Playlist</option><option value="manned_playlist">Manned Playlist</option><option value="pro_dj">Pro DJ Service</option></select></label>
          </div>
          <div className="grid grid-cols-[1fr_120px] gap-3"><label className="text-xs font-medium text-slate-600">Date basis<select className={`${inputClass} mt-1`} value={selected.timing.reference} onChange={(e) => updateRule({ timing: { ...selected.timing, reference: e.target.value } })}><option value="eventDate">Event date</option><option value="fixed">Manual/fixed date</option></select></label><label className="text-xs font-medium text-slate-600">Days offset<input type="number" className={`${inputClass} mt-1`} value={selected.timing.offsetDays} onChange={(e) => updateRule({ timing: { ...selected.timing, offsetDays: Number(e.target.value) } })} /></label></div>
          <button type="button" onClick={() => updateRule({ status: "reviewed" })} className="w-full rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">Mark conditions reviewed</button>

          <div className="border-t pt-4">
            <h2 className="mb-1 text-lg font-semibold text-slate-900">Email template</h2>
            <p className="mb-3 text-xs text-slate-500">Click in the subject or body, then choose a tag. It will be replaced with each booking’s details when the email is prepared.</p>
            <label className="block text-xs font-medium text-slate-600">Subject<input ref={subjectRef} onFocus={() => setActiveTemplateField("subject")} className={`${inputClass} mt-1`} value={selected.subject} onChange={(e) => updateRule({ subject: e.target.value })} /></label>
            <label className="mt-3 block text-xs font-medium text-slate-600">Body<textarea ref={bodyRef} onFocus={() => setActiveTemplateField("body")} className={`${inputClass} mt-1 min-h-[310px] font-mono text-xs leading-5`} value={selected.body} onChange={(e) => updateRule({ body: e.target.value })} /></label>
            <div className="mt-3 rounded-lg border border-sky-200 bg-sky-50 p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold text-sky-900">Insert a tag into the {activeTemplateField}</p>
                <span className="text-[10px] text-sky-700">Place your cursor first</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {TEMPLATE_TAGS.map(({ tag, label }) => (
                  <button key={tag} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => insertTag(tag)} title={tag} className="rounded-full border border-sky-300 bg-white px-2.5 py-1 text-[11px] font-medium text-sky-800 hover:bg-sky-100">
                    + {label}
                  </button>
                ))}
              </div>
            </div>
            <p className="mt-2 text-xs text-slate-500">Changes are saved in this browser while the rule import is reviewed. Existing imported Monday.com tags are also supported.</p>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border bg-white">
          <div className="border-b bg-slate-50 px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div><h2 className="font-semibold text-slate-900">Personalised email preview</h2><p className="text-xs text-slate-500">Tags are replaced using the selected matching client.</p></div>
              {matchingRows.length > 0 && <select className={selectClass} value={String(previewRow?._id || rowRef(previewRow))} onChange={(e) => setPreviewRowId(e.target.value)}>{matchingRows.map((row) => <option key={row._id || rowRef(row)} value={String(row._id || rowRef(row))}>{rowClient(row)} · {rowRef(row)}</option>)}</select>}
            </div>
            {previewRow ? <div className="mt-3 rounded-lg border bg-white p-3"><p className="text-xs font-semibold text-slate-500">Subject</p><p className="mt-1 text-sm font-semibold text-slate-900">{renderTemplate(selected.subject, previewRow)}</p><p className="mt-3 text-xs font-semibold text-slate-500">Body</p><div className="mt-1 max-h-64 overflow-auto whitespace-pre-wrap text-sm leading-5 text-slate-700">{renderTemplate(selected.body, previewRow)}</div><div className="mt-3 rounded-lg bg-emerald-50 p-2 text-xs text-emerald-800">{rowInvoiceLink(previewRow) ? "Invoice PDF will be attached — no long invoice URL in the email." : "No invoice PDF is currently recorded for this booking."} The standard TSC signature and footer will be appended.</div></div> : <div className="mt-3 rounded-lg border border-dashed bg-white p-4 text-sm text-slate-500">No matching client is available for a personalised preview.</div>}
          </div>
          <div className="flex items-center justify-between border-b px-4 py-3"><div><h2 className="font-semibold text-slate-900">Matching clients</h2><p className="text-xs text-slate-500">Who would receive this email under the current filters</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">{matchingRows.length}</span></div>
          {loadError && <div className="m-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{loadError}</div>}
          <div className="max-h-[760px] overflow-auto"><table className="min-w-full text-left text-xs"><thead className="sticky top-0 bg-slate-50 text-slate-600"><tr><th className="px-3 py-2">Client</th><th className="px-3 py-2">Event</th><th className="px-3 py-2">Agent</th><th className="px-3 py-2">Service</th><th className="px-3 py-2">Proposed send</th></tr></thead><tbody>{loading ? <tr><td colSpan={5} className="p-6 text-center">Loading bookings…</td></tr> : matchingRows.map((row) => <tr key={row._id || rowRef(row)} className="border-b-2 border-slate-100 align-top"><td className="px-3 py-3"><div className="font-medium text-slate-900">{rowClient(row)}</div><div className="text-slate-500">{rowEmail(row) || "No email"}</div><div className="text-slate-400">{rowRef(row)}</div><div className="text-slate-400">{rowRole(row).replaceAll("_", " ")}</div></td><td className="px-3 py-3"><div>{text(row.eventType) || "No event type"}</div><div className="text-slate-500">{dateOnly(rowDate(row)) || "No date"}</div></td><td className="px-3 py-3">{text(row.agent) || "—"}</td><td className="px-3 py-3 capitalize">{rowService(row).replaceAll("_", " ") || "Not recorded"}</td><td className="px-3 py-3 font-medium text-slate-800">{selected.timing.reference === "fixed" ? "Manual date" : proposedSendDate(row, selected.timing)}</td></tr>)}</tbody></table></div>
        </section>
      </div>
    </div>
  );
}
