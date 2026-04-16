import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import Title from "../components/Title";
import DeputyJobCard from "../components/DeputyJobCard";
import DeputyJobPreviewPanel from "../components/DeputyJobPreviewPanel";

const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/+$/, "");

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

const formatDate = (dateString) => {
  if (!dateString) return "Date TBC";

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "Date TBC";

  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const getFeeLabel = (job) => {
  const fee = Number(job?.fee || 0);
  if (!fee) return "Fee TBC";
  return `£${fee.toLocaleString("en-GB")}`;
};

const hasStoredCardForJob = (job = {}) => {
  const paymentStatus = String(job?.paymentStatus || "").toLowerCase();
  const jobType = String(job?.jobType || "booked").toLowerCase();

  if (jobType === "enquiry") return true;
  if (job?.defaultPaymentMethodId) return true;

  return ["ready_to_charge", "charge_pending", "paid"].includes(paymentStatus);
};



const sortJobs = (jobs, sortType) => {
  const copy = [...jobs];

  switch (sortType) {
    case "fee_high_low":
      return copy.sort((a, b) => Number(b?.fee || 0) - Number(a?.fee || 0));
    case "fee_low_high":
      return copy.sort((a, b) => Number(a?.fee || 0) - Number(b?.fee || 0));
    case "newest":
      return copy.sort(
        (a, b) =>
          new Date(b?.createdAt || 0).getTime() - new Date(a?.createdAt || 0).getTime()
      );
    case "date_asc":
    default:
      return copy.sort(
        (a, b) =>
          new Date(a?.date || a?.eventDate || 0).getTime() -
          new Date(b?.date || b?.eventDate || 0).getTime()
      );
  }
};

const DeputyJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hoveredJob, setHoveredJob] = useState(null);
  const [sortType, setSortType] = useState("date_asc");
  const [loadingClose, setLoadingClose] = useState(false);
  const [showEnquiryOnly, setShowEnquiryOnly] = useState(false);

const [filters, setFilters] = useState({
  search: "",
  instrument: "",
  onlyOpen: false,
});
  const authToken =
    localStorage.getItem("token") ||
    localStorage.getItem("adminToken") ||
    localStorage.getItem("musicianToken") ||
    sessionStorage.getItem("token") ||
    "";


  const authHeaders = useMemo(
  () =>
    authToken
      ? {
          Authorization: `Bearer ${authToken}`,
          token: authToken,
        }
      : {},
  [authToken]
);

  const currentUser = useMemo(() => {
    const tokenPayload = parseJwtPayload(authToken);

    return {
      _id:
        tokenPayload?._id ||
        tokenPayload?.id ||
        tokenPayload?.userId ||
        "",
      id:
        tokenPayload?.id ||
        tokenPayload?._id ||
        tokenPayload?.userId ||
        "",
      email:
        tokenPayload?.email ||
        tokenPayload?.useremail ||
        localStorage.getItem("userEmail") ||
        sessionStorage.getItem("userEmail") ||
        "",
      role:
        tokenPayload?.role ||
        tokenPayload?.userrole ||
        localStorage.getItem("userRole") ||
        sessionStorage.getItem("userRole") ||
        "",
    };
  }, [authToken]);

const currentUserEmail = String(currentUser?.email || "").trim().toLowerCase();
const currentUserRole = String(currentUser?.role || "").trim().toLowerCase();
const canCreateEnquiryJob =
  currentUserRole === "admin" ||
  currentUserRole === "agent" ||
  currentUserEmail === "hello@thesupremecollective.co.uk";

