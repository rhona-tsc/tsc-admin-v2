// admin/src/pages/EnquiryBoard.jsx
import React, { useEffect, useMemo, useState } from "react";

const API_BASE = (
  import.meta?.env?.VITE_ADMIN_API_BASE ||
  (import.meta?.env?.VITE_BACKEND_URL ? `${import.meta.env.VITE_BACKEND_URL}/api` : "") ||
  "http://localhost:4000/api"
).replace(/\/$/, "");

const getAuthToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("authToken") ||
  sessionStorage.getItem("token") ||
  "";

const parseJwt = (token) => {
  try {
    if (!token) return null;
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

const getJwtEmail = (jwtUser) =>
  String(jwtUser?.email || jwtUser?.useremail || jwtUser?.Useremail || "").toLowerCase();

const getJwtUserId = (jwtUser) =>
  String(jwtUser?._id || jwtUser?.id || jwtUser?.userId || jwtUser?.sub || "");

const isAgentUser = (jwtUser) => {
  const role = String(jwtUser?.role || "").toLowerCase();
  const email = getJwtEmail(jwtUser);

  return (
    ["admin", "superadmin", "tsc_admin", "agent"].includes(role) ||
    email === "hello@thesupremecollective.co.uk"
  );
};

const todayISO = () => new Date().toISOString().slice(0, 10);

const fmtShort = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

const dow = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-GB", { weekday: "short" });
};

const daysBetween = (aISO, bISO) => {
  if (!aISO || !bISO) return "—";
  const a = new Date(aISO);
  const b = new Date(bISO);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return "—";
  const a0 = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const b0 = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.ceil((b0 - a0) / (1000 * 60 * 60 * 24));
};

const Tag = ({ children }) => (
  <span className="inline-block px-2 py-1 text-xs rounded border">{children}</span>
);

const AGENTS = [
  "Alive Network",
  "Direct",
  "Encore",
  "Entertainment Nation",
  "Freak Music",
  "Function Central",
  "LMM",
  "Poptop",
  "Scarlettte",
  "Silk Street",
  "Staar Productions",
  "Warble",
  "Wedding Jam",
  "Other",
].sort((a, b) => a.localeCompare(b));

const EXCLUDED_CLIENT_EMAILS = new Set([
  "hello@thesupremecollective.co.uk",
  "rhona@thesupremecollective.co.uk",
  "rhonadownie@gmail.com",
  "rhonagdownie@gmail.com",
]);

const EXCLUDED_CLIENT_NAMES = new Set(["rhona downie"]);

const shouldHideRow = (row) => {
  const email = String(row?.clientEmail || row?.email || "").trim().toLowerCase();
  const clientName = String(row?.clientName || row?.name || "").trim().toLowerCase();

  return EXCLUDED_CLIENT_EMAILS.has(email) || EXCLUDED_CLIENT_NAMES.has(clientName);
};

const SORTABLE_COLUMNS = {
  agent: "agent",
  enquiryDateISO: "enquiryDateISO",
  enquiryDOW: "enquiryDateISO",
  eventDateISO: "eventDateISO",
  eventDOW: "eventDateISO",
  daysToEvent: "eventDateISO",
  actName: "actName",
  actTscName: "actTscName",
  address: "address",
  county: "county",
  clientName: "clientName",
  clientEmail: "clientEmail",
  notes: "notes",
  status: "status",
  enquiryRef: "enquiryRef",
  grossValue: "grossValue",
  netCommission: "netCommission",
  bandSize: "bandSize",
  maxBudget: "maxBudget",
};

const columns = [
  { key: "agent", label: "Source", width: 150, agentOnly: true },
  { key: "enquiryDateISO", label: "Enquiry Date", width: 165 },
  { key: "enquiryDOW", label: "Enquiry DOW", width: 125 },
  { key: "eventDateISO", label: "Event Date", width: 165 },
  { key: "eventDOW", label: "Event DOW", width: 125 },
  { key: "daysToEvent", label: "Days to Event", width: 140 },
  { key: "actName", label: "Act", width: 220 },
  { key: "actTscName", label: "Original Name", width: 220 },
  { key: "address", label: "Location", width: 340 },
  { key: "county", label: "County", width: 160 },
  { key: "clientName", label: "Client Name", width: 200 },
  { key: "clientEmail", label: "Client Email", width: 260 },
  { key: "availability", label: "Availability Replies", width: 260, sortable: false },
  { key: "availabilityReceived", label: "Availability Received", width: 190, sortable: false },
  { key: "notes", label: "Notes", width: 320 },
  { key: "status", label: "Status", width: 150 },
  { key: "enquiryRef", label: "Ref", width: 160 },
  { key: "grossValue", label: "Potential Gross", width: 150 },
  { key: "netCommission", label: "Potential Commission", width: 180 },
  { key: "bandSize", label: "Band Size Quoted", width: 170 },
  { key: "maxBudget", label: "Max Budget", width: 150 },
];

const SourceCell = ({ value }) => {
  const display = String(value || "").trim() || "—";
  return <span className="whitespace-nowrap">{display}</span>;
};



const normaliseAvailabilityReply = (value) => {
  const v = String(value || "").trim().toLowerCase();
  if (!v) return "—";
  if (["yes", "available", "i am available", "accepted"].includes(v)) return "Available";
  if (["no", "unavailable", "not available", "declined"].includes(v)) return "Unavailable";
  if (["maybe", "tentative"].includes(v)) return "Maybe";
  if (["needsaction", "needs_action", "pending", "sent", "requested"].includes(v)) return "Pending";
  if (["read"].includes(v)) return "Read";
  return String(value || "—");
};

const getAvailabilityGroupKey = (row) => {
  const actKey = String(row?.actId || row?.actName || "").trim().toLowerCase();
  const eventKey = String(row?.eventDateISO || row?.dateISO || "").trim().toLowerCase();
  const emailKey = String(row?.clientEmail || row?.email || "").trim().toLowerCase();
  const nameKey = String(row?.clientName || row?.name || "").trim().toLowerCase();
  const addressKey = String(row?.address || row?.formattedAddress || "").trim().toLowerCase();
  const enquiryKey = String(row?.enquiryDateISO || row?.createdAt || "").trim().toLowerCase();

  return [actKey, eventKey, emailKey, nameKey, addressKey, enquiryKey].join("|");
};

const inferTotalAvailabilitySlots = (row) => {
  const explicit = [
    row?.availabilityTotalSlots,
    row?.availabilitySummary?.totalSlots,
    row?.totalVocalSlots,
    row?.vocalSlots,
    row?.vocalistSlots,
    row?.expectedVocalSlots,
    row?.lineupVocalSlots,
    row?.slotCount,
  ]
    .map((v) => Number(v))
    .find((v) => Number.isInteger(v) && v > 0);

  if (explicit) return explicit;

  const repliedIndexes = [];

  if (Array.isArray(row?.availabilityReplies)) {
    row.availabilityReplies.forEach((item) => {
      const idx = Number(item?.slotIndex);
      if (Number.isInteger(idx)) repliedIndexes.push(idx);
    });
  }

  if (Array.isArray(row?.slotReplies)) {
    row.slotReplies.forEach((item) => {
      const idx = Number(item?.slotIndex);
      if (Number.isInteger(idx)) repliedIndexes.push(idx);
    });
  }

  if (Array.isArray(row?.availabilitySlots)) {
    row.availabilitySlots.forEach((item) => {
      const idx = Number(item?.slotIndex);
      if (Number.isInteger(idx)) repliedIndexes.push(idx);
    });
  }

  if (row?.slotIndex != null) {
    const idx = Number(row.slotIndex);
    if (Number.isInteger(idx)) repliedIndexes.push(idx);
  }

  if (repliedIndexes.length) {
    return Math.max(...repliedIndexes) + 1;
  }

  return 3;
};

const getAvailabilitySlots = (row) => {
  const totalSlots = inferTotalAvailabilitySlots(row);

  const slots = Array.from({ length: totalSlots }, (_, index) => ({
    slotIndex: index,
    label: `Slot ${index + 1}`,
    reply: "—",
  }));

  const assignReply = (slotIndex, reply) => {
    const idx = Number(slotIndex);
    if (!Number.isInteger(idx) || idx < 0 || idx >= slots.length) return;
    slots[idx].reply = normaliseAvailabilityReply(reply);
  };

  if (Array.isArray(row?.availabilitySlots)) {
    row.availabilitySlots.forEach((item) => {
      assignReply(item?.slotIndex, item?.reply || item?.status || item?.availability);
    });
  }

  if (Array.isArray(row?.slotReplies)) {
    row.slotReplies.forEach((item) => {
      assignReply(item?.slotIndex, item?.reply || item?.status || item?.availability);
    });
  }

  if (Array.isArray(row?.availabilityReplies)) {
    row.availabilityReplies.forEach((item) => {
      assignReply(item?.slotIndex, item?.reply || item?.status || item?.availability);
    });
  }

  if (
    row?.availabilityReplies &&
    !Array.isArray(row.availabilityReplies) &&
    typeof row.availabilityReplies === "object"
  ) {
    Object.entries(row.availabilityReplies).forEach(([key, value]) => {
      const match = String(key).match(/(\d+)/);
      if (match) {
        const idx = Number(match[1]) - 1;
        assignReply(idx, value?.reply || value?.status || value?.availability || value);
      }
    });
  }

  if (Array.isArray(row?.availabilitySummary?.slots)) {
    row.availabilitySummary.slots.forEach((item) => {
      assignReply(item?.slotIndex, item?.reply || item?.status || item?.availability);
    });
  }

  if (row?.slotIndex != null && (row?.reply || row?.calendarStatus || row?.status)) {
    assignReply(row.slotIndex, row.reply || row.calendarStatus || row.status);
  }

  return slots;
};

const getAvailabilityReceivedText = (row) => {
  const slots = getAvailabilitySlots(row);
  const received = slots.filter(
    (slot) => slot.reply !== "—" && slot.reply !== "Pending" && slot.reply !== "Read"
  ).length;
  const total = slots.length;
  return `${received}/${total} slots replied`;
};

const mergeEnquiryRows = (rows) => {
  const grouped = new Map();

  (Array.isArray(rows) ? rows : []).forEach((row) => {
    const key = getAvailabilityGroupKey(row);
    const existing = grouped.get(key);

    if (!existing) {
      grouped.set(key, {
        ...row,
        mergedRefs: [row?.enquiryRef || row?.requestId].filter(Boolean),
        availabilityReplies: [
          ...(Array.isArray(row?.availabilityReplies) ? row.availabilityReplies : []),
        ],
        slotReplies: [
          ...(Array.isArray(row?.slotReplies) ? row.slotReplies : []),
        ],
        availabilitySlots: [
          ...(Array.isArray(row?.availabilitySlots) ? row.availabilitySlots : []),
        ],
        availabilityTotalSlots: inferTotalAvailabilitySlots(row),
      });
      return;
    }

    const existingCreated = new Date(existing?.createdAt || existing?.enquiryDateISO || 0).getTime() || 0;
    const nextCreated = new Date(row?.createdAt || row?.enquiryDateISO || 0).getTime() || 0;

    grouped.set(key, {
      ...existing,
      ...row,
      _id: existing._id,
      createdAt:
        existingCreated && nextCreated
          ? new Date(Math.min(existingCreated, nextCreated)).toISOString()
          : existing.createdAt || row.createdAt,
      enquiryDateISO: existing.enquiryDateISO || row.enquiryDateISO,
      agent: existing.agent || row.agent,
      actName: existing.actName || row.actName,
      actTscName: existing.actTscName || row.actTscName,
      address: existing.address || row.address,
      formattedAddress: existing.formattedAddress || row.formattedAddress,
      county: existing.county || row.county,
      clientName: existing.clientName || row.clientName,
      clientEmail: existing.clientEmail || row.clientEmail,
      notes: existing.notes || row.notes,
      status:
        existing.status === "closed_won" || row.status === "closed_won"
          ? "closed_won"
          : existing.status || row.status,
      mergedRefs: Array.from(
        new Set([...(existing.mergedRefs || []), row?.enquiryRef || row?.requestId].filter(Boolean))
      ),
      availabilityReplies: [
        ...(Array.isArray(existing?.availabilityReplies) ? existing.availabilityReplies : []),
        ...(Array.isArray(row?.availabilityReplies) ? row.availabilityReplies : []),
      ],
      slotReplies: [
        ...(Array.isArray(existing?.slotReplies) ? existing.slotReplies : []),
        ...(Array.isArray(row?.slotReplies) ? row.slotReplies : []),
      ],
      availabilitySlots: [
        ...(Array.isArray(existing?.availabilitySlots) ? existing.availabilitySlots : []),
        ...(Array.isArray(row?.availabilitySlots) ? row.availabilitySlots : []),
      ],
      availabilityTotalSlots: Math.max(
        Number(existing?.availabilityTotalSlots || 0),
        Number(inferTotalAvailabilitySlots(row) || 0)
      ),
    });
  });

  return Array.from(grouped.values()).map((row) => ({
    ...row,
    enquiryRef: (row.mergedRefs || []).join(", ") || row.enquiryRef || row.requestId || "",
  }));
};

function InlineInput({ value, placeholder, className = "", onCommit, type = "text" }) {
  const [v, setV] = useState(value || "");

  useEffect(() => setV(value || ""), [value]);

  return (
    <input
      type={type}
      className={`border rounded px-2 py-1 w-full ${className}`}
      placeholder={placeholder}
      value={v}
      onChange={(e) => setV(e.target.value)}
      onBlur={() => {
        const next = (v || "").trim();
        const prev = (value || "").trim();
        if (next !== prev) onCommit(next);
      }}
    />
  );
}

const toISODateOnly = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(iso))) return String(iso);
  return d.toISOString().slice(0, 10);
};

