  // admin/src/pages/BookingBoard.jsx
import React, { useEffect, useState } from "react";

const API_BASE = (
  import.meta?.env?.VITE_ADMIN_API_BASE ||
  (import.meta?.env?.VITE_BACKEND_URL ? `${import.meta.env.VITE_BACKEND_URL}/api` : "") ||
  "http://localhost:4000/api"
).replace(/\/$/, "");

// Where to send someone if there’s no eventSheetLink on the row
const PUBLIC_SITE_BASE = (import.meta?.env?.VITE_PUBLIC_SITE_URL || "http://localhost:5174").replace(/\/$/, "");
const EVENT_SHEET_FALLBACK = `${PUBLIC_SITE_BASE}/event-sheet`;

const getAuthToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("authToken") ||
  sessionStorage.getItem("token") ||
  "";

const fmtOrdinal = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  const day = d.getDate();
  const j = day % 10, k = day % 100;
  const suffix = j === 1 && k !== 11 ? "st" : j === 2 && k !== 12 ? "nd" : j === 3 && k !== 13 ? "rd" : "th";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }).replace(String(day), `${day}${suffix}`);
};
const fmtShort = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d) ? "—" : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

// --- Helpers for URL normalization, lineup, event sheet summary ---
const normalizeUrl = (u) => {
  if (!u || typeof u !== "string") return "";
  const s = u.trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  // if it looks like a cloudinary or absolute path missing protocol
  if (s.startsWith("//")) return `https:${s}`;
  // otherwise treat as API-relative
  return `${API_BASE.replace(/\/api$/, "")}${s.startsWith("/") ? s : `/${s}`}`;
};

const buildFullLineup = (row) => {
  const label = row?.lineupSelected || "";
  const parts = Array.isArray(row?.lineupComposition) ? [...row.lineupComposition] : [];

  // Try to add services/extras if present on row
  const serviceBits = [];
  const extras = Array.isArray(row?.extras) ? row.extras : Array.isArray(row?.bookingDetails?.extras) ? row.bookingDetails.extras : [];
  const namesFromExtras = (extras || [])
    .map((x) => (typeof x === 'string' ? x : (x?.name || x?.key || "")))
    .filter(Boolean)
    .map((s) => String(s).toLowerCase());
  const hasSoundEng = /sound\s*eng/i.test((namesFromExtras.join(" ")));
  if (hasSoundEng || row?.services?.soundEngineering || row?.bookingDetails?.soundEngineeringBooked) {
    serviceBits.push("sound engineering");
  }
  // Always append band management services as requested
  serviceBits.push("band management services");

  const lineupBits = [];
  if (label) lineupBits.push(label);
  if (parts.length) lineupBits.push(parts.join(", "));
  if (serviceBits.length) lineupBits.push(`with ${serviceBits.join(" and ")}`);
  return lineupBits.filter(Boolean).join(", ");
};

const summariseEventSheetFirstSection = (row) => {
  const ans = row?.eventSheet?.answers || {};
  const p1 = [ans.partner1_first, ans.partner1_last].filter(Boolean).join(" ");
  const p2 = [ans.partner2_first, ans.partner2_last].filter(Boolean).join(" ");
  const intro = ans.introduced_as || "";
  const bits = [];
  if (p1 || p2) bits.push([p1, p2].filter(Boolean).join(" & "));
  if (intro) bits.push(`Introduced as: ${intro}`);
  return bits.join(" • ");
};

const Tag = ({ children }) => (
  <span className="inline-block px-2 py-1 text-xs rounded border">{children}</span>
);

// --- Agent selector (dropdown + "Other...")
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

