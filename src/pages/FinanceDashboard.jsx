import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { backendUrl } from "../App";

const entities = ["TSC", "BMM", "Personal", "Savings", "Investment", "Crypto"];

const formatCurrency = (value = 0) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const FinanceDashboard = () => {
  const [entity, setEntity] = useState("TSC");
  const [startingBalanceInput, setStartingBalanceInput] = useState(0);
  const [fromDate, setFromDate] = useState(toISODate(new Date()));
  const [toDate, setToDate] = useState(toISODate(addMonths(new Date(), 12)));
  const [data, setData] = useState(null);
  const [monthlyData, setMonthlyData] = useState(null);
  const [unreconciledCount, setUnreconciledCount] = useState(0);
  const [unpaidForecastCount, setUnpaidForecastCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [autoMatching, setAutoMatching] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const fetchForecast = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccessMessage("");

      const [timelineRes, monthlyRes, transactionsRes, forecastEventsRes] =
        await Promise.all([
          axios.get(`${backendUrl}/api/finance/forecast/timeline`, {
            params: {
              entity,
              startingBalance: Number(startingBalanceInput || 0),
              from: fromDate,
              to: toDate,
            },
          }),
          axios.get(`${backendUrl}/api/finance/forecast/monthly-summary`, {
            params: {
              entity,
              startingBalance: Number(startingBalanceInput || 0),
              from: fromDate,
              to: toDate,
            },
          }),
          axios.get(`${backendUrl}/api/finance/transactions`, {
            params: { entity, reconciled: false },
          }),
          axios.get(`${backendUrl}/api/finance/forecast-events`, {
            params: { entity, status: "forecast" },
          }),
        ]);

      if (timelineRes.data?.success) setData(timelineRes.data);
      if (monthlyRes.data?.success) setMonthlyData(monthlyRes.data);

      setUnreconciledCount(
        transactionsRes.data?.transactions?.length ||
          transactionsRes.data?.count ||
          0,
      );

      setUnpaidForecastCount(
        forecastEventsRes.data?.forecastEvents?.length ||
          forecastEventsRes.data?.count ||
          0,
      );
    } catch (err) {
      console.error("Finance forecast error:", err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecast();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entity]);

  const handleAutoMatch = async () => {
    try {
      setAutoMatching(true);
      setError("");
      setSuccessMessage("");

      const res = await axios.post(
        `${backendUrl}/api/finance/reconcile/auto-match`,
        {
          entity,
          dateWindowDays: 14,
          dryRun: false,
        },
      );

      if (res.data?.success) {
        setSuccessMessage(
          `Auto-matched ${res.data.matchedCount || 0} transaction(s).`,
        );
        await fetchForecast();
      } else {
        setError(res.data?.message || "Auto-match failed.");
      }
    } catch (err) {
      console.error("Auto-match error:", err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setAutoMatching(false);
    }
  };

  const chartData = useMemo(() => {
    return (data?.timeline || []).map((event) => ({
      date: formatDate(event.expectedDate),
      balance: Number(event.runningBalance || 0),
      title: event.title,
      amount: event.signedAmount,
    }));
  }, [data]);

  const toISODate = (date) => date.toISOString().slice(0, 10);

  const addMonths = (date, months) => {
    const d = new Date(date);
    d.setMonth(d.getMonth() + months);
    return d;
  };

  const summary = data?.summary || {};
  const startingBalance = Number(
    data?.filters?.startingBalance ?? startingBalanceInput ?? 0,
  );
  const cashBufferNeeded =
    Number(summary.lowestBalance || 0) < 0
      ? Math.abs(Number(summary.lowestBalance || 0))
      : 0;

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Finance Dashboard
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Forecasted cash position based on bookings, bank transactions and
              expected payments.
            </p>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Entity
              </label>
              <select
                value={entity}
                onChange={(e) => setEntity(e.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                {entities.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Starting balance
              </label>
              <input
                type="number"
                step="0.01"
                value={startingBalanceInput}
                onChange={(e) => setStartingBalanceInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") fetchForecast();
                }}
                className="w-32 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
              />
              <p className="mt-1 text-[11px] text-gray-500">
                Press Refresh after editing.
              </p>
            </div>

            <div>
  <label className="mb-1 block text-xs font-medium text-gray-600">
    Forecast from
  </label>
  <input
    type="date"
    value={fromDate}
    onChange={(e) => setFromDate(e.target.value)}
    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
  />
</div>

<div>
  <label className="mb-1 block text-xs font-medium text-gray-600">
    Forecast to
  </label>
  <input
    type="date"
    value={toDate}
    onChange={(e) => setToDate(e.target.value)}
    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
  />
</div>

            <Link
              to="/finance/transactions/import"
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800"
            >
              Import CSV
            </Link>

            <Link
              to="/finance/reconciliation"
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800"
            >
              Reconcile
            </Link>

            <button
              onClick={handleAutoMatch}
              disabled={autoMatching || loading}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 disabled:opacity-50"
            >
              {autoMatching ? "Auto-matching..." : "Auto-match"}
            </button>

            <button
              onClick={fetchForecast}
              disabled={loading}
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            {successMessage}
          </div>
        )}

        {summary.firstNegativeDate && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Warning: forecast balance first goes negative on{" "}
            <strong>{formatDate(summary.firstNegativeDate)}</strong>.
          </div>
        )}

        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            title="Total In"
            value={formatCurrency(summary.totalIn)}
          />
          <SummaryCard
            title="Total Out"
            value={formatCurrency(summary.totalOut)}
          />
          <SummaryCard
            title="Final Balance"
            value={formatCurrency(summary.finalBalance)}
          />
          <SummaryCard
            title="Cash Buffer Needed"
            value={formatCurrency(cashBufferNeeded)}
            warning={cashBufferNeeded > 0}
          />
          <SummaryCard
            title="Unreconciled Transactions"
            value={unreconciledCount}
          />
          <SummaryCard
            title="Unpaid Forecast Events"
            value={unpaidForecastCount}
          />
          <SummaryCard
            title="Lowest Balance"
            value={formatCurrency(summary.lowestBalance)}
            warning={Number(summary.lowestBalance || 0) < 0}
          />
          <SummaryCard
            title="Net Movement"
            value={formatCurrency(summary.netMovement)}
          />
        </div>

        <div className="mb-6 rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Forecast Balance
            </h2>
            <p className="text-sm text-gray-500">
              Running balance over expected payment dates.
            </p>
          </div>

          <div className="h-80">
            {chartData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => formatCurrency(value)}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Line type="monotone" dataKey="balance" strokeWidth={2} dot />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-gray-500">
                No forecast events yet.
              </div>
            )}
          </div>
        </div>

        <div className="mb-6 rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            Monthly Summary
          </h2>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-3 py-3">Month</th>
                  <th className="px-3 py-3 text-right">In</th>
                  <th className="px-3 py-3 text-right">Out</th>
                  <th className="px-3 py-3 text-right">Net</th>
                  <th className="px-3 py-3 text-right">Lowest</th>
                  <th className="px-3 py-3 text-right">Closing</th>
                </tr>
              </thead>

              <tbody>
                {(monthlyData?.months || []).map((month) => (
                  <tr key={month.month} className="border-b last:border-0">
                    <td className="px-3 py-3 font-medium">{month.month}</td>
                    <td className="px-3 py-3 text-right text-green-700">
                      {formatCurrency(month.totalIn)}
                    </td>
                    <td className="px-3 py-3 text-right text-red-700">
                      {formatCurrency(month.totalOut)}
                    </td>
                    <td className="px-3 py-3 text-right">
                      {formatCurrency(month.netMovement)}
                    </td>
                    <td className="px-3 py-3 text-right">
                      {formatCurrency(month.lowestBalance)}
                    </td>
                    <td className="px-3 py-3 text-right font-semibold">
                      {formatCurrency(month.closingBalance)}
                    </td>
                  </tr>
                ))}

                {!monthlyData?.months?.length && (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-3 py-8 text-center text-gray-500"
                    >
                      No monthly summary found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Forecast Timeline
            </h2>
            <p className="text-sm text-gray-500">
              Expected income and outgoing payments in date order.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b text-xs uppercase tracking-wide text-gray-500">
                  <th className="px-3 py-3">Date</th>
                  <th className="px-3 py-3">Title</th>
                  <th className="px-3 py-3">Type</th>
                  <th className="px-3 py-3">Direction</th>
                  <th className="px-3 py-3 text-right">Amount</th>
                  <th className="px-3 py-3 text-right">Running Balance</th>
                </tr>
              </thead>

              <tbody>
                {(data?.timeline || []).map((event) => (
                  <tr key={event._id} className="border-b last:border-0">
                    <td className="whitespace-nowrap px-3 py-3">
                      {formatDate(event.expectedDate)}
                    </td>
                    <td className="px-3 py-3">{event.title}</td>
                    <td className="px-3 py-3 text-gray-500">{event.type}</td>
                    <td className="px-3 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs ${
                          event.direction === "in"
                            ? "bg-green-50 text-green-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {event.direction}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      {formatCurrency(event.signedAmount)}
                    </td>
                    <td className="px-3 py-3 text-right font-medium">
                      {formatCurrency(event.runningBalance)}
                    </td>
                  </tr>
                ))}

                {!data?.timeline?.length && (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-3 py-8 text-center text-gray-500"
                    >
                      No forecast events found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const SummaryCard = ({ title, value, warning }) => (
  <div
    className={`rounded-2xl p-4 shadow-sm ${
      warning ? "border border-amber-200 bg-amber-50" : "bg-white"
    }`}
  >
    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
      {title}
    </p>
    <p className="mt-2 text-xl font-semibold text-gray-900">{value}</p>
  </div>
);

export default FinanceDashboard;
