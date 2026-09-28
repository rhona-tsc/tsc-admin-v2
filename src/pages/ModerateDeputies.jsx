import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { backendUrl } from "../App";
import CustomToast from "../components/CustomToast";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const PILL = ({ status }) => {
  const normalized = String(status || "").toLowerCase();
  const base = "inline-block px-2 py-[2px] rounded text-xs font-semibold";

  const cls =
    normalized === "pending"
      ? "bg-yellow-100 text-yellow-800"
      : normalized === "approved, changes pending"
      ? "bg-indigo-100 text-indigo-800"
      : normalized === "approved"
      ? "bg-green-100 text-green-800"
      : normalized === "rejected"
      ? "bg-red-100 text-red-800"
      : "bg-gray-100 text-gray-700";

  return <span className={`${base} ${cls}`}>{status || "Unknown"}</span>;
};

const REVIEW_PILL = ({ needsReview }) => {
  if (!needsReview) return null;

  return (
    <span className="inline-block px-2 py-[2px] rounded text-xs font-semibold bg-orange-100 text-orange-800">
      Needs review
    </span>
  );
};

const AI_BIO_PILL = ({ required }) => {
  if (!required) return null;
  return (
    <span className="mt-1 inline-block rounded bg-cyan-100 px-2 py-[2px] text-xs font-semibold text-cyan-800">
      AI bio – review needed
    </span>
  );
};

const VIDEO_REVIEW_PILL = ({ count }) => {
  if (!count) {
    return <span className="text-xs text-gray-500">No unvetted videos</span>;
  }

  return (
    <span className="inline-block px-2 py-[2px] rounded text-xs font-semibold bg-fuchsia-100 text-fuchsia-800">
      Vet {count} {count === 1 ? "video" : "videos"}
    </span>
  );
};

const formatDateTime = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";

  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getDisplayName = (m) =>
  m?.name || `${m?.firstName || ""} ${m?.lastName || ""}`.trim() || "Unnamed deputy";

const getTime = (value) => {
  if (!value) return 0;
  const d = new Date(value);
  return isNaN(d.getTime()) ? 0 : d.getTime();
};

const getNeedsReview = (m) => {
  if (!m?.profileLastEditedAt) return false;
  if (!m?.profileLastReviewedAt) return true;
  return new Date(m.profileLastEditedAt) > new Date(m.profileLastReviewedAt);
};

const getStatusRank = (status) => {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "approved, changes pending") return 0;
  if (normalized === "pending") return 1;
  if (normalized === "approved") return 2;
  if (normalized === "rejected") return 3;
  return 4;
};

