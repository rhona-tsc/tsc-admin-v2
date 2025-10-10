// admin/src/pages/EnquiryBoard.jsx
import React, { useEffect, useState } from "react";

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

const fmtShort = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d) ? "—" : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const dow = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d) ? "—" : d.toLocaleDateString("en-GB", { weekday: "short" });
};

const daysBetween = (aISO, bISO) => {
  if (!aISO || !bISO) return "—";
  const a = new Date(aISO); const b = new Date(bISO);
  if (isNaN(a) || isNaN(b)) return "—";
  const a0 = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const b0 = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.ceil((b0 - a0) / (1000 * 60 * 60 * 24));
};

const Tag = ({ children }) => (
  <span className="inline-block px-2 py-1 text-xs rounded border">{children}</span>
);

// --- Agent selector (dropdown + "Other...")
const AGENTS = [
  "Alive Network","Direct","Encore","Entertainment Nation","Freak Music",
  "Function Central","LMM","Poptop","Scarlettte","Silk Street",
  "Staar Productions","Warble","Wedding Jam","Other",
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

export default function EnquiryBoard() {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState("");

  // sorting ui state
  const [sortBy, setSortBy] = useState("enquiryDateISO"); // enquiryDateISO | eventDateISO | createdAt
  const [sortDir, setSortDir] = useState("asc");          // asc | desc

  const buildHeaders = () => {
    const token = getAuthToken();
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}`, token } : {}),
    };
  };

  const fetchRows = async () => {
    const url = `${API_BASE}/board/enquiries?q=${encodeURIComponent(q)}&sortBy=${encodeURIComponent(sortBy)}&sortDir=${encodeURIComponent(sortDir)}`;
    try {
      const res = await fetch(url, { headers: buildHeaders(), credentials: "include" });
      const raw = await res.text();
      let json = null;
      try { json = JSON.parse(raw); } catch {}
      if (json?.success) setRows(json.rows || []);
      else setRows([]);
    } catch (e) {
      console.error("Enquiry board load failed", e);
      setRows([]);
    }
  };

  useEffect(() => { fetchRows(); /* eslint-disable-next-line */ }, []);
  useEffect(() => { fetchRows(); /* when sort changes */ }, [sortBy, sortDir]);

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
      try { json = JSON.parse(raw); } catch {}
      if (json?.success) setRows(prev => prev.map(r => (r._id === id ? json.row : r)));
    } catch (e) {
      console.error("PATCH failed", e);
    }
  };

  const money = (n) => `£${Number(n).toLocaleString("en-GB", { maximumFractionDigits: 0 })}`;

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
            <option value="enquiryDateISO">Enquiry date</option>
            <option value="eventDateISO">Event date</option>
            <option value="createdAt">Created</option>
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
        <table className="min-w-[1600px] w-full text-sm">
          <colgroup>
            <col style={{ width: 120 }} />
            <col style={{ width: 140 }} />
            <col style={{ width: 110 }} />
            <col style={{ width: 140 }} />
            <col style={{ width: 110 }} />
            <col style={{ width: 120 }} />
            <col style={{ width: 180 }} />
            <col style={{ width: 160 }} />
            <col style={{ width: 280 }} />
            <col style={{ width: 120 }} />
            <col style={{ width: 260 }} />
            <col style={{ width: 120 }} />
            <col style={{ width: 140 }} />
            <col style={{ width: 130 }} />
            <col style={{ width: 160 }} />
            <col style={{ width: 150 }} />
            <col style={{ width: 130 }} />
          </colgroup>

          <thead className="bg-gray-50 text-left">
            <tr>
              {[
                "Source","Enquiry Date","Enquiry DOW","Event Date","Event DOW","Days to Event","Act","Act tscName","Location","County","Notes","Status","Ref","Potential Gross","Potential Commission","Band Size Quoted","Max Budget"
              ].map((h) => (
                <th key={h} className="px-3 py-2 border-b">{h}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map((r) => (
              <tr key={r._id} className="odd:bg-white even:bg-gray-50 align-top">
                {/* Source */}
                <td className="px-3 py-2">
                  <AgentCell value={r.agent || ""} onSave={(val) => onInlineEdit(r._id, { agent: val })}/>
                </td>

                {/* Enquiry date + DOW */}
                <td className="px-3 py-2">{fmtShort(r.enquiryDateISO)}</td>
                <td className="px-3 py-2">{dow(r.enquiryDateISO)}</td>

                {/* Event date + DOW */}
                <td className="px-3 py-2">{fmtShort(r.eventDateISO)}</td>
                <td className="px-3 py-2">{dow(r.eventDateISO)}</td>

                {/* Days to event */}
                <td className="px-3 py-2">{daysBetween(r.enquiryDateISO, r.eventDateISO)}</td>

                {/* Act names */}
                <td className="px-3 py-2">{r.actName || "—"}</td>
                <td className="px-3 py-2">{r.actTscName || "—"}</td>

                {/* Location / County */}
                <td className="px-3 py-2">{r.address || "—"}</td>
                <td className="px-3 py-2">{r.county || "—"}</td>

                {/* Notes (inline editable) */}
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

                {/* Status */}
                <td className="px-3 py-2">
                  <select
                    className="border rounded px-2 py-1"
                    value={r.status || "open"}
                    onChange={(e) => onInlineEdit(r._id, { status: e.target.value })}
                  >
                    {["open","contacted","qualified","closed_won","closed_lost"].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>

                {/* Ref */}
                <td className="px-3 py-2">{r.enquiryRef || "—"}</td>

                {/* Potential £ */}
                <td className="px-3 py-2">{r.grossValue ? money(r.grossValue) : "—"}</td>
                <td className="px-3 py-2">{r.netCommission != null ? money(r.netCommission) : "—"}</td>

                {/* Quoted band size + max budget */}
                <td className="px-3 py-2">{Number(r.bandSize) || (() => {
                  const s = String(r?.lineupSelected || "");
                  const m = s.match(/(\d+)\s*[- ]?\s*piece/i);
                  return m ? Number(m[1]) : 0;
                })()}</td>
                <td className="px-3 py-2">{r.maxBudget != null ? money(r.maxBudget) : "—"}</td>
              </tr>
            ))}

            {/* Manual add – coming soon */}
            <tr className="bg-yellow-50">
              <td colSpan={999} className="px-3 py-3">
                <button className="px-3 py-2 border rounded opacity-60 cursor-not-allowed" disabled>
                  Manual add (coming soon)
                </button>
              </td>
            </tr>

            {rows.length === 0 && (
              <tr>
                <td className="px-3 py-6 text-center text-gray-500" colSpan={26}>
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
    </div>
  );
}