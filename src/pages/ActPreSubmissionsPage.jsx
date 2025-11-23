import React, { useEffect, useState } from "react";
import axios from "axios";
import { backendUrl } from "../App";
import { format } from "date-fns";

const ActPreSubmissionsPage = () => {
  const [items, setItems] = useState([]);

  const fetchItems = async () => {
    try {
const res = await axios.get(`${backendUrl}/api/act-pre-submissions/pending`);
      setItems(res.data.items || []);
    } catch (err) {
      console.error("Failed to load Pre-Submissions:", err);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const approveItem = async (id) => {
    try {
      const res = await axios.post(`${backendUrl}/api/act-pre-submissions/${id}/approve`);
      await fetchItems();
      alert("Act approved & invite sent!");
    } catch (err) {
      console.error("Approval failed:", err);
    }
  };

  const rejectItem = async (id) => {
    try {
      await axios.post(`${backendUrl}/api/act-pre-submissions/${id}/reject`);
      await fetchItems();
      alert("Act rejected & notice sent.");
    } catch (err) {
      console.error("Reject failed:", err);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Act Pre-Submissions</h1>

      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={item._id}
            className={`p-4 border rounded shadow-sm ${
              item.status !== "pending" ? "opacity-50 pointer-events-none" : ""
            }`}
          >
            <div className="font-semibold text-lg">{item.actName}</div>
            <div className="text-sm text-gray-600">
              Submitted by {item.contactName} ({item.contactEmail})
              <br />
              {format(new Date(item.createdAt), "dd MMM yyyy • HH:mm")}
            </div>

            {item.extraInfo && (
              <div className="mt-2 text-gray-700 text-sm">
                <strong>Notes:</strong> {item.extraInfo}
              </div>
            )}

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => approveItem(item._id)}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Approve & Send Invite
              </button>

              <button
                onClick={() => rejectItem(item._id)}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Reject
              </button>
            </div>

            {item.status !== "pending" && (
              <p className="mt-2 text-sm italic text-gray-500">
                {item.status === "approved" ? "Approved" : "Rejected"}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActPreSubmissionsPage;