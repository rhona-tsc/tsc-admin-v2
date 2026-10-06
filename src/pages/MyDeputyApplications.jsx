import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";

const backendUrl =
  import.meta.env.VITE_BACKEND_URL || "https://tsc-backend-v2.onrender.com";

const formatDate = (value) => {
  if (!value) return "Date TBC";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
};

const titleCase = (value = "") =>
  String(value)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const getOutcome = (job) => {
  const jobStatus = String(job?.status || "open").toLowerCase();
  const applicationStatus = String(
    job?.myApplication?.status || "applied",
  ).toLowerCase();
  const allocatedName =
    job?.allocatedMusicianName || job?.bookedMusicianName || "";

  if (["allocated", "filled"].includes(jobStatus)) {
    return {
      label: allocatedName ? `Allocated to ${allocatedName}` : "Allocated",
      detail:
        applicationStatus === "allocated" || applicationStatus === "booked"
          ? "You were selected for this job."
          : "The client selected another musician.",
      tone:
        applicationStatus === "allocated" || applicationStatus === "booked"
          ? "bg-green-100 text-green-800"
          : "bg-blue-100 text-blue-800",
    };
  }

  if (["closed", "cancelled"].includes(jobStatus)) {
    return {
      label: titleCase(jobStatus),
      detail:
        jobStatus === "cancelled"
          ? "This job was cancelled."
          : "Applications have closed.",
      tone: "bg-gray-100 text-gray-700",
    };
  }

  if (applicationStatus === "presented") {
    return {
      label: "Presented to client",
      detail: "The client is considering your profile.",
      tone: "bg-amber-100 text-amber-800",
    };
  }

  if (applicationStatus === "withdrawn") {
    return {
      label: "Withdrawn",
      detail: "You withdrew this application.",
      tone: "bg-gray-100 text-gray-700",
    };
  }

  return {
    label: jobStatus === "open" ? "Open" : titleCase(jobStatus),
    detail: "Your application is still active.",
    tone: "bg-emerald-100 text-emerald-800",
  };
};

const MyDeputyApplications = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const token = localStorage.getItem("token") || "";
  const musicianId = useMemo(() => {
    try {
      const decoded = jwtDecode(token);
      return String(
        decoded?.userId || decoded?.id || decoded?._id || "",
      ).trim();
    } catch {
      return "";
    }
  }, [token]);

  useEffect(() => {
    const load = async () => {
      if (!musicianId) {
        setError("We could not identify your musician account. Please log in again.");
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`${backendUrl}/api/deputy-jobs`, {
          params: { appliedBy: musicianId, includeHistorical: true },
          headers: {
            token,
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        });
        setJobs(Array.isArray(response.data?.jobs) ? response.data.jobs : []);
      } catch (requestError) {
        console.error("Failed to load deputy applications", requestError);
        setError(
          requestError?.response?.data?.message ||
            "We could not load your applications. Please try again.",
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [musicianId, token]);

  return (
    <div className="mx-auto w-full max-w-5xl p-4 sm:p-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#d84f51]">
            Deputy job board
          </p>
          <h1 className="mt-1 text-3xl font-semibold text-gray-900">
            My applications
          </h1>
          <p className="mt-2 text-gray-600">
            Track every role you have applied for, including closed and allocated jobs.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/deputy-jobs")}
          className="rounded-full bg-black px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#ff6667]"
        >
          View open jobs
        </button>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-gray-600 shadow-sm">
          Loading your applications…
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-800">
          {error}
        </div>
      ) : jobs.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">No applications yet</h2>
          <p className="mt-2 text-gray-600">
            Roles you apply for will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => {
            const outcome = getOutcome(job);
            return (
              <button
                type="button"
                key={job._id}
                onClick={() => navigate(`/deputy-jobs/${job._id}`)}
                className="w-full rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:border-gray-300 hover:shadow-md"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      {job.title || job.instrument || "Deputy opportunity"}
                    </h2>
                    <p className="mt-1 text-sm text-gray-600">
                      {formatDate(job.eventDate || job.date)} · {job.location || job.venue || job.locationName || "Location TBC"}
                    </p>
                    <p className="mt-2 text-sm text-gray-500">{outcome.detail}</p>
                  </div>
                  <span className={`w-fit rounded-full px-3 py-1.5 text-xs font-semibold ${outcome.tone}`}>
                    {outcome.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyDeputyApplications;