const handleCloseJob = async (job) => {
  if (!job?._id || loadingClose) return;

  const confirmed = window.confirm(
    `Close the deputy job "${job.title || "Untitled job"}"?`
  );

  if (!confirmed) return;

  try {
    setLoadingClose(true);

    const { data } = await axios.post(
      `${BACKEND_URL}/api/deputy-jobs/${job._id}/close`,
      {},
      {
        headers: authHeaders,
        withCredentials: true,
      }
    );

    if (!data?.success) {
      throw new Error(data?.message || "Failed to close deputy job");
    }

    toast.success("Deputy job closed");
    await fetchJobs();
  } catch (error) {
    console.error("❌ Failed to close deputy job:", error);
    toast.error(
      error?.response?.data?.message ||
        error?.message ||
        "Failed to close deputy job"
    );
  } finally {
    setLoadingClose(false);
  }
};

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const { data } = await axios.get(`${BACKEND_URL}/api/deputy-jobs`, {
        headers: authHeaders,
        withCredentials: true,
      });

      const nextJobs = Array.isArray(data?.jobs) ? data.jobs : [];
      setJobs(nextJobs);

      setHoveredJob((prev) => {
        if (!nextJobs.length) return null;
        if (!prev?._id) return nextJobs[0];
        return nextJobs.find((job) => String(job._id) === String(prev._id)) || nextJobs[0];
      });
    } catch (err) {
      console.error("❌ Failed to fetch deputy jobs:", err);
      setError(err?.response?.data?.message || "Could not load deputy jobs.");
      setJobs([]);
      setHoveredJob(null);
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const availableInstruments = useMemo(() => {
    const values = new Set();

    jobs.forEach((job) => {
      const instruments = Array.isArray(job?.requiredInstruments)
        ? job.requiredInstruments
        : [];

      instruments.forEach((instrument) => {
        const value = String(instrument || "").trim();
        if (value) values.add(value);
      });
    });

    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [jobs]);

const filteredJobs = useMemo(() => {
  const query = filters.search.trim().toLowerCase();
  const instrumentFilter = filters.instrument.trim().toLowerCase();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

  const next = jobs.filter((job) => {
    const status = String(job?.status || "open").toLowerCase();
    const jobType = String(job?.jobType || "booked").toLowerCase();

    const requiresStoredCard =
      jobType !== "enquiry" &&
      ["open", "allocated", "filled", "closed", "cancelled"].includes(status);

    if (requiresStoredCard && !hasStoredCardForJob(job)) {
      return false;
    }

    if (showEnquiryOnly && jobType !== "enquiry") {
      return false;
    }

    // If Open jobs only is NOT ticked, keep allocated/filled/closed/cancelled
    // visible for 7 days, then hide them. Jobs that require payment setup
    // are also hidden until a stored card is attached.
    if (
      !filters.onlyOpen &&
      ["allocated", "filled", "closed", "cancelled"].includes(status)
    ) {
      const updatedAt = new Date(
        job?.updatedAt || job?.allocatedAt || job?.bookingConfirmedAt || 0
      ).getTime();

      if (updatedAt && Date.now() - updatedAt > sevenDaysMs) {
        return false;
      }
    }

    if (instrumentFilter) {
      const instruments = Array.isArray(job?.requiredInstruments)
        ? job.requiredInstruments.map((item) =>
            String(item || "").toLowerCase()
          )
        : [];

      if (!instruments.some((item) => item.includes(instrumentFilter))) {
        return false;
      }
    }

    if (!query) return true;

    const haystack = [
      job?.title,
      job?.venue,
      job?.location,
      job?.notes,
      ...(Array.isArray(job?.requiredInstruments) ? job.requiredInstruments : []),
      ...(Array.isArray(job?.requiredSkills) ? job.requiredSkills : []),
      ...(Array.isArray(job?.tags) ? job.tags : []),
      ...(Array.isArray(job?.setLengths) ? job.setLengths : []),
      ...(Array.isArray(job?.whatsIncluded) ? job.whatsIncluded : []),
      ...(Array.isArray(job?.claimableExpenses) ? job.claimableExpenses : []),
    ]
      .map((value) => String(value || "").toLowerCase())
      .join(" ");

    return haystack.includes(query);
  });

  return sortJobs(next, sortType);
}, [jobs, filters, sortType, showEnquiryOnly]);
  useEffect(() => {
    if (!filteredJobs.length) {
      setHoveredJob(null);
      return;
    }

    setHoveredJob((prev) => {
      if (!prev?._id) return filteredJobs[0];
      return (
        filteredJobs.find((job) => String(job._id) === String(prev._id)) || filteredJobs[0]
      );
    });
  }, [filteredJobs]);

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between mb-8">
        <div>
          <Title text1="DEPUTY" text2="JOBS" />
          <p className="text-sm text-gray-500 mt-3 max-w-2xl">
            Browse deputy jobs, including previews, hover to preview full details, and jump into
            applicants or allocation from the job panel.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            to="/deputy-jobs/create"
            className="inline-flex items-center justify-center rounded bg-black px-4 py-2 text-sm font-medium text-white hover:bg-[#ff6667] transition-colors"
          >
            + Create deputy job
          </Link>

          {canCreateEnquiryJob ? (
            <label className="inline-flex items-center gap-2 rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={showEnquiryOnly}
                onChange={(e) => setShowEnquiryOnly(e.target.checked)}
              />
              Enquiry jobs only
            </label>
          ) : null}

          <button
            type="button"
            onClick={fetchJobs}
            className="inline-flex items-center justify-center rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-6 mb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <input
            type="text"
            value={filters.search}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                search: e.target.value,
              }))
            }
            placeholder="Search by title, venue, location or skill"
            className="w-full sm:max-w-sm rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-black"
          />

          <select
            value={filters.instrument}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                instrument: e.target.value,
              }))
            }
            className="rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-black"
          >
            <option value="">All instruments</option>
            {availableInstruments.map((instrument) => (
              <option key={instrument} value={instrument}>
                {instrument}
              </option>
            ))}
          </select>

          <select
            value={sortType}
            onChange={(e) => setSortType(e.target.value)}
            className="rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-black"
          >
            <option value="date_asc">Sort: Event date</option>
            <option value="newest">Sort: Newest first</option>
            <option value="fee_high_low">Sort: Fee high to low</option>
            <option value="fee_low_high">Sort: Fee low to high</option>
          </select>

          <label className="inline-flex items-center gap-2 text-sm text-gray-700 px-1 py-2">
            <input
              type="checkbox"
              checked={filters.onlyOpen}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  onlyOpen: e.target.checked,
                }))
              }
            />
            Open jobs only
          </label>
        </div>

        <div className="hidden lg:flex lg:items-center lg:justify-end text-sm text-gray-500">
          {filteredJobs.length} {filteredJobs.length === 1 ? "job" : "jobs"}
          {showEnquiryOnly ? " • enquiry only" : ""}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_420px] gap-6">
        <div className="min-w-0">
          {loading ? (
            <div className="rounded border border-gray-200 bg-white p-8 text-center text-gray-500">
              Loading deputy jobs...
            </div>
          ) : error ? (
            <div className="rounded border border-red-200 bg-red-50 p-6 text-sm text-red-700">
              {error}
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="rounded border border-gray-200 bg-white p-8 text-center text-gray-500">
              No deputy jobs match your current filters.
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {filteredJobs.map((job) => (
                <div
                  key={job._id}
                  onMouseEnter={() => setHoveredJob(job)}
                  className="transition-all duration-150"
                >
                  <DeputyJobCard
                    job={job}
                    isActive={String(hoveredJob?._id || "") === String(job._id)}
                    onHover={() => setHoveredJob(job)}
                    onRefresh={fetchJobs}
                    subtitle={`${formatDate(job?.date || job?.eventDate)} • ${getFeeLabel(job)}`}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="hidden lg:block">
          {hoveredJob ? (
            <div className="sticky top-6">
            <DeputyJobPreviewPanel
  hoveredJob={hoveredJob}
  onRefresh={fetchJobs}
  authHeaders={authHeaders}
  currentUser={currentUser}
  onCloseJob={handleCloseJob}
   loadingClose={loadingClose}
/>
            </div>
          ) : ( 
            <div className="sticky top-6 rounded border border-gray-200 bg-white p-8 text-center text-gray-500">
              Hover over a deputy job to preview the details here.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeputyJobs;