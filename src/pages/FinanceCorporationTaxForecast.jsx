import React, { useEffect, useState } from "react";
import axios from "axios";
import { backendUrl } from "../App";

const entities = ["TSC", "BMM"];

const formatCurrency = (value = 0) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const FinanceCorporationTaxForecast = () => {
  const [entity, setEntity] = useState("BMM");
  const [taxRate, setTaxRate] = useState(0.25);
  const [includeForecast, setIncludeForecast] = useState(true);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchForecast = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await axios.get(
        `${backendUrl}/api/finance/tax/corporation-tax-forecast`,
        {
          params: {
            entity,
            taxRate,
            includeForecast,
          },
        },
      );

      if (res.data?.success) {
        setData(res.data);
      } else {
        setError(res.data?.message || "Could not load corporation tax forecast.");
      }
    } catch (err) {
      console.error("Corporation tax forecast error:", err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecast();
  }, [entity, taxRate, includeForecast]);

  const summary = data?.summary || {};

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Corporation Tax Forecast
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Estimate corporation tax from forecast income and expenses.
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
                Tax rate
              </label>
              <input
                type="number"
                step="0.01"
                value={taxRate}
                onChange={(e) => setTaxRate(Number(e.target.value || 0))}
                className="w-28 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
              />
            </div>

            <label className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm">
              <input
                type="checkbox"
                checked={includeForecast}
                onChange={(e) => setIncludeForecast(e.target.checked)}
              />
              Include forecast
            </label>

            <button
              type="button"
              onClick={fetchForecast}
              disabled={loading}
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>
        </div>

        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Estimate only. BMM year end assumed 30 Nov, with corporation tax due
          on 1 Sep following the year end.
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            title="Income"
            value={formatCurrency(summary.totalIncome)}
          />
          <SummaryCard
            title="Expenses"
            value={formatCurrency(summary.totalExpenses)}
          />
          <SummaryCard
            title="Estimated Profit"
            value={formatCurrency(summary.totalEstimatedProfit)}
            warning={Number(summary.totalEstimatedProfit || 0) < 0}
          />
          <SummaryCard
            title="Estimated CT"
            value={formatCurrency(summary.totalEstimatedCorporationTax)}
            warning={Number(summary.totalEstimatedCorporationTax || 0) > 0}
          />
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Corporation Tax by Year
            </h2>
            <p className="text-sm text-gray-500">
              Based on income less expenses, using the selected tax rate.
            </p>
          </div>

          {loading ? (
            <div className="py-8 text-center text-sm text-gray-500">
              Loading corporation tax forecast...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b text-xs uppercase tracking-wide text-gray-500">
                    <th className="px-3 py-3">Year</th>
                    <th className="px-3 py-3 text-right">Income</th>
                    <th className="px-3 py-3 text-right">Expenses</th>
                    <th className="px-3 py-3 text-right">Profit</th>
                    <th className="px-3 py-3 text-right">CT</th>
                    <th className="px-3 py-3">Due Date</th>
                    <th className="px-3 py-3 text-right">Items</th>
                  </tr>
                </thead>

                <tbody>
                  {(data?.years || []).map((year) => (
                    <tr key={year.taxYear} className="border-b last:border-0">
                      <td className="whitespace-nowrap px-3 py-3 font-medium text-gray-900">
                        {year.taxYear}
                      </td>

                      <td className="px-3 py-3 text-right text-green-700">
                        {formatCurrency(year.income)}
                      </td>

                      <td className="px-3 py-3 text-right text-red-700">
                        {formatCurrency(year.expenses)}
                      </td>

                      <td
                        className={`px-3 py-3 text-right font-medium ${
                          Number(year.estimatedProfit || 0) < 0
                            ? "text-red-700"
                            : "text-gray-900"
                        }`}
                      >
                        {formatCurrency(year.estimatedProfit)}
                      </td>

                      <td className="px-3 py-3 text-right font-semibold text-gray-900">
                        {formatCurrency(year.estimatedCorporationTax)}
                      </td>

                      <td className="whitespace-nowrap px-3 py-3 text-gray-500">
                        {formatDate(year.paymentDueDate)}
                      </td>

                      <td className="px-3 py-3 text-right text-gray-500">
                        {Number(year.transactionCount || 0) +
                          Number(year.forecastEventCount || 0)}
                      </td>
                    </tr>
                  ))}

                  {!data?.years?.length && (
                    <tr>
                      <td
                        colSpan="7"
                        className="px-3 py-8 text-center text-gray-500"
                      >
                        No corporation tax forecast data found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
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

export default FinanceCorporationTaxForecast;