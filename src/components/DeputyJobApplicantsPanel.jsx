

import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

const BACKEND_BASE = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/+$/, "");
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
const getAuthHeaders = () => {
  const authToken =
    localStorage.getItem("token") ||
    localStorage.getItem("adminToken") ||
    localStorage.getItem("musicianToken") ||
    sessionStorage.getItem("token") ||
    "";

  return authToken
    ? {
        Authorization: `Bearer ${authToken}`,
        token: authToken,
      }
    : {};
};
const getCurrentUser = () => {
  const authToken =
    localStorage.getItem("token") ||
    localStorage.getItem("adminToken") ||
    localStorage.getItem("musicianToken") ||
    sessionStorage.getItem("token") ||
    "";

  const tokenPayload = parseJwtPayload(authToken);

  return {
    email: String(
      tokenPayload?.email ||
        tokenPayload?.useremail ||
        localStorage.getItem("userEmail") ||
        sessionStorage.getItem("userEmail") ||
        ""
    )
      .trim()
      .toLowerCase(),
  };
};
const PUBLIC_SITE_BASE = (
  import.meta.env.VITE_PUBLIC_SITE_URL || "https://thesupremecollective.co.uk"
).replace(/\/$/, "");

const ADMIN_MUSICIAN_ROUTE_BASE = "/musician";

const statusLabelMap = {
  applied: "Applied",
  shortlisted: "Shortlisted",
  allocated: "Allocated",
  booked: "Booked",
  declined: "Declined",
  withdrawn: "Withdrawn",
  assigned: "Allocated",
  closed: "Closed",
  rejected: "Rejected",
};

const statusClassMap = {
  applied: "bg-blue-50 text-blue-700 border-blue-200",
  shortlisted: "bg-purple-50 text-purple-700 border-purple-200",
  allocated: "bg-green-50 text-green-700 border-green-200",
  booked: "bg-emerald-50 text-emerald-700 border-emerald-200",
  declined: "bg-red-50 text-red-700 border-red-200",
  withdrawn: "bg-orange-50 text-orange-700 border-orange-200",
  assigned: "bg-green-50 text-green-700 border-green-200",
  closed: "bg-gray-100 text-gray-700 border-gray-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
};

