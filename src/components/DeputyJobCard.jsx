import React from "react";

const formatMoney = (value, fallback = "Fee TBC") => {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return fallback;

  return `£${n
    .toLocaleString("en-GB", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
    .replace(/\.00$/, "")}`;
};

const formatDate = (value) => {
  if (!value) return "Date TBC";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatTimeRange = (callTime, finishTime) => {
  if (callTime && finishTime) return `${callTime} – ${finishTime}`;
  if (callTime) return `From ${callTime}`;
  if (finishTime) return `Until ${finishTime}`;
  return "Times TBC";
};

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

const buildTagList = (job) => {
  const instruments = normaliseArray(job?.requiredInstruments);
  const skills = normaliseArray(job?.requiredSkills);
  const tags = normaliseArray(job?.tags);
  return [...instruments, ...skills, ...tags].slice(0, 6);
};

const statusClasses = {
  open: "bg-green-100 text-green-700 border-green-200",
  preview: "bg-amber-100 text-amber-700 border-amber-200",
  allocated: "bg-orange-100 text-orange-700 border-orange-200",
  filled: "bg-gray-100 text-gray-600 border-gray-200",
  closed: "bg-gray-100 text-gray-600 border-gray-200",
  cancelled: "bg-gray-100 text-gray-600 border-gray-200",
};

const jobTypeClasses = {
  enquiry: "bg-blue-100 text-blue-700 border-blue-200",
  booked: "bg-gray-100 text-gray-700 border-gray-200",
};

const getPostedByLabel = (job) => {
  const createdByEmail = String(job?.createdByEmail || "")
    .trim()
    .toLowerCase();
  if (createdByEmail === "hello@thesupremecollective.co.uk") {
    return "The Supreme Collective";
  }
  return "A Supreme Collective Member";
};

const getClosedNoticeText = (job) => {
  const status = String(job?.status || "").toLowerCase();

  if (!["allocated", "filled", "closed", "cancelled"].includes(status)) {
    return "";
  }

  const baseDate =
    job?.updatedAt || job?.allocatedAt || job?.bookingConfirmedAt || job?.createdAt;

  if (!baseDate) {
    return `This job is ${status} and will disappear from this list soon.`;
  }

  const updatedAtMs = new Date(baseDate).getTime();
  if (Number.isNaN(updatedAtMs)) {
    return `This job is ${status} and will disappear from this list soon.`;
  }

  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const expiryMs = updatedAtMs + sevenDaysMs;
  const remainingMs = expiryMs - Date.now();

  if (remainingMs <= 0) {
    return `This job is ${status} and will disappear from this list soon.`;
  }

  const remainingDays = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));

  return `This job is ${status} and will disappear from this list in ${remainingDays} day${remainingDays === 1 ? "" : "s"}.`;
};

