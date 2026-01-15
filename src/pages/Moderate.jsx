import React, { useEffect, useState } from "react";
import axios from "axios";
import { backendUrl } from "../App";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import CustomToast from "../components/CustomToast";
import { assets } from "../assets/assets";

const Moderate = ({ token: tokenProp }) => {
  const navigate = useNavigate();
  const [pendingActs, setPendingActs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pull token from prop OR storage (matches your working List page pattern)
  const getToken = () =>
    tokenProp ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("token") ||
    sessionStorage.getItem("authToken") ||
    sessionStorage.getItem("token") ||
    "";

  const buildHeaders = (token) => ({
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(token ? { token } : {}),
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
  });

  const isModerationStatus = (act) => {
    const s = String(act?.status || "").trim().toLowerCase();

    // cover your current values + legacy patterns
    if (s === "pending") return true;
    if (s === "live_changes_pending") return true;

    // covers "Approved, changes pending" (any case)
    if (s.includes("changes pending")) return true;

    // covers legacy: approved + amendment flag
    if (s === "approved" && act?.amendment?.isPending) return true;

    return false;
  };

  const fetchPendingActs = async () => {
    const token = getToken();

    try {
      setLoading(true);

      const params = {
        fields:
          "_id,name,tscName,images,profileImage,coverImage,createdAt,status,updatedAt,amendment",
        sort: "-createdAt",
        limit: 500,
        legacy: "include",
      };

      // ✅ Use the SAME route as List (since it works)
      const resp = await axios.get(`${backendUrl}/api/musician/act-v2/list`, {
        params,
        headers: buildHeaders(token),
        withCredentials: false,
      });

      const ok = resp?.data?.success === true;
      const rows =
        (ok && Array.isArray(resp?.data?.acts) && resp.data.acts) ||
        (ok && Array.isArray(resp?.data?.items) && resp.data.items) ||
        [];

      // filter: remove trashed + only moderation statuses
      const filtered = rows
        .filter((a) => String(a?.status || "").toLowerCase() !== "trashed")
        .filter(isModerationStatus);

      setPendingActs(filtered);
    } catch (error) {
      console.error("❌ fetchPendingActs error:", error?.response?.data || error);
      toast(<CustomToast type="error" message="Failed to load pending acts" />);
      setPendingActs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (id) => {
    navigate(`/moderate/edit/${id}`);
  };

  const updateStatus = async (id, status) => {
    const token = getToken();

    try {
      const res = await axios.post(
        `${backendUrl}/api/musician/act-v2/update-status`,
        { id, status },
        { headers: buildHeaders(token) }
      );

      if (res.data?.success) {
        toast(<CustomToast type="success" message={`Act ${status}`} />);
        fetchPendingActs();
      } else {
        toast(
          <CustomToast
            type="error"
            message={res.data?.message || "Update failed"}
          />
        );
      }
    } catch (error) {
      console.error("❌ updateStatus error:", error?.response?.data || error);
      toast(<CustomToast type="error" message="Error updating status" />);
    }
  };

  useEffect(() => {
    fetchPendingActs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <h2 className="mb-4 text-lg font-bold">Pending Acts</h2>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse flex items-center justify-between border p-4 rounded bg-white"
            >
              <div className="flex gap-4 items-center">
                <div className="w-20 h-20 bg-gray-200 rounded" />
                <div>
                  <div className="h-4 w-40 bg-gray-200 rounded mb-2" />
                  <div className="h-3 w-24 bg-gray-200 rounded" />
                </div>
              </div>
              <div className="h-4 w-32 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      ) : pendingActs.length === 0 ? (
        <p>No pending acts found.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {pendingActs.map((act) => {
            const profileSrc =
              typeof act?.profileImage?.[0] === "string"
                ? act.profileImage[0]
                : act?.profileImage?.[0]?.url ||
                  (typeof act?.images?.[0] === "string"
                    ? act.images[0]
                    : act?.images?.[0]?.url) ||
                  assets.placeholder_image;

            return (
              <div
                key={act._id}
                className="border p-4 flex items-center justify-between rounded shadow-sm bg-white"
              >
                <div className="flex gap-4 items-center">
                  <img
                    src={profileSrc}
                    alt={act.name}
                    className="w-20 h-20 object-cover rounded"
                    onError={(e) => {
                      e.currentTarget.src = assets.placeholder_image;
                    }}
                  />
                  <div>
                    <p className="font-semibold">{act.name}</p>
                    <p className="text-xs text-gray-500">{act.tscName}</p>
                    <p className="text-[11px] text-gray-400 mt-1">
                      Status: {act.status || "—"}
                    </p>
                  </div>
                </div>

                <div className="text-sm text-gray-600">
                  <p>
                    Created At:{" "}
                    {act.createdAt
                      ? new Date(act.createdAt).toLocaleDateString()
                      : "-"}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    className="bg-blue-600 text-white px-4 py-2 rounded text-sm"
                    onClick={() => handleEdit(act._id)}
                  >
                    View/Edit
                  </button>

                  <button
                    className="bg-green-600 text-white px-4 py-2 rounded text-sm"
                    onClick={() => updateStatus(act._id, "approved")}
                  >
                    Approve
                  </button>

                  <button
                    className="bg-red-600 text-white px-4 py-2 rounded text-sm"
                    onClick={() => updateStatus(act._id, "rejected")}
                  >
                    Reject
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Moderate;