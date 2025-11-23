import React, { useEffect, useState } from "react";
import axios from "axios";
import { backendUrl } from "../App";

const Feedback = ({ userRole }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  const isAgent = String(userRole).toLowerCase() === "agent";

  useEffect(() => {
    if (!isAgent) return;

    const fetchFeedback = async () => {
      try {
        const res = await axios.get(`${backendUrl}/api/feedback`);
        if (res.data?.success) {
          setMessages(res.data.feedback || []);
        }
      } catch (err) {
        console.error("Failed to load feedback:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFeedback();
  }, [isAgent]);

  if (!isAgent) return <div className="p-6 text-red-600">Access denied.</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">User Feedback</h1>

      {loading ? (
        <p>Loading feedback...</p>
      ) : messages.length === 0 ? (
        <p className="text-gray-500">No feedback submitted yet.</p>
      ) : (
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg._id}
              className="bg-white shadow border rounded-lg p-4"
            >
              <div className="flex justify-between">
                <p className="font-semibold">{msg.userName || "Unknown User"}</p>
                <p className="text-xs text-gray-500">
                  {new Date(msg.createdAt).toLocaleString()}
                </p>
              </div>
              <p className="mt-2 whitespace-pre-wrap">{msg.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Feedback;