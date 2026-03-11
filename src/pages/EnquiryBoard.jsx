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
  { key: "agent", label: "Source", width: 120 },
  { key: "enquiryDateISO", label: "Enquiry Date", width: 140 },
  { key: "enquiryDOW", label: "Enquiry DOW", width: 110 },
  { key: "eventDateISO", label: "Event Date", width: 140 },
  { key: "eventDOW", label: "Event DOW", width: 110 },
  { key: "daysToEvent", label: "Days to Event", width: 120 },
  { key: "actName", label: "Act", width: 180 },
  { key: "actTscName", label: "Act tscName", width: 160 },
  { key: "address", label: "Location", width: 280 },
  { key: "county", label: "County", width: 120 },
  { key: "clientName", label: "Client Name", width: 170 },
  { key: "clientEmail", label: "Client Email", width: 220 },
  { key: "availability", label: "Availability", width: 140, sortable: false },
  { key: "send", label: "Send", width: 140, sortable: false },
  { key: "notes", label: "Notes", width: 260 },
  { key: "status", label: "Status", width: 120 },
  { key: "enquiryRef", label: "Ref", width: 140 },
  { key: "grossValue", label: "Potential Gross", width: 130 },
  { key: "netCommission", label: "Potential Commission", width: 160 },
  { key: "bandSize", label: "Band Size Quoted", width: 150 },
  { key: "maxBudget", label: "Max Budget", width: 130 },
];

