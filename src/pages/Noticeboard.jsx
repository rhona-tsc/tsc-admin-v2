import React, { useState, useEffect } from "react";
import axios from "axios";
import { Editor } from "@tinymce/tinymce-react";
import { backendUrl } from "../App";

const Noticeboard = ({ userRole }) => {
  const isAgent = String(userRole).toLowerCase() === "agent";

  const [items, setItems] = useState([]);
  const [editorContent, setEditorContent] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch existing announcements
  useEffect(() => {
    if (!isAgent) return;

    const loadNotices = async () => {
      try {
        const res = await axios.get(`${backendUrl}/api/noticeboard`);
        if (res.data?.success) {
          setItems(res.data.items || []);
        }
      } catch (err) {
        console.error("Failed to load noticeboard:", err);
      } finally {
        setLoading(false);
      }
    };

    loadNotices();
  }, [isAgent]);

  // Create new announcement
  const handleSubmit = async () => {
    if (!title.trim() || !editorContent.trim()) return;

    try {
      const res = await axios.post(`${backendUrl}/api/noticeboard`, {
        title,
        content: editorContent,
      });

      if (res.data.success) {
        setItems([res.data.notice, ...items]);
        setTitle("");
        setEditorContent("");
      }
    } catch (err) {
      console.error("Failed to create notice:", err);
    }
  };

  if (!isAgent) return <div className="p-6 text-red-600">Access denied.</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Noticeboard</h1>

      {/* CREATE NEW ANNOUNCEMENT */}
      <div className="bg-white shadow border p-4 rounded-lg mb-8">
        <h2 className="font-semibold mb-2">Post New Announcement</h2>

        <input
          type="text"
          className="border rounded px-3 py-2 w-full mb-4"
          placeholder="Announcement Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <Editor
          apiKey="no-api-key-needed"
          value={editorContent}
          onEditorChange={(newValue) => setEditorContent(newValue)}
          init={{
            height: 250,
            menubar: false,
            plugins: "link lists table autoresize",
            toolbar:
              "undo redo | bold italic underline | bullist numlist | link",
          }}
        />

        <button
          onClick={handleSubmit}
          className="mt-4 px-4 py-2 bg-black hover:bg-[#ff6667] text-white rounded"
        >
          Post Announcement
        </button>
      </div>

      {/* LIST OF ANNOUNCEMENTS */}
      <h2 className="text-xl font-semibold mb-4">All Announcements</h2>

      {loading ? (
        <p>Loading notices...</p>
      ) : items.length === 0 ? (
        <p className="text-gray-500">No announcements yet.</p>
      ) : (
        <div className="space-y-6">
          {items.map((notice) => (
            <div
              key={notice._id}
              className="bg-white shadow border rounded-lg p-4"
            >
              <div className="flex justify-between">
                <h3 className="font-semibold">{notice.title}</h3>
                <p className="text-xs text-gray-500">
                  {new Date(notice.createdAt).toLocaleString()}
                </p>
              </div>

              <div
                className="mt-3 prose"
                dangerouslySetInnerHTML={{ __html: notice.content }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Noticeboard;