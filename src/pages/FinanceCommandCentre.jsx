// admin/src/pages/FinanceCommandCentre.jsx
import React, { useEffect, useMemo, useState } from "react";


const API_BASE = (
  import.meta?.env?.VITE_ADMIN_API_BASE ||
  (import.meta?.env?.VITE_BACKEND_URL
    ? `${import.meta.env.VITE_BACKEND_URL}/api`
    : "") ||
  "http://localhost:4000/api"
).replace(/\/$/, "");

const getAuthToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("authToken") ||
  sessionStorage.getItem("token") ||
  "";

const money = (n) =>
  `£${Number(n || 0).toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const dateFmt = (iso) => {
  if (!iso) return "—";
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const iso = (d) => d.toISOString().slice(0, 10);

const getMonthRange = (year, monthIndex) => {
  const start = new Date(year, monthIndex, 1);
  const end = new Date(year, monthIndex + 1, 0);
  return { from: iso(start), to: iso(end) };
};

export default function FinanceCommandCentre() {
  const [bookings, setBookings] = useState([]);
  const [totals, setTotals] = useState({});
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [from, setFrom] = useState(new Date().toISOString().slice(0, 10));
  const [to, setTo] = useState("");
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");


  const headers = useMemo(() => {
    const token = getAuthToken();
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}`, token } : {}),
    };
  }, []);

const loadBookings = async (overrides = {}) => {
  setLoading(true);
  try {
    const nextFrom = overrides.from ?? from;
    const nextTo = overrides.to ?? to;
    const nextStatus = overrides.status ?? status;
    const nextQ = overrides.q ?? q;

    const params = new URLSearchParams();
    if (nextFrom) params.set("from", nextFrom);
    if (nextTo) params.set("to", nextTo);
    if (nextStatus) params.set("status", nextStatus);
    if (nextQ) params.set("q", nextQ);


      const res = await fetch(
        `${API_BASE}/finance/forecast/bookings?${params.toString()}`,
        { headers, credentials: "include" },
      );

      const json = await res.json();

      if (!json?.success) {
        window.alert(json?.message || "Could not load finance forecast.");
        return;
      }

      setBookings(json.bookings || []);
      setTotals(json.totals || {});
    } catch (err) {
      console.error("Finance load failed:", err);
      window.alert(err.message || "Finance load failed.");
    } finally {
      setLoading(false);
    }
  };

  const syncAll = async () => {
    setSyncing(true);
    try {
      const res = await fetch(
        `${API_BASE}/finance/forecast/bookings/sync-all-from-board`,
        {
          method: "POST",
          headers,
          credentials: "include",
        },
      );

      const json = await res.json();

      if (!json?.success) {
        window.alert(json?.message || "Sync failed.");
        return;
      }

      window.alert(`Synced ${json.synced} booking board rows.`);
      await loadBookings();
    } catch (err) {
      console.error("Sync failed:", err);
      window.alert(err.message || "Sync failed.");
    } finally {
      setSyncing(false);
    }
  };

