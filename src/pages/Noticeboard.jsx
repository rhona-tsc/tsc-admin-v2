import React, { useState, useEffect } from "react";
import axios from "axios";
import { backendUrl } from "../App";
import assets from "../assets/assets";

const Noticeboard = ({ userRole, email }) => {
  const normalizedRole = String(userRole || "").toLowerCase().trim();
  const normalizedEmail = String(email || localStorage.getItem("userEmail") || "")
    .toLowerCase()
    .trim();

  const isAgent =
    ["agent", "admin", "superadmin", "tsc_admin"].includes(normalizedRole) ||
    normalizedEmail === "hello@thesupremecollective.co.uk";

  const [items, setItems] = useState([]);
  const [editorContent, setEditorContent] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadNotices = async () => {
      try {
        const res = await axios.get(`${backendUrl}/api/noticeboard/all`);
        if (!res.data?.success) throw new Error("Could not load announcements");
        setItems(res.data.notices || []);
      } catch (err) {
        console.error("Failed to load noticeboard:", err);
        setError("Could not load announcements. Please refresh to try again.");
      } finally {
        setLoading(false);
      }
    };

    loadNotices();
  }, []);

  const handleSubmit = async () => {
    if (saving || !title.trim() || !editorContent.trim()) return;
    setSaving(true);
    setError("");

    try {
      const res = await axios.post(`${backendUrl}/api/noticeboard/create`, {
        title: title.trim(),
        body: editorContent,
        authorName: "The Supreme Collective",
      });

      if (!res.data.success || !res.data.notice) throw new Error("Could not publish announcement");
      if (res.data.success) {
        setItems(current => [res.data.notice, ...current].sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) || new Date(b.createdAt) - new Date(a.createdAt)));
        setTitle("");
        setEditorContent("");
      }
    } catch (err) {
      console.error("Failed to create notice:", err);
      setError("The announcement was not published. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="text-center py-8 text-3xl">
        <div className="inline-flex items-center gap-3">
          <span className="text-gray-500 font-light">NOTICE</span>
          <span className="text-gray-900 font-semibold">BOARD</span>
          <span className="h-[2px] w-12 bg-[#ff6667]" />
        </div>
        <p className="mt-4 mx-auto max-w-2xl text-sm text-gray-600">
          Updates, reminders and announcements from The Supreme Collective.
        </p>
      </div>

      {error && <p role="alert" className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}

      {isAgent && (
        <div className="bg-white shadow border p-4 rounded-lg mb-8">
          <h2 className="font-semibold mb-2">Post New Announcement</h2>

          <input
            type="text"
            className="border rounded px-3 py-2 w-full mb-4"
            placeholder="Announcement Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

         <textarea
  className="border rounded px-3 py-2 w-full min-h-[220px] text-sm"
  placeholder="Write your announcement here. You can use simple HTML if needed, e.g. <p>, <strong>, <ul>, <li>."
  value={editorContent}
  onChange={(e) => setEditorContent(e.target.value)}
/>

          <button
            onClick={handleSubmit}
            disabled={saving || !title.trim() || !editorContent.trim()}
            className="mt-4 px-4 py-2 bg-black hover:bg-[#ff6667] text-white rounded disabled:opacity-40"
          >
            {saving ? "Publishing…" : "Post Announcement"}
          </button>
        </div>
      )}

      <div className="space-y-6">
        {loading ? (
          <p>Loading notices...</p>
        ) : (
          items.map((notice) => (
            <div key={notice._id} className="bg-white shadow border rounded-lg p-4">
              <div className="flex justify-between gap-4">
                <h3 className="font-semibold">{notice.title}</h3>
                <p className="text-xs text-gray-500">
                  {new Date(notice.createdAt).toLocaleString()}
                </p>
              </div>

              <div
                className="mt-3 max-w-none text-sm leading-7 [&_p]:mb-4 [&_h3]:mb-2 [&_h3]:mt-5 [&_h3]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_a]:font-semibold [&_a]:text-[#b53639] [&_a]:underline"
                dangerouslySetInnerHTML={{ __html: notice.body || notice.content || "" }}
              />
            </div>
          ))
        )}

        <div className="bg-black text-white p-6 shadow-lg border border-gray-200 rounded-xl">
          <h2 className="text-2xl font-bold tracking-wide mb-2">
            The Supreme Collective Portal
          </h2>

          <p className="text-sm opacity-90 mb-4">
            Thanks for joining. We’ve got some genuinely exciting things planned
            for the future — built on 10+ years of managing acts, booking gigs,
            and performing at a high level. Our goal is simple: more gigs, more
            musicians, and smoother processes for everyone.
          </p>

          <div className="text-sm leading-relaxed opacity-90 space-y-5">
            <section>
              <h3 className="font-semibold mb-1">What you can do here</h3>
              <p>
                <strong>Join The Books</strong> works like your musician CV. Add
                your skills, equipment, talents and logistics so we can put you
                forward to deputise in acts that suit you.
              </p>
              <img
                src={assets.join_the_books}
                alt="Join The Books"
                className="w-60 h-auto rounded shadow-md my-3"
              />
            </section>

            <section>
              <h3 className="font-semibold mb-1">Submit An Act</h3>
              <p>
                Submit Act starts with a quick pre-screen. If it’s a great fit,
                we’ll send an Act Submission Invite Code to unlock the full act
                submission form.
              </p>
              <img
                src={assets.submit_your_act}
                alt="Submit Your Act"
                className="w-full max-w-3xl h-auto rounded shadow-md my-3"
              />
            </section>

            <section>
              <h3 className="font-semibold mb-1">How availability works</h3>
              <p>
                Lead vocalists are asked for availability instantly when an
                enquiry comes in. These WhatsApp messages come from 07453423200
                and use quick reply buttons.
              </p>
              <img
                src={assets.quick_reply_buttons}
                alt="Quick Reply Buttons"
                className="w-full max-w-md h-auto rounded shadow-md my-3"
              />
            </section>

            <section>
              <h3 className="font-semibold mb-1">What’s coming next</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>Automatic allocation of original band members and deputies.</li>
                <li>Payment tracking for gigs and deputy payouts.</li>
                <li>Monthly performance overviews for acts.</li>
                <li>Peer reviews and client satisfaction averages.</li>
              </ul>
            </section>

            <p className="text-center pt-2">
              <strong>Minimalist for now</strong> — but built to scale. Thanks
              for being here.
              <br />
              <span className="font-semibold">Let’s go.</span>
            </p>
          </div>
        </div>


      </div>
    </div>
  );
};

export default Noticeboard;