import React, { useMemo, useState } from "react";
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

const getAuthHeaders = () => {
  const { token, source } = getBestAuthToken();

  console.log("🔐 DeputyJobApplyButton token selected", {
    source,
    tokenPresent: Boolean(token),
    tokenLength: token?.length || 0,
    expired: token ? isTokenExpired(token) : false,
  });

  return token
    ? {
        Authorization: `Bearer ${token}`,
        token,
      }
    : {};
};

const DeputyJobApplyButton = ({
  job,
  onApplied,
  className = "",
  size = "default",
  showMissingInline = true,
}) => {
  const [isApplying, setIsApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [missingFields, setMissingFields] = useState([]);
const [sessionError, setSessionError] = useState("");
  const status = String(job?.status || "open").toLowerCase();
  const isAssigned =
    status === "assigned" || status === "allocated" || status === "filled";
  const isClosed = status === "closed" || status === "cancelled";
  const isOpen = status === "open" || status === "preview";

  const alreadyApplied = useMemo(() => {
    if (hasApplied) return true;
    if (job?.hasApplied === true) return true;
    if (job?.alreadyApplied === true) return true;
    if (job?.userHasApplied === true) return true;
    return false;
  }, [job?.hasApplied, job?.alreadyApplied, job?.userHasApplied, hasApplied]);

  const buttonText = useMemo(() => {
    if (isApplying) return "Applying…";
    if (alreadyApplied) return "Applied";
    if (isAssigned) return "Filled";
    if (isClosed) return "Closed";
    return "1-Click Apply";
  }, [alreadyApplied, isApplying, isAssigned, isClosed]);

  const sizeClasses =
    size === "small"
      ? "px-3 py-2 text-xs rounded-full"
      : "px-4 py-2.5 text-sm rounded-full";

  const disabled = isApplying || alreadyApplied || !isOpen;

  const baseClasses = disabled
    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
    : "bg-[#ff6667] text-white hover:bg-black";

const handleApply = async () => {
  setSessionError("");
  if (!job?._id || disabled) return;

  try {
    setIsApplying(true);
    setMissingFields([]);

    const { token, source } = getBestAuthToken();
    const headers = token
      ? {
          Authorization: `Bearer ${token}`,
          token,
        }
      : {};

    console.log("📨 Applying to deputy job", {
      jobId: job._id,
      status,
      tokenSource: source,
      tokenPresent: Boolean(token),
      tokenExpired: token ? isTokenExpired(token) : false,
      headersPresent: Boolean(headers?.Authorization),
    });

    if (!token) {
      toast.error(
        "You need to log in before applying. Please log out and log back in, then try again."
      );
      return;
    }

    if (isTokenExpired(token)) {
      toast.error(
        "Your session has expired. Please log out and log back in, then try applying again."
      );
      return;
    }

    const { data } = await axios.post(
      `${BACKEND_BASE}/api/deputy-jobs/${job._id}/apply`,
      {},
      {
        headers,
        withCredentials: true,
      }
    );

    console.log("✅ apply response", data);

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
      data: error?.response?.data,
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
      /unauthorized/i.test(responseMessage) ||
      /forbidden/i.test(responseMessage);

    if (authProblem) {
      setSessionError(
  "Your login session looks out of date. Please log out and log back in, then try again."
);
toast.error(
  "Your login session looks out of date. Please log out and log back in, then try applying again."
);
return;
  
    }

    toast.error(
      responseMessage ||
        error?.message ||
        "Failed to apply for this deputy job"
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
{sessionError ? (
  <div className="text-xs text-red-600 leading-5">
    {sessionError}
  </div>
) : null}
      {showMissingInline && missingFields.length > 0 ? (
        <div className="text-xs text-red-600 leading-5">
          Complete your profile to apply: {missingFields.join(", ")}.
        </div>
      ) : null}
    </div>
  );
};

export default DeputyJobApplyButton;