const applyPreset = async (preset) => {
  const now = new Date();
  const year = now.getFullYear();

  let range = { from: "", to: "" };

  if (preset === "thisMonth") {
    range = getMonthRange(year, now.getMonth());
  }

  if (preset === "nextMonth") {
    range = getMonthRange(year, now.getMonth() + 1);
  }

  if (preset === "thisYear") {
    range = { from: `${year}-01-01`, to: `${year}-12-31` };
  }

  if (preset === "nextYear") {
    range = { from: `${year + 1}-01-01`, to: `${year + 1}-12-31` };
  }

  setFrom(range.from);
  setTo(range.to);

  await loadBookings(range);
};





  const deleteBookingRow = async (booking) => {
    if (!window.confirm(`Delete booking ${booking.bookingRef || ""}?`)) return;

    const boardRowId = booking.boardRowId;
    if (!boardRowId) {
      alert("No booking board row ID found for this finance row.");
      return;
    }

    const res = await fetch(`${API_BASE}/board/bookings/${boardRowId}`, {
      method: "DELETE",
      headers,
      credentials: "include",
    });

    const json = await res.json();

    if (!json.success) {
      alert(json.message || "Could not delete booking.");
      return;
    }

    setBookings((prev) => prev.filter((b) => b.boardRowId !== boardRowId));
    await loadBookings();
  };

  const exportCsv = () => {
  const headers = [
    "Event Date",
    "Due Date",
    "Booking Ref",
    "Client",
    "Act",
    "Agent",
    "Gross",
    "Commission Gross",
    "VAT",
    "Commission Net",
    "Pass-through",
    "Deposit Paid",
    "Balance Due",
    "Status",
  ];

  const rows = bookings.map((b) => [
    b.eventDateISO || "",
    b.expectedBalanceDueDateISO || "",
    b.bookingRef || "",
    b.clientName || "",
    b.actTscName || b.actName || "",
    b.agent || "",
    b.grossValue || 0,
    b.commissionGross || 0,
    b.commissionVat || 0,
    b.commissionNet || 0,
    b.passThroughGross || 0,
    b.depositPaid || 0,
    b.balanceDue || 0,
    b.status || "",
  ]);

  const csv = [headers, ...rows]
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `finance-forecast-${from || "all"}-${to || "all"}.csv`;
  link.click();

  URL.revokeObjectURL(url);
};

  const monthlySummary = useMemo(() => {
  const map = {};

  bookings.forEach((b) => {
    const month = b.eventMonth || String(b.eventDateISO || "").slice(0, 7) || "Unknown";

    if (!map[month]) {
      map[month] = {
        month,
        gigs: 0,
        gross: 0,
        commissionNet: 0,
        vat: 0,
        passThrough: 0,
        balanceDue: 0,
      };
    }

    map[month].gigs += 1;
    map[month].gross += Number(b.grossValue || 0);
    map[month].commissionNet += Number(b.commissionNet || 0);
    map[month].vat += Number(b.commissionVat || 0);
    map[month].passThrough += Number(b.passThroughGross || 0);
    map[month].balanceDue += Number(b.balanceDue || 0);
  });

  return Object.values(map).sort((a, b) => a.month.localeCompare(b.month));
}, [bookings]);

const cashflowSummary = useMemo(() => {
  const map = {};

  bookings.forEach((b) => {
    const month =
      String(b.expectedCashDateISO || b.expectedBalanceDueDateISO || b.eventDateISO || "")
        .slice(0, 7) || "Unknown";

    if (!map[month]) {
      map[month] = {
        month,
        gigs: 0,
        expectedCash: 0,
        commissionNet: 0,
        vat: 0,
        passThrough: 0,
      };
    }

    map[month].gigs += 1;
    map[month].expectedCash += Number(b.balanceDue || 0);
    map[month].commissionNet += Number(b.commissionNet || 0);
    map[month].vat += Number(b.commissionVat || 0);
    map[month].passThrough += Number(b.passThroughGross || 0);
  });

  return Object.values(map).sort((a, b) => a.month.localeCompare(b.month));
}, [bookings]);

const maxExpectedCash = Math.max(
  ...cashflowSummary.map((m) => m.expectedCash),
  1
);

