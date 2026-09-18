import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { backendUrl } from "../App";
import CustomToast from "../components/CustomToast";

const paymentStatusLabels = {
  not_started: "Not started",
  setup_required: "Setup required",
  setup_pending: "Setup pending",
  ready_to_charge: "Ready to charge",
  charge_pending: "Charge pending",
  paid: "Client paid",
  failed: "Failed",
  refunded: "Refunded",
  cancelled: "Cancelled",
  not_required: "Not required",
};

const payoutStatusLabels = {
  not_ready: "Not ready",
  scheduled: "Scheduled",
  pending: "Pending",
  paid: "Paid",
  failed: "Failed",
  cancelled: "Cancelled",
};

const statusStyles = {
  paid: "bg-emerald-100 text-emerald-800",
  ready_to_charge: "bg-blue-100 text-blue-800",
  scheduled: "bg-blue-100 text-blue-800",
  pending: "bg-amber-100 text-amber-800",
  setup_pending: "bg-amber-100 text-amber-800",
  charge_pending: "bg-amber-100 text-amber-800",
  failed: "bg-red-100 text-red-800",
  cancelled: "bg-gray-200 text-gray-700",
  refunded: "bg-purple-100 text-purple-800",
};

const formatCurrency = (value, currency = "GBP") =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currency || "GBP",
  }).format(Number(value || 0));

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const StatusBadge = ({ value, labels }) => (
  <span
    className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${
      statusStyles[value] || "bg-gray-100 text-gray-700"
    }`}
  >
    {labels[value] || value?.replaceAll("_", " ") || "Unknown"}
  </span>
);

const SummaryCard = ({ label, value, helper }) => (
  <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
    <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
    <p className="mt-1 text-xs text-gray-500">{helper}</p>
  </div>
);

const PaymentTracker = ({ token }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchPayments = useCallback(
    async ({ quiet = false } = {}) => {
      quiet ? setRefreshing(true) : setLoading(true);
      try {
        const res = await axios.get(`${backendUrl}/api/deputy-jobs/payments`, {
          headers: { token },
        });
        if (!res.data?.success) throw new Error(res.data?.message || "Unable to load payments");
        setPayments(Array.isArray(res.data.payments) ? res.data.payments : []);
      } catch (error) {
        console.error("Failed to fetch deputy payments:", error);
        toast(
          <CustomToast
            type="error"
            message={error?.response?.data?.message || error.message || "Failed to fetch deputy payments."}
          />,
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token],
  );

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const filteredPayments = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return payments.filter((payment) => {
      const matchesStatus =
        statusFilter === "all" ||
        payment.paymentStatus === statusFilter ||
        payment.payoutStatus === statusFilter;
      const matchesQuery =
        !needle ||
        [payment.title, payment.instrument, payment.venue, payment.bookedMusicianName]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(needle));
      return matchesStatus && matchesQuery;
    });
  }, [payments, query, statusFilter]);

  const totals = useMemo(
    () =>
      payments.reduce(
        (result, payment) => {
          const net = Number(payment.deputyNetAmount || 0);
          if (payment.payoutStatus === "paid") result.paid += net;
          else if (["scheduled", "pending"].includes(payment.payoutStatus)) result.scheduled += net;
          if (payment.paymentStatus === "failed" || payment.payoutStatus === "failed") {
            result.attention += 1;
          }
          return result;
        },
        { paid: 0, scheduled: 0, attention: 0 },
      ),
    [payments],
  );

  return (
    <div className="min-h-full bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-[#ff6667]">Deputy finance</p>
            <h1 className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">Payment Tracker</h1>
            <p className="mt-2 max-w-2xl text-sm text-gray-600">
              Track client charges, deputy payout dates, fees and failed payments in one place.
            </p>
          </div>
          <button
            type="button"
            onClick={() => fetchPayments({ quiet: true })}
            disabled={refreshing}
            className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard label="Tracked payments" value={payments.length} helper="Deputy jobs in the payment flow" />
          <SummaryCard label="Scheduled" value={formatCurrency(totals.scheduled)} helper="Deputy payouts awaiting release" />
          <SummaryCard label="Paid out" value={formatCurrency(totals.paid)} helper="Completed deputy payouts" />
          <SummaryCard label="Needs attention" value={totals.attention} helper="Failed charges or payouts" />
        </div>

        <div className="mt-6 rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-gray-200 p-4 sm:flex-row">
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search job, deputy, venue or instrument"
              className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#ff6667] focus:ring-2 focus:ring-red-100"
            />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-[#ff6667]"
            >
              <option value="all">All statuses</option>
              <option value="ready_to_charge">Ready to charge</option>
              <option value="charge_pending">Charge pending</option>
              <option value="paid">Paid</option>
              <option value="scheduled">Payout scheduled</option>
              <option value="failed">Needs attention</option>
              <option value="refunded">Refunded</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {loading ? (
            <div className="p-10 text-center text-sm text-gray-500">Loading deputy payments…</div>
          ) : filteredPayments.length === 0 ? (
            <div className="p-10 text-center">
              <p className="font-semibold text-gray-800">No payments found</p>
              <p className="mt-1 text-sm text-gray-500">
                {payments.length ? "Try changing your search or status filter." : "Deputy payments will appear here once payment setup begins."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Job</th>
                    <th className="px-4 py-3 font-semibold">Deputy</th>
                    <th className="px-4 py-3 font-semibold">Event</th>
                    <th className="px-4 py-3 font-semibold">Client payment</th>
                    <th className="px-4 py-3 font-semibold">Deputy payout</th>
                    <th className="px-4 py-3 text-right font-semibold">Gross</th>
                    <th className="px-4 py-3 text-right font-semibold">Net payout</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredPayments.map((payment) => (
                    <tr key={payment._id} className="align-top hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <Link to={`/deputy-jobs/${payment._id}`} className="font-semibold text-gray-900 hover:text-[#d94f50] hover:underline">
                          {payment.title || payment.instrument || "Untitled deputy job"}
                        </Link>
                        <p className="mt-1 max-w-xs text-xs text-gray-500">{payment.venue || "Venue not set"}</p>
                      </td>
                      <td className="px-4 py-4 text-gray-700">{payment.bookedMusicianName || "Not allocated"}</td>
                      <td className="whitespace-nowrap px-4 py-4 text-gray-700">{formatDate(payment.eventDate)}</td>
                      <td className="px-4 py-4">
                        <StatusBadge value={payment.paymentStatus} labels={paymentStatusLabels} />
                        {payment.paymentFailureReason && <p className="mt-2 max-w-xs text-xs text-red-700">{payment.paymentFailureReason}</p>}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge value={payment.payoutStatus} labels={payoutStatusLabels} />
                        <p className="mt-2 whitespace-nowrap text-xs text-gray-500">
                          {payment.payoutPaidAt ? `Paid ${formatDate(payment.payoutPaidAt)}` : payment.releaseOn ? `Release ${formatDate(payment.releaseOn)}` : "No release date"}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-right font-medium text-gray-800">{formatCurrency(payment.grossAmount, payment.currency)}</td>
                      <td className="whitespace-nowrap px-4 py-4 text-right font-semibold text-gray-900">{formatCurrency(payment.deputyNetAmount, payment.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentTracker;
