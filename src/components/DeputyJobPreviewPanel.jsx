import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import DeputyJobApplyButton from "./DeputyJobApplyButton";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";

const ADMIN_EMAIL = "hello@thesupremecollective.co.uk";
const BACKEND_BASE = (import.meta.env.VITE_BACKEND_URL || "").replace(
  /\/+$/,
  "",
);
const PAYMENT_SETUP_STORAGE_KEY = "deputyJobPaymentSetup";
const STRIPE_PUBLISHABLE_KEY = String(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "",
).trim();
const stripePromise = STRIPE_PUBLISHABLE_KEY
  ? loadStripe(STRIPE_PUBLISHABLE_KEY)
  : null;

const formatMoney = (value) => {
  const n = Number(value || 0);
  return `£${n.toLocaleString("en-GB", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};

const getDisplayFee = (job = {}) => {
  const commissionAmount = Number(job?.commissionAmount || 0);
  const deputyNetAmount = Number(job?.deputyNetAmount || 0);
  const grossAmount = Number(job?.grossAmount || job?.fee || 0);

  if (commissionAmount > 0) {
    return deputyNetAmount > 0
      ? deputyNetAmount
      : Math.max(grossAmount - commissionAmount, 0);
  }

  if (deputyNetAmount > 0) return deputyNetAmount;
  return grossAmount;
};

const formatDate = (value) => {
  if (!value) return "TBC";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const formatDateTime = (value) => {
  if (!value) return "TBC";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const paymentStatusClassMap = {
  not_started: "bg-gray-100 text-gray-700 border-gray-200",
  setup_required: "bg-amber-100 text-amber-800 border-amber-200",
  setup_pending: "bg-blue-100 text-blue-700 border-blue-200",
  ready_to_charge: "bg-emerald-100 text-emerald-700 border-emerald-200",
  charge_pending: "bg-blue-100 text-blue-700 border-blue-200",
  paid: "bg-green-100 text-green-700 border-green-200",
  failed: "bg-red-100 text-red-700 border-red-200",
  refunded: "bg-purple-100 text-purple-700 border-purple-200",
  cancelled: "bg-gray-100 text-gray-700 border-gray-200",
  not_required: "bg-blue-100 text-blue-700 border-blue-200",
};

const payoutStatusClassMap = {
  not_ready: "bg-gray-100 text-gray-700 border-gray-200",
  scheduled: "bg-blue-100 text-blue-700 border-blue-200",
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  paid: "bg-green-100 text-green-700 border-green-200",
  held: "bg-orange-100 text-orange-700 border-orange-200",
  cancelled: "bg-gray-100 text-gray-700 border-gray-200",
};

const jobStatusClassMap = {
  open: "bg-green-100 text-green-700 border-green-200",
  preview: "bg-amber-100 text-amber-700 border-amber-200",
  allocated: "bg-orange-100 text-orange-700 border-orange-200",
  filled: "bg-gray-100 text-gray-600 border-gray-200",
  closed: "bg-gray-100 text-gray-600 border-gray-200",
  cancelled: "bg-gray-100 text-gray-600 border-gray-200",
};

const getJobStatusLabel = (status = "") => {
  const safeStatus = String(status || "").toLowerCase();

  if (safeStatus === "allocated") return "Allocated";
  if (safeStatus === "filled") return "Filled";
  if (safeStatus === "closed") return "Closed";
  if (safeStatus === "cancelled") return "Cancelled";
  if (safeStatus === "preview") return "Preview";
  return "Open";
};

const formatLabel = (value = "") =>
  String(value)
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const normaliseArray = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string" && value.trim()) {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

const getPostedByLabel = (job) => {
  const createdByEmail = String(job?.createdByEmail || "")
    .trim()
    .toLowerCase();
  if (createdByEmail === "hello@thesupremecollective.co.uk") {
    return "The Supreme Collective";
  }
  return "A Supreme Collective Member";
};

const DeputyJobCardSetupForm = ({
  job,
  clientSecret,
  authHeaders = {},
  onSaved,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveCard = async (event) => {
    event.preventDefault();
    if (!stripe || !elements || !job?._id || !clientSecret) return;

    try {
      setIsSaving(true);

      const { error, setupIntent } = await stripe.confirmSetup({
        elements,
        confirmParams: {},
        redirect: "if_required",
      });

      if (error) {
        throw new Error(error.message || "Failed to confirm card setup");
      }

      if (!setupIntent?.id) {
        throw new Error("No SetupIntent returned from Stripe");
      }

      const { data } = await axios.post(
        `${BACKEND_BASE}/api/deputy-jobs/${job._id}/save-payment-method`,
        {
          setupIntentId: setupIntent.id,
          clientName: job.clientName || "",
          clientEmail: job.clientEmail || "",
          clientPhone: job.clientPhone || "",
        },
        {
          headers: authHeaders,
          withCredentials: true,
        },
      );

      if (!data?.success) {
        throw new Error(data?.message || "Failed to save payment method");
      }

      toast.success("Payment card saved successfully.");
      onSaved?.(data.job);
    } catch (error) {
      console.error("❌ Failed to save deputy job payment method:", error);
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to save payment card.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSaveCard}
      className="mt-4 rounded-2xl border border-gray-200 bg-white p-4"
    >
      <h4 className="text-sm font-semibold text-gray-900">Save payment card</h4>
      <p className="mt-1 text-xs text-gray-500">
        Enter the payment card details below and save them for off-session
        charging.
      </p>

      <div className="mt-4">
        <PaymentElement />
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          disabled={!stripe || !elements || !clientSecret || isSaving}
          className="rounded bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-[#ff6667] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? "Saving card…" : "Save payment card"}
        </button>
      </div>
    </form>
  );
};

const DeputyJobPreviewPanel = ({
  hoveredJob,
  currentUser,
  onApply,
  onCloseJob,
  onRefresh,
  loadingApply = false,
  loadingClose = false,
  authHeaders = {},
}) => {
  const navigate = useNavigate();
  const [isPreparingPaymentSetup, setIsPreparingPaymentSetup] = useState(false);
  const [isChargingJob, setIsChargingJob] = useState(false);
  const [paymentSetupInfo, setPaymentSetupInfo] = useState(null);
  const [isManualAllocating, setIsManualAllocating] = useState(false);
  const [showManualAllocateModal, setShowManualAllocateModal] = useState(false);
  const [manualAllocateQuery, setManualAllocateQuery] = useState("");
  const [manualAllocateResults, setManualAllocateResults] = useState([]);
  const [isSearchingMusicians, setIsSearchingMusicians] = useState(false);

  const job = hoveredJob?.job || hoveredJob || null;

  const currentUserEmail = String(currentUser?.email || "")
    .toLowerCase()
    .trim();

  const isAdmin = currentUserEmail === ADMIN_EMAIL;

  const isCreator = useMemo(() => {
    if (!job || !currentUser) return false;

    const currentUserId = String(currentUser?._id || currentUser?.id || "");
    const createdBy = String(job?.createdBy || "");
    const createdByEmail = String(job?.createdByEmail || "")
      .toLowerCase()
      .trim();

    return (
      isAdmin ||
      (currentUserId && currentUserId === createdBy) ||
      (currentUserEmail && currentUserEmail === createdByEmail)
    );
  }, [job, currentUser, currentUserEmail, isAdmin]);

  const currentUserRole = String(currentUser?.role || "")
    .toLowerCase()
    .trim();

  const canAdminManage =
    currentUserEmail === ADMIN_EMAIL ||
    currentUserRole === "admin" ||
    currentUserRole === "agent";

  const canManage = canAdminManage || isCreator;
  const canManualAllocate = canAdminManage;
  const canViewPayments = canAdminManage;

  const requiredInstruments = normaliseArray(job?.requiredInstruments);
  const requiredSkills = normaliseArray(job?.requiredSkills);
  const tags = normaliseArray(job?.tags);
  const applicantsCount = Array.isArray(job?.applications)
    ? job.applications.length
    : Number(job?.applicationsCount || 0);
  const postedByLabel = getPostedByLabel(job);
  const venueDisplay =
    job?.venue || job?.locationName || job?.location || "TBC";
  const locationDisplay =
    job?.location || job?.locationName || job?.venue || "TBC";
  const paymentStatus = String(
    job?.paymentStatus || "not_started",
  ).toLowerCase();
  const payoutStatus = String(job?.payoutStatus || "not_ready").toLowerCase();
  const jobStatus = String(job?.status || "open").toLowerCase();
  const isEnquiryJob = String(job?.jobType || "").toLowerCase() === "enquiry";
  const displayFee = getDisplayFee(job);
  const paymentEvents = Array.isArray(job?.paymentEvents)
    ? job.paymentEvents
    : [];
  const latestPaymentEvent = paymentEvents.length
    ? paymentEvents[paymentEvents.length - 1]
    : null;

  const canPreparePaymentSetup =
    !isEnquiryJob &&
    canManage &&
    Boolean(job?.clientEmail) &&
    !job?.defaultPaymentMethodId &&
    !paymentSetupInfo?.clientSecret &&
    !job?.setupIntentId;

  const canChargeNow =
    !isEnquiryJob &&
    canManage &&
    Boolean(job?.stripeCustomerId) &&
    Boolean(job?.defaultPaymentMethodId) &&
    paymentStatus !== "paid" &&
    paymentStatus !== "charge_pending";

  useEffect(() => {
    if (!job?._id) {
      setPaymentSetupInfo(null);
      return;
    }

    try {
      const saved = sessionStorage.getItem(PAYMENT_SETUP_STORAGE_KEY);
      if (!saved) {
        setPaymentSetupInfo(null);
        return;
      }

      const parsed = JSON.parse(saved);
      if (
        parsed?.deputyJobId &&
        String(parsed.deputyJobId) === String(job._id) &&
        parsed?.clientSecret
      ) {
        setPaymentSetupInfo(parsed);
        return;
      }
    } catch {
      // ignore storage parse issues
    }

    setPaymentSetupInfo(null);
  }, [job?._id]);

  const formatShortName = (name = "") => {
    const parts = String(name).trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "";
    const firstName = parts[0];
    const lastName = parts.length > 1 ? parts[parts.length - 1] : "";
    const lastInitial = lastName ? `${lastName[0].toUpperCase()}.` : "";
    return [firstName, lastInitial].filter(Boolean).join(" ");
  };

  const handlePreparePaymentSetup = async () => {
    if (!job?._id || !canPreparePaymentSetup || isPreparingPaymentSetup) return;

    try {
      setIsPreparingPaymentSetup(true);

      const { data } = await axios.post(
        `${BACKEND_BASE}/api/deputy-jobs/${job._id}/create-setup-intent`,
        {
          clientName: job.clientName || "",
          clientEmail: job.clientEmail || "",
          clientPhone: job.clientPhone || "",
        },
        {
          headers: authHeaders,
          withCredentials: true,
        },
      );

      if (!data?.success) {
        throw new Error(data?.message || "Failed to prepare payment setup");
      }

      const nextSetupInfo = {
        deputyJobId: String(job._id || ""),
        setupIntentId: data?.setupIntentId || "",
        clientSecret: data?.clientSecret || "",
        stripeCustomerId: data?.stripeCustomerId || "",
      };

      setPaymentSetupInfo(nextSetupInfo);

      try {
        sessionStorage.setItem(
          PAYMENT_SETUP_STORAGE_KEY,
          JSON.stringify(nextSetupInfo),
        );
      } catch {
        // ignore storage errors
      }

      toast.success(
        "Payment setup prepared. The next step is connecting the card form.",
      );
      onRefresh?.(job);
    } catch (error) {
      console.error("❌ Failed to prepare deputy job payment setup:", error);
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to prepare deputy job payment setup.",
      );
    } finally {
      setIsPreparingPaymentSetup(false);
    }
  };

  const handleChargeNow = async () => {
    if (!job?._id || !canChargeNow || isChargingJob) return;

    try {
      setIsChargingJob(true);

      const { data } = await axios.post(
        `${BACKEND_BASE}/api/deputy-jobs/${job._id}/charge`,
        {},
        {
          headers: authHeaders,
          withCredentials: true,
        },
      );

      if (!data?.success) {
        throw new Error(data?.message || "Failed to charge deputy job");
      }

      toast.success("Deputy job charged successfully.");
      onRefresh?.(job);
    } catch (error) {
      console.error("❌ Failed to charge deputy job:", error);
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to charge deputy job.",
      );
    } finally {
      setIsChargingJob(false);
    }
  };

  const handleCardSaved = () => {
    try {
      sessionStorage.removeItem(PAYMENT_SETUP_STORAGE_KEY);
    } catch {
      // ignore storage errors
    }

    setPaymentSetupInfo(null);
    onRefresh?.(job);
  };

  const getMusicianDisplayName = (musician = {}) => {
    return (
      [
        musician?.firstName || musician?.basicInfo?.firstName || "",
        musician?.lastName || musician?.basicInfo?.lastName || "",
      ]
        .filter(Boolean)
        .join(" ")
        .trim() ||
      musician?.name ||
      musician?.email ||
      "this musician"
    );
  };

  const openManualAllocateModal = () => {
    setManualAllocateQuery("");
    setManualAllocateResults([]);
    setShowManualAllocateModal(true);
  };

  const handleOpenManualAllocateModal = (event) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();

    if (!canManualAllocate) {
      toast.error("Only admin or agent users can manually allocate musicians.");
      return;
    }

    openManualAllocateModal();
  };

  const handleManualAllocateSearch = async (event) => {
    event?.preventDefault?.();

    const query = String(manualAllocateQuery || "").trim();

    if (!query) {
      toast.error("Search for a musician by name, email, instrument or phone.");
      return;
    }

    try {
      setIsSearchingMusicians(true);

      const { data } = await axios.get(`${BACKEND_BASE}/api/musician/search`, {
        params: { query },
        headers: authHeaders,
        withCredentials: true,
      });

      const results = Array.isArray(data?.musicians)
        ? data.musicians
        : Array.isArray(data?.results)
          ? data.results
          : Array.isArray(data?.data)
            ? data.data
            : [];

      setManualAllocateResults(results);

      if (!results.length) {
        toast.info("No musicians found for that search.");
      }
    } catch (error) {
      console.error("❌ Failed to search musicians:", error);
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to search musicians.",
      );
    } finally {
      setIsSearchingMusicians(false);
    }
  };

  const handleManualAllocate = async (selectedMusician) => {
    const selectedMusicianId = String(
      selectedMusician?._id ||
        selectedMusician?.musicianId ||
        selectedMusician?.id ||
        "",
    ).trim();

    if (!selectedMusicianId) {
      openManualAllocateModal();
      return;
    }

    if (!job?._id || isManualAllocating) return;

    const musicianName = getMusicianDisplayName(selectedMusician);

    const confirmed = window.confirm(
      `Manually allocate "${job.title || "Untitled job"}" to ${musicianName}?`,
    );

    if (!confirmed) return;

    try {
      setIsManualAllocating(true);

      const { data } = await axios.post(
        `${BACKEND_BASE}/api/deputy-jobs/${job._id}/manual-allocate`,
        {
          musicianId: selectedMusicianId,
        },
        {
          headers: authHeaders,
          withCredentials: true,
        },
      );

      if (!data?.success) {
        throw new Error(
          data?.message || "Failed to manually allocate deputy job",
        );
      }

      toast.success(`Allocated to ${musicianName}`);
      setShowManualAllocateModal(false);
      setManualAllocateQuery("");
      setManualAllocateResults([]);
      onRefresh?.(job);
    } catch (error) {
      console.error("❌ Failed to manually allocate deputy:", error);
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to manually allocate deputy",
      );
    } finally {
      setIsManualAllocating(false);
    }
  };

  if (!job) {
    return (
      <div className="w-full min-h-screen border-l p-6">
        <p className="mt-20 text-center text-gray-500">
          Hover over a deputy job to preview the details
        </p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen border-l p-6">
      <div className="sticky top-0 pb-4">
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4 border-b border-gray-200 pb-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-gray-400">
                Deputy opportunity
              </p>
              <h2 className="mt-2 text-3xl font-semibold text-gray-900">
                {job.title || "Untitled opportunity"}
              </h2>
              <div className="mt-3 flex flex-wrap gap-2 text-sm text-gray-600">
                <span className="rounded-full bg-gray-100 px-3 py-1">
                  {formatDate(job.date || job.eventDate)}
                </span>
                {job.callTime || job.startTime ? (
                  <span className="rounded-full bg-gray-100 px-3 py-1">
                    Call: {job.callTime || job.startTime}
                  </span>
                ) : null}
                {job.finishTime || job.endTime ? (
                  <span className="rounded-full bg-gray-100 px-3 py-1">
                    Finish: {job.finishTime || job.endTime}
                  </span>
                ) : null}
                <span
                  className={`rounded-full border px-3 py-1 ${
                    jobStatusClassMap[jobStatus] ||
                    "bg-gray-100 text-gray-700 border-gray-200"
                  }`}
                >
                  {getJobStatusLabel(jobStatus)}
                </span>
                {isEnquiryJob ? (
                  <span className="rounded-full border border-blue-200 bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                    Enquiry only
                  </span>
                ) : null}
              </div>
            </div>

            <div className="text-right">
              <p className="text-sm text-gray-500">Fee</p>
              <p className="text-3xl font-semibold text-gray-900">
                {formatMoney(displayFee)}
              </p>
              {Number(job?.commissionAmount || 0) > 0 ? (
                <p className="mt-2 text-sm text-gray-500">
                  Net fee after commission
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6 py-6">
        <section>
          <h3 className="mb-3 text-lg font-semibold text-gray-900">Overview</h3>
          <div className="space-y-2 text-gray-600">
            <p>
              <span className="font-medium text-gray-900">Venue:</span>{" "}
              {venueDisplay}
            </p>
            <p>
              <span className="font-medium text-gray-900">Location:</span>{" "}
              {locationDisplay}
            </p>
            <p>
              <span className="font-medium text-gray-900">Posted by:</span>{" "}
              {postedByLabel}
            </p>
            <p>
              <span className="font-medium text-gray-900">Applications:</span>{" "}
              {applicantsCount}
            </p>
            {job.allocatedMusicianName || job.assignedMusicianName ? (
  <p>
    <span className="font-medium text-gray-900">Allocated to:</span>{" "}
    {(() => {
      const musicianName = formatShortName(
        job.allocatedMusicianName || job.assignedMusicianName,
      );

      const musicianSlug =
        job?.allocatedMusicianSlug ||
        job?.assignedMusicianSlug ||
        "";

      const musicianId =
        job?.allocatedMusicianId ||
        job?.assignedMusicianId ||
        "";

      const musicianHref = musicianSlug
        ? `/musician/${encodeURIComponent(musicianSlug)}`
        : musicianId
          ? `/musician/${encodeURIComponent(musicianId)}`
          : "";

      return musicianHref ? (
        <Link
          to={musicianHref}
          className="text-[#ff6667] hover:underline"
        >
          {musicianName}
        </Link>
      ) : (
        musicianName
      );
    })()}
  </p>
) : null}
          </div>
        </section>

        {!!requiredInstruments.length && (
          <section>
            <h3 className="mb-3 text-lg font-semibold text-gray-900">
              Required instruments
            </h3>
            <div className="flex flex-wrap gap-2">
              {requiredInstruments.map((item) => (
                <span
                  key={`instrument-${item}`}
                  className="rounded-full bg-black px-3 py-1 text-sm text-white"
                >
                  {formatLabel(item)}
                </span>
              ))}
            </div>
          </section>
        )}

        {!!requiredSkills.length && (
          <section>
            <h3 className="mb-3 text-lg font-semibold text-gray-900">
              Required skills
            </h3>
            <div className="flex flex-wrap gap-2">
              {requiredSkills.map((item) => (
                <span
                  key={`skill-${item}`}
                  className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700"
                >
                  {formatLabel(item)}
                </span>
              ))}
            </div>
          </section>
        )}

        {!!tags.length && (
          <section>
            <h3 className="mb-3 text-lg font-semibold text-gray-900">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {tags.map((item) => (
                <span
                  key={`tag-${item}`}
                  className="rounded-full border border-gray-200 px-3 py-1 text-sm text-gray-600"
                >
                  {formatLabel(item)}
                </span>
              ))}
            </div>
          </section>
        )}

        {job.notes ? (
          <section>
            <h3 className="mb-3 text-lg font-semibold text-gray-900">Notes</h3>
            <div className="rounded-2xl bg-gray-50 p-4 text-gray-600 whitespace-pre-wrap">
              {job.notes}
            </div>
          </section>
        ) : null}

        {canViewPayments && !isEnquiryJob ? (
          <section>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Payment & payout
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Track card setup, charge status, ledger amounts, and when
                    the deputy payout should be released.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${
                      paymentStatusClassMap[paymentStatus] ||
                      paymentStatusClassMap.not_started
                    }`}
                  >
                    Payment: {formatLabel(paymentStatus)}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${
                      payoutStatusClassMap[payoutStatus] ||
                      payoutStatusClassMap.not_ready
                    }`}
                  >
                    Payout: {formatLabel(payoutStatus)}
                  </span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Gross amount
                  </p>
                  <p className="mt-2 text-lg font-semibold text-gray-900">
                    {formatMoney(job.grossAmount || job.fee || 0)}
                  </p>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Commission
                  </p>
                  <p className="mt-2 text-lg font-semibold text-gray-900">
                    {formatMoney(job.commissionAmount || 0)}
                  </p>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Deputy net
                  </p>
                  <p className="mt-2 text-lg font-semibold text-gray-900">
                    {formatMoney(job.deputyNetAmount || job.fee || 0)}
                  </p>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Payment release on
                  </p>
                  <p className="mt-2 text-lg font-semibold text-gray-900">
                    {job.releaseOn ? formatDate(job.releaseOn) : "TBC"}
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-2 text-sm text-gray-600">
                <p>
                  <span className="font-medium text-gray-900">
                    Stripe customer:
                  </span>{" "}
                  {job.stripeCustomerId || "Not created yet"}
                </p>
                <p>
                  <span className="font-medium text-gray-900">
                    Saved payment method:
                  </span>{" "}
                  {job.defaultPaymentMethodId || "Not saved yet"}
                </p>
                <p>
                  <span className="font-medium text-gray-900">Charged at:</span>{" "}
                  {job.chargedAt
                    ? formatDateTime(job.chargedAt)
                    : "Not charged yet"}
                </p>
                <p>
                  <span className="font-medium text-gray-900">
                    Latest payment event:
                  </span>{" "}
                  {latestPaymentEvent
                    ? `${formatLabel(latestPaymentEvent.type || "manual_adjustment")} • ${formatDateTime(latestPaymentEvent.createdAt)}`
                    : "No payment events yet"}
                </p>
                {job.paymentFailureReason ? (
                  <p className="text-red-600">
                    <span className="font-medium text-red-700">
                      Failure reason:
                    </span>{" "}
                    {job.paymentFailureReason}
                  </p>
                ) : null}
              </div>

              {paymentSetupInfo?.clientSecret ? (
                STRIPE_PUBLISHABLE_KEY && stripePromise ? (
                  <Elements
                    stripe={stripePromise}
                    options={{ clientSecret: paymentSetupInfo.clientSecret }}
                  >
                    <DeputyJobCardSetupForm
                      job={job}
                      clientSecret={paymentSetupInfo.clientSecret}
                      authHeaders={authHeaders}
                      onSaved={handleCardSaved}
                    />
                  </Elements>
                ) : (
                  <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
                    Stripe card form is unavailable because{" "}
                    <strong>VITE_STRIPE_PUBLISHABLE_KEY</strong> is missing in
                    the frontend environment.
                  </div>
                )
              ) : null}

              <div className="mt-5 flex flex-wrap gap-3">
                {canPreparePaymentSetup ? (
                  <button
                    type="button"
                    onClick={handlePreparePaymentSetup}
                    disabled={isPreparingPaymentSetup}
                    className="rounded border border-gray-300 bg-white px-5 py-3 text-sm font-medium text-gray-800 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isPreparingPaymentSetup
                      ? "Preparing payment setup…"
                      : "Prepare payment setup"}
                  </button>
                ) : null}

                {canChargeNow ? (
                  <button
                    type="button"
                    onClick={handleChargeNow}
                    disabled={isChargingJob}
                    className="rounded border border-gray-300 bg-white px-5 py-3 text-sm font-medium text-gray-800 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isChargingJob ? "Charging…" : "Charge now"}
                  </button>
                ) : null}
              </div>
            </div>
          </section>
        ) : null}

        <section>
          <div className="flex flex-wrap items-center gap-3">
            <DeputyJobApplyButton
              job={job}
              onApply={onApply}
              loading={loadingApply}
            />

            {canManage ? (
              <button
                type="button"
                onClick={() => navigate(`/deputy-jobs/${job._id}/applications`)}
                className="rounded bg-gray-100 px-5 py-3 text-sm font-medium text-gray-800 transition hover:bg-gray-200"
              >
                Manage applications ({applicantsCount})
              </button>
            ) : null}

            {canManualAllocate ? (
              <button
                type="button"
                onClick={handleOpenManualAllocateModal}
                className="rounded border border-gray-300 bg-white px-5 py-3 text-sm font-medium text-gray-800 transition hover:bg-gray-100"
              >
                Manual allocate musician
              </button>
            ) : null}

            {canManage && job.status === "open" ? (
              <button
                type="button"
                onClick={() => onCloseJob?.(job)}
                disabled={loadingClose}
                className="rounded border border-red-200 px-5 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loadingClose ? "Closing..." : "Close job"}
              </button>
            ) : null}
          </div>
        </section>
      </div>

      {showManualAllocateModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Manual allocate musician
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Search for a musician, then choose who should receive the
                  allocation request for this job.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowManualAllocateModal(false)}
                className="rounded-full border border-gray-200 px-3 py-1 text-sm text-gray-500 hover:border-gray-400 hover:text-gray-800"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleManualAllocateSearch}
              className="mt-5 flex gap-3"
            >
              <input
                type="text"
                value={manualAllocateQuery}
                onChange={(event) => setManualAllocateQuery(event.target.value)}
                className="min-w-0 flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black"
                placeholder="Search by name, email, phone, instrument..."
              />
              <button
                type="submit"
                disabled={isSearchingMusicians}
                className="rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-[#ff6667] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSearchingMusicians ? "Searching…" : "Search"}
              </button>
            </form>

            <div className="mt-5 max-h-96 overflow-y-auto rounded-2xl border border-gray-200">
              {manualAllocateResults.length ? (
                manualAllocateResults.map((musician) => {
                  const musicianId = String(
                    musician?._id || musician?.id || musician?.musicianId || "",
                  ).trim();
                  const name = getMusicianDisplayName(musician);
                  const email =
                    musician?.email || musician?.basicInfo?.email || "";
                  const phone =
                    musician?.phone ||
                    musician?.phoneNumber ||
                    musician?.basicInfo?.phone ||
                    "";
                  const profileImage =
                    musician?.profilePhoto ||
                    musician?.profilePicture ||
                    musician?.profileImage ||
                    musician?.photoUrl ||
                    "";
                  const instruments = Array.isArray(musician?.instrumentation)
                    ? musician.instrumentation
                    : Array.isArray(musician?.instruments)
                      ? musician.instruments
                      : [];

                  return (
                    <div
                      key={musicianId || email || name}
                      className="flex items-center justify-between gap-4 border-b border-gray-100 p-4 last:border-b-0"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        {profileImage ? (
                          <img
                            src={profileImage}
                            alt={name}
                            className="h-11 w-11 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-500">
                            {name.charAt(0).toUpperCase() || "M"}
                          </div>
                        )}

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-gray-900">
                            {name}
                          </p>
                          <p className="truncate text-xs text-gray-500">
                            {[email, phone].filter(Boolean).join(" • ") ||
                              "No contact details shown"}
                          </p>
                          {instruments.length ? (
                            <p className="mt-1 truncate text-xs text-gray-400">
                              {instruments
                                .map((item) =>
                                  typeof item === "string"
                                    ? item
                                    : item?.instrument || item?.name || "",
                                )
                                .filter(Boolean)
                                .join(", ")}
                            </p>
                          ) : null}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleManualAllocate(musician)}
                        disabled={!musicianId || isManualAllocating}
                        className="shrink-0 rounded-full bg-black px-4 py-2 text-sm font-medium text-white hover:bg-[#ff6667] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isManualAllocating ? "Allocating…" : "Allocate"}
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="p-6 text-center text-sm text-gray-500">
                  Search for a musician to allocate manually.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default DeputyJobPreviewPanel;