import React, { useEffect, useState, useMemo } from "react";
import { NavLink, useLocation } from "react-router-dom";
import axios from "axios";
import { assets } from "../assets/assets";
import { backendUrl } from "../App";

const normalize = (s) => (s || "").toLowerCase().trim();

const Sidebar = ({ userRole, userFirstName, userId, userEmail }) => {
  console.log("Sidebar received userRole:", userRole);
  console.log("🧩 Sidebar props:", { userId, userRole });

  const location = useLocation();
  const isAddOrEdit =
    location.pathname.startsWith("/add") ||
    location.pathname.startsWith("/edit");

  // seed from localStorage first for instant correct label
  const seedStatus = useMemo(
    () => (localStorage.getItem("myDeputyStatus") || localStorage.getItem("deputyStatus") || null),
    []
  );

  const [myDeputyStatus, setMyDeputyStatus] = useState(seedStatus);
  const [pendingDeputyCount, setPendingDeputyCount] = useState(0);
  const [pendingSongCount, setPendingSongCount] = useState(0);
  const [pendingActCount, setPendingActCount] = useState(0);

  // helper to compute CTA label + target path
  const getDeputyCTA = (status) => {
    const st = normalize(status);
    if (st === "approved") {
      return {
        label: "Update My Deputy Profile",
        path: `/edit-deputy/${userId}`,
      };
    }
    if (st === "pending" || st === "approved, changes pending") {
      return {
        label: "Update My Deputy Profile Submission",
        path: "/register-as-deputy",
      };
    }
    return {
      label: "Become a Deputy",
      path: "/register-as-deputy",
    };
  };

  useEffect(() => {
    if (!userId) return;

    const fetchDeputy = async () => {
      try {
        console.log("📡 Fetching deputy from backend...");
        const res = await axios.get(`${backendUrl}/api/moderation/deputy/${userId}`);
        console.log("📥 Response from backend:", res);

        if (res.data?.success && res.data.deputy) {
          const deputy = res.data.deputy;
          console.log("✅ Deputy fetched:", deputy);

          const status = (deputy.status || "").trim();
          console.log("🔄 Setting myDeputyStatus to:", status);

          setMyDeputyStatus(status);
          // keep both keys for backward compatibility with any other code paths
          localStorage.setItem("myDeputyStatus", status);
          localStorage.setItem("deputyStatus", status);
        }
      } catch (error) {
        console.error("❌ Failed to fetch deputy:", error);
      }
    };

    fetchDeputy();
  }, [userId]);

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

  const { label: deputyCtaLabel, path: deputyCtaPath } = getDeputyCTA(myDeputyStatus);

  return (
    <div className="w-[18%] min-h-screen border-r-2">
      <div className="flex flex-col gap-4 pt-6 pl-[20%] text-[15px]">

        {/* Deputy CTA */}
        <NavLink
          className="flex items-center gap-3 bg-black hover:bg-[#ff6667] border border-gray-300 border-r-0 px-3 py-2 rounded-l"
          to={deputyCtaPath}
          state={{ userRole, userFirstName }}
        >
          <img className="w-5 h-5" src={assets.deputy_icon} alt="" />
          <p className="hidden md:block text-white">{deputyCtaLabel}</p>
        </NavLink>

        <NavLink
          className="flex items-center gap-3  bg-black hover:bg-[#ff6667] border border-gray-300 border-r-0 px-3 py-2 rounded-l"
          to="/add-act-2"
          state={{ userRole }}
        >
          <img className="w-5 h-5" src={assets.add_icon} alt="" />
          <p className="hidden md:block text-white">Add Act</p>
        </NavLink>

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
          to="/booking-board"
          state={{ userRole }}
        >
          <img className="w-5 h-5" src={assets.booking_board} alt="Booking Board" />
          <p className="hidden md:block text-white">Booking Board</p>
        </NavLink>

        <NavLink
          className="flex items-center gap-3 bg-black hover:bg-[#ff6667] border border-gray-300 border-r-0 px-3 py-2 rounded-l"
          to="/security"
          state={{ userRole }}
        >
          <img className="w-5 h-5" src={assets.security_icon} alt="" />
          <p className="hidden md:block text-white">Security</p>
        </NavLink>

        {normalize(userRole) === "agent" && (
          <>
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
              to="/payment-tracker"
              state={{ userRole }}
            >
              <img className="w-5 h-5" src={assets.payment_icon} alt="" />
              <p className="hidden md:block text-white">Payment Tracker</p>
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
    </div>
  );
};

export default Sidebar;