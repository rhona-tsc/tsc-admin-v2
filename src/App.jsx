import React, { useEffect, useMemo, useState } from "react";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
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
import Modal from "react-modal";
import DeputyForm from "./components/DeputyForm";
import TrashedActs from "./components/TrashedActs";
import Security from "./pages/Security";
import BookingBoard from "./pages/BookingBoard";
import EnquiryBoard from "./pages/EnquiryBoard";
import ActPreSubmissionsPage from "./pages/ActPreSubmissionsPage";
import AgentDashboard from "./pages/AgentDashboard";
import SetPassword from "./pages/SetPassword";
import ResetPassword from "./pages/ResetPassword";
import Messages from "./pages/Messages";
import Musician from "./pages/Musician";
import DeputyJobs from "./pages/DeputyJobs";
import CreateDeputyJob from "./pages/CreateDeputyJob";
import PayoutSettings from "./pages/PayoutSettings";
import DeputyJobDetail from "./pages/DeputyJobDetail";
import ManageDeputyApplications from "./pages/ManageDeputyApplications";
import FinanceDashboard from "./pages/FinanceDashboard";
import FinanceAccounts from "./pages/FinanceAccounts";
import FinanceTransactions from "./pages/FinanceTransactions";
import FinanceReconciliation from "./pages/FinanceReconciliation";
import FinanceForecastEvents from "./pages/FinanceForecastEvents";

export const backendUrl =
  import.meta.env.VITE_BACKEND_URL || "https://tsc-backend-v2.onrender.com";

if (!import.meta.env.VITE_BACKEND_URL) {
  console.warn("VITE_BACKEND_URL missing; using default:", backendUrl);
}

export const currency = "£";

function parseToken(t) {
  if (!t) return {};
  try {
    const d = jwtDecode(t);
    const rawId = d?.userId || d?.id || "";
    const isOid = /^[0-9a-fA-F]{24}$/.test(rawId);

    const user = {
      firstName: d?.firstName || "",
      lastName: d?.lastName || "",
      email: d?.email || "",
      phone: d?.phone || "",
      userId: isOid ? rawId : "",
      userRole: d?.role || "",
      password: d?.password || "",
    };

    if (d?.id === "68123dcda79759339808b578") {
      user.userRole = "agent";
    }

    return user;
  } catch {
    return {};
  }
}

const RequireAuth = ({ children }) => {
  const location = useLocation();
  const token = localStorage.getItem("token") || "";

  if (!token) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: `${location.pathname}${location.search}${location.hash}`,
        }}
      />
    );
  }

  return children;
};

const PublicOnlyRoute = ({ children }) => {
  const token = localStorage.getItem("token") || "";
  const location = useLocation();

  if (token) {
    const redirectTarget =
      location.state?.from && typeof location.state.from === "string"
        ? location.state.from
        : "/musicians-dashboard";

    return <Navigate to={redirectTarget} replace />;
  }

  return children;
};

