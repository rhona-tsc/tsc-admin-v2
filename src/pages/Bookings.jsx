import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { backendUrl } from "../App";
import { toast } from "react-toastify";
import CustomToast from "../components/CustomToast";

const AUTH_TOKEN_KEYS = ["musicianToken", "token", "adminToken"];

const parseJwtPayload = (token = "") => {
  try {
    const payload = String(token || "").split(".")[1] || "";
    if (!payload) return {};

    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");

    return JSON.parse(window.atob(padded));
  } catch {
    return {};
  }
};

const isTokenExpired = (token = "") => {
  const payload = parseJwtPayload(token);
  const exp = Number(payload?.exp || 0);
  if (!exp) return false;
  return Date.now() >= exp * 1000;
};

const getBestAuthToken = (fallbackToken = "") => {
  if (fallbackToken && !isTokenExpired(fallbackToken)) return fallbackToken;

  for (const key of AUTH_TOKEN_KEYS) {
    const token = localStorage.getItem(key) || sessionStorage.getItem(key) || "";
    if (token && !isTokenExpired(token)) return token;
  }

  return "";
};

const formatDate = (value) => {
  if (!value) return "Date TBC";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date TBC";

  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatMoney = (value) => {
  const amount = Number(value || 0);
  if (!amount) return "Fee TBC";

  return `£${amount.toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const getEventDate = (booking) =>
  booking.eventDateISO ||
  booking.eventDate ||
  booking.date ||
  booking.bookingDetails?.eventDate ||
  booking.eventSheet?.eventDate ||
  "";

const getActName = (booking) =>
  booking.actTscName ||
  booking.actName ||
  booking.actsSummary?.[0]?.tscName ||
  booking.actsSummary?.[0]?.actName ||
  booking.actsSummary?.[0]?.name ||
  booking.act?.tscName ||
  booking.act?.name ||
  "Act TBC";

const getVenue = (booking) =>
  booking.venue ||
  booking.venueAddress ||
  booking.address ||
  booking.eventSheet?.answers?.venue_name ||
  booking.bookingDetails?.venue ||
  "Venue TBC";

const getFee = (booking) =>
  Number(
    booking.fee ||
      booking.grossValue ||
      booking.totals?.fullAmount ||
      booking.amount ||
      0,
  );

const getArrivalTime = (booking) =>
  booking.performanceTimes?.arrivalTime ||
  booking.actsSummary?.[0]?.performance?.arrivalTime ||
  booking.arrivalTime ||
  "";

const getStartTime = (booking) =>
  booking.performanceTimes?.startTime ||
  booking.actsSummary?.[0]?.performance?.startTime ||
  booking.startTime ||
  "";

const getFinishTime = (booking) =>
  booking.performanceTimes?.finishTime ||
  booking.actsSummary?.[0]?.performance?.finishTime ||
  booking.finishTime ||
  "";

const getBookingRef = (booking) =>
  booking.bookingRef || booking.bookingId || booking._id || "";

const getMusicianTag = (booking) => {
  const tokenPayload = parseJwtPayload(getBestAuthToken());

  const userId = String(
    tokenPayload?._id || tokenPayload?.id || tokenPayload?.userId || "",
  );

  const email = String(tokenPayload?.email || "").toLowerCase();

  const allMembers = [
    ...(Array.isArray(booking.assignedMusicians)
      ? booking.assignedMusicians
      : []),
    ...(Array.isArray(booking.bookingMusicians)
      ? booking.bookingMusicians
      : []),
    ...(Array.isArray(booking.bandLineup) ? booking.bandLineup : []),
    ...(Array.isArray(booking.bookingDetails?.assignedMusicians)
      ? booking.bookingDetails.assignedMusicians
      : []),
  ];

  return (
    allMembers.find((member) => {
      const memberId = String(
        member?.musicianId || member?._id || member?.id || "",
      );
      const memberEmail = String(member?.email || "").toLowerCase();

      return (userId && memberId === userId) || (email && memberEmail === email);
    }) || null
  );
};

const getMusicianFee = (booking) => {
  const musicianTag = getMusicianTag(booking);

  return (
    Number(
      musicianTag?.totalFee ||
        musicianTag?.fee ||
        musicianTag?.gigFee ||
        musicianTag?.payoutAmount ||
        musicianTag?.baseFee ||
        0,
    ) || 0
  );
};

const getStatusLabel = (booking) => {
  const status = String(
    booking.status || booking.allocation?.status || "confirmed",
  )
    .replace(/_/g, " ")
    .trim();

  return status || "confirmed";
};

const BookingList = ({ token }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const authToken = useMemo(() => getBestAuthToken(token), [token]);

  const fetchBookings = async () => {
    setError("");

    if (!authToken) {
      setLoading(false);
      setError("Please log in again to view gigs assigned to your profile.");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.get(`${backendUrl}/api/board/bookings/mine`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          token: authToken,
        },
        withCredentials: true,
      });

      if (res.data.success) {
        setBookings(res.data.bookings || res.data.rows || []);
      } else {
        const message = res.data.message || "Could not load your gigs.";
        setError(message);
        toast(<CustomToast type="error" message={message} />);
      }
    } catch (error) {
      const responseMessage =
        error?.response?.data?.message ||
        error?.message ||
        "No bookings to load yet";

      setError(responseMessage);
      toast(<CustomToast type="error" message={responseMessage} />);
      console.error("❌ Failed to load assigned gigs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken]);

  return (
    <div className="p-6 w-full">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-2">Your Gigs</h1>
          <p className="text-sm text-gray-500">
            Confirmed bookings you have been allocated to:
          </p>
        </div>

        <button
          type="button"
          onClick={fetchBookings}
          disabled={loading}
          className="inline-flex items-center justify-center rounded-full bg-[#ff6667] px-4 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Refreshing…" : "Refresh gigs"}
        </button>
      </div>

      {error ? (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded border bg-white p-6 text-gray-500">
          Loading your gigs…
        </div>
      ) : bookings.length === 0 ? (
        <div className="rounded border bg-white p-6 text-gray-500">
          No gigs have been assigned to your profile yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {bookings.map((booking) => {
            const fee = getMusicianFee(booking);
            const musicianTag = getMusicianTag(booking);
            const arrivalTime = getArrivalTime(booking);
            const startTime = getStartTime(booking);
            const finishTime = getFinishTime(booking);

            return (
              <div
                key={booking._id || booking.bookingRef || booking.bookingId}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-gray-500">
                      Confirmed gig
                    </p>

                    <h2 className="mt-1 text-lg font-semibold text-gray-900">
                      {getActName(booking)}
                    </h2>

                    {getBookingRef(booking) ? (
                      <p className="mt-1 text-xs text-gray-400">
                        Ref: {getBookingRef(booking)}
                      </p>
                    ) : null}
                  </div>

                  <span className="rounded-full bg-green-50 border border-green-200 px-3 py-1 text-xs font-semibold capitalize text-green-700">
                    {getStatusLabel(booking)}
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-sm text-gray-700">
                  <p>
                    <span className="font-semibold">Date:</span>{" "}
                    {formatDate(getEventDate(booking))}
                  </p>

                  <p>
                    <span className="font-semibold">Venue:</span>{" "}
                    {getVenue(booking)}
                  </p>

                  <p>
                    <span className="font-semibold">Your fee:</span> {formatMoney(fee)}
                  </p>

                  <p>
                    <span className="font-semibold">Times:</span>{" "}
                    {arrivalTime ? `Arrive ${arrivalTime}` : "Arrival TBC"}
                    {startTime ? ` · Start ${startTime}` : ""}
                    {finishTime ? ` · Finish ${finishTime}` : " · Finish TBC"}
                  </p>

                  {musicianTag?.role || musicianTag?.instrument ? (
                    <p>
                      <span className="font-semibold">Your role:</span>{" "}
                      {musicianTag.role || musicianTag.instrument}
                    </p>
                  ) : null}

                  {musicianTag?.paymentStatus ? (
                    <p>
                      <span className="font-semibold">Payment status:</span>{" "}
                      {String(musicianTag.paymentStatus).replace(/_/g, " ")}
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BookingList;