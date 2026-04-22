import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { backendUrl } from "../App";

const parseJwtPayload = (token = "") => {
  try {
    const payload = String(token || "").split(".")[1] || "";
    if (!payload) return {};

    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const decoded = atob(padded);
    return JSON.parse(decoded);
  } catch {
    return {};
  }
};

const normaliseString = (value) => String(value || "").trim();

const toArray = (value) => (Array.isArray(value) ? value.filter(Boolean) : []);

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

const formatLabel = (value, fallback = "—") => {
  const text = normaliseString(value);
  if (!text) return fallback;

  return text
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const formatDateLong = (value) => {
  if (!value) return "TBC";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return normaliseString(value) || "TBC";

  const weekday = date.toLocaleDateString("en-GB", { weekday: "long" });
  const day = date.getDate();
  const month = date.toLocaleDateString("en-GB", { month: "long" });
  const year = date.getFullYear();

  const getOrdinal = (n) => {
    if (n >= 11 && n <= 13) return "th";
    const last = n % 10;
    if (last === 1) return "st";
    if (last === 2) return "nd";
    if (last === 3) return "rd";
    return "th";
  };

  return `${weekday}, ${day}${getOrdinal(day)} ${month} ${year}`;
};

const formatMoney = (value, currency = "GBP") => {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount)) return "TBC";

  const safeCurrency = String(currency || "GBP").trim().toUpperCase() || "GBP";

  if (safeCurrency === "GBP" || safeCurrency === "£") {
    return `£${amount.toFixed(2).replace(/\.00$/, "")}`;
  }

  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: safeCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
      .format(amount)
      .replace(/\.00$/, "");
  } catch {
    return `${safeCurrency} ${amount.toFixed(2)}`;
  }
};

const formatDateTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return normaliseString(value) || "—";
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const statusToneMap = {
  open: "default",
  preview: "yellow",
  allocated: "yellow",
  filled: "green",
  closed: "red",
  cancelled: "red",
};

const getStatusLabel = (value, fallback = "—") => {
  const status = normaliseString(value).toLowerCase();
  if (!status) return fallback;

  if (status === "allocated") return "Allocation Requested";
  if (status === "filled") return "Filled";
  if (status === "closed") return "Closed";
  if (status === "cancelled") return "Cancelled";
  if (status === "preview") return "Preview";
  if (status === "open") return "Open";

  return formatLabel(status, fallback);
};

const getStoredUserEmail = () => {
  const possibleKeys = ["user", "admin", "musician", "profile", "currentUser"];

  for (const key of possibleKeys) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      const email = normaliseString(parsed?.email).toLowerCase();
      if (email) return email;
    } catch {
      // ignore malformed values
    }
  }

  const directEmail =
    normaliseString(localStorage.getItem("email")) ||
    normaliseString(localStorage.getItem("userEmail")) ||
    normaliseString(localStorage.getItem("adminEmail")) ||
    normaliseString(localStorage.getItem("musicianEmail"));

  return directEmail.toLowerCase();
};

const maskEmail = (value) => {
  const email = normaliseString(value);
  if (!email || !email.includes("@")) return "";

  const [localPart, domain] = email.split("@");
  const safeLocal =
    localPart.length <= 2
      ? `${localPart.charAt(0) || ""}*`
      : `${localPart.slice(0, 2)}${"*".repeat(Math.max(localPart.length - 2, 1))}`;

  return `${safeLocal}@${domain}`;
};

const DetailRow = ({ label, value }) => (
  <div className="grid grid-cols-1 gap-1 border-b border-gray-100 py-3 md:grid-cols-[180px_1fr]">
    <div className="text-sm font-medium text-gray-500">{label}</div>
    <div className="break-words text-sm text-gray-900">{value || "—"}</div>
  </div>
);

