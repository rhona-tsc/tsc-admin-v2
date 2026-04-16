import React, { useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { backendUrl } from "../App";

const inputClass =
  "w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-black";

const labelClass = "mb-2 block text-sm font-medium text-gray-700";
const hintClass = "mt-2 text-xs text-gray-500";
const sectionTitleClass = "text-lg font-semibold text-gray-900";
const sectionTextClass = "text-sm text-gray-500";

const WHATS_INCLUDED_OPTIONS = [
  "hot meal",
  "refreshments",
  "buffet",
  "light snacks",
  "green room",
  "parking space",
  "other",
];

const CLAIMABLE_EXPENSE_OPTIONS = [
  "congestion charge",
  "travel",
  "ULEZ",
  "parking",
  "subsistence",
  "overnight accommodation",
  "other",
];

const normaliseCsvArray = (value = "") =>
  String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const buildInitialState = (initialValues = {}) => ({
  jobType:
    String(initialValues.jobType || "").trim().toLowerCase() === "enquiry"
      ? "enquiry"
      : "booked",

  title: initialValues.title || "",
  date: initialValues.date || initialValues.eventDate || "",
  callTime: initialValues.callTime || initialValues.startTime || "",
  finishTime: initialValues.finishTime || initialValues.endTime || "",
  venue: initialValues.venue || initialValues.locationName || "",
  location: initialValues.location || "",
  county: initialValues.county || "",
  postcode: initialValues.postcode || "",
  clientName: initialValues.clientName || "",
  clientEmail: initialValues.clientEmail || "",
  clientPhone: initialValues.clientPhone || "",
  saveClientCard:
    initialValues.saveClientCard === undefined
      ? String(initialValues.jobType || "").trim().toLowerCase() !== "enquiry"
      : Boolean(initialValues.saveClientCard),
  fee:
    initialValues.fee === 0 || initialValues.fee
      ? String(initialValues.fee)
      : "",
  notes: initialValues.notes || "",
  setLengths: Array.isArray(initialValues.setLengths)
    ? initialValues.setLengths.join(", ")
    : initialValues.setLengths || "",
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
  whatsIncluded: Array.isArray(initialValues.whatsIncluded)
    ? initialValues.whatsIncluded.filter((item) =>
        WHATS_INCLUDED_OPTIONS.includes(String(item).toLowerCase())
      )
    : [],
  whatsIncludedOther: Array.isArray(initialValues.whatsIncluded)
    ? initialValues.whatsIncluded
        .filter(
          (item) =>
            !WHATS_INCLUDED_OPTIONS.includes(String(item).toLowerCase())
        )
        .join(", ")
    : initialValues.whatsIncludedOther || "",
  claimableExpenses: Array.isArray(initialValues.claimableExpenses)
    ? initialValues.claimableExpenses.filter((item) =>
        CLAIMABLE_EXPENSE_OPTIONS.includes(String(item).toLowerCase())
      )
    : [],
  claimableExpensesOther: Array.isArray(initialValues.claimableExpenses)
    ? initialValues.claimableExpenses
        .filter(
          (item) =>
            !CLAIMABLE_EXPENSE_OPTIONS.includes(String(item).toLowerCase())
        )
        .join(", ")
    : initialValues.claimableExpensesOther || "",
});

const DeputyJobCreateForm = ({
  initialValues = {},
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitLabel = "Create job",
  authHeaders = {},
  onCreated,
  canCreateEnquiryJob = false,
}) => {
  const [formData, setFormData] = useState(() => buildInitialState(initialValues));
  const [errors, setErrors] = useState({});
  const [submittingAction, setSubmittingAction] = useState("");
  const [jobType, setJobType] = useState(
    () => buildInitialState(initialValues).jobType
  );

  const showEnquiryOption = Boolean(canCreateEnquiryJob);
  const isEnquiryJob = showEnquiryOption && jobType === "enquiry";

  React.useEffect(() => {
    if (!showEnquiryOption && jobType === "enquiry") {
      setJobType("booked");
    }
  }, [showEnquiryOption, jobType]);

  const parsedPreview = useMemo(
    () => ({
      requiredInstruments: normaliseCsvArray(formData.requiredInstruments),
      requiredSkills: normaliseCsvArray(formData.requiredSkills),
      desiredRoles: normaliseCsvArray(formData.desiredRoles),
      secondaryInstruments: normaliseCsvArray(formData.secondaryInstruments),
      genres: normaliseCsvArray(formData.genres),
      tags: normaliseCsvArray(formData.tags),
      setLengths: normaliseCsvArray(formData.setLengths),
      whatsIncluded: [
        ...(Array.isArray(formData.whatsIncluded) ? formData.whatsIncluded : []),
        ...normaliseCsvArray(formData.whatsIncludedOther),
      ],
      claimableExpenses: [
        ...(Array.isArray(formData.claimableExpenses)
          ? formData.claimableExpenses
          : []),
        ...normaliseCsvArray(formData.claimableExpensesOther),
      ],
    }),
    [
      formData.requiredInstruments,
      formData.requiredSkills,
      formData.desiredRoles,
      formData.secondaryInstruments,
      formData.genres,
      formData.tags,
      formData.setLengths,
      formData.whatsIncluded,
      formData.whatsIncludedOther,
      formData.claimableExpenses,
      formData.claimableExpensesOther,
    ]
  );

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    if (name === "whatsIncluded" || name === "claimableExpenses") {
      setFormData((prev) => {
        const currentValues = Array.isArray(prev[name]) ? prev[name] : [];
        const nextValues = checked
          ? [...currentValues, value]
          : currentValues.filter((item) => item !== value);

        return {
          ...prev,
          [name]: nextValues,
          ...(name === "whatsIncluded" && value === "other" && !checked
            ? { whatsIncludedOther: "" }
            : {}),
          ...(name === "claimableExpenses" && value === "other" && !checked
            ? { claimableExpensesOther: "" }
            : {}),
        };
      });

      setErrors((prev) => ({ ...prev, [name]: "" }));
      return;
    }

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

if (!isEnquiryJob && formData.saveClientCard) {
      if (!String(formData.clientName || "").trim()) {
        nextErrors.clientName = "Please add the client name for card setup.";
      }

      if (!String(formData.clientEmail || "").trim()) {
        nextErrors.clientEmail = "Please add the client email for card setup.";
      }
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

    if (
      formData.fee === "" ||
      !Number.isFinite(Number(formData.fee)) ||
      Number(formData.fee) < 0
    ) {
      nextErrors.fee = "Fee must be a valid number.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const buildPayload = (previewOnlyOverride = false) => {
    const requiredInstruments = normaliseCsvArray(formData.requiredInstruments);
    const requiredSkills = normaliseCsvArray(formData.requiredSkills);
    const desiredRoles = normaliseCsvArray(formData.desiredRoles);
    const secondaryInstruments = normaliseCsvArray(formData.secondaryInstruments);
    const genres = normaliseCsvArray(formData.genres);
    const tags = normaliseCsvArray(formData.tags);
    const setLengths = normaliseCsvArray(formData.setLengths);

    const whatsIncluded = [
      ...(Array.isArray(formData.whatsIncluded) ? formData.whatsIncluded : []),
      ...normaliseCsvArray(formData.whatsIncludedOther),
    ];

    const claimableExpenses = [
      ...(Array.isArray(formData.claimableExpenses)
        ? formData.claimableExpenses
        : []),
      ...normaliseCsvArray(formData.claimableExpensesOther),
    ];

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
      clientName: String(formData.clientName || "").trim(),
      clientEmail: String(formData.clientEmail || "").trim().toLowerCase(),
      clientPhone: String(formData.clientPhone || "").trim(),
saveClientCard: isEnquiryJob ? false : Boolean(formData.saveClientCard),
      fee: formData.fee === "" ? 0 : Number(formData.fee),
      notes: String(formData.notes || "").trim(),
      instrument: primaryInstrument,
      requiredInstruments,
      requiredSkills,
      essentialRoles: requiredSkills,
      desiredRoles: mergedDesiredRoles,
      secondaryInstruments,
      genres,
      jobType: showEnquiryOption ? jobType : "booked",
      tags,
      setLengths,
      whatsIncluded,
      claimableExpenses,
      isVocalSlot: inferredIsVocalSlot,
      mode: previewOnlyOverride ? "preview" : "send",
      previewOnly: Boolean(previewOnlyOverride),
    };
  };

  const submitPayload = async (previewOnlyOverride) => {
    if (!validate()) return;

    const payload = buildPayload(previewOnlyOverride);
    console.log("[DeputyJobCreateForm] submitting payload", payload);
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
      console.log("[DeputyJobCreateForm] create response", res.data);

     if (res.data?.success) {
  if (payload.previewOnly) {
    toast.success(
      `Preview ready. ${res.data.matchedCount || 0} musicians matched.`
    );
  } else if (isEnquiryJob) {
    toast.success("Enquiry-only deputy post created.");
  } else {
    toast.success(
      `Deputy job created. ${res.data?.matchedCount || 0} matched, ready to notify them!`
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
    await submitPayload(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-3xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-gray-200 px-6 py-5">
          <h2 className={sectionTitleClass}>Create deputy opportunity</h2>
          <p className={`${sectionTextClass} mt-1`}>
            Add the job details below and send the opportunity to matching musicians straight away.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 px-6 py-6 lg:grid-cols-2">
         <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Job type
  </label>
  <select
    value={showEnquiryOption ? jobType : "booked"}
    onChange={(e) => {
      const nextJobType = e.target.value;
      setJobType(nextJobType);

      if (nextJobType === "enquiry") {
        setFormData((prev) => ({
          ...prev,
          saveClientCard: false,
        }));
        setErrors((prev) => ({
          ...prev,
          clientName: "",
          clientEmail: "",
        }));
      }
    }}
    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-800 outline-none"
  >
    <option value="booked">Confirmed booking</option>
    {showEnquiryOption ? (
      <option value="enquiry">Enquiry / potential gig</option>
    ) : null}
  </select>
</div>
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
            {errors.title ? <p className="mt-2 text-sm text-red-600">{errors.title}</p> : null}
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
            {errors.date ? <p className="mt-2 text-sm text-red-600">{errors.date}</p> : null}
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
            {errors.fee ? <p className="mt-2 text-sm text-red-600">{errors.fee}</p> : null}
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
            {errors.callTime ? <p className="mt-2 text-sm text-red-600">{errors.callTime}</p> : null}
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
            {errors.finishTime ? <p className="mt-2 text-sm text-red-600">{errors.finishTime}</p> : null}
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
            {errors.county ? <p className="mt-2 text-sm text-red-600">{errors.county}</p> : null}
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
            {errors.postcode ? <p className="mt-2 text-sm text-red-600">{errors.postcode}</p> : null}
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
            {errors.location ? <p className="mt-2 text-sm text-red-600">{errors.location}</p> : null}
          </div>

         {!isEnquiryJob ? (
  <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-gray-50 p-4">
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h3 className="text-sm font-semibold text-gray-900">Payment card setup</h3>
        <p className="text-xs text-gray-500 mt-1">
          Save the client’s card details now so payment can be taken automatically when a deputy is allocated.
        </p>
      </div>

      <label className="inline-flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700">
        <input
          type="checkbox"
          name="saveClientCard"
          checked={Boolean(formData.saveClientCard)}
          onChange={handleChange}
          className="h-4 w-4 accent-black"
        />
        Save payment card
      </label>
    </div>

    {formData.saveClientCard ? (
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <label className={labelClass} htmlFor="clientName">
            Payer name
          </label>
          <input
            id="clientName"
            name="clientName"
            type="text"
            value={formData.clientName}
            onChange={handleChange}
            className={inputClass}
            placeholder="Full name"
          />
          {errors.clientName ? (
            <p className="mt-2 text-sm text-red-600">{errors.clientName}</p>
          ) : null}
        </div>

        <div>
          <label className={labelClass} htmlFor="clientEmail">
            Payer email
          </label>
          <input
            id="clientEmail"
            name="clientEmail"
            type="email"
            value={formData.clientEmail}
            onChange={handleChange}
            className={inputClass}
            placeholder="name@example.com"
          />
          {errors.clientEmail ? (
            <p className="mt-2 text-sm text-red-600">{errors.clientEmail}</p>
          ) : null}
        </div>

        <div>
          <label className={labelClass} htmlFor="clientPhone">
            Payer phone
          </label>
          <input
            id="clientPhone"
            name="clientPhone"
            type="text"
            value={formData.clientPhone}
            onChange={handleChange}
            className={inputClass}
            placeholder="Optional"
          />
        </div>
      </div>
    ) : null}
  </div>
) : (
  <div className="lg:col-span-2 rounded-2xl border border-blue-200 bg-blue-50 p-4">
    <h3 className="text-sm font-semibold text-blue-900">Enquiry-only post</h3>
    <p className={`${sectionTextClass} mt-1`}>
      This will create an enquiry-only deputy post for a potential gig. No card details will be collected and no automatic charge flow will be set up.
    </p>
  </div>
)}

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
            {errors.genres ? <p className="mt-2 text-sm text-red-600">{errors.genres}</p> : null}
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
            <label className={labelClass} htmlFor="setLengths">
              Set lengths
            </label>
            <input
              id="setLengths"
              name="setLengths"
              type="text"
              value={formData.setLengths}
              onChange={handleChange}
              className={inputClass}
              placeholder="e.g. 2x45 mins, 3x40 mins"
            />
            <p className={hintClass}>Separate multiple set formats with commas.</p>
          </div>

          <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">What’s included</h3>
              <p className="text-xs text-gray-500 mt-1">
                Tick anything the deputy can expect on the job.
              </p>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {WHATS_INCLUDED_OPTIONS.map((option) => (
                <label
                  key={option}
                  className="inline-flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700"
                >
                  <input
                    type="checkbox"
                    name="whatsIncluded"
                    value={option}
                    checked={
                      Array.isArray(formData.whatsIncluded) &&
                      formData.whatsIncluded.includes(option)
                    }
                    onChange={handleChange}
                    className="h-4 w-4 accent-black"
                  />
                  {option}
                </label>
              ))}
            </div>

            {Array.isArray(formData.whatsIncluded) &&
            formData.whatsIncluded.includes("other") ? (
              <div className="mt-4">
                <label className={labelClass} htmlFor="whatsIncludedOther">
                  Other included item
                </label>
                <input
                  id="whatsIncludedOther"
                  name="whatsIncludedOther"
                  type="text"
                  value={formData.whatsIncludedOther}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Add another included item"
                />
              </div>
            ) : null}
          </div>

          <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Claimable expenses</h3>
              <p className="text-xs text-gray-500 mt-1">
                Tick any expenses the deputy can claim back.
              </p>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {CLAIMABLE_EXPENSE_OPTIONS.map((option) => (
                <label
                  key={option}
                  className="inline-flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700"
                >
                  <input
                    type="checkbox"
                    name="claimableExpenses"
                    value={option}
                    checked={
                      Array.isArray(formData.claimableExpenses) &&
                      formData.claimableExpenses.includes(option)
                    }
                    onChange={handleChange}
                    className="h-4 w-4 accent-black"
                  />
                  {option}
                </label>
              ))}
            </div>

            {Array.isArray(formData.claimableExpenses) &&
            formData.claimableExpenses.includes("other") ? (
              <div className="mt-4">
                <label className={labelClass} htmlFor="claimableExpensesOther">
                  Other claimable expense
                </label>
                <input
                  id="claimableExpensesOther"
                  name="claimableExpensesOther"
                  type="text"
                  value={formData.claimableExpensesOther}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Add another claimable expense"
                />
              </div>
            ) : null}
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
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Matching preview</h3>
            <p className="mt-1 text-sm text-gray-500">
              These are the fields the matching logic will use when deciding who to notify.
            </p>
          </div>

        
        
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

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Set lengths
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {parsedPreview.setLengths.length ? (
                parsedPreview.setLengths.map((item) => (
                  <span
                    key={`set-length-${item}`}
                    className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700 border border-gray-200"
                  >
                    {item}
                  </span>
                ))
              ) : (
                <span className="text-sm text-gray-400">No set lengths added</span>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              What’s included
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {parsedPreview.whatsIncluded.length ? (
                parsedPreview.whatsIncluded.map((item, index) => (
                  <span
                    key={`included-${item}-${index}`}
                    className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700 border border-gray-200"
                  >
                    {item}
                  </span>
                ))
              ) : (
                <span className="text-sm text-gray-400">No inclusions added</span>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Claimable expenses
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {parsedPreview.claimableExpenses.length ? (
                parsedPreview.claimableExpenses.map((item, index) => (
                  <span
                    key={`expense-${item}-${index}`}
                    className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700 border border-gray-200"
                  >
                    {item}
                  </span>
                ))
              ) : (
                <span className="text-sm text-gray-400">No claimable expenses added</span>
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
  disabled={isSubmitting || submittingAction === "create"}
  className="inline-flex items-center rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-[#ff6667] disabled:cursor-not-allowed disabled:opacity-60"
>
{submittingAction === "create"
  ? "Creating…"
  : showEnquiryOption && isEnquiryJob
  ? "Create enquiry post"
  : "Create and notify"}
</button>
      </div>
    </form>
  );
};

export default DeputyJobCreateForm;