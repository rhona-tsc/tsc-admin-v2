import React, { useState, useEffect, useMemo } from "react";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import { Routes, Route, Navigate } from "react-router-dom";
import Add from "./pages/Add";
import List from "./pages/List";
import MusicianDashboard from "./pages/MusicianDashboard";
import Orders from "./pages/Bookings";
import Login from "./components/Login";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { jwtDecode } from "jwt-decode";
import Moderate from "./pages/Moderate";
import RegisterAsDeputy from "./pages/RegisterAsDeputy";
import EditAct2StepperForm from "./components/EditAct2StepperForm";
import ModerateDeputies from "./pages/ModerateDeputies";
import CreateBooking from "./pages/CreateBooking";
import PendingSongsModeration from "./pages/PendingSongsModeration";
import AddAct2 from "./components/AddAct2StepperForm";
import AddAct2StepperForm from "./components/AddAct2StepperForm";
import EditActModeration from "./pages/EditActModeration";
import Modal from "react-modal";
import DeputyForm from "./components/DeputyForm";
import TrashedActs from "./components/TrashedActs";
import Security from "./pages/Security";
import BookingBoard from "./pages/BookingBoard";
import EnquiryBoard from "./pages/EnquiryBoard";

export const backendUrl =
  import.meta.env.VITE_BACKEND_URL || "https://tsc-backend-v2.onrender.com";

if (!import.meta.env.VITE_BACKEND_URL) {
  console.warn("VITE_BACKEND_URL missing; using default:", backendUrl);
}

export const currency = "£";

// 👇 helper to decode token once
function parseToken(t) {
  if (!t) return {};
  try {
    const d = jwtDecode(t);
    const user = {
      firstName: d?.firstName || "",
      lastName: d?.lastName || "",
      email: d?.email || "",
      phone: d?.phone || "",
      userId: d?.userId || d?.id || "",
      userRole: d?.role || "",
      password: d?.password || "",
    };
    // hardcoded override
    if (d?.id === "68123dcda79759339808b578") {
      user.userRole = "agent";
    }
    return user;
  } catch {
    return {};
  }
}