const Badge = ({ children, tone = "default" }) => {
  const toneClass =
    tone === "green"
      ? "bg-green-100 text-green-800"
      : tone === "yellow"
      ? "bg-yellow-100 text-yellow-800"
      : tone === "red"
      ? "bg-red-100 text-red-800"
      : "bg-gray-100 text-gray-800";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${toneClass}`}
    >
      {children}
    </span>
  );
};

const INITIAL_MATCHED_VISIBLE = 20;
const INITIAL_APPLICATIONS_VISIBLE = 20;
const INITIAL_NOTIFICATIONS_VISIBLE = 20;

const SectionToggleButton = ({ open, onClick, label, count }) => (
  <button
    type="button"
    onClick={onClick}
    className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:border-black hover:text-black"
  >
    <span>
      {open ? "Hide" : "Show"} {label}
    </span>
    {typeof count === "number" ? (
      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600">
        {count}
      </span>
    ) : null}
  </button>
);

const DeputyJobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [applying, setApplying] = useState(false);
  const [assigningId, setAssigningId] = useState("");
  const [presentingId, setPresentingId] = useState("");
  const [manualAllocating, setManualAllocating] = useState(false);
  const [manualAllocateOpen, setManualAllocateOpen] = useState(false);
  const [manualAllocateQuery, setManualAllocateQuery] = useState("");
  const [manualAllocateSelectedId, setManualAllocateSelectedId] = useState("");
  const [showMatchedMusicians, setShowMatchedMusicians] = useState(false);
  const [showApplications, setShowApplications] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [visibleMatchedCount, setVisibleMatchedCount] = useState(
    INITIAL_MATCHED_VISIBLE,
  );
  const [visibleApplicationsCount, setVisibleApplicationsCount] = useState(
    INITIAL_APPLICATIONS_VISIBLE,
  );
  const [visibleNotificationsCount, setVisibleNotificationsCount] = useState(
    INITIAL_NOTIFICATIONS_VISIBLE,
  );

  const adminToken = localStorage.getItem("adminToken") || "";
  const musicianToken = localStorage.getItem("musicianToken") || "";
  const generalToken = localStorage.getItem("token") || "";

  const token = generalToken || adminToken || musicianToken || "";
  const hasAnyUserToken = Boolean(token);

  const currentUser = useMemo(() => {
    const tokenPayload = parseJwtPayload(token);

    return {
      _id: tokenPayload?._id || tokenPayload?.id || tokenPayload?.userId || "",
      id: tokenPayload?.id || tokenPayload?._id || tokenPayload?.userId || "",
      email: String(
        tokenPayload?.email ||
          tokenPayload?.useremail ||
          localStorage.getItem("userEmail") ||
          sessionStorage.getItem("userEmail") ||
          "",
      )
        .trim()
        .toLowerCase(),
      role: String(
        tokenPayload?.role ||
          tokenPayload?.userrole ||
          localStorage.getItem("userRole") ||
          sessionStorage.getItem("userRole") ||
          "",
      )
        .trim()
        .toLowerCase(),
    };
  }, [token]);

  const headers = useMemo(
    () =>
      token
        ? {
            Authorization: `Bearer ${token}`,
            token,
          }
        : {},
    [token],
  );

  const loadJob = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const res = await axios.get(`${backendUrl}/api/deputy-jobs/${id}`, {
        headers,
        withCredentials: true,
      });

      if (!res.data?.success || !res.data?.job) {
        throw new Error(res.data?.message || "Failed to load deputy job");
      }

      setJob(res.data.job);
    } catch (err) {
      console.error("❌ Failed to load deputy job:", err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load deputy job",
      );
    } finally {
      setLoading(false);
    }
  }, [headers, id]);

  useEffect(() => {
    loadJob();
  }, [loadJob]);

  useEffect(() => {
    setVisibleMatchedCount(INITIAL_MATCHED_VISIBLE);
    setVisibleApplicationsCount(INITIAL_APPLICATIONS_VISIBLE);
    setVisibleNotificationsCount(INITIAL_NOTIFICATIONS_VISIBLE);
  }, [job?._id]);

  const currentUserEmail = useMemo(() => getStoredUserEmail(), []);
  const createdByEmail = normaliseString(job?.createdByEmail).toLowerCase();
  const managerEmail = normaliseString(
    job?.managerEmail || job?.createdBy?.email,
  ).toLowerCase();

  const isAdminViewer = Boolean(adminToken);
  const isJobManager = Boolean(
    currentUserEmail &&
      (currentUserEmail === createdByEmail || currentUserEmail === managerEmail),
  );

  const currentUserRole = String(currentUser?.role || "").trim().toLowerCase();
  const isAdminEmail =
    String(currentUserEmail || "").trim().toLowerCase() ===
    "hello@thesupremecollective.co.uk";

  const canManageThisJob = Boolean(
    isAdminEmail ||
      currentUserRole === "admin" ||
      currentUserRole === "agent" ||
      isJobManager,
  );

  const canSeeApplicationsSection = canManageThisJob;

  const shouldMaskApplicantNames = !(
    isAdminEmail ||
    currentUserRole === "admin" ||
    currentUserRole === "agent" ||
    Boolean(adminToken)
  );

  const getApplicantFullName = (application = {}) => {
    const firstName = String(application.firstName || "").trim();
    const lastName = String(application.lastName || "").trim();
    return `${firstName} ${lastName}`.trim() || "Unnamed applicant";
  };

  const getApplicantShortName = (application = {}) => {
    const firstName = String(application.firstName || "").trim();
    const lastName = String(application.lastName || "").trim();
    const lastInitial = lastName ? `${lastName.charAt(0).toUpperCase()}.` : "";
    return [firstName, lastInitial].filter(Boolean).join(" ") || "Unnamed applicant";
  };

  const handleManualAllocateClick = () => {
    if (!canManageThisJob) {
      toast.error("Manual allocate is not available here.");
      return;
    }

    setManualAllocateQuery("");
    setManualAllocateSelectedId("");
    setManualAllocateOpen(true);
  };

  const jobType = String(job?.jobType || job?.type || "").trim().toLowerCase();
  const isEnquiryJob =
    job?.isEnquiry === true ||
    job?.enquiryOnly === true ||
    jobType === "enquiry" ||
    String(job?.title || "").toLowerCase().includes("enquiry");

  const canViewMatchedMusicians = isAdminViewer;
  const canViewNotifications = isAdminViewer;

  const applications = useMemo(() => toArray(job?.applications), [job?.applications]);

  const applicationEmails = applications
    .map((application) => normaliseString(application?.email).toLowerCase())
    .filter(Boolean);

  const hasApplied = Boolean(
    currentUserEmail && applicationEmails.includes(currentUserEmail),
  );

  const canApplyToJob = Boolean(
    !isAdminViewer &&
      hasAnyUserToken &&
      job &&
      !hasApplied &&
      !isJobManager &&
      !["allocated", "filled", "closed", "cancelled"].includes(
        normaliseString(job?.status).toLowerCase(),
      ),
  );

  const matchedMusicians = useMemo(
    () => toArray(job?.matchedMusicians),
    [job?.matchedMusicians],
  );

  const notifications = useMemo(
    () => toArray(job?.notifications),
    [job?.notifications],
  );

  const visibleMatchedMusicians = useMemo(
    () => matchedMusicians.slice(0, visibleMatchedCount),
    [matchedMusicians, visibleMatchedCount],
  );

  const visibleApplications = useMemo(
    () => applications.slice(0, visibleApplicationsCount),
    [applications, visibleApplicationsCount],
  );

  const visibleNotifications = useMemo(
    () => notifications.slice(0, visibleNotificationsCount),
    [notifications, visibleNotificationsCount],
  );

  const manualAllocateCandidates = useMemo(() => {
    const list = [];

    const pushCandidate = (candidate = {}) => {
      const musicianId = String(
        candidate?.musicianId || candidate?._id || candidate?.id || "",
      ).trim();

      if (!musicianId) return;
      if (list.some((item) => String(item.musicianId) === musicianId)) return;

      list.push({
        musicianId,
        firstName: String(candidate?.firstName || "").trim(),
        lastName: String(candidate?.lastName || "").trim(),
        email: String(candidate?.email || "").trim(),
        phone: String(candidate?.phone || candidate?.phoneNumber || "").trim(),
      });
    };

    matchedMusicians.forEach((m) => {
      pushCandidate({
        musicianId: m?.musicianId || m?._id,
        firstName: m?.firstName,
        lastName: m?.lastName,
        email: m?.email,
        phone: m?.phone || m?.phoneNumber,
      });
    });

    applications.forEach((a) => {
      pushCandidate({
        musicianId: a?.musicianId,
        firstName: a?.firstName,
        lastName: a?.lastName,
        email: a?.email,
        phone: a?.phone,
      });
    });

    return list;
  }, [applications, matchedMusicians]);

  const filteredManualAllocateCandidates = useMemo(() => {
    const q = String(manualAllocateQuery || "").trim().toLowerCase();
    if (!q) return manualAllocateCandidates;

    return manualAllocateCandidates.filter((m) => {
      const haystack = [
        m.firstName,
        m.lastName,
        m.email,
        m.phone,
        m.musicianId,
      ]
        .map((v) => String(v || "").toLowerCase())
        .join(" ");

      return haystack.includes(q);
    });
  }, [manualAllocateCandidates, manualAllocateQuery]);

  const isValidObjectId = (value = "") =>
    /^[a-f\d]{24}$/i.test(String(value || "").trim());

  const getCandidateDisplayName = (candidate = {}) => {
    const firstName = String(candidate?.firstName || "").trim();
    const lastName = String(candidate?.lastName || "").trim();

    if (!shouldMaskApplicantNames) {
      return `${firstName} ${lastName}`.trim() || "Unnamed musician";
    }

    const lastInitial = lastName ? `${lastName.charAt(0).toUpperCase()}.` : "";
    return [firstName, lastInitial].filter(Boolean).join(" ") || "Unnamed musician";
  };

  const submitManualAllocate = useCallback(async () => {
    if (!canManageThisJob) {
      toast.error("Manual allocate is not available here.");
      return;
    }

    const musicianId = String(manualAllocateSelectedId || "").trim();

    if (!isValidObjectId(musicianId)) {
      toast.error(
        "Please select a musician (or enter a valid 24-character musicianId).",
      );
      return;
    }

    const confirmed = window.confirm(
      `Manually allocate this job to musicianId: ${musicianId}?`,
    );
    if (!confirmed) return;

    try {
      setManualAllocating(true);

      const res = await axios.post(
        `${backendUrl}/api/deputy-jobs/${id}/manual-allocate`,
        { musicianId },
        { headers, withCredentials: true },
      );

      if (!res.data?.success) {
        throw new Error(
          res.data?.message || "Failed to manually allocate musician",
        );
      }

      toast.success(res.data?.message || "Manual allocation sent");
      setManualAllocateOpen(false);
      await loadJob();
    } catch (err) {
      console.error("❌ Failed to manually allocate musician:", err);
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to manually allocate musician",
      );
    } finally {
      setManualAllocating(false);
    }
  }, [canManageThisJob, manualAllocateSelectedId, headers, id, loadJob]);

  const handleAllocateApplicant = useCallback(
    async (application) => {
      const musicianId = String(
        application?.musicianId || application?._id || "",
      ).trim();

      if (!musicianId) {
        toast.error("This applicant is missing a musician ID.");
        return;
      }

      const confirmed = window.confirm(
        `Allocate this job to ${getApplicantShortName(application)}?`,
      );
      if (!confirmed) return;

      try {
        setAssigningId(musicianId);

        const res = await axios.post(
          `${backendUrl}/api/deputy-jobs/${id}/manual-allocate`,
          { musicianId },
          { headers, withCredentials: true },
        );

        if (!res.data?.success) {
          throw new Error(res.data?.message || "Failed to allocate applicant");
        }

        toast.success(res.data?.message || "Applicant allocated");
        await loadJob();
      } catch (err) {
        console.error("❌ Failed to allocate applicant:", err);
        toast.error(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to allocate applicant",
        );
      } finally {
        setAssigningId("");
      }
    },
    [headers, id, loadJob],
  );

  const handlePresentApplicant = useCallback(
    async (application) => {
      const musicianId = String(
        application?.musicianId || application?._id || "",
      ).trim();

      if (!musicianId) {
        toast.error("This applicant is missing a musician ID.");
        return;
      }

      const confirmed = window.confirm(
        `Present ${getApplicantShortName(application)} to the client for ${
          job?.title || "this enquiry"
        }?`,
      );
      if (!confirmed) return;

      try {
        setPresentingId(musicianId);

        const res = await axios.post(
          `${backendUrl}/api/deputy-jobs/${id}/present-applicant`,
          { musicianId },
          { headers, withCredentials: true },
        );

        if (!res.data?.success) {
          throw new Error(res.data?.message || "Failed to present applicant");
        }

        toast.success(res.data?.message || "Applicant presented");
        await loadJob();
      } catch (err) {
        console.error("❌ Failed to present applicant:", err);
        toast.error(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to present applicant",
        );
      } finally {
        setPresentingId("");
      }
    },
    [headers, id, job?.title, loadJob],
  );

  const fullLocation =
    normaliseString(job?.location) ||
    [job?.venue, job?.locationName, job?.county, job?.postcode]
      .map((item) => normaliseString(item))
      .filter(Boolean)
      .join(", ") ||
    "Location TBC";

  const feeText = formatMoney(job?.deputyNetAmount || job?.fee || 0, job?.currency || "GBP");

  const statusTone =
    statusToneMap[normaliseString(job?.status).toLowerCase()] || "default";

  const workflowTone =
    job?.workflowStage === "booking_confirmed"
      ? "green"
      : job?.workflowStage === "allocated"
        ? "yellow"
        : "default";

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied");
    } catch (err) {
      console.error("❌ Failed to copy link:", err);
      toast.error("Could not copy link");
    }
  };

  const handleApply = useCallback(async () => {
    if (hasApplied) {
      toast.success("You have already applied for this deputy job");
      return;
    }

    try {
      setApplying(true);

      const res = await axios.post(
        `${backendUrl}/api/deputy-jobs/${id}/apply`,
        {},
        {
          headers,
          withCredentials: true,
        },
      );

      if (!res.data?.success) {
        throw new Error(res.data?.message || "Failed to apply for deputy job");
      }

      toast.success(res.data?.message || "Application submitted");
      await loadJob();
    } catch (err) {
      console.error("❌ Failed to apply for deputy job:", err);
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to apply for deputy job",
      );
    } finally {
      setApplying(false);
    }
  }, [hasApplied, headers, id, loadJob]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl rounded-2xl bg-white p-6 shadow">
        <p className="text-sm text-gray-600">Loading deputy job…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl rounded-2xl bg-white p-6 shadow">
        <p className="mb-4 text-sm text-red-600">{error}</p>
        <button
          type="button"
          onClick={() => navigate("/deputy-jobs")}
          className="rounded-lg bg-black px-4 py-2 text-sm text-white hover:bg-[#ff6667]"
        >
          Back to deputy jobs
        </button>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="mx-auto max-w-4xl rounded-2xl bg-white p-6 shadow">
        <p className="mb-4 text-sm text-gray-600">Deputy job not found.</p>
        <button
          type="button"
          onClick={() => navigate("/deputy-jobs")}
          className="rounded-lg bg-black px-4 py-2 text-sm text-white hover:bg-[#ff6667]"
        >
          Back to deputy jobs
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <Link
              to="/deputy-jobs"
              className="mb-3 inline-block text-sm text-gray-500 hover:text-black"
            >
              ← Back to deputy jobs
            </Link>
            <h1 className="text-2xl font-semibold text-gray-900">
              {job.title || job.instrument || "Deputy job"}
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              {formatDateLong(job.eventDate || job.date)}
            </p>
            <p className="mt-1 text-sm text-gray-600">{fullLocation}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={statusTone}>{getStatusLabel(job.status, "Unknown")}</Badge>
            <Badge tone={workflowTone}>{formatLabel(job.workflowStage)}</Badge>

            {hasApplied ? (
              <span className="inline-flex items-center rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm font-medium text-green-700">
                Applied
              </span>
            ) : canApplyToJob ? (
              <button
                type="button"
                onClick={handleApply}
                disabled={applying}
                className="inline-flex items-center rounded-lg border border-[#ff6667] px-4 py-2 text-sm font-medium text-[#ff6667] hover:bg-[#fff1f1] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {applying ? "Applying…" : "One-click apply"}
              </button>
            ) : null}

            {canManageThisJob ? (
              <button
                type="button"
                onClick={handleManualAllocateClick}
                disabled={manualAllocating}
                className="inline-flex items-center rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {manualAllocating ? "Allocating…" : "Manual allocate musician"}
              </button>
            ) : null}

            <button
              type="button"
              onClick={handleCopyLink}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Copy link
            </button>

            <button
              type="button"
              onClick={loadJob}
              className="rounded-lg bg-black px-4 py-2 text-sm text-white hover:bg-[#ff6667]"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="space-y-6">
          <div className="rounded-2xl bg-white p-6 shadow">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Job details</h2>

            {hasApplied ? (
              <div className="mb-4 inline-flex items-center rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm font-medium text-green-700">
                You have applied for this deputy job
              </div>
            ) : canApplyToJob ? (
              <div className="mb-4">
                <button
                  type="button"
                  onClick={handleApply}
                  disabled={applying}
                  className="rounded-lg bg-[#ff6667] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {applying ? "Applying…" : "One-click apply"}
                </button>
              </div>
            ) : null}

            <div>
              <DetailRow label="Job title" value={job.title || job.instrument || "—"} />
              <DetailRow label="Date" value={formatDateLong(job.eventDate || job.date)} />
              <DetailRow label="Call time" value={job.callTime || job.startTime || "TBC"} />
              <DetailRow label="Finish time" value={job.finishTime || job.endTime || "TBC"} />
              <DetailRow label="Location" value={fullLocation} />
              <DetailRow label="Instrument" value={job.instrument || "—"} />
              <DetailRow
                label="Required instruments"
                value={
                  toArray(job.requiredInstruments).length
                    ? toArray(job.requiredInstruments).join(", ")
                    : "—"
                }
              />
              <DetailRow
                label="Essential roles"
                value={
                  toArray(job.essentialRoles).length
                    ? toArray(job.essentialRoles).join(", ")
                    : "—"
                }
              />
              <DetailRow
                label="Required skills"
                value={
                  toArray(job.requiredSkills).length
                    ? toArray(job.requiredSkills).join(", ")
                    : "—"
                }
              />
              <DetailRow
                label="Desired roles"
                value={
                  toArray(job.desiredRoles).length
                    ? toArray(job.desiredRoles).join(", ")
                    : "—"
                }
              />
              <DetailRow
                label="Genres"
                value={toArray(job.genres).length ? toArray(job.genres).join(", ") : "—"}
              />
              <DetailRow
                label="Set lengths"
                value={
                  toArray(job.setLengths).length
                    ? toArray(job.setLengths).join(", ")
                    : "—"
                }
              />
              <DetailRow
                label="What's included"
                value={
                  toArray(job.whatsIncluded).length
                    ? toArray(job.whatsIncluded).join(", ")
                    : "—"
                }
              />
              <DetailRow
                label="Claimable expenses"
                value={
                  toArray(job.claimableExpenses).length
                    ? toArray(job.claimableExpenses).join(", ")
                    : "—"
                }
              />
              <DetailRow label="Notes" value={job.notes || "—"} />
            </div>
          </div>

          {canViewMatchedMusicians ? (
            <div className="rounded-2xl bg-white p-6 shadow">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-gray-900">Matched musicians</h2>
                <SectionToggleButton
                  open={showMatchedMusicians}
                  onClick={() => setShowMatchedMusicians((prev) => !prev)}
                  label="matched"
                  count={matchedMusicians.length}
                />
              </div>

              {!showMatchedMusicians ? (
                <p className="text-sm text-gray-500">
                  Matched musicians are hidden to keep this page fast. Expand to
                  view them.
                </p>
              ) : matchedMusicians.length ? (
                <>
                  <div className="space-y-3">
                    {visibleMatchedMusicians.map((musician, index) => {
                      const name =
                        [musician.firstName, musician.lastName]
                          .filter(Boolean)
                          .join(" ")
                          .trim() || "Unnamed musician";

                      return (
                        <div
                          key={musician.musicianId || musician._id || `${name}-${index}`}
                          className="rounded-xl border border-gray-200 p-4"
                        >
                          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                            <div>
                              <p className="font-medium text-gray-900">{name}</p>
                              {musician.email ? (
                                <p className="text-sm text-gray-500">
                                  {maskEmail(musician.email)}
                                </p>
                              ) : null}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {typeof musician.matchPct === "number" ? (
                                <Badge>{musician.matchPct}% match</Badge>
                              ) : null}
                              {musician.notified ? <Badge tone="green">Notified</Badge> : null}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {matchedMusicians.length > visibleMatchedCount ? (
                    <div className="mt-4 flex justify-center">
                      <button
                        type="button"
                        onClick={() =>
                          setVisibleMatchedCount(
                            (prev) => prev + INITIAL_MATCHED_VISIBLE,
                          )
                        }
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Show more matched musicians
                      </button>
                    </div>
                  ) : null}
                </>
              ) : (
                <p className="text-sm text-gray-500">
                  No matched musicians stored on this job yet.
                </p>
              )}
            </div>
          ) : null}

          {canSeeApplicationsSection ? (
            <div className="rounded-2xl bg-white p-6 shadow">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-gray-900">Applications</h2>

                <div className="flex items-center gap-2">
                  <SectionToggleButton
                    open={showApplications}
                    onClick={() => setShowApplications((prev) => !prev)}
                    label="applications"
                    count={applications.length}
                  />

                  {isAdminEmail ||
                  currentUserRole === "admin" ||
                  currentUserRole === "agent" ||
                  Boolean(adminToken) ? (
                    <button
                      type="button"
                      onClick={() => navigate(`/deputy-jobs/${id}/applications`)}
                      className="rounded-full border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:border-black hover:text-black"
                    >
                      Manage applicants
                    </button>
                  ) : null}
                </div>
              </div>

              {!showApplications ? (
                <p className="text-sm text-gray-500">
                  Applications are hidden to keep this page fast. Expand to view
                  them.
                </p>
              ) : applications.length ? (
                <>
                  <div className="space-y-3">
                    {visibleApplications.map((application, index) => {
                      const musicianId = String(application?.musicianId || "").trim();
                      const status = String(
                        application?.status || "applied",
                      ).toLowerCase();

                      const displayName = shouldMaskApplicantNames
                        ? getApplicantShortName(application)
                        : getApplicantFullName(application);

                      const isAssigned = ["allocated", "booked", "assigned"].includes(
                        status,
                      );

                      const canAllocate =
                        !isEnquiryJob &&
                        !isAssigned &&
                        Boolean(musicianId) &&
                        canManageThisJob;

                      const canPresent =
                        isEnquiryJob &&
                        !isAssigned &&
                        Boolean(musicianId) &&
                        canManageThisJob;

                      const isAllocating = assigningId === musicianId;
                      const isPresenting = presentingId === musicianId;

                      return (
                        <div
                          key={application.musicianId || `${displayName}-${index}`}
                          className="rounded-xl border border-gray-200 p-4"
                        >
                          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900">{displayName}</p>

                              {Boolean(adminToken) && application.email ? (
                                <p className="text-sm text-gray-500">
                                  {maskEmail(application.email)}
                                </p>
                              ) : null}
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              <Badge>
                                {getStatusLabel(application.status, "Applied")}
                              </Badge>

                              {application.appliedAt ? (
                                <span className="text-xs text-gray-500">
                                  Applied {formatDateTime(application.appliedAt)}
                                </span>
                              ) : null}
                            </div>
                          </div>

                          {canManageThisJob ? (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {canAllocate ? (
                                <button
                                  type="button"
                                  onClick={() => handleAllocateApplicant(application)}
                                  disabled={isAllocating}
                                  className="inline-flex items-center rounded-full bg-black px-4 py-2 text-sm font-medium text-white hover:bg-[#ff6667] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {isAllocating
                                    ? "Allocating…"
                                    : "Allocate applicant"}
                                </button>
                              ) : null}

                              {canPresent ? (
                                <button
                                  type="button"
                                  onClick={() => handlePresentApplicant(application)}
                                  disabled={isPresenting}
                                  className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {isPresenting ? "Sending…" : "Present applicant"}
                                </button>
                              ) : null}

                              {canSeeApplicationsSection ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    navigate(`/deputy-jobs/${id}/applications`)
                                  }
                                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                  Manage applications
                                </button>
                              ) : null}

                              {!musicianId ? (
                                <span className="inline-flex items-center rounded-full bg-gray-100 px-4 py-2 text-sm font-medium text-gray-600">
                                  Missing musician ID
                                </span>
                              ) : null}

                              {isAssigned ? (
                                <span className="inline-flex items-center rounded-full bg-green-100 px-4 py-2 text-sm font-medium text-green-800">
                                  Allocated
                                </span>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>

                  {applications.length > visibleApplicationsCount ? (
                    <div className="mt-4 flex justify-center">
                      <button
                        type="button"
                        onClick={() =>
                          setVisibleApplicationsCount(
                            (prev) => prev + INITIAL_APPLICATIONS_VISIBLE,
                          )
                        }
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Show more applications
                      </button>
                    </div>
                  ) : null}
                </>
              ) : (
                <p className="text-sm text-gray-500">No applications yet.</p>
              )}
            </div>
          ) : null}
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl bg-white p-6 shadow">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Summary</h2>
            <div className="space-y-3 text-sm text-gray-700">
              <div className="flex items-center justify-between">
                <span>Matched</span>
                <span className="font-medium text-gray-900">
                  {job.matchedCount || matchedMusicians.length || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Notified</span>
                <span className="font-medium text-gray-900">
                  {job.notifiedCount || notifications.length || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Applications</span>
                <span className="font-medium text-gray-900">
                  {normaliseArray(job?.applications).length || applications.length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Deputy net</span>
                <span className="font-medium text-gray-900">{feeText}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Release on</span>
                <span className="font-medium text-gray-900">
                  {formatDateLong(job.releaseOn)}
                </span>
              </div>
            </div>
          </div>

          {canViewNotifications ? (
            <div className="rounded-2xl bg-white p-6 shadow">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
                <SectionToggleButton
                  open={showNotifications}
                  onClick={() => setShowNotifications((prev) => !prev)}
                  label="notifications"
                  count={notifications.length}
                />
              </div>

              {!showNotifications ? (
                <p className="text-sm text-gray-500">
                  Notifications are hidden to keep this page fast. Expand to
                  view them.
                </p>
              ) : notifications.length ? (
                <>
                  <div className="space-y-3">
                    {visibleNotifications.map((notification, index) => (
                      <div
                        key={`${
                          notification.type || "notification"
                        }-${notification.providerMessageId || index}`}
                        className="rounded-xl border border-gray-200 p-4"
                      >
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <Badge>
                            {formatLabel(notification.type, "Notification")}
                          </Badge>
                          <Badge
                            tone={
                              notification.status === "sent"
                                ? "green"
                                : notification.status === "failed"
                                  ? "red"
                                  : "default"
                            }
                          >
                            {formatLabel(notification.status, "Unknown")}
                          </Badge>
                        </div>

                        <p className="text-sm font-medium text-gray-900">
                          {notification.subject || "No subject"}
                        </p>

                        <p className="mt-1 text-xs text-gray-500">
                          {formatLabel(notification.channel)} ·{" "}
                          {formatDateTime(notification.sentAt)}
                        </p>

                        {notification.email ? (
                          <p className="mt-1 text-sm text-gray-600">
                            {maskEmail(notification.email)}
                          </p>
                        ) : null}

                        {notification.error ? (
                          <p className="mt-2 text-sm text-red-600">
                            {notification.error}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>

                  {notifications.length > visibleNotificationsCount ? (
                    <div className="mt-4 flex justify-center">
                      <button
                        type="button"
                        onClick={() =>
                          setVisibleNotificationsCount(
                            (prev) => prev + INITIAL_NOTIFICATIONS_VISIBLE,
                          )
                        }
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Show more notifications
                      </button>
                    </div>
                  ) : null}
                </>
              ) : (
                <p className="text-sm text-gray-500">
                  No notifications recorded yet.
                </p>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {manualAllocateOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-6 py-5">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Manual allocate musician
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Pick a musician below, or paste a 24-character musicianId.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setManualAllocateOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-800"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="px-6 py-5">
              <input
                value={manualAllocateQuery}
                onChange={(e) => setManualAllocateQuery(e.target.value)}
                placeholder="Search by name, email, phone, or musicianId"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-black"
              />

              <div className="mt-4 max-h-[320px] overflow-y-auto rounded-xl border border-gray-200">
                {filteredManualAllocateCandidates.length ? (
                  <div className="divide-y divide-gray-100">
                    {filteredManualAllocateCandidates.map((m) => {
                      const selected =
                        String(manualAllocateSelectedId) === String(m.musicianId);

                      return (
                        <button
                          key={m.musicianId}
                          type="button"
                          onClick={() => setManualAllocateSelectedId(m.musicianId)}
                          className={[
                            "w-full px-4 py-3 text-left transition",
                            selected ? "bg-gray-50" : "hover:bg-gray-50",
                          ].join(" ")}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-gray-900">
                                {getCandidateDisplayName(m)}
                              </p>
                              <p className="truncate text-xs text-gray-500">
                                {m.email || m.phone || m.musicianId}
                              </p>
                            </div>

                            {selected ? (
                              <span className="rounded-full bg-black px-2.5 py-1 text-xs font-medium text-white">
                                Selected
                              </span>
                            ) : null}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 text-sm text-gray-500">No matches.</div>
                )}
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-xs font-medium text-gray-600">
                  Or paste musicianId
                </label>
                <input
                  value={manualAllocateSelectedId}
                  onChange={(e) => setManualAllocateSelectedId(e.target.value)}
                  placeholder="e.g. 507f191e810c19729de860ea"
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-black"
                />
                {manualAllocateSelectedId &&
                !isValidObjectId(manualAllocateSelectedId) ? (
                  <p className="mt-2 text-xs text-red-600">
                    That doesn’t look like a valid 24-character Mongo ObjectId.
                  </p>
                ) : null}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
              <button
                type="button"
                onClick={() => setManualAllocateOpen(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={submitManualAllocate}
                disabled={manualAllocating}
                className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-[#ff6667] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {manualAllocating ? "Allocating…" : "Send allocation"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default DeputyJobDetail;