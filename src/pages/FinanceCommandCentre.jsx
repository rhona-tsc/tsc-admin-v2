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
  const [csvOpen, setCsvOpen] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [importingCsv, setImportingCsv] = useState(false);
  const [csvResult, setCsvResult] = useState(null);
const [csvFile, setCsvFile] = useState(null);
const [importingCsvFile, setImportingCsvFile] = useState(false);

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

  const setAndLoad = async (nextFrom, nextTo) => {
    setFrom(nextFrom);
    setTo(nextTo);
    await loadBookings({ from: nextFrom, to: nextTo });
  };

  if (preset === "thisMonth") {
    const range = getMonthRange(year, now.getMonth());
    return setAndLoad(range.from, range.to);
  }

  if (preset === "nextMonth") {
    const range = getMonthRange(year, now.getMonth() + 1);
    return setAndLoad(range.from, range.to);
  }

  if (preset === "thisYear") {
    return setAndLoad(`${year}-01-01`, `${year}-12-31`);
  }

  if (preset === "nextYear") {
    return setAndLoad(`${year + 1}-01-01`, `${year + 1}-12-31`);
  }

  if (preset === "all") {
    return setAndLoad("", "");
  }
};

  const importCsv = async () => {
    if (!csvText.trim()) {
      window.alert("Paste CSV first.");
      return;
    }

    setImportingCsv(true);
    setCsvResult(null);

    try {
      const res = await fetch(`${API_BASE}/board/bookings/bulk-import-csv`, {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({ csv: csvText }),
      });

      const json = await res.json();

      setCsvResult(json);

      if (!json?.success && json?.failed) {
        window.alert(`Imported ${json.imported || 0}, failed ${json.failed}.`);
        return;
      }

      window.alert(
        `Imported ${json.imported || 0}. Synced to finance: ${
          json.syncedToFinance || 0
        }.`,
      );

      setCsvText("");
      await loadBookings();
    } catch (err) {
      console.error("CSV import failed:", err);
      window.alert(err.message || "CSV import failed.");
    } finally {
      setImportingCsv(false);
    }
  };

  const importCsvFile = async () => {
    if (!csvFile) {
      window.alert("Choose a CSV file first.");
      return;
    }

    setImportingCsvFile(true);
    setCsvResult(null);

    try {
      const token = getAuthToken();
      const formData = new FormData();
      formData.append("file", csvFile);

      const res = await fetch(
        `${API_BASE}/board/bookings/bulk-import-csv-file`,
        {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}`, token } : {},
          credentials: "include",
          body: formData,
        },
      );

      const json = await res.json();
      setCsvResult(json);

      if (!json?.success) {
        window.alert(json?.message || "CSV file import failed.");
        return;
      }

      window.alert(
        `Imported ${json.imported || 0}. Synced to finance: ${
          json.syncedToFinance || 0
        }. Skipped: ${json.skippedRows || 0}.`,
      );

      setCsvFile(null);
      await loadBookings();
    } catch (err) {
      console.error("CSV file import failed:", err);
      window.alert(err.message || "CSV file import failed.");
    } finally {
      setImportingCsvFile(false);
    }
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
            onClick={() => setCsvOpen((v) => !v)}
            className="px-4 py-2 rounded border bg-white"
          >
            {csvOpen ? "Close CSV Import" : "Import CSV"}
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

      {csvOpen && (
        <div className="bg-white border rounded-xl p-4 mb-6 shadow-sm">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <h2 className="font-semibold">Bulk import bookings CSV</h2>
              <p className="text-xs text-gray-500 mt-1">
                Paste CSV with headers like bookingRef, clientFirstNames,
                eventDateISO, grossValue, commissionGross, passThroughGross.
              </p>
            </div>

            <button
              onClick={importCsv}
              disabled={importingCsv}
              className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
            >
              {importingCsv ? "Importing…" : "Import + Sync"}
            </button>
          </div>
          <div className="mb-4 rounded-lg border bg-gray-50 p-3">
            <label className="block text-sm font-medium mb-2">
              Upload CSV file
            </label>

            <div className="flex flex-wrap items-center gap-3">
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                className="block text-sm"
              />

              <button
                onClick={importCsvFile}
                disabled={importingCsvFile || !csvFile}
                className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
              >
                {importingCsvFile ? "Uploading…" : "Upload + Sync"}
              </button>

              {csvFile && (
                <span className="text-xs text-gray-500">
                  Selected: {csvFile.name}
                </span>
              )}
            </div>
          </div>
          <textarea
            className="w-full min-h-[180px] border rounded px-3 py-2 font-mono text-xs"
            placeholder={`bookingRef,clientFirstNames,clientEmail,eventDateISO,grossValue,commissionGross,passThroughGross,agent,actName,actTscName,address,county,lineupSelected,arrivalTime,finishTime,clientAddress
TEST-CSV-003,Phoebe and Tyler,pb@example.com,2026-06-12,2105,520,1585,Entertainment Nation,Soul Spectrum,Soul Eras,"Meade Hall, Surrey",Surrey,5 Piece Band,17:00,00:00,"Autoguard House, Frimley"`}
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
          />

          {csvResult && (
            <div className="mt-3 text-sm">
              <div className="flex gap-3 flex-wrap">
                <span>Imported: {csvResult.imported || 0}</span>
                <span>Synced: {csvResult.syncedToFinance || 0}</span>
                <span>Failed: {csvResult.failed || 0}</span>
              </div>

              {Array.isArray(csvResult.errors) &&
                csvResult.errors.length > 0 && (
                  <pre className="mt-3 bg-red-50 border border-red-200 rounded p-3 text-xs overflow-auto">
                    {JSON.stringify(csvResult.errors, null, 2)}
                  </pre>
                )}
            </div>
          )}
        </div>
      )}

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
        ].map(([label, value, type]) => (
          <div key={label} className="bg-white rounded-xl border p-4 shadow-sm">
            <div className="text-xs text-gray-500">{label}</div>
            <div className="text-lg font-semibold mt-1">
              {type === "count" ? value : money(value)}
            </div>{" "}
          </div>
        ))}
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
