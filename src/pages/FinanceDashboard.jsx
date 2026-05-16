import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
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
  const [startingBalance, setStartingBalance] = useState(1000);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
const [monthlyData, setMonthlyData] = useState(null);
  const fetchForecast = async () => {
    try {
      setLoading(true);
      setError("");

      const [timelineRes, monthlyRes] = await Promise.all([
  axios.get(`${backendUrl}/api/finance/forecast/timeline`, {
    params: { entity, startingBalance },
  }),
  axios.get(`${backendUrl}/api/finance/forecast/monthly-summary`, {
    params: { entity, startingBalance },
  }),
]);

if (timelineRes.data?.success) setData(timelineRes.data);
if (monthlyRes.data?.success) setMonthlyData(monthlyRes.data);

      const res = await axios.get(
        `${backendUrl}/api/finance/forecast/timeline`,
        {
          params: {
            startingBalance,
          },
        },
      );

      if (res.data?.success) {
        setData(res.data);
      } else {
        setError(res.data?.message || "Could not load forecast");
      }
    } catch (err) {
      console.error("Finance forecast error:", err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecast();
  }, [entity]);

  const chartData = useMemo(() => {
    return (data?.timeline || []).map((event) => ({
      date: formatDate(event.expectedDate),
      balance: Number(event.runningBalance || 0),
      title: event.title,
      amount: event.signedAmount,
    }));
  }, [data]);

  const summary = data?.summary || {};

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Finance Dashboard
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Forecasted cash position based on confirmed bookings and expected
              payments.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Entity
              </label>
              <select
                value={entity}
                onChange={(e) => setEntity(e.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                <option value="TSC">TSC</option>
                <option value="BMM">BMM</option>
                <option value="Personal">Personal</option>
                <option value="Savings">Savings</option>
                <option value="Investment">Investment</option>
                <option value="Crypto">Crypto</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Starting balance
              </label>
              <input
                type="number"
                value={data?.filters?.startingBalance ?? 0}
                readOnly
                className="rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm"
              />
            </div>

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

        {summary.firstNegativeDate && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Warning: forecast balance first goes negative on{" "}
            <strong>{formatDate(summary.firstNegativeDate)}</strong>.
          </div>
        )}

        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <SummaryCard
            title="Total In"
            value={formatCurrency(summary.totalIn)}
          />
          <SummaryCard
            title="Total Out"
            value={formatCurrency(summary.totalOut)}
          />
          <SummaryCard
            title="Net Movement"
            value={formatCurrency(summary.netMovement)}
          />
          <SummaryCard
            title="Final Balance"
            value={formatCurrency(summary.finalBalance)}
          />
          <SummaryCard
            title="Lowest Balance"
            value={formatCurrency(summary.lowestBalance)}
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
  <h2 className="text-lg font-semibold text-gray-900">Monthly Summary</h2>

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
                  <th className="px-3 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {(data?.timeline || []).map((event) => (
                  <tr key={event._id} className="border-b last:border-0">
                    <td className="px-3 py-3 whitespace-nowrap">
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
                      colSpan="7"
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

const SummaryCard = ({ title, value }) => (
  <div className="rounded-2xl bg-white p-4 shadow-sm">
    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
      {title}
    </p>
    <p className="mt-2 text-xl font-semibold text-gray-900">{value}</p>
  </div>
);

export default FinanceDashboard;
