import React, { useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const BACKEND_BASE = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/+$/, "");
const ADMIN_EMAIL = "hello@thesupremecollective.co.uk";

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

const normalisePhone = (value = "") =>
  String(value || "").replace(/\s+/g, "").trim();

const PUBLIC_SITE_BASE = (
  import.meta.env.VITE_PUBLIC_SITE_URL || "https://thesupremecollective.co.uk"
).replace(/\/$/, "");

const isLikelyObjectId = (value = "") => /^[a-f\d]{24}$/i.test(String(value || "").trim());

const buildMusicianProfileUrl = (application = {}) => {
  const slug = String(application.musicianSlug || "").trim();
  if (slug) return `${PUBLIC_SITE_BASE}/musician/${slug}`;

  const musicianId = String(application.musicianId || "").trim();
  if (isLikelyObjectId(musicianId)) {
    return `${PUBLIC_SITE_BASE}/musician/${musicianId}`;
  }

  const direct = String(application.profileUrl || "").trim();
  if (!direct) return "";

  if (/^https?:\/\//i.test(direct)) return direct;

  if (direct.startsWith("/musician/")) {
    return `${PUBLIC_SITE_BASE}${direct}`;
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

const findMatchedSnapshot = (job, application = {}) => {
  const matched = Array.isArray(job?.matchedMusicians) ? job.matchedMusicians : [];

  const appMusicianId = String(application?.musicianId || "").trim();
  const appEmail = String(application?.email || "").trim().toLowerCase();
  const appPhone = normalisePhone(application?.phone || "");
  const appFirstName = String(application?.firstName || "").trim().toLowerCase();
  const appLastName = String(application?.lastName || "").trim().toLowerCase();

  return (
    matched.find((item) => String(item?.musicianId || "").trim() === appMusicianId) ||
    matched.find((item) => String(item?.email || "").trim().toLowerCase() === appEmail) ||
    matched.find((item) => normalisePhone(item?.phone || "") === appPhone) ||
    matched.find((item) => {
      const first = String(item?.firstName || "").trim().toLowerCase();
      const last = String(item?.lastName || "").trim().toLowerCase();
      return first === appFirstName && last === appLastName;
    }) ||
    null
  );
};

const buildMergedApplication = (job, application = {}) => {
  const matchedSnapshot = findMatchedSnapshot(job, application);

  return {
    ...matchedSnapshot,
    ...application,
    _id:
      application?._id ||
      matchedSnapshot?._id ||
      application?.musicianId ||
      matchedSnapshot?.musicianId ||
      `${application?.email || "unknown"}_${application?.appliedAt || application?.createdAt || "row"}`,
    musicianId:
      application?.musicianId ||
      matchedSnapshot?.musicianId ||
      application?._id ||
      "",
    musicianSlug:
      application?.musicianSlug ||
      matchedSnapshot?.musicianSlug ||
      "",
    firstName:
      application?.firstName ||
      matchedSnapshot?.firstName ||
      "",
    lastName:
      application?.lastName ||
      matchedSnapshot?.lastName ||
      "",
    email:
      application?.email ||
      matchedSnapshot?.email ||
      "",
    phone:
      application?.phone ||
      matchedSnapshot?.phone ||
      "",
    profileImage:
      application?.profileImage ||
      application?.photoUrl ||
      matchedSnapshot?.profilePicture ||
      matchedSnapshot?.profileImage ||
      "",
    photoUrl:
      application?.photoUrl ||
      application?.profileImage ||
      matchedSnapshot?.profilePicture ||
      matchedSnapshot?.profileImage ||
      "",
    skills:
      application?.skills ||
      matchedSnapshot?.skills ||
      [],
    instrumentation:
      application?.instrumentation ||
      matchedSnapshot?.instrumentation ||
      [],
  };
};

const DeputyJobApplicantsPanel = ({
  job,
  applicants = [],
  loading = false,
  onClose,
  onAssigned,
  onManualAllocate,
}) => {
  const [assigningId, setAssigningId] = useState("");
  const [localApplicants, setLocalApplicants] = useState(applicants);
  const currentUser = useMemo(() => getCurrentUser(), []);
  const isAdmin = currentUser.email === ADMIN_EMAIL;

  const assignedApplicantId = useMemo(() => {
    const allocatedId = String(
      job?.allocatedMusicianId || job?.assignedMusicianId || ""
    ).trim();
    return allocatedId;
  }, [job]);

  const canShowManualAllocate = isAdmin && typeof onManualAllocate === "function";

  React.useEffect(() => {
    setLocalApplicants(Array.isArray(applicants) ? applicants : []);
  }, [applicants]);

  const sortedApplicants = useMemo(() => {
    return [...(Array.isArray(localApplicants) ? localApplicants : [])].sort((a, b) => {
      const aAssigned = ["allocated", "booked", "assigned"].includes(
        String(a?.status || "").toLowerCase()
      )
        ? 1
        : 0;
      const bAssigned = ["allocated", "booked", "assigned"].includes(
        String(b?.status || "").toLowerCase()
      )
        ? 1
        : 0;

      if (aAssigned !== bAssigned) return bAssigned - aAssigned;

      const aApplied = new Date(a?.appliedAt || a?.createdAt || 0).getTime();
      const bApplied = new Date(b?.appliedAt || b?.createdAt || 0).getTime();
      return bApplied - aApplied;
    });
  }, [localApplicants]);

  const assignedApplicant = useMemo(() => {
    const found = sortedApplicants.find((app) =>
      ["allocated", "booked", "assigned"].includes(String(app?.status || "").toLowerCase())
    );

    return found ? buildMergedApplication(job, found) : null;
  }, [sortedApplicants, job]);

  const handleAssign = async (application) => {
    const mergedApplication = buildMergedApplication(job, application);
    const applicationMusicianId = String(mergedApplication?.musicianId || "").trim();

    if (!job?._id || !applicationMusicianId || assigningId) return;

    const confirmed = window.confirm(
      `Allocate this job to ${getApplicantShortName(mergedApplication)}? This will allocate the deputy job and update the applicant list.`
    );

    if (!confirmed) return;

    try {
      setAssigningId(applicationMusicianId);

      const { data } = await axios.post(
`${BACKEND_BASE}/api/deputy-jobs/${job._id}/manual-allocate`,
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
        const mergedApp = buildMergedApplication(job, app);
        const sameApplicant =
          String(mergedApp?.musicianId || "").trim() === applicationMusicianId;

        if (sameApplicant) {
          return {
            ...app,
            musicianId: mergedApp.musicianId,
            musicianSlug: mergedApp.musicianSlug,
            firstName: mergedApp.firstName,
            lastName: mergedApp.lastName,
            email: mergedApp.email,
            phone: mergedApp.phone,
            profileImage: mergedApp.profileImage,
            status: "allocated",
            allocatedAt: nowIso,
          };
        }

        return app;
      });

      setLocalApplicants(nextApplicants);
      toast.success(`An allocation request has been sent to ${getApplicantShortName(mergedApplication)}`);

      if (typeof onAssigned === "function") {
        onAssigned({
          job: data.job,
          musicianId: applicationMusicianId,
          assignedApplicant: mergedApplication,
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

        <div className="flex items-center gap-2">
          {canShowManualAllocate ? (
            <button
              type="button"
              onClick={() => onManualAllocate()}
              className="inline-flex items-center rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
            >
              Manual allocate musician
            </button>
          ) : null}

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
            {(assignedApplicant || job?.allocatedMusicianName || job?.assignedMusicianName) && (
              <div className="p-4 rounded-xl border border-green-200 bg-green-50">
                <p className="text-sm font-semibold text-green-800">Allocation Requested</p>
                <p className="text-sm text-green-700 mt-1">
                  {assignedApplicant
                    ? getApplicantName(assignedApplicant)
                    : String(job?.allocatedMusicianName || job?.assignedMusicianName || "Allocated musician")}
                  {(assignedApplicant?.allocatedAt || assignedApplicant?.assignedAt || job?.allocatedAt)
                    ? ` • allocated ${formatDateTime(
                        assignedApplicant?.allocatedAt ||
                          assignedApplicant?.assignedAt ||
                          job?.allocatedAt
                      )}`
                    : ""}
                </p>
              </div>
            )}

            {sortedApplicants.map((application) => {
              const mergedApplication = buildMergedApplication(job, application);
              const applicantName = getApplicantShortName(mergedApplication);
              const profileUrl = buildMusicianProfileUrl(mergedApplication);
              const instrumentation = getInstrumentation(mergedApplication);
              const status = String(mergedApplication?.status || "applied").toLowerCase();
              const applicantMusicianId = String(mergedApplication?.musicianId || "").trim();
              const isAssigned =
                ["allocated", "booked", "assigned"].includes(status) ||
                (assignedApplicantId && assignedApplicantId === applicantMusicianId);
              const canAssign = !isAssigned && Boolean(applicantMusicianId);
              const isAssigning = assigningId === applicantMusicianId;

              return (
                <div
                  key={mergedApplication._id}
                  className="border border-gray-200 rounded-2xl p-4 hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h4 className="text-base font-semibold text-gray-900 truncate">
                          {applicantName}
                        </h4>

                       {profileUrl ? (
  <a
    href={profileUrl}
    target="_blank"
    rel="noreferrer"
    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100"
  >
    View profile
  </a>
) : null}

                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                            statusClassMap[status] || "bg-gray-100 text-gray-700 border-gray-200"
                          }`}
                        >
                          {statusLabelMap[status] || mergedApplication?.status || "Applied"}
                        </span>
                      </div>

                      <div className="mt-2 space-y-1 text-sm text-gray-600">
                        <p>
                          <span className="font-medium text-gray-800">Applied:</span>{" "}
                          {formatDateTime(
                            mergedApplication?.appliedAt || mergedApplication?.createdAt
                          )}
                        </p>

                        {isAdmin && mergedApplication?.email ? (
                          <p>
                            <span className="font-medium text-gray-800">Email:</span>{" "}
                            <a
                              href={`mailto:${mergedApplication.email}`}
                              className="text-[#ff6667] hover:underline"
                            >
                              {mergedApplication.email}
                            </a>
                          </p>
                        ) : null}

                        {isAdmin && mergedApplication?.phone ? (
                          <p>
                            <span className="font-medium text-gray-800">Phone:</span>{" "}
                            <a
                              href={`tel:${mergedApplication.phone}`}
                              className="text-[#ff6667] hover:underline"
                            >
                              {mergedApplication.phone}
                            </a>
                          </p>
                        ) : null}

                        {mergedApplication?.postcode ? (
                          <p>
                            <span className="font-medium text-gray-800">Postcode:</span>{" "}
                            {mergedApplication.postcode}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    {mergedApplication?.profileImage || mergedApplication?.photoUrl ? (
                      <img
                        src={mergedApplication.profileImage || mergedApplication.photoUrl}
                        alt={applicantName}
                        className="w-14 h-14 rounded-full object-cover border border-gray-200"
                      />
                    ) : null}
                  </div>

                  {instrumentation.length ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {instrumentation.map((item, idx) => (
                        <span
                          key={`${mergedApplication._id}_skill_${idx}`}
                          className="inline-flex items-center px-2.5 py-1 rounded-full bg-gray-100 text-xs text-gray-700 border border-gray-200"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  {mergedApplication?.notes ? (
                    <div className="mt-4 p-3 rounded-xl bg-gray-50 border border-gray-100">
                      <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">
                        Notes
                      </p>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">
                        {mergedApplication.notes}
                      </p>
                    </div>
                  ) : null}

                  <div className="mt-4 flex flex-wrap gap-3">
                    {canAssign ? (
                      <button
                        type="button"
                        onClick={() => handleAssign(mergedApplication)}
                        disabled={isAssigning}
                        className="inline-flex items-center px-4 py-2 rounded-full bg-black text-white text-sm font-medium hover:bg-[#ff6667] disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {isAssigning ? "Allocating…" : "Allocate applicant"}
                      </button>
                    ) : null}

                    {!canAssign && !isAssigned && !applicantMusicianId ? (
                      <span className="inline-flex items-center px-4 py-2 rounded-full bg-gray-100 text-gray-600 text-sm font-medium">
                        Missing musician ID
                      </span>
                    ) : null}

                    {isAssigned ? (
                      <span className="inline-flex items-center px-4 py-2 rounded-full bg-green-100 text-green-800 text-sm font-medium">
                        Allocated
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