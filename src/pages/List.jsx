import { useNavigate } from "react-router-dom";
import axios from "axios";
import React, { useEffect, useMemo, useState } from "react";
import { backendUrl } from "../App";
import { toast } from "react-toastify";
import { assets } from "../assets/assets";
import CustomToast from "../components/CustomToast";

// --- helpers to resolve current user id ---
const getStoredUserId = () =>
  sessionStorage.getItem("userId") || localStorage.getItem("userId") || null;

const decodeUserIdFromToken = (tok) => {
  try {
    if (!tok || !tok.includes(".")) return null;
    const payloadPart = tok.split(".")[1];
    const json = JSON.parse(
      atob(payloadPart.replace(/-/g, "+").replace(/_/g, "/"))
    );
    return json?.id || json?._id || json?.userId || json?.musicianId || json?.sub || null;
  } catch {
    return null;
  }
};

const List = ({ token }) => {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  // who is the current user?
  const currentUserId = useMemo(
    () => getStoredUserId() || decodeUserIdFromToken(token),
    [token]
  );

    const buildHeaders = () => ({
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(token ? { token } : {}),
    },
    // We do NOT use cookies for auth; sending credentials triggers strict CORS requirements.
    // Leave credentials off so the browser doesn't require Access-Control-Allow-Credentials.
    withCredentials: false,
});

