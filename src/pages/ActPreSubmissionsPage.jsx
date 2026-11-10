import { cloudinaryImage } from "../utils/cloudinaryImage.js";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { backendUrl } from "../App";
import { toast } from "react-toastify";
import CustomToast from "../components/CustomToast";
import { assets } from "../assets/assets";

// 🧪 Debug helpers (toggleable)
const DBG = true;
const dlog = (...args) => DBG && console.log("🧩[ActPreSubmissionsPage]", ...args);
const dwarn = (...args) => DBG && console.warn("🧩[ActPreSubmissionsPage]", ...args);
const derr = (...args) => DBG && console.error("🧩[ActPreSubmissionsPage]", ...args);

const getVideoDetails = (value = "") => {
  try {
    const url = new URL(String(value || "").trim());
    const host = url.hostname.replace(/^www\./, "").toLowerCase();

    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id
        ? { embedUrl: `https://www.youtube-nocookie.com/embed/${id}`, thumbnailUrl: `https://img.youtube.com/vi/${id}/hqdefault.jpg` }
        : null;
    }

    if (host === "youtube.com" || host.endsWith(".youtube.com")) {
      const parts = url.pathname.split("/").filter(Boolean);
      const id = url.searchParams.get("v") || (["shorts", "embed"].includes(parts[0]) ? parts[1] : "");
      return id
        ? { embedUrl: `https://www.youtube-nocookie.com/embed/${id}`, thumbnailUrl: `https://img.youtube.com/vi/${id}/hqdefault.jpg` }
        : null;
    }

    if (host === "vimeo.com" || host.endsWith(".vimeo.com")) {
      const id = url.pathname.split("/").filter(Boolean).find((part) => /^\d+$/.test(part));
      return id ? { embedUrl: `https://player.vimeo.com/video/${id}`, thumbnailUrl: "" } : null;
    }
  } catch {
    return null;
  }

  return null;
};

