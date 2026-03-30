import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { backendUrl } from "../App";

const inputClass =
  "w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-black";

const labelClass = "mb-2 block text-sm font-medium text-gray-700";
const hintClass = "mt-2 text-xs text-gray-500";
const sectionTitleClass = "text-lg font-semibold text-gray-900";
const sectionTextClass = "text-sm text-gray-500";

const normaliseCsvArray = (value = "") =>
  String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const normaliseEmail = (value = "") => String(value || "").trim().toLowerCase();

const toDateInputValue = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value || "").slice(0, 10);
  }
  return date.toISOString().slice(0, 10);
};

const asMoneyString = (value) => {
  if (value === 0 || value) return String(value);
  return "";
};

const buildInitialState = (initialValues = {}) => ({
  title: initialValues.title || "",
  date: initialValues.date || initialValues.eventDate || "",
  callTime: initialValues.callTime || initialValues.startTime || "",
  finishTime: initialValues.finishTime || initialValues.endTime || "",
  venue: initialValues.venue || initialValues.locationName || "",
  location: initialValues.location || "",
  county: initialValues.county || "",
  postcode: initialValues.postcode || "",
  fee:
    initialValues.fee === 0 || initialValues.fee
      ? String(initialValues.fee)
      : "",
  notes: initialValues.notes || "",
  clientName: initialValues.clientName || "",
  clientEmail: initialValues.clientEmail || "",
  clientPhone: initialValues.clientPhone || "",
  grossAmount: asMoneyString(initialValues.grossAmount),
  commissionAmount: asMoneyString(initialValues.commissionAmount),
  deputyNetAmount: asMoneyString(initialValues.deputyNetAmount),
  releaseOn: toDateInputValue(initialValues.releaseOn),
  saveClientCard: true,
  requiredInstruments: Array.isArray(initialValues.requiredInstruments)
    ? initialValues.requiredInstruments.join(", ")
    : initialValues.requiredInstruments || initialValues.instrument || "",
  requiredSkills: Array.isArray(initialValues.requiredSkills)
    ? initialValues.requiredSkills.join(", ")
    : Array.isArray(initialValues.essentialRoles)
    ? initialValues.essentialRoles.join(", ")
    : initialValues.requiredSkills || "",
  desiredRoles: Array.isArray(initialValues.desiredRoles)
    ? initialValues.desiredRoles.join(", ")
    : initialValues.desiredRoles || "",
  secondaryInstruments: Array.isArray(initialValues.secondaryInstruments)
    ? initialValues.secondaryInstruments.join(", ")
    : initialValues.secondaryInstruments || "",
  genres: Array.isArray(initialValues.genres)
    ? initialValues.genres.join(", ")
    : initialValues.genres || "",
  tags: Array.isArray(initialValues.tags)
    ? initialValues.tags.join(", ")
    : initialValues.tags || "",
  previewOnly:
    initialValues.previewOnly === undefined
      ? true
      : Boolean(initialValues.previewOnly),
});

