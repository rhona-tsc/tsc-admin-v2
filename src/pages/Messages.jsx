import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { backendUrl } from "../App";

const normalize = (s) => (s || "").toLowerCase().trim();
const isObjectId = (s) => /^[0-9a-fA-F]{24}$/.test(s || "");

const getRoleFromStorage = () => {
  return (
    localStorage.getItem("userRole") ||
    localStorage.getItem("role") ||
    localStorage.getItem("musicianRole") ||
    ""
  );
};

const formatDateTime = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const statusPillClass = (status) => {
  const s = normalize(status);
  if (s === "replied") return "bg-green-100 text-green-700 border-green-200";
  if (s === "failed") return "bg-red-100 text-red-700 border-red-200";
  if (s === "sent") return "bg-blue-100 text-blue-700 border-blue-200";
  return "bg-gray-100 text-gray-700 border-gray-200";
};

const channelPillClass = (channel) => {
  const c = normalize(channel);
  if (c === "whatsapp") return "bg-emerald-100 text-emerald-700 border-emerald-200";
  if (c === "sms") return "bg-sky-100 text-sky-700 border-sky-200";
  if (c === "website") return "bg-purple-100 text-purple-700 border-purple-200";
  return "bg-gray-100 text-gray-700 border-gray-200";
};

