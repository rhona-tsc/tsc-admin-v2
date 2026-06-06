import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { backendUrl } from "../App";

const EMPTY_FORM = {
  entity: "TSC",
  type: "manual_adjustment",
  title: "",
  description: "",
  expectedDate: new Date().toISOString().slice(0, 10),
  amount: 0,
  direction: "out",
  status: "forecast",
  source: "manual",
  notes: "",
  autoCreateTaxEvents: false,
};

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

const eventTypes = [
  "salary_out",
  "ni_out",
  "vat_out",
  "corporation_tax_out",
  "recurring_income",
  "recurring_expense",
  "manual_adjustment",
  "client_deposit_in",
  "client_balance_in",
  "supplier_payment_out",
];

const statuses = ["forecast", "confirmed", "paid", "cancelled", "ignored"];

const TAX_CONFIG = {
  vatRegisteredFrom: "2026-02-01",
  vatPaymentMonthOffsets: [1, 4, 7, 10],
  vatPaymentDay: 7,
  corporationTaxRate: 0.25,
  companyYearEndMonth: 10,
  companyYearEndDay: 30,
  corporationTaxPaymentMonthOffset: 9,
  corporationTaxPaymentDay: 1,
};

const EWAN_PAYROLL_CONFIG = {
  salarySacrificeRate: 0.05,
  employerPensionRate: 0.03,
  employerNiRate: 0.15,
  employerNiMonthlyThreshold: 417,
};

const toISODate = (date) => date.toISOString().slice(0, 10);

