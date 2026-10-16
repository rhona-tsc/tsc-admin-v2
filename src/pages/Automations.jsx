import React, { useEffect, useMemo, useRef, useState } from "react";
import { backendUrl } from "../App";
import { automationSeeds } from "../data/automationSeeds";
import { EVENT_TYPE_OPTIONS, normalizeEventType } from "../constants/eventTypes";
import { AGENT_OPTIONS, normalizeAgent } from "../constants/agents";

const STORAGE_KEY = "tscAutomationPreviewRulesV2";
const PUBLIC_SITE_BASE = (
  import.meta?.env?.VITE_PUBLIC_SITE_URL || "https://thesupremecollective.co.uk"
).replace(/\/$/, "");
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
const rowEmails = (row) => [...new Set([
  rowEmail(row),
  ...(Array.isArray(row.clientEmails) ? row.clientEmails.map((item) => text(item?.email || item)) : []),
].map((email) => email.toLowerCase()).filter(Boolean))];
const rowRef = (row) => text(row.bookingRef || row.bookingId);
const rowDate = (row) => row.eventDateISO || row.eventDate || row.date;
const rowDj = (row) => Boolean(row.bookingDetails?.djServicesBooked || row.bookedDj || row.djBooked);
const rowPlaylist = (row) => Boolean(row.bookingDetails?.mannedPlaylist || row.bookedMannedPlaylist);
const rowWedding = (row) => normalizeEventType(row.eventType) === "Wedding" ? "Wedding" : "Non-Wedding";
const rowRole = (row) => text(row.contactRole || "direct_client");
const rowService = (row) => text(row.bookingDetails?.playlistService || (rowDj(row) ? "pro_dj" : ""));
const CLIENT_PRICE_MULTIPLIER = 1.33;
const normalizeExtraKey = (value) => text(value).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
const formatPounds = (value) => `£${Math.round(Number(value || 0)).toLocaleString("en-GB")}`;
const bookedPerformerCount = (row) => {
  const lineupCount = Array.isArray(row.lineupComposition)
    ? row.lineupComposition.filter(Boolean).length
    : 0;
  if (lineupCount) return lineupCount;
  const selectedCount = Number(text(row.lineupSelected).match(/\d+/)?.[0] || 0);
  if (selectedCount) return selectedCount;
  return [...(row.assignedMusicians || []), ...(row.bookingMusicians || [])]
    .filter((member, index, members) => {
      const id = text(member?.musicianId || member?._id || member?.email || member?.name);
      return id && members.findIndex((candidate) => text(
        candidate?.musicianId || candidate?._id || candidate?.email || candidate?.name,
      ) === id) === index;
    }).length;
};
const actAddOnOptions = (row) => {
  const rawExtras = row?.actData?.extras || {};
  const entries = rawExtras instanceof Map ? [...rawExtras.entries()] : Object.entries(rawExtras);
  const extras = new Map(entries.map(([key, value]) => [normalizeExtraKey(key), {
    key: normalizeExtraKey(key),
    price: Number(value?.price || 0),
    complimentary: value?.complimentary === true,
    originalKey: key,
  }]));
  const find = (...keys) => keys.map(normalizeExtraKey).map((key) => extras.get(key)).find(Boolean);
  const lines = [];
  const used = new Set(["max_dj_hours", "background_music_playlist"]);
  const addSimple = (label, ...keys) => {
    const extra = find(...keys);
    keys.forEach((key) => used.add(normalizeExtraKey(key)));
    if (!extra || extra.complimentary || extra.price <= 0) return;
    lines.push(`- ${label}: ${formatPounds(extra.price * CLIENT_PRICE_MULTIPLIER)}`);
  };
  const addLineupTotal = (label, ...keys) => {
    const extra = find(...keys);
    keys.forEach((key) => used.add(normalizeExtraKey(key)));
    const performers = bookedPerformerCount(row);
    if (!extra || extra.complimentary || extra.price <= 0 || !performers) return;
    lines.push(`- ${label} (${performers}-piece): ${formatPounds(extra.price * performers * CLIENT_PRICE_MULTIPLIER)}`);
  };
  const addPerMember = (label, unit, ...keys) => {
    const extra = find(...keys);
    keys.forEach((key) => used.add(normalizeExtraKey(key)));
    if (!extra || extra.complimentary || extra.price <= 0) return;
    lines.push(`- ${label}: ${formatPounds(extra.price * CLIENT_PRICE_MULTIPLIER)} per band member${unit ? ` ${unit}` : ""}`);
  };

  addLineupTotal("Additional 30-minute performance", "extra_30min_performance_per_band_member");
  addLineupTotal("Additional 40-minute performance", "extra_40min_performance_per_band_member");
  addLineupTotal("Additional 45-minute performance", "extra_45min_performance_per_band_member");
  addLineupTotal("Additional 60-minute performance", "extra_60min_performance_per_band_member");
  addPerMember("Early arrival", "per hour", "early_arrival_60min_per_band_member");
  addPerMember("Late stay", "per hour", "late_stay_60min_per_band_member");
  addPerMember("Additional song request", "", "extra_song_request_per_band_member");
  addPerMember("Israeli dancing (20 minutes)", "", "israeli_dancing_20mins_per_band_member");
  addSimple("Up to 3 hours of manned playlist service", "up_to_3_hours_manned_playlist");
  addSimple("Up to 3 hours of band-member DJing", "up_to_3_hours_band_member_dj");
  addSimple("Additional DJing per 30 minutes", "extra_djing_per_30_mins", "extra_djing_per_30_min");
  addSimple("DJ with live sax (3 x 30 minutes)", "dj_live_sax_3x30mins");
  addSimple("PA and sound engineering for another act", "sound_engineering_for_another_act_with_your_acts_pa");
  addSimple("Speedy 60-minute setup and soundcheck", "speedy_setup_60mins_roadie_and_engineer_duties_only_travel_added_on_top_later_for_additional_team_member");
  addSimple("Wired microphone hire for speeches", "wired_mic_for_speeches");
  addSimple("Wireless microphone hire for speeches", "wireless_mic_for_speeches");

  entries.forEach(([originalKey, value]) => {
    const key = normalizeExtraKey(originalKey);
    if (used.has(key) || value?.complimentary === true || Number(value?.price || 0) <= 0) return;
    const label = text(originalKey).replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
    lines.push(`- ${label}: ${formatPounds(Number(value.price) * CLIENT_PRICE_MULTIPLIER)}`);
  });

  return lines.length
    ? `Add-ons available for ${rowAct(row)}:\n${lines.join("\n")}`
    : `Please ask me if you would like a tailored add-on quote for ${rowAct(row)}.`;
};
const parseDate = (value) => {
  const date = new Date(`${dateOnly(value)}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};
const formatDate = (date) => date?.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) || "";
const songRequestDueAt = (row) => {
  const event = parseDate(rowDate(row));
  if (!event) return null;
  const booked = parseDate(row.bookingDateISO || row.enquiryDateISO || row.createdAt);
  if (booked) {
    const leadDays = Math.round((event.getTime() - booked.getTime()) / 86400000);
    if (leadDays < 35) {
      const oneWeekAfterBooking = new Date(booked);
      oneWeekAfterBooking.setDate(booked.getDate() + 7);
      return oneWeekAfterBooking >= event
        ? new Date(booked.getTime() + ((event.getTime() - booked.getTime()) / 2))
        : oneWeekAfterBooking;
    }
  }
  const oneMonthBefore = new Date(event);
  oneMonthBefore.setMonth(event.getMonth() - 1);
  return oneMonthBefore;
};
const songRequestDueDate = (row) => formatDate(songRequestDueAt(row));
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
const joinNames = (names) => {
  if (names.length < 2) return names[0] || "";
  if (names.length === 2) return `${names[0]} & ${names[1]}`;
  return `${names.slice(0, -1).join(", ")} & ${names.at(-1)}`;
};
const vocalistNames = (row) => joinNames([...new Set(
  [...(row.assignedMusicians || []), ...(row.bookingMusicians || [])]
    .filter((member) => /vocal|singer/i.test(`${member.role || ""} ${member.instrument || ""}`))
    .map((member) => firstName(member.name || `${member.firstName || ""} ${member.lastName || ""}`))
    .filter(Boolean),
)]);
const proposedSendAt = (row, timing = {}) => {
  const event = parseDate(rowDate(row));
  if (!event) return null;
  if (timing.strategy === "song_suggestions_due") {
    return songRequestDueAt(row);
  }
  if (timing.strategy === "song_suggestions_advance") {
    const dueDate = songRequestDueAt(row);
    if (!dueDate) return null;
    const reminderDate = new Date(dueDate);
    reminderDate.setDate(dueDate.getDate() - 7);
    const booked = parseDate(row.bookingDateISO || row.enquiryDateISO || row.createdAt);
    return booked && reminderDate < booked ? booked : reminderDate;
  }
  if (timing.strategy === "final_details_due") {
    const eventWeekMonday = new Date(event);
    eventWeekMonday.setDate(event.getDate() - ((event.getDay() + 6) % 7));
    const thursdayInPreviousWeek = new Date(eventWeekMonday);
    thursdayInPreviousWeek.setDate(eventWeekMonday.getDate() - 4);

    const booked = parseDate(row.bookingDateISO || row.enquiryDateISO || row.createdAt);
    if (booked && booked > thursdayInPreviousWeek) {
      return new Date(booked.getTime() + ((event.getTime() - booked.getTime()) / 2));
    }
    return thursdayInPreviousWeek;
  }
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
  if (timing.reference === "fixed" && !timing.strategy) return "Manual date";
  return timing.strategy === "post_event"
    ? `${formatDate(date)} at 18:00`
    : formatDate(date);
};
const describeSendRule = (timing = {}) => {
  if (timing.reference === "fixed" && !timing.strategy) return "Send on the manually selected date.";
  if (timing.strategy === "song_suggestions_due") {
    return "Send one calendar month before the event. If the booking is made less than five weeks before the event, send one week after the booking enters the system. If that would fall on or after the event, send halfway between the booking and event dates.";
  }
  if (timing.strategy === "song_suggestions_advance") {
    return "Send seven days before the calculated song-suggestions due date. If a short-notice booking arrives after that reminder date, send when the booking enters the system.";
  }
  if (timing.strategy === "final_details_due") {
    return "Send on the Thursday in the calendar week before the event. If the booking enters the system after that Thursday, send halfway between the booking and event dates.";
  }
  if (timing.strategy === "post_event") return "Send one day after the event at 6:00pm.";
  if (timing.strategy === "setlist") {
    return "Send 31 days before the event. For bookings made less than five weeks ahead, send one day before the halfway point between the booking and event dates.";
  }
  if (timing.strategy === "initial") {
    return "Send 21 days before the event. For bookings made less than five weeks ahead, send halfway between the booking and event dates.";
  }

  const offset = Number(timing.offsetDays || 0);
  if (offset === 0) return "Send on the event date.";
  const unit = Math.abs(offset) === 1 ? "day" : "days";
  return `Send ${Math.abs(offset)} ${unit} ${offset < 0 ? "before" : "after"} the event.`;
};

const TEMPLATE_TAGS = [
  { tag: "{{client_first_name}}", label: "Client first name" },
  { tag: "{{client_names}}", label: "Client name(s)" },
  { tag: "{{act_name}}", label: "Band / act name" },
  { tag: "{{event_type}}", label: "Event type" },
  { tag: "{{event_date}}", label: "Event date" },
  { tag: "{{venue_name}}", label: "Venue" },
  { tag: "{{client_event_sheet_link}}", label: "Client editable event sheet" },
  { tag: "{{event_sheet_link}}", label: "Band / internal event sheet" },
  { tag: "{{invoice_link}}", label: "Invoice link" },
  { tag: "{{booking_reference}}", label: "Booking reference" },
  { tag: "{{agent_name}}", label: "Agent" },
  { tag: "{{special_request_label}}", label: "First dance / off-repertoire label" },
  { tag: "{{song_request_due_date}}", label: "Song request due date" },
  { tag: "{{invoice_due_date}}", label: "Invoice / event sheet due date" },
  { tag: "{{vocalist_names}}", label: "Vocalist names" },
  { tag: "{{draft_setlist_link}}", label: "Draft setlist link" },
  { tag: "{{whatsapp_group_link}}", label: "WhatsApp group link" },
  { tag: "{{act_add_on_options}}", label: "Act-specific add-ons with client prices" },
];

const rowAct = (row) => text(
  row.actName || row.bandName || row.act?.name || row.bookingDetails?.actName || row.bookingDetails?.bandName,
);
const rowVenue = (row) => text(
  row.venue || row.venueName || row.eventSheet?.answers?.venue_name || row.bookingDetails?.venue,
);
const rowEventSheetLink = (row) => text(row.eventSheetLink || row.eventSheet?.url || row.eventSheet?.link);
const rowClientEventSheetLink = (row) => {
  const bookingReference = rowRef(row);
  return bookingReference
    ? `${PUBLIC_SITE_BASE}/event-sheet/${encodeURIComponent(bookingReference)}`
    : "";
};
const rowInvoiceLink = (row) => text(
  row.payments?.boardInvoicePdfUrl || row.invoicePdfUrl || row.payments?.hosted_invoice_url || row.payments?.invoiceUrl || row.invoiceUrl || row.invoice?.url,
);
const ordinalDay = (day) => {
  const lastTwoDigits = day % 100;
  if (lastTwoDigits >= 11 && lastTwoDigits <= 13) return `${day}th`;
  return `${day}${({ 1: "st", 2: "nd", 3: "rd" }[day % 10] || "th")}`;
};
const friendlyDate = (value) => {
  if (!value) return "";
  const date = new Date(`${dateOnly(value)}T12:00:00`);
  return Number.isNaN(date.getTime())
    ? text(value)
    : `${ordinalDay(date.getDate())} of ${date.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}`;
};
const firstName = (value) => text(value).split(/\s+|&/)[0] || "";
const templateValues = (row = {}) => ({
  "{{client_first_name}}": firstName(rowClient(row)),
  "{{client_names}}": rowClient(row),
  "{{act_name}}": rowAct(row),
  "{{event_type}}": normalizeEventType(row.eventType),
  "{{event_date}}": friendlyDate(rowDate(row)),
  "{{venue_name}}": rowVenue(row),
  "{{client_event_sheet_link}}": rowClientEventSheetLink(row),
  "{{event_sheet_link}}": rowEventSheetLink(row),
  "{{invoice_link}}": rowInvoiceLink(row),
  "{{booking_reference}}": rowRef(row),
  "{{agent_name}}": normalizeAgent(row.agent),
  "{{special_request_label}}": specialRequestLabel(row),
  "{{song_request_due_date}}": songRequestDueDate(row),
  "{{invoice_due_date}}": invoiceDueDate(row),
  "{{vocalist_names}}": vocalistNames(row),
  "{{draft_setlist_link}}": text(row.draftSetlistLink),
  "{{whatsapp_group_link}}": text(row.whatsappGroupLink),
  "{{act_add_on_options}}": actAddOnOptions(row),
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
  "{pulse.text94}": songRequestDueDate(row),
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
const ruleAlreadySent = (rule, row) => {
  const number = Number(rule?.sourceNumber);
  return [6, 8, 9].includes(number) && Boolean(row?.introEmailSentAt || row?.introEmailMessageId);
};
const ruleMatchesRow = (rule, row, { excludePast = true, includeDisabled = false, includeSent = false } = {}) => {
  if (!includeDisabled && rule?.enabled === false) return false;
  if (!includeSent && ruleAlreadySent(rule, row)) return false;
  const f = rule?.filters || {};
  if (!parseDate(rowDate(row))) return false;
  if (Array.isArray(f.agents) && f.agents.length && !f.agents.includes(normalizeAgent(row.agent))) return false;
  if (Array.isArray(f.eventTypes) && f.eventTypes.length && !f.eventTypes.includes(normalizeEventType(row.eventType))) return false;
  if (f.recipientRole && rowRole(row) !== f.recipientRole) return false;
  if (f.playlistService && rowService(row) !== f.playlistService) return false;
  if (f.weddingStatus && rowWedding(row) !== f.weddingStatus) return false;
  if (!matchesChoice(rowDj(row), f.bookedDj || "any")) return false;
  if (!matchesChoice(rowPlaylist(row), f.bookedPlaylist || "any")) return false;
  if (f.reviewStatus === "received" && !row.review?.received) return false;
  if (f.reviewStatus === "not_received" && row.review?.received) return false;
  if (f.reviewPermission === "allowed" && row.review?.doNotRequest) return false;
  if (f.reviewPermission === "suppressed" && !row.review?.doNotRequest) return false;
  if (excludePast && rule?.timing?.reference !== "fixed") {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sendAt = proposedSendAt(row, rule?.timing || {});
    if (sendAt && sendAt < today) return false;
  }
  return true;
};
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
    if (number === 9) {
      body = body.replace(/\{\{event_sheet_link\}\}/g, "{{client_event_sheet_link}}");
    }
    if (filters.agent && !filters.agents?.length) filters.agents = [normalizeAgent(filters.agent)];
    delete filters.agent;
    if (filters.eventType && !filters.eventTypes?.length) {
      filters.eventTypes = [normalizeEventType(filters.eventType)];
    }
    delete filters.eventType;
    if (number === 1) filters.agents = ["Entertainment Nation"];
    delete filters.agentIncludes;
    if ([2, 3].includes(number)) filters.weddingStatus = "Wedding";
    if (number === 3) timing.strategy = "post_event";
    if (number === 4) timing.strategy = "setlist";
    if (number === 5) filters.playlistService = "manned_playlist";
    if (number === 21) {
      body = body.replace(
        /Performance Add-Ons:[\s\S]*?(?=These options are designed)/i,
        "{{act_add_on_options}}\n\n",
      );
    }
    if (number === 14) {
      timing.strategy = "song_suggestions_due";
      timing.offsetDays = -30;
      timing.label = "One month before; one week after booking when booked under five weeks out";
    }
    if (number === 16) {
      timing.strategy = "song_suggestions_advance";
      timing.offsetDays = -7;
      timing.label = "Seven days before the calculated song-request due date";
    }
    if (number === 38) {
      timing.strategy = "final_details_due";
      timing.label = "Thursday in the week before the event; halfway for late bookings";
    }
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
    return { ...rule, enabled: rule.enabled !== false, body, filters, timing };
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
  const [emailAuditQuery, setEmailAuditQuery] = useState("");
  const [auditOnlyEnabled, setAuditOnlyEnabled] = useState(false);
  const [global, setGlobal] = useState({ agent: "", eventType: "", bookedDj: "any" });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [activeTemplateField, setActiveTemplateField] = useState("body");
  const [previewRowId, setPreviewRowId] = useState("");
  const [testPreviewState, setTestPreviewState] = useState({ sending: false, message: "", error: "" });
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
  const agents = AGENT_OPTIONS;
  const eventTypes = EVENT_TYPE_OPTIONS;
  const reviewedCount = rules.filter((rule) => rule.status === "reviewed").length;
  const enabledCount = rules.filter((rule) => rule.enabled !== false).length;

  const matchingRows = useMemo(() => {
    if (!selected) return [];
    const f = selected.filters || {};
    const eligible = rows.filter((row) => {
      const haystack = `${rowClient(row)} ${rowEmail(row)} ${rowRef(row)}`.toLowerCase();
      if (query && !haystack.includes(query.toLowerCase())) return false;
      if (global.agent && normalizeAgent(row.agent) !== global.agent) return false;
      if (global.eventType && normalizeEventType(row.eventType) !== global.eventType) return false;
      if (!matchesChoice(rowDj(row), global.bookedDj)) return false;
      return ruleMatchesRow({ ...selected, filters: f }, row);
    });
    const uniqueBookings = new Map();
    eligible.forEach((row) => {
      const key = rowRef(row).toLowerCase() || String(row._id || "");
      if (!uniqueBookings.has(key)) uniqueBookings.set(key, row);
    });
    return [...uniqueBookings.values()];
  }, [rows, selected, query, global]);

  const emailAudit = useMemo(() => {
    const wanted = emailAuditQuery.trim().toLowerCase();
    if (!wanted || !wanted.includes("@")) return { bookings: [], items: [] };
    const bookings = rows.filter((row) => rowEmails(row).some((email) => email.includes(wanted)));
    const uniqueBookings = [...new Map(bookings.map((row) => [rowRef(row).toLowerCase() || String(row._id), row])).values()];
    const items = uniqueBookings.flatMap((row) => rules
      .filter((rule) => ruleMatchesRow(rule, row, { excludePast: false, includeDisabled: true, includeSent: true }))
      .map((rule) => {
        const usesManualDate = rule.timing?.reference === "fixed" && !rule.timing?.strategy;
        const sendAt = usesManualDate ? null : proposedSendAt(row, rule.timing);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const alreadySent = ruleAlreadySent(rule, row);
        return {
          rule,
          row,
          alreadySent,
          overdue: Boolean(sendAt && sendAt < today && !alreadySent),
          sendAt,
          sendLabel: usesManualDate ? "Manual date" : proposedSendDate(row, rule.timing),
          subject: renderTemplate(rule.subject, row),
        };
      }))
      .sort((a, b) => {
        if (!a.sendAt && !b.sendAt) return Number(a.rule.sourceNumber) - Number(b.rule.sourceNumber);
        if (!a.sendAt) return 1;
        if (!b.sendAt) return -1;
        return a.sendAt - b.sendAt || Number(a.rule.sourceNumber) - Number(b.rule.sourceNumber);
      });
    const exactSubjectCounts = new Map();
    const dayCounts = new Map();
    items.filter((item) => item.rule.enabled !== false && !item.alreadySent).forEach((item) => {
      const bookingKey = rowRef(item.row).toLowerCase();
      const subjectKey = `${bookingKey}|${item.subject.toLowerCase().replace(/\s+/g, " ").trim()}`;
      exactSubjectCounts.set(subjectKey, (exactSubjectCounts.get(subjectKey) || 0) + 1);
      if (item.sendAt) {
        const dayKey = `${bookingKey}|${dateOnly(item.sendAt)}`;
        dayCounts.set(dayKey, (dayCounts.get(dayKey) || 0) + 1);
      }
    });
    return {
      bookings: uniqueBookings,
      items: items.map((item) => {
        const bookingKey = rowRef(item.row).toLowerCase();
        const subjectKey = `${bookingKey}|${item.subject.toLowerCase().replace(/\s+/g, " ").trim()}`;
        const dayKey = item.sendAt ? `${bookingKey}|${dateOnly(item.sendAt)}` : "";
        return {
          ...item,
          duplicateSubject: !item.alreadySent && (exactSubjectCounts.get(subjectKey) || 0) > 1,
          sameDayCount: !item.alreadySent && dayKey ? dayCounts.get(dayKey) || 0 : 0,
        };
      }),
    };
  }, [emailAuditQuery, rows, rules]);
  const visibleEmailAuditItems = auditOnlyEnabled
    ? emailAudit.items.filter((item) => item.rule.enabled !== false)
    : emailAudit.items;
  const enabledEmailAuditCount = emailAudit.items.filter((item) => item.rule.enabled !== false && !item.alreadySent).length;

  const previewRow = matchingRows.find((row) => String(row._id || rowRef(row)) === previewRowId) || matchingRows[0];
  const sendTestPreview = async () => {
    if (!previewRow || testPreviewState.sending) return;
    setTestPreviewState({ sending: true, message: "", error: "" });
    try {
      const token = localStorage.getItem("token") || "";
      const response = await fetch(`${backendUrl}/api/board/bookings/automation-email/test`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}`, token } : {}),
        },
        credentials: "include",
        body: JSON.stringify({
          subject: renderTemplate(selected.subject, previewRow),
          body: renderTemplate(selected.body, previewRow),
          audience: Number(selected.sourceNumber) === 4 ? "musician" : "client",
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.success) throw new Error(payload?.message || "The preview could not be sent.");
      setTestPreviewState({ sending: false, message: payload.message, error: "" });
    } catch (error) {
      setTestPreviewState({ sending: false, message: "", error: error.message });
    }
  };
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
          <p className="mt-2 text-xs font-medium text-slate-500">Review progress: {reviewedCount} of {rules.length} · {enabledCount} switched on</p>
        </div>
        <div className="rounded-full border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800">Preview only · sending disabled</div>
      </div>

      <div className="grid gap-3 rounded-xl border bg-white p-4 md:grid-cols-4">
        <input className={inputClass} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search client, email or ref" />
        <select className={selectClass} value={global.agent} onChange={(e) => setGlobal((v) => ({ ...v, agent: e.target.value }))}><option value="">All agents</option>{agents.map((v) => <option key={v}>{v}</option>)}</select>
        <select className={selectClass} value={global.eventType} onChange={(e) => setGlobal((v) => ({ ...v, eventType: e.target.value }))}><option value="">All event types</option>{eventTypes.map((v) => <option key={v}>{v}</option>)}</select>
        <select className={selectClass} value={global.bookedDj} onChange={(e) => setGlobal((v) => ({ ...v, bookedDj: e.target.value }))}><option value="any">DJ: either</option><option value="yes">DJ booked</option><option value="no">No DJ</option></select>
      </div>

      <section className="overflow-hidden rounded-xl border border-indigo-200 bg-white">
        <div className="border-b border-indigo-100 bg-indigo-50 p-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <label className="min-w-[280px] flex-1 text-xs font-semibold text-indigo-950">
              Check a client’s complete email schedule
              <input
                type="email"
                className={`${inputClass} mt-1 border-indigo-200`}
                value={emailAuditQuery}
                onChange={(event) => setEmailAuditQuery(event.target.value)}
                placeholder="Type the client’s email address"
              />
            </label>
            {emailAuditQuery.trim() && (
              <button type="button" onClick={() => setEmailAuditQuery("")} className="rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm font-medium text-indigo-800">
                Clear
              </button>
            )}
          </div>
          <p className="mt-2 text-xs text-indigo-800">This ignores the page filters above and checks every future automation against the client’s booking details.</p>
        </div>
        {emailAuditQuery.trim().includes("@") && (
          <div className="p-4">
            {!emailAudit.bookings.length ? (
              <div className="rounded-lg border border-dashed p-4 text-sm text-slate-500">No booking was found for that email address.</div>
            ) : (
              <>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="font-semibold text-slate-900">Expected emails: {enabledEmailAuditCount}</h2>
                    <p className="text-xs text-slate-500">
                      {emailAudit.bookings.map((row) => `${rowClient(row)} · ${rowRef(row)} · ${friendlyDate(rowDate(row))}`).join(" | ")}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400">The switches here control each automation for all clients; this list shows whether it applies to this booking.</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-900">
                      <input type="checkbox" checked={auditOnlyEnabled} onChange={(event) => setAuditOnlyEnabled(event.target.checked)} />
                      Show only switched-on emails
                    </label>
                    {emailAudit.items.some((item) => item.duplicateSubject) && (
                      <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800">Possible duplicates found</span>
                    )}
                  </div>
                </div>
                {!emailAudit.items.length ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">A booking was found, but no future automation currently matches it. This may indicate a missing rule or that all planned messages are already in the past.</div>
                ) : !visibleEmailAuditItems.length ? (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">All matching emails for this client are switched off. Untick “Show only switched-on emails” to view and re-enable them.</div>
                ) : (
                  <div className="overflow-x-auto rounded-lg border">
                    <table className="min-w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600"><tr><th className="px-3 py-2">On/off</th><th className="px-3 py-2">Planned date</th><th className="px-3 py-2">Automation</th><th className="px-3 py-2">Subject</th><th className="px-3 py-2">Checks</th><th className="px-3 py-2"></th></tr></thead>
                      <tbody>
                        {visibleEmailAuditItems.map((item) => (
                          <tr key={`${rowRef(item.row)}-${item.rule.id}`} className={`border-t align-top ${item.alreadySent ? "bg-sky-50" : item.rule.enabled === false ? "bg-slate-50 opacity-70" : item.duplicateSubject ? "bg-red-50" : item.overdue ? "bg-amber-50" : ""}`}>
                            <td className="px-3 py-3">
                              <button
                                type="button"
                                role="switch"
                                aria-checked={item.rule.enabled !== false}
                                aria-label={`${item.rule.enabled !== false ? "Turn off" : "Turn on"} automation ${item.rule.sourceNumber}`}
                                onClick={() => setRules((current) => current.map((rule) => rule.id === item.rule.id ? { ...rule, enabled: rule.enabled === false } : rule))}
                                className={`relative h-6 w-11 rounded-full transition ${item.rule.enabled !== false ? "bg-emerald-500" : "bg-slate-300"}`}
                              >
                                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${item.rule.enabled !== false ? "left-[22px]" : "left-0.5"}`} />
                              </button>
                              <div className={`mt-1 text-[10px] font-semibold uppercase ${item.rule.enabled !== false ? "text-emerald-700" : "text-slate-400"}`}>{item.rule.enabled !== false ? "On" : "Off"}</div>
                            </td>
                            <td className="whitespace-nowrap px-3 py-3 font-semibold text-slate-900">
                              {item.alreadySent ? (
                                <><div>Already sent</div><div className="mt-1 text-[11px] font-normal text-slate-500">{item.row.introEmailSentAt ? new Date(item.row.introEmailSentAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "Previously sent"}</div></>
                              ) : <><div>{item.sendLabel}</div>{item.overdue && <div className="mt-1 text-[11px] font-semibold text-amber-700">Overdue — not recorded as sent</div>}</>}
                            </td>
                            <td className="px-3 py-3"><div className="font-medium text-slate-900">Automation {item.rule.sourceNumber}</div><div className="text-slate-500">{item.rule.status === "reviewed" ? "Reviewed" : "Needs review"}</div></td>
                            <td className="max-w-xl px-3 py-3 text-slate-700">{item.subject}</td>
                            <td className="px-3 py-3">
                              <div className="flex flex-wrap gap-1">
                                {item.alreadySent ? <span className="rounded bg-sky-100 px-2 py-1 font-semibold text-sky-800">Sent — excluded from future schedule</span> : item.rule.enabled === false ? <span className="rounded bg-slate-200 px-2 py-1 font-semibold text-slate-600">Switched off — will not send</span> : item.overdue ? <span className="rounded bg-amber-100 px-2 py-1 font-semibold text-amber-800">Needs attention</span> : (
                                  <>
                                    {item.duplicateSubject && <span className="rounded bg-red-100 px-2 py-1 font-semibold text-red-800">Same subject appears more than once</span>}
                                    {item.sameDayCount > 1 && <span className="rounded bg-amber-100 px-2 py-1 font-semibold text-amber-800">{item.sameDayCount} emails on this day</span>}
                                    {!item.duplicateSubject && item.sameDayCount <= 1 && <span className="rounded bg-emerald-100 px-2 py-1 font-semibold text-emerald-800">No collision detected</span>}
                                  </>
                                )}
                              </div>
                            </td>
                            <td className="px-3 py-3"><button type="button" onClick={() => { setSelectedId(item.rule.id); setPreviewRowId(String(item.row._id || rowRef(item.row))); setQuery(rowEmail(item.row)); setGlobal({ agent: "", eventType: "", bookedDj: "any" }); }} className="whitespace-nowrap rounded border border-slate-300 bg-white px-2.5 py-1.5 font-semibold text-slate-700 hover:bg-slate-50">Open rule</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </section>

      <div className="grid min-h-[680px] gap-4 xl:grid-cols-[280px_minmax(420px,0.9fr)_minmax(520px,1.35fr)]">
        <aside className="overflow-hidden rounded-xl border bg-white">
          <div className="border-b px-4 py-3 text-sm font-semibold text-slate-800">Imported templates ({rules.length})</div>
          <div className="max-h-[760px] overflow-y-auto">
            {rules.map((rule) => (
              <div key={rule.id} className={`border-b px-3 py-3 ${rule.id === selected.id ? "bg-sky-50" : "hover:bg-slate-50"}`}>
                <div className="flex items-start gap-2">
                  <button type="button" onClick={() => setSelectedId(rule.id)} className="min-w-0 flex-1 text-left">
                    <div className="flex items-center justify-between gap-2"><span className="text-sm font-medium text-slate-900">Automation {rule.sourceNumber}</span><span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${rule.status === "reviewed" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>{rule.status === "reviewed" ? "Reviewed" : "Needs review"}</span></div>
                    <div className="mt-1 line-clamp-2 text-xs text-slate-500">{rule.subject}</div>
                  </button>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={rule.enabled !== false}
                    aria-label={`${rule.enabled !== false ? "Turn off" : "Turn on"} automation ${rule.sourceNumber}`}
                    onClick={() => setRules((current) => current.map((item) => item.id === rule.id ? { ...item, enabled: item.enabled === false } : item))}
                    className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition ${rule.enabled !== false ? "bg-emerald-500" : "bg-slate-300"}`}
                  >
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${rule.enabled !== false ? "left-[22px]" : "left-0.5"}`} />
                  </button>
                </div>
                <div className={`mt-2 text-[10px] font-semibold uppercase tracking-wide ${rule.enabled !== false ? "text-emerald-700" : "text-slate-400"}`}>{rule.enabled !== false ? "On" : "Off"}</div>
              </div>
            ))}
          </div>
        </aside>

        <section className="space-y-4 rounded-xl border bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div><h2 className="text-lg font-semibold text-slate-900">Rule conditions</h2><p className="text-xs text-slate-500">These start blank where Monday’s screenshots still need reconciling.</p></div>
            <button
              type="button"
              role="switch"
              aria-checked={selected.enabled !== false}
              onClick={() => updateRule({ enabled: selected.enabled === false })}
              className={`flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${selected.enabled !== false ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"}`}
            >
              <span className={`h-2.5 w-2.5 rounded-full ${selected.enabled !== false ? "bg-emerald-500" : "bg-slate-400"}`} />
              {selected.enabled !== false ? "Automation on" : "Automation off"}
            </button>
          </div>
          {selected.enabled === false && <div className="rounded-lg border border-slate-300 bg-slate-50 p-3 text-sm text-slate-600">This automation is switched off. It will stay editable here, but it is excluded from matching clients and client email schedule checks.</div>}
          <label className="block text-xs font-medium text-slate-600">Rule name<input className={`${inputClass} mt-1`} value={selected.name} onChange={(e) => updateRule({ name: e.target.value })} /></label>
          <div className="grid gap-3 sm:grid-cols-2">
            <fieldset className="text-xs font-medium text-slate-600 sm:col-span-2">
              <legend>Agents</legend>
              <div className="mt-1 max-h-44 overflow-y-auto rounded-lg border border-slate-300 bg-white p-2">
                <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-slate-50">
                  <input type="checkbox" checked={!selected.filters.agents?.length} onChange={() => updateFilters({ agents: [] })} />
                  <span>Any agent</span>
                </label>
                <div className="grid gap-x-3 sm:grid-cols-2">
                  {agents.map((agent) => {
                    const checked = selected.filters.agents?.includes(agent) || false;
                    return (
                      <label key={agent} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-slate-50">
                        <input type="checkbox" checked={checked} onChange={() => updateFilters({ agents: checked ? selected.filters.agents.filter((item) => item !== agent) : [...(selected.filters.agents || []), agent] })} />
                        <span>{agent}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
              <p className="mt-1 font-normal text-slate-500">Leave “Any agent” selected, or tick every agent this email applies to.</p>
            </fieldset>
            <fieldset className="text-xs font-medium text-slate-600 sm:col-span-2">
              <legend>Event types</legend>
              <div className="mt-1 max-h-44 overflow-y-auto rounded-lg border border-slate-300 bg-white p-2">
                <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-slate-50">
                  <input type="checkbox" checked={!selected.filters.eventTypes?.length} onChange={() => updateFilters({ eventTypes: [] })} />
                  <span>Any event type</span>
                </label>
                <div className="grid gap-x-3 sm:grid-cols-2">
                  {eventTypes.map((eventType) => {
                    const checked = selected.filters.eventTypes?.includes(eventType) || false;
                    return (
                      <label key={eventType} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-slate-50">
                        <input type="checkbox" checked={checked} onChange={() => updateFilters({ eventTypes: checked ? selected.filters.eventTypes.filter((item) => item !== eventType) : [...(selected.filters.eventTypes || []), eventType] })} />
                        <span>{eventType}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
              <p className="mt-1 font-normal text-slate-500">Leave “Any event type” selected, or tick every event type this email applies to.</p>
            </fieldset>
            <label className="text-xs font-medium text-slate-600">Wedding status<select className={`${inputClass} mt-1`} value={selected.filters.weddingStatus} onChange={(e) => updateFilters({ weddingStatus: e.target.value })}><option value="">Either</option><option>Wedding</option><option>Non-Wedding</option></select></label>
            <label className="text-xs font-medium text-slate-600">DJ<select className={`${inputClass} mt-1`} value={selected.filters.bookedDj} onChange={(e) => updateFilters({ bookedDj: e.target.value })}><option value="any">Either</option><option value="yes">Booked</option><option value="no">Not booked</option></select></label>
            <label className="text-xs font-medium text-slate-600">Manned playlist<select className={`${inputClass} mt-1`} value={selected.filters.bookedPlaylist} onChange={(e) => updateFilters({ bookedPlaylist: e.target.value })}><option value="any">Either</option><option value="yes">Booked</option><option value="no">Not booked</option></select></label>
            <label className="text-xs font-medium text-slate-600">Review<select className={`${inputClass} mt-1`} value={selected.filters.reviewStatus} onChange={(e) => updateFilters({ reviewStatus: e.target.value })}><option value="any">Either</option><option value="received">Received</option><option value="not_received">Not received</option></select></label>
            <label className="text-xs font-medium text-slate-600">Review requests<select className={`${inputClass} mt-1`} value={selected.filters.reviewPermission || "any"} onChange={(e) => updateFilters({ reviewPermission: e.target.value })}><option value="any">Either</option><option value="allowed">Allowed only</option><option value="suppressed">Do not request</option></select></label>
            <label className="text-xs font-medium text-slate-600">Recipient<select className={`${inputClass} mt-1`} value={selected.filters.recipientRole || ""} onChange={(e) => updateFilters({ recipientRole: e.target.value })}><option value="">Any contact</option><option value="direct_client">Direct client</option><option value="agent">Agent / planner</option><option value="end_client_via_agent">End client via agent</option></select></label>
            <label className="text-xs font-medium text-slate-600">Music service<select className={`${inputClass} mt-1`} value={selected.filters.playlistService || ""} onChange={(e) => updateFilters({ playlistService: e.target.value })}><option value="">Any service</option><option value="spotify_playlist">Spotify Playlist</option><option value="manned_playlist">Manned Playlist</option><option value="pro_dj">Pro DJ Service</option></select></label>
          </div>
          <div className="rounded-xl border border-sky-200 bg-sky-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">Planned send rule</p>
            <p className="mt-1 text-sm leading-6 text-sky-950">{describeSendRule(selected.timing)}</p>
            {previewRow && <p className="mt-2 text-xs font-medium text-sky-800">Example for {rowClient(previewRow)}: {proposedSendDate(previewRow, selected.timing)}</p>}
          </div>
          <details className={`rounded-lg border border-slate-200 bg-slate-50 p-3 ${selected.timing.strategy ? "text-slate-400" : ""}`}>
            <summary className="cursor-pointer text-xs font-semibold text-slate-600">Advanced scheduling settings</summary>
            <div className={`mt-3 grid grid-cols-[1fr_120px] gap-3 ${selected.timing.strategy ? "opacity-45" : ""}`}><label className="text-xs font-medium text-slate-600">Date basis<select className={`${inputClass} mt-1 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400`} value={selected.timing.reference} disabled={Boolean(selected.timing.strategy)} onChange={(e) => updateRule({ timing: { ...selected.timing, reference: e.target.value } })}><option value="eventDate">Event date</option><option value="fixed">Manual/fixed date</option></select></label><label className="text-xs font-medium text-slate-600">Days offset<input type="number" className={`${inputClass} mt-1 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400`} value={selected.timing.offsetDays} disabled={Boolean(selected.timing.strategy)} onChange={(e) => updateRule({ timing: { ...selected.timing, offsetDays: Number(e.target.value) } })} /></label></div>
            {selected.timing.strategy && <p className="mt-2 text-[11px] font-medium text-slate-500">Not in use — the planned send rule above calculates the date automatically.</p>}
          </details>
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
              <div className="flex flex-wrap items-center gap-2">
                {matchingRows.length > 0 && <select className={selectClass} value={String(previewRow?._id || rowRef(previewRow))} onChange={(e) => setPreviewRowId(e.target.value)}>{matchingRows.map((row) => <option key={row._id || rowRef(row)} value={String(row._id || rowRef(row))}>{rowClient(row)} · {rowRef(row)}</option>)}</select>}
                {previewRow && <button type="button" onClick={sendTestPreview} disabled={testPreviewState.sending} className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">{testPreviewState.sending ? "Sending…" : "Email test to Rhona"}</button>}
              </div>
            </div>
            {testPreviewState.message && <div className="mt-3 rounded-lg bg-emerald-50 p-2 text-xs font-medium text-emerald-800">{testPreviewState.message}</div>}
            {testPreviewState.error && <div className="mt-3 rounded-lg bg-red-50 p-2 text-xs font-medium text-red-700">{testPreviewState.error}</div>}
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
