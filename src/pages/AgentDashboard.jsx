import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { backendUrl } from "../App";
import { format } from "date-fns";

const TABS = [
  { key: "users", label: "Users + Shortlists" },
  { key: "musicians", label: "Musicians" },
  { key: "acts", label: "Act Submissions" },
  { key: "bookings", label: "Bookings" },
  { key: "emails", label: "Email Logs" },
  { key: "whatsapp", label: "WhatsApp Logs" },
];

const norm = (v) => String(v ?? "").toLowerCase().trim();
const isoDay = (d) => {
  if (!d) return "";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toISOString().slice(0, 10);
};

const tryGet = async ({ url, token }) => {
  const res = await axios.get(url, { headers: token ? { token } : {} });
  return res?.data;
};

const firstSuccess = async ({ urls = [], token }) => {
  let lastErr;
  for (const url of urls) {
    try {
      const data = await tryGet({ url, token });
      return { ok: true, url, data };
    } catch (e) {
      lastErr = e;
    }
  }
  return { ok: false, url: urls?.[0], error: lastErr };
};

const Card = ({ title, right, children }) => (
  <div className="border rounded-lg bg-white">
    <div className="flex items-center justify-between px-4 py-3 border-b">
      <h2 className="font-semibold">{title}</h2>
      <div className="text-sm text-gray-600">{right}</div>
    </div>
    <div className="p-4">{children}</div>
  </div>
);

const Warning = ({ children }) => (
  <div className="border border-amber-200 bg-amber-50 text-amber-900 rounded p-3 text-sm">
    {children}
  </div>
);

const TableWrap = ({ children }) => (
  <div className="overflow-x-auto">
    <table className="min-w-full table-auto border text-sm">{children}</table>
  </div>
);

