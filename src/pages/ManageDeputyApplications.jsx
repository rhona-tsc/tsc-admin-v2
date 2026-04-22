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

  const isEnquiryJob = String(job?.jobType || "").trim().toLowerCase() === "enquiry";

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
                        <Badge>{Math.round(application.deputyMatchScore)} score</Badge>
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

                      {isEnquiryJob && !isAssigned ? (
                        <button
                          type="button"
                          onClick={() => handlePresentApplicant(application)}
                          disabled={presentingId === musicianId}
                          className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-60"
                        >
                          {presentingId === musicianId ? "Sending…" : "Present applicant"}
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
    </div>
  );
};

export default ManageDeputyApplications;