const maxMonthlyGross = Math.max(
  ...monthlySummary.map((m) => m.gross),
  1
);

  useEffect(() => {
    loadBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Finance Command Centre</h1>
          <p className="text-sm text-gray-600 mt-1">
            Confirmed bookings, commission, VAT, pass-through and expected cash.
          </p>
        </div>

        <div className="flex gap-2">
          
<button
  onClick={exportCsv}
  className="px-4 py-2 rounded border bg-white"
>
  Export CSV
</button>

          <button
            onClick={syncAll}
            disabled={syncing}
            className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
          >
            {syncing ? "Syncing…" : "Sync from Booking Board"}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {[
          ["This month", "thisMonth"],
          ["Next month", "nextMonth"],
          ["This year", "thisYear"],
          ["Next year", "nextYear"],
          ["All", "all"],
        ].map(([label, value]) => (
          <button
            key={value}
            onClick={() => applyPreset(value)}
            className="px-3 py-1.5 rounded-full border bg-white text-sm hover:bg-gray-100"
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-7 gap-3 mb-5">
        <input
          type="date"
          className="border rounded px-3 py-2"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        />
        <input
          type="date"
          className="border rounded px-3 py-2"
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />
        <select
          className="border rounded px-3 py-2"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="forecast">Forecast</option>
          <option value="balance_due">Balance due</option>
          <option value="paid">Paid</option>
        </select>
        <input
          className="border rounded px-3 py-2 md:col-span-3"
          placeholder="Search ref, client, act, agent…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && loadBookings()}
        />
        <button
          onClick={loadBookings}
          disabled={loading}
          className="px-4 py-2 rounded border bg-white"
        >
          {loading ? "Loading…" : "Apply"}
        </button>
      </div>

  

      <div className="grid grid-cols-1 md:grid-cols-4 xl:grid-cols-7 gap-3 mb-6">
        {[
          ["Gigs", bookings.length, "count"],
          ["Gross", totals.grossValue],
          ["Commission gross", totals.commissionGross],
          ["VAT", totals.commissionVat],
          ["Commission net", totals.commissionNet],
          ["Pass-through", totals.passThroughGross],
          ["Deposit paid", totals.depositPaid],
          ["Balance due", totals.balanceDue],
          ["Expected cash in", totals.balanceDue],
["Net commission retained", totals.commissionNet],
["VAT liability", totals.commissionVat],
["Band/client pass-through", totals.passThroughGross],
        ].map(([label, value, type]) => (
          <div key={label} className="bg-white rounded-xl border p-4 shadow-sm">
            <div className="text-xs text-gray-500">{label}</div>
            <div className="text-lg font-semibold mt-1">
              {type === "count" ? value : money(value)}
            </div>{" "}
          </div>
        ))}
      </div>

      <div className="bg-white border rounded-xl p-4 mb-6 shadow-sm">
  <h2 className="font-semibold mb-3">Reality Check</h2>

  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
    <div>
      <div className="text-gray-500 text-xs">Average gross per gig</div>
      <div className="font-semibold">
        {money(bookings.length ? totals.grossValue / bookings.length : 0)}
      </div>
    </div>

    <div>
      <div className="text-gray-500 text-xs">Average net commission per gig</div>
      <div className="font-semibold">
        {money(bookings.length ? totals.commissionNet / bookings.length : 0)}
      </div>
    </div>

    <div>
      <div className="text-gray-500 text-xs">Commission margin</div>
      <div className="font-semibold">
        {totals.grossValue
          ? `${((totals.commissionNet / totals.grossValue) * 100).toFixed(1)}%`
          : "0%"}
      </div>
    </div>
  </div>
</div>

<div className="bg-white border rounded-xl p-4 mb-6 shadow-sm">
  <h2 className="font-semibold mb-3">Monthly Cashflow Summary</h2>

  <div className="space-y-3">
    {monthlySummary.map((m) => (
      <div key={m.month} className="border rounded-lg p-3">
        <div className="flex justify-between text-sm mb-2">
          <div className="font-medium">{m.month}</div>
          <div>{m.gigs} gigs · {money(m.gross)}</div>
        </div>

        <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-2">
          <div
            className="h-full bg-black rounded-full"
            style={{ width: `${(m.gross / maxMonthlyGross) * 100}%` }}
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs text-gray-600">
          <div>Net comm: {money(m.commissionNet)}</div>
          <div>VAT: {money(m.vat)}</div>
          <div>Pass-through: {money(m.passThrough)}</div>
          <div>Balance due: {money(m.balanceDue)}</div>
          <div>Avg/gig: {money(m.gigs ? m.gross / m.gigs : 0)}</div>
        </div>
      </div>
    ))}

    {!monthlySummary.length && (
      <div className="text-sm text-gray-500">No monthly data for this period.</div>
    )}
  </div>
</div>

<div className="bg-white border rounded-xl overflow-auto shadow-sm mb-6">
  <div className="p-4 border-b">
    <h2 className="font-semibold">Monthly Forecast Table</h2>
  </div>

  <table className="min-w-[1000px] w-full text-sm">
    <thead className="bg-gray-100 text-left">
      <tr>
        {[
          "Month",
          "Gigs",
          "Gross",
          "Net commission",
          "VAT",
          "Pass-through",
          "Balance due",
          "Avg/gig",
        ].map((h) => (
          <th key={h} className="px-3 py-2 border-b whitespace-nowrap">
            {h}
          </th>
        ))}
      </tr>
    </thead>

    <tbody>
      {monthlySummary.map((m) => (
        <tr key={m.month} className="odd:bg-white even:bg-gray-50">
          <td className="px-3 py-2 whitespace-nowrap font-medium">
            {m.month}
          </td>
          <td className="px-3 py-2 text-right">{m.gigs}</td>
          <td className="px-3 py-2 text-right">{money(m.gross)}</td>
          <td className="px-3 py-2 text-right">{money(m.commissionNet)}</td>
          <td className="px-3 py-2 text-right">{money(m.vat)}</td>
          <td className="px-3 py-2 text-right">{money(m.passThrough)}</td>
          <td className="px-3 py-2 text-right">{money(m.balanceDue)}</td>
          <td className="px-3 py-2 text-right">
            {money(m.gigs ? m.gross / m.gigs : 0)}
          </td>
        </tr>
      ))}

      {!monthlySummary.length && (
        <tr>
          <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
            No monthly forecast data for this period.
          </td>
        </tr>
      )}
    </tbody>
  </table>
</div>

<div className="bg-white border rounded-xl p-4 mb-6 shadow-sm">
  <h2 className="font-semibold mb-3">Expected Cash In by Month</h2>

  <div className="space-y-3">
    {cashflowSummary.map((m) => (
      <div key={m.month} className="border rounded-lg p-3">
        <div className="flex justify-between text-sm mb-2">
          <div className="font-medium">{m.month}</div>
          <div>{m.gigs} gigs · {money(m.expectedCash)}</div>
        </div>

        <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-2">
          <div
            className="h-full bg-black rounded-full"
            style={{ width: `${(m.expectedCash / maxExpectedCash) * 100}%` }}
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-600">
          <div>Net comm: {money(m.commissionNet)}</div>
          <div>VAT: {money(m.vat)}</div>
          <div>Pass-through: {money(m.passThrough)}</div>
          <div>Expected cash: {money(m.expectedCash)}</div>
        </div>
      </div>
    ))}
  </div>
</div>

      <div className="bg-white border rounded-xl overflow-auto shadow-sm">
        <table className="min-w-[1400px] w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              {[
                "Event",
                "Due",
                "Ref",
                "Client",
                "Act",
                "Agent",
                "Gross",
                "Commission",
                "VAT",
                "Net comm.",
                "Pass-through",
                "Deposit",
                "Balance",
                "Status",
                "Actions",
              ].map((h) => (
                <th key={h} className="px-3 py-2 border-b whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b._id} className="odd:bg-white even:bg-gray-50">
                <td className="px-3 py-2 whitespace-nowrap">
                  {dateFmt(b.eventDateISO)}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {dateFmt(b.expectedBalanceDueDateISO)}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">{b.bookingRef}</td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {b.clientName || "—"}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {b.actTscName || b.actName || "—"}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {b.agent || "—"}
                </td>
                <td className="px-3 py-2 text-right">{money(b.grossValue)}</td>
                <td className="px-3 py-2 text-right">
                  {money(b.commissionGross)}
                </td>
                <td className="px-3 py-2 text-right">
                  {money(b.commissionVat)}
                </td>
                <td className="px-3 py-2 text-right">
                  {money(b.commissionNet)}
                </td>
                <td className="px-3 py-2 text-right">
                  {money(b.passThroughGross)}
                </td>
                <td className="px-3 py-2 text-right">{money(b.depositPaid)}</td>
                <td className="px-3 py-2 text-right">{money(b.balanceDue)}</td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <span className="px-2 py-1 rounded-full border text-xs bg-white">
                    {b.status || "forecast"}
                  </span>
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <button
                    onClick={() => deleteBookingRow(b)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {!bookings.length && (
              <tr>
                <td
                  colSpan={15}
                  className="px-4 py-8 text-center text-gray-500"
                >
                  No finance forecast bookings found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
