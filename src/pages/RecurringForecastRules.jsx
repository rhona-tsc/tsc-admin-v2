import React, { useEffect, useState } from "react";
import axios from "axios";
import { backendUrl } from "../App";

const EMPTY_FORM = {
  entity: "TSC",
  title: "",
  description: "",
  type: "recurring_expense",
  amount: 0,
  direction: "out",
  frequency: "monthly",
  startDate: new Date().toISOString().slice(0, 10),
  endDate: "",
  dayOfMonth: "",
  monthOfYear: "",
  status: "active",
  notes: "",
};

const entities = ["TSC", "BMM", "Personal", "Savings", "Investment", "Crypto"];

const ruleTypes = [
  "salary_out",
  "ni_out",
  "vat_out",
  "corporation_tax_out",
  "recurring_income",
  "recurring_expense",
  "manual_adjustment",
];

const frequencies = ["weekly", "monthly", "quarterly", "yearly"];
const statuses = ["active", "paused", "ended"];

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

const RecurringForecastRules = () => {
  const [rules, setRules] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);

  const [entityFilter, setEntityFilter] = useState("TSC");
  const [statusFilter, setStatusFilter] = useState("active");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const fetchRules = async () => {
    try {
      setLoading(true);
      setError("");

      const params = {};
      if (entityFilter !== "ALL") params.entity = entityFilter;
      if (statusFilter !== "ALL") params.status = statusFilter;

      const res = await axios.get(`${backendUrl}/api/finance/recurring-rules`, {
        params,
      });

      if (res.data?.success) {
        setRules(res.data.rules || []);
      } else {
        setError(res.data?.message || "Could not load recurring rules");
      }
    } catch (err) {
      console.error("fetch recurring rules error:", err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, [entityFilter, statusFilter]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setError("");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: ["amount", "dayOfMonth", "monthOfYear"].includes(name)
        ? value === ""
          ? ""
          : Number(value)
        : value,
    }));
  };

  const handleEdit = (rule) => {
    setEditingId(rule._id);

    setForm({
      entity: rule.entity || "TSC",
      title: rule.title || "",
      description: rule.description || "",
      type: rule.type || "recurring_expense",
      amount: Number(rule.amount || 0),
      direction: rule.direction || "out",
      frequency: rule.frequency || "monthly",
      startDate: rule.startDate
        ? new Date(rule.startDate).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10),
      endDate: rule.endDate
        ? new Date(rule.endDate).toISOString().slice(0, 10)
        : "",
      dayOfMonth: rule.dayOfMonth || "",
      monthOfYear: rule.monthOfYear || "",
      status: rule.status || "active",
      notes: rule.notes || "",
    });
  };

  const buildPayload = () => ({
    ...form,
    amount: Math.abs(Number(form.amount || 0)),
    dayOfMonth: form.dayOfMonth === "" ? undefined : Number(form.dayOfMonth),
    monthOfYear: form.monthOfYear === "" ? undefined : Number(form.monthOfYear),
    endDate: form.endDate || undefined,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccessMessage("");

      if (!form.title.trim()) {
        setError("Title is required");
        return;
      }

      if (Number(form.amount || 0) <= 0) {
        setError("Amount must be greater than 0");
        return;
      }

      if (!form.startDate) {
        setError("Start date is required");
        return;
      }

      const payload = buildPayload();

      if (editingId) {
        await axios.put(
          `${backendUrl}/api/finance/recurring-rules/${editingId}`,
          payload,
        );
        setSuccessMessage("Recurring rule updated.");
      } else {
        await axios.post(`${backendUrl}/api/finance/recurring-rules`, payload);
        setSuccessMessage("Recurring rule created.");
      }

      resetForm();
      await fetchRules();
    } catch (err) {
      console.error("save recurring rule error:", err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm("Delete this recurring rule?");
    if (!confirmed) return;

    try {
      setError("");
      setSuccessMessage("");
      await axios.delete(`${backendUrl}/api/finance/recurring-rules/${id}`);
      setSuccessMessage("Recurring rule deleted.");
      await fetchRules();
    } catch (err) {
      console.error("delete recurring rule error:", err);
      setError(err.response?.data?.message || err.message);
    }
  };

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      setError("");
      setSuccessMessage("");

      const payload = {
        entity: entityFilter === "ALL" ? undefined : entityFilter,
        months: 12,
        replaceExisting: true,
      };

      const res = await axios.post(
        `${backendUrl}/api/finance/recurring-rules/generate`,
        payload,
      );

      if (res.data?.success) {
        setSuccessMessage(
          `Generated ${res.data.eventsCreated || 0} forecast events from ${
            res.data.rulesProcessed || 0
          } rules.`,
        );
      } else {
        setError(res.data?.message || "Could not generate forecast events");
      }
    } catch (err) {
      console.error("generate recurring forecast error:", err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Recurring Forecast Rules
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Create repeating salary, tax, ads, subscriptions and recurring
              income rules.
            </p>
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {generating ? "Generating..." : "Generate Next 12 Months"}
          </button>
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

        <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl bg-white p-5 shadow-sm"
          >
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              {editingId ? "Edit Rule" : "Add Rule"}
            </h2>

            <div className="space-y-4">
              <Input
                label="Title"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Rhona salary"
              />

              <Input
                label="Description"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Monthly salary"
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
                  label="Type"
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                  options={ruleTypes}
                />
              </div>

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
                  options={["in", "out"]}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Frequency"
                  name="frequency"
                  value={form.frequency}
                  onChange={handleChange}
                  options={frequencies}
                />

                <Select
                  label="Status"
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  options={statuses}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Start date"
                  name="startDate"
                  type="date"
                  value={form.startDate}
                  onChange={handleChange}
                />

                <Input
                  label="End date"
                  name="endDate"
                  type="date"
                  value={form.endDate}
                  onChange={handleChange}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Day of month"
                  name="dayOfMonth"
                  type="number"
                  value={form.dayOfMonth}
                  onChange={handleChange}
                  placeholder="31"
                />

                <Input
                  label="Month of year"
                  name="monthOfYear"
                  type="number"
                  value={form.monthOfYear}
                  onChange={handleChange}
                  placeholder="12"
                />
              </div>

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
                      ? "Update Rule"
                      : "Add Rule"}
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
                <h2 className="text-lg font-semibold text-gray-900">Rules</h2>
                <p className="text-sm text-gray-500">
                  Active rules are used to generate forecast events.
                </p>
              </div>

              <div className="flex gap-3">
                <Select
                  label="Entity"
                  value={entityFilter}
                  onChange={(e) => setEntityFilter(e.target.value)}
                  options={["ALL", ...entities]}
                />

                <Select
                  label="Status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  options={["ALL", ...statuses]}
                />
              </div>
            </div>

            {loading ? (
              <div className="py-8 text-center text-sm text-gray-500">
                Loading rules...
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b text-xs uppercase tracking-wide text-gray-500">
                      <th className="px-3 py-3">Rule</th>
                      <th className="px-3 py-3">Entity</th>
                      <th className="px-3 py-3">Frequency</th>
                      <th className="px-3 py-3">Start</th>
                      <th className="px-3 py-3">Status</th>
                      <th className="px-3 py-3 text-right">Amount</th>
                      <th className="px-3 py-3 text-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {rules.map((rule) => (
                      <tr key={rule._id} className="border-b last:border-0">
                        <td className="px-3 py-3">
                          <p className="font-medium text-gray-900">
                            {rule.title}
                          </p>
                          <p className="text-xs text-gray-500">{rule.type}</p>
                        </td>
                        <td className="px-3 py-3">{rule.entity}</td>
                        <td className="px-3 py-3 text-gray-500">
                          {rule.frequency}
                          {rule.dayOfMonth ? ` · day ${rule.dayOfMonth}` : ""}
                        </td>
                        <td className="px-3 py-3">
                          {formatDate(rule.startDate)}
                        </td>
                        <td className="px-3 py-3">
                          <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700">
                            {rule.status}
                          </span>
                        </td>
                        <td
                          className={`px-3 py-3 text-right font-medium ${
                            rule.direction === "in"
                              ? "text-green-700"
                              : "text-red-700"
                          }`}
                        >
                          {rule.direction === "out" ? "-" : "+"}
                          {formatCurrency(rule.amount)}
                        </td>
                        <td className="px-3 py-3 text-right">
                          <button
                            onClick={() => handleEdit(rule)}
                            className="mr-3 text-sm font-medium text-gray-700 underline"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(rule._id)}
                            className="text-sm font-medium text-red-600 underline"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}

                    {!rules.length && (
                      <tr>
                        <td
                          colSpan="7"
                          className="px-3 py-8 text-center text-gray-500"
                        >
                          No recurring rules found.
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
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  </div>
);

export default RecurringForecastRules;