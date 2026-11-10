import React, { useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useLocation, useNavigate } from "react-router-dom";
import { loginPathFor } from "../utils/loginReturnPath";

const BACKEND_BASE = (import.meta.env.VITE_BACKEND_URL || "").replace(
  /\/+$/,
  "",
);

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

const isTokenExpired = (token = "") => {
  try {
    const payload = parseJwtPayload(token);
    const exp = Number(payload?.exp || 0);
    if (!exp) return false;
    return Date.now() >= exp * 1000;
  } catch {
    return false;
  }
};

const getBestAuthToken = () => {
  const candidates = [
    {
      source: "localStorage.musicianToken",
      token: localStorage.getItem("musicianToken") || "",
    },
    {
      source: "localStorage.adminToken",
      token: localStorage.getItem("adminToken") || "",
    },
    {
      source: "sessionStorage.token",
      token: sessionStorage.getItem("token") || "",
    },
    {
      source: "localStorage.token",
      token: localStorage.getItem("token") || "",
    },
  ];

  const validCandidate = candidates.find(
    ({ token }) => token && !isTokenExpired(token),
  );

  if (validCandidate) {
    return validCandidate;
  }

  const fallbackCandidate = candidates.find(({ token }) => token);

  return fallbackCandidate || { source: "none", token: "" };
};

const DeputyJobApplyButton = ({
  job,
  onApplied,
  className = "",
  size = "default",
  showMissingInline = true,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isApplying, setIsApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [missingFields, setMissingFields] = useState([]);
  const status = String(job?.status || "open").toLowerCase();
  const isAssigned =
    status === "assigned" || status === "allocated" || status === "filled";
  const isClosed = status === "closed" || status === "cancelled";
  const isOpen = status === "open" || status === "preview";
  const isMultiRole =
    Array.isArray(job?.requiredInstruments) &&
    job.requiredInstruments.filter(Boolean).length > 1;

  const alreadyApplied = useMemo(() => {
    if (hasApplied) return true;
    if (job?.hasApplied === true) return true;
    if (job?.alreadyApplied === true) return true;
    if (job?.userHasApplied === true) return true;
    return false;
  }, [job?.hasApplied, job?.alreadyApplied, job?.userHasApplied, hasApplied]);

  const buttonText = useMemo(() => {
    if (isApplying) return "Applying…";
    if (isMultiRole)
      return alreadyApplied ? "Add another role" : "Choose roles";
    if (alreadyApplied) return "Applied";
    if (isAssigned) return "Filled";
    if (isClosed) return "Closed";
    return "1-Click Apply";
  }, [alreadyApplied, isApplying, isAssigned, isClosed, isMultiRole]);

  const sizeClasses =
    size === "small"
      ? "px-3 py-2 text-xs rounded-full"
      : "px-4 py-2.5 text-sm rounded-full";

  const disabled = isApplying || (!isMultiRole && alreadyApplied) || !isOpen;

  const baseClasses = disabled
    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
    : "bg-[#ff6667] text-white hover:bg-black";

  const handleApply = async () => {
    if (!job?._id || disabled) return;

    const redirectToLogin = () => {
      for (const key of ["token", "adminToken", "musicianToken"]) {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      }
      toast.info("Please log in or create an account. We’ll bring you back here to apply.");
      navigate(loginPathFor(location));
    };
    const auth = getBestAuthToken();
    if (!auth.token || isTokenExpired(auth.token)) {
      redirectToLogin();
      return;
    }

    if (isMultiRole) {
      navigate(`/deputy-jobs/${job._id}`);
      return;
    }

    try {
      setIsApplying(true);
      setMissingFields([]);

      const { token } = auth;
      const headers = token
        ? {
            Authorization: `Bearer ${token}`,
            token,
          }
        : {};

      const { data } = await axios.post(
        `${BACKEND_BASE}/api/deputy-jobs/${job._id}/apply`,
        {},
        {
          headers,
          withCredentials: true,
        },
      );

      if (!data?.success) {
        throw new Error(data?.message || "Failed to apply for this deputy job");
      }

      setHasApplied(true);

      toast.success(data?.message || "Application submitted successfully.");

      if (typeof onApplied === "function") {
        onApplied({
          jobId: job._id,
          application: data?.application || null,
          job: data?.job || null,
        });
      }
    } catch (error) {
      const responseStatus = error?.response?.status;
      const responseMessage = error?.response?.data?.message || "";
      const missing = Array.isArray(error?.response?.data?.missing)
        ? error.response.data.missing
        : [];

      console.error("❌ One-click apply failed", {
        jobId: job?._id,
        status: responseStatus,
        message: error?.message,
      });

      if (missing.length) {
        setMissingFields(missing);
      }

      const authProblem =
        responseStatus === 401 ||
        /jwt expired/i.test(responseMessage) ||
        /jwt malformed/i.test(responseMessage) ||
        /invalid token/i.test(responseMessage) ||
        /unauthorized/i.test(responseMessage);

      if (authProblem) {
        redirectToLogin();
        return;
      }

      toast.error(
        responseMessage ||
          error?.message ||
          "Failed to apply for this deputy job",
      );
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={handleApply}
        disabled={disabled}
        className={`${sizeClasses} ${baseClasses} font-medium transition-colors duration-200 ${className}`.trim()}
      >
        {buttonText}
      </button>
      {showMissingInline && missingFields.length > 0 ? (
        <div className="text-xs text-red-600 leading-5">
          Complete your profile to apply: {missingFields.join(", ")}.
        </div>
      ) : null}
    </div>
  );
};

export default DeputyJobApplyButton;