const DeputyJobCard = ({
  job,
  isSelected = false,
  onHover,
  onClick,
  onViewApplicants,
  canManage = false,
  applicationCount = 0,
  isDimmed = false,
}) => {
  if (!job) return null;

  const title = job.title || "Deputy opportunity";
  const venueText =
    job.venue || job.locationName || job.location || "Venue TBC";
  const dateText = formatDate(job.date || job.eventDate);
  const timeText = formatTimeRange(
    job.callTime || job.startTime,
    job.finishTime || job.endTime,
  );
  const jobType = String(job?.jobType || "booked").toLowerCase();
  const isEnquiryJob = jobType === "enquiry" || Boolean(job?.isEnquiryOnly);
  const commissionApplies =
    !isEnquiryJob &&
    (Number(job?.commissionAmount || 0) > 0 ||
      Number(job?.deputyNetAmount || 0) > 0);
  const netFeeValue =
    Number(job?.deputyNetAmount) > 0
      ? Number(job.deputyNetAmount)
      : commissionApplies
        ? Math.max(
            Number(job?.fee || 0) - Number(job?.commissionAmount || 0),
            0,
          )
        : Number(job?.fee || 0);
  const feeText = formatMoney(netFeeValue);
  const status = String(job.status || "open").toLowerCase();
  const isUnavailable = ["allocated", "filled", "closed", "cancelled"].includes(
    status,
  );
  const countyText = job.county || job.address?.county || "";
  const locationText = [venueText, countyText].filter(Boolean).join(", ");
  const statusText =
    status === "allocated"
      ? "Allocated"
      : status === "filled"
        ? "Filled"
        : status === "closed"
          ? "Closed"
          : status === "cancelled"
            ? "Cancelled"
            : status === "preview"
              ? "Preview"
              : "Open";
  const chips = buildTagList(job);
  const commissionText = commissionApplies
    ? `Net after ${formatMoney(job.commissionAmount || 0, "£0")} commission`
    : "";
  const jobTypeText = isEnquiryJob ? "Enquiry" : "Confirmed Booking";
  const postedByLabel = getPostedByLabel(job);
const closedNoticeText = getClosedNoticeText(job);
  const handleApplicantsClick = (event) => {
    event.stopPropagation();
    if (typeof onViewApplicants === "function") {
      onViewApplicants(job);
    }
  };

  const handleCardClick = () => {
    if (typeof onClick === "function") onClick(job);
  };

  const handleMouseEnter = () => {
    if (typeof onHover === "function") onHover(job);
  };


    return (
  <button
    type="button"
    onClick={handleCardClick}
    onMouseEnter={handleMouseEnter}
    className={[
      "w-full rounded-2xl border p-4 text-left focus:outline-none focus:ring-2 focus:ring-black/20 transform-gpu transition duration-300 ease-in-out",
      isUnavailable
        ? "border-gray-200 bg-gray-50 opacity-80"
        : "border-gray-200 bg-white hover:scale-[1.03] hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(0,0,0,0.12)]",
      isSelected
        ? "border-black bg-white ring-2 ring-black/15 scale-[1.02] shadow-[0_20px_45px_rgba(0,0,0,0.16)]"
        : "",
      isDimmed ? "opacity-50 saturate-0" : "",
    ].join(" ")}
  >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3
              className={[
                "truncate text-base font-semibold",
                isSelected ? "text-black" : "text-gray-900",
              ].join(" ")}
            >
              {title}
            </h3>
            <span
              className={[
                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                statusClasses[status] ||
                  "bg-gray-100 text-gray-700 border-gray-200",
              ].join(" ")}
            >
              {statusText}
            </span>
            <span
              className={[
                "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                jobTypeClasses[jobType] || jobTypeClasses.booked,
              ].join(" ")}
            >
              {jobTypeText}
            </span>
          </div>

          <div className="mt-2 space-y-1 text-sm text-gray-600">
            <p>{dateText}</p>
            <p>{timeText}</p>
            <p className="truncate">{locationText}</p>{" "}
          </div>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-lg font-semibold text-gray-900">{feeText}</p>
          {commissionText ? (
            <p className="mt-1 text-xs text-gray-500">{commissionText}</p>
          ) : isEnquiryJob ? (
            <p className="mt-1 text-xs text-gray-500">Potential fee</p>
          ) : null}
        </div>
      </div>

      {chips.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {chips.map((chip, index) => (
            <span
              key={`${chip}-${index}`}
              className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-700"
            >
              {chip}
            </span>
          ))}
        </div>
      )}

      {job.notes && (
        <p className="mt-4 line-clamp-2 text-sm text-gray-600">{job.notes}</p>
      )}
      {closedNoticeText ? (
  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
    {closedNoticeText}
  </div>
) : null}

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="text-xs text-gray-500">Posted by {postedByLabel}</div>

        {canManage && (
          <button
            type="button"
            onClick={handleApplicantsClick}
            className="rounded-full border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:border-black hover:text-black"
          >
            Applicants
            {applicationCount ||
            job?.applicationCount ||
            job?.applications?.length
              ? ` (${applicationCount || job?.applicationCount || job?.applications?.length})`
              : ""}
          </button>
        )}
      </div>
    </button>
  );
};

export default DeputyJobCard;
