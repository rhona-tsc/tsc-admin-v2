import React, { useEffect, useState, useMemo } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { assets } from "../assets/assets";
import { backendUrl } from "../App";
import GatekeeperModal from "./GatekeeperModal";

const normalize = (s) => (s || "").toLowerCase().trim();
const isObjectId = (s) => /^[0-9a-fA-F]{24}$/.test(s || "");

const Sidebar = ({ userRole, userFirstName, userId, userEmail }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [showGatekeeper, setShowGatekeeper] = useState(false);
  const [feedbackCount, setFeedbackCount] = useState(0);
  const [noticeCount, setNoticeCount] = useState(0);
  const [myDeputyStatus, setMyDeputyStatus] = useState(
    localStorage.getItem("myDeputyStatus") ||
    localStorage.getItem("deputyStatus") ||
    null
  );
  const [pendingDeputyCount, setPendingDeputyCount] = useState(0);
  const [pendingSongCount, setPendingSongCount] = useState(0);
  const [pendingActCount, setPendingActCount] = useState(0);
  const [actPreSubmissions, setActPreSubmissions] = useState(0);

  const isAddOrEdit =
    location.pathname.startsWith("/add") ||
    location.pathname.startsWith("/edit");

  // ✅ derive a safe ObjectId once
  const musicianId = useMemo(() => {
    const fromProps = userId;
    const fromLS =
      localStorage.getItem("musicianId") || localStorage.getItem("userId");
    if (isObjectId(fromProps)) return fromProps;
    if (isObjectId(fromLS)) return fromLS;
    return null;
  }, [userId]);

  // ✅ single CTA helper (accepts id)
  const getDeputyCTA = (status, id) => {
    const st = normalize(status);
    if (st === "approved" || st === "pending" || st === "approved, changes pending") {
      return id
        ? {
            label: st === "approved" ? "Update My Profile" : "Update My Profile Submission",
            path: `/edit-deputy/${id}`,
          }
        : { label: "Join The Books", path: "/register-as-deputy" };
    }
    return { label: "Join The Books", path: "/register-as-deputy" };
  };


// only fetch deputy if we actually have a valid id AND the user isn’t an agent
useEffect(() => {
  if (!musicianId || normalize(userRole) === "agent") return;
  (async () => {
try {
  const token = localStorage.getItem("token");
  const res = await axios.get(`${backendUrl}/api/moderation/deputy/${musicianId}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    withCredentials: true,
  });
  if (res.data?.success && res.data.deputy) {
        const status = (res.data.deputy.status || "").trim();
        setMyDeputyStatus(status);
        localStorage.setItem("myDeputyStatus", status);
        localStorage.setItem("deputyStatus", status);
      }
    } catch (error) {
      console.error("❌ Failed to fetch deputy:", error);
    }
  })();
}, [musicianId, userRole]);


useEffect(() => {
  if (normalize(userRole) !== "agent") return;
  
  const fetchActPreSubmissions = async () => {
    try {
      const res = await axios.get(`${backendUrl}/api/act-pre-submissions/pending-count`);
      setActPreSubmissions(res.data.count || 0);
    } catch (err) {
      console.error("Failed to fetch count:", err);
    }
  };

  fetchActPreSubmissions();
}, [userRole]);

  const { label: deputyCtaLabel, path: deputyCtaPath } =
    getDeputyCTA(myDeputyStatus, musicianId);


  useEffect(() => {
    const fetchPendingActs = async () => {
      try {
        const res = await axios.get(`${backendUrl}/api/moderation/acts/pending-count`);
        if (typeof res.data?.count === "number") {
          setPendingActCount(res.data.count);
        }
      } catch (err) {
        console.error("Failed to fetch act count:", err);
      }
    };
    if (normalize(userRole) === "agent") fetchPendingActs();
  }, [userRole]);

  useEffect(() => {
    const fetchPendingDeputies = async () => {
      try {
        const res = await axios.get(`${backendUrl}/api/moderation/deputies/pending-count`);
        if (res.data?.success) {
          setPendingDeputyCount(res.data.count || 0);
        }
      } catch (err) {
        console.error("Failed to fetch deputy count:", err);
      }
    };
    if (normalize(userRole) === "agent") fetchPendingDeputies();
  }, [userRole]);

  useEffect(() => {
    const fetchPendingSongs = async () => {
      try {
        const res = await axios.get(`${backendUrl}/api/moderation/songs/pending-count`);
        if (res.data?.success) {
          setPendingSongCount(res.data.count || 0);
        }
      } catch (err) {
        console.error("Failed to fetch song count:", err);
      }
    };
    if (normalize(userRole) === "agent") fetchPendingSongs();
  }, [userRole]);

  useEffect(() => {
  const fetchCounts = async () => {
    try {
      const fb = await axios.get(`${backendUrl}/api/feedback/unread-count`);
      const nb = await axios.get(`${backendUrl}/api/noticeboard/new-count`);

      setFeedbackCount(fb.data.count || 0);
      setNoticeCount(nb.data.count || 0);
    } catch (err) {
      console.error("Failed to fetch badge counts:", err);
    }
  };

  if (normalize(userRole) === "agent") fetchCounts();
}, [userRole]);

const handleSubmitActClick = (e) => {
  e.preventDefault();

  if (normalize(userRole) === "agent") {
    navigate("/add-act-2", { state: { userRole } });
    return;
  }

  setShowGatekeeper(true);
};


  return (
    <div className="w-[18%] min-h-screen border-r-2">
      <div className="flex flex-col gap-4 pt-6 pl-[20%] text-[15px] rounded-md">

        {/* Deputy CTA */}
        <NavLink
          className="flex items-center gap-3 bg-black hover:bg-[#ff6667] border border-gray-300 border-r-0 px-3 py-2 rounded-l"
          to={deputyCtaPath}
          state={{ userRole, userFirstName }}
        >
          <img className="w-5 h-5" src={assets.deputy_icon} alt="" />
          <p className="hidden md:block text-white">{deputyCtaLabel}</p>
        </NavLink>
<button
  onClick={handleSubmitActClick}
  className="flex items-center gap-3 bg-black hover:bg-[#ff6667] border border-gray-300 border-r-0 px-3 py-2 rounded-l text-left"
>
  <img className="w-5 h-5" src={assets.add_icon} alt="" />
  <p className="hidden md:block text-white">Submit Act</p>
</button>

        <NavLink
          className="flex items-center gap-3  bg-black hover:bg-[#ff6667] border border-gray-300 border-r-0 px-3 py-2 rounded-l"
          to="/list"
          state={{ userRole }}
        >
          <img className="w-5 h-5" src={assets.your_acts_icon} alt="" />
          <p className="hidden md:block  text-white">Your Acts</p>
        </NavLink>

        <NavLink
          className="flex items-center gap-3 bg-black hover:bg-[#ff6667] border border-gray-300 border-r-0 px-3 py-2 rounded-l"
          to="/bookings"
          state={{ userRole }}
        >
          <img className="w-5 h-5" src={assets.order_icon} alt="" />
          <p className="hidden md:block  text-white">Bookings</p>
        </NavLink>

        <NavLink
          className="flex items-center gap-3 bg-black hover:bg-[#ff6667] border border-gray-300 border-r-0 px-3 py-2 rounded-l"
          to="/enquiry-board"
          state={{ userRole }}
        >
          <img className="w-5 h-5" src={assets.enquiry_board_icon} alt="Enquiry Board" />
          <p className="hidden md:block text-white">Enquiry Board</p>
        </NavLink>

              

        <NavLink
          className="flex items-center gap-3 bg-black hover:bg-[#ff6667] border border-gray-300 border-r-0 px-3 py-2 rounded-l"
          to="/security"
          state={{ userRole }}
        >
          <img className="w-5 h-5" src={assets.security_icon} alt="" />
          <p className="hidden md:block text-white">Security</p>
        </NavLink>

         <NavLink
              className="flex items-center gap-3 bg-black hover:bg-[#ff6667] border border-gray-300 border-r-0 px-3 py-2 rounded-l"
              to="/payment-tracker"
              state={{ userRole }}
            >
              <img className="w-5 h-5" src={assets.payment_icon} alt="" />
              <p className="hidden md:block text-white">Payment Tracker</p>
            </NavLink>

        {normalize(userRole) === "agent" && (
          <>

            <NavLink
          className="flex items-center gap-3 bg-black hover:bg-[#ff6667] border border-gray-300 border-r-0 px-3 py-2 rounded-l"
          to="/booking-board"
          state={{ userRole }}
        >
          <img className="w-5 h-5" src={assets.booking_board} alt="Booking Board" />
          <p className="hidden md:block text-white">Booking Board</p>
        </NavLink>

            <NavLink
              className="flex items-center justify-between bg-black hover:bg-[#ff6667] border border-gray-300 border-r-0 px-3 py-2 rounded-l relative"
              to="/moderate"
              state={{ userRole }}
            >
              <div className="flex items-center gap-3">
                <img className="w-5 h-5" src={assets.moderate_icon} alt="" />
                <p className="hidden md:block text-white">Moderate Acts</p>
              </div>
              {pendingActCount > 0 && (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#ff6667] text-white text-xs font-semibold px-2 py-0.5 rounded-full border border-white">
                  {pendingActCount}
                </span>
              )}
            </NavLink>

            <NavLink
              className="flex items-center justify-between bg-black hover:bg-[#ff6667] border border-gray-300 border-r-0 px-3 py-2 rounded-l relative"
              to="/moderate-deputies"
              state={{ userRole }}
            >
              <div className="flex items-center gap-3">
                <img className="w-5 h-5" src={assets.deputy_icon} alt="" />
                <p className="hidden md:block text-white">Moderate Deputies</p>
              </div>
              {pendingDeputyCount > 0 && (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#ff6667] text-white text-xs font-semibold px-2 py-0.5 rounded-full border border-white">
                  {pendingDeputyCount}
                </span>
              )}
            </NavLink>

            <NavLink
              className="flex items-center justify-between bg-black hover:bg-[#ff6667] border border-gray-300 border-r-0 px-3 py-2 rounded-l relative"
              to="/moderate-songs"
              state={{ userRole }}
            >
              <div className="flex items-center gap-3">
                <img className="w-5 h-5" src={assets.moderate_icon} alt="" />
                <p className="hidden md:block text-white">Moderate Songs</p>
              </div>
              {pendingSongCount > 0 && (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#ff6667] text-white text-xs font-semibold px-2 py-0.5 rounded-full border border-white">
                  {pendingSongCount}
                </span>
              )}
            </NavLink>

            <NavLink
              className="flex items-center gap-3 bg-black hover:bg-[#ff6667] border border-gray-300 border-r-0 px-3 py-2 rounded-l"
              to="/noticeboard"
              state={{ userRole }}
            >
                            <div className="flex items-center gap-3">

              <img className="w-5 h-5" src={assets.noticeboard_icon} alt="Noticeboard" />
              <p className="hidden md:block text-white">Noticeboard</p>
                </div>
                  {noticeCount > 0 && (
  <span className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#ff6667] text-white text-xs font-semibold px-2 py-0.5 rounded-full border border-white">
    {noticeCount}
  </span>
)}
            </NavLink>

            <NavLink
              className="flex items-center gap-3 bg-black hover:bg-[#ff6667] border border-gray-300 border-r-0 px-3 py-2 rounded-l"
              to="/feedback"
              state={{ userRole }}
            >
              <div>
              <img className="w-5 h-5" src={assets.feedback_icon} alt="Feedback" />
              <p className="hidden md:block text-white">Feedback</p>
              </div>
              {feedbackCount > 0 && (
  <span className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#ff6667] text-white text-xs font-semibold px-2 py-0.5 rounded-full border border-white">
    {feedbackCount}
  </span>
)}
            </NavLink>

          
     

            <NavLink
  className="flex items-center gap-3 bg-black hover:bg-[#ff6667] border border-gray-300 border-r-0 px-3 py-2 rounded-l"
  to="/act-pre-submissions"
  state={{ userRole }}
>
  <div className="flex items-center gap-3">
    <img className="w-5 h-5" src={assets.actPreSubmissions_icon} alt="Act Pre-Submissions" />
    <p className="hidden md:block text-white">Act Pre-Submissions</p>
  </div>

  {actPreSubmissions > 0 && (
    <span className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#ff6667] text-white text-xs font-semibold px-2 py-0.5 rounded-full border border-white">
      {actPreSubmissions}
    </span>
  )}
</NavLink>

            <NavLink
              className="flex items-center gap-3 bg-black hover:bg-[#ff6667] border border-gray-300 border-r-0 px-3 py-2 rounded-l"
              to="/trash"
              state={{ userRole }}
            >
              <img className="w-5 h-5" src={assets.bin_icon} alt="" />
              <p className="hidden md:block text-white">Trash</p>
            </NavLink>
          </>
        )}
      </div>
      <GatekeeperModal
  isOpen={showGatekeeper}
  onClose={() => setShowGatekeeper(false)}
  userFirstName={userFirstName}
  userEmail={userEmail}
  userId={userId}
/>
    </div>
  );
};

export default Sidebar;