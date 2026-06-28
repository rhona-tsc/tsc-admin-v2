import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { backendUrl } from "../App";

const EMPTY_FORM = {
  accountId: "",
  entity: "TSC",
  date: new Date().toISOString().slice(0, 10),
  description: "",
  merchant: "",
  amount: 0,
  direction: "in",
  category: "other",
  vatTreatment: "unknown",
  preRegistrationVatCategory: "services",
  taxTreatment: "unknown",
  source: "manual",
  notes: "",
  reconciled: false,
};

const entities = ["TSC", "BMM", "HSBC", "Monzo Joint",  "Monzo Personal", "AMEX", "CBS", "HL Investment", "HSBC Investment","Bitcoin", "Solana","Ethereum", "True Potential Penson", "Aviva Pension"];

const categories = [
  "client_payment",
  "supplier_payment",
  "salary",
  "tax",
  "software",
  "advertising",
  "travel",
  "bank_fee",
  "transfer",
  "investment",
  "crypto",
  "personal",
  "other",
];

const vatTreatments = ["standard", "zero", "exempt", "outside_scope", "unknown"];
const preRegistrationVatCategories = ["services", "goods"];

const taxTreatments = [
  "income",
  "allowable_expense",
  "non_allowable",
  "transfer",
  "unknown",
];

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

const FinanceTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);

  const [entityFilter, setEntityFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [reconciledFilter, setReconciledFilter] = useState("ALL");
  const [preRegVatFilter, setPreRegVatFilter] = useState("ALL");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchAccounts = async () => {
    const res = await axios.get(`${backendUrl}/api/finance/accounts`);
    if (res.data?.success) {
      setAccounts(res.data.accounts || []);
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError("");

      const params = {};
      if (entityFilter !== "ALL") params.entity = entityFilter;
      if (categoryFilter !== "ALL") params.category = categoryFilter;
      if (reconciledFilter !== "ALL") {
        params.reconciled = reconciledFilter === "true";
      }

      if (preRegVatFilter !== "ALL") {
        if (preRegVatFilter === "services") {
          params.entity = "BMM";
          params.direction = "out";
          params.vatTreatment = "standard";
          params.from = "2025-08-07";
          params.to = "2026-02-06";
        }

        if (preRegVatFilter === "goods") {
          params.entity = "BMM";
          params.direction = "out";
          params.vatTreatment = "standard";
          params.from = "2022-02-07";
          params.to = "2026-02-06";
        }
      }

      const res = await axios.get(`${backendUrl}/api/finance/transactions`, {
        params,
      });

      if (res.data?.success) {
        setTransactions(res.data.transactions || []);
      } else {
        setError(res.data?.message || "Could not load transactions");
      }
    } catch (err) {
      console.error("fetchTransactions error:", err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [entityFilter, categoryFilter, reconciledFilter, preRegVatFilter]);

  const selectableAccounts = useMemo(
    () =>
      accounts
        .filter((account) => account.isActive !== false)
        .sort((a, b) => {
          const aEntity = String(a.entity || "");
          const bEntity = String(b.entity || "");
          if (aEntity !== bEntity) return aEntity.localeCompare(bEntity);
          return String(a.name || "").localeCompare(String(b.name || ""));
        }),
    [accounts],
  );

  const totals = useMemo(() => {
    return transactions.reduce(
      (acc, tx) => {
        const amount = Math.abs(Number(tx.amount || 0));

        if (tx.direction === "in") {
          acc.totalIn += amount;
          acc.net += amount;
        } else {
          acc.totalOut += amount;
          acc.net -= amount;
        }

        return acc;
      },
      { totalIn: 0, totalOut: 0, net: 0 },
    );
  }, [transactions]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setError("");
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => {
      const next = {
        ...prev,
        [name]:
          type === "checkbox"
            ? checked
            : name === "amount"
              ? Number(value)
              : value,
      };

      if (name === "accountId") {
        const selectedAccount = accounts.find((acc) => acc._id === value);
        if (selectedAccount?.entity) {
          next.entity = selectedAccount.entity;
        }
      }

      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");

      if (!form.accountId) {
        setError("Please select an account");
        return;
      }

      if (!form.date) {
        setError("Please enter a date");
        return;
      }

      if (!form.description.trim()) {
        setError("Please enter a description");
        return;
      }

      if (Number(form.amount || 0) <= 0) {
        setError("Amount must be greater than 0");
        return;
      }

      const payload = {
        ...form,
        amount: Math.abs(Number(form.amount || 0)),
      };

      if (editingId) {
        await axios.put(
          `${backendUrl}/api/finance/transactions/${editingId}`,
          payload,
        );
      } else {
        await axios.post(`${backendUrl}/api/finance/transactions`, payload);
      }

      resetForm();
      await fetchTransactions();
    } catch (err) {
      console.error("save transaction error:", err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (tx) => {
    setEditingId(tx._id);

    setForm({
      accountId: tx.accountId?._id || tx.accountId || "",
      entity: tx.entity || "TSC",
      date: tx.date ? new Date(tx.date).toISOString().slice(0, 10) : "",
      description: tx.description || "",
      merchant: tx.merchant || "",
      amount: Math.abs(Number(tx.amount || 0)),
      direction: tx.direction || "in",
      category: tx.category || "other",
      vatTreatment: tx.vatTreatment || "unknown",
      preRegistrationVatCategory:
        tx.preRegistrationVatCategory || tx.vatReclaimCategory || "services",
      taxTreatment: tx.taxTreatment || "unknown",
      source: tx.source || "manual",
      notes: tx.notes || "",
      reconciled: tx.reconciled || false,
    });
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm("Delete this transaction?");
    if (!confirmed) return;

    try {
      setError("");
      await axios.delete(`${backendUrl}/api/finance/transactions/${id}`);
      await fetchTransactions();
    } catch (err) {
      console.error("delete transaction error:", err);
      setError(err.response?.data?.message || err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">
            Finance Transactions
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Log actual income and spending, then reconcile these against your
            forecast events.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <SummaryCard title="Money In" value={formatCurrency(totals.totalIn)} />
          <SummaryCard
            title="Money Out"
            value={formatCurrency(totals.totalOut)}
          />
          <SummaryCard title="Net" value={formatCurrency(totals.net)} />
        </div>

        <div className="grid gap-6 lg:grid-cols-[430px_1fr]">
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl bg-white p-5 shadow-sm"
          >
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              {editingId ? "Edit Transaction" : "Add Transaction"}
            </h2>

            <div className="space-y-4">
              <Select
                label="Account"
                name="accountId"
                value={form.accountId}
                onChange={handleChange}
                options={[
                  { value: "", label: "Select account" },
                  ...selectableAccounts.map((account) => ({
                    value: account._id,
                    label: `${account.name} (${account.entity})`,
                  })),
                ]}
              />

              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Entity"
                  name="entity"
                  value={form.entity}
                  onChange={handleChange}
                  options={entities.map((v) => ({ value: v, label: v }))}
                />

                <Input
                  label="Date"
                  name="date"
                  type="date"
                  value={form.date}
                  onChange={handleChange}
                />
              </div>

              <Input
                label="Description"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Client deposit - Sarah & Tom"
              />

              <Input
                label="Merchant / client / supplier"
                name="merchant"
                value={form.merchant}
                onChange={handleChange}
                placeholder="Sarah & Tom"
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Amount"
                  name="amount"
                  type="number"
                  value={form.amount}
                  onChange={handleChange}
                />

                <Select
                  label="Direction"
                  name="direction"
                  value={form.direction}
                  onChange={handleChange}
                  options={[
                    { value: "in", label: "Money in" },
                    { value: "out", label: "Money out" },
                  ]}
                />
              </div>

              <Select
                label="Category"
                name="category"
                value={form.category}
                onChange={handleChange}
                options={categories.map((v) => ({ value: v, label: v }))}
              />

              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="VAT treatment"
                  name="vatTreatment"
                  value={form.vatTreatment}
                  onChange={handleChange}
                  options={vatTreatments.map((v) => ({ value: v, label: v }))}
                />

                <Select
                  label="Tax treatment"
                  name="taxTreatment"
                  value={form.taxTreatment}
                  onChange={handleChange}
                  options={taxTreatments.map((v) => ({ value: v, label: v }))}
                />
              </div>

              <Select
                label="Pre-registration VAT type"
                name="preRegistrationVatCategory"
                value={form.preRegistrationVatCategory}
                onChange={handleChange}
                options={preRegistrationVatCategories.map((v) => ({
                  value: v,
                  label: v === "goods" ? "Goods / assets" : "Services",
                }))}
              />

              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  name="reconciled"
                  checked={form.reconciled}
                  onChange={handleChange}
                />
                Reconciled
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
                      ? "Update Transaction"
                      : "Add Transaction"}
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
            <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Transactions
                </h2>
                <p className="text-sm text-gray-500">
                  Filter and review actual transactions.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Select
                  label="Entity"
                  value={entityFilter}
                  onChange={(e) => setEntityFilter(e.target.value)}
                  options={[
                    { value: "ALL", label: "All" },
                    ...entities.map((v) => ({ value: v, label: v })),
                  ]}
                />

                <Select
                  label="Category"
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  options={[
                    { value: "ALL", label: "All" },
                    ...categories.map((v) => ({ value: v, label: v })),
                  ]}
                />

                <Select
                  label="Reconciled"
                  value={reconciledFilter}
                  onChange={(e) => setReconciledFilter(e.target.value)}
                  options={[
                    { value: "ALL", label: "All" },
                    { value: "true", label: "Reconciled" },
                    { value: "false", label: "Unreconciled" },
                  ]}
                />

                <Select
                  label="Pre-reg VAT"
                  value={preRegVatFilter}
                  onChange={(e) => setPreRegVatFilter(e.target.value)}
                  options={[
                    { value: "ALL", label: "All" },
                    { value: "services", label: "Services window" },
                    { value: "goods", label: "Goods window" },
                  ]}
                />
              </div>
            </div>

            {loading ? (
              <div className="py-8 text-center text-sm text-gray-500">
                Loading transactions...
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b text-xs uppercase tracking-wide text-gray-500">
                      <th className="px-3 py-3">Date</th>
                      <th className="px-3 py-3">Description</th>
                      <th className="px-3 py-3">Account</th>
                      <th className="px-3 py-3">Category</th>
                      <th className="px-3 py-3">VAT</th>
                      <th className="px-3 py-3">Pre-reg type</th>
                      <th className="px-3 py-3">Status</th>
                      <th className="px-3 py-3 text-right">Amount</th>
                      <th className="px-3 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr key={tx._id} className="border-b last:border-0">
                        <td className="whitespace-nowrap px-3 py-3">
                          {formatDate(tx.date)}
                        </td>
                        <td className="px-3 py-3">
                          <p className="font-medium text-gray-900">
                            {tx.description}
                          </p>
                          <p className="text-xs text-gray-500">
                            {tx.merchant || tx.entity}
                          </p>
                        </td>
                        <td className="px-3 py-3 text-gray-500">
                          {tx.accountId?.name || "-"}
                        </td>
                        <td className="px-3 py-3 text-gray-500">
                          {tx.category}
                        </td>
                        <td className="px-3 py-3 text-gray-500">
                          {tx.vatTreatment || "unknown"}
                        </td>
                        <td className="px-3 py-3 text-gray-500">
                          {tx.preRegistrationVatCategory ||
                            tx.vatReclaimCategory ||
                            "services"}
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className={`rounded-full px-2 py-1 text-xs ${
                              tx.reconciled
                                ? "bg-blue-50 text-blue-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {tx.reconciled ? "reconciled" : "unreconciled"}
                          </span>
                        </td>
                        <td
                          className={`px-3 py-3 text-right font-medium ${
                            tx.direction === "in"
                              ? "text-green-700"
                              : "text-red-700"
                          }`}
                        >
                          {tx.direction === "out" ? "-" : "+"}
                          {formatCurrency(tx.amount)}
                        </td>
                        <td className="px-3 py-3 text-right">
                          <button
                            onClick={() => handleEdit(tx)}
                            className="mr-3 text-sm font-medium text-gray-700 underline"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(tx._id)}
                            className="text-sm font-medium text-red-600 underline"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}

                    {!transactions.length && (
                      <tr>
                        <td
                          colSpan="9"
                          className="px-3 py-8 text-center text-gray-500"
                        >
                          No transactions found.
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

const SummaryCard = ({ title, value }) => (
  <div className="rounded-2xl bg-white p-4 shadow-sm">
    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
      {title}
    </p>
    <p className="mt-2 text-xl font-semibold text-gray-900">{value}</p>
  </div>
);

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
    {label && (
      <label className="mb-1 block text-xs font-medium text-gray-600">
        {label}
      </label>
    )}
    <select
      name={name}
      value={value}
      onChange={onChange}
      className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
    >
      {options.map((option) =>
        typeof option === "string" ? (
          <option key={option} value={option}>
            {option}
          </option>
        ) : (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ),
      )}
    </select>
  </div>
);

export default FinanceTransactions;