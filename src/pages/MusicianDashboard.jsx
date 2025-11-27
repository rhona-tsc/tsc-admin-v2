import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import BookingsChart from "../components/BookingsChart";
import RevenueChart from "../components/RevenueChart";
import EnquiryVsBookingChart from "../components/EnquiriesVsBookingsChart";
import EnquiriesVsBookingsChart from "../components/EnquiriesVsBookingsChart";
import DashboardUnderConstruction from "../components/DashboardUnderConstruction";

const backendUrl =  import.meta.env.VITE_BACKEND_URL || "https://tsc-backend-v2.onrender.com";


const MusicianDashboard = ({ token, userId, firstName }) => {
  const navigate = useNavigate();

  const [myActs, setMyActs] = useState([]);
  const [deppingActs, setDeppingActs] = useState([]);
  const [stats, setStats] = useState({
    enquiries: [],
    bookings: [],
    cash: [],
  });

  useEffect(() => {
  window.scrollTo(0, 0);
}, []);

const storedUserId =
  sessionStorage.getItem("userId") || localStorage.getItem("userId");

// ----------------- FIX 1: Abort if no userId -----------------
if (!storedUserId) {
  console.error("❌ No stored userId!");
}

// ----------------- FIX 2: Helper headers -----------------
const authHeaders = { headers: { token } };

// ----------------- Fetch stats -----------------
const fetchStats = async () => {
  try {
    const res = await axios.get(
      `${backendUrl}/api/musician/stats/${storedUserId}`,
      authHeaders
    );
    setStats(res.data || {});
  } catch (err) {
    console.error("Error fetching stats", err);
  }
};

  // Fetch user’s acts (created by them)
  const fetchMyActs = async () => {
    try {
      const res = await axios.get(
        `${backendUrl}/api/musician/act-v2/list?mine=true`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const acts = Array.isArray(res.data.acts) ? res.data.acts : [];

      // Filter acts where createdBy matches storedUserId
      const filteredActs = acts.filter(
        (act) =>
          act?.createdBy?.toString?.() === storedUserId?.toString?.()
      );

      setMyActs(filteredActs);
    } catch (err) {
      console.error("Error fetching my acts", err);
    }
  };

  // Fetch acts where musician is a deputy
  const fetchDeppingActs = async () => {
    try {
      const res = await axios.get(
        `${backendUrl}/api/musician/depping/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDeppingActs(res.data.acts || []);
    } catch (err) {
      console.error("Error fetching depping acts", err);
    }
  };



  useEffect(() => {
    fetchMyActs();
    fetchDeppingActs();
    fetchStats();
  }, []);

  useEffect(() => {
    axios.get(`${backendUrl}/api/musician/dashboard/${userId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setStats(res.data))
      .catch(err => console.error(err));
  }, []);

  if (!stats) return <p>Loading...</p>;
console.log( "firstName:", {firstName});
  return (
    <div className="p-6 space-y-8">
<p className="text-xl text-gray-700 text-semibold">Hi {firstName}!</p>
          {/* 🚧 UNDER CONSTRUCTION BANNER */}
   <>
   <DashboardUnderConstruction />
   </>



      {/* ------- Quick Stats ------- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white shadow rounded">
          <p className="text-sm text-gray-500">Acts You Lead</p>
          <p className="text-3xl font-bold">{myActs.length}</p>
        </div>

        <div className="p-4 bg-white shadow rounded">
          <p className="text-sm text-gray-500">Acts You Dep For</p>
          <p className="text-3xl font-bold">{deppingActs.length}</p>
        </div>

        <div className="p-4 bg-white shadow rounded">
          <p className="text-sm text-gray-500">Booking Enquiries (Last 30d)</p>
          <p className="text-3xl font-bold">
            {stats.enquiries?.slice(-1)[0]?.count || 0}
          </p>
        </div>
      </div>

      {/* ------- Acts You Lead ------- */}
      <div className="bg-white shadow rounded p-4">
        <h3 className="text-lg font-semibold mb-3">Acts You Lead</h3>
        {myActs.length === 0 ? (
          <p className="text-gray-600">You haven't registered any acts yet.</p>
        ) : (
          myActs.map((act) => (
            <div
              key={act._id}
              className="p-3 border-b hover:bg-gray-50 cursor-pointer"
              onClick={() => navigate(`/edit-act-2/${act._id}`)}
            >
              {act.name}
            </div>
          ))
        )}
      </div>

      {/* ------- Acts You're Depping For ------- */}
      <div className="bg-white shadow rounded p-4">
        <h3 className="text-lg font-semibold mb-3">Acts You're Depping For</h3>
        {deppingActs.length === 0 ? (
          <p className="text-gray-600">No depping roles yet.</p>
        ) : (
          deppingActs.map((act) => (
            <div
              key={act._id}
              className="p-3 border-b hover:bg-gray-50 cursor-pointer"
              onClick={() => navigate(`/act/${act._id}`)}
            >
              {act.name}
            </div>
          ))
        )}
      </div>

      {/* ------- Charts Section ------- */}
      <div className="bg-white shadow rounded p-4">
        <h3 className="text-lg font-semibold mb-4">
          Monthly Performance Overview
        </h3>

        <div className="h-64 flex items-center justify-center text-gray-400">
  <>
     <BookingsChart data={stats?.bookingsByMonth || {}} />
<RevenueChart data={stats?.revenueByMonth || {}} />
<EnquiriesVsBookingsChart data={stats?.enquiriesByMonth || {}} />
       </>
              </div>
      </div>

      {/* ------- Noticeboard ------- */}
      <div className="bg-white shadow rounded p-4">
        <h3 className="text-lg font-semibold mb-4">Noticeboard</h3>
        <p className="text-gray-600">
          Important updates, opportunities, and announcements will appear here.
        </p>
      </div>

      {/* ------- Feedback Section ------- */}
      <div className="bg-white shadow rounded p-4">
        <h3 className="text-lg font-semibold mb-3">Feedback</h3>
        <p className="text-gray-600 mb-3">
          Help us improve your dashboard and musician tools.
        </p>
        <textarea
          className="w-full border rounded p-2 h-28"
          placeholder="Share your feedback..."
        ></textarea>
        <button
          className="mt-3 px-4 py-2 bg-black hover:bg-[#ff6667] text-white rounded"
        >
          Submit Feedback
        </button>
      </div>

      {/* ------- Peer Review Section ------- */}
      <div className="bg-white shadow rounded p-4">
        <h3 className="text-lg font-semibold mb-4">Peer Review</h3>

        {[
          "Technical Skill",
          "Team Spirit",
          "Preparation",
          "Timeliness",
          "Stage Presence",
          "Client Satisfaction",
        ].map((cat) => (
          <div key={cat} className="mb-4">
            <p className="font-medium">{cat}</p>
            <div className="flex gap-1 mt-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <span key={i} className="text-gray-300 text-2xl">★</span>
              ))}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};

export default MusicianDashboard;