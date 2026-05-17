import React, { useEffect, useMemo, useState } from "react";
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

const FinanceVatForecast = () => {
  const [entity, setEntity] = useState("BMM");
  const [includeForecast, setIncludeForecast] = useState(true);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchVatForecast = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await axios.get(`${backendUrl}/api/finance/tax/vat-forecast`, {
        params: {
          entity,
          includeForecast,
        },
      });

      if (res.data?.success) {
        setData(res.data);
      } else {
        setError(res.data?.message || "Could not load VAT forecast.");
      }
    } catch (err) {
      console.error("VAT forecast error:", err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVatForecast();
  }, [entity, includeForecast]);

  const summary = data?.summary || {};

  const totalGrossSales = useMemo(() => {
    return (data?.quarters || []).reduce(
      (sum, quarter) => sum + Number(quarter.salesGross || 0),
      0,
    );
  }, [data]);

  const totalVatableSales = useMemo(() => {
    return (data?.quarters || []).reduce(
      (sum, quarter) => sum + Number(quarter.vatableSales || 0),
      0,
    );
  }, [data]);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              VAT Forecast
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Forecast VAT due by quarter using transactions and expected
              forecast events.
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
              onClick={fetchVatForecast}
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

        {entity === "BMM" && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            VAT forecast is based on BMM disclosed-agent commission/management
            fee only, not the full client booking value.
          </div>
        )}

        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <SummaryCard title="Gross Sales" value={formatCurrency(totalGrossSales)} />
          <SummaryCard
            title="VATable Sales"
            value={formatCurrency(totalVatableSales)}
          />
          <SummaryCard
            title="VAT on Sales"
            value={formatCurrency(summary.totalVatOnSales)}
          />
          <SummaryCard
            title="VAT Reclaimable"
            value={formatCurrency(summary.totalVatReclaimable)}
          />
          <SummaryCard
            title="Net VAT Due"
            value={formatCurrency(summary.totalNetVatDue)}
            warning={Number(summary.totalNetVatDue || 0) > 0}
          />
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Quarterly VAT Forecast
            </h2>
            <p className="text-sm text-gray-500">
              Amounts are grouped by VAT quarter and expected payment date.
            </p>
          </div>

          {loading ? (
            <div className="py-8 text-center text-sm text-gray-500">
              Loading VAT forecast...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b text-xs uppercase tracking-wide text-gray-500">
                    <th className="px-3 py-3">Quarter</th>
                    <th className="px-3 py-3 text-right">Gross Sales</th>
                    <th className="px-3 py-3 text-right">VATable Sales</th>
                    <th className="px-3 py-3 text-right">VAT on Sales</th>
                    <th className="px-3 py-3 text-right">VAT Reclaimable</th>
                    <th className="px-3 py-3 text-right">Net VAT Due</th>
                    <th className="px-3 py-3">Payment Due</th>
                    <th className="px-3 py-3 text-right">Items</th>
                  </tr>
                </thead>

                <tbody>
                  {(data?.quarters || []).map((quarter) => (
                    <tr key={quarter.quarter} className="border-b last:border-0">
                      <td className="whitespace-nowrap px-3 py-3 font-medium text-gray-900">
                        {quarter.quarter}
                      </td>

                      <td className="px-3 py-3 text-right">
                        {formatCurrency(quarter.salesGross)}
                      </td>

                      <td className="px-3 py-3 text-right font-medium">
                        {formatCurrency(quarter.vatableSales)}
                      </td>

                      <td className="px-3 py-3 text-right text-red-700">
                        {formatCurrency(quarter.vatOnSales)}
                      </td>

                      <td className="px-3 py-3 text-right text-green-700">
                        {formatCurrency(quarter.vatReclaimable)}
                      </td>

                      <td className="px-3 py-3 text-right font-semibold text-gray-900">
                        {formatCurrency(quarter.netVatDue)}
                      </td>

                      <td className="whitespace-nowrap px-3 py-3 text-gray-500">
                        {formatDate(quarter.paymentDueDate)}
                      </td>

                      <td className="px-3 py-3 text-right text-gray-500">
                        {Number(quarter.transactionCount || 0) +
                          Number(quarter.forecastEventCount || 0)}
                      </td>
                    </tr>
                  ))}

                  {!data?.quarters?.length && (
                    <tr>
                      <td
                        colSpan="8"
                        className="px-3 py-8 text-center text-gray-500"
                      >
                        No VAT forecast data found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-6 rounded-2xl bg-white p-5 text-sm text-gray-600 shadow-sm">
          <p className="font-semibold text-gray-900">Notes</p>
          <p className="mt-2">
            This forecast depends on each transaction or forecast event having
            correct VAT fields, especially <code>vatTreatment</code>,{" "}
            <code>vatBasis</code>, <code>vatRate</code> and{" "}
            <code>vatableAmount</code>.
          </p>
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

export default FinanceVatForecast;