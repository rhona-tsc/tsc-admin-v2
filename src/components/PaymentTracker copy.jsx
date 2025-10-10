import React, { useEffect, useState } from "react";
import axios from "axios";
import { backendUrl } from "../App";
import { toast } from "react-toastify";
import CustomToast from "../components/CustomToast";

const PaymentTracker = ({ token }) => {
  const [bookings, setBookings] = useState([]);

  const fetchBookings = async () => {
    try {
      const res = await axios.get(`${backendUrl}/api/booking/list`, {
        headers: { token },
      });
      if (res.data.success) {
        setBookings(res.data.bookings);
      } else {
        toast(<CustomToast type="error" message={res.data.message} />);
      }
    } catch (err) {
      console.error(err);
      toast(<CustomToast type="error" message="Failed to fetch bookings" />);
    }
  };

  const markAsPaid = async (bookingId, musicianId) => {
    try {
      const res = await axios.post(
        `${backendUrl}/api/booking/mark-musician-paid`,
        { bookingId, musicianId },
        { headers: { token } }
      );
      if (res.data.success) {
        toast(<CustomToast type="success" message="Marked as paid" />);
        fetchBookings();
      } else {
        toast(<CustomToast type="error" message={res.data.message} />);
      }
    } catch (err) {
      toast(<CustomToast type="error" message="Failed to update payment status" />);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Payment Tracker</h1>
      {bookings.map((booking) => (
        <div key={booking._id} className="mb-6 border p-4 rounded shadow">
          <h2 className="font-semibold mb-2">Booking: {booking.event_date?.split("T")[0]}</h2>
          <div className="space-y-2">
            {booking.payments?.map((pay) => (
              <div
                key={pay.musician}
                className="flex justify-between items-center border p-2 rounded"
              >
                <div>
                  <p className="font-medium">Musician ID: {pay.musician}</p>
                  <p>Performance Fee: £{pay.performanceFee}</p>
                  <p>Travel Fee: £{pay.travelFee}</p>
                  <p>Status: {pay.isPaid ? "Paid" : "Unpaid"}</p>
                </div>
                {!pay.isPaid && (
                  <button
                    className="bg-green-600 text-white px-3 py-1 rounded"
                    onClick={() => markAsPaid(booking._id, pay.musician)}
                  >
                    Mark Paid
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default PaymentTracker;