export default function EnquiryBoard() {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");
  const [sortBy, setSortBy] = useState("enquiryDateISO");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [addBusy, setAddBusy] = useState(false);

  const token = getAuthToken();
  const jwtUser = useMemo(() => parseJwt(token), [token]);
  const canManualAdd = isAgentUser(jwtUser);
  const userEmail = getJwtEmail(jwtUser);
  const userId = getJwtUserId(jwtUser);
  const totalPages = Math.max(1, Math.ceil((Number(total) || 0) / Number(limit || 25)));

  const [actSearch, setActSearch] = useState("");
  const [actResults, setActResults] = useState([]);
  const [actLoading, setActLoading] = useState(false);
  const [selectedAct, setSelectedAct] = useState(null);

  const [draft, setDraft] = useState({
    agent: "Direct",
    enquiryDateISO: todayISO(),
    eventDateISO: "",
    actName: "",
    actTscName: "",
    address: "",
    county: "",
    clientName: "",
    clientEmail: "",
    notes: "",
    bandSize: "",
    maxBudget: "",
    grossValue: "",
    netCommission: "",
    actId: "",
    lineupId: "",
    enquiryRef: "",
  });

  const visibleColumns = useMemo(() => {
    return columns.filter((col) => !(col.agentOnly && !canManualAdd));
  }, [canManualAdd]);

  const lineupOptions = useMemo(() => {
    const l = selectedAct?.lineups;
    if (!Array.isArray(l)) return [];

    return l
      .map((x, idx) => {
        const id = x?.lineupId || x?.id || x?._id || x?.uuid || "";
        const label =
          x?.act_size ||
          x?.actSize ||
          x?.name ||
          x?.lineupName ||
          (typeof x === "string" ? x : `Lineup ${idx + 1}`);
        return id ? { id, label } : null;
      })
      .filter(Boolean);
  }, [selectedAct]);

  const buildHeaders = () => {
    const authToken = getAuthToken();
    return {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}`, token: authToken } : {}),
    };
  };

  const fetchRows = async (opts = {}) => {
    const nextPage = Number(opts.page || page || 1);
    const nextLimit = Number(opts.limit || limit || 25);

    const qs = new URLSearchParams();
    if (q) qs.set("q", q);
    qs.set("sortBy", sortBy);
    qs.set("sortDir", sortDir);
    qs.set("page", String(nextPage));
    qs.set("limit", String(nextLimit));

    if (canManualAdd) {
      qs.set("scope", "all");
      qs.set("includeSiteEnquiries", "true");
      qs.set("includeManualEnquiries", "true");
    } else {
      qs.set("scope", "mine");
      qs.set("includeSiteEnquiries", "true");
      qs.set("includeManualEnquiries", "true");
      if (userId) qs.set("userId", userId);
      if (userEmail) qs.set("userEmail", userEmail);
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/board/enquiries?${qs.toString()}`, {
        headers: buildHeaders(),
        credentials: "include",
      });

      const raw = await res.text();
      let json = null;
      try {
        json = JSON.parse(raw);
      } catch {
        json = null;
      }

      if (!json?.success) {
        setRows([]);
        setTotal(0);
        return;
      }

      const incomingRows = Array.isArray(json.rows) ? json.rows : [];
      const filteredRows = incomingRows.filter((row) => !shouldHideRow(row));
const mergedRows = mergeEnquiryRows(filteredRows);

setRows(mergedRows);
setTotal(mergedRows.length);
    } catch (e) {
      console.error("Enquiry board load failed", e);
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRows({ page: 1, limit });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setPage(1);
    fetchRows({ page: 1, limit });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy, sortDir, limit]);

  const setSortFromHeader = (columnKey) => {
    const mappedSortKey = SORTABLE_COLUMNS[columnKey];
    if (!mappedSortKey) return;

    setPage(1);

    if (sortBy === mappedSortKey) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(mappedSortKey);
      setSortDir("asc");
    }
  };

  const getSortIndicator = (columnKey) => {
    const mappedSortKey = SORTABLE_COLUMNS[columnKey];
    if (!mappedSortKey || sortBy !== mappedSortKey) return "";
    return sortDir === "asc" ? " ↑" : " ↓";
  };

  const onInlineEdit = async (id, patch) => {
    const url = `${API_BASE}/board/enquiries/${id}`;
    try {
      const res = await fetch(url, {
        method: "PATCH",
        headers: buildHeaders(),
        credentials: "include",
        body: JSON.stringify(patch),
      });
      const raw = await res.text();
      let json = null;
      try {
        json = JSON.parse(raw);
      } catch {
        json = null;
      }
      if (json?.success) {
        setRows((prev) =>
          prev.map((r) => (r._id === id ? json.row : r)).filter((r) => !shouldHideRow(r))
        );
      }
    } catch (e) {
      console.error("PATCH failed", e);
    }
  };

  const money = (n) => `£${Number(n).toLocaleString("en-GB", { maximumFractionDigits: 0 })}`;


  const openManualAdd = () => {
    setActSearch("");
    setActResults([]);
    setSelectedAct(null);

    setDraft((d) => ({
      ...d,
      agent: d.agent || "Direct",
      enquiryDateISO: d.enquiryDateISO || todayISO(),
      actId: "",
      lineupId: "",
      actName: d.actName || "",
      actTscName: d.actTscName || "",
    }));

    setShowAdd(true);
  };

  const closeManualAdd = () => setShowAdd(false);

  const submitManualAdd = async () => {
    if (!canManualAdd) {
      window.alert("Manual add is agent-only.");
      return;
    }

    const eventDateISO = (draft.eventDateISO || "").trim();
    if (!eventDateISO) {
      window.alert("Please add an Event Date.");
      return;
    }
    if (!draft.actId) {
window.alert("Please select an Act from the search.");      return;
    }

    const address = (draft.address || "").trim();
    const clientEmail = (draft.clientEmail || "").trim().toLowerCase();

    if (!address) {
      window.alert("Please add Venue / Address (needed to send availability request).");
      return;
    }
    if (!clientEmail || !/\S+@\S+\.\S+/.test(clientEmail)) {
      window.alert("Please add a valid Client Email (needed to send availability request).");
      return;
    }

    const payload = {
      agent: (draft.agent || "").trim(),
      enquiryDateISO: (draft.enquiryDateISO || "").trim() || todayISO(),
      eventDateISO,
      actName: (draft.actName || "").trim(),
      actTscName: (draft.actTscName || "").trim(),
      address,
      county: (draft.county || "").trim(),
      clientName: (draft.clientName || "").trim(),
      clientEmail,
      notes: (draft.notes || "").trim(),
      enquiryRef: (draft.enquiryRef || "").trim(),
      bandSize: draft.bandSize ? Number(draft.bandSize) : undefined,
      maxBudget: draft.maxBudget ? Number(draft.maxBudget) : undefined,
      grossValue: draft.grossValue ? Number(draft.grossValue) : undefined,
      netCommission: draft.netCommission ? Number(draft.netCommission) : undefined,
      actId: (draft.actId || "").trim() || undefined,
      lineupId: (draft.lineupId || "").trim() || undefined,
    };

    Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);

    setAddBusy(true);
    try {
      const res = await fetch(`${API_BASE}/board/enquiries`, {
        method: "POST",
        headers: buildHeaders(),
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const raw = await res.text();
      let json = null;
      try {
        json = JSON.parse(raw);
      } catch {
        json = null;
      }

      if (!res.ok || !json?.success) {
        console.error("Manual add failed:", { status: res.status, raw, json });
        window.alert(json?.message || "Manual add failed (see console).");
        return;
      }

      const createdRow = json.row;

      closeManualAdd();
      await fetchRows({ page: 1, limit });

      window.alert("✅ Enquiry added.");
    } catch (e) {
      console.error("Manual add crashed:", e);
      window.alert("Manual add crashed (see console).");
    } finally {
      setAddBusy(false);
    }
  };

  const pickAct = (act) => {
    setSelectedAct(act);
    setDraft((p) => ({
      ...p,
      actId: act?._id || "",
      actName: act?.name || p.actName,
      actTscName: act?.tscName || p.actTscName,
      lineupId: "",
    }));
    setActResults([]);
    setActSearch(act?.tscName || act?.name || "");
  };

  useEffect(() => {
    if (!showAdd) return;

    const term = (actSearch || "").trim();
    if (term.length < 2) {
      setActResults([]);
      return;
    }

    const t = setTimeout(async () => {
      setActLoading(true);
      try {
        const qs = new URLSearchParams();
        qs.set("q", term);
        qs.set("limit", "25");
        qs.set("page", "1");
        qs.set("fields", "_id,name,tscName,lineups");
        qs.set("_cb", String(Date.now()));

        const res = await fetch(`${API_BASE}/act/list?${qs.toString()}`, {
          headers: buildHeaders(),
          credentials: "include",
        });
        const raw = await res.text();
        let json = null;
        try {
          json = JSON.parse(raw);
        } catch {
          json = null;
        }

        const items =
          (Array.isArray(json?.acts) && json.acts) ||
          (Array.isArray(json?.items) && json.items) ||
          (Array.isArray(json?.data) && json.data) ||
          [];

        setActResults(items);
      } catch (e) {
        console.error("Act search failed:", e);
        setActResults([]);
      } finally {
        setActLoading(false);
      }
    }, 300);

    return () => clearTimeout(t);
  }, [actSearch, showAdd]);

  return (
    <div className="p-4">
      <div className="flex gap-3 items-center mb-4 flex-wrap">
        <input
          className="border rounded px-3 py-2 w-full max-w-xl"
          placeholder="Search name, ref, act, county…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              setPage(1);
              fetchRows({ page: 1, limit });
            }
          }}
        />

        <button
          className="px-4 py-2 rounded bg-black text-white"
          onClick={() => {
            setPage(1);
            fetchRows({ page: 1, limit });
          }}
        >
          Search
        </button>

        <div className="flex items-center gap-2 ml-auto flex-wrap">
          <span className="text-sm text-gray-600">Rows</span>
          <select
            className="border rounded px-2 py-1"
            value={limit}
            onChange={(e) => {
              const next = Number(e.target.value);
              setLimit(next);
              setPage(1);
            }}
          >
            {[25, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>

          <span className="text-sm text-gray-600">Sort by</span>
          <select
            className="border rounded px-2 py-1"
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setPage(1);
            }}
          >
            <option value="enquiryDateISO">Enquiry date</option>
            <option value="eventDateISO">Event date</option>
            <option value="createdAt">Created</option>
            <option value="actName">Act</option>
            <option value="clientName">Client</option>
            <option value="grossValue">Potential Gross</option>
          </select>

          <select
            className="border rounded px-2 py-1"
            value={sortDir}
            onChange={(e) => {
              setSortDir(e.target.value);
              setPage(1);
            }}
          >
            <option value="asc">Asc</option>
            <option value="desc">Desc</option>
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3 text-sm text-gray-600 flex-wrap gap-2">
        <div>
          {loading ? "Loading…" : `Showing ${rows.length} row${rows.length === 1 ? "" : "s"}`}
          {total ? ` of ${total}` : ""}
          {canManualAdd ? " • agent/admin view" : " • own acts only"}
        </div>

        <div>
          Page {page} of {totalPages}
        </div>
      </div>

      <div className="overflow-x-auto overflow-y-visible border rounded max-h-[70vh] overflow-auto">
        <table className="min-w-[2600px] w-full text-sm">
          <colgroup>
            {visibleColumns.map((col) => (
              <col key={col.key} style={{ width: col.width }} />
            ))}
          </colgroup>

          <thead className="bg-gray-50 text-left sticky top-0 z-10">
            <tr>
              {visibleColumns.map((col) => {
                const sortable = col.sortable !== false && !!SORTABLE_COLUMNS[col.key];
                return (
                  <th key={col.key} className="px-3 py-2 border-b">
                    {sortable ? (
                      <button
                        type="button"
                        className="font-medium text-left hover:underline"
                        onClick={() => setSortFromHeader(col.key)}
                        title={`Sort by ${col.label}`}
                      >
                        {col.label}
                        {getSortIndicator(col.key)}
                      </button>
                    ) : (
                      <span>{col.label}</span>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {rows.map((r) => {
              const bandSizeQuoted =
                Number(r.bandSize) ||
                (() => {
                  const s = String(r?.lineupSelected || "");
                  const m = s.match(/(\d+)\s*[- ]?\s*piece/i);
                  return m ? Number(m[1]) : 0;
                })();

              return (
                <tr key={r._id} className="odd:bg-white even:bg-gray-50 align-top">
                  {/* Source cell - only render if canManualAdd */}
                  {canManualAdd && (
                    <td className="px-3 py-2">
                      <SourceCell value={r.agent || ""} />
                    </td>
                  )}
                  {/* The rest of the columns, skipping agent if agentOnly and !canManualAdd */}
                  {visibleColumns
                    .filter((col) => !(col.key === "agent" && canManualAdd))
                    .map((col) => {
                      switch (col.key) {
                        case "enquiryDateISO":
                          return (
                            <td key={col.key} className="px-3 py-2">
                              {fmtShort(r.enquiryDateISO || r.createdAt)}
                            </td>
                          );
                        case "enquiryDOW":
                          return (
                            <td key={col.key} className="px-3 py-2">
                              {dow(r.enquiryDateISO || r.createdAt)}
                            </td>
                          );
                        case "eventDateISO":
                          return (
                            <td key={col.key} className="px-3 py-2">
                              {fmtShort(r.eventDateISO || r.dateISO)}
                            </td>
                          );
                        case "eventDOW":
                          return (
                            <td key={col.key} className="px-3 py-2">
                              {dow(r.eventDateISO || r.dateISO)}
                            </td>
                          );
                        case "daysToEvent":
                          return (
                            <td key={col.key} className="px-3 py-2">
                              {daysBetween(r.enquiryDateISO || r.createdAt, r.eventDateISO || r.dateISO)}
                            </td>
                          );
                        case "actName":
                          return (
                            <td key={col.key} className="px-3 py-2">
                              {r.actName || "—"}
                            </td>
                          );
                        case "actTscName":
                          return (
                            <td key={col.key} className="px-3 py-2">
                              {r.actTscName || "—"}
                            </td>
                          );
                        case "address":
  return (
    <td key={col.key} className="px-3 py-2">
      <span>{r.address || r.formattedAddress || "—"}</span>
    </td>
  );
                        case "county":
                          return (
                            <td key={col.key} className="px-3 py-2">
                              {r.county || "—"}
                            </td>
                          );
                       case "clientName":
  return (
    <td key={col.key} className="px-3 py-2">
      <span>{r.clientName || "—"}</span>
    </td>
  );
                       case "clientEmail":
  return (
    <td key={col.key} className="px-3 py-2">
      <span>{r.clientEmail || "—"}</span>
    </td>
  );
                        case "availability": {
                          const slots = getAvailabilitySlots(r);
                          return (
                            <td key={col.key} className="px-3 py-2">
                              <div className="space-y-1 min-w-[220px]">
                                {slots.map((slot) => (
                                  <div key={slot.slotIndex} className="flex items-center justify-between gap-3 text-xs">
                                    <span className="text-gray-600 whitespace-nowrap">{slot.label}</span>
                                    <span className="font-medium text-right">{slot.reply}</span>
                                  </div>
                                ))}
                              </div>
                            </td>
                          );
                        }
                       case "availabilityReceived": {
  const slots = getAvailabilitySlots(r);
  const received = slots.filter(
    (slot) => slot.reply !== "—" && slot.reply !== "Pending" && slot.reply !== "Read"
  ).length;
  const total = slots.length;
  const isComplete = total > 0 && received >= total;

  return (
    <td key={col.key} className="px-3 py-2">
      <span
        className={`inline-block whitespace-nowrap rounded px-2 py-1 text-xs font-medium ${
          isComplete
            ? "bg-green-100 text-green-800 border border-green-200"
            : "bg-gray-100 text-gray-700 border border-gray-200"
        }`}
      >
        {`${received}/${total} slots replied`}
      </span>
    </td>
  );
}
                        case "notes":
                          return (
                            <td key={col.key} className="px-3 py-2">
                              <textarea
                                rows={1}
                                className="border rounded px-2 py-1 w-full"
                                defaultValue={r.notes || ""}
                                onBlur={(e) => {
                                  const val = e.target.value || "";
                                  if (val !== (r.notes || "")) onInlineEdit(r._id, { notes: val.trim() });
                                }}
                              />
                            </td>
                          );
                        case "status":
                          return (
                            <td key={col.key} className="px-3 py-2">
                              <select
                                className="border rounded px-2 py-1"
                                value={r.status || "open"}
                                onChange={(e) => onInlineEdit(r._id, { status: e.target.value })}
                              >
                                {[
                                  { value: "open", label: "Open" },
                                  { value: "contacted", label: "Contacted" },
                                  { value: "qualified", label: "Qualified" },
                                  { value: "closed_won", label: "Booked" },
                                  { value: "closed_lost", label: "Closed Lost" },
                                ].map((s) => (
                                  <option key={s.value} value={s.value}>
                                    {s.label}
                                  </option>
                                ))}
                              </select>
                            </td>
                          );
                        case "enquiryRef":
                          return (
                            <td key={col.key} className="px-3 py-2">
                              {r.enquiryRef || r.requestId || "—"}
                            </td>
                          );
                        case "grossValue":
                          return (
                            <td key={col.key} className="px-3 py-2">
                              {r.grossValue ? money(r.grossValue) : "—"}
                            </td>
                          );
                        case "netCommission":
                          return (
                            <td key={col.key} className="px-3 py-2">
                              {r.netCommission != null ? money(r.netCommission) : "—"}
                            </td>
                          );
                        case "bandSize":
                          return (
                            <td key={col.key} className="px-3 py-2">
                              {bandSizeQuoted || "—"}
                            </td>
                          );
                        case "maxBudget":
                          return (
                            <td key={col.key} className="px-3 py-2">
                              {r.maxBudget != null ? money(r.maxBudget) : "—"}
                            </td>
                          );
                        default:
                          return (
                            <td key={col.key} className="px-3 py-2">
                              {r[col.key] || "—"}
                            </td>
                          );
                      }
                    })}
                </tr>
              );
            })}

            <tr className="bg-yellow-50">
              <td colSpan={999} className="px-3 py-3">
                <button
                  className={`px-3 py-2 border rounded ${
                    canManualAdd ? "bg-white hover:bg-gray-50" : "opacity-60 cursor-not-allowed"
                  }`}
                  disabled={!canManualAdd}
                  onClick={openManualAdd}
                  title={canManualAdd ? "Add a manual enquiry" : "Agent-only"}
                >
                  + Manual add enquiry
                </button>

                {!canManualAdd && <span className="ml-3 text-xs text-gray-600">(Agent-only)</span>}
              </td>
            </tr>

            {!loading && rows.length === 0 && (
              <tr>
                <td className="px-3 py-6 text-center text-gray-500" colSpan={999}>
                  No rows yet.
                  <div className="text-xs mt-2">
                    API: {API_BASE}/board/enquiries • token: {getAuthToken() ? "found" : "missing"}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4 flex-wrap gap-3">
        <div className="text-sm text-gray-600">{total ? `Total: ${total}` : "Total: 0"}</div>

        <div className="flex items-center gap-2">
          <button
            className="px-3 py-2 border rounded disabled:opacity-50"
            disabled={page <= 1 || loading}
            onClick={() => {
              const next = Math.max(1, page - 1);
              setPage(next);
              fetchRows({ page: next, limit });
            }}
          >
            Prev
          </button>

          <span className="text-sm text-gray-700">
            Page {page} / {totalPages}
          </span>

          <button
            className="px-3 py-2 border rounded disabled:opacity-50"
            disabled={page >= totalPages || loading}
            onClick={() => {
              const next = Math.min(totalPages, page + 1);
              setPage(next);
              fetchRows({ page: next, limit });
            }}
          >
            Next
          </button>
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Manual Enquiry</h3>
              <button className="text-sm underline" onClick={closeManualAdd}>
                Close
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="text-xs col-span-2">
                <div className="flex items-center justify-between">
                  <span>
                    Act (search & select) <span className="text-red-500">*</span>
                  </span>
                  {draft.actId ? (
                    <span className="text-[11px] text-gray-500">actId: {draft.actId}</span>
                  ) : (
                    <span className="text-[11px] text-gray-500">Pick an act to link this enquiry</span>
                  )}
                </div>

                <input
                  className="border rounded px-2 py-2 w-full mt-1"
                  placeholder="Type 2+ chars (e.g. dancefloor magic)…"
                  value={actSearch}
                  onChange={(e) => setActSearch(e.target.value)}
                />

                {actLoading && <div className="mt-2 text-[11px] text-gray-500">Searching…</div>}

                {!actLoading && actResults.length > 0 && (
                  <div className="mt-2 border rounded max-h-56 overflow-auto">
                    {actResults.map((a) => (
                      <button
                        key={a._id}
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b last:border-b-0"
                        onClick={() => pickAct(a)}
                      >
                        <div className="font-medium text-sm">{a.name || "—"}</div>
                        <div className="text-[11px] text-gray-500">{a.tscName || "—"}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <label className="text-xs col-span-2">
                Lineup (optional — leave blank to auto-pick smallest)
                <select
                  className="border rounded px-2 py-2 w-full"
                  value={draft.lineupId || ""}
                  onChange={(e) => setDraft((p) => ({ ...p, lineupId: e.target.value }))}
                  disabled={!draft.actId || lineupOptions.length === 0}
                >
                  <option value="">Auto (smallest lineup)</option>
                  {lineupOptions.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-xs">
                Source
                <select
                  className="border rounded px-2 py-2 w-full"
                  value={draft.agent}
                  onChange={(e) => setDraft((p) => ({ ...p, agent: e.target.value }))}
                >
                  {AGENTS.filter((a) => a !== "Other").map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                  <option value="Other">Other</option>
                </select>
              </label>

              <label className="text-xs">
                Enquiry Date
                <input
                  type="date"
                  className="border rounded px-2 py-2 w-full"
                  value={draft.enquiryDateISO}
                  onChange={(e) => setDraft((p) => ({ ...p, enquiryDateISO: e.target.value }))}
                />
              </label>

              <label className="text-xs">
                Event Date <span className="text-red-500">*</span>
                <input
                  type="date"
                  className="border rounded px-2 py-2 w-full"
                  value={draft.eventDateISO}
                  onChange={(e) => setDraft((p) => ({ ...p, eventDateISO: e.target.value }))}
                />
              </label>

              <label className="text-xs">
                Ref (optional)
                <input
                  className="border rounded px-2 py-2 w-full"
                  placeholder="ENQ-..."
                  value={draft.enquiryRef}
                  onChange={(e) => setDraft((p) => ({ ...p, enquiryRef: e.target.value }))}
                />
              </label>

              <label className="text-xs col-span-1">
                Act Name
                <input
                  className="border rounded px-2 py-2 w-full"
                  value={draft.actName}
                  onChange={(e) => setDraft((p) => ({ ...p, actName: e.target.value }))}
                />
              </label>

              <label className="text-xs col-span-1">
                Original Name
                <input
                  className="border rounded px-2 py-2 w-full"
                  value={draft.actTscName}
                  onChange={(e) => setDraft((p) => ({ ...p, actTscName: e.target.value }))}
                />
              </label>

              <label className="text-xs col-span-2">
                Venue / Address
                <input
                  className="border rounded px-2 py-2 w-full"
                  value={draft.address}
                  onChange={(e) => setDraft((p) => ({ ...p, address: e.target.value }))}
                />
              </label>

              <label className="text-xs col-span-1">
                County
                <input
                  className="border rounded px-2 py-2 w-full"
                  value={draft.county}
                  onChange={(e) => setDraft((p) => ({ ...p, county: e.target.value }))}
                />
              </label>

              <label className="text-xs col-span-1">
                Band size quoted
                <input
                  type="number"
                  className="border rounded px-2 py-2 w-full"
                  value={draft.bandSize}
                  onChange={(e) => setDraft((p) => ({ ...p, bandSize: e.target.value }))}
                />
              </label>

              <label className="text-xs col-span-1">
                Client Name
                <input
                  className="border rounded px-2 py-2 w-full"
                  value={draft.clientName}
                  onChange={(e) => setDraft((p) => ({ ...p, clientName: e.target.value }))}
                />
              </label>

              <label className="text-xs col-span-1">
                Client Email
                <input
                  className="border rounded px-2 py-2 w-full"
                  value={draft.clientEmail}
                  onChange={(e) => setDraft((p) => ({ ...p, clientEmail: e.target.value }))}
                />
              </label>

              <label className="text-xs col-span-2">
                Notes
                <textarea
                  rows={3}
                  className="border rounded px-2 py-2 w-full"
                  value={draft.notes}
                  onChange={(e) => setDraft((p) => ({ ...p, notes: e.target.value }))}
                />
              </label>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button className="px-4 py-2 border rounded" onClick={closeManualAdd}>
                Cancel
              </button>
              <button
                className={`px-4 py-2 rounded text-white ${addBusy ? "bg-gray-400" : "bg-[#ff6667]"}`}
                disabled={addBusy}
                onClick={submitManualAdd}
              >
                {addBusy ? "Saving..." : "Create enquiry"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}