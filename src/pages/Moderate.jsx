import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { backendUrl } from '../App';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import CustomToast from "../components/CustomToast";
import { assets } from '../assets/assets';

const Moderate = () => {
  const navigate = useNavigate();
  const [pendingActs, setPendingActs] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleEdit = (id) => {
    // open the moderation-safe editor which won’t autosave empties
    navigate(`/moderate/edit/${id}`);
  };

  const fetchPendingActs = async () => {
    try {
      setLoading(true);

      // These params are optional – your backend can ignore them if unsupported
      const params = {
        status: 'pending,Approved, changes pending',
        fields: '_id,name,tscName,images,profileImage,coverImage,createdAt,status'
      };

      const response = await axios.get(`${backendUrl}/api/musician/act-v2/list`, { params });

      if (response.data?.success) {
        const acts = Array.isArray(response.data.acts) ? response.data.acts : [];
        const pending = acts.filter(
          (act) => act.status === 'pending' || act.status === 'Approved, changes pending'
        );
        setPendingActs(pending);
      } else {
        toast(<CustomToast type="error" message={response.data?.message || "Failed to load acts"} />);
      }
    } catch (error) {
      console.error('❌ fetchPendingActs error:', error?.response?.data || error);
      toast(<CustomToast type="error" message="Failed to load pending acts" />);
    } finally {
      setLoading(false);
    }
  };

  // Token refresh via HTTP-only cookie (optional)
  const refreshToken = async () => {
    try {
      const res = await axios.post(`${backendUrl}/api/auth/refresh`, {}, { withCredentials: true });
      if (res.data?.success && res.data?.token) {
        localStorage.setItem('authToken', res.data.token);
        return res.data.token;
      }
    } catch (err) {
      console.error('❌ Token refresh failed:', err);
    }
    return null;
  };

  const updateStatus = async (id, status) => {
    const makeRequest = async (token) =>
      axios.post(
        `${backendUrl}/api/musician/act-v2/update-status`,
        { id, status },
        { headers: { Authorization: `Bearer ${token}` } }
      );

    try {
      let token = localStorage.getItem('authToken');
      let response = await makeRequest(token);

      if (response.data?.success) {
        toast(<CustomToast type="success" message={`Act ${status}`} />);
        fetchPendingActs();
      } else {
        toast(<CustomToast type="error" message={response.data?.message || "Update failed"} />);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        const newToken = await refreshToken();
        if (newToken) {
          try {
            const retry = await makeRequest(newToken);
            if (retry.data?.success) {
              toast(<CustomToast type="success" message={`Act ${status}`} />);
              fetchPendingActs();
              return;
            } else {
              toast(<CustomToast type="error" message={retry.data?.message || "Update failed"} />);
            }
          } catch {
            toast(<CustomToast type="error" message="Retry failed after token refresh" />);
          }
        } else {
          toast(<CustomToast type="error" message="Session expired. Please log in again." />);
        }
      } else {
        toast(<CustomToast type="error" message="Error updating status" />);
      }
    }
  };

  useEffect(() => {
    fetchPendingActs();
  }, []);

  return (
    <div>
      <h2 className="mb-4 text-lg font-bold">Pending Acts</h2>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse flex items-center justify-between border p-4 rounded bg-white">
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
            // prefer profileImage[0], fallback to images[0]
            const profileSrc =
              typeof act?.profileImage?.[0] === 'string'
                ? act.profileImage[0]
                : act?.profileImage?.[0]?.url ||
                  (typeof act?.images?.[0] === 'string'
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
                  </div>
                </div>

                <div className="text-sm text-gray-600">
                  <p>Created At: {act.createdAt ? new Date(act.createdAt).toLocaleDateString() : '-'}</p>
                </div>

                <div className="text-sm text-gray-600">
                  <button
                    className="bg-blue-600 text-white px-4 py-2 rounded text-sm"
                    onClick={() => handleEdit(act._id)}
                  >
                    View/Edit
                  </button>
                </div>

                {act._id && (
                  <div className="flex gap-2">
                    <button
                      className="bg-green-600 text-white px-4 py-2 rounded text-sm"
                      onClick={() => updateStatus(act._id, 'approved')}
                    >
                      Approve
                    </button>
                    <button
                      className="bg-red-600 text-white px-4 py-2 rounded text-sm"
                      onClick={() => updateStatus(act._id, 'rejected')}
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Moderate;