const parseISODateOnly = (value) => {
  if (!value) return null;
  const date = new Date(`${String(value).slice(0, 10)}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const addMonths = (date, months) => {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
};

const getQuarterStart = (date) => {
  const month = date.getMonth();
  const quarterStartMonth = Math.floor(month / 3) * 3;
  return new Date(date.getFullYear(), quarterStartMonth, 1, 12);
};

const getVatQuarterEnd = (date) => {
  const start = getQuarterStart(date);
  return new Date(start.getFullYear(), start.getMonth() + 3, 0, 12);
};

const getVatPaymentDate = (sourceDateValue) => {
  const sourceDate = parseISODateOnly(sourceDateValue);
  if (!sourceDate) return "";

  const quarterEnd = getVatQuarterEnd(sourceDate);
  const paymentDate = addMonths(quarterEnd, 1);
  paymentDate.setDate(TAX_CONFIG.vatPaymentDay);
  return toISODate(paymentDate);
};

const getCompanyYearEndForDate = (sourceDateValue) => {
  const sourceDate = parseISODateOnly(sourceDateValue);
  if (!sourceDate) return null;

  const currentYearEnd = new Date(
    sourceDate.getFullYear(),
    TAX_CONFIG.companyYearEndMonth,
    TAX_CONFIG.companyYearEndDay,
    12,
  );

  if (sourceDate <= currentYearEnd) return currentYearEnd;

  return new Date(
    sourceDate.getFullYear() + 1,
    TAX_CONFIG.companyYearEndMonth,
    TAX_CONFIG.companyYearEndDay,
    12,
  );
};

const getCorporationTaxPaymentDate = (sourceDateValue) => {
  const yearEnd = getCompanyYearEndForDate(sourceDateValue);
  if (!yearEnd) return "";

  const paymentDate = addMonths(yearEnd, TAX_CONFIG.corporationTaxPaymentMonthOffset);
  paymentDate.setDate(TAX_CONFIG.corporationTaxPaymentDay);
  return toISODate(paymentDate);
};

const roundMoney = (value = 0) => Math.round(Number(value || 0) * 100) / 100;

const calculateVatFromGross = (grossAmount = 0, vatRate = 0.2) => {
  const gross = Math.abs(Number(grossAmount || 0));
  const rate = Number(vatRate || 0);
  if (!gross || !rate) return 0;
  return roundMoney(gross * (rate / (1 + rate)));
};

const isPotentialVatBearingIncome = (form) => {
  if (form?.direction !== "in") return false;
  return ["client_deposit_in", "client_balance_in", "recurring_income", "manual_adjustment"].includes(form?.type);
};

const isPotentialProfitEvent = (form) => {
  return ["client_deposit_in", "client_balance_in", "recurring_income", "manual_adjustment"].includes(form?.type);
};

const isEwanSalaryForm = (form) => {
  const title = String(form?.title || "").toLowerCase();
  return form?.type === "salary_out" && title.includes("ewan");
};

const calculateEwanPayrollCosts = (salaryAfterSacrifice = 0) => {
  const salary = Math.abs(Number(salaryAfterSacrifice || 0));
  const sacrificeRate = EWAN_PAYROLL_CONFIG.salarySacrificeRate;
  const employerPensionRate = EWAN_PAYROLL_CONFIG.employerPensionRate;

  const preSacrificeSalary = sacrificeRate < 1 ? salary / (1 - sacrificeRate) : salary;
  const salarySacrificePension = preSacrificeSalary * sacrificeRate;
  const employerPension = preSacrificeSalary * employerPensionRate;
  const totalPension = salarySacrificePension + employerPension;

  const employerNi = Math.max(
    0,
    (salary - EWAN_PAYROLL_CONFIG.employerNiMonthlyThreshold) *
      EWAN_PAYROLL_CONFIG.employerNiRate,
  );

  return {
    salary: roundMoney(salary),
    preSacrificeSalary: roundMoney(preSacrificeSalary),
    salarySacrificePension: roundMoney(salarySacrificePension),
    employerPension: roundMoney(employerPension),
    totalPension: roundMoney(totalPension),
    employerNi: roundMoney(employerNi),
  };
};

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

const signedAmount = (event) =>
  event.direction === "out"
    ? -Number(event.amount || 0)
    : Number(event.amount || 0);

const matchesSearch = (event, search) => {
  const q = String(search || "").toLowerCase().trim();
  if (!q) return true;

  const amount = signedAmount(event);
  const amountText = String(Math.abs(Number(amount || 0)));
  const amountFixed = Math.abs(Number(amount || 0)).toFixed(2);
  const moneyText = formatCurrency(amount).toLowerCase();

  return [
    event.title,
    event.description,
    event.clientNames,
    event.actName,
    event.type,
    event.status,
    event.source,
    event.entity,
    event.notes,
    amountText,
    amountFixed,
    moneyText,
  ]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(q));
};

const FinanceForecastEvents = () => {
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [autoCreateEwanPayrollCosts, setAutoCreateEwanPayrollCosts] = useState(true);
  const [autoCreateTaxEvents, setAutoCreateTaxEvents] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [entityFilter, setEntityFilter] = useState("TSC");
  const [statusFilter, setStatusFilter] = useState("forecast");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const filteredEvents = useMemo(() => {
    return events.filter((event) => matchesSearch(event, search));
  }, [events, search]);

  const ewanPayrollPreview = useMemo(() => {
    if (!isEwanSalaryForm(form)) return null;
    return calculateEwanPayrollCosts(form.amount);
  }, [form]);

  const taxPreview = useMemo(() => {
    if (!autoCreateTaxEvents) return null;

    const amount = Math.abs(Number(form.amount || 0));
    if (!amount || !form.expectedDate) return null;

    const eventDate = parseISODateOnly(form.expectedDate);
    const vatStartDate = parseISODateOnly(TAX_CONFIG.vatRegisteredFrom);
    const canCreateVat =
      isPotentialVatBearingIncome(form) &&
      eventDate &&
      vatStartDate &&
      eventDate >= vatStartDate;

    const vatAmount = canCreateVat ? calculateVatFromGross(amount, 0.2) : 0;
    const profitBeforeTax =
      form.direction === "in" ? Math.max(0, amount - vatAmount) : 0;
    const corporationTaxAmount = isPotentialProfitEvent(form)
      ? roundMoney(profitBeforeTax * TAX_CONFIG.corporationTaxRate)
      : 0;

    return {
      vatAmount,
      vatPaymentDate: getVatPaymentDate(form.expectedDate),
      corporationTaxAmount,
      corporationTaxPaymentDate: getCorporationTaxPaymentDate(form.expectedDate),
      profitBeforeTax,
    };
  }, [autoCreateTaxEvents, form]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccessMessage("");

      const params = {};
      if (entityFilter !== "ALL") params.entity = entityFilter;
      if (statusFilter !== "ALL") params.status = statusFilter;

      const res = await axios.get(`${backendUrl}/api/finance/forecast-events`, {
        params,
      });

      if (res.data?.success) {
        setEvents(res.data.forecastEvents || []);
      } else {
        setError(res.data?.message || "Could not load forecast events");
      }
    } catch (err) {
      console.error("fetch forecast events error:", err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [entityFilter, statusFilter]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setAutoCreateEwanPayrollCosts(true);
    setAutoCreateTaxEvents(false);
    setEditingId(null);
    setError("");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: name === "amount" ? Number(value) : value,
    }));
  };

  const handleEdit = (event) => {
    if (event.isAutoGenerated) {
      setError("Auto-generated events should be changed from the booking/import.");
      return;
    }

    setEditingId(event._id);
    setAutoCreateEwanPayrollCosts(false);
    setAutoCreateTaxEvents(false);

    setForm({
      entity: event.entity || "TSC",
      type: event.type || "manual_adjustment",
      title: event.title || "",
      description: event.description || "",
      expectedDate: event.expectedDate
        ? new Date(event.expectedDate).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10),
      amount: Number(event.amount || 0),
      direction: event.direction || "out",
      status: event.status || "forecast",
      source: event.source || "manual",
      notes: event.notes || "",
    });
  };

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

      if (!form.expectedDate) {
        setError("Expected date is required");
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
          `${backendUrl}/api/finance/forecast-events/${editingId}`,
          payload,
        );
        setSuccessMessage("Forecast event updated.");
      } else if (isEwanSalaryForm(form) && autoCreateEwanPayrollCosts) {
        const payroll = calculateEwanPayrollCosts(form.amount);
        const baseNotes = [
          form.notes,
          "Auto-created Ewan payroll set.",
          `Salary sacrifice: ${(EWAN_PAYROLL_CONFIG.salarySacrificeRate * 100).toFixed(1)}%`,
          `Employer pension: ${(EWAN_PAYROLL_CONFIG.employerPensionRate * 100).toFixed(1)}%`,
          `Employer NI: ${(EWAN_PAYROLL_CONFIG.employerNiRate * 100).toFixed(1)}% above £${EWAN_PAYROLL_CONFIG.employerNiMonthlyThreshold}/month`,
        ]
          .filter(Boolean)
          .join("\n");

        const payrollEvents = [
          {
            ...payload,
            amount: payroll.salary,
            notes: baseNotes,
          },
          {
            ...payload,
            type: "ni_out",
            title: "Ewan employer NI",
            description: `Employer NI linked to ${form.title}`,
            amount: payroll.employerNi,
            notes: [
              `Auto-created from salary event: ${form.title}`,
              `Salary after sacrifice: ${formatCurrency(payroll.salary)}`,
              `NI threshold used: £${EWAN_PAYROLL_CONFIG.employerNiMonthlyThreshold}/month`,
              `Employer NI rate used: ${(EWAN_PAYROLL_CONFIG.employerNiRate * 100).toFixed(1)}%`,
            ].join("\n"),
          },
          {
            ...payload,
            type: "recurring_expense",
            title: "Ewan pension",
            description: `Salary sacrifice pension + employer pension linked to ${form.title}`,
            amount: payroll.totalPension,
            notes: [
              `Auto-created from salary event: ${form.title}`,
              `Estimated pre-sacrifice salary: ${formatCurrency(payroll.preSacrificeSalary)}`,
              `Salary sacrifice pension: ${formatCurrency(payroll.salarySacrificePension)}`,
              `Employer pension: ${formatCurrency(payroll.employerPension)}`,
            ].join("\n"),
          },
        ].filter((event) => Number(event.amount || 0) > 0);

        await Promise.all(
          payrollEvents.map((eventPayload) =>
            axios.post(`${backendUrl}/api/finance/forecast-events`, eventPayload),
          ),
        );

        setSuccessMessage(
          `Forecast event added with ${payrollEvents.length - 1} linked payroll cost event(s).`,
        );
      } else if (autoCreateTaxEvents && taxPreview) {
        const taxEvents = [payload];

        if (taxPreview.vatAmount > 0) {
          taxEvents.push({
            ...payload,
            type: "vat_out",
            title: `VAT payment - ${form.title}`,
            description: `Estimated VAT linked to ${form.title}`,
            expectedDate: taxPreview.vatPaymentDate,
            amount: taxPreview.vatAmount,
            direction: "out",
            notes: [
              `Auto-created from forecast event: ${form.title}`,
              `VAT registration start assumed: ${TAX_CONFIG.vatRegisteredFrom}`,
              `VAT estimated from gross income at 20% VAT inclusive: ${formatCurrency(taxPreview.vatAmount)}`,
            ].join("\n"),
          });
        }

        if (taxPreview.corporationTaxAmount > 0) {
          taxEvents.push({
            ...payload,
            type: "corporation_tax_out",
            title: `Corporation tax - ${form.title}`,
            description: `Estimated corporation tax linked to ${form.title}`,
            expectedDate: taxPreview.corporationTaxPaymentDate,
            amount: taxPreview.corporationTaxAmount,
            direction: "out",
            notes: [
              `Auto-created from forecast event: ${form.title}`,
              `Company year end assumed: 30 November`,
              `Payment date assumed: 1 September after year end`,
              `Corporation tax estimated at ${(TAX_CONFIG.corporationTaxRate * 100).toFixed(1)}% of estimated profit before tax.`,
              `Estimated profit before corporation tax: ${formatCurrency(taxPreview.profitBeforeTax)}`,
            ].join("\n"),
          });
        }

        await Promise.all(
          taxEvents.map((eventPayload) =>
            axios.post(`${backendUrl}/api/finance/forecast-events`, eventPayload),
          ),
        );

        setSuccessMessage(
          `Forecast event added with ${taxEvents.length - 1} linked tax event(s).`,
        );
      } else {
        await axios.post(`${backendUrl}/api/finance/forecast-events`, payload);
        setSuccessMessage("Forecast event added.");
      }

      resetForm();
      await fetchEvents();
    } catch (err) {
      console.error("save forecast event error:", err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleIgnore = async (event) => {
    if (!window.confirm("Mark this forecast event as ignored?")) return;

    try {
      setDeletingId(event._id);
      setError("");
      setSuccessMessage("");

      await axios.put(`${backendUrl}/api/finance/forecast-events/${event._id}`, {
        status: "ignored",
      });

      setSuccessMessage("Forecast event marked as ignored.");
      await fetchEvents();
    } catch (err) {
      console.error("ignore forecast event error:", err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setDeletingId("");
    }
  };

  const handleDelete = async (event) => {
    const message = event.isAutoGenerated
      ? "Delete this auto-generated forecast event permanently? This may reappear if the booking/import regenerates it."
      : "Delete this manual forecast event permanently?";

    if (!window.confirm(message)) return;

    try {
      setDeletingId(event._id);
      setError("");
      setSuccessMessage("");

      await axios.delete(`${backendUrl}/api/finance/forecast-events/${event._id}`);
      setSuccessMessage("Forecast event deleted.");
      await fetchEvents();
    } catch (err) {
      console.error("delete forecast event error:", err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setDeletingId("");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">
            Forecast Events
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Add, edit and search expected cash movements.
          </p>
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
              {editingId ? "Edit Forecast Event" : "Add Forecast Event"}
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
                  options={eventTypes}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Expected date"
                  name="expectedDate"
                  type="date"
                  value={form.expectedDate}
                  onChange={handleChange}
                />

                <Input
                  label="Amount"
                  name="amount"
                  type="number"
                  value={form.amount}
                  onChange={handleChange}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Direction"
                  name="direction"
                  value={form.direction}
                  onChange={handleChange}
                  options={["in", "out"]}
                />

                <Select
                  label="Status"
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  options={statuses}
                />
              </div>

              {!editingId && isPotentialVatBearingIncome(form) && (
                <div className="rounded-xl border border-amber-100 bg-amber-50 p-3 text-sm text-amber-950">
                  <label className="mb-3 flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={autoCreateTaxEvents}
                      onChange={(e) => setAutoCreateTaxEvents(e.target.checked)}
                      className="mt-1"
                    />
                    <span>
                      Auto-create estimated VAT and corporation tax forecast events
                    </span>
                  </label>

                  {taxPreview && (
                    <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                      <div>VAT estimate: {formatCurrency(taxPreview.vatAmount)}</div>
                      <div>VAT payment date: {taxPreview.vatPaymentDate || "TBC"}</div>
                      <div>
                        Corporation tax estimate: {formatCurrency(taxPreview.corporationTaxAmount)}
                      </div>
                      <div>
                        Corporation tax payment date: {taxPreview.corporationTaxPaymentDate || "TBC"}
                      </div>
                    </div>
                  )}

                  <p className="mt-2 text-[11px] text-amber-800">
                    Assumes VAT registration from 1 Feb 2026, quarterly VAT paid one month and 7 days after quarter end, and corporation tax paid 9 months and 1 day after the 30 Nov year end.
                  </p>
                </div>
              )}

              {ewanPayrollPreview && !editingId && (
                <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm text-blue-950">
                  <label className="mb-3 flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={autoCreateEwanPayrollCosts}
                      onChange={(e) =>
                        setAutoCreateEwanPayrollCosts(e.target.checked)
                      }
                      className="mt-1"
                    />
                    <span>
                      Auto-create Ewan employer NI and pension forecast events
                    </span>
                  </label>

                  <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                    <div>
                      Salary after sacrifice: {formatCurrency(ewanPayrollPreview.salary)}
                    </div>
                    <div>
                      Estimated pre-sacrifice salary: {formatCurrency(ewanPayrollPreview.preSacrificeSalary)}
                    </div>
                    <div>
                      Employer NI: {formatCurrency(ewanPayrollPreview.employerNi)}
                    </div>
                    <div>
                      Pension total: {formatCurrency(ewanPayrollPreview.totalPension)}
                    </div>
                    <div>
                      Salary sacrifice pension: {formatCurrency(ewanPayrollPreview.salarySacrificePension)}
                    </div>
                    <div>
                      Employer pension: {formatCurrency(ewanPayrollPreview.employerPension)}
                    </div>
                  </div>

                  <p className="mt-2 text-[11px] text-blue-800">
                    Assumes salary amount entered is after 5% salary sacrifice. Employer NI uses 15% above £417/month. Check these rates against payroll before filing.
                  </p>
                </div>
              )}

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
                      ? "Update Event"
                      : "Add Event"}
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
                  Forecast Events
                </h2>
                <p className="text-sm text-gray-500">
                  {filteredEvents.length} of {events.length} events shown.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
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

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, client, amount, type, source..."
              className="mb-4 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
            />

            {loading ? (
              <div className="py-8 text-center text-sm text-gray-500">
                Loading forecast events...
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b text-xs uppercase tracking-wide text-gray-500">
                      <th className="px-3 py-3">Date</th>
                      <th className="px-3 py-3">Title</th>
                      <th className="px-3 py-3">Type</th>
                      <th className="px-3 py-3">Status</th>
                      <th className="px-3 py-3">Source</th>
                      <th className="px-3 py-3 text-right">Amount</th>
                      <th className="px-3 py-3 text-right">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredEvents.map((event) => (
                      <tr key={event._id} className="border-b last:border-0">
                        <td className="whitespace-nowrap px-3 py-3">
                          {formatDate(event.expectedDate)}
                        </td>
                        <td className="px-3 py-3">
                          <p className="font-medium text-gray-900">
                            {event.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            {event.entity}
                            {event.clientNames ? ` · ${event.clientNames}` : ""}
                            {event.actName ? ` / ${event.actName}` : ""}
                          </p>
                        </td>
                        <td className="px-3 py-3 text-gray-500">
                          {event.type}
                        </td>
                        <td className="px-3 py-3">
                          <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700">
                            {event.status}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-gray-500">
                          {event.isAutoGenerated ? "booking" : "manual"}
                        </td>
                        <td
                          className={`px-3 py-3 text-right font-medium ${
                            event.direction === "in"
                              ? "text-green-700"
                              : "text-red-700"
                          }`}
                        >
                          {formatCurrency(signedAmount(event))}
                        </td>
                        <td className="px-3 py-3 text-right">
                          {!event.isAutoGenerated && (
                            <button
                              onClick={() => handleEdit(event)}
                              className="mr-3 text-sm font-medium text-gray-700 underline"
                            >
                              Edit
                            </button>
                          )}

                          {event.isAutoGenerated && (
                            <button
                              onClick={() => handleIgnore(event)}
                              disabled={deletingId === event._id}
                              className="mr-3 text-sm font-medium text-amber-700 underline disabled:opacity-50"
                            >
                              {deletingId === event._id ? "Working..." : "Ignore"}
                            </button>
                          )}

                          <button
                            onClick={() => handleDelete(event)}
                            disabled={deletingId === event._id}
                            className="text-sm font-medium text-red-600 underline disabled:opacity-50"
                          >
                            {deletingId === event._id ? "Working..." : "Delete"}
                          </button>
                        </td>
                      </tr>
                    ))}

                    {!filteredEvents.length && (
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

export default FinanceForecastEvents;