const App = () => {
  Modal.setAppElement("#root");

  const initialToken = localStorage.getItem("token") || "";
  const initialUser = parseToken(initialToken);

  const [token, setToken] = useState(initialToken);
  const [firstName, setFirstName] = useState(initialUser.firstName || "");
  const [lastName, setLastName] = useState(initialUser.lastName || "");
  const [phone, setPhone] = useState(initialUser.phone || "");
  const [userId, setUserId] = useState(initialUser.userId || "");
  const [email, setEmail] = useState(initialUser.email || "");
  const [userRole, setUserRole] = useState(initialUser.userRole || "");
  const [password, setPassword] = useState(initialUser.password || "");
  const [hydrated, setHydrated] = useState(true);

  const isAdminAgent =
    userRole === "agent" || email === "hello@thesupremecollective.co.uk";

  const isLoggedIn = Boolean(token) && hydrated;

  const handleLogout = () => {
    setToken("");
    localStorage.clear();
    sessionStorage.clear();
    setFirstName("");
    setLastName("");
    setPhone("");
    setUserId("");
    setEmail("");
    setUserRole("");
    setPassword("");
  };

  useEffect(() => {
    const currentToken = localStorage.getItem("token") || "";
    if (currentToken !== token) {
      setToken(currentToken);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;

    const d = parseToken(token);

    setFirstName((prev) => d.firstName || prev);
    setLastName((prev) => d.lastName || prev);
    setEmail((prev) => d.email || prev);
    setPhone((prev) => d.phone || prev);
    setUserId((prev) => d.userId || prev);
    setUserRole((prev) => d.userRole || prev);
    setPassword((prev) => d.password || prev);

    setHydrated(true);
  }, [token]);

  const sidebarProps = useMemo(
    () => ({
      email,
      userRole,
      firstName,
      lastName,
      phone,
      password,
      userId,
    }),
    [email, userRole, firstName, lastName, phone, password, userId],
  );

  return (
    <div className="w-full min-h-screen overflow-x-hidden bg-gray-50">
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar
        closeButton={false}
        newestOnTop
        draggable={false}
        className="mb-12"
      />

      {isLoggedIn ? <Navbar onLogout={handleLogout} /> : null}
      {isLoggedIn ? <hr /> : null}

      <div className={isLoggedIn ? "flex w-full" : "w-full"}>
        {isLoggedIn ? <Sidebar {...sidebarProps} /> : null}

        <div
          className={
            isLoggedIn
              ? "w-[70%] mx-auto ml-[max(5vw,25px)] my-8 text-gray-600 text-base"
              : "w-full min-h-screen"
          }
        >
          <Routes>
            {/* PUBLIC ROUTES */}
            <Route
              path="/login"
              element={
                <PublicOnlyRoute>
                  <Login
                    setToken={setToken}
                    setUserEmail={setEmail}
                    setUserRole={setUserRole}
                    setUserFirstName={setFirstName}
                    setUserLastName={setLastName}
                    setUserPhone={setPhone}
                    setUserPassword={setPassword}
                  />
                </PublicOnlyRoute>
              }
            />

            <Route path="/set-password" element={<SetPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* PUBLIC DEPUTY JOB ROUTES */}
            <Route path="/deputy-jobs" element={<DeputyJobs />} />
            <Route path="/deputy-jobs/:id" element={<DeputyJobDetail />} />

            {/* PUBLIC MUSICIAN PROFILE */}
            <Route path="/musician/:slug" element={<Musician />} />

            {/* DEFAULT */}
            <Route
              path="/"
              element={
                isLoggedIn ? (
                  <Navigate to="/musicians-dashboard" replace />
                ) : (
                  <Navigate to="/deputy-jobs" replace />
                )
              }
            />

            {/* PROTECTED ROUTES */}
            <Route
              path="/musicians-dashboard"
              element={
                <RequireAuth>
                  <MusicianDashboard
                    uemail={email}
                    userRole={userRole}
                    firstName={firstName}
                    lastName={lastName}
                    phone={phone}
                    password={password}
                  />
                </RequireAuth>
              }
            />

            <Route
              path="/act-pre-submissions"
              element={
                <RequireAuth>
                  <ActPreSubmissionsPage userRole={userRole} />
                </RequireAuth>
              }
            />

            <Route
              path="/agent-dashboard"
              element={
                <RequireAuth>
                  <AgentDashboard userRole={userRole} />
                </RequireAuth>
              }
            />

            <Route
              path="/add-act-2"
              element={
                <RequireAuth>
                  <AddAct2
                    token={token}
                    email={email}
                    userRole={userRole}
                    firstName={firstName}
                    lastName={lastName}
                    phone={phone}
                    password={password}
                  />
                </RequireAuth>
              }
            />

            <Route
              path="/edit-act-2/:id"
              element={
                <RequireAuth>
                  <EditAct2StepperForm
                    token={token}
                    userRole={userRole}
                    isModeration={true}
                  />
                </RequireAuth>
              }
            />

            <Route
              path="/security"
              element={
                <RequireAuth>
                  <Security
                    token={token}
                    email={email}
                    userRole={userRole}
                    firstName={firstName}
                    lastName={lastName}
                    phone={phone}
                    password={password}
                  />
                </RequireAuth>
              }
            />

            <Route
              path="/list"
              element={
                <RequireAuth>
                  <List token={token} />
                </RequireAuth>
              }
            />

            <Route
              path="/register-as-deputy"
              element={
                <RequireAuth>
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
                </RequireAuth>
              }
            />

            {isAdminAgent && (
              <Route
                path="/moderate-deputy/edit/:id"
                element={
                  <RequireAuth>
                    <DeputyForm token={token} userRole={userRole} />
                  </RequireAuth>
                }
              />
            )}

            <Route
              path="/edit-deputy/:id"
              element={
                <RequireAuth>
                  <DeputyForm
                    token={token}
                    firstName={firstName}
                    lastName={lastName}
                    email={email}
                    phone={phone}
                    userRole={userRole}
                    userId={userId}
                  />
                </RequireAuth>
              }
            />

            <Route
              path="/bookings"
              element={
                <RequireAuth>
                  <Orders token={token} />
                </RequireAuth>
              }
            />

            {isAdminAgent && (
              <Route
                path="/moderate"
                element={
                  <RequireAuth>
                    <Moderate token={token} />
                  </RequireAuth>
                }
              />
            )}

            {isAdminAgent && (
              <Route
                path="/moderate-deputies"
                element={
                  <RequireAuth>
                    <ModerateDeputies token={token} />
                  </RequireAuth>
                }
              />
            )}

            {isAdminAgent && (
              <Route
                path="/create-booking"
                element={
                  <RequireAuth>
                    <CreateBooking token={token} />
                  </RequireAuth>
                }
              />
            )}

            <Route
              path="/moderate/edit/:id"
              element={
                <RequireAuth>
                  <EditAct2StepperForm
                    token={token}
                    userRole={userRole}
                    isModeration={true}
                  />
                </RequireAuth>
              }
            />

            {isAdminAgent && (
              <Route
                path="/moderate-songs"
                element={
                  <RequireAuth>
                    <PendingSongsModeration token={token} />
                  </RequireAuth>
                }
              />
            )}

            <Route
              path="/enquiry-board"
              element={
                <RequireAuth>
                  <EnquiryBoard token={token} />
                </RequireAuth>
              }
            />

            {isAdminAgent && (
              <Route
                path="/booking-board"
                element={
                  <RequireAuth>
                    <BookingBoard token={token} />
                  </RequireAuth>
                }
              />
            )}

            {isAdminAgent && (
              <Route path="/finance" element={<FinanceDashboard />} />
            )}
            {isAdminAgent && (
              <Route path="/finance/accounts" element={<FinanceAccounts />} />
            )}
            {isAdminAgent && (
              <Route
                path="/finance/transactions"
                element={<FinanceTransactions />}
              />
            )}
    {isAdminAgent && (
            <Route path="/finance/reconciliation" element={<FinanceReconciliation />} />
   )}
    {isAdminAgent && (

   <Route path="/finance/forecast-events" element={<FinanceForecastEvents />} />
   )}

            <Route
              path="/account/payout-settings"
              element={
                <RequireAuth>
                  <PayoutSettings token={token} />
                </RequireAuth>
              }
            />

            <Route
              path="/messages"
              element={
                <RequireAuth>
                  <Messages token={token} />
                </RequireAuth>
              }
            />

            <Route
              path="/deputy-jobs/create"
              element={
                <RequireAuth>
                  <CreateDeputyJob />
                </RequireAuth>
              }
            />

            <Route
              path="/deputy-jobs/:id/applications"
              element={
                <RequireAuth>
                  <ManageDeputyApplications />
                </RequireAuth>
              }
            />

            <Route
              path="/trash"
              element={
                <RequireAuth>
                  <TrashedActs token={token} />
                </RequireAuth>
              }
            />

            <Route path="*" element={<Navigate to="/deputy-jobs" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default App;