const DeputyJobCreateForm = ({
  initialValues = {},
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitLabel = "Create job",
  authHeaders = {},
  onCreated,
}) => {
  const [formData, setFormData] = useState(() => buildInitialState(initialValues));
  const [errors, setErrors] = useState({});
  const [submittingAction, setSubmittingAction] = useState("");

  useEffect(() => {
    if (!formData.fee) return;

    setFormData((prev) => {
      const nextDeputyNetAmount = prev.deputyNetAmount !== "" ? prev.deputyNetAmount : prev.fee;
      const nextGrossAmount = prev.grossAmount !== "" ? prev.grossAmount : prev.fee;
      const nextCommissionAmount =
        prev.commissionAmount !== ""
          ? prev.commissionAmount
          : (() => {
              const gross = Number(nextGrossAmount || 0);
              const net = Number(nextDeputyNetAmount || 0);
              return gross > net ? String(gross - net) : "0";
            })();

      if (
        nextDeputyNetAmount === prev.deputyNetAmount &&
        nextGrossAmount === prev.grossAmount &&
        nextCommissionAmount === prev.commissionAmount
      ) {
        return prev;
      }

      return {
        ...prev,
        deputyNetAmount: nextDeputyNetAmount,
        grossAmount: nextGrossAmount,
        commissionAmount: nextCommissionAmount,
      };
    });
  }, [formData.fee]);

  const parsedPreview = useMemo(
    () => ({
      requiredInstruments: normaliseCsvArray(formData.requiredInstruments),
      requiredSkills: normaliseCsvArray(formData.requiredSkills),
      desiredRoles: normaliseCsvArray(formData.desiredRoles),
      secondaryInstruments: normaliseCsvArray(formData.secondaryInstruments),
      genres: normaliseCsvArray(formData.genres),
      tags: normaliseCsvArray(formData.tags),
    }),
    [
      formData.requiredInstruments,
      formData.requiredSkills,
      formData.desiredRoles,
      formData.secondaryInstruments,
      formData.genres,
      formData.tags,
    ]
  );

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validate = () => {
    const nextErrors = {};

    if (!String(formData.title || "").trim()) {
      nextErrors.title = "Please add a job title.";
    }

    if (!String(formData.date || "").trim()) {
      nextErrors.date = "Please add a job date.";
    }

    if (!String(formData.callTime || "").trim()) {
      nextErrors.callTime = "Please add a call time.";
    }

    if (!String(formData.finishTime || "").trim()) {
      nextErrors.finishTime = "Please add a finish time.";
    }

    if (!String(formData.county || "").trim()) {
      nextErrors.county = "Please add a county.";
    }

    if (!String(formData.postcode || "").trim()) {
      nextErrors.postcode = "Please add a postcode.";
    }

    if (!String(formData.location || formData.venue || formData.county || "").trim()) {
      nextErrors.location = "Please add at least a location, venue or county.";
    }

    if (!normaliseCsvArray(formData.requiredInstruments).length) {
      nextErrors.requiredInstruments = "Please add at least one required instrument.";
    }

    if (!normaliseCsvArray(formData.genres).length) {
      nextErrors.genres = "Please add at least one genre.";
    }

    if (!String(formData.clientName || "").trim()) {
      nextErrors.clientName = "Please add the client name.";
    }

    if (!String(formData.clientEmail || "").trim()) {
      nextErrors.clientEmail = "Please add the client email.";
    }

    if (!String(formData.clientPhone || "").trim()) {
      nextErrors.clientPhone = "Please add the client phone number.";
    }

    if (
      formData.fee === "" ||
      !Number.isFinite(Number(formData.fee)) ||
      Number(formData.fee) < 0
    ) {
      nextErrors.fee = "Fee must be a valid number.";
    }

    if (
      formData.clientEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(formData.clientEmail).trim())
    ) {
      nextErrors.clientEmail = "Please enter a valid client email address.";
    }

    ["grossAmount", "commissionAmount", "deputyNetAmount"].forEach((fieldName) => {
      if (
        formData[fieldName] !== "" &&
        (!Number.isFinite(Number(formData[fieldName])) || Number(formData[fieldName]) < 0)
      ) {
        nextErrors[fieldName] = "Must be a valid number.";
      }
    });

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const buildPayload = (previewOnlyOverride = formData.previewOnly) => {
    const requiredInstruments = normaliseCsvArray(formData.requiredInstruments);
    const requiredSkills = normaliseCsvArray(formData.requiredSkills);
    const desiredRoles = normaliseCsvArray(formData.desiredRoles);
    const secondaryInstruments = normaliseCsvArray(formData.secondaryInstruments);
    const genres = normaliseCsvArray(formData.genres);
    const tags = normaliseCsvArray(formData.tags);

    const mergedDesiredRoles = Array.from(
      new Set([...requiredSkills, ...desiredRoles])
    );

    const primaryInstrument = requiredInstruments[0] || "";
    const inferredIsVocalSlot = /vocal|singer|rapper|rap|mc/i.test(primaryInstrument);

    return {
      title: String(formData.title || "").trim(),
      date: formData.date || "",
      eventDate: formData.date || "",
      callTime: formData.callTime || "",
      startTime: formData.callTime || "",
      finishTime: formData.finishTime || "",
      endTime: formData.finishTime || "",
      venue: String(formData.venue || "").trim(),
      locationName: String(formData.venue || "").trim(),
      location: String(formData.location || "").trim(),
      county: String(formData.county || "").trim(),
      postcode: String(formData.postcode || "").trim(),
      fee: formData.fee === "" ? 0 : Number(formData.fee),
      notes: String(formData.notes || "").trim(),
      clientName: String(formData.clientName || "").trim(),
      clientEmail: normaliseEmail(formData.clientEmail),
      clientPhone: String(formData.clientPhone || "").trim(),
      grossAmount: formData.grossAmount === "" ? 0 : Number(formData.grossAmount),
      commissionAmount:
        formData.commissionAmount === "" ? 0 : Number(formData.commissionAmount),
      deputyNetAmount:
        formData.deputyNetAmount === "" ? 0 : Number(formData.deputyNetAmount),
      releaseOn: formData.releaseOn || null,
      saveClientCard: true,
      instrument: primaryInstrument,
      requiredInstruments,
      requiredSkills,
      essentialRoles: requiredSkills,
      desiredRoles: mergedDesiredRoles,
      secondaryInstruments,
      genres,
      tags,
      isVocalSlot: inferredIsVocalSlot,
      mode: previewOnlyOverride ? "preview" : "send",
      previewOnly: Boolean(previewOnlyOverride),
    };
  };

  const submitPayload = async (previewOnlyOverride) => {
    if (!validate()) return;

    const payload = buildPayload(previewOnlyOverride);
    const actionLabel = payload.previewOnly ? "preview" : "create";

    try {
      setSubmittingAction(actionLabel);

      if (typeof onSubmit === "function") {
        await onSubmit(payload);
        return;
      }

      const res = await axios.post(`${backendUrl}/api/deputy-jobs`, payload, {
        headers: authHeaders,
      });

      if (res.data?.success) {
        if (payload.previewOnly) {
          toast.success(
            `Preview ready. ${res.data.matchedCount || 0} musicians matched.`
          );
        } else {
          toast.success(
            `Deputy job created. ${res.data.notifiedCount || 0} musicians notified.`
          );
        }

        onCreated?.(res.data.job || res.data);
        return;
      }

      toast.error(res.data?.message || "Failed to create deputy job.");
    } catch (error) {
      console.error("Failed to submit deputy job:", error);
      toast.error(
        error?.response?.data?.message || "Failed to create deputy job."
      );
    } finally {
      setSubmittingAction("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await submitPayload(formData.previewOnly);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-3xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-gray-200 px-6 py-5">
          <h2 className={sectionTitleClass}>Create deputy opportunity</h2>
          <p className={`${sectionTextClass} mt-1`}>
            Add the job details below, preview who matches, and then choose whether to send notifications straight away.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 px-6 py-6 lg:grid-cols-2">
          <div className="lg:col-span-2">
            <label className={labelClass} htmlFor="title">
              Job title
            </label>
            <input
              id="title"
              name="title"
              type="text"
              value={formData.title}
              onChange={handleChange}
              className={inputClass}
              placeholder="e.g. Female lead vocalist for wedding band"
            />
            {errors.title ? (
              <p className="mt-2 text-sm text-red-600">{errors.title}</p>
            ) : null}
          </div>

          <div>
            <label className={labelClass} htmlFor="date">
              Date
            </label>
            <input
              id="date"
              name="date"
              type="date"
              value={formData.date}
              onChange={handleChange}
              className={inputClass}
            />
            {errors.date ? (
              <p className="mt-2 text-sm text-red-600">{errors.date}</p>
            ) : null}
          </div>

          <div>
            <label className={labelClass} htmlFor="fee">
              Fee (£)
            </label>
            <input
              id="fee"
              name="fee"
              type="number"
              min="0"
              step="1"
              value={formData.fee}
              onChange={handleChange}
              className={inputClass}
              placeholder="0"
            />
            {errors.fee ? (
              <p className="mt-2 text-sm text-red-600">{errors.fee}</p>
            ) : null}
          </div>

          <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Client payment setup</h3>
                <p className="text-xs text-gray-500 mt-1">
                  Add the client details now so you can save their card after job creation and charge once the deputy is allocated.
                </p>
              </div>

              <div className="inline-flex items-center rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700">
                Payment details required
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div>
                <label className={labelClass} htmlFor="clientName">
                  Client name
                </label>
                <input
                  id="clientName"
                  name="clientName"
                  type="text"
                  value={formData.clientName}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Client full name"
                />
                {errors.clientName ? (
                  <p className="mt-2 text-sm text-red-600">{errors.clientName}</p>
                ) : null}
              </div>

              <div>
                <label className={labelClass} htmlFor="clientEmail">
                  Client email
                </label>
                <input
                  id="clientEmail"
                  name="clientEmail"
                  type="email"
                  value={formData.clientEmail}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="client@example.com"
                />
                {errors.clientEmail ? (
                  <p className="mt-2 text-sm text-red-600">{errors.clientEmail}</p>
                ) : null}
              </div>

              <div>
                <label className={labelClass} htmlFor="clientPhone">
                  Client phone
                </label>
                <input
                  id="clientPhone"
                  name="clientPhone"
                  type="text"
                  value={formData.clientPhone}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Client phone number"
                />
                {errors.clientPhone ? (
                  <p className="mt-2 text-sm text-red-600">{errors.clientPhone}</p>
                ) : null}
              </div>
            </div>
          </div>

          <div>
            <label className={labelClass} htmlFor="callTime">
              Call time
            </label>
            <input
              id="callTime"
              name="callTime"
              type="time"
              value={formData.callTime}
              onChange={handleChange}
              className={inputClass}
            />
            {errors.callTime ? (
              <p className="mt-2 text-sm text-red-600">{errors.callTime}</p>
            ) : null}
          </div>

          <div>
            <label className={labelClass} htmlFor="finishTime">
              Finish time
            </label>
            <input
              id="finishTime"
              name="finishTime"
              type="time"
              value={formData.finishTime}
              onChange={handleChange}
              className={inputClass}
            />
            {errors.finishTime ? (
              <p className="mt-2 text-sm text-red-600">{errors.finishTime}</p>
            ) : null}
          </div>

          <div>
            <label className={labelClass} htmlFor="venue">
              Venue
            </label>
            <input
              id="venue"
              name="venue"
              type="text"
              value={formData.venue}
              onChange={handleChange}
              className={inputClass}
              placeholder="Venue name"
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="county">
              County
            </label>
            <input
              id="county"
              name="county"
              type="text"
              value={formData.county}
              onChange={handleChange}
              className={inputClass}
              placeholder="e.g. Essex"
            />
            {errors.county ? (
              <p className="mt-2 text-sm text-red-600">{errors.county}</p>
            ) : null}
          </div>

          <div>
            <label className={labelClass} htmlFor="postcode">
              Postcode
            </label>
            <input
              id="postcode"
              name="postcode"
              type="text"
              value={formData.postcode}
              onChange={handleChange}
              className={inputClass}
              placeholder="e.g. CM19 5LE"
            />
            {errors.postcode ? (
              <p className="mt-2 text-sm text-red-600">{errors.postcode}</p>
            ) : null}
          </div>

          <div className="lg:col-span-2">
            <label className={labelClass} htmlFor="location">
              Location
            </label>
            <input
              id="location"
              name="location"
              type="text"
              value={formData.location}
              onChange={handleChange}
              className={inputClass}
              placeholder="Town, county or full address"
            />
            {errors.location ? (
              <p className="mt-2 text-sm text-red-600">{errors.location}</p>
            ) : null}
          </div>

          <div className="lg:col-span-2">
            <label className={labelClass} htmlFor="requiredInstruments">
              Required instruments
            </label>
            <input
              id="requiredInstruments"
              name="requiredInstruments"
              type="text"
              value={formData.requiredInstruments}
              onChange={handleChange}
              className={inputClass}
              placeholder="e.g. Lead Vocalist, Guitar, Saxophone"
            />
            <p className={hintClass}>Separate multiple items with commas.</p>
            {errors.requiredInstruments ? (
              <p className="mt-2 text-sm text-red-600">{errors.requiredInstruments}</p>
            ) : null}
          </div>

          <div className="lg:col-span-2">
            <label className={labelClass} htmlFor="requiredSkills">
              Essential skills
            </label>
            <input
              id="requiredSkills"
              name="requiredSkills"
              type="text"
              value={formData.requiredSkills}
              onChange={handleChange}
              className={inputClass}
              placeholder="e.g. Backing vocals, MD, Sound engineering"
            />
          </div>

          <div className="lg:col-span-2">
            <label className={labelClass} htmlFor="desiredRoles">
              Preferred extra skills
            </label>
            <input
              id="desiredRoles"
              name="desiredRoles"
              type="text"
              value={formData.desiredRoles}
              onChange={handleChange}
              className={inputClass}
              placeholder="e.g. Can DJ, Band leading, Client liaison"
            />
          </div>

          <div className="lg:col-span-2">
            <label className={labelClass} htmlFor="secondaryInstruments">
              Secondary instruments
            </label>
            <input
              id="secondaryInstruments"
              name="secondaryInstruments"
              type="text"
              value={formData.secondaryInstruments}
              onChange={handleChange}
              className={inputClass}
              placeholder="e.g. Piano, Acoustic Guitar"
            />
          </div>

          <div className="lg:col-span-2">
            <label className={labelClass} htmlFor="genres">
              Genres
            </label>
            <input
              id="genres"
              name="genres"
              type="text"
              value={formData.genres}
              onChange={handleChange}
              className={inputClass}
              placeholder="e.g. Motown, Soul, Pop"
            />
            {errors.genres ? (
              <p className="mt-2 text-sm text-red-600">{errors.genres}</p>
            ) : null}
          </div>

          <div className="lg:col-span-2">
            <label className={labelClass} htmlFor="tags">
              Tags
            </label>
            <input
              id="tags"
              name="tags"
              type="text"
              value={formData.tags}
              onChange={handleChange}
              className={inputClass}
              placeholder="e.g. Wedding, Corporate, Motown"
            />
          </div>

          <div className="lg:col-span-2">
            <label className={labelClass} htmlFor="notes">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={6}
              value={formData.notes}
              onChange={handleChange}
              className={inputClass}
              placeholder="Add any useful details for applicants — sets, dress code, parking, dep time, accommodation, doubling requirements, etc."
            />
          </div>

          <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Booking ledger</h3>
              <p className="text-xs text-gray-500 mt-1">
                These values will be stored on the deputy job so payment and payout status can be tracked later.
              </p>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-4">
              <div>
                <label className={labelClass} htmlFor="grossAmount">
                  Gross amount
                </label>
                <input
                  id="grossAmount"
                  name="grossAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.grossAmount}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="0"
                />
                {errors.grossAmount ? (
                  <p className="mt-2 text-sm text-red-600">{errors.grossAmount}</p>
                ) : null}
              </div>

              <div>
                <label className={labelClass} htmlFor="commissionAmount">
                  Commission amount
                </label>
                <input
                  id="commissionAmount"
                  name="commissionAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.commissionAmount}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="0"
                />
                {errors.commissionAmount ? (
                  <p className="mt-2 text-sm text-red-600">{errors.commissionAmount}</p>
                ) : null}
              </div>

              <div>
                <label className={labelClass} htmlFor="deputyNetAmount">
                  Deputy net amount
                </label>
                <input
                  id="deputyNetAmount"
                  name="deputyNetAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.deputyNetAmount}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="0"
                />
                {errors.deputyNetAmount ? (
                  <p className="mt-2 text-sm text-red-600">{errors.deputyNetAmount}</p>
                ) : null}
              </div>

              <div>
                <label className={labelClass} htmlFor="releaseOn">
                  Release payout on
                </label>
                <input
                  id="releaseOn"
                  name="releaseOn"
                  type="date"
                  value={formData.releaseOn}
                  onChange={handleChange}
                  className={inputClass}
                />
                <p className={hintClass}>Leave blank to let the backend default it.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-gray-200 bg-gray-50 px-6 py-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Matching preview</h3>
            <p className="mt-1 text-sm text-gray-500">
              These are the fields the matching logic can use when deciding who to notify. Client payment and ledger fields are stored too, but they do not affect matching.
            </p>
          </div>

          <label className="inline-flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700">
            <input
              type="checkbox"
              name="previewOnly"
              checked={Boolean(formData.previewOnly)}
              onChange={handleChange}
              className="h-4 w-4 accent-black"
            />
            Create as preview only
          </label>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Instruments
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {parsedPreview.requiredInstruments.length ? (
                parsedPreview.requiredInstruments.map((item) => (
                  <span
                    key={`instrument-${item}`}
                    className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700 border border-gray-200"
                  >
                    {item}
                  </span>
                ))
              ) : (
                <span className="text-sm text-gray-400">No instruments added</span>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Essential skills
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {parsedPreview.requiredSkills.length ? (
                parsedPreview.requiredSkills.map((item) => (
                  <span
                    key={`skill-${item}`}
                    className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700 border border-gray-200"
                  >
                    {item}
                  </span>
                ))
              ) : (
                <span className="text-sm text-gray-400">No essential skills added</span>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Tags / genres
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {[...parsedPreview.tags, ...parsedPreview.genres].length ? (
                [...parsedPreview.tags, ...parsedPreview.genres].map((item, index) => (
                  <span
                    key={`tag-${item}-${index}`}
                    className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700 border border-gray-200"
                  >
                    {item}
                  </span>
                ))
              ) : (
                <span className="text-sm text-gray-400">No tags or genres added</span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Preferred extra skills
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {parsedPreview.desiredRoles.length ? (
                parsedPreview.desiredRoles.map((item) => (
                  <span
                    key={`desired-${item}`}
                    className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700 border border-gray-200"
                  >
                    {item}
                  </span>
                ))
              ) : (
                <span className="text-sm text-gray-400">No preferred extras added</span>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Secondary instruments
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {parsedPreview.secondaryInstruments.length ? (
                parsedPreview.secondaryInstruments.map((item) => (
                  <span
                    key={`secondary-${item}`}
                    className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700 border border-gray-200"
                  >
                    {item}
                  </span>
                ))
              ) : (
                <span className="text-sm text-gray-400">No secondary instruments added</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3">
        {typeof onCancel === "function" ? (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center rounded-full border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        ) : null}

        <button
          type="button"
          disabled={isSubmitting || submittingAction === "preview" || submittingAction === "create"}
          onClick={() => submitPayload(true)}
          className="inline-flex items-center rounded-full border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submittingAction === "preview" ? "Preparing preview…" : "Save preview"}
        </button>

        <button
          type="submit"
          disabled={isSubmitting || submittingAction === "preview" || submittingAction === "create"}
          className="inline-flex items-center rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-[#ff6667] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submittingAction === "create"
            ? "Creating…"
            : formData.previewOnly
            ? submitLabel
            : "Create, notify and prep payment"}
        </button>
      </div>
    </form>
  );
};

export default DeputyJobCreateForm;