import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { backendUrl } from "../App";

const normaliseString = (value) => String(value || "").trim();

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

const formatLabel = (value, fallback = "—") => {
  const text = normaliseString(value);
  if (!text) return fallback;

  return text
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

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

const getApplicantShortDisplayName = (application = {}) => {
  const firstName = normaliseString(application?.firstName || "");
  const lastName = normaliseString(application?.lastName || "");
  const fallbackFullName = normaliseString(application?.fullName || "");

  if (firstName) {
    return `${firstName}${lastName ? ` ${lastName.charAt(0).toUpperCase()}.` : ""}`;
  }

  if (fallbackFullName) {
    const parts = fallbackFullName.split(/\s+/).filter(Boolean);
    if (!parts.length) return "Unnamed applicant";
    const fallbackFirstName = parts[0];
    const fallbackLastName = parts.length > 1 ? parts[parts.length - 1] : "";
    return `${fallbackFirstName}${fallbackLastName ? ` ${fallbackLastName.charAt(0).toUpperCase()}.` : ""}`;
  }

  return "Unnamed applicant";
};

const getApplicantProfileLink = (application = {}, jobId = "") => {
  const slug = normaliseString(application?.musicianSlug || "");
  const musicianId = normaliseString(application?.musicianId || application?._id || "");
  const presentationId = normaliseString(application?.presentationId || "");

  const basePath = slug
    ? `https://thesupremecollective.co.uk/musician/${encodeURIComponent(slug)}`
    : musicianId
      ? `https://thesupremecollective.co.uk/musician/${encodeURIComponent(musicianId)}`
      : "";

  if (!basePath) return "";

  const params = new URLSearchParams();

  if (jobId) params.set("jobId", jobId);
  if (presentationId) params.set("presentationId", presentationId);

  const queryString = params.toString();

  return queryString ? `${basePath}?${queryString}` : basePath;
};

const getMusicianProfileLink = (musician = {}) => {
  const slug = normaliseString(musician?.musicianSlug || "");
  if (slug) return `https://thesupremecollective.co.uk/musician/${slug}`;

  const musicianId = normaliseString(musician?._id || musician?.id || musician?.musicianId || "");
  if (musicianId) return `https://thesupremecollective.co.uk/musician/${musicianId}`;

  return "";
};

const getMusicianDisplayName = (musician = {}) => {
  const firstName = normaliseString(musician?.firstName || musician?.basicInfo?.firstName || "");
  const lastName = normaliseString(musician?.lastName || musician?.basicInfo?.lastName || "");
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();

  return (
    fullName ||
    normaliseString(musician?.name || "") ||
    normaliseString(musician?.email || "") ||
    "Unnamed musician"
  );
};

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
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${toneClass}`}>
      {children}
    </span>
  );
};

const ManageDeputyApplications = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [assigningId, setAssigningId] = useState("");
  const [presentingId, setPresentingId] = useState("");
  const [query, setQuery] = useState("");
  const [copyingPresented, setCopyingPresented] = useState(false);

  const [manualAddOpen, setManualAddOpen] = useState(false);
  const [manualAddQuery, setManualAddQuery] = useState("");
  const [manualAddResults, setManualAddResults] = useState([]);
  const [searchingMusicians, setSearchingMusicians] = useState(false);
  const [manuallyApplyingId, setManuallyApplyingId] = useState("");
  const [manuallyApplyAndPresentId, setManuallyApplyAndPresentId] = useState("");

  const adminToken = localStorage.getItem("adminToken") || "";
  const musicianToken = localStorage.getItem("musicianToken") || "";
  const generalToken = localStorage.getItem("token") || "";
  const token = generalToken || adminToken || musicianToken || "";

  const currentUser = useMemo(() => parseJwtPayload(token), [token]);

  const headers = useMemo(
    () =>
      token
        ? {
            Authorization: `Bearer ${token}`,
            token,
          }
        : {},
    [token]
  );

  const loadApplications = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const res = await axios.get(`${backendUrl}/api/deputy-jobs/${id}/applications`, {
        headers,
        withCredentials: true,
      });

      if (!res.data?.success) {
        throw new Error(res.data?.message || "Failed to load applications");
      }

      setJob(res.data.job || null);
      setApplications(Array.isArray(res.data.applications) ? res.data.applications : []);
    } catch (err) {
      console.error("❌ Failed to load deputy applications:", err);
      setError(err?.response?.data?.message || err?.message || "Failed to load applications");
    } finally {
      setLoading(false);
    }
  }, [headers, id]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const currentUserRole = String(currentUser?.role || currentUser?.userrole || "")
    .trim()
    .toLowerCase();

  const isAdminEmail =
    String(currentUser?.email || "").trim().toLowerCase() ===
    "hello@thesupremecollective.co.uk";

  const canManageThisJob =
    isAdminEmail || currentUserRole === "admin" || currentUserRole === "agent" || Boolean(adminToken);

  const normalisedJobType = normaliseString(job?.jobType).toLowerCase().replace(/[_-]+/g, " ");
  const normalisedJobStatus = normaliseString(job?.status).toLowerCase().replace(/[_-]+/g, " ");
  const normalisedWorkflowStage = normaliseString(job?.workflowStage)
    .toLowerCase()
    .replace(/[_-]+/g, " ");

  const isEnquiryJob = normalisedJobType === "enquiry";
  const isConfirmedBooking =
    [normalisedJobType, normalisedJobStatus, normalisedWorkflowStage].includes(
      "confirmed booking"
    ) ||
    (normalisedJobType === "booking" &&
      [normalisedJobStatus, normalisedWorkflowStage].some((value) =>
        ["confirmed", "booked"].includes(value)
      ));
  const canPresentApplicants = isEnquiryJob || isConfirmedBooking;

  const presentedApplications = useMemo(() => {
    return applications.filter(
      (application) => String(application?.status || "").trim().toLowerCase() === "presented"
    );
  }, [applications]);

  const existingApplicationMusicianIds = useMemo(() => {
    return new Set(
      applications
        .map((application) => normaliseString(application?.musicianId || ""))
        .filter(Boolean)
    );
  }, [applications]);

  const filteredApplications = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return applications;

    return applications.filter((application) => {
      const haystack = [
        application.fullName,
        application.email,
        application.status,
        application.musicianSlug,
      ]
        .map((v) => String(v || "").toLowerCase())
        .join(" ");

      return haystack.includes(q);
    });
  }, [applications, query]);

  const handleCopyPresentedApplicants = useCallback(async () => {
    if (!presentedApplications.length) {
      toast.info("There are no presented applicants to copy.");
      return;
    }

 const lines = presentedApplications.map((application) => {
  const shortName = getApplicantShortDisplayName(application);
  const profileLink = getApplicantProfileLink(application, job?._id || "");
  return profileLink ? `${shortName} – ${profileLink}` : shortName;
});

    const text = lines.join("\n");

    try {
      setCopyingPresented(true);
      await navigator.clipboard.writeText(text);
      toast.success("Presented applicants copied to clipboard.");
    } catch (err) {
      console.error("❌ Failed to copy presented applicants:", err);
      toast.error("Could not copy presented applicants.");
    } finally {
      setCopyingPresented(false);
    }
  }, [presentedApplications]);

  const handleOpenManualAdd = useCallback(() => {
    setManualAddOpen(true);
    setManualAddQuery("");
    setManualAddResults([]);
  }, []);

  const handleSearchManualApplicants = useCallback(
    async (event) => {
      event?.preventDefault?.();

      const trimmedQuery = normaliseString(manualAddQuery);
      if (!trimmedQuery) {
        toast.error("Search for a musician by name, email, phone or instrument.");
        return;
      }

      try {
        setSearchingMusicians(true);

        const res = await axios.get(`${backendUrl}/api/musician/search`, {
          params: { query: trimmedQuery },
          headers,
          withCredentials: true,
        });

        const results = Array.isArray(res.data?.musicians)
          ? res.data.musicians
          : Array.isArray(res.data?.results)
            ? res.data.results
            : Array.isArray(res.data?.data)
              ? res.data.data
              : [];

        setManualAddResults(results);

        if (!results.length) {
          toast.info("No musicians found for that search.");
        }
      } catch (err) {
        console.error("❌ Failed to search musicians:", err);
        toast.error(err?.response?.data?.message || err?.message || "Failed to search musicians");
      } finally {
        setSearchingMusicians(false);
      }
    },
    [headers, manualAddQuery]
  );

  const handleManualApply = useCallback(
    async (musician) => {
      const musicianId = normaliseString(musician?._id || musician?.id || musician?.musicianId || "");
      if (!musicianId) {
        toast.error("That musician is missing an ID.");
        return;
      }

      const displayName = getMusicianDisplayName(musician);
      const confirmed = window.confirm(`Add ${displayName} as an applicant?`);
      if (!confirmed) return;

      try {
        setManuallyApplyingId(musicianId);

        const res = await axios.post(
          `${backendUrl}/api/deputy-jobs/${id}/manual-apply`,
          { musicianId },
          { headers, withCredentials: true }
        );

        if (!res.data?.success) {
          throw new Error(res.data?.message || "Failed to manually add applicant");
        }

        toast.success(res.data?.message || "Applicant added");
        setManualAddOpen(false);
        setManualAddQuery("");
        setManualAddResults([]);
        await loadApplications();
      } catch (err) {
        console.error("❌ Failed to manually add applicant:", err);
        toast.error(err?.response?.data?.message || err?.message || "Failed to manually add applicant");
      } finally {
        setManuallyApplyingId("");
      }
    },
    [headers, id, loadApplications]
  );

  const handleManualApplyAndPresent = useCallback(
    async (musician) => {
      const musicianId = normaliseString(musician?._id || musician?.id || musician?.musicianId || "");
      if (!musicianId) {
        toast.error("That musician is missing an ID.");
        return;
      }

      const displayName = getMusicianDisplayName(musician);
      const confirmed = window.confirm(`Add ${displayName} as an applicant and present them to the client?`);
      if (!confirmed) return;

      try {
        setManuallyApplyAndPresentId(musicianId);

        const res = await axios.post(
          `${backendUrl}/api/deputy-jobs/${id}/manual-apply-and-present`,
          { musicianId },
          { headers, withCredentials: true }
        );

        if (!res.data?.success) {
          throw new Error(res.data?.message || "Failed to manually add and present applicant");
        }

        toast.success(res.data?.message || "Applicant added and presented");
        setManualAddOpen(false);
        setManualAddQuery("");
        setManualAddResults([]);
        await loadApplications();
      } catch (err) {
        console.error("❌ Failed to manually add and present applicant:", err);
        toast.error(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to manually add and present applicant"
        );
      } finally {
        setManuallyApplyAndPresentId("");
      }
    },
    [headers, id, loadApplications]
  );

  const handleAllocateApplicant = useCallback(
    async (application) => {
      const musicianId = String(application?.musicianId || "").trim();
      if (!musicianId) {
        toast.error("This applicant is missing a musician ID.");
        return;
      }

      const confirmed = window.confirm(`Allocate this job to ${application.fullName || "this applicant"}?`);
      if (!confirmed) return;

      try {
        setAssigningId(musicianId);

        const res = await axios.post(
          `${backendUrl}/api/deputy-jobs/${id}/manual-allocate`,
          { musicianId },
          { headers, withCredentials: true }
        );

        if (!res.data?.success) {
          throw new Error(res.data?.message || "Failed to allocate applicant");
        }

        toast.success(res.data?.message || "Applicant allocated");
        await loadApplications();
      } catch (err) {
        console.error("❌ Failed to allocate applicant:", err);
        toast.error(err?.response?.data?.message || err?.message || "Failed to allocate applicant");
      } finally {
        setAssigningId("");
      }
    },
    [headers, id, loadApplications]
  );

  const handlePresentApplicant = useCallback(
    async (application) => {
      const musicianId = String(application?.musicianId || "").trim();
      if (!musicianId) {
        toast.error("This applicant is missing a musician ID.");
        return;
      }

      const confirmed = window.confirm(
        `Present ${application.fullName || "this applicant"} to the client?`
      );
      if (!confirmed) return;

      try {
        setPresentingId(musicianId);

        const res = await axios.post(
          `${backendUrl}/api/deputy-jobs/${id}/present-applicant`,
          { musicianId },
          { headers, withCredentials: true }
        );

        if (!res.data?.success) {
          throw new Error(res.data?.message || "Failed to present applicant");
        }

        toast.success(res.data?.message || "Applicant presented");
        await loadApplications();
      } catch (err) {
        console.error("❌ Failed to present applicant:", err);
        toast.error(err?.response?.data?.message || err?.message || "Failed to present applicant");
      } finally {
        setPresentingId("");
      }
    },
    [headers, id, loadApplications]
  );

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl rounded-2xl bg-white p-6 shadow">
        <p className="text-sm text-gray-600">Loading applications…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl rounded-2xl bg-white p-6 shadow">
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

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="rounded-2xl bg-white p-6 shadow">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <Link
              to={`/deputy-jobs/${id}`}
              className="mb-3 inline-block text-sm text-gray-500 hover:text-black"
            >
              ← Back to deputy job
            </Link>

            <h1 className="text-2xl font-semibold text-gray-900">
              Manage applications
            </h1>

            <p className="mt-2 text-sm text-gray-600">
              {job?.title || "Deputy job"}
            </p>

            <p className="mt-1 text-sm text-gray-500">
              {formatDateLong(job?.eventDate)} · {job?.location || "Location TBC"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge>{formatLabel(job?.status, "Unknown")}</Badge>
            <Badge>{formatLabel(job?.workflowStage, "—")}</Badge>
            <Badge tone="yellow">{applications.length} applications</Badge>

            <button
              type="button"
              onClick={handleCopyPresentedApplicants}
              disabled={!presentedApplications.length || copyingPresented}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {copyingPresented
                ? "Copying…"
                : `Copy presented list${presentedApplications.length ? ` (${presentedApplications.length})` : ""}`}
            </button>

            {canManageThisJob ? (
              <button
                type="button"
                onClick={handleOpenManualAdd}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Manual add applicant
              </button>
            ) : null}

            <button
              type="button"
              onClick={loadApplications}
              className="rounded-lg bg-black px-4 py-2 text-sm text-white hover:bg-[#ff6667]"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Applicants</h2>

          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search applicants"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm md:max-w-xs"
          />
        </div>

        {filteredApplications.length ? (
          <div className="space-y-3">
            {filteredApplications.map((application) => {
              const musicianId = String(application?.musicianId || "");
              const status = String(application?.status || "applied").toLowerCase();
              const isAssigned = ["allocated", "booked", "assigned"].includes(status);
const profileLink = getApplicantProfileLink(application, job?._id || "");
              return (
                <div
                  key={musicianId || `${application.fullName}-${application.appliedAt}`}
                  className="rounded-xl border border-gray-200 p-4"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {application.fullName || "Unnamed applicant"}
                      </p>

                      {profileLink ? (
                        <a
                          href={profileLink}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 inline-block text-sm text-[#ff6667] hover:underline"
                        >
                          View profile
                        </a>
                      ) : null}

                      {application.email ? (
                        <p className="text-sm text-gray-500">{application.email}</p>
                      ) : null}

                      {application.phone ? (
                        <p className="text-sm text-gray-500">{application.phone}</p>
                      ) : null}

                      <p className="mt-2 text-xs text-gray-500">
                        Applied {formatDateTime(application.appliedAt)}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        tone={
                          status === "booked" || status === "allocated"
                            ? "green"
                            : status === "presented"
                              ? "yellow"
                              : "default"
                        }
                      >
                        {formatLabel(status, "Applied")}
                      </Badge>

                      {typeof application.deputyMatchScore === "number" ? (
  <Badge>{Math.round(application.deputyMatchScore * 100)}% match</Badge>
) : null}
                    </div>
                  </div>

                  {canManageThisJob ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {!isEnquiryJob && !isAssigned ? (
                        <button
                          type="button"
                          onClick={() => handleAllocateApplicant(application)}
                          disabled={assigningId === musicianId}
                          className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white hover:bg-[#ff6667] disabled:opacity-60"
                        >
                          {assigningId === musicianId ? "Allocating…" : "Allocate applicant"}
                        </button>
                      ) : null}

                      {canPresentApplicants && !isAssigned ? (
                        <button
                          type="button"
                          onClick={() => handlePresentApplicant(application)}
                          disabled={presentingId === musicianId}
                          className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-60"
                        >
                          {presentingId === musicianId ? "Sending…" : "Present applicant"}
                        </button>
                      ) : null}

                      {status === "presented" ? (
                        <button
                          type="button"
                          onClick={handleCopyPresentedApplicants}
                          disabled={copyingPresented}
                          className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                        >
                          {copyingPresented ? "Copying…" : "Copy presented list"}
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No applications found.</p>
        )}
      </div>

      {manualAddOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-6 py-5">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Manual add applicant</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Search for a musician, then either add them as an applicant or add and present them immediately.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setManualAddOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-800"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="px-6 py-5">
              <form onSubmit={handleSearchManualApplicants} className="flex flex-col gap-3 md:flex-row">
                <input
                  value={manualAddQuery}
                  onChange={(e) => setManualAddQuery(e.target.value)}
                  placeholder="Search by name, email, phone, instrument..."
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-black"
                />
                <button
                  type="submit"
                  disabled={searchingMusicians}
                  className="rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-[#ff6667] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {searchingMusicians ? "Searching…" : "Search"}
                </button>
              </form>

              <div className="mt-4 max-h-[420px] overflow-y-auto rounded-xl border border-gray-200">
                {manualAddResults.length ? (
                  <div className="divide-y divide-gray-100">
                    {manualAddResults.map((musician) => {
                      const musicianId = normaliseString(
                        musician?._id || musician?.id || musician?.musicianId || ""
                      );
                      const displayName = getMusicianDisplayName(musician);
                      const email = normaliseString(
                        musician?.email || musician?.basicInfo?.email || ""
                      );
                      const phone = normaliseString(
                        musician?.phone || musician?.phoneNumber || musician?.basicInfo?.phone || ""
                      );
                      const profileLink = getMusicianProfileLink(musician);
                      const alreadyApplied = existingApplicationMusicianIds.has(musicianId);

                      return (
                        <div
                          key={musicianId || `${displayName}-${email}`}
                          className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-gray-900">
                              {displayName}
                            </p>

                            {profileLink ? (
                              <a
                                href={profileLink}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-1 inline-block text-sm text-[#ff6667] hover:underline"
                              >
                                View profile
                              </a>
                            ) : null}

                            <p className="mt-1 truncate text-xs text-gray-500">
                              {[email, phone].filter(Boolean).join(" • ") || "No contact details"}
                            </p>

                            {alreadyApplied ? (
                              <p className="mt-2 text-xs font-medium text-amber-700">
                                Already on this applications list
                              </p>
                            ) : null}
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => handleManualApply(musician)}
                              disabled={!musicianId || alreadyApplied || manuallyApplyingId === musicianId || manuallyApplyAndPresentId === musicianId}
                              className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {manuallyApplyingId === musicianId ? "Adding…" : "Add applicant"}
                            </button>

                            {canPresentApplicants ? (
                              <button
                                type="button"
                                onClick={() => handleManualApplyAndPresent(musician)}
                                disabled={!musicianId || alreadyApplied || manuallyApplyAndPresentId === musicianId || manuallyApplyingId === musicianId}
                                className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {manuallyApplyAndPresentId === musicianId
                                  ? "Adding & presenting…"
                                  : "Add and present"}
                              </button>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 text-sm text-gray-500">
                    Search for a musician to add manually.
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
              <button
                type="button"
                onClick={() => setManualAddOpen(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ManageDeputyApplications;
