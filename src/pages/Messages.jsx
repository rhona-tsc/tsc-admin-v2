import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { backendUrl } from "../App";

const normalize = (s) => (s || "").toLowerCase().trim();

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

const quickReplyConfig = [
  {
    key: "yes",
    buttonText: "I am available",
    buttonPayloadPrefix: "YES",
  },
  {
    key: "no",
    buttonText: "Not for this place",
    buttonPayloadPrefix: "NOLOC",
  },
  {
    key: "unavailable",
    buttonText: "Unavailable this day",
    buttonPayloadPrefix: "UNAVAILABLE",
  },
];

const Messages = ({ userRole, firstName }) => {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeThreadId, setActiveThreadId] = useState(null);
 const [sendingReply, setSendingReply] = useState(false);
const [search, setSearch] = useState("");
const [filter, setFilter] = useState("all");
const [debugError, setDebugError] = useState("");
const [messageSearch, setMessageSearch] = useState("");
const [replyingMessageId, setReplyingMessageId] = useState("");
const [replyBody, setReplyBody] = useState("");
const [recipients, setRecipients] = useState([]);
const [showNewMessage, setShowNewMessage] = useState(false);
const [newRecipientId, setNewRecipientId] = useState("");
const [newMessageBody, setNewMessageBody] = useState("");
const [recipientSearch, setRecipientSearch] = useState("");
const [sendError, setSendError] = useState("");

  const resolvedUserRole = normalize(userRole || getRoleFromStorage());
  const isAgent = resolvedUserRole === "agent" || resolvedUserRole === "admin";

  const fetchThreads = useCallback(async () => {
    try {
      setLoading(true);
      setDebugError("");
      const token = localStorage.getItem("token");

      const url = isAgent
        ? `${backendUrl}/api/messages`
        : `${backendUrl}/api/messages/mine`;

      const res = await axios.get(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        withCredentials: true,
      });

      const items = Array.isArray(res.data?.threads) ? res.data.threads : [];
      setThreads(items);

      setActiveThreadId((current) => current || items[0]?._id || null);
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
  }, [isAgent]);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  useEffect(() => {
    if (!isAgent) return;
    const fetchRecipients = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${backendUrl}/api/messages/recipients`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          withCredentials: true,
        });
        setRecipients(Array.isArray(res.data?.recipients) ? res.data.recipients : []);
      } catch (error) {
        console.error("Failed to load message recipients:", error);
      }
    };
    fetchRecipients();
  }, [isAgent]);

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

  const activeThread =
    filteredThreads.find((t) => t._id === activeThreadId) ||
    filteredThreads[0] ||
    null;

  useEffect(() => {
    if (!activeThreadId && filteredThreads.length > 0) {
      setActiveThreadId(filteredThreads[0]._id);
    }
  }, [filteredThreads, activeThreadId]);

  useEffect(() => {
    if (!activeThread?._id || Number(activeThread.unreadReplies || 0) === 0) return;
    const markRead = async () => {
      try {
        const token = localStorage.getItem("token");
        await axios.post(
          `${backendUrl}/api/messages/${encodeURIComponent(activeThread._id)}/mark-read`,
          {},
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            withCredentials: true,
          }
        );
        setThreads((current) =>
          current.map((thread) =>
            thread._id === activeThread._id ? { ...thread, unreadReplies: 0 } : thread
          )
        );
      } catch (error) {
        console.error("Failed to mark message thread as read:", error);
      }
    };
    markRead();
  }, [activeThread?._id, activeThread?.unreadReplies]);

const handleQuickReply = async (message, replyKey) => {
  if (!message?.rowId || !replyKey) return;

  const selected = quickReplyConfig.find((item) => item.key === replyKey);
  if (!selected) return;

  try {
    setSendingReply(true);
    setReplyingMessageId(message._id);
    const token = localStorage.getItem("token");

    await axios.post(
      `${backendUrl}/api/messages/message-reply`,
      {
        rowId: message.rowId,
        requestId: message.requestId || "",
        reply: selected.key,
        buttonText: selected.buttonText,
        buttonPayload: `${selected.buttonPayloadPrefix}${message.requestId || ""}`,
        senderName: firstName || "User",
      },
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        withCredentials: true,
      }
    );

    await fetchThreads();
  } catch (err) {
    console.error("Failed to send quick reply:", err);
    alert("Sorry, quick reply failed to send.");
  } finally {
    setSendingReply(false);
    setReplyingMessageId("");
  }
};

const visibleMessages = (activeThread?.messages || []).filter((message) => {
  const q = normalize(messageSearch);
  if (!q) return true;

  const haystack = [
    message?.body,
    message?.senderName,
    message?.channel,
    message?.requestId,
    message?.buttonText,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(q);
});

const handleThreadReply = async (event) => {
  event.preventDefault();
  if (!activeThread?._id || !replyBody.trim()) return;
  try {
    setSendingReply(true);
    setSendError("");
    const token = localStorage.getItem("token");
    await axios.post(
      `${backendUrl}/api/messages/${encodeURIComponent(activeThread._id)}/reply`,
      { body: replyBody.trim(), senderName: firstName || (isAgent ? "The Supreme Collective" : "Musician") },
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        withCredentials: true,
      }
    );
    setReplyBody("");
    await fetchThreads();
  } catch (error) {
    setSendError(error?.response?.data?.message || "The message could not be sent.");
  } finally {
    setSendingReply(false);
  }
};

const handleStartConversation = async (event) => {
  event.preventDefault();
  if (!newRecipientId || !newMessageBody.trim()) return;
  try {
    setSendingReply(true);
    setSendError("");
    const token = localStorage.getItem("token");
    await axios.post(
      `${backendUrl}/api/messages/start`,
      { musicianId: newRecipientId, body: newMessageBody.trim() },
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        withCredentials: true,
      }
    );
    setShowNewMessage(false);
    setNewMessageBody("");
    setRecipientSearch("");
    const startedThreadId = `person__${newRecipientId}`;
    setNewRecipientId("");
    await fetchThreads();
    setActiveThreadId(startedThreadId);
  } catch (error) {
    setSendError(error?.response?.data?.message || "The conversation could not be started.");
  } finally {
    setSendingReply(false);
  }
};

const filteredRecipients = recipients.filter((recipient) => {
  const q = normalize(recipientSearch);
  return !q || normalize(`${recipient.name} ${recipient.email}`).includes(q);
});


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
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          {isAgent && (
            <button
              type="button"
              onClick={() => {
                setSendError("");
                setNewRecipientId((current) => current || recipients[0]?._id || "");
                setShowNewMessage(true);
              }}
              className="rounded-lg bg-black px-4 py-2 font-medium text-white hover:bg-gray-800"
            >
              New message
            </button>
          )}
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

             <div className="border-b border-gray-200 bg-white px-5 py-3">
  <input
    type="text"
    placeholder="Search within this message history…"
    value={messageSearch}
    onChange={(e) => setMessageSearch(e.target.value)}
    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm outline-none focus:border-black"
  />
</div>

<div className="max-h-[52vh] overflow-y-auto px-5 py-5 space-y-4 bg-gray-50">
  {visibleMessages.map((message) => {
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

{message.requestId && (
  <p className="mt-2 text-[11px] opacity-70">
    Ref: {message.requestId}
  </p>
)}

{!isAgent &&
  message.senderRole === "agent" &&
  message.rowId &&
  !message.reply && (
    <div className="mt-3 flex flex-wrap gap-2">
      {quickReplyConfig.map((option) => (
        <button
          key={`${message._id}-${option.key}`}
          onClick={() => handleQuickReply(message, option.key)}
          disabled={sendingReply && replyingMessageId === message._id}
          className="rounded-full border border-gray-300 bg-white px-3 py-1 text-xs font-medium text-gray-800 hover:border-black disabled:cursor-not-allowed disabled:opacity-50"
        >
          {sendingReply && replyingMessageId === message._id
            ? "Sending..."
            : option.buttonText}
        </button>
      ))}
    </div>
  )}
                        
                      </div>
                    </div>
                  );
                })}
              </div>

           <form onSubmit={handleThreadReply} className="border-t border-gray-200 p-4 bg-white">
             <div className="flex gap-3">
               <textarea
                 value={replyBody}
                 onChange={(event) => setReplyBody(event.target.value)}
                 placeholder={isAgent ? "Write a message to this musician…" : "Write your reply…"}
                 rows={2}
                 className="min-h-[72px] flex-1 resize-y rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-black"
               />
               <button
                 type="submit"
                 disabled={sendingReply || !replyBody.trim()}
                 className="self-end rounded-lg bg-black px-5 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
               >
                 {sendingReply ? "Sending…" : "Send"}
               </button>
             </div>
             {sendError && <p className="mt-2 text-sm text-red-600">{sendError}</p>}
             <p className="mt-2 text-xs text-gray-500">
               Replies stay in this person’s thread in the Messages tab.
             </p>
           </form>
            </>
          )}
        </div>
      </div>

      {showNewMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form
            onSubmit={handleStartConversation}
            className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">New message</h2>
                <p className="mt-1 text-sm text-gray-500">Choose a musician and start a private portal conversation.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowNewMessage(false)}
                className="rounded-full px-3 py-1 text-2xl text-gray-500 hover:bg-gray-100"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <label className="mt-5 block text-sm font-medium">Musician</label>
            <input
              value={recipientSearch}
              onChange={(event) => setRecipientSearch(event.target.value)}
              placeholder="Search by name or email…"
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-black"
            />
            <select
              value={newRecipientId}
              onChange={(event) => setNewRecipientId(event.target.value)}
              size={Math.min(Math.max(filteredRecipients.length, 3), 7)}
              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-black"
            >
              {!filteredRecipients.length && <option value="">No matching musicians</option>}
              {filteredRecipients.map((recipient) => (
                <option key={recipient._id} value={recipient._id}>
                  {recipient.name}{recipient.email ? ` — ${recipient.email}` : ""}
                </option>
              ))}
            </select>

            <label className="mt-5 block text-sm font-medium">Message</label>
            <textarea
              value={newMessageBody}
              onChange={(event) => setNewMessageBody(event.target.value)}
              rows={6}
              placeholder="Write your message…"
              className="mt-2 w-full resize-y rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-black"
            />
            <p className="mt-2 text-xs text-gray-500">
              The musician will receive an email notification and can reply from their Messages tab.
            </p>
            {sendError && <p className="mt-2 text-sm text-red-600">{sendError}</p>}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowNewMessage(false)}
                className="rounded-lg border border-gray-300 px-4 py-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={sendingReply || !newRecipientId || !newMessageBody.trim()}
                className="rounded-lg bg-black px-5 py-2 font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                {sendingReply ? "Sending…" : "Send message"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Messages;