const formatDateTime = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";

  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const formatMoney = (value) => {
  const n = Number(value || 0);
  return `£${n.toLocaleString("en-GB", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};

const buildMusicianProfileUrl = (application = {}) => {
  const nestedMusician = application?.musician || {};

  const slug = String(
    application?.musicianSlug ||
      application?.slug ||
      nestedMusician?.musicianSlug ||
      nestedMusician?.slug ||
      ""
  ).trim();
  if (slug) return `${ADMIN_MUSICIAN_ROUTE_BASE}/${slug}`;

  const id = String(
    application?.musicianId?._id ||
      application?.musicianId ||
      nestedMusician?._id ||
      nestedMusician?.id ||
      application?._id ||
      ""
  ).trim();
  if (id) return `${ADMIN_MUSICIAN_ROUTE_BASE}/${id}`;

  const direct = String(application?.profileUrl || nestedMusician?.profileUrl || "").trim();
  if (direct) {
    return direct.startsWith(PUBLIC_SITE_BASE)
      ? direct.replace(PUBLIC_SITE_BASE, "")
      : direct;
  }

  return "";
};

const getApplicantName = (application = {}) => {
  if (application.name && String(application.name).trim()) {
    return String(application.name).trim();
  }

  const firstName = String(application.firstName || "").trim();
  const lastName = String(application.lastName || "").trim();
  return `${firstName} ${lastName}`.trim() || "Unnamed applicant";
};
const getApplicantShortName = (application = {}) => {
  const firstName = String(application.firstName || "").trim();
  const lastName = String(application.lastName || "").trim();
  const lastInitial = lastName ? `${lastName.charAt(0).toUpperCase()}.` : "";
  return [firstName, lastInitial].filter(Boolean).join(" ") || getApplicantName(application);
};

const getInstrumentation = (application = {}) => {
  if (Array.isArray(application.instrumentation) && application.instrumentation.length) {
    return application.instrumentation.filter(Boolean);
  }

  if (Array.isArray(application.skills) && application.skills.length) {
    return application.skills.filter(Boolean);
  }

  return [];
};

const DeputyJobApplicantsPanel = ({
  job,
  applicants = [],
  loading = false,
  onClose,
  onAssigned,
}) => {
  const [assigningId, setAssigningId] = useState("");
  const [localApplicants, setLocalApplicants] = useState(applicants);
  const currentUser = useMemo(() => getCurrentUser(), []);
  const isAdmin = currentUser.email === "hello@thesupremecollective.co.uk";

  React.useEffect(() => {
    setLocalApplicants(Array.isArray(applicants) ? applicants : []);
  }, [applicants]);

  const sortedApplicants = useMemo(() => {
    return [...(Array.isArray(localApplicants) ? localApplicants : [])].sort((a, b) => {
      const aAssigned = ["allocated", "booked", "assigned"].includes(String(a?.status || "").toLowerCase()) ? 1 : 0;
      const bAssigned = ["allocated", "booked", "assigned"].includes(String(b?.status || "").toLowerCase()) ? 1 : 0;
      if (aAssigned !== bAssigned) return bAssigned - aAssigned;

      const aApplied = new Date(a?.appliedAt || a?.createdAt || 0).getTime();
      const bApplied = new Date(b?.appliedAt || b?.createdAt || 0).getTime();
      return bApplied - aApplied;
    });
  }, [localApplicants]);

  const assignedApplicant = useMemo(() => {
    return (
      sortedApplicants.find((app) =>
        ["allocated", "booked", "assigned"].includes(String(app?.status || "").toLowerCase())
      ) || null
    );
  }, [sortedApplicants]);

  const handleAssign = async (application) => {
    const applicationMusicianId = String(
      application?.musicianId?._id ||
        application?.musicianId ||
        application?.musician?._id ||
        application?.musician?.id ||
        ""
    ).trim();

    if (!job?._id || !applicationMusicianId || assigningId) return;

    const confirmed = window.confirm(
      `Allocate this job to ${getApplicantName(application)}? This will allocate the deputy job and update the applicant list.`
    );

    if (!confirmed) return;

    try {
      setAssigningId(applicationMusicianId);

      const { data } = await axios.post(
        `${BACKEND_BASE}/api/deputy-jobs/${job._id}/confirm-allocation`,
        { musicianId: applicationMusicianId },
        {
          headers: getAuthHeaders(),
          withCredentials: true,
        }
      );

      if (!data?.success) {
        throw new Error(data?.message || "Failed to allocate applicant");
      }

      const nowIso = new Date().toISOString();
      const nextApplicants = sortedApplicants.map((app) => {
        const sameApplicant =
          String(app?.musicianId || app?._id || "") === applicationMusicianId;

        if (sameApplicant) {
          return {
            ...app,
            status: "allocated",
            allocatedAt: nowIso,
          };
        }

        return app;
      });

      setLocalApplicants(nextApplicants);
      toast.success(`${getApplicantName(application)} has been allocated to the job.`);

      if (typeof onAssigned === "function") {
        onAssigned({
          job: data.job,
          musicianId: applicationMusicianId,
          assignedApplicant: application,
        });
      }
    } catch (error) {
      console.error("❌ Failed to allocate deputy job:", error);
      toast.error(
        error?.response?.data?.message || error?.message || "Failed to allocate applicant"
      );
    } finally {
      setAssigningId("");
    }
  };

  return (
    <div className="w-full h-full bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-gray-200">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Applicants</h3>
          <p className="text-sm text-gray-500 mt-1">
            {job?.title || "Deputy opportunity"}
            {typeof job?.fee !== "undefined" ? ` • ${formatMoney(job.fee)}` : ""}
          </p>
        </div>

        {typeof onClose === "function" && (
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-gray-200 text-gray-500 hover:text-gray-800 hover:border-gray-300"
            aria-label="Close applicants panel"
          >
            ×
          </button>
        )}
      </div>

      <div className="p-5 overflow-y-auto max-h-[75vh]">
        {loading ? (
          <div className="py-10 text-center text-gray-500">Loading applicants…</div>
        ) : !sortedApplicants.length ? (
          <div className="py-10 text-center text-gray-500">
            No applications yet for this job.
          </div>
        ) : (
          <div className="space-y-4">
            {assignedApplicant && (
              <div className="p-4 rounded-xl border border-green-200 bg-green-50">
                <p className="text-sm font-semibold text-green-800">Allocated applicant</p>
                <p className="text-sm text-green-700 mt-1">
                  {getApplicantName(assignedApplicant)}
                  {assignedApplicant?.allocatedAt
                    ? ` • allocated ${formatDateTime(assignedApplicant.allocatedAt)}`
                    : assignedApplicant?.assignedAt
                    ? ` • allocated ${formatDateTime(assignedApplicant.assignedAt)}`
                    : ""}
                </p>
              </div>
            )}

            {sortedApplicants.map((application) => {
              const applicantName = getApplicantShortName(application);
              const profileUrl = buildMusicianProfileUrl(application);
              const instrumentation = getInstrumentation(application);
              const status = String(application?.status || "applied").toLowerCase();
              const applicantMusicianId = String(
                application?.musicianId?._id ||
                  application?.musicianId ||
                  application?.musician?._id ||
                  application?.musician?.id ||
                  ""
              ).trim();
              const isAssigned = ["allocated", "booked", "assigned"].includes(status);
              const canAssign = Boolean(applicantMusicianId) && !assignedApplicant && status === "applied";
              const isAssigning = Boolean(applicantMusicianId) && assigningId === applicantMusicianId;

              return (
                <div
                  key={application._id}
                  className="border border-gray-200 rounded-2xl p-4 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h4 className="text-base font-semibold text-gray-900 truncate">
                          {applicantName}
                        </h4>

                        {profileUrl ? (
                          <Link
                            to={profileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100"
                          >
                            View profile
                          </Link>
                        ) : null}

                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                            statusClassMap[status] || "bg-gray-100 text-gray-700 border-gray-200"
                          }`}
                        >
                          {statusLabelMap[status] || application?.status || "Applied"}
                        </span>
                      </div>

                      <div className="mt-2 space-y-1 text-sm text-gray-600">
                        <p>
                          <span className="font-medium text-gray-800">Applied:</span>{" "}
                          {formatDateTime(application?.appliedAt || application?.createdAt)}
                        </p>

                        {isAdmin && application?.email ? (
                          <p>
                            <span className="font-medium text-gray-800">Email:</span>{" "}
                            <a
                              href={`mailto:${application.email}`}
                              className="text-[#ff6667] hover:underline"
                            >
                              {application.email}
                            </a>
                          </p>
                        ) : null}

                        {isAdmin && application?.phone ? (
                          <p>
                            <span className="font-medium text-gray-800">Phone:</span>{" "}
                            <a
                              href={`tel:${application.phone}`}
                              className="text-[#ff6667] hover:underline"
                            >
                              {application.phone}
                            </a>
                          </p>
                        ) : null}

                        {application?.postcode ? (
                          <p>
                            <span className="font-medium text-gray-800">Postcode:</span>{" "}
                            {application.postcode}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    {application?.profileImage || application?.photoUrl ? (
                      <img
                        src={application.profileImage || application.photoUrl}
                        alt={applicantName}
                        className="w-14 h-14 rounded-full object-cover border border-gray-200"
                      />
                    ) : null}
                  </div>

                  {instrumentation.length ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {instrumentation.map((item, idx) => (
                        <span
                          key={`${application._id}_skill_${idx}`}
                          className="inline-flex items-center px-2.5 py-1 rounded-full bg-gray-100 text-xs text-gray-700 border border-gray-200"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  {application?.notes ? (
                    <div className="mt-4 p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">
                        Notes
                      </p>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">
                        {application.notes}
                      </p>
                    </div>
                  ) : null}

                  <div className="mt-4 flex flex-wrap gap-3">
                    {canAssign ? (
                      <button
                        type="button"
                        onClick={() => handleAssign(application)}
                        disabled={isAssigning}
                        className="inline-flex items-center px-4 py-2 rounded-full bg-black text-white text-sm font-medium hover:bg-[#ff6667] disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {isAssigning ? "Allocating…" : "Allocate job"}
                      </button>
                    ) : null}

                    {isAssigned ? (
                      <span className="inline-flex items-center px-4 py-2 rounded-full bg-green-100 text-green-800 text-sm font-medium">
                        Allocated
                      </span>
                    ) : null}

                    {!applicantMusicianId ? (
                      <span className="inline-flex items-center px-4 py-2 rounded-full bg-amber-50 text-amber-800 text-sm font-medium border border-amber-200">
                        Missing musician link
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DeputyJobApplicantsPanel;