const fetchList = async () => {
  const controller = new AbortController();
  try {
    setLoading(true);

    const baseParams = {
      status: "approved,pending,draft,Approved, changes pending",
      // API-allowed projection
      fields: "_id,name,tscName,images,coverImage,createdAt,updatedAt,status,amendment",
      sort: "-createdAt",
      limit: 100,
      legacy: "include", // show legacy (unowned) during transition
    };

    // --- 1) Try server-scoped first
    const scopedParams = {
      ...baseParams,
      mine: true,
      ...(currentUserId ? { authorId: currentUserId } : {}),
    };

    const scopedResp = await axios.get(
      `${backendUrl}/api/musician/act-v2/list`,
      { params: scopedParams, signal: controller.signal, ...buildHeaders() }
    );

    const scopedOK = scopedResp?.data?.success === true;
    const scopedRows = scopedOK && Array.isArray(scopedResp?.data?.acts) ? scopedResp.data.acts : [];
    const scopedVisible = scopedRows.filter(a => a?.status !== "trashed");

    if (scopedOK && scopedVisible.length > 0) {
      setList(scopedVisible);
      if (!currentUserId) {
        console.warn("⚠️ No currentUserId resolved; relying on server req.user for scoping.");
      }
      return;
    }

    console.warn("ℹ️ Scoped query returned 0. Falling back to unscoped for visibility during backfill…");

    // --- 2) Fallback: unscoped (no mine/authorId)
    const unscopedResp = await axios.get(
      `${backendUrl}/api/musician/act-v2/list`,
      { params: baseParams, signal: controller.signal, ...buildHeaders() }
    );

    const unscopedOK = unscopedResp?.data?.success === true;
    const rows = unscopedOK && Array.isArray(unscopedResp?.data?.acts) ? unscopedResp.data.acts : [];
    const notTrashed = rows.filter(a => a?.status !== "trashed");

    setList(notTrashed);

    if (!notTrashed.length) {
      console.warn("❔ Unscoped fallback also returned 0. Check API auth + ownership backfill.");
    } else {
      console.info(`✅ Showing ${notTrashed.length} acts via unscoped fallback.`);
    }
  } catch (error) {
    console.error("❌ Failed to fetch act list:", error);
    toast(<CustomToast type="error" message="Error loading acts. Please try again." />);
  } finally {
    setLoading(false);
  }
};

  const removeAct = async (id) => {
    console.log("🧹 Move to trash ID:", id);
    try {
      const response = await axios.post(
        `${backendUrl}/api/musician/act-v2/trash`,
        { id },
        { headers: { token } }
      );

      if (response.data.success) {
        toast(
          <CustomToast
            type="success"
            message="Moved to trash. Will delete permanently after 30 days."
          />
        );
        setList((prev) => prev.filter((act) => act._id !== id));
      } else {
        toast(
          <CustomToast type="error" message={response.data.message || "Error"} />
        );
      }
    } catch (error) {
      console.error(error);
      toast(
        <CustomToast
          type="error"
          message={error.message || "Failed to remove act"}
        />
      );
    }
          if (!currentUserId) {
        console.warn("⚠️ No currentUserId could be resolved from storage/JWT. The server will still try to scope by req.user; ensure your auth middleware sets req.user.");
      }
  };

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId]); // refetch if auth context changes

  const getActStatusLabel = (act) => {
    if (!act?.status) return "Unknown";
    if (act.status === "approved" && act.amendment?.isPending) {
      return "Approved (Changes Pending)";
    }
    return act.status.charAt(0).toUpperCase() + act.status.slice(1);
  };

  const handleApproveAmendment = async (id) => {
    try {
      const res = await axios.post(
        `${backendUrl}/api/act/approve-amendment`,
        { id },
        { headers: { token } }
      );
      if (res.data.success) {
        toast(<CustomToast type="success" message={res.data.message} />);
        fetchList();
      } else {
        toast(<CustomToast type="error" message={res.data.message} />);
      }
    } catch (err) {
      toast(<CustomToast type="error" message="Failed to approve amendment" />);
      console.error(err);
    }
  };



  return (
    <>
      <p className="mb-2">All Acts List</p>
      <div className="flex flex-col gap-2">
        {/* ------- List Table Title ---------- */}
        <div className="hidden md:grid grid-cols-[1fr_3fr_1fr_1fr_1fr] items-center py-1 px-2 border bg-gray-100 text-sm">
          <b></b>
          <b>Name</b>
          <b className="text-center">Active Shortlists</b>
          <b className="text-center">Bookings</b>
          <b className="text-center"></b>
          <b className="text-center"></b>
        </div>

        {/* ------ Skeleton Loader ------ */}
        {loading &&
          [...Array(5)].map((_, i) => (
            <div
              key={i}
              className="animate-pulse grid grid-cols-[1fr_3fr_1fr_1fr_1fr] gap-2 py-2 px-2 border bg-white"
            >
              <div className="w-[150px] h-[100px] bg-gray-200 rounded"></div>
              <div className="flex flex-col justify-center gap-2">
                <div className="h-4 w-32 bg-gray-200 rounded"></div>
                <div className="h-3 w-20 bg-gray-200 rounded"></div>
              </div>
              <div className="h-3 w-8 bg-gray-200 rounded mx-auto"></div>
              <div className="h-3 w-8 bg-gray-200 rounded mx-auto"></div>
              <div className="flex justify-center gap-4">
                <div className="h-4 w-4 bg-gray-200 rounded"></div>
                <div className="h-4 w-4 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}

        {/* ------ Act List ------ */}
        {!loading &&
          list.map((item) => {
            const imgSrc =
              typeof item.images?.[0] === "string"
                ? item.images[0]
                : item.images?.[0]?.url || assets.placeholder_image;

            return (
              <div
                className="grid grid-cols-[1fr_3fr_1fr_1fr_1fr] items-center gap-2 py-1 px-2 border text-sm bg-white"
                key={item._id}
              >
                <div className="w-full h-full overflow-hidden flex items-center justify-center">
                  <img
                    src={imgSrc}
                    alt={item.name}
                    className="object-cover w-full h-full"
                    onError={(e) =>
                      (e.currentTarget.src = assets.placeholder_image)
                    }
                  />
                </div>
                <div className="flex flex-col">
                  <span>{item.name}</span>
                  <span
                    className={`text-xs mt-1 px-2 py-0.5 w-fit rounded font-medium ${
                      item.status === "approved" && item.amendment?.isPending
                        ? "bg-orange-100 text-orange-700"
                        : item.status === "approved"
                        ? "bg-green-100 text-green-700"
                        : item.status === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : item.status === "draft"
                        ? "bg-gray-300 text-gray-900"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {getActStatusLabel(item)}
                  </span>
                </div>
                <p className="text-center">100</p>
                <p className="text-center">10</p>

                {/* ✅ Action icons */}
                <div className="flex justify-center items-center gap-4">
                  <img
                    src={assets.edit_icon}
                    alt="Edit"
                    className="w-5 h-5 cursor-pointer"
                    onClick={() => navigate(`/edit-act-2/${item._id}`)}
                  />

                  {item.amendment?.isPending && (
                    <button
                      className="text-xs text-green-600 underline"
                      onClick={() => handleApproveAmendment(item._id)}
                    >
                      Approve Changes
                    </button>
                  )}

                  <img
                    src={assets.cross_icon}
                    alt="Delete"
                    className="w-5 h-5 cursor-pointer"
                    onClick={() => removeAct(item._id)}
                  />
                </div>
              </div>
            );
          })}
      </div>
    </>
  );
};

export default List;