import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { backendUrl } from "../App";

const formatCurrency = (value = 0) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const FinanceTransactionImport = () => {
  const [accounts, setAccounts] = useState([]);
  const [accountId, setAccountId] = useState("");
  const [entity, setEntity] = useState("");
  const [file, setFile] = useState(null);

  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const selectedAccount = useMemo(
    () => accounts.find((account) => account._id === accountId),
    [accounts, accountId],
  );

  const fetchAccounts = async () => {
    try {
      setLoadingAccounts(true);
      setError("");

      const res = await axios.get(`${backendUrl}/api/finance/accounts`);

      if (res.data?.success) {
        const activeAccounts = (res.data.accounts || []).filter(
          (account) => account.isActive !== false,
        );

        setAccounts(activeAccounts);

        if (activeAccounts.length && !accountId) {
          setAccountId(activeAccounts[0]._id);
          setEntity(activeAccounts[0].entity || "");
        }
      } else {
        setError(res.data?.message || "Could not load finance accounts.");
      }
    } catch (err) {
      console.error("fetch finance accounts error:", err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoadingAccounts(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    if (selectedAccount?.entity) {
      setEntity(selectedAccount.entity);
    }
  }, [selectedAccount]);

  const handleImport = async (e) => {
    e.preventDefault();

    try {
      setImporting(true);
      setError("");
      setResult(null);

      if (!accountId) {
        setError("Please select a finance account.");
        return;
      }

      if (!file) {
        setError("Please choose a CSV file.");
        return;
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("accountId", accountId);
      formData.append("entity", entity || selectedAccount?.entity || "");

      const res = await axios.post(
        `${backendUrl}/api/finance/transactions/import/csv`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      if (res.data?.success) {
        setResult(res.data);
        setFile(null);

        const input = document.getElementById("finance-csv-file");
        if (input) input.value = "";
      } else {
        setError(res.data?.message || "Could not import CSV.");
      }
    } catch (err) {
      console.error("CSV import error:", err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">
            Import Bank Transactions
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Upload a CSV bank export and attach it to one of your finance
            accounts.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {result && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            <p className="font-semibold">CSV import complete</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-5">
              <ResultStat label="Rows" value={result.rowsRead} />
              <ResultStat label="Imported" value={result.imported} />
              <ResultStat label="Duplicates" value={result.duplicates} />
              <ResultStat label="Skipped" value={result.skipped} />
              <ResultStat label="Errors" value={result.errors?.length || 0} />
            </div>
          </div>
        )}

        <form
          onSubmit={handleImport}
          className="rounded-2xl bg-white p-5 shadow-sm"
        >
          <div className="space-y-5">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Finance account
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                disabled={loadingAccounts}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                {!accounts.length && (
                  <option value="">
                    {loadingAccounts
                      ? "Loading accounts..."
                      : "No accounts found"}
                  </option>
                )}

                {accounts.map((account) => (
                  <option key={account._id} value={account._id}>
                    {account.name} · {account.entity} · {account.provider || account.accountType}
                  </option>
                ))}
              </select>
            </div>

            {selectedAccount && (
              <div className="grid gap-3 rounded-xl bg-gray-50 p-4 text-sm sm:grid-cols-3">
                <InfoCard label="Entity" value={selectedAccount.entity} />
                <InfoCard label="Provider" value={selectedAccount.provider || "-"} />
                <InfoCard
                  label="Current balance"
                  value={formatCurrency(selectedAccount.currentBalance)}
                />
              </div>
            )}

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Entity override
              </label>
              <input
                value={entity}
                onChange={(e) => setEntity(e.target.value)}
                placeholder="BMM"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">
                Usually this should match the selected account entity.
              </p>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                CSV file
              </label>
              <input
                id="finance-csv-file"
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
              />

              {file && (
                <p className="mt-2 text-xs text-gray-500">
                  Selected: <span className="font-medium">{file.name}</span>
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={importing || !accountId || !file}
                className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {importing ? "Importing..." : "Import CSV"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setResult(null);
                  setError("");
                  const input = document.getElementById("finance-csv-file");
                  if (input) input.value = "";
                }}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700"
              >
                Clear
              </button>
            </div>
          </div>
        </form>

        <div className="mt-6 rounded-2xl bg-white p-5 text-sm text-gray-600 shadow-sm">
          <p className="font-semibold text-gray-900">Recommended flow</p>
          <p className="mt-2">
            Upload bank CSV → run auto-match → manually reconcile anything left.
          </p>
        </div>
      </div>
    </div>
  );
};

const InfoCard = ({ label, value }) => (
  <div>
    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
      {label}
    </p>
    <p className="mt-1 font-semibold text-gray-900">{value || "-"}</p>
  </div>
);

const ResultStat = ({ label, value }) => (
  <div className="rounded-lg bg-white p-3">
    <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
    <p className="mt-1 font-semibold text-gray-900">{value ?? 0}</p>
  </div>
);

export default FinanceTransactionImport;