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

const fmtDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const monthKey = (value) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Unknown";
  return d.toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });
};

export default function FinanceCommandCentre() {
  const [bookings, setBookings] = useState([]);
  const [totals, setTotals] = useState(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const buildHeaders = () => {
    const token = getAuthToken();
    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}`, token } : {}),
    };
  };

  const fetchBookings = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (status) params.set("status", status);

      const res = await fetch(
        `${API_BASE}/finance/forecast/bookings?${params.toString()}`,
        {
          headers: buildHeaders(),
          credentials: "include",
        },
      );

      const raw = await res.text();
      const json = JSON.parse(raw);

      if (!json?.success) {
        throw new Error(json?.message || "Could not load finance forecast.");
      }

      setBookings(json.bookings || []);
      setTotals(json.totals || null);
    } catch (error) {
      console.error("Finance command centre load failed:", error);
      window.alert(error.message || "Could not load finance command centre.");
      setBookings([]);
      setTotals(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const monthlyRows = useMemo(() => {
    const map = new Map();

    bookings.forEach((booking) => {
      const key = monthKey(booking.eventDateISO || booking.eventDate);
      const existing =
        map.get(key) || {
          month: key,
          count: 0,
          grossValue: 0,
          commissionGross: 0,
          commissionVat: 0,
          commissionNet: 0,
          passThroughGross: 0,
          depositPaid: 0,
          balanceDue: 0,
        };

      existing.count += 1;
      existing.grossValue += Number(booking.grossValue || 0);
      existing.commissionGross += Number(booking.commissionGross || 0);
      existing.commissionVat += Number(booking.commissionVat || 0);
      existing.commissionNet += Number(booking.commissionNet || 0);
      existing.passThroughGross += Number(booking.passThroughGross || 0);
      existing.depositPaid += Number(booking.depositPaid || 0);
      existing.balanceDue += Number(booking.balanceDue || 0);

      map.set(key, existing);
    });

    return [...map.values()];
  }, [bookings]);

  const cards = [
    ["Gross booking value", totals?.grossValue],
    ["Commission gross", totals?.commissionGross],
    ["Commission VAT", totals?.commissionVat],
    ["Commission net", totals?.commissionNet],
    ["Pass-through held", totals?.passThroughGross],
    ["Deposit paid", totals?.depositPaid],
    ["Balance due", totals?.balanceDue],
  ];

  return (
    <div className="p-5">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h1 className="text-2xl font-semibold">Finance Command Centre</h1>
          <p className="text-sm text-gray-600 mt-1">
            Forecast booking income, commission, VAT and pass-through balances.
          </p>
        </div>

        <button
          className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
          onClick={fetchBookings}
          disabled={loading}
        >
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 xl:grid-cols-7 gap-3 mb-5">
        {cards.map(([label, value]) => (
          <div key={label} className="border rounded-xl bg-white p-4 shadow-sm">
            <div className="text-xs text-gray-500">{label}</div>
            <div className="text-lg font-semibold mt-1">{money(value)}</div>
          </div>
        ))}
      </div>

      <div className="border rounded-xl bg-white p-4 mb-5">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-gray-600 mb-1">Search</label>
            <input
              className="border rounded px-3 py-2 w-72"
              placeholder="Client, ref, act, agent…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchBookings()}
            />
          </div>

          <div>
            <label className="block text-xs text-gray-600 mb-1">Status</label>
            <select
              className="border rounded px-3 py-2 w-48"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">All</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <button
            className="px-4 py-2 rounded border hover:bg-gray-50"
            onClick={fetchBookings}
          >
            Apply
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mb-5">
        <div className="border rounded-xl bg-white overflow-hidden">
          <div className="px-4 py-3 border-b font-medium">
            Monthly forecast
          </div>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-3 py-2">Month</th>
                  <th className="px-3 py-2 text-right">Bookings</th>
                  <th className="px-3 py-2 text-right">Gross</th>
                  <th className="px-3 py-2 text-right">Commission net</th>
                  <th className="px-3 py-2 text-right">Balance due</th>
                </tr>
              </thead>
              <tbody>
                {monthlyRows.map((row) => (
                  <tr key={row.month} className="border-t">
                    <td className="px-3 py-2">{row.month}</td>
                    <td className="px-3 py-2 text-right">{row.count}</td>
                    <td className="px-3 py-2 text-right">
                      {money(row.grossValue)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {money(row.commissionNet)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {money(row.balanceDue)}
                    </td>
                  </tr>
                ))}

                {!monthlyRows.length && (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-gray-500">
                      No forecast rows yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="border rounded-xl bg-white p-4">
          <div className="font-medium mb-3">Next build steps</div>
          <div className="space-y-2 text-sm text-gray-700">
            <div>1. Add due dates for deposit, balance, band payouts and VAT.</div>
            <div>2. Add manual expenses and salaries.</div>
            <div>3. Add cash-on-hand opening balance.</div>
            <div>4. Generate a true month-by-month cashflow forecast.</div>
          </div>
        </div>
      </div>

      <div className="border rounded-xl bg-white overflow-hidden">
        <div className="px-4 py-3 border-b font-medium">Synced bookings</div>

        <div className="overflow-auto">
          <table className="min-w-[1300px] w-full text-xs">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-3 py-2">Event date</th>
                <th className="px-3 py-2">Ref</th>
                <th className="px-3 py-2">Client</th>
                <th className="px-3 py-2">Act</th>
                <th className="px-3 py-2">Agent</th>
                <th className="px-3 py-2 text-right">Gross</th>
                <th className="px-3 py-2 text-right">Commission</th>
                <th className="px-3 py-2 text-right">VAT</th>
                <th className="px-3 py-2 text-right">Net comm.</th>
                <th className="px-3 py-2 text-right">Pass-through</th>
                <th className="px-3 py-2 text-right">Balance due</th>
              </tr>
            </thead>

            <tbody>
              {bookings.map((booking) => (
                <tr key={booking._id} className="border-t">
                  <td className="px-3 py-2">
                    {fmtDate(booking.eventDateISO || booking.eventDate)}
                  </td>
                  <td className="px-3 py-2">{booking.bookingRef || "—"}</td>
                  <td className="px-3 py-2">{booking.clientName || "—"}</td>
                  <td className="px-3 py-2">
                    {booking.actTscName || booking.actName || "—"}
                  </td>
                  <td className="px-3 py-2">{booking.agent || "—"}</td>
                  <td className="px-3 py-2 text-right">
                    {money(booking.grossValue)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {money(booking.commissionGross)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {money(booking.commissionVat)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {money(booking.commissionNet)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {money(booking.passThroughGross)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {money(booking.balanceDue)}
                  </td>
                </tr>
              ))}

              {!bookings.length && (
                <tr>
                  <td colSpan={11} className="px-3 py-8 text-center text-gray-500">
                    No synced finance bookings yet. Use “Sync finance” on the booking board first.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}