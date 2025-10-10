import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { backendUrl } from '../App'; // if not already

const PendingSongsModeration = () => {
  const [pendingSongs, setPendingSongs] = useState([]);
    const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingSongs();
  }, []);

  const fetchPendingSongs = async () => {
    try {
const res = await axios.get(`${backendUrl}/api/moderation/pending-songs`);
console.log("Fetched pending songs:", res.data); // ✅ Confirm structure
setPendingSongs(res.data.songs || []); // fallback

      setPendingSongs(res.data.songs);
    } catch (err) {
      console.error("Failed to load pending songs", err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (song) => {
    try {
      await axios.post("/api/moderation/approve-song", song);
      toast.success("Song approved!");
            setPendingSongs((prev) => prev.filter((s) => s._id !== song._id));
    } catch (err) {
      console.error("Approval failed", err);
    }
  };

  const handleReject = async (id) => {
    try {
      await axios.delete(`/api/moderation/reject-song/${id}`);
      toast.info("Song rejected.");      setPendingSongs((prev) => prev.filter((s) => s._id !== id));
    } catch (err) {
      console.error("Rejection failed", err);
    }
  };

  if (loading) return <div>Loading pending songs...</div>;

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Pending Songs for Approval</h2>
      {Array.isArray(pendingSongs) && pendingSongs.length === 0 ? (
  <p>No pending songs 🎉</p>
) : (
  <table className="w-full table-auto border">
    <thead>...</thead>
    <tbody>
      {Array.isArray(pendingSongs) &&
        pendingSongs.map((song) => (
          <tr key={song._id}>
            <td className="p-2 border">{song.title}</td>
            <td className="p-2 border">{song.artist}</td>
            <td className="p-2 border">{song.genre}</td>
            <td className="p-2 border">{song.year || "N/A"}</td>
            <td className="p-2 border space-x-2">
              <button
                onClick={() => handleApprove(song)}
                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Approve
              </button>
              <button
                onClick={() => handleReject(song._id)}
                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Reject
              </button>
            </td>
          </tr>
        ))}
    </tbody>
  </table>
)}
    </div>
  );
};

export default PendingSongsModeration;
