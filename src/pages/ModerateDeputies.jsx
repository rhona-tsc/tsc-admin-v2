// admin/src/pages/ModerateDeputies.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { backendUrl } from "../App";
import CustomToast from "../components/CustomToast";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const PILL = ({ status }) => {
  const base = "inline-block px-2 py-[2px] rounded text-xs font-semibold";
  const cls =
    status === "pending"
      ? "bg-yellow-100 text-yellow-800"
      : status === "Approved, changes pending"
      ? "bg-indigo-100 text-indigo-800"
      : "bg-gray-100 text-gray-700";
  return <span className={`${base} ${cls}`}>{status}</span>;
};

const ModerateDeputies = ({ token }) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [debugOpen, setDebugOpen] = useState(true);
  const [debugPayload, setDebugPayload] = useState(null);
  const navigate = useNavigate();

  const fetchQueue = async () => {
    setLoading(true);
    try {
      // ask for both statuses
      const statuses = encodeURIComponent("pending,Approved, changes pending");
      const url = `${backendUrl}/api/moderation/deputies/review-queue?statuses=${statuses}`;
      const res = await axios.get(url, { headers: { token } });
      setDebugPayload(res.data);
      setRows(res.data?.deputies || []);
    } catch (err) {
      // fallback to only "pending"
      console.warn("⚠️ COMBINED queue failed, falling back to /pending only:", err);
      try {
        const res = await axios.get(`${backendUrl}/api/moderation/deputies/pending`, { headers: { token } });
        setDebugPayload(res.data);
        setRows(res.data?.deputies || []);
      } catch (err2) {
        toast(<CustomToast type="error" message="Failed to load deputies" />);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (id, action) => {
    const endpoint = action === "approve" ? "approve-deputy" : "reject-deputy";
    try {
      const res = await axios.post(`${backendUrl}/api/${endpoint}`, { id }, { headers: { token } });
      toast(<CustomToast type="success" message={res.data.message || `Deputy ${action}d`} />);
      fetchQueue();
    } catch (err) {
      toast(<CustomToast type="error" message={`Failed to ${action}`} />);
    }
  };

  const sorted = useMemo(() => {
    // ensure “Approved, changes pending” shows first, then “pending”
    const weight = (s) => (s === "Approved, changes pending" ? 0 : s === "pending" ? 1 : 2);
    return [...rows].sort((a, b) => weight(a.status) - weight(b.status));
  }, [rows]);

  useEffect(() => {
    fetchQueue();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Moderate Deputies</h1>
        <button
          className="text-sm px-3 py-1 border rounded"
          onClick={() => setDebugOpen((v) => !v)}
        >
          {debugOpen ? "Hide Debug" : "Show Debug"}
        </button>
      </div>

      {debugOpen && (
        <pre className="bg-gray-50 p-4 border rounded text-xs overflow-auto mb-4">
{JSON.stringify(
  {
    total: debugPayload?.total ?? sorted.length,
    statusCounts: debugPayload?.statusCounts ?? sorted.reduce((acc, d) => {
      acc[d.status] = (acc[d.status] || 0) + 1;
      return acc;
    }, {}),
    sample: sorted.slice(0, 10).map((d) => ({ id: d._id, name: d.name, status: d.status })),
  },
  null,
  2
)}
        </pre>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : sorted.length === 0 ? (
        <p>No deputies in the review queue.</p>
      ) : (
        <div className="grid gap-4">
          {sorted.map((m) => (
            <div key={m._id} className="p-4 border rounded bg-white flex items-center justify-between">
              <div>
                <p className="font-semibold">{m.name}</p>
                <p className="text-sm text-gray-500">{m.email}</p>
                <div className="mt-1"><PILL status={m.status} /></div>
              </div>
              <div className="flex gap-2">
                <button
                  className="px-3 py-1 bg-blue-600 text-white rounded"
                  onClick={() => navigate(`/moderate-deputy/edit/${m._id}`)}
                >
                  View/Edit
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ModerateDeputies;