const ActPreSubmissionPage = () => {
  const [pendingActs, setPendingActs] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedAct, setSelectedAct] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [activeVideoUrl, setActiveVideoUrl] = useState("");
  const [updatingSubmission, setUpdatingSubmission] = useState("");

  const getToken = () =>
    localStorage.getItem("authToken") || localStorage.getItem("token") || "";

  const authHeaders = () => {
    const token = getToken();
    dlog("authHeaders", { hasToken: !!token, tokenPrefix: token ? String(token).slice(0, 12) + "…" : "" });
    return {
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
      ...(token ? { Authorization: `Bearer ${token}`, token } : {}),
    };
  };

  const fetchPendingActs = async () => {
    try {
      setLoading(true);

      const url = `${backendUrl}/api/act-pre-submissions/pending?_cb=${Date.now()}`;
      dlog("fetchPendingActs ->", url);

      const response = await axios.get(url, {
        withCredentials: true,
        headers: authHeaders(),
      });
      dlog("fetchPendingActs <-", {
        status: response?.status,
        success: response?.data?.success,
        subsLen: Array.isArray(response?.data?.subs) ? response.data.subs.length : null,
      });

      if (!response.data?.success) {
        toast(
          <CustomToast
            type="error"
            message={response.data?.message || "Failed to load pending submissions"}
          />
        );
        setPendingActs([]);
        return;
      }

      const subsRaw = Array.isArray(response.data.subs) ? response.data.subs : [];

      const pending = subsRaw.filter(
        (s) => String(s?.status || "").toLowerCase().trim() === "pending"
      );

      setPendingActs(pending);
      dlog("fetchPendingActs setPendingActs", {
        pendingLen: pending.length,
        sample: pending[0]?._id,
      });
    } catch (error) {
      console.error("❌ fetchPendingActs error:", error?.response?.data || error);
      toast(
        <CustomToast type="error" message="Failed to load pending submissions" />
      );
      setPendingActs([]);
    } finally {
      setLoading(false);
    }
  };

  // ✅ fetch single presubmission for modal
  const openModal = async (id) => {
    try {
      setIsModalOpen(true);
      setSelectedId(id);
      setSelectedAct(null);
      setModalLoading(true);
      setActiveVideoUrl("");

      // 🔧 Change this if your route differs
      const fetchOneUrl = `${backendUrl}/api/act-pre-submissions/${id}?_cb=${Date.now()}`;
      dlog("openModal ->", { id, url: fetchOneUrl });

      const res = await axios.get(fetchOneUrl, {
        withCredentials: true,
        headers: authHeaders(),
      });
      dlog("openModal <-", {
        status: res?.status,
        success: res?.data?.success,
        keys: res?.data ? Object.keys(res.data) : null,
      });

      // depending on your API shape:
      const doc =
        res.data?.submission ||
        res.data?.sub ||
        res.data?.data ||
        res.data?.presubmission ||
        res.data;
      setSelectedAct(doc);
      dlog("openModal setSelectedAct", {
        id: doc?._id,
        status: doc?.status,
        actName: doc?.actName,
        bandLeaderEmail: doc?.bandLeaderEmail,
        musicianEmail: doc?.musicianEmail,
      });
    } catch (e) {
      console.error("❌ openModal error:", e?.response?.data || e);
      toast(<CustomToast type="error" message="Failed to load submission" />);
    } finally {
      setModalLoading(false);
    }
  };

  const closeModal = () => {
    dlog("closeModal");
    setIsModalOpen(false);
    setSelectedId(null);
    setSelectedAct(null);
    setModalLoading(false);
    setActiveVideoUrl("");
  };

  const updateStatus = async (id, action) => {
    const actionKey = `${id}:${action}`;
    if (updatingSubmission) return;
    setUpdatingSubmission(actionKey);
    try {
      const endpoint =
        action === "approved"
          ? `${backendUrl}/api/act-pre-submissions/approve/${id}`
          : `${backendUrl}/api/act-pre-submissions/reject/${id}`;
      dlog("updateStatus ->", { id, action, endpoint });

      const res = await axios.post(
        endpoint,
        {},
        {
          withCredentials: true,
          headers: authHeaders(),
        }
      );
      dlog("updateStatus <-", {
        status: res?.status,
        success: res?.data?.success,
        message: res?.data?.message,
        subStatus: res?.data?.sub?.status || res?.data?.submission?.status,
        recipientEmail: res?.data?.recipientEmail,
        emailSent: res?.data?.emailSent,
      });

      if (res.data?.success) {
        // If backend returned the updated sub, reflect it in the modal immediately
        const updated = res.data?.sub || res.data?.submission || null;
        if (updated && String(updated._id) === String(selectedId)) {
          setSelectedAct(updated);
          dlog("updateStatus setSelectedAct(updated)", { id: updated._id, status: updated.status });
        }
        toast(<CustomToast type="success" message={`Pre Submission ${action}`} />);
        await fetchPendingActs();
        closeModal();
      } else {
        toast(
          <CustomToast
            type="error"
            message={res.data?.message || "Update failed"}
          />
        );
      }
    } catch (e) {
      console.error("❌ updateStatus error:", e?.response?.data || e);
      toast(
        <CustomToast
          type="error"
          message={e?.response?.data?.message || "Error updating submission status"}
        />
      );
    } finally {
      setUpdatingSubmission("");
    }
  };

  // state-change visibility debug
  useEffect(() => {
    if (!DBG) return;
    dlog("state", {
      isModalOpen,
      selectedId,
      selectedActId: selectedAct?._id,
      selectedActStatus: selectedAct?.status,
      pendingActsLen: pendingActs.length,
      loading,
      modalLoading,
    });
  }, [isModalOpen, selectedId, selectedAct, pendingActs.length, loading, modalLoading]);

  // ✅ ESC closes modal
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") closeModal();
    };
    if (isModalOpen) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isModalOpen]);

  useEffect(() => {
    fetchPendingActs();
  }, []);

  const selectedVideos = [
    selectedAct?.videoLink1,
    selectedAct?.videoLink2,
    selectedAct?.videoLink3,
  ]
    .map((url, index) => ({ url: String(url || "").trim(), label: `Video ${index + 1}` }))
    .filter((video) => video.url);

  return (
    <div>
      <h2 className="mb-4 text-lg font-bold">Pending PreSubmissions</h2>

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
        <p>No pending presubmissions found.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {pendingActs.map((act) => {
            const profileSrc = assets.placeholder_image;

            return (
              <div
                key={act._id}
                className="border p-4 flex items-center justify-between rounded shadow-sm bg-white"
              >
                <div className="flex gap-4 items-center">
                  <img
                    src={cloudinaryImage(profileSrc, 160)}
                    alt={act.actName || "Act"}
                    className="w-20 h-20 object-cover rounded"
                    onError={(e) => {
                      e.currentTarget.src = assets.placeholder_image;
                    }}
                  />
                  <div>
                    <p className="font-semibold">{act.actName || "—"}</p>
                    <p className="text-xs text-gray-500">
                      {act.bandLeaderEmail || act.musicianEmail || "—"}
                    </p>
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

                <div className="flex items-center gap-2">
                  <button
                    className="bg-blue-600 text-white px-4 py-2 rounded text-sm"
                    onClick={() => openModal(act._id)}
                  >
                    View/Edit
                  </button>

                  <button
                    className="bg-green-600 text-white px-4 py-2 rounded text-sm disabled:opacity-50"
                    disabled={Boolean(updatingSubmission)}
                    onClick={() => updateStatus(act._id, "approved")}
                  >
                    {updatingSubmission === `${act._id}:approved` ? "Approving…" : "Approve"}
                  </button>
                  <button
                    className="bg-red-600 text-white px-4 py-2 rounded text-sm disabled:opacity-50"
                    disabled={Boolean(updatingSubmission)}
                    onClick={() => updateStatus(act._id, "rejected")}
                  >
                    {updatingSubmission === `${act._id}:rejected` ? "Rejecting…" : "Reject"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ✅ MODAL */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(e) => {
            // click backdrop to close
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="w-full max-w-5xl max-h-[92vh] bg-white rounded-xl shadow-xl overflow-y-auto">
            {/* header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="min-w-0">
                <p className="font-semibold truncate">
                  {selectedAct?.actName || selectedAct?.name || "PreSubmission"}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {selectedAct?.bandLeaderEmail ||
                    selectedAct?.musicianEmail ||
                    "—"}
                </p>
              </div>

              <button
                className="px-3 py-2 text-sm rounded border hover:bg-gray-50"
                onClick={closeModal}
              >
                Close
              </button>
            </div>

            {/* body */}
            <div className="p-4">
              {modalLoading ? (
                <div className="animate-pulse space-y-3">
                  <div className="h-4 w-1/2 bg-gray-200 rounded" />
                  <div className="h-4 w-2/3 bg-gray-200 rounded" />
                  <div className="h-64 w-full bg-gray-200 rounded" />
                </div>
              ) : !selectedAct ? (
                <p className="text-sm text-gray-600">No data loaded.</p>
              ) : (
                <div className="space-y-4">
                  {selectedVideos.length ? (
                    <section>
                      <h3 className="mb-3 text-sm font-semibold text-gray-900">Submitted videos</h3>
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {selectedVideos.map((video) => {
                          const details = getVideoDetails(video.url);
                          const isPlaying = activeVideoUrl === video.url && details?.embedUrl;

                          return (
                            <article key={`${video.label}-${video.url}`} className="overflow-hidden rounded-lg border bg-white">
                              {isPlaying ? (
                                <iframe
                                  src={`${details.embedUrl}?autoplay=1`}
                                  title={`${selectedAct?.actName || "Act"} ${video.label}`}
                                  className="aspect-video w-full bg-black"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                />
                              ) : details?.thumbnailUrl ? (
                                <button
                                  type="button"
                                  onClick={() => setActiveVideoUrl(video.url)}
                                  className="group relative block aspect-video w-full overflow-hidden bg-black"
                                  aria-label={`Play ${video.label}`}
                                >
                                  <img src={details.thumbnailUrl} alt="" className="h-full w-full object-cover transition group-hover:scale-105" />
                                  <span className="absolute inset-0 flex items-center justify-center bg-black/20">
                                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-2xl text-white shadow-lg">▶</span>
                                  </span>
                                </button>
                              ) : details?.embedUrl ? (
                                <button
                                  type="button"
                                  onClick={() => setActiveVideoUrl(video.url)}
                                  className="flex aspect-video w-full items-center justify-center bg-gray-900 text-sm font-semibold text-white"
                                >
                                  ▶ Play {video.label}
                                </button>
                              ) : (
                                <a href={video.url} target="_blank" rel="noreferrer" className="flex aspect-video items-center justify-center bg-gray-100 p-4 text-center text-sm text-blue-700 underline">
                                  Open {video.label}
                                </a>
                              )}
                              <div className="p-3">
                                <p className="text-sm font-semibold">{video.label}</p>
                                <a href={video.url} target="_blank" rel="noreferrer" className="mt-1 block truncate text-xs text-blue-700 underline">Open original link</a>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    </section>
                  ) : (
                    <p className="rounded border bg-gray-50 p-3 text-sm text-gray-500">No video links were supplied.</p>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-1 space-y-2 text-sm">
                    <div className="border rounded p-3">
                      <p className="text-xs text-gray-500">Status</p>
                      <p className="font-medium">{selectedAct?.status || "—"}</p>
                    </div>

                    <div className="border rounded p-3">
                      <p className="text-xs text-gray-500">Created</p>
                      <p className="font-medium">
                        {selectedAct?.createdAt
                          ? new Date(selectedAct.createdAt).toLocaleString()
                          : "—"}
                      </p>
                    </div>

                    <div className="border rounded p-3">
                      <p className="text-xs text-gray-500">ID</p>
                      <p className="font-mono text-xs break-all">
                        {selectedAct?._id}
                      </p>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        className="bg-green-600 text-white px-4 py-2 rounded text-sm disabled:opacity-50"
                        disabled={Boolean(updatingSubmission)}
                        onClick={() => updateStatus(selectedId, "approved")}
                      >
                        {updatingSubmission === `${selectedId}:approved` ? "Approving…" : "Approve"}
                      </button>
                      <button
                        className="bg-red-600 text-white px-4 py-2 rounded text-sm disabled:opacity-50"
                        disabled={Boolean(updatingSubmission)}
                        onClick={() => updateStatus(selectedId, "rejected")}
                      >
                        {updatingSubmission === `${selectedId}:rejected` ? "Rejecting…" : "Reject"}
                      </button>
                    </div>
                  </div>

                  {/* JSON preview */}
                  <div className="md:col-span-2">
                    <div className="border rounded-lg overflow-hidden">
                      <div className="px-3 py-2 bg-gray-50 border-b text-xs text-gray-600 flex justify-between">
                        <span>Submission payload</span>
                        <button
                          className="text-xs underline"
                          onClick={() => {
                            navigator.clipboard.writeText(
                              JSON.stringify(selectedAct, null, 2)
                            );
                            toast(
                              <CustomToast
                                type="success"
                                message="Copied JSON to clipboard"
                              />
                            );
                          }}
                        >
                          Copy JSON
                        </button>
                      </div>
                      <pre className="p-3 text-xs overflow-auto max-h-[60vh] bg-white">
                        {JSON.stringify(selectedAct, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
                </div>
              )}
            </div>

            {/* footer */}
            <div className="p-4 border-t flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded border hover:bg-gray-50 text-sm"
                onClick={closeModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActPreSubmissionPage;
