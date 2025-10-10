import React, { useEffect, useState } from "react";
import axios from "axios";
import { backendUrl } from "../App";
import { toast } from "react-toastify";
import CustomToast from "../components/CustomToast";

const PaymentTracker = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await axios.get(`${backendUrl}/api/booking/all`);
        if (res.data.success) {
          setBookings(res.data.bookings);
        } else {
          toast(<CustomToast type="error" message={res.data.message} />);
        }
      } catch (err) {
        console.error(err);
        toast(<CustomToast type="error" message="Failed to fetch bookings." />);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const markAsPaid = async (bookingId, musicianId) => {
    try {
      const res = await axios.post(`${backendUrl}/api/booking/mark-paid`, {
        bookingId,
        musicianId,
      });
      if (res.data.success) {
        toast(<CustomToast type="success" message="Musician marked as paid." />);
        setBookings((prev) =>
          prev.map((b) =>
            b._id === bookingId ? { ...b, musicians: res.data.booking.musicians } : b
          )
        );
      } else {
        toast(<CustomToast type="error" message={res.data.message} />);
      }
    } catch (err) {
      console.error(err);
      toast(<CustomToast type="error" message="Failed to update payment status." />);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Payment Tracker</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto border border-collapse">
            <thead className="bg-gray-200 text-sm">
              <tr>
                <th className="border px-4 py-2">Booking</th>
                <th className="border px-4 py-2">Musician</th>
                <th className="border px-4 py-2">Fee</th>
                <th className="border px-4 py-2">Paid?</th>
                <th className="border px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.flatMap((booking) =>
                (booking.musicians || []).map((musician, i) => (
                  <tr key={`${booking._id}-${i}`} className="text-sm">
                    <td className="border px-4 py-2">{booking.act?.name || booking.act}</td>
                    <td className="border px-4 py-2">{musician.name}</td>
                    <td className="border px-4 py-2">
                      £{musician.fee + (musician.travelFee || 0)}
                    </td>
                    <td className="border px-4 py-2">
                      {musician.paid ? "Yes" : "No"}
                    </td>
                    <td className="border px-4 py-2">
                      {!musician.paid && (
                        <button
                          onClick={() => markAsPaid(booking._id, musician.musicianId)}
                          className="text-sm text-white bg-green-600 hover:bg-green-700 px-3 py-1 rounded"
                        >
                          Mark as Paid
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PaymentTracker;
