import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { backendUrl } from "../App";

const EMPTY_FORM = {
  name: "",
  entity: "TSC",
  accountType: "bank",
  provider: "",
  lastFour: "",
  openingBalance: 0,
  currentBalance: 0,
  balanceAsOf: new Date().toISOString().slice(0, 10),
  currency: "GBP",
  isActive: true,
  notes: "",
};

const entities = ["TSC", "BMM", "HSBC", "Monzo Joint",  "Monzo Personal", "AMEX", "CBS", "HL Investment", "HSBC Investment","Bitcoin", "Solana","Ethereum", "True Potential Penson", "Aviva Pension"];

const accountTypes = [
  "bank",
  "savings",
  "credit_card",
  "investment",
  "crypto",
  "cash",
];

const formatCurrency = (value = 0) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const FinanceAccounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [entityFilter, setEntityFilter] = useState("ALL");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await axios.get(`${backendUrl}/api/finance/accounts`);

      if (res.data?.success) {
        setAccounts(res.data.accounts || []);
      } else {
        setError(res.data?.message || "Could not load accounts");
      }
    } catch (err) {
      console.error("fetchAccounts error:", err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const filteredAccounts = useMemo(() => {
    if (entityFilter === "ALL") return accounts;
    return accounts.filter((account) => account.entity === entityFilter);
  }, [accounts, entityFilter]);

  const totalsByEntity = useMemo(() => {
    return accounts.reduce((acc, account) => {
      if (!account.isActive) return acc;
      acc[account.entity] =
        (acc[account.entity] || 0) + Number(account.currentBalance || 0);
      return acc;
    }, {});
  }, [accounts]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : ["openingBalance", "currentBalance"].includes(name)
            ? Number(value)
            : value,
    }));
  };

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setError("");
  };

  const handleEdit = (account) => {
    setEditingId(account._id);
    setForm({
      name: account.name || "",
      entity: account.entity || "TSC",
      accountType: account.accountType || "bank",
      provider: account.provider || "",
      lastFour: account.lastFour || "",
      openingBalance: Number(account.openingBalance || 0),
      currentBalance: Number(account.currentBalance || 0),
      balanceAsOf: account.balanceAsOf
        ? new Date(account.balanceAsOf).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10),
      currency: account.currency || "GBP",
      isActive: account.isActive !== false,
      notes: account.notes || "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");

      if (!form.name.trim()) {
        setError("Account name is required");
        return;
      }

      if (editingId) {
        await axios.put(`${backendUrl}/api/finance/accounts/${editingId}`, form);
      } else {
        await axios.post(`${backendUrl}/api/finance/accounts`, form);
      }

      resetForm();
      await fetchAccounts();
    } catch (err) {
      console.error("save account error:", err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (accountId) => {
    const confirmed = window.confirm(
      "Delete this finance account? This will remove it from starting balance calculations.",
    );

    if (!confirmed) return;

    try {
      setError("");
      await axios.delete(`${backendUrl}/api/finance/accounts/${accountId}`);
      await fetchAccounts();
    } catch (err) {
      console.error("delete account error:", err);
      setError(err.response?.data?.message || err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">
            Finance Accounts
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Add and update account balances used by the finance dashboard.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {entities.map((entity) => (
            <div key={entity} className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                {entity}
              </p>
              <p className="mt-2 text-xl font-semibold text-gray-900">
                {formatCurrency(totalsByEntity[entity] || 0)}
              </p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl bg-white p-5 shadow-sm"
          >
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              {editingId ? "Edit Account" : "Add Account"}
            </h2>

            <div className="space-y-4">
              <Input
                label="Account name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="TSC Main Bank"
              />

              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Entity"
                  name="entity"
                  value={form.entity}
                  onChange={handleChange}
                  options={entities}
                />

                <Select
                  label="Account type"
                  name="accountType"
                  value={form.accountType}
                  onChange={handleChange}
                  options={accountTypes}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Provider"
                  name="provider"
                  value={form.provider}
                  onChange={handleChange}
                  placeholder="Starling"
                />

                <Input
                  label="Last 4 digits"
                  name="lastFour"
                  value={form.lastFour}
                  onChange={handleChange}
                  placeholder="1234"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Opening balance"
                  name="openingBalance"
                  type="number"
                  value={form.openingBalance}
                  onChange={handleChange}
                />

                <Input
                  label="Current balance"
                  name="currentBalance"
                  type="number"
                  value={form.currentBalance}
                  onChange={handleChange}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Balance as of"
                  name="balanceAsOf"
                  type="date"
                  value={form.balanceAsOf}
                  onChange={handleChange}
                />

                <Input
                  label="Currency"
                  name="currency"
                  value={form.currency}
                  onChange={handleChange}
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={form.isActive}
                  onChange={handleChange}
                />
                Include in dashboard balance
              </label>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  rows="3"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Update Account"
                      : "Add Account"}
                </button>

                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </form>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Accounts
                </h2>
                <p className="text-sm text-gray-500">
                  Active accounts are included in forecast starting balances.
                </p>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Filter entity
                </label>
                <select
                  value={entityFilter}
                  onChange={(e) => setEntityFilter(e.target.value)}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="ALL">All</option>
                  {entities.map((entity) => (
                    <option key={entity} value={entity}>
                      {entity}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {loading ? (
              <div className="py-8 text-center text-sm text-gray-500">
                Loading accounts...
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b text-xs uppercase tracking-wide text-gray-500">
                      <th className="px-3 py-3">Name</th>
                      <th className="px-3 py-3">Entity</th>
                      <th className="px-3 py-3">Type</th>
                      <th className="px-3 py-3">Provider</th>
                      <th className="px-3 py-3 text-right">Balance</th>
                      <th className="px-3 py-3">Active</th>
                      <th className="px-3 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAccounts.map((account) => (
                      <tr key={account._id} className="border-b last:border-0">
                        <td className="px-3 py-3 font-medium text-gray-900">
                          {account.name}
                        </td>
                        <td className="px-3 py-3">{account.entity}</td>
                        <td className="px-3 py-3 text-gray-500">
                          {account.accountType}
                        </td>
                        <td className="px-3 py-3 text-gray-500">
                          {account.provider || "-"}
                        </td>
                        <td className="px-3 py-3 text-right font-medium">
                          {formatCurrency(account.currentBalance)}
                        </td>
                        <td className="px-3 py-3">
                          {account.isActive ? "Yes" : "No"}
                        </td>
                        <td className="px-3 py-3 text-right">
                          <button
                            onClick={() => handleEdit(account)}
                            className="mr-3 text-sm font-medium text-gray-700 underline"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(account._id)}
                            className="text-sm font-medium text-red-600 underline"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}

                    {!filteredAccounts.length && (
                      <tr>
                        <td
                          colSpan="7"
                          className="px-3 py-8 text-center text-gray-500"
                        >
                          No accounts found.
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
    </div>
  );
};

const Input = ({ label, name, value, onChange, type = "text", placeholder }) => (
  <div>
    <label className="mb-1 block text-xs font-medium text-gray-600">
      {label}
    </label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
    />
  </div>
);

const Select = ({ label, name, value, onChange, options }) => (
  <div>
    <label className="mb-1 block text-xs font-medium text-gray-600">
      {label}
    </label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  </div>
);

export default FinanceAccounts;