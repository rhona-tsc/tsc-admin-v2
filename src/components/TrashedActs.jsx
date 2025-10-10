import React, { useEffect, useState } from "react";
import axios from "axios";
import { backendUrl } from "../App";
import { toast } from "react-toastify";
import CustomToast from "../components/CustomToast";
import { assets } from "../assets/assets";
import { useNavigate } from "react-router-dom";

const TrashedActs = ({ token }) => {
  const [trashedActs, setTrashedActs] = useState([]);
  const navigate = useNavigate();
  const fetchTrashedActs = async () => {
    try {
      const res = await axios.get(`${backendUrl}/api/musician/act-v2/trashed`, {
        headers: { token },
      });
      if (res.data.success) {
        setTrashedActs(res.data.acts);
      } else {
        toast(<CustomToast type="error" message={res.data.message} />);
      }
    } catch (err) {
      toast(<CustomToast type="error" message="Failed to fetch trashed acts" />);
    }
  };
  const restoreAct = async (id) => {
    try {
      const res = await axios.post(
        `${backendUrl}/api/musician/act-v2/restore`,
        { id },
        { headers: { token } }
      );
      if (res.data.success) {
        toast(<CustomToast type="success" message="Act restored from trash" />);
        fetchTrashedActs();
      } else {
        toast(<CustomToast type="error" message={res.data.message} />);
      }
    } catch (err) {
      toast(<CustomToast type="error" message="Failed to restore act" />);
    }
  };
  const permanentlyDeleteAct = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this act? This action cannot be undone.")) return;
    try {
      const res = await axios.delete(`${backendUrl}/api/musician/act-v2/delete-permanent`, {
        headers: { token },
        data: { id },
      });
      if (res.data.success) {
        toast(<CustomToast type="success" message="Act permanently deleted" />);
        fetchTrashedActs();
      } else {
        toast(<CustomToast type="error" message={res.data.message} />);
      }
    } catch (err) {
      toast(<CustomToast type="error" message="Failed to delete act permanently" />);
    }
  };
  useEffect(() => {
    fetchTrashedActs();
  }, []);
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Trashed Acts</h1>
      {trashedActs.length === 0 ? (
        <p className="text-gray-600">No trashed acts.</p>
      ) : (
        trashedActs.map((act) => (
          <div key={act._id} className="flex items-center border p-3 mb-3 rounded shadow gap-4">
            <div className="flex items-center gap-4">
              <div className="w-[100px] h-[75px] overflow-hidden flex items-center justify-center">
                <img
                  src={typeof act.images?.[0] === "string" ? act.images[0] : act.images?.[0]?.url || assets.placeholder_image}
                  alt={act.name}
                  className="object-cover w-full h-full"
                />
              </div>
              <div>
                <p className="font-semibold">{act.name}</p>
              </div>
            </div>
            <div className="ml-auto flex gap-2">
              <button
                className="bg-blue-600 text-white px-3 py-1 rounded"
                onClick={() => restoreAct(act._id)}
              >
                Restore
              </button>
              <button
                className="bg-red-600 text-white px-3 py-1 rounded"
                onClick={() => permanentlyDeleteAct(act._id)}
              >
                Delete Permanently
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default TrashedActs;