const ModerateDeputies = ({ token }) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analysingId, setAnalysingId] = useState("");
  const [generatingBioId, setGeneratingBioId] = useState("");
  const [bulkGeneratingBios, setBulkGeneratingBios] = useState(false);
  const [bulkBioProgress, setBulkBioProgress] = useState(null);

  const [sortField, setSortField] = useState("profileLastEditedAt");
  const [sortDirection, setSortDirection] = useState("desc");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [updatedByUserFilter, setUpdatedByUserFilter] = useState("all");
  const [needsReviewFilter, setNeedsReviewFilter] = useState("all");
  const [videoReviewFilter, setVideoReviewFilter] = useState("all");
  const [aiBioReviewFilter, setAiBioReviewFilter] = useState("all");

  const navigate = useNavigate();

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    try {
      const url = `${backendUrl}/api/moderation/deputies/review-queue?all=true`;
      const res = await axios.get(url, { headers: { token } });
      setRows(res.data?.deputies || []);
    } catch (err) {
      console.error("❌ Failed to load deputies:", err);
      toast(<CustomToast type="error" message="Failed to load deputies" />);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const handleApproval = async (id, action) => {
    const endpoint = action === "approve" ? "approve-deputy" : "reject-deputy";

    try {
      const res = await axios.post(
        `${backendUrl}/api/musician/${endpoint}`,
        { id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast(
        <CustomToast
          type="success"
          message={res.data.message || `Deputy ${action}d`}
        />
      );

      fetchQueue();
    } catch {
      toast(<CustomToast type="error" message={`Failed to ${action}`} />);
    }
  };

  const handleVideoAnalysis = async (id) => {
    setAnalysingId(id);
    try {
      const res = await axios.post(
        `${backendUrl}/api/moderation/deputy/${id}/videos/analyse`,
        {},
        { headers: { token, Authorization: `Bearer ${token}` } },
      );
      toast(<CustomToast type="success" message={res.data?.message || "Video checks started"} />);
      await fetchQueue();
    } catch (err) {
      toast(<CustomToast type="error" message={err.response?.data?.message || "Failed to start video checks"} />);
    } finally {
      setAnalysingId("");
    }
  };

  const handleGenerateBio = async (id) => {
    setGeneratingBioId(id);
    try {
      const res = await axios.post(
        `${backendUrl}/api/musician/moderation/deputy/${id}/generate-bio`,
        {},
        { headers: { token, Authorization: `Bearer ${token}` } },
      );
      toast(<CustomToast type="success" message={res.data?.message || "AI bio published and flagged for review"} />);
      await fetchQueue();
    } catch (err) {
      toast(<CustomToast type="error" message={err.response?.data?.message || "Failed to generate the bio"} />);
    } finally {
      setGeneratingBioId("");
    }
  };

  const handleBackfillBios = async () => {
    const confirmed = window.confirm(
      "Generate and publish AI bios for every musician who does not currently have an approved bio? Existing manually written bios will be preserved.",
    );
    if (!confirmed) return;

    setBulkGeneratingBios(true);
    setBulkBioProgress({ processed: 0, generated: 0, skipped: 0 });
    let cursor = "";
    let totals = { processed: 0, generated: 0, skipped: 0 };
    try {
      do {
        const res = await axios.post(
          `${backendUrl}/api/musician/moderation/bios/backfill`,
          { cursor, limit: 5 },
          { headers: { token, Authorization: `Bearer ${token}` } },
        );
        const batch = res.data || {};
        totals = {
          processed: totals.processed + Number(batch.processed || 0),
          generated: totals.generated + Number(batch.generated || 0),
          skipped: totals.skipped + Number(batch.skipped || 0),
        };
        setBulkBioProgress(totals);
        cursor = batch.nextCursor || cursor;
        if (!batch.hasMore) break;
      } while (cursor);

      toast(
        <CustomToast
          type="success"
          message={`${totals.generated} bios generated and published; ${totals.skipped} profiles skipped because they need more information.`}
        />,
      );
      await fetchQueue();
    } catch (err) {
      toast(
        <CustomToast
          type="error"
          message={err.response?.data?.message || "The bio backfill stopped before it completed"}
        />,
      );
    } finally {
      setBulkGeneratingBios(false);
    }
  };

  const filteredAndSorted = useMemo(() => {
    let result = [...rows];

    const q = searchTerm.trim().toLowerCase();

    if (q) {
      result = result.filter((m) => {
        const name = getDisplayName(m).toLowerCase();
        const email = String(m?.email || "").toLowerCase();
        return name.includes(q) || email.includes(q);
      });
    }

    if (statusFilter !== "all") {
      result = result.filter(
        (m) => String(m?.status || "").toLowerCase() === statusFilter.toLowerCase()
      );
    }

    if (updatedByUserFilter !== "all") {
      const wanted = updatedByUserFilter === "yes";
      result = result.filter((m) => Boolean(m?.profileUpdatedByUser) === wanted);
    }

    if (needsReviewFilter !== "all") {
      const wanted = needsReviewFilter === "yes";
      result = result.filter((m) => getNeedsReview(m) === wanted);
    }

    if (videoReviewFilter !== "all") {
      if (videoReviewFilter === "required") {
        result = result.filter((m) => Boolean(m?.needsVideoReview));
      } else if (videoReviewFilter === "complete") {
        result = result.filter(
          (m) => Number(m?.uploadedVideoCount || 0) > 0 && !m?.needsVideoReview
        );
      } else if (videoReviewFilter === "none") {
        result = result.filter((m) => Number(m?.uploadedVideoCount || 0) === 0);
      }
    }

    if (aiBioReviewFilter !== "all") {
      const wanted = aiBioReviewFilter === "required";
      result = result.filter((m) => Boolean(m?.aiBioReviewRequired) === wanted);
    }

    result.sort((a, b) => {
      let aVal;
      let bVal;

      switch (sortField) {
        case "dateRegistered":
          aVal = getTime(a.dateRegistered);
          bVal = getTime(b.dateRegistered);
          break;
        case "profileLastEditedAt":
          aVal = getTime(a.profileLastEditedAt);
          bVal = getTime(b.profileLastEditedAt);
          break;
        case "profileLastReviewedAt":
          aVal = getTime(a.profileLastReviewedAt);
          bVal = getTime(b.profileLastReviewedAt);
          break;
        case "profileUpdatedByUser":
          aVal = a.profileUpdatedByUser ? 1 : 0;
          bVal = b.profileUpdatedByUser ? 1 : 0;
          break;
        case "status":
          aVal = getStatusRank(a.status);
          bVal = getStatusRank(b.status);
          break;
        case "needsReview":
          aVal = getNeedsReview(a) ? 1 : 0;
          bVal = getNeedsReview(b) ? 1 : 0;
          break;
        case "videoReview":
          aVal = Number(a.unvettedVideoCount || 0);
          bVal = Number(b.unvettedVideoCount || 0);
          break;
        default:
          aVal = getTime(a.profileLastEditedAt);
          bVal = getTime(b.profileLastEditedAt);
      }

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [
    rows,
    searchTerm,
    statusFilter,
    updatedByUserFilter,
    needsReviewFilter,
    videoReviewFilter,
    aiBioReviewFilter,
    sortField,
    sortDirection,
  ]);

  const uniqueStatuses = useMemo(() => {
    return [...new Set(rows.map((m) => m?.status).filter(Boolean))];
  }, [rows]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
        <h1 className="text-xl font-bold">Moderate Deputies</h1>

        <div className="flex items-center gap-3 flex-wrap">
          {bulkBioProgress ? (
            <span className="text-xs text-gray-500">
              {bulkGeneratingBios ? "Generating… " : "Last run: "}
              {bulkBioProgress.generated} published, {bulkBioProgress.skipped} skipped
            </span>
          ) : null}
          <button
            type="button"
            className="rounded bg-cyan-700 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
            disabled={bulkGeneratingBios}
            onClick={handleBackfillBios}
          >
            {bulkGeneratingBios ? "Generating missing bios…" : "Generate missing bios"}
          </button>
          <span className="text-sm text-gray-500">
            Showing {filteredAndSorted.length} of {rows.length}
          </span>
        </div>
      </div>

      <div className="bg-white border rounded p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-8 gap-3">
          <input
            type="text"
            placeholder="Search name or email"
            className="border rounded px-3 py-2 text-sm xl:col-span-2"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <select
            className="border rounded px-3 py-2 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All statuses</option>
            {uniqueStatuses.map((status) => (
              <option key={status} value={String(status).toLowerCase()}>
                {status}
              </option>
            ))}
          </select>

          <select
            className="border rounded px-3 py-2 text-sm"
            value={aiBioReviewFilter}
            onChange={(e) => setAiBioReviewFilter(e.target.value)}
          >
            <option value="all">AI bio review: all</option>
            <option value="required">AI bio review: required</option>
            <option value="complete">AI bio review: complete</option>
          </select>

          <select
            className="border rounded px-3 py-2 text-sm"
            value={updatedByUserFilter}
            onChange={(e) => setUpdatedByUserFilter(e.target.value)}
          >
            <option value="all">Updated by user: all</option>
            <option value="yes">Updated by user: yes</option>
            <option value="no">Updated by user: no</option>
          </select>

          <select
            className="border rounded px-3 py-2 text-sm"
            value={needsReviewFilter}
            onChange={(e) => setNeedsReviewFilter(e.target.value)}
          >
            <option value="all">Needs review: all</option>
            <option value="yes">Needs review: yes</option>
            <option value="no">Needs review: no</option>
          </select>

          <select
            className="border rounded px-3 py-2 text-sm"
            value={videoReviewFilter}
            onChange={(e) => setVideoReviewFilter(e.target.value)}
          >
            <option value="all">Video vetting: all</option>
            <option value="required">Video vetting: required</option>
            <option value="complete">Video vetting: complete</option>
            <option value="none">Video vetting: no videos</option>
          </select>

          <button
            type="button"
            className="border rounded px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100"
            onClick={() => {
              setSearchTerm("");
              setStatusFilter("all");
              setUpdatedByUserFilter("all");
              setNeedsReviewFilter("all");
              setVideoReviewFilter("all");
              setAiBioReviewFilter("all");
              setSortField("profileLastEditedAt");
              setSortDirection("desc");
            }}
          >
            Reset
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 mt-3">
          <select
            className="border rounded px-3 py-2 text-sm"
            value={sortField}
            onChange={(e) => setSortField(e.target.value)}
          >
            <option value="profileLastEditedAt">Sort: Last edited</option>
            <option value="profileLastReviewedAt">Sort: Last reviewed</option>
            <option value="dateRegistered">Sort: Date registered</option>
            <option value="profileUpdatedByUser">Sort: Updated by user</option>
            <option value="status">Sort: Status</option>
            <option value="needsReview">Sort: Needs review</option>
            <option value="videoReview">Sort: Unvetted videos</option>
          </select>

          <select
            className="border rounded px-3 py-2 text-sm"
            value={sortDirection}
            onChange={(e) => setSortDirection(e.target.value)}
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : filteredAndSorted.length === 0 ? (
        <p>No deputies found.</p>
      ) : (
        <div className="overflow-x-auto bg-white border rounded">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr className="text-left">
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Review</th>
                <th className="px-4 py-3 font-semibold">Video checks</th>
                <th className="px-4 py-3 font-semibold">Registered</th>
                <th className="px-4 py-3 font-semibold">Last edited</th>
                <th className="px-4 py-3 font-semibold">Last reviewed</th>
                <th className="px-4 py-3 font-semibold">Updated by user</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>

           
                 <tbody>
  {filteredAndSorted.map((m) => {
    const needsReview = getNeedsReview(m);

    return (
      <tr
        key={m._id}
        className={`border-b last:border-b-0 align-top ${
          needsReview ? "bg-orange-50 hover:bg-orange-100" : "hover:bg-gray-50"
        }`}
      >
        <td className="px-4 py-3 font-medium">
  <a
    href={`/moderate-deputy/edit/${m._id}`}
    target="_blank"
    rel="noopener noreferrer"
    className="text-blue-600 hover:underline"
  >
    {getDisplayName(m)}
  </a>
</td>
        <td className="px-4 py-3 text-gray-600">{m.email || "—"}</td>
        <td className="px-4 py-3">
          <PILL status={m.status} />
        </td>
        <td className="px-4 py-3">
          <REVIEW_PILL needsReview={needsReview} />
          <AI_BIO_PILL required={Boolean(m.aiBioReviewRequired)} />
        </td>
        <td className="px-4 py-3">
          <VIDEO_REVIEW_PILL count={Number(m.unvettedVideoCount || 0)} />
          {Number(m.uploadedVideoCount || 0) > 0 && (
            <div className="mt-1 text-xs text-gray-500">
              {m.uploadedVideoCount} uploaded in total
            </div>
          )}
          {Number(m.videoModerationCounts?.processing || 0) > 0 && (
            <div className="mt-1 text-xs font-medium text-blue-700">{m.videoModerationCounts.processing} analysing</div>
          )}
          {Number(m.videoModerationCounts?.manual_required || 0) > 0 && (
            <div className="mt-1 text-xs font-medium text-amber-700">{m.videoModerationCounts.manual_required} manual review</div>
          )}
          {Number(m.moderationFlagCount || 0) > 0 && (
            <div className="mt-1 text-xs font-semibold text-red-700">{m.moderationFlagCount} possible contact/identity flags</div>
          )}
        </td>
        <td className="px-4 py-3 text-gray-600">
          {formatDateTime(m.dateRegistered)}
        </td>
        <td className="px-4 py-3 text-gray-600">
          {formatDateTime(m.profileLastEditedAt)}
        </td>
        <td className="px-4 py-3 text-gray-600">
          {formatDateTime(m.profileLastReviewedAt)}
        </td>
        <td className="px-4 py-3 text-gray-600">
          {m.profileUpdatedByUser ? "Yes" : "No"}
        </td>
        <td className="px-4 py-3">
          <div className="flex gap-2 flex-wrap">
            <button
              className="px-3 py-1 bg-blue-600 text-white rounded"
              onClick={() => navigate(`/moderate-deputy/edit/${m._id}`)}
            >
              View/Edit
            </button>

            <button
              className="px-3 py-1 bg-purple-700 text-white rounded disabled:opacity-50"
              disabled={!Number(m.uploadedVideoCount || 0) || analysingId === m._id}
              onClick={() => handleVideoAnalysis(m._id)}
            >
              {analysingId === m._id ? "Starting…" : "Check videos"}
            </button>

            <button
              className="px-3 py-1 bg-cyan-700 text-white rounded disabled:opacity-50"
              disabled={generatingBioId === m._id}
              onClick={() => handleGenerateBio(m._id)}
            >
              {generatingBioId === m._id ? "Writing…" : "Generate bio"}
            </button>

            <button
              className="px-3 py-1 bg-green-600 text-white rounded"
              onClick={() => handleApproval(m._id, "approve")}
            >
              Approve
            </button>

            <button
              className="px-3 py-1 bg-red-600 text-white rounded"
              onClick={() => handleApproval(m._id, "reject")}
            >
              Reject
            </button>
          </div>
        </td>
      </tr>
    );
  })}
</tbody>
               
          </table>
        </div>
      )}
    </div>
  );
};

export default ModerateDeputies;
