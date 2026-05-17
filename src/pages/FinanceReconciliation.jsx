import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { backendUrl } from "../App";

const entities = [
  "TSC",
  "BMM",
  "HSBC",
  "Monzo Joint",
  "Monzo Personal",
  "AMEX",
  "CBS",
  "HL Investment",
  "HSBC Investment",
  "Bitcoin",
  "Solana",
  "Ethereum",
  "True Potential Penson",
  "Aviva Pension",
];

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
  event.direction === "out"
    ? -Number(event.amount || 0)
    : Number(event.amount || 0);

const signedTransactionAmount = (transaction) =>
  transaction.direction === "out"
    ? -Number(transaction.amount || 0)
    : Number(transaction.amount || 0);

const matchesSearch = (item, search, signedAmount) => {
  const q = String(search || "")
    .toLowerCase()
    .trim();
  if (!q) return true;

  const amountText = String(Math.abs(Number(signedAmount || 0)));
  const amountFixed = Math.abs(Number(signedAmount || 0)).toFixed(2);
  const moneyText = formatCurrency(signedAmount).toLowerCase();

  return [
    item.title,
    item.description,
    item.clientNames,
    item.actName,
    item.type,
    item.category,
    item.merchant,
    item.source,
    item.reference,
    amountText,
    amountFixed,
    moneyText,
  ]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(q));
};

const FinanceReconciliation = () => {
  const [entity, setEntity] = useState("BMM");
  const [forecastEvents, setForecastEvents] = useState([]);
  const [transactions, setTransactions] = useState([]);

  const [selectedEventId, setSelectedEventId] = useState("");
  const [selectedTransactionId, setSelectedTransactionId] = useState("");

  const [autoMatching, setAutoMatching] = useState(false);

  const [forecastSearch, setForecastSearch] = useState("");
  const [transactionSearch, setTransactionSearch] = useState("");

  const [loading, setLoading] = useState(false);
  const [matching, setMatching] = useState(false);
  const [deletingEventId, setDeletingEventId] = useState("");
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

  const filteredForecastEvents = useMemo(() => {
    return forecastEvents.filter((event) =>
      matchesSearch(event, forecastSearch, signedForecastAmount(event)),
    );
  }, [forecastEvents, forecastSearch]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) =>
      matchesSearch(
        transaction,
        transactionSearch,
        signedTransactionAmount(transaction),
      ),
    );
  }, [transactions, transactionSearch]);

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

  const handleDeleteForecastEvent = async (id) => {
    if (!window.confirm("Delete this forecast event?")) return;

    try {
      setDeletingEventId(id);
      setError("");
      setSuccessMessage("");

      await axios.delete(`${backendUrl}/api/finance/forecast-events/${id}`);

      if (selectedEventId === id) setSelectedEventId("");

      setSuccessMessage("Forecast event deleted.");
      await fetchData();
    } catch (err) {
      console.error("Delete forecast event error:", err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setDeletingEventId("");
    }
  };

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
        await fetchData();
      } else {
        setError(res.data?.message || "Auto-match failed.");
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setAutoMatching(false);
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

            <Link
              to="/finance/forecast-events"
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800"
            >
              Add Forecast Event
            </Link>

            <button
              onClick={fetchData}
              disabled={loading}
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {loading ? "Loading..." : "Refresh"}
            </button>

            <button
              onClick={handleAutoMatch}
              disabled={autoMatching || loading}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 disabled:opacity-50"
            >
              {autoMatching ? "Auto-matching..." : "Auto-match"}
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
              warning={
                amountDifference !== null && Math.abs(amountDifference) > 0.01
              }
            />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Forecast Events
                </h2>
                <p className="text-sm text-gray-500">
                  {filteredForecastEvents.length} of {forecastEvents.length}{" "}
                  unpaid expected payments and payouts.
                </p>
              </div>
            </div>

            <input
              value={forecastSearch}
              onChange={(e) => setForecastSearch(e.target.value)}
              placeholder="Search forecast by title, client, amount..."
              className="mb-4 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
            />

            <div className="max-h-[650px] overflow-auto">
              {filteredForecastEvents.map((event) => (
                <div
                  key={event._id}
                  role="button"
                  tabIndex={0}
                  onClick={() =>
                    setSelectedEventId((prev) =>
                      prev === event._id ? "" : event._id,
                    )
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") setSelectedEventId(event._id);
                  }}
                  className={`mb-3 w-full cursor-pointer rounded-xl border p-4 text-left ${
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
                      <p className="mt-1 text-xs text-gray-400">
                        {event.source || entity}
                      </p>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteForecastEvent(event._id);
                        }}
                        disabled={deletingEventId === event._id}
                        className="mt-2 text-xs font-medium text-red-600 underline disabled:opacity-50"
                      >
                        {deletingEventId === event._id
                          ? "Deleting..."
                          : "Delete"}
                      </button>
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
                </div>
              ))}

              {!filteredForecastEvents.length && (
                <div className="py-8 text-center text-sm text-gray-500">
                  No forecast events found.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              Bank Transactions
            </h2>
            <p className="mb-4 text-sm text-gray-500">
              {filteredTransactions.length} of {transactions.length} imported
              transactions not yet reconciled.
            </p>

            <input
              value={transactionSearch}
              onChange={(e) => setTransactionSearch(e.target.value)}
              placeholder="Search transactions by description, merchant, amount..."
              className="mb-4 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
            />

            <div className="max-h-[650px] overflow-auto">
              {filteredTransactions.map((transaction) => (
                <button
                  key={transaction._id}
                  onClick={() =>
                    setSelectedTransactionId((prev) =>
                      prev === transaction._id ? "" : transaction._id,
                    )
                  }
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
                      {transaction.merchant && (
                        <p className="mt-1 text-xs text-gray-400">
                          {transaction.merchant}
                        </p>
                      )}
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

              {!filteredTransactions.length && (
                <div className="py-8 text-center text-sm text-gray-500">
                  No unreconciled transactions found.
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