const Messages = ({ userRole, userId, firstName }) => {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [debugError, setDebugError] = useState("");

  const musicianId = useMemo(() => {
    const fromProps = userId;
    const fromLS =
      localStorage.getItem("musicianId") || localStorage.getItem("userId");
    if (isObjectId(fromProps)) return fromProps;
    if (isObjectId(fromLS)) return fromLS;
    return null;
  }, [userId]);

  const resolvedUserRole = normalize(userRole || getRoleFromStorage());
  const isAgent = resolvedUserRole === "agent" || resolvedUserRole === "admin";

  const fetchThreads = async () => {
    try {
      setLoading(true);
      setDebugError("");
      const token = localStorage.getItem("token");

      const url = isAgent
        ? `${backendUrl}/api/messages`
        : `${backendUrl}/api/messages/mine`;

      console.log("[Messages] backendUrl:", backendUrl);
      console.log("[Messages] userRole prop:", userRole);
      console.log("[Messages] resolvedUserRole:", resolvedUserRole);
      console.log("[Messages] isAgent:", isAgent);
      console.log("[Messages] fetching url:", url);

      const res = await axios.get(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        withCredentials: true,
      });

      const items = Array.isArray(res.data?.threads) ? res.data.threads : [];
      console.log("[Messages] fetched thread count:", items.length, items);
      setThreads(items);

      if (!activeThreadId && items.length > 0) {
        setActiveThreadId(items[0]._id);
      }
    } catch (err) {
      console.error("Failed to fetch messages:", err);
      setDebugError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to fetch messages"
      );
      setThreads([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThreads();
  }, [userRole, userId]);

  const filteredThreads = useMemo(() => {
    const q = normalize(search);

    return threads.filter((thread) => {
      const recipientName = normalize(thread?.recipientName);
      const actName = normalize(thread?.actName);
      const latestMessage = normalize(thread?.latestMessage?.body);
      const channel = normalize(thread?.channel);
      const status = normalize(thread?.status);

      const matchesSearch =
        !q ||
        recipientName.includes(q) ||
        actName.includes(q) ||
        latestMessage.includes(q);

      const matchesFilter =
        filter === "all" ||
        channel === filter ||
        status === filter;

      return matchesSearch && matchesFilter;
    });
  }, [threads, search, filter]);

  console.log("[Messages] filteredThreads:", filteredThreads);
  const activeThread =
    filteredThreads.find((t) => t._id === activeThreadId) ||
    filteredThreads[0] ||
    null;

  useEffect(() => {
    if (!activeThreadId && filteredThreads.length > 0) {
      setActiveThreadId(filteredThreads[0]._id);
    }
  }, [filteredThreads, activeThreadId]);

  const handleReply = async () => {
    if (!activeThread?._id || !replyText.trim()) return;

    try {
      setSendingReply(true);
      const token = localStorage.getItem("token");

      await axios.post(
        `${backendUrl}/api/messages/${activeThread._id}/reply`,
        {
          body: replyText.trim(),
          channel: "website",
          senderRole: isAgent ? "agent" : "musician",
          senderName: firstName || "User",
          senderMusicianId: !isAgent ? musicianId : null,
        },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          withCredentials: true,
        }
      );

      setReplyText("");
      await fetchThreads();
    } catch (err) {
      console.error("Failed to send reply:", err);
      alert("Sorry, reply failed to send.");
    } finally {
      setSendingReply(false);
    }
  };

  return (
    <div className="w-full p-6">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Messages</h1>
          <p className="text-sm text-gray-500 mt-1">
            {isAgent
              ? "Monitor outbound messages and incoming replies across all vocalists."
              : "View and reply to messages sent to you."}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Role: {resolvedUserRole || "unknown"} • API: {backendUrl}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            placeholder="Search by musician, act, or message…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-w-[260px] rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-black"
          />

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-black"
          >
            <option value="all">All</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="sms">SMS</option>
            <option value="website">Website</option>
            <option value="sent">Sent</option>
            <option value="replied">Replied</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr]">
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-gray-200 px-4 py-3 font-medium">
            Threads
          </div>

          <div className="max-h-[70vh] overflow-y-auto">
            {loading ? (
              <div className="p-4 text-sm text-gray-500">Loading messages…</div>
            ) : debugError ? (
              <div className="p-4 text-sm text-red-600">
                Failed to load messages: {debugError}
              </div>
            ) : filteredThreads.length === 0 ? (
              <div className="p-4 text-sm text-gray-500">
                No messages found. Raw threads: {threads.length}
              </div>
            ) : (
              filteredThreads.map((thread) => {
                const isActive = thread._id === activeThread?._id;

                return (
                  <button
                    key={thread._id}
                    onClick={() => setActiveThreadId(thread._id)}
                    className={`w-full border-b border-gray-100 px-4 py-4 text-left transition ${
                      isActive ? "bg-[#fff1f1]" : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-sm text-gray-900">
                          {thread.recipientName || thread.recipientPhone || "Unknown recipient"}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
{(thread.actName || "No act linked") +
  (thread.messageCount
    ? ` • ${thread.messageCount} message${thread.messageCount === 1 ? "" : "s"}`
    : "")}                        </p>
                      </div>

                      <span
                        className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${statusPillClass(
                          thread.status
                        )}`}
                      >
                        {thread.status || "unknown"}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-2">
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${channelPillClass(
                          thread.channel
                        )}`}
                      >
                        {thread.channel || "unknown"}
                      </span>

                      {thread.unreadReplies > 0 && (
                        <span className="rounded-full border border-[#ff6667] bg-[#ff6667] px-2 py-0.5 text-[11px] font-medium text-white">
                          {thread.unreadReplies} new
                        </span>
                      )}
                    </div>

                    <p className="mt-3 line-clamp-2 text-sm text-gray-600">
                      {thread.latestMessage?.body || "No message preview"}
                    </p>

                    <p className="mt-2 text-xs text-gray-400">
                      {formatDateTime(thread.latestMessage?.createdAt)}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          {!activeThread ? (
            <div className="p-8 text-sm text-gray-500">
              Select a message thread to view it.
            </div>
          ) : (
            <>
              <div className="border-b border-gray-200 px-5 py-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">
                      {activeThread.recipientName || activeThread.recipientPhone || "Recipient"}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {activeThread.recipientPhone || activeThread.recipientEmail || "No contact details"}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-medium ${channelPillClass(
                        activeThread.channel
                      )}`}
                    >
                      {activeThread.channel || "unknown"}
                    </span>
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-medium ${statusPillClass(
                        activeThread.status
                      )}`}
                    >
                      {activeThread.status || "unknown"}
                    </span>
                  </div>
                </div>

                <div className="mt-3 grid gap-2 text-sm text-gray-600 sm:grid-cols-2">
                  <p><span className="font-medium text-gray-800">Act:</span> {activeThread.actName || "—"}</p>
                  <p><span className="font-medium text-gray-800">Booking date:</span> {activeThread.eventDate || "—"}</p>
                  <p><span className="font-medium text-gray-800">Reference:</span> {activeThread.reference || "—"}</p>
                  <p><span className="font-medium text-gray-800">Slot:</span> {activeThread.slotLabel || "—"}</p>
                </div>
              </div>

              <div className="max-h-[52vh] overflow-y-auto px-5 py-5 space-y-4 bg-gray-50">
                {(activeThread.messages || []).map((message) => {
                  const mine =
                    (isAgent && message.senderRole === "agent") ||
                    (!isAgent && message.senderRole === "musician");

                  return (
                    <div
                      key={message._id}
                      className={`flex ${mine ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${
                          mine
                            ? "bg-black text-white"
                            : "bg-white text-gray-800 border border-gray-200"
                        }`}
                      >
                        <div className="mb-1 flex items-center gap-2 text-xs opacity-80">
                          <span>{message.senderName || message.senderRole || "Unknown"}</span>
                          <span>•</span>
                          <span>{formatDateTime(message.createdAt)}</span>
                          {message.channel && (
                            <>
                              <span>•</span>
                              <span>{message.channel}</span>
                            </>
                          )}
                        </div>

                        <p className="whitespace-pre-wrap text-sm leading-6">
                          {message.body}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-gray-200 p-4">
                <div className="rounded-2xl border border-gray-200 bg-white p-3">
                  <textarea
                    rows={4}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your reply here..."
                    className="w-full resize-none border-0 outline-none text-sm"
                  />

                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-xs text-gray-400">
                      This reply will be saved to the thread as a website reply.
                    </p>

                    <button
                      onClick={handleReply}
                      disabled={sendingReply || !replyText.trim()}
                      className="rounded-lg bg-[#ff6667] px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {sendingReply ? "Sending..." : "Send Reply"}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Messages;