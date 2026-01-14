import React, { useEffect, useState } from "react";
import axios from "axios";
import { backendUrl } from "../App";
import { toast } from "react-toastify";
import CustomToast from "../components/CustomToast";
import { assets } from "../assets/assets";

const ActPreSubmissionPage = () => {
  const [pendingActs, setPendingActs] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedAct, setSelectedAct] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  const getToken = () =>
    localStorage.getItem("authToken") || localStorage.getItem("token") || "";

  const authHeaders = () => {
    const token = getToken();
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

      const response = await axios.get(url, {
        withCredentials: true,
        headers: authHeaders(),
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

      // 🔧 Change this if your route differs
      const fetchOneUrl = `${backendUrl}/api/act-pre-submissions/${id}?_cb=${Date.now()}`;

      const res = await axios.get(fetchOneUrl, {
        withCredentials: true,
        headers: authHeaders(),
      });

      if (!res.data?.success) {
        toast(
          <CustomToast
            type="error"
            message={res.data?.message || "Failed to load submission"}
          />
        );
        return;
      }

      // depending on your API shape:
      const doc = res.data?.sub || res.data?.data || res.data?.presubmission || res.data;
      setSelectedAct(doc);
    } catch (e) {
      console.error("❌ openModal error:", e?.response?.data || e);
      toast(<CustomToast type="error" message="Failed to load submission" />);
    } finally {
      setModalLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedId(null);
    setSelectedAct(null);
    setModalLoading(false);
  };

  const updateStatus = async (id, action) => {
    try {
      const endpoint =
        action === "approved"
          ? `${backendUrl}/api/act-pre-submissions/approve/${id}`
          : `${backendUrl}/api/act-pre-submissions/reject/${id}`;

      const res = await axios.post(
        endpoint,
        {},
        {
          withCredentials: true,
          headers: authHeaders(),
        }
      );

      if (res.data?.success) {
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
        <CustomToast type="error" message="Error updating submission status" />
      );
    }
  };

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
                    src={profileSrc}
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

      {/* ✅ MODAL */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(e) => {
            // click backdrop to close
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="w-full max-w-4xl bg-white rounded-xl shadow-xl overflow-hidden">
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
                        className="bg-green-600 text-white px-4 py-2 rounded text-sm"
                        onClick={() => updateStatus(selectedId, "approved")}
                      >
                        Approve
                      </button>
                      <button
                        className="bg-red-600 text-white px-4 py-2 rounded text-sm"
                        onClick={() => updateStatus(selectedId, "rejected")}
                      >
                        Reject
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