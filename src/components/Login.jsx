import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import { backendUrl } from "../App";
import CustomToast from "../components/CustomToast";
import { assets } from "../assets/assets";

const Login = ({
  setToken,
  setUserEmail,
  setUserRole,
  setUserFirstName,
  setUserLastName,
  setUserPhone,
  setUserPassword, // optional
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [currentState, setCurrentState] = useState("Login");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const getPostLoginRedirect = () => {
    const stateRedirect = location.state?.from;
    if (typeof stateRedirect === "string" && stateRedirect.startsWith("/")) {
      return stateRedirect;
    }

    const searchParams = new URLSearchParams(location.search);
    const queryRedirect = searchParams.get("redirect");
    if (typeof queryRedirect === "string" && queryRedirect.startsWith("/")) {
      return queryRedirect;
    }

    return "/musicians-dashboard";
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();

    const normEmail = (email || "").trim().toLowerCase();

    const payload =
      currentState === "Sign Up"
        ? { firstName, lastName, email: normEmail, password, phone }
        : { email: normEmail, password };

    if (!payload.email || !payload.password) {
      toast(
        <CustomToast type="error" message="Email and password are required." />,
      );
      return;
    }

    try {
      const endpoint =
        currentState === "Sign Up"
          ? `${backendUrl}/api/musician-login/register`
          : `${backendUrl}/api/musician-login/login`;

      const response = await axios.post(endpoint, payload, {
        headers: { "Content-Type": "application/json" },
        withCredentials: false,
        timeout: 15000,
      });

      if (!response?.data?.success) {
        throw new Error(response?.data?.message || "Authentication failed");
      }

      const {
        token,
        email: resEmail,
        role,
        firstName: resFirstName,
        lastName: resLastName,
        phone: resPhone,
        userId,
        mustChangePassword,
      } = response.data;

      localStorage.removeItem("myDeputyStatus");
      localStorage.removeItem("deputyStatus");

      localStorage.setItem("userId", userId);
      sessionStorage.setItem("userId", userId);

      localStorage.setItem("userEmail", resEmail || "");
      localStorage.setItem("userRole", role || "");
      localStorage.setItem("userFirstName", resFirstName || "");
      localStorage.setItem("userLastName", resLastName || "");
      localStorage.setItem("userPhone", resPhone || "");

      localStorage.setItem("token", token);
      setToken(token);

      setUserEmail?.(resEmail || "");
      setUserRole?.(role || "");
      setUserFirstName?.(resFirstName || "");
      setUserLastName?.(resLastName || "");
      setUserPhone?.(resPhone || "");

      // never store plaintext password
      setUserPassword?.("");

      const redirectPath = getPostLoginRedirect();

      if (mustChangePassword) {
        navigate("/security", { state: { from: redirectPath } });
      } else {
        navigate(redirectPath, { replace: true });
      }
    } catch (err) {
      const status = err?.response?.status;
      const apiMsg = err?.response?.data?.message;

      const pretty =
        apiMsg ||
        (status === 404 && "No account found for that email.") ||
        (status === 422 && "This account has no password set.") ||
        (status === 401 && "Incorrect password.") ||
        err?.message ||
        "Authentication failed";

      console.error("❌ Auth error:", {
        message: err?.message,
        code: err?.code,
        status,
        data: err?.response?.data,
      });

      toast(<CustomToast type="error" message={pretty} />);
    }
  };

  const handleForgotPassword = async () => {
    const normEmail = (email || "").trim().toLowerCase();
    if (!normEmail) {
      toast(
        <CustomToast
          type="info"
          message="Enter your email above, then click ‘Forgot your password?’"
        />,
      );
      return;
    }

    try {
      await axios.post(
        `${backendUrl}/api/musician-login/forgot-password`,
        { email: normEmail },
        { headers: { "Content-Type": "application/json" }, timeout: 15000 },
      );

      toast(
        <CustomToast
          type="success"
          message="If that email exists, we’ve sent a reset link."
        />,
      );
    } catch (err) {
      console.error("Forgot password error:", err?.response?.data || err);
      toast(
        <CustomToast
          type="error"
          message="Couldn’t start password reset. Please try again."
        />,
      );
    }
  };

  return (
    <>
   

  <div className="flex flex-col items-center mb-4">

    <img

      className="w-full"

      src={assets.hero_w_TSC_logo}

      alt="The Supreme Collective Logo"

    />

  </div>

  <form

    onSubmit={onSubmitHandler}

    className="flex flex-col items-center w-full px-4 sm:max-w-96 sm:px-0 m-auto gap-3 text-gray-800"

  >
        <div className="inline-flex items-center gap-2 mb-2 mt-10">
          <p className="prata-regular text-3xl">{currentState}</p>
          <hr className="border-none h-[1.5px] w-8 bg-gray-800" />
        </div>

        {currentState === "Sign Up" && (
          <>
            <input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First name"
              required
              className="w-full px-3 py-2 border border-gray-800"
            />
            <input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Last Name"
              required
              className="w-full px-3 py-2 border border-gray-800"
            />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone number"
              required
              className="w-full px-3 py-2 border border-gray-800"
            />
          </>
        )}

        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="Email"
          required
          className="w-full px-3 py-2 border border-gray-800"
        />

        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          placeholder="Password"
          required
          className="w-full px-3 py-2 border border-gray-800"
        />

        <div className="w-full flex justify-between text-sm mt-[-8px]">
          <p
            className="cursor-pointer underline"
            onClick={handleForgotPassword}
          >
            Forgot your password?
          </p>

          {currentState === "Login" ? (
            <p
              onClick={() => setCurrentState("Sign Up")}
              className="cursor-pointer"
            >
              Create account
            </p>
          ) : (
            <p
              onClick={() => setCurrentState("Login")}
              className="cursor-pointer"
            >
              Login Here
            </p>
          )}
        </div>

        <button className="bg-black text-white font-light px-8 py-2 mt-4">
          {currentState === "Login" ? "Sign In" : "Sign Up"}
        </button>
      </form>
    </>
  );
};

export default Login;
