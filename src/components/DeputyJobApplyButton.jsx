

import React, { useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const BACKEND_BASE = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/+$/, "");

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

  const status = String(job?.status || "open").toLowerCase();
  const isAssigned = status === "assigned";
  const isClosed = status === "closed";
  const isOpen = status === "open";

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
    : "bg-black text-white hover:bg-[#ff6667]";

  const handleApply = async () => {
    if (!job?._id || disabled) return;

    try {
      setIsApplying(true);
      setMissingFields([]);

      const { data } = await axios.post(
        `${BACKEND_BASE}/api/deputy-opportunities/${job._id}/apply`,
      );

      if (!data?.success) {
        throw new Error(data?.message || "Failed to apply for this opportunity");
      }

      setHasApplied(true);
      toast.success(data?.message || "Application submitted successfully.");

      if (typeof onApplied === "function") {
        onApplied({
          jobId: job._id,
          application: data?.application || null,
        });
      }
    } catch (error) {
      const responseMessage = error?.response?.data?.message;
      const missing = Array.isArray(error?.response?.data?.missing)
        ? error.response.data.missing
        : [];

      if (missing.length) {
        setMissingFields(missing);
      }

      toast.error(
        responseMessage || error?.message || "Failed to apply for this opportunity",
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