import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { backendUrl } from "../App";

const entities = ["TSC", "BMM", "Personal", "Savings", "Investment", "Crypto"];

const formatCurrency = (value = 0) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(Number(value || 0));

const formatDate = (date) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const signedForecastAmount = (event) =>
  event.direction === "out" ? -Number(event.amount || 0) : Number(event.amount || 0);

const signedTransactionAmount = (transaction) =>
  transaction.direction === "out"
    ? -Number(transaction.amount || 0)
    : Number(transaction.amount || 0);

const FinanceReconciliation = () => {
  const [entity, setEntity] = useState("BMM");
  const [forecastEvents, setForecastEvents] = useState([]);
  const [transactions, setTransactions] = useState([]);

  const [selectedEventId, setSelectedEventId] = useState("");
  const [selectedTransactionId, setSelectedTransactionId] = useState("");

  const [loading, setLoading] = useState(false);
  const [matching, setMatching] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const selectedEvent = useMemo(
    () => forecastEvents.find((event) => event._id === selectedEventId),
    [forecastEvents, selectedEventId],
  );

  const selectedTransaction = useMemo(
    () =>
      transactions.find(
        (transaction) => transaction._id === selectedTransactionId,
      ),
    [transactions, selectedTransactionId],
  );

  const amountDifference = useMemo(() => {
    if (!selectedEvent || !selectedTransaction) return null;

    return (
      signedForecastAmount(selectedEvent) -
      signedTransactionAmount(selectedTransaction)
    );
  }, [selectedEvent, selectedTransaction]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccessMessage("");

      const [forecastRes, transactionRes] = await Promise.all([
        axios.get(`${backendUrl}/api/finance/forecast-events`, {
          params: {
            entity,
            status: "forecast",
          },
        }),
        axios.get(`${backendUrl}/api/finance/transactions`, {
          params: {
            entity,
            reconciled: false,
          },
        }),
      ]);

      setForecastEvents(forecastRes.data?.forecastEvents || []);
      setTransactions(transactionRes.data?.transactions || []);
      setSelectedEventId("");
      setSelectedTransactionId("");
    } catch (err) {
      console.error("Finance reconciliation load error:", err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [entity]);

  const handleManualMatch = async () => {
    try {
      setMatching(true);
      setError("");
      setSuccessMessage("");

      if (!selectedEventId || !selectedTransactionId) {
        setError("Select one forecast event and one transaction.");
        return;
      }

      const res = await axios.post(
        `${backendUrl}/api/finance/reconcile/manual-match`,
        {
          forecastEventId: selectedEventId,
          transactionId: selectedTransactionId,
        },
      );

      if (res.data?.success) {
        setSuccessMessage("Matched successfully.");
        await fetchData();
      } else {
        setError(res.data?.message || "Could not match items.");
      }
    } catch (err) {
      console.error("Manual match error:", err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setMatching(false);
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

        {successMessage && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            {successMessage}
          </div>
        )}

        <div className="mb-6 rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Selected Match
              </h2>
              <p className="text-sm text-gray-500">
                Pick one forecast item and one bank transaction, then match.
              </p>
            </div>

            <button
              onClick={handleManualMatch}
              disabled={matching || !selectedEventId || !selectedTransactionId}
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {matching ? "Matching..." : "Match Selected"}
            </button>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <SummaryBox
              title="Forecast"
              value={
                selectedEvent
                  ? `${formatCurrency(signedForecastAmount(selectedEvent))} · ${
                      selectedEvent.title
                    }`
                  : "None selected"
              }
            />

            <SummaryBox
              title="Transaction"
              value={
                selectedTransaction
                  ? `${formatCurrency(
                      signedTransactionAmount(selectedTransaction),
                    )} · ${selectedTransaction.description}`
                  : "None selected"
              }
            />

            <SummaryBox
              title="Difference"
              value={
                amountDifference === null
                  ? "-"
                  : formatCurrency(amountDifference)
              }
              warning={amountDifference !== null && Math.abs(amountDifference) > 0.01}
            />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              Forecast Events
            </h2>
            <p className="mb-4 text-sm text-gray-500">
              Unpaid expected payments and payouts.
            </p>

            <div className="max-h-[650px] overflow-auto">
              {forecastEvents.map((event) => (
                <button
                  key={event._id}
                  onClick={() => setSelectedEventId(event._id)}
                  className={`mb-3 w-full rounded-xl border p-4 text-left ${
                    selectedEventId === event._id
                      ? "border-black bg-gray-50"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <div className="flex justify-between gap-4">
                    <div>
                      <p className="font-medium text-gray-900">{event.title}</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(event.expectedDate)} · {event.type}
                      </p>
                    </div>

                    <p
                      className={`whitespace-nowrap font-semibold ${
                        event.direction === "in"
                          ? "text-green-700"
                          : "text-red-700"
                      }`}
                    >
                      {formatCurrency(signedForecastAmount(event))}
                    </p>
                  </div>
                </button>
              ))}

              {!forecastEvents.length && (
                <div className="py-8 text-center text-sm text-gray-500">
                  No forecast events to reconcile.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              Bank Transactions
            </h2>
            <p className="mb-4 text-sm text-gray-500">
              Imported transactions not yet reconciled.
            </p>

            <div className="max-h-[650px] overflow-auto">
              {transactions.map((transaction) => (
                <button
                  key={transaction._id}
                  onClick={() => setSelectedTransactionId(transaction._id)}
                  className={`mb-3 w-full rounded-xl border p-4 text-left ${
                    selectedTransactionId === transaction._id
                      ? "border-black bg-gray-50"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <div className="flex justify-between gap-4">
                    <div>
                      <p className="font-medium text-gray-900">
                        {transaction.description}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(transaction.date)} ·{" "}
                        {transaction.category || "uncategorised"}
                      </p>
                    </div>

                    <p
                      className={`whitespace-nowrap font-semibold ${
                        transaction.direction === "in"
                          ? "text-green-700"
                          : "text-red-700"
                      }`}
                    >
                      {formatCurrency(signedTransactionAmount(transaction))}
                    </p>
                  </div>
                </button>
              ))}

              {!transactions.length && (
                <div className="py-8 text-center text-sm text-gray-500">
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

const SummaryBox = ({ title, value, warning }) => (
  <div
    className={`rounded-xl border p-4 ${
      warning ? "border-amber-200 bg-amber-50" : "border-gray-200 bg-white"
    }`}
  >
    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
      {title}
    </p>
    <p className="mt-2 text-sm font-semibold text-gray-900">{value}</p>
  </div>
);

export default FinanceReconciliation;