function AgentCell({ value, onSave }) {
  const [mode, setMode] = useState(() => (value && !AGENTS.includes(value) ? "Other" : (value || "")));
  const [text, setText] = useState(() => (value && !AGENTS.includes(value) ? value : ""));

  useEffect(() => {
    const isOther = value && !AGENTS.includes(value);
    setMode(isOther ? "Other" : (value || ""));
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
        {AGENTS.map(a => <option key={a} value={a}>{a}</option>)}
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

export default function BookingBoard() {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");

  // sorting ui state
  const [sortBy, setSortBy] = useState("eventDateISO"); // eventDateISO | clientFirstNames | createdAt
  const [sortDir, setSortDir] = useState("asc");        // asc | desc

  // manual add row
const [newRow, setNewRow] = useState({
  bookerName: "",        // NEW
  clientFirstNames: "",  // already there
  bookingRef: "",
  eventDateISO: "",
  enquiryDateISO: "",
  bookingDateISO: "",
  agent: "Direct",
  clientEmail: "",
  actName: "",
  actTscName: "",
  address: "",
  county: "",
  grossValue: "",
  lineupSelected: "",
  arrivalTime: "",
  finishTime: "",        // already added earlier
});
  const [adding, setAdding] = useState(false);

  const buildHeaders = () => {
    const token = getAuthToken();
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}`, token } : {}),
    };
  };

  const fetchRows = async () => {
    const url = `${API_BASE}/board/bookings?q=${encodeURIComponent(q)}&sortBy=${encodeURIComponent(sortBy)}&sortDir=${encodeURIComponent(sortDir)}`;
    try {
      const res = await fetch(url, { headers: buildHeaders(), credentials: "include" });
      const raw = await res.text();
      let json = null;
      try { json = JSON.parse(raw); } catch {}
      if (json?.success) setRows(json.rows || []);
      else setRows([]);
    } catch (e) {
      console.error("Board load failed", e);
      setRows([]);
    }
  };

  useEffect(() => { fetchRows(); /* eslint-disable-next-line */ }, []);
  useEffect(() => { fetchRows(); /* when sort changes */ }, [sortBy, sortDir]);

  const onInlineEdit = async (id, patch) => {
    const url = `${API_BASE}/board/bookings/${id}`;
    try {
      const res = await fetch(url, {
        method: "PATCH",
        headers: buildHeaders(),
        credentials: "include",
        body: JSON.stringify(patch),
      });
      const raw = await res.text();
      let json = null;
      try { json = JSON.parse(raw); } catch {}
      if (json?.success) setRows(prev => prev.map(r => (r._id === id ? json.row : r)));
    } catch (e) {
      console.error("PATCH failed", e);
    }
  };

  const money = (n) => `£${Number(n).toLocaleString("en-GB", { maximumFractionDigits: 0 })}`;

  // --- Helpers for deposit, band size, booking details summary ---
  const calcDeposit = (gross) => {
    if (!gross) return null;
    const n = Math.ceil((Number(gross) - 50) * 0.2) + 50;
    return n > 0 ? n : null;
  };

  const extractBandSize = (row) => {
    if (Number(row?.bandSize)) return Number(row.bandSize);
    const s = String(row?.lineupSelected || "");
    const m = s.match(/(\d+)\s*[- ]?\s*piece/i);
    return m ? Number(m[1]) : 0;
  };

  const summariseBookingDetails = (bd = {}, row) => {
    const bits = [];
    if (bd?.ceremony?.start || bd?.ceremony?.end)
      bits.push(`Ceremony ${bd.ceremony.start || "?"}–${bd.ceremony.end || "?"}`);
    if (bd?.afternoon?.start || bd?.afternoon?.end)
      bits.push(`Afternoon ${bd.afternoon.start || "?"}–${bd.afternoon.end || "?"}`);
    if (Array.isArray(bd?.evening?.sets) && bd.evening.sets.length) {
      bits.push(`Evening ${bd.evening.sets.map(s => `${s.start || "?"}–${s.end || "?"}`).join(", ")}`);
    }
    if (bd?.djServicesBooked) bits.push("DJ booked");

    const firstSec = summariseEventSheetFirstSection(row);
    if (firstSec) bits.unshift(firstSec); // put names at the front

    return bits.join(" • ");
  };

  const postManualRow = async () => {
    try {
      const payload = {
        ...newRow,
         clientEmails: newRow.clientEmail ? [{ email: newRow.clientEmail }] : [],
  grossValue: Number(newRow.grossValue || 0) || 0,
  bookingDetails: {},
  allocation: { status: "in_progress" },
  review: { requestedCount: 0, received: false },
  source: "manual",
        enquiryDateISO: newRow.enquiryDateISO || "",  // optional
        bookingDateISO: newRow.bookingDateISO || "",  // optional
        arrivalTime: newRow.arrivalTime || "",
        finishTime: newRow.finishTime || "",
      };
      const res = await fetch(`${API_BASE}/board/bookings`, {
        method: "POST",
        headers: buildHeaders(),
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const raw = await res.text();
      let json = null;
      try { json = JSON.parse(raw); } catch {}
      if (json?.success) {
        setRows(r => [...r, json.row]);
        setAdding(false);
        setNewRow({
          clientFirstNames: "",
          bookingRef: "",
          eventDateISO: "",
          agent: "Direct",
          clientEmail: "",
          actName: "",
          actTscName: "",
          address: "",
          county: "",
          grossValue: "",
          lineupSelected: "",
          arrivalTime: "",
          finishTime: "",
          enquiryDateISO: "",
          bookingDateISO: "",
        });
      }
    } catch (e) {
      console.error("manual add failed", e);
    }
  };

  return (
    <div className="p-4">
      {/* Search + Sort */}
      <div className="flex gap-3 items-center mb-4 flex-wrap">
        <input
          className="border rounded px-3 py-2 w-full max-w-xl"
          placeholder="Search name, ref, act, county…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && fetchRows()}
        />
        <button className="px-4 py-2 rounded bg-black text-white" onClick={fetchRows}>
          Search
        </button>

        <div className="flex items-center gap-2 ml-auto">
          <span className="text-sm text-gray-600">Sort by</span>
          <select
            className="border rounded px-2 py-1"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="eventDateISO">Event date</option>
            <option value="clientFirstNames">Client name</option>
            <option value="createdAt">Booking date</option>
          </select>
          <select
            className="border rounded px-2 py-1"
            value={sortDir}
            onChange={(e) => setSortDir(e.target.value)}
          >
            <option value="asc">Asc</option>
            <option value="desc">Desc</option>
          </select>
        </div>
      </div>

      <div className="overflow-auto border rounded">
        <table className="min-w-[2100px] w-full text-sm">
          <colgroup>
            <col style={{ width: 140 }} />  {/* First names */}
            <col style={{ width: 160 }} />  {/* Ref */}
            <col style={{ width: 110 }} />  {/* Event Sheet */}
            <col style={{ width: 110 }} />  {/* Contract */}
            <col style={{ width: 150 }} />  {/* Enquiry Date */}
            <col style={{ width: 150 }} />  {/* Booking Date */}
            <col style={{ width: 150 }} />  {/* Event Date */}
            <col style={{ width: 110 }} />  {/* Gross */}
            <col style={{ width: 110 }} />  {/* Deposit */}
            <col style={{ width: 110 }} />  {/* Balance */}
            <col style={{ width: 230 }} />  {/* Agent */}
            <col style={{ width: 260 }} />  {/* Client Emails */}
            <col style={{ width: 120 }} />  {/* Event Type */}
            <col style={{ width: 150 }} />  {/* Act */}
            <col style={{ width: 150 }} />  {/* Act tscName */}
            <col style={{ width: 320 }} />  {/* Address */}
            <col style={{ width: 110 }} />  {/* County */}
            <col style={{ width: 110 }} />  {/* Band Size */}
            <col style={{ width: 200 }} />  {/* Lineup */}
            <col style={{ width: 120 }} />  {/* Arrival */}
            <col style={{ width: 260 }} />  {/* Booking details */}
            <col style={{ width: 80 }} />   {/* DJ */}
            <col style={{ width: 140 }} />  {/* Allocated */}
            <col style={{ width: 140 }} />  {/* Review */}
            <col style={{ width: 120 }} />  {/* Balance Paid */}
            <col style={{ width: 120 }} />  {/* Band Paid */}
          </colgroup>

          <thead className="bg-gray-50 text-left">
            <tr>
              {[
                "First names","Ref","Event Sheet","Contract","Enquiry Date","Booking Date","Event Date","Gross","Deposit","Balance",
                "Agent","Client Emails","Event Type","Act","Act tscName","Address","County","Band Size","Lineup","Arrival","Booking details","DJ",
                "Allocated","Review","Balance Paid","Band Paid"
              ].map((h) => (
                <th key={h} className="px-3 py-2 border-b">{h}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map((r) => {
              const gross = Number(r.grossValue || 0);
              // Commission column removed

              // Deposit (prefer backend if present)
              const depositFromBackend = Number(
                r?.payments?.depositChargedAmount ??
                r?.payments?.depositAmount ??
                0
              ) || null;
              const deposit = depositFromBackend != null && depositFromBackend > 0
                ? depositFromBackend
                : calcDeposit(gross);

              const balance = (gross && deposit != null) ? Math.max(0, Math.round(gross - deposit)) : null;

              const fallbackEventSheetUrl = `${EVENT_SHEET_FALLBACK}?ref=${encodeURIComponent(r.bookingRef || "")}`;
              const contractUrl = r?.contractUrl || r?.pdfUrl || (r?.contract && (r.contract.url || r.contract.href)) || "";
              const normalizedContractUrl = normalizeUrl(contractUrl);

              const actTsc = r.actTscName || r.tscName || (r.act && (r.act.tscName || r.act.name)) || "";

              return (
                <tr key={r._id} className="odd:bg-white even:bg-gray-50 align-top">
                  <td className="px-3 py-2">{r.clientFirstNames}</td>
                  <td className="px-3 py-2">{r.bookingRef}</td>

                  {/* Event Sheet */}
                  <td className="px-3 py-2">
                    {r.eventSheetLink ? (
                      <a className="text-blue-600 underline" href={r.eventSheetLink} target="_blank" rel="noreferrer">Open</a>
                    ) : (
                      <button className="px-2 py-1 border rounded hover:bg-gray-100"
                              onClick={() => window.open(fallbackEventSheetUrl, "_blank", "noopener,noreferrer")}>
                        Open
                      </button>
                    )}
                  </td>

                  {/* Contract */}
                  <td className="px-3 py-2">
                    {normalizedContractUrl ? (
                      <a className="text-blue-600 underline" href={normalizedContractUrl} target="_blank" rel="noreferrer">Open</a>
                    ) : "—"}
                  </td>

                  <td className="px-3 py-2">{fmtShort(r.enquiryDateISO)}</td>
                  <td className="px-3 py-2">{fmtShort(r.bookingDateISO || r.createdAt)}</td>

                  <td className="px-3 py-2">{fmtOrdinal(r.eventDateISO)}</td>
                  <td className="px-3 py-2">{gross ? money(gross) : "—"}</td>
                  <td className="px-3 py-2">{deposit != null ? money(deposit) : "—"}</td>
                  <td className="px-3 py-2">{balance != null ? money(balance) : "—"}</td>

                  <td className="px-3 py-2">
                    <AgentCell value={r.agent || "Direct"} onSave={(val) => onInlineEdit(r._id, { agent: val })}/>
                  </td>

                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      {(r.clientEmails || []).map((e, i) => (
                        <Tag key={i}>{e.label ? `${e.label}: ` : ""}{e.email}</Tag>
                      ))}
                    </div>
                  </td>

                  <td className="px-3 py-2">{r.eventType || "—"}</td>
                  <td className="px-3 py-2">{r.actName || "—"}</td>
                  <td className="px-3 py-2">{actTsc || "—"}</td>
                  <td className="px-3 py-2">{r.address || "—"}</td>
                  <td className="px-3 py-2">{r.county || "—"}</td>

                  <td className="px-3 py-2">{extractBandSize(r)}</td>
                  <td className="px-3 py-2">{buildFullLineup(r) || "—"}</td>
                  <td className="px-3 py-2">{r.arrivalTime || "—"}</td>

                  <td className="px-3 py-2">
                    <div className="text-xs leading-5">{summariseBookingDetails(r.bookingDetails, r)}</div>
                  </td>

                  <td className="px-3 py-2">{r.bookingDetails?.djServicesBooked ? "Yes" : "No"}</td>

                  <td className="px-3 py-2">
                    {r.allocation?.status === "fully_allocated" ? <Tag>✅ Allocated</Tag> :
                     r.allocation?.status === "gap" ? <Tag>⚠️ Gap</Tag> :
                     r.allocation?.status === "in_progress" ? <Tag>⏳ In progress</Tag> :
                     <Tag>—</Tag>}
                  </td>

                  <td className="px-3 py-2">
                    {r.review?.received ? (
                      <Tag>⭐ Received</Tag>
                    ) : (
                      <button
                        className="text-xs underline"
                        onClick={() =>
                          onInlineEdit(r._id, {
                            review: {
                              ...(r.review || {}),
                              requestedCount: (r.review?.requestedCount || 0) + 1,
                              lastRequestedAt: new Date().toISOString(),
                            },
                          })
                        }
                      >
                        Send request
                      </button>
                    )}
                  </td>

                  <td className="px-3 py-2">
                    {r.payments?.balancePaymentReceived ? (
                      <span className="inline-block text-xs px-2 py-1 rounded-full bg-green-100 text-green-800 border border-green-200">Paid</span>
                    ) : (
                      <span className="inline-block text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-800 border border-gray-200">—</span>
                    )}
                  </td>

                  <td className="px-3 py-2">
                    {r.payments?.bandPaymentsSent ? (
                      <span className="inline-block text-xs px-2 py-1 rounded-full bg-green-100 text-green-800 border border-green-200">Paid</span>
                    ) : (
                      <span className="inline-block text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-800 border border-gray-200">—</span>
                    )}
                  </td>
                </tr>
              );
            })}

{/* Manual add row (multi-row) */}
<tr className="bg-yellow-50">
  <td colSpan={999} className="px-3 py-3">
    {!adding ? (
      <button
        className="px-3 py-2 border rounded hover:bg-yellow-100"
        onClick={() => setAdding(true)}
      >
        + Add manual entry
      </button>
    ) : (
      <div className="flex flex-col gap-3">
        {/* Row 1: core id + dates */}
        <div className="flex flex-wrap gap-2 items-end">
         <input className="border rounded px-2 py-1 w-56" placeholder="Booker full name"
    value={newRow.bookerName}
    onChange={e => setNewRow(v => ({ ...v, bookerName: e.target.value }))} />
  
  <input className="border rounded px-2 py-1 w-56" placeholder="Client first names"
    value={newRow.clientFirstNames}
    onChange={e => setNewRow(v => ({ ...v, clientFirstNames: e.target.value }))} />
          <input
            className="border rounded px-2 py-1 w-40"
            placeholder="Ref"
            value={newRow.bookingRef}
            onChange={(e) =>
              setNewRow((v) => ({ ...v, bookingRef: e.target.value }))
            }
          />
          <div className="flex flex-col">
            <label className="text-xs text-gray-600">Event date</label>
            <input
              type="date"
              className="border rounded px-2 py-1"
              value={newRow.eventDateISO}
              onChange={(e) =>
                setNewRow((v) => ({ ...v, eventDateISO: e.target.value }))
              }
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-gray-600">Enquiry date</label>
            <input
              type="date"
              className="border rounded px-2 py-1"
              value={newRow.enquiryDateISO}
              onChange={(e) =>
                setNewRow((v) => ({ ...v, enquiryDateISO: e.target.value }))
              }
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-gray-600">Booking date</label>
            <input
              type="date"
              className="border rounded px-2 py-1"
              value={newRow.bookingDateISO}
              onChange={(e) =>
                setNewRow((v) => ({ ...v, bookingDateISO: e.target.value }))
              }
            />
          </div>
        </div>

        {/* Row 2: agent + contact + money */}
        <div className="flex flex-wrap gap-2 items-end">
          <select
            className="border rounded px-2 py-1 w-48"
            value={newRow.agent}
            onChange={(e) =>
              setNewRow((v) => ({ ...v, agent: e.target.value }))
            }
          >
            {AGENTS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <input
            className="border rounded px-2 py-1 w-56"
            placeholder="Client email"
            value={newRow.clientEmail}
            onChange={(e) =>
              setNewRow((v) => ({ ...v, clientEmail: e.target.value }))
            }
          />
          <input
            className="border rounded px-2 py-1 w-28"
            placeholder="Gross"
            value={newRow.grossValue}
            onChange={(e) =>
              setNewRow((v) => ({ ...v, grossValue: e.target.value }))
            }
          />
        </div>

        {/* Row 3: lineup + times */}
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex flex-col">
            <label className="text-xs text-gray-600">Lineup label</label>
            <input
              className="border rounded px-2 py-1 w-56"
              placeholder="e.g., 4-Piece"
              value={newRow.lineupSelected}
              onChange={(e) =>
                setNewRow((v) => ({ ...v, lineupSelected: e.target.value }))
              }
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-gray-600">Arrival time</label>
            <input
              type="time"
              className="border rounded px-2 py-1 w-36"
              step="300"
              value={newRow.arrivalTime}
              onChange={(e) =>
                setNewRow((v) => ({ ...v, arrivalTime: e.target.value }))
              }
            />
          </div>
          <div className="flex flex-col">
            <label className="text-xs text-gray-600">Finish time</label>
            <input
              type="time"
              className="border rounded px-2 py-1 w-36"
              step="300"
              value={newRow.finishTime}
              onChange={(e) =>
                setNewRow((v) => ({ ...v, finishTime: e.target.value }))
              }
            />
          </div>
        </div>

        {/* Row 4: act names */}
        <div className="flex flex-wrap gap-2 items-end">
          <input
            className="border rounded px-2 py-1 w-48"
            placeholder="Act"
            value={newRow.actName}
            onChange={(e) =>
              setNewRow((v) => ({ ...v, actName: e.target.value }))
            }
          />
          <input
            className="border rounded px-2 py-1 w-48"
            placeholder="Act tscName"
            value={newRow.actTscName}
            onChange={(e) =>
              setNewRow((v) => ({ ...v, actTscName: e.target.value }))
            }
          />
        </div>

        {/* Row 5: address */}
        <div className="flex flex-wrap gap-2 items-end">
          <input
            className="border rounded px-2 py-1 w-72"
            placeholder="Address"
            value={newRow.address}
            onChange={(e) =>
              setNewRow((v) => ({ ...v, address: e.target.value }))
            }
          />
          <input
            className="border rounded px-2 py-1 w-44"
            placeholder="County"
            value={newRow.county}
            onChange={(e) =>
              setNewRow((v) => ({ ...v, county: e.target.value }))
            }
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-1">
          <button className="px-3 py-2 bg-black text-white rounded" onClick={postManualRow}>
            Save
          </button>
          <button className="px-3 py-2 border rounded" onClick={() => setAdding(false)}>
            Cancel
          </button>
        </div>
      </div>
    )}
  </td>
</tr>

            {rows.length === 0 && (
              <tr>
                <td className="px-3 py-6 text-center text-gray-500" colSpan={26}>
                  No rows yet.
                  <div className="text-xs mt-2">
                    API: {API_BASE}/board/bookings • token: {getAuthToken() ? "found" : "missing"}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}