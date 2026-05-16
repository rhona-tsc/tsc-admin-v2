import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { backendUrl } from "../App";

const entities = ["TSC", "BMM", "Personal", "Savings", "Investment", "Crypto"];

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

const FinanceReconciliation = () => {
  const [entity, setEntity] = useState("TSC");
  const [forecastEvents, setForecastEvents] = useState([]);
  const [transactions, setTransactions] = useState([]);

  const [selectedEventId, setSelectedEventId] = useState("");
  const [selectedTransactionId, setSelectedTransactionId] = useState("");

  const [loading, setLoading] = useState(false);
  const [reconciling, setReconciling] = useState(false);
  const [error, setError] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [eventsRes, txRes] = await Promise.all([
        axios.get(`${backendUrl}/api/finance/forecast-events`, {
          params: { entity, status: "forecast" },
        }),
        axios.get(`${backendUrl}/api/finance/transactions`, {
          params: { entity, reconciled: false },
        }),
      ]);

      if (eventsRes.data?.success) {
        setForecastEvents(eventsRes.data.forecastEvents || []);
      }

      if (txRes.data?.success) {
        setTransactions(txRes.data.transactions || []);
      }

      setSelectedEventId("");
      setSelectedTransactionId("");
    } catch (err) {
      console.error("fetch reconciliation data error:", err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [entity]);

  const selectedEvent = useMemo(
    () => forecastEvents.find((event) => event._id === selectedEventId),
    [forecastEvents, selectedEventId],
  );

  const selectedTransaction = useMemo(
    () => transactions.find((tx) => tx._id === selectedTransactionId),
    [transactions, selectedTransactionId],
  );

  const canReconcile = selectedEventId && selectedTransactionId;

  const amountDifference = useMemo(() => {
    if (!selectedEvent || !selectedTransaction) return null;
    return (
      Math.abs(Number(selectedEvent.amount || 0)) -
      Math.abs(Number(selectedTransaction.amount || 0))
    );
  }, [selectedEvent, selectedTransaction]);

  const handleReconcile = async () => {
    if (!canReconcile) return;

    try {
      setReconciling(true);
      setError("");

      await axios.post(
        `${backendUrl}/api/finance/forecast-events/${selectedEventId}/reconcile`,
        {
          transactionId: selectedTransactionId,
        },
      );

      await fetchData();
    } catch (err) {
      console.error("reconcile error:", err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setReconciling(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Finance Reconciliation
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Match forecast events to actual bank transactions.
            </p>
          </div>

          <div className="flex gap-3">
            <Select
              label="Entity"
              value={entity}
              onChange={(e) => setEntity(e.target.value)}
              options={entities.map((v) => ({ value: v, label: v }))}
            />

            <button
              onClick={fetchData}
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

        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <SummaryCard
            title="Unmatched Forecast Events"
            value={forecastEvents.length}
          />
          <SummaryCard
            title="Unreconciled Transactions"
            value={transactions.length}
          />
          <SummaryCard
            title="Selected Difference"
            value={
              amountDifference === null
                ? "-"
                : formatCurrency(amountDifference)
            }
          />
        </div>

        <div className="mb-6 rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold text-gray-900">
            Selected Match
          </h2>

          <div className="grid gap-4 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
            <MatchBox
              title="Forecast event"
              item={selectedEvent}
              emptyText="Select a forecast event below"
              type="forecast"
            />

            <MatchBox
              title="Actual transaction"
              item={selectedTransaction}
              emptyText="Select a transaction below"
              type="transaction"
            />

            <button
              onClick={handleReconcile}
              disabled={!canReconcile || reconciling}
              className="rounded-lg bg-black px-4 py-3 text-sm font-medium text-white disabled:opacity-50"
            >
              {reconciling ? "Reconciling..." : "Reconcile"}
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              Forecast Events
            </h2>
            <p className="mb-4 text-sm text-gray-500">
              Expected payments still marked as forecast.
            </p>

            <div className="space-y-3">
              {forecastEvents.map((event) => (
                <button
                  key={event._id}
                  type="button"
                  onClick={() => setSelectedEventId(event._id)}
                  className={`w-full rounded-xl border p-4 text-left transition ${
                    selectedEventId === event._id
                      ? "border-black bg-gray-50"
                      : "border-gray-200 bg-white hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-gray-900">{event.title}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {formatDate(event.expectedDate)} · {event.type}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {event.clientNames || event.actName || event.entity}
                      </p>
                    </div>

                    <p
                      className={`whitespace-nowrap font-semibold ${
                        event.direction === "in"
                          ? "text-green-700"
                          : "text-red-700"
                      }`}
                    >
                      {event.direction === "out" ? "-" : "+"}
                      {formatCurrency(event.amount)}
                    </p>
                  </div>
                </button>
              ))}

              {!forecastEvents.length && (
                <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
                  No forecast events to reconcile.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              Actual Transactions
            </h2>
            <p className="mb-4 text-sm text-gray-500">
              Real transactions not yet reconciled.
            </p>

            <div className="space-y-3">
              {transactions.map((tx) => (
                <button
                  key={tx._id}
                  type="button"
                  onClick={() => setSelectedTransactionId(tx._id)}
                  className={`w-full rounded-xl border p-4 text-left transition ${
                    selectedTransactionId === tx._id
                      ? "border-black bg-gray-50"
                      : "border-gray-200 bg-white hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-gray-900">
                        {tx.description}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {formatDate(tx.date)} · {tx.category}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {tx.accountId?.name || tx.merchant || tx.entity}
                      </p>
                    </div>

                    <p
                      className={`whitespace-nowrap font-semibold ${
                        tx.direction === "in"
                          ? "text-green-700"
                          : "text-red-700"
                      }`}
                    >
                      {tx.direction === "out" ? "-" : "+"}
                      {formatCurrency(tx.amount)}
                    </p>
                  </div>
                </button>
              ))}

              {!transactions.length && (
                <div className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
                  No unreconciled transactions.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const MatchBox = ({ title, item, emptyText, type }) => {
  const isTransaction = type === "transaction";

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
        {title}
      </p>

      {item ? (
        <>
          <p className="font-medium text-gray-900">
            {isTransaction ? item.description : item.title}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {formatDate(isTransaction ? item.date : item.expectedDate)}
          </p>
          <p
            className={`mt-2 font-semibold ${
              item.direction === "in" ? "text-green-700" : "text-red-700"
            }`}
          >
            {item.direction === "out" ? "-" : "+"}
            {formatCurrency(item.amount)}
          </p>
        </>
      ) : (
        <p className="text-sm text-gray-500">{emptyText}</p>
      )}
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

const Select = ({ label, value, onChange, options }) => (
  <div>
    {label && (
      <label className="mb-1 block text-xs font-medium text-gray-600">
        {label}
      </label>
    )}
    <select
      value={value}
      onChange={onChange}
      className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </div>
);

export default FinanceReconciliation;