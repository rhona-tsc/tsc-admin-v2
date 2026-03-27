import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import DeputyJobApplyButton from "./DeputyJobApplyButton";
import DeputyJobApplicantsPanel from "./DeputyJobApplicantsPanel";

const ADMIN_EMAIL = "hello@thesupremecollective.co.uk";

const formatMoney = (value) => {
  const n = Number(value || 0);
  return `£${n.toLocaleString("en-GB", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};

const formatDate = (value) => {
  if (!value) return "TBC";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const formatLabel = (value = "") =>
  String(value)
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());

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

const buildProfilePath = (applicant = {}) => {
  const slug = String(applicant.musicianSlug || "").trim();
  if (slug) return `/musician/${slug}`;

  const id = String(applicant.musicianId || applicant._id || "").trim();
  if (id) return `/musician/${id}`;

  const direct = String(applicant.profileUrl || "").trim();
  if (!direct) return "";

  if (direct.startsWith("/musician/")) return direct;

  try {
    const parsed = new URL(direct, window.location.origin);
    if (parsed.pathname.startsWith("/musician/")) {
      return parsed.pathname;
    }
  } catch {
    // ignore malformed URLs and fall through
  }

  return "";
};

const DeputyJobPreviewPanel = ({
  hoveredJob,
  currentUser,
  onApply,
  onAssignApplicant,
  onCloseJob,
  onRefresh,
  loadingApply = false,
  loadingAssign = false,
  loadingClose = false,
}) => {
  const [showApplicants, setShowApplicants] = useState(false);

  const job = hoveredJob?.job || hoveredJob || null;

  const currentUserEmail = String(currentUser?.email || "")
    .toLowerCase()
    .trim();

  const isAdmin = currentUserEmail === ADMIN_EMAIL;

  const isCreator = useMemo(() => {
    if (!job || !currentUser) return false;

    const currentUserId = String(currentUser?._id || currentUser?.id || "");
    const createdBy = String(job?.createdBy || "");
    const createdByEmail = String(job?.createdByEmail || "")
      .toLowerCase()
      .trim();

    return (
      isAdmin ||
      (currentUserId && currentUserId === createdBy) ||
      (currentUserEmail && currentUserEmail === createdByEmail)
    );
  }, [job, currentUser, currentUserEmail, isAdmin]);

  const canManage = isAdmin || isCreator;

  const requiredInstruments = normaliseArray(job?.requiredInstruments);
  const requiredSkills = normaliseArray(job?.requiredSkills);
  const tags = normaliseArray(job?.tags);
  const applicants = Array.isArray(job?.applications) ? job.applications : [];

  if (!job) {
    return (
      <div className="w-full min-h-screen border-l p-6">
        <p className="mt-20 text-center text-gray-500">
          Hover over a deputy job to preview the details
        </p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen border-l p-6">
      <div className="sticky top-0 bg-white pb-4">
        <div className="flex items-start justify-between gap-4 border-b pb-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-gray-400">
              Deputy opportunity
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-gray-900">
              {job.title || "Untitled opportunity"}
            </h2>
            <div className="mt-3 flex flex-wrap gap-2 text-sm text-gray-600">
              <span className="rounded-full bg-gray-100 px-3 py-1">
                {formatDate(job.date)}
              </span>
              {job.callTime ? (
                <span className="rounded-full bg-gray-100 px-3 py-1">
                  Call: {job.callTime}
                </span>
              ) : null}
              {job.finishTime ? (
                <span className="rounded-full bg-gray-100 px-3 py-1">
                  Finish: {job.finishTime}
                </span>
              ) : null}
              <span
                className={`rounded-full px-3 py-1 ${
                  job.status === "assigned"
                    ? "bg-green-100 text-green-700"
                    : job.status === "closed"
                      ? "bg-gray-200 text-gray-700"
                      : "bg-orange-100 text-orange-700"
                }`}
              >
                {formatLabel(job.status || "open")}
              </span>
            </div>
          </div>

          <div className="text-right">
            <p className="text-sm text-gray-500">Fee</p>
            <p className="text-3xl font-semibold text-gray-900">
              {formatMoney(job.fee)}
            </p>
            {job.commissionApplies ? (
              <p className="mt-2 text-sm text-gray-500">
                TSC commission: {job.commissionPercent || 10}% (
                {formatMoney(job.commissionAmount || 0)})
              </p>
            ) : (
              <p className="mt-2 text-sm text-gray-500">No TSC commission</p>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-6 py-6">
        <section>
          <h3 className="mb-3 text-lg font-semibold text-gray-900">Overview</h3>
          <div className="space-y-2 text-gray-600">
            <p>
              <span className="font-medium text-gray-900">Venue:</span>{" "}
              {job.venue || "TBC"}
            </p>
            <p>
              <span className="font-medium text-gray-900">Location:</span>{" "}
              {job.location || "TBC"}
            </p>
            <p>
              <span className="font-medium text-gray-900">Posted by:</span>{" "}
              {job.createdByName || job.createdByEmail || "Member"}
            </p>
            {job.assignedMusicianName ? (
              <p>
                <span className="font-medium text-gray-900">Allocated to:</span>{" "}
                {job.assignedMusicianName}
              </p>
            ) : null}
          </div>
        </section>

        {!!requiredInstruments.length && (
          <section>
            <h3 className="mb-3 text-lg font-semibold text-gray-900">
              Required instruments
            </h3>
            <div className="flex flex-wrap gap-2">
              {requiredInstruments.map((item) => (
                <span
                  key={`instrument-${item}`}
                  className="rounded-full bg-black px-3 py-1 text-sm text-white"
                >
                  {formatLabel(item)}
                </span>
              ))}
            </div>
          </section>
        )}

        {!!requiredSkills.length && (
          <section>
            <h3 className="mb-3 text-lg font-semibold text-gray-900">
              Required skills
            </h3>
            <div className="flex flex-wrap gap-2">
              {requiredSkills.map((item) => (
                <span
                  key={`skill-${item}`}
                  className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700"
                >
                  {formatLabel(item)}
                </span>
              ))}
            </div>
          </section>
        )}

        {!!tags.length && (
          <section>
            <h3 className="mb-3 text-lg font-semibold text-gray-900">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {tags.map((item) => (
                <span
                  key={`tag-${item}`}
                  className="rounded-full border border-gray-200 px-3 py-1 text-sm text-gray-600"
                >
                  {formatLabel(item)}
                </span>
              ))}
            </div>
          </section>
        )}

        {job.notes ? (
          <section>
            <h3 className="mb-3 text-lg font-semibold text-gray-900">Notes</h3>
            <div className="rounded-2xl bg-gray-50 p-4 text-gray-600 whitespace-pre-wrap">
              {job.notes}
            </div>
          </section>
        ) : null}

        <section>
          <div className="flex flex-wrap items-center gap-3">
            <DeputyJobApplyButton
              job={job}
              onApply={onApply}
              loading={loadingApply}
            />

            {canManage ? (
              <button
                type="button"
                onClick={() => setShowApplicants((prev) => !prev)}
                className="rounded bg-gray-100 px-5 py-3 text-sm font-medium text-gray-800 transition hover:bg-gray-200"
              >
                {showApplicants ? "Hide applicants" : `View applicants (${applicants.length})`}
              </button>
            ) : null}

            {canManage && job.status === "open" ? (
              <button
                type="button"
                onClick={() => onCloseJob?.(job)}
                disabled={loadingClose}
                className="rounded border border-red-200 px-5 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loadingClose ? "Closing..." : "Close job"}
              </button>
            ) : null}
          </div>
        </section>

        {canManage && showApplicants ? (
          <section>
            <div className="mb-3 flex items-center justify-between gap-4">
              <h3 className="text-lg font-semibold text-gray-900">Applicants</h3>
              {onRefresh ? (
                <button
                  type="button"
                  onClick={() => onRefresh(job)}
                  className="text-sm font-medium text-gray-500 underline-offset-4 hover:text-black hover:underline"
                >
                  Refresh
                </button>
              ) : null}
            </div>

            {applicants.length ? (
              <DeputyJobApplicantsPanel
                applicants={applicants}
                job={job}
                onAssignApplicant={onAssignApplicant}
                loadingAssign={loadingAssign}
                renderApplicantActions={(applicant) => {
                  const profilePath = buildProfilePath(applicant);

                  return (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {profilePath ? (
                        <Link
                          to={profilePath}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded bg-gray-100 px-3 py-2 text-sm font-medium text-gray-800 transition hover:bg-gray-200"
                        >
                          View profile
                        </Link>
                      ) : null}

                      {job.status === "open" ? (
                        <button
                          type="button"
                          onClick={() => onAssignApplicant?.(job, applicant)}
                          disabled={loadingAssign}
                          className="rounded bg-black px-3 py-2 text-sm font-medium text-white transition hover:bg-[#ff6667] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {loadingAssign ? "Allocating..." : "Allocate job"}
                        </button>
                      ) : null}
                    </div>
                  );
                }}
              />
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-200 p-5 text-sm text-gray-500">
                No applications yet.
              </div>
            )}
          </section>
        ) : null}
      </div>
    </div>
  );
};

export default DeputyJobPreviewPanel;