function AgentCell({ value, onSave }) {
  const [mode, setMode] = useState(() =>
    value && !AGENTS.includes(value) ? "Other" : value || ""
  );
  const [text, setText] = useState(() => (value && !AGENTS.includes(value) ? value : ""));

  useEffect(() => {
    const isOther = value && !AGENTS.includes(value);
    setMode(isOther ? "Other" : value || "");
    setText(isOther ? value : "");
  }, [value]);

  const commit = (nextVal) => {
    if (!nextVal) return;
    onSave(nextVal);
  };

  return (
    <div className="flex items-center gap-2">
      <select
        className="border rounded px-2 py-1 w-44"
        value={mode}
        onChange={(e) => {
          const v = e.target.value;
          setMode(v);
          if (v !== "Other") commit(v);
        }}
      >
        <option value="">—</option>
        {AGENTS.map((a) => (
          <option key={a} value={a}>
            {a}
          </option>
        ))}
      </select>

      {mode === "Other" && (
        <input
          className="border rounded px-2 py-1 w-48"
          placeholder="Type agent name…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={() => text && commit(text.trim())}
        />
      )}
    </div>
  );
}

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
  const [sending, setSending] = useState({});
  const [slotPick, setSlotPick] = useState({});
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

      setRows(filteredRows);
      setTotal(
        Number(json.total) ||
          Number(json.pagination?.total) ||
          Number(json.count) ||
          filteredRows.length
      );
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

  const triggerAvailability = async (r, options = {}) => {
    const enquiryId = r?._id;
    if (!enquiryId) {
      return { ok: false, message: "Missing enquiry id." };
    }

    const actId = r.actId || r.act_id || r.act?.id || r.act?._id || null;
    const lineupId = r.lineupId || r.lineup_id || r.lineup?.id || r.lineup?._id || null;
    const dateISO = toISODateOnly(r.eventDateISO || r.dateISO);
    const formattedAddress = (r.address || r.formattedAddress || "").trim();
    const clientEmail = (r.clientEmail || r.email || "").trim();
    const clientName = (r.clientName || r.name || "").trim();
    const slotIndexRaw = slotPick[enquiryId] ?? "all";
    const slotIndex = slotIndexRaw === "all" ? null : Number(slotIndexRaw);
    const notify = options.notify !== false;

    if (!actId) {
      if (notify) window.alert("Missing actId on this enquiry row (backend needs to include it).");
      return { ok: false, message: "Missing actId." };
    }
    if (!dateISO) {
      if (notify) window.alert("Missing / invalid event date.");
      return { ok: false, message: "Missing / invalid event date." };
    }
    if (!formattedAddress) {
      if (notify) window.alert("Missing venue / location.");
      return { ok: false, message: "Missing venue / location." };
    }
    if (!clientEmail || !/\S+@\S+\.\S+/.test(clientEmail)) {
      if (notify) window.alert("Missing / invalid client email.");
      return { ok: false, message: "Missing / invalid client email." };
    }

    const payload = {
      actId,
      lineupId,
      dateISO,
      formattedAddress,
      clientName: clientName || "there",
      clientEmail,
      slotIndex,
      enquiryId,
      enquiryRef: r.enquiryRef || r.requestId || null,
      source: "enquiry_board_on_behalf",
    };

    const url = `${API_BASE}/availability/request-on-behalf`;

    setSending((p) => ({ ...p, [enquiryId]: true }));
    try {
      const res = await fetch(url, {
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
        console.error("Availability request failed", { status: res.status, raw, json });
        if (notify) {
          window.alert(json?.message || "Availability request failed (see console).");
        }
        return { ok: false, message: json?.message || "Availability request failed." };
      }

      try {
        await onInlineEdit(enquiryId, {
          lastAvailabilityRequestAt: new Date().toISOString(),
          lastAvailabilityRequestMeta: {
            dateISO,
            formattedAddress,
            clientEmail,
            slotIndex: slotIndex ?? "all",
          },
        });
      } catch {
        // no-op
      }

      if (notify) window.alert("✅ Availability request triggered.");
      fetchRows();
      return { ok: true, message: "Availability request triggered." };
    } catch (e) {
      console.error("Availability request crashed", e);
      if (notify) window.alert("Availability request crashed (see console).");
      return { ok: false, message: "Availability request crashed." };
    } finally {
      setSending((p) => ({ ...p, [enquiryId]: false }));
    }
  };

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
      window.alert("Please select an Act from the search (so we store actId for availability).");
      return;
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

      const out = await triggerAvailability(createdRow, { notify: false });

      if (out?.ok) {
        window.alert("✅ Enquiry added + availability request sent.");
      } else {
        window.alert(
          `✅ Enquiry added, but availability was NOT sent: ${out?.message || "Unknown error"}`
        );
      }
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
          {canManualAdd ? " • admin/all acts" : " • own acts only"}
        </div>

        <div>
          Page {page} of {totalPages}
        </div>
      </div>

      <div className="overflow-auto border rounded">
        <table className="min-w-[2000px] w-full text-sm">
          <colgroup>
            {columns.map((col) => (
              <col key={col.key} style={{ width: col.width }} />
            ))}
          </colgroup>

          <thead className="bg-gray-50 text-left sticky top-0 z-10">
            <tr>
              {columns.map((col) => {
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

              const isBusy = !!sending[r._id];

              return (
                <tr key={r._id} className="odd:bg-white even:bg-gray-50 align-top">
                  <td className="px-3 py-2">
                    <AgentCell value={r.agent || ""} onSave={(val) => onInlineEdit(r._id, { agent: val })} />
                  </td>

                  <td className="px-3 py-2">{fmtShort(r.enquiryDateISO || r.createdAt)}</td>
                  <td className="px-3 py-2">{dow(r.enquiryDateISO || r.createdAt)}</td>
                  <td className="px-3 py-2">{fmtShort(r.eventDateISO || r.dateISO)}</td>
                  <td className="px-3 py-2">{dow(r.eventDateISO || r.dateISO)}</td>
                  <td className="px-3 py-2">
                    {daysBetween(r.enquiryDateISO || r.createdAt, r.eventDateISO || r.dateISO)}
                  </td>

                  <td className="px-3 py-2">{r.actName || "—"}</td>
                  <td className="px-3 py-2">{r.actTscName || "—"}</td>

                  <td className="px-3 py-2">
                    <InlineInput
                      value={r.address || r.formattedAddress || ""}
                      placeholder="Venue / postcode / town…"
                      onCommit={(val) => onInlineEdit(r._id, { address: val })}
                    />
                  </td>

                  <td className="px-3 py-2">{r.county || "—"}</td>

                  <td className="px-3 py-2">
                    <InlineInput
                      value={r.clientName || ""}
                      placeholder="Client name…"
                      onCommit={(val) => onInlineEdit(r._id, { clientName: val })}
                    />
                  </td>

                  <td className="px-3 py-2">
                    <InlineInput
                      value={r.clientEmail || ""}
                      placeholder="client@email.com"
                      onCommit={(val) => onInlineEdit(r._id, { clientEmail: val.toLowerCase() })}
                    />
                  </td>

                  <td className="px-3 py-2">
                    <select
                      className="border rounded px-2 py-1 w-full"
                      value={slotPick[r._id] ?? "all"}
                      onChange={(e) => setSlotPick((p) => ({ ...p, [r._id]: e.target.value }))}
                    >
                      <option value="all">All vocal slots</option>
                      <option value="0">Slot 1</option>
                      <option value="1">Slot 2</option>
                      <option value="2">Slot 3</option>
                    </select>
                    <div className="mt-1">
                      <Tag>{isBusy ? "Sending…" : "Ready"}</Tag>
                    </div>
                  </td>

                  <td className="px-3 py-2">
                    <button
                      className={`px-3 py-2 rounded w-full ${
                        isBusy ? "bg-gray-300 text-gray-700" : "bg-[#ff6667] text-white"
                      }`}
                      disabled={isBusy}
                      onClick={() => triggerAvailability(r)}
                      title="Runs availability requests on behalf of the client using the email/address/date in this row."
                    >
                      {isBusy ? "Sending…" : "Send"}
                    </button>
                  </td>

                  <td className="px-3 py-2">
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

                  <td className="px-3 py-2">
                    <select
                      className="border rounded px-2 py-1"
                      value={r.status || "open"}
                      onChange={(e) => onInlineEdit(r._id, { status: e.target.value })}
                    >
                      {["open", "contacted", "qualified", "closed_won", "closed_lost"].map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>

                  <td className="px-3 py-2">{r.enquiryRef || r.requestId || "—"}</td>
                  <td className="px-3 py-2">{r.grossValue ? money(r.grossValue) : "—"}</td>
                  <td className="px-3 py-2">{r.netCommission != null ? money(r.netCommission) : "—"}</td>
                  <td className="px-3 py-2">{bandSizeQuoted || "—"}</td>
                  <td className="px-3 py-2">{r.maxBudget != null ? money(r.maxBudget) : "—"}</td>
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
                    <span className="text-[11px] text-gray-500">Pick an act to enable availability</span>
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
                Source / Agent
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
                Act tscName
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