const AgentDashboard = ({ token }) => {
  const [active, setActive] = useState("users");

  // DATA
  const [users, setUsers] = useState([]);
  const [shortlists, setShortlists] = useState([]);
  const [musicians, setMusicians] = useState([]);
  const [actSubs, setActSubs] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [emailLogs, setEmailLogs] = useState([]);
  const [waLogs, setWaLogs] = useState([]);

  // STATUS
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // SEARCH
  const [usersQ, setUsersQ] = useState("");

  const [bookingsQ, setBookingsQ] = useState("");
  const [bookingsDate, setBookingsDate] = useState("");

  const [commsQ, setCommsQ] = useState("");
  const [commsDate, setCommsDate] = useState("");

  const setErr = (key, val) => setErrors((p) => ({ ...p, [key]: val }));

  const loadAll = async () => {
    setLoading(true);
    setErrors({});

    // USERS + SHORTLISTS (best effort)
    const usersRes = await firstSuccess({
      token,
      urls: [
        `${backendUrl}/api/user/all`,
        `${backendUrl}/api/user/list`,
        `${backendUrl}/api/users/all`,
      ],
    });

    if (usersRes.ok) {
      const list =
        usersRes.data?.users ||
        usersRes.data?.data ||
        usersRes.data?.result ||
        usersRes.data ||
        [];
      setUsers(Array.isArray(list) ? list : []);
    } else {
      setUsers([]);
      setErr(
        "users",
        "No users endpoint found yet. Add an admin endpoint like GET /api/user/all that returns { users: [...] }"
      );
    }

    const shortlistRes = await firstSuccess({
      token,
      urls: [
        `${backendUrl}/api/shortlist/all`,
        `${backendUrl}/api/shortlist/admin/all`,
        `${backendUrl}/api/shortlist/admin`,
      ],
    });

    if (shortlistRes.ok) {
      const list =
        shortlistRes.data?.shortlists ||
        shortlistRes.data?.data ||
        shortlistRes.data?.result ||
        shortlistRes.data ||
        [];
      setShortlists(Array.isArray(list) ? list : []);
    } else {
      setShortlists([]);
      setErr(
        "shortlists",
        "No shortlists endpoint found yet. Add an admin endpoint like GET /api/shortlist/all that returns { shortlists: [...] }"
      );
    }

    // MUSICIANS (best effort)
    const musRes = await firstSuccess({
      token,
      urls: [
        `${backendUrl}/api/musician/all`,
        `${backendUrl}/api/musician/list`,
        `${backendUrl}/api/musicians/all`,
      ],
    });

    if (musRes.ok) {
      const list =
        musRes.data?.musicians ||
        musRes.data?.data ||
        musRes.data?.result ||
        musRes.data ||
        [];
      setMusicians(Array.isArray(list) ? list : []);
    } else {
      setMusicians([]);
      setErr(
        "musicians",
        "No musicians endpoint found yet. Add an admin endpoint like GET /api/musician/all that returns { musicians: [...] }"
      );
    }

    // ACT PRE-SUBMISSIONS
    const actRes = await firstSuccess({
      token,
      urls: [
        `${backendUrl}/api/act-pre-submissions`,
        `${backendUrl}/api/act-pre-submissions/all`,
      ],
    });

    if (actRes.ok) {
      const list =
        actRes.data?.submissions ||
        actRes.data?.acts ||
        actRes.data?.data ||
        actRes.data ||
        [];
      setActSubs(Array.isArray(list) ? list : []);
    } else {
      setActSubs([]);
      setErr(
        "acts",
        "No act pre-submissions endpoint found yet. Expected GET /api/act-pre-submissions to return { submissions: [...] } (or similar)."
      );
    }

    // BOOKINGS
    try {
      const res = await axios.get(`${backendUrl}/api/booking/all`, {
        headers: token ? { token } : {},
      });
      const list = res.data?.bookings || [];
      setBookings(Array.isArray(list) ? list : []);
    } catch (e) {
      setBookings([]);
      setErr("bookings", "Could not load bookings from GET /api/booking/all");
    }

    // EMAIL LOGS (best effort)
    const emailRes = await firstSuccess({
      token,
      urls: [
        `${backendUrl}/api/logs/emails`,
        `${backendUrl}/api/communications/emails`,
        `${backendUrl}/api/email/logs`,
      ],
    });
    if (emailRes.ok) {
      const list =
        emailRes.data?.emails ||
        emailRes.data?.logs ||
        emailRes.data?.data ||
        emailRes.data ||
        [];
      setEmailLogs(Array.isArray(list) ? list : []);
    } else {
      setEmailLogs([]);
      setErr(
        "emails",
        "No email logs endpoint found yet. Add something like GET /api/logs/emails returning { logs: [...] } with eventDate/act/vocalist/client fields if you want search."
      );
    }

    // WHATSAPP LOGS (best effort)
    const waRes = await firstSuccess({
      token,
      urls: [
        `${backendUrl}/api/logs/whatsapp`,
        `${backendUrl}/api/communications/whatsapp`,
        `${backendUrl}/api/twilio/whatsapp/logs`,
      ],
    });
    if (waRes.ok) {
      const list =
        waRes.data?.messages ||
        waRes.data?.logs ||
        waRes.data?.data ||
        waRes.data ||
        [];
      setWaLogs(Array.isArray(list) ? list : []);
    } else {
      setWaLogs([]);
      setErr(
        "whatsapp",
        "No WhatsApp logs endpoint found yet. Add something like GET /api/logs/whatsapp returning { logs: [...] } with eventDate/act/vocalist/client fields if you want search."
      );
    }

    setLoading(false);
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ------------ USERS + SHORTLISTS -------------
  const shortlistsByUser = useMemo(() => {
    const map = new Map();
    (shortlists || []).forEach((s) => {
      const userId = s?.userId || s?.user || s?.ownerId;
      if (!userId) return;
      if (!map.has(String(userId))) map.set(String(userId), []);
      map.get(String(userId)).push(s);
    });
    return map;
  }, [shortlists]);

  const filteredUsers = useMemo(() => {
    const nq = norm(usersQ);
    if (!nq) return users;
    return (users || []).filter((u) => {
      const hay = [u?._id, u?.name, u?.firstName, u?.lastName, u?.email, u?.phone]
        .map(norm)
        .join(" | ");
      return hay.includes(nq);
    });
  }, [users, usersQ]);

  const renderShortlistActs = (userId) => {
    const lists = shortlistsByUser.get(String(userId)) || [];
    // Try common shapes:
    const actNames = [];
    lists.forEach((s) => {
      const acts = s?.acts || s?.shortlistedActs || s?.items || s?.actIds;
      if (!acts) return;
      if (Array.isArray(acts)) {
        acts.forEach((a) => {
          if (typeof a === "string") actNames.push(a);
          else actNames.push(a?.name || a?.tscName || a?._id || "");
        });
      }
    });
    const cleaned = actNames.map((x) => String(x || "").trim()).filter(Boolean);
    if (!cleaned.length) return "-";
    return cleaned.slice(0, 8).join(", ") + (cleaned.length > 8 ? "…" : "");
  };

  // ------------ BOOKINGS SEARCH -------------
  const filteredBookings = useMemo(() => {
    const nq = norm(bookingsQ);
    return (bookings || []).filter((b) => {
      const dateOk = !bookingsDate || isoDay(b?.date) === bookingsDate;
      if (!dateOk) return false;
      if (!nq) return true;

      const actName = b?.act?.name;
      const venue = b?.venue;
      const venueAddress = b?.venueAddress || b?.address || b?.eventLocation;
      const clientName = b?.clientName;
      const clientEmail = b?.clientEmail;
      const clientPhone = b?.clientPhone;

      const lineupNames = Array.isArray(b?.bandLineup)
        ? b.bandLineup
            .map((m) => (typeof m === "string" ? m : m?.name || m?.fullName || ""))
            .filter(Boolean)
            .join(" ")
        : "";

      const hay = [b?._id, actName, venue, venueAddress, clientName, clientEmail, clientPhone, lineupNames]
        .map(norm)
        .join(" | ");

      return hay.includes(nq);
    });
  }, [bookings, bookingsQ, bookingsDate]);

  // ------------ COMMS SEARCH (EMAIL + WA) -------------
  const filterComms = (rows) => {
    const nq = norm(commsQ);
    return (rows || []).filter((r) => {
      const dateOk = !commsDate || isoDay(r?.eventDate || r?.date || r?.createdAt) === commsDate;
      if (!dateOk) return false;
      if (!nq) return true;

      const hay = [
        r?._id,
        r?.to,
        r?.from,
        r?.subject,
        r?.body,
        r?.message,
        r?.actName,
        r?.act,
        r?.vocalistName,
        r?.musicianName,
        r?.clientName,
        r?.clientEmail,
        r?.venue,
        r?.venueAddress,
      ]
        .map(norm)
        .join(" | ");

      return hay.includes(nq);
    });
  };

  const filteredEmails = useMemo(() => filterComms(emailLogs), [emailLogs, commsQ, commsDate]);
  const filteredWa = useMemo(() => filterComms(waLogs), [waLogs, commsQ, commsDate]);

  const tabBtn = (k, label) => (
    <button
      key={k}
      onClick={() => setActive(k)}
      className={`px-3 py-2 rounded border text-sm ${
        active === k ? "bg-black text-white" : "bg-white hover:bg-gray-50"
      }`}
      type="button"
    >
      {label}
    </button>
  );

  const topBar = (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-2xl font-semibold">Agent Dashboard</h1>
        <div className="text-sm text-gray-600">
          Admin overview: users, moderation, bookings, comms
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          type="button"
          onClick={loadAll}
          className="px-3 py-2 rounded border text-sm hover:bg-gray-50"
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>
    </div>
  );

  const tabs = <div className="flex gap-2 flex-wrap mt-4">{TABS.map((t) => tabBtn(t.key, t.label))}</div>;

  return (
    <div className="p-6 w-full space-y-4">
      {topBar}
      {tabs}

      {/* USERS + SHORTLISTS */}
      {active === "users" && (
        <Card
          title="Registered users + their shortlists"
          right={<span className="text-xs">{filteredUsers.length} users</span>}
        >
          {(errors.users || errors.shortlists) && (
            <Warning>
              {errors.users && <div>• {errors.users}</div>}
              {errors.shortlists && <div>• {errors.shortlists}</div>}
            </Warning>
          )}

          <div className="flex flex-col md:flex-row gap-3 md:items-end mb-3">
            <div className="flex-1">
              <label className="block text-xs text-gray-600 mb-1">Search users</label>
              <input
                value={usersQ}
                onChange={(e) => setUsersQ(e.target.value)}
                placeholder="Search by name/email/phone"
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
          </div>

          <TableWrap>
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-4 py-2">User</th>
                <th className="border px-4 py-2">Registered</th>
                <th className="border px-4 py-2">Event date</th>
                <th className="border px-4 py-2">Event location</th>
                <th className="border px-4 py-2">Shortlist acts</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => {
                const registered = u?.createdAt || u?.registeredAt;
                const eventDate = u?.eventDate || u?.date;
                const eventLoc = u?.eventLocation || u?.location || u?.address;
                return (
                  <tr key={u?._id} className="hover:bg-gray-50">
                    <td className="border px-4 py-2">
                      <div className="font-medium">
                        {u?.name || [u?.firstName, u?.lastName].filter(Boolean).join(" ") || "-"}
                      </div>
                      <div className="text-xs text-gray-600">{u?.email || "-"}</div>
                    </td>
                    <td className="border px-4 py-2">
                      {registered ? format(new Date(registered), "dd MMM yyyy") : "-"}
                    </td>
                    <td className="border px-4 py-2">
                      {eventDate ? format(new Date(eventDate), "dd MMM yyyy") : "-"}
                    </td>
                    <td className="border px-4 py-2">{eventLoc || "-"}</td>
                    <td className="border px-4 py-2">{renderShortlistActs(u?._id)}</td>
                  </tr>
                );
              })}
              {!filteredUsers.length && (
                <tr>
                  <td className="border px-4 py-4 text-center text-gray-500" colSpan={5}>
                    No users to show.
                  </td>
                </tr>
              )}
            </tbody>
          </TableWrap>
        </Card>
      )}

      {/* MUSICIANS */}
      {active === "musicians" && (
        <Card
          title="Registered musicians"
          right={<span className="text-xs">{musicians.length} musicians</span>}
        >
          {errors.musicians && <Warning>{errors.musicians}</Warning>}

          <TableWrap>
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-4 py-2">Musician</th>
                <th className="border px-4 py-2">Registered</th>
                <th className="border px-4 py-2">Type</th>
                <th className="border px-4 py-2">Instruments</th>
                <th className="border px-4 py-2">Moderate</th>
              </tr>
            </thead>
            <tbody>
              {musicians.map((m) => {
                const name =
                  m?.name || [m?.firstName, m?.lastName].filter(Boolean).join(" ") || "-";
                const registered = m?.createdAt || m?.registeredAt;

                const vocals = m?.vocals || m?.vocal || m?.sings;
                const instrumentation = m?.instrumentation || m?.instruments || m?.skills?.instruments;

                const isVocalist =
                  Array.isArray(vocals)
                    ? vocals.length > 0
                    : Boolean(vocals?.isVocalist || vocals === true || vocals === "true");

                const instruments = Array.isArray(instrumentation)
                  ? instrumentation
                  : typeof instrumentation === "string"
                  ? instrumentation.split(",").map((x) => x.trim())
                  : [];

                return (
                  <tr key={m?._id} className="hover:bg-gray-50">
                    <td className="border px-4 py-2">
                      <div className="font-medium">{name}</div>
                      <div className="text-xs text-gray-600">{m?.email || "-"}</div>
                    </td>
                    <td className="border px-4 py-2">
                      {registered ? format(new Date(registered), "dd MMM yyyy") : "-"}
                    </td>
                    <td className="border px-4 py-2">
                      {isVocalist ? "Vocalist" : "Instrumentalist"}
                    </td>
                    <td className="border px-4 py-2">
                      {!isVocalist ? (instruments?.length ? instruments.join(", ") : "-") : "-"}
                    </td>
                    <td className="border px-4 py-2">
                      <a
                        className="underline text-sm"
                        href={`${backendUrl}/api/moderation/deputy/${m?._id}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open moderation
                      </a>
                    </td>
                  </tr>
                );
              })}
              {!musicians.length && (
                <tr>
                  <td className="border px-4 py-4 text-center text-gray-500" colSpan={5}>
                    No musicians to show.
                  </td>
                </tr>
              )}
            </tbody>
          </TableWrap>
        </Card>
      )}

      {/* ACT SUBMISSIONS */}
      {active === "acts" && (
        <Card
          title="Act pre-submissions"
          right={<span className="text-xs">{actSubs.length} submissions</span>}
        >
          {errors.acts && <Warning>{errors.acts}</Warning>}

          <div className="text-xs text-gray-500 mb-3">
            Tip: if your backend returns a different shape, adjust `submissions/acts/data`
            mapping in loadAll().
          </div>

          <TableWrap>
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-4 py-2">Act</th>
                <th className="border px-4 py-2">Submitted</th>
                <th className="border px-4 py-2">Status</th>
                <th className="border px-4 py-2">Moderate</th>
              </tr>
            </thead>
            <tbody>
              {actSubs.map((a) => {
                const submitted = a?.createdAt || a?.submittedAt;
                return (
                  <tr key={a?._id} className="hover:bg-gray-50">
                    <td className="border px-4 py-2">
                      <div className="font-medium">{a?.name || a?.tscName || "-"}</div>
                      <div className="text-xs text-gray-600">{a?._id}</div>
                    </td>
                    <td className="border px-4 py-2">
                      {submitted ? format(new Date(submitted), "dd MMM yyyy") : "-"}
                    </td>
                    <td className="border px-4 py-2 capitalize">{a?.status || "pending"}</td>
                    <td className="border px-4 py-2">
                      <a
                        className="underline text-sm"
                        href={`${backendUrl}/api/act-pre-submissions/${a?._id}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open submission
                      </a>
                    </td>
                  </tr>
                );
              })}
              {!actSubs.length && (
                <tr>
                  <td className="border px-4 py-4 text-center text-gray-500" colSpan={4}>
                    No act submissions to show.
                  </td>
                </tr>
              )}
            </tbody>
          </TableWrap>
        </Card>
      )}

      {/* BOOKINGS */}
      {active === "bookings" && (
        <Card
          title="Bookings (searchable)"
          right={
            <span className="text-xs">
              {filteredBookings.length} / {bookings.length}
            </span>
          }
        >
          {errors.bookings && <Warning>{errors.bookings}</Warning>}

          <div className="flex flex-col md:flex-row gap-3 md:items-end mb-3">
            <div className="flex-1">
              <label className="block text-xs text-gray-600 mb-1">Search</label>
              <input
                value={bookingsQ}
                onChange={(e) => setBookingsQ(e.target.value)}
                placeholder="Search by date, vocalist/musician, act, venue/address, client"
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
            <div className="w-full md:w-56">
              <label className="block text-xs text-gray-600 mb-1">Event date</label>
              <input
                type="date"
                value={bookingsDate}
                onChange={(e) => setBookingsDate(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setBookingsQ("");
                setBookingsDate("");
              }}
              className="border rounded px-3 py-2 text-sm hover:bg-gray-50"
            >
              Clear
            </button>
          </div>

          <TableWrap>
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-4 py-2">Event date</th>
                <th className="border px-4 py-2">Act</th>
                <th className="border px-4 py-2">Venue</th>
                <th className="border px-4 py-2">Client</th>
                <th className="border px-4 py-2">Musicians</th>
                <th className="border px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((b) => (
                <tr key={b?._id} className="hover:bg-gray-50">
                  <td className="border px-4 py-2">
                    {b?.date ? format(new Date(b.date), "dd MMM yyyy") : "-"}
                  </td>
                  <td className="border px-4 py-2">{b?.act?.name || "-"}</td>
                  <td className="border px-4 py-2">
                    <div>{b?.venue || "-"}</div>
                    <div className="text-xs text-gray-600">
                      {b?.venueAddress || b?.address || b?.eventLocation || ""}
                    </div>
                  </td>
                  <td className="border px-4 py-2">
                    <div>{b?.clientName || "-"}</div>
                    <div className="text-xs text-gray-600">{b?.clientEmail || ""}</div>
                  </td>
                  <td className="border px-4 py-2">
                    {Array.isArray(b?.bandLineup) && b.bandLineup.length ? (
                      <ul>
                        {b.bandLineup.map((m, idx) => (
                          <li key={idx}>
                            {typeof m === "string" ? m : m?.name || m?.fullName || "-"}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="border px-4 py-2 capitalize">{b?.status || "confirmed"}</td>
                </tr>
              ))}
              {!filteredBookings.length && (
                <tr>
                  <td className="border px-4 py-4 text-center text-gray-500" colSpan={6}>
                    No bookings match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </TableWrap>
        </Card>
      )}

      {/* EMAIL LOGS */}
      {active === "emails" && (
        <Card
          title="Email logs"
          right={
            <span className="text-xs">
              {filteredEmails.length} / {emailLogs.length}
            </span>
          }
        >
          {errors.emails && <Warning>{errors.emails}</Warning>}

          <div className="flex flex-col md:flex-row gap-3 md:items-end mb-3">
            <div className="flex-1">
              <label className="block text-xs text-gray-600 mb-1">Search</label>
              <input
                value={commsQ}
                onChange={(e) => setCommsQ(e.target.value)}
                placeholder="Search by act, vocalist, client, venue, to, subject"
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
            <div className="w-full md:w-56">
              <label className="block text-xs text-gray-600 mb-1">Event date</label>
              <input
                type="date"
                value={commsDate}
                onChange={(e) => setCommsDate(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setCommsQ("");
                setCommsDate("");
              }}
              className="border rounded px-3 py-2 text-sm hover:bg-gray-50"
            >
              Clear
            </button>
          </div>

          <TableWrap>
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-4 py-2">Sent</th>
                <th className="border px-4 py-2">To</th>
                <th className="border px-4 py-2">Subject</th>
                <th className="border px-4 py-2">Event</th>
                <th className="border px-4 py-2">Context</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmails.map((e) => (
                <tr key={e?._id} className="hover:bg-gray-50">
                  <td className="border px-4 py-2">
                    {e?.createdAt || e?.sentAt
                      ? format(new Date(e?.createdAt || e?.sentAt), "dd MMM yyyy")
                      : "-"}
                  </td>
                  <td className="border px-4 py-2">{e?.to || "-"}</td>
                  <td className="border px-4 py-2">{e?.subject || e?.type || "-"}</td>
                  <td className="border px-4 py-2">
                    {e?.eventDate ? format(new Date(e.eventDate), "dd MMM yyyy") : "-"}
                  </td>
                  <td className="border px-4 py-2">
                    <div>{e?.actName || e?.act || ""}</div>
                    <div className="text-xs text-gray-600">
                      {e?.vocalistName || e?.musicianName || ""}
                      {(e?.clientName || e?.clientEmail) && (
                        <>
                          {" "}
                          • {e?.clientName || ""}{" "}
                          {e?.clientEmail ? `(${e.clientEmail})` : ""}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!filteredEmails.length && (
                <tr>
                  <td className="border px-4 py-4 text-center text-gray-500" colSpan={5}>
                    No email logs to show.
                  </td>
                </tr>
              )}
            </tbody>
          </TableWrap>
        </Card>
      )}

      {/* WHATSAPP LOGS */}
      {active === "whatsapp" && (
        <Card
          title="WhatsApp messages (Twilio)"
          right={
            <span className="text-xs">
              {filteredWa.length} / {waLogs.length}
            </span>
          }
        >
          {errors.whatsapp && <Warning>{errors.whatsapp}</Warning>}

          <div className="flex flex-col md:flex-row gap-3 md:items-end mb-3">
            <div className="flex-1">
              <label className="block text-xs text-gray-600 mb-1">Search</label>
              <input
                value={commsQ}
                onChange={(e) => setCommsQ(e.target.value)}
                placeholder="Search by act, vocalist, client, venue, to, message"
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
            <div className="w-full md:w-56">
              <label className="block text-xs text-gray-600 mb-1">Event date</label>
              <input
                type="date"
                value={commsDate}
                onChange={(e) => setCommsDate(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setCommsQ("");
                setCommsDate("");
              }}
              className="border rounded px-3 py-2 text-sm hover:bg-gray-50"
            >
              Clear
            </button>
          </div>

          <TableWrap>
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-4 py-2">Sent</th>
                <th className="border px-4 py-2">To</th>
                <th className="border px-4 py-2">Message</th>
                <th className="border px-4 py-2">Event</th>
                <th className="border px-4 py-2">Context</th>
              </tr>
            </thead>
            <tbody>
              {filteredWa.map((m) => (
                <tr key={m?._id} className="hover:bg-gray-50">
                  <td className="border px-4 py-2">
                    {m?.createdAt || m?.sentAt
                      ? format(new Date(m?.createdAt || m?.sentAt), "dd MMM yyyy")
                      : "-"}
                  </td>
                  <td className="border px-4 py-2">{m?.to || m?.toNumber || "-"}</td>
                  <td className="border px-4 py-2">{m?.body || m?.message || "-"}</td>
                  <td className="border px-4 py-2">
                    {m?.eventDate ? format(new Date(m.eventDate), "dd MMM yyyy") : "-"}
                  </td>
                  <td className="border px-4 py-2">
                    <div>{m?.actName || m?.act || ""}</div>
                    <div className="text-xs text-gray-600">
                      {m?.vocalistName || m?.musicianName || ""}
                      {(m?.clientName || m?.clientEmail) && (
                        <>
                          {" "}
                          • {m?.clientName || ""}{" "}
                          {m?.clientEmail ? `(${m.clientEmail})` : ""}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!filteredWa.length && (
                <tr>
                  <td className="border px-4 py-4 text-center text-gray-500" colSpan={5}>
                    No WhatsApp logs to show.
                  </td>
                </tr>
              )}
            </tbody>
          </TableWrap>
        </Card>
      )}
    </div>
  );
};

export default AgentDashboard;