

import React, { useMemo, useState } from "react";

const inputClass =
  "w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-black";

const labelClass = "mb-2 block text-sm font-medium text-gray-700";

const sectionTitleClass = "text-lg font-semibold text-gray-900";
const sectionTextClass = "text-sm text-gray-500";

const normaliseCsvArray = (value = "") =>
  String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const buildInitialState = (initialValues = {}) => ({
  title: initialValues.title || "",
  date: initialValues.date || "",
  callTime: initialValues.callTime || "",
  finishTime: initialValues.finishTime || "",
  venue: initialValues.venue || "",
  location: initialValues.location || "",
  fee:
    initialValues.fee === 0 || initialValues.fee
      ? String(initialValues.fee)
      : "",
  notes: initialValues.notes || "",
  requiredInstruments: Array.isArray(initialValues.requiredInstruments)
    ? initialValues.requiredInstruments.join(", ")
    : initialValues.requiredInstruments || "",
  requiredSkills: Array.isArray(initialValues.requiredSkills)
    ? initialValues.requiredSkills.join(", ")
    : initialValues.requiredSkills || "",
  tags: Array.isArray(initialValues.tags)
    ? initialValues.tags.join(", ")
    : initialValues.tags || "",
});

const DeputyJobCreateForm = ({
  initialValues = {},
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitLabel = "Create job",
}) => {
  const [formData, setFormData] = useState(() => buildInitialState(initialValues));
  const [errors, setErrors] = useState({});

  const parsedPreview = useMemo(
    () => ({
      requiredInstruments: normaliseCsvArray(formData.requiredInstruments),
      requiredSkills: normaliseCsvArray(formData.requiredSkills),
      tags: normaliseCsvArray(formData.tags),
    }),
    [formData.requiredInstruments, formData.requiredSkills, formData.tags]
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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

    if (!String(formData.location || formData.venue || "").trim()) {
      nextErrors.location = "Please add at least a location or venue.";
    }

    if (
      formData.fee !== "" &&
      (!Number.isFinite(Number(formData.fee)) || Number(formData.fee) < 0)
    ) {
      nextErrors.fee = "Fee must be a valid number.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    const payload = {
      title: String(formData.title || "").trim(),
      date: formData.date || "",
      callTime: formData.callTime || "",
      finishTime: formData.finishTime || "",
      venue: String(formData.venue || "").trim(),
      location: String(formData.location || "").trim(),
      fee: formData.fee === "" ? 0 : Number(formData.fee),
      notes: String(formData.notes || "").trim(),
      requiredInstruments: normaliseCsvArray(formData.requiredInstruments),
      requiredSkills: normaliseCsvArray(formData.requiredSkills),
      tags: normaliseCsvArray(formData.tags),
    };

    if (typeof onSubmit === "function") {
      await onSubmit(payload);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-3xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-gray-200 px-6 py-5">
          <h2 className={sectionTitleClass}>Create deputy opportunity</h2>
          <p className={`${sectionTextClass} mt-1`}>
            Add the job details below and matching musicians can be invited to apply.
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
              Fee
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
            <p className="mt-2 text-xs text-gray-500">
              Separate multiple items with commas.
            </p>
          </div>

          <div className="lg:col-span-2">
            <label className={labelClass} htmlFor="requiredSkills">
              Required skills
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
        </div>
      </div>

      <div className="rounded-3xl border border-gray-200 bg-gray-50 px-6 py-5">
        <h3 className="text-base font-semibold text-gray-900">Matching preview</h3>
        <p className="mt-1 text-sm text-gray-500">
          These are the fields the matching logic can use when deciding who to notify.
        </p>

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
              Skills
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
                <span className="text-sm text-gray-400">No skills added</span>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Tags
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {parsedPreview.tags.length ? (
                parsedPreview.tags.map((item) => (
                  <span
                    key={`tag-${item}`}
                    className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700 border border-gray-200"
                  >
                    {item}
                  </span>
                ))
              ) : (
                <span className="text-sm text-gray-400">No tags added</span>
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
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-[#ff6667] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
};

export default DeputyJobCreateForm;