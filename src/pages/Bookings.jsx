import React, { useEffect, useState } from "react";
import axios from "axios";
import { backendUrl } from "../App";
import { toast } from "react-toastify";
import CustomToast from "../components/CustomToast";

const BookingList = ({ token }) => {
  const [bookings, setBookings] = useState([]);

  const fetchBookings = async () => {
    try {
      const res = await axios.get(`${backendUrl}/api/booking/all`, {
        headers: { token },
      });
      if (res.data.success) {
        setBookings(res.data.bookings);
      } else {
        toast(<CustomToast type="error" message={res.data.message} />);
      }
    } catch (error) {
      toast(<CustomToast type="error" message="No bookings to load yet" />);
      console.error(error);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  return (
    <div className="p-6 w-full">
      <h1 className="text-2xl font-bold mb-4">All Bookings</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto border text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-4 py-2">Booking ID</th>
              <th className="border px-4 py-2">Act</th>
              <th className="border px-4 py-2">Date</th>
              <th className="border px-4 py-2">Venue</th>
              <th className="border px-4 py-2">Fee</th>
              <th className="border px-4 py-2">Client</th>
              <th className="border px-4 py-2">Status</th>
              <th className="border px-4 py-2">Musicians</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => (
              <tr key={booking._id} className="hover:bg-gray-50">
                <td className="border px-4 py-2">{booking._id}</td>
                <td className="border px-4 py-2">{booking.act?.name || "-"}</td>
                <td className="border px-4 py-2">{new Date(booking.date).toLocaleDateString()}</td>
                <td className="border px-4 py-2">{booking.venue}</td>
                <td className="border px-4 py-2">
                  £{booking.fee?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td className="border px-4 py-2">
                  {booking.clientName}<br />
                  {booking.clientEmail}<br />
                  {booking.clientPhone}
                </td>
                <td className="border px-4 py-2 capitalize">
                  {booking.status || "confirmed"}
                </td>
                <td className="border px-4 py-2">
                  {booking.bandLineup?.length ? (
                    <ul>
                      {booking.bandLineup.map((m, idx) => (
                        <li key={idx}>{m.name || m}</li>
                      ))}
                    </ul>
                  ) : (
                    "-"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BookingList;