const App = () => {
  Modal.setAppElement("#root");

  const initialToken = localStorage.getItem("token") || "";
  const initialUser = parseToken(initialToken);

  // ✅ hydrate initial state from token so first render is correct
  const [token, setToken] = useState(initialToken);
  const [firstName, setFirstName] = useState(initialUser.firstName || "");
  const [lastName, setLastName] = useState(initialUser.lastName || "");
  const [phone, setPhone] = useState(initialUser.phone || "");
  const [userId, setUserId] = useState(initialUser.userId || "");
  const [email, setEmail] = useState(initialUser.email || "");
  const [userRole, setUserRole] = useState(initialUser.userRole || "");
  const [password, setPassword] = useState(initialUser.password || "");
  const [hydrated, setHydrated] = useState(true); // true because we already set from token synchronously

  
  const handleLogout = () => {
    setToken("");
    localStorage.clear();
    setFirstName("");
    setLastName("");
    setPhone("");
    setUserId("");
    setEmail("");
    setUserRole("");
    setPassword("");
  };

  // If token changes at runtime (login), re-hydrate fields
  useEffect(() => {
    if (!token) return;
    const d = parseToken(token);
    setFirstName(d.firstName || "");
    setLastName(d.lastName || "");
    setEmail(d.email || "");
    setPhone(d.phone || "");
    setUserId(d.userId || "");
    setUserRole(d.userRole || "");
    setPassword(d.password || "");
    setHydrated(true);
  }, [token]);

  return (
    <div className="bg-gray-50 min-h-screen">
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar
        closeButton={false}
        newestOnTop
        draggable={false}
        className="mb-12"
      />

      {token === "" ? (
        <Login
          setToken={setToken}
          setUserEmail={setEmail}
          setUserRole={setUserRole}
          setUserFirstName={setFirstName}
          setUserLastName={setLastName}
          setUserPhone={setPhone}
          setUserPassword={setPassword}
        />
      ) : (
        // 👇 optional: gate UI until hydrated to prevent flicker
        hydrated && (
          <>
            <Navbar onLogout={handleLogout} />
            <hr />
            <div className="flex w-full">
              <Sidebar
                email={email}
                userRole={userRole}
                firstName={firstName}
                lastName={lastName}
                phone={phone}
                password={password}
                userId={userId}
              />
              <div className="w-[70%] mx-auto ml-[max(5vw,25px)] my-8 text-gray-600 text-base">
                <Routes>
                  <Route
                    path="/"
                    element={
                      <Navigate
                        to={
                          (userRole === "agent" || email === "hello@thesupremecollective.co.uk")
                            ? "/moderate"
                            : "/musicians-dashboard"
                        }
                        replace
                      />
                    }
                  />
                  <Route
                    path="/musicians-dashboard"
                    element={
                      <MusicianDashboard
                        uemail={email}
                        userRole={userRole}
                        firstName={firstName}
                        lastName={lastName}
                        phone={phone}
                        password={password}
                      />
                    }
                  />
                  <Route
                    path="/add-act-2"
                    element={
                      <AddAct2
                        token={token}
                        email={email}
                        userRole={userRole}
                        firstName={firstName}
                        lastName={lastName}
                        phone={phone}
                        password={password}
                      />
                    }
                  />
                 <Route
  path="/edit-act-2/:id"
  element={
    <EditAct2StepperForm
      token={token}
      userRole={userRole}
      isModeration={true}
    />
  }
/>
                    
                  <Route
                    path="/security"
                    element={
                      <Security
                        token={token}
                        email={email}
                        userRole={userRole}
                        firstName={firstName}
                        lastName={lastName}
                        phone={phone}
                        password={password}
                      />
                    }
                  />
                  <Route path="/list" element={<List token={token} />} />
                  <Route
                    path="/register-as-deputy"
                    element={
                      <RegisterAsDeputy
                        token={token}
                        firstName={firstName}
                        lastName={lastName}
                        email={email}
                        phone={phone}
                        password={password}
                        userId={userId}
                        userRole={userRole}
                      />
                    }
                  />
                  {(userRole === "agent" ||
                    email === "hello@thesupremecollective.co.uk") && (
                    <Route
                      path="/moderate-deputy/edit/:id"
                      element={<DeputyForm token={token} userRole={userRole} />}
                    />
                  )}

                  <Route
                    path="/edit-deputy/:id"
                    element={
                      <DeputyForm
                        token={token}
                        firstName={firstName}
                        lastName={lastName}
                        email={email}
                        phone={phone}
                        userRole={userRole}
                        userId={userId}
                      />
                    }
                  />

                  <Route path="/bookings" element={<Orders token={token} />} />

                  {(userRole === "agent" ||
                    email === "hello@thesupremecollective.co.uk") && (
                    <Route path="/moderate" element={<Moderate token={token} />} />
                  )}
                  {(userRole === "agent" ||
                    email === "hello@thesupremecollective.co.uk") && (
                    <Route
                      path="/moderate-deputies"
                      element={<ModerateDeputies token={token} />}
                    />
                  )}
                  {(userRole === "agent" ||
                    email === "hello@thesupremecollective.co.uk") && (
                    <Route
                      path="/create-booking"
                      element={<CreateBooking token={token} />}
                    />
                  )}

                  <Route
  path="/moderate/edit/:id"
  element={
    <EditAct2StepperForm
      token={token}
      userRole={userRole}
      isModeration={true}
    />
  }
/>

                  {(userRole === "agent" ||
                    email === "hello@thesupremecollective.co.uk") && (
                    <Route
                      path="/moderate-songs"
                      element={<PendingSongsModeration token={token} />}
                    />
                  )}
                   {(userRole === "agent" ||
                    email === "hello@thesupremecollective.co.uk") && (
                    <Route
                      path="/enquiry-board"
                      element={<EnquiryBoard token={token} />}
                    />
                  )}
                   {(userRole === "agent" ||
                    email === "hello@thesupremecollective.co.uk") && (
                    <Route
                      path="/booking-board"
                      element={<BookingBoard token={token} />}
                    />
                  )}

                  <Route path="/trash" element={<TrashedActs token={token} />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </div>
            </div>
          </>
        )
      )}
    </div>
  );
};

export default App;