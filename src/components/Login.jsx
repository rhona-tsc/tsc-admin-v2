import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { backendUrl } from '../App'; // ✅ Make sure this path is correct
import CustomToast from "../components/CustomToast";


const Login = ({ setToken, setUserEmail, setUserRole, setUserFirstName, setUserLastName, setUserPhone }) => {  const navigate = useNavigate();

  const [currentState, setCurrentState] = useState("Login");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");


const onSubmitHandler = async (event) => {
  event.preventDefault();

  // normalize email before sending
  const normEmail = (email || "").trim().toLowerCase();

  const payload =
    currentState === "Sign Up"
      ? { firstName, lastName, email: normEmail, password, phone }
      : { email: normEmail, password };

  if (!payload.email || !payload.password) {
    toast(<CustomToast type="error" message="Email and password are required." />);
    return;
  }

  try {
    const endpoint =
      currentState === "Sign Up"
        ? `${backendUrl}/api/musician-login/register`
        : `${backendUrl}/api/musician-login/login`;

    console.log("🔄 Submitting login/register form");
    console.log("➡️ Endpoint:", endpoint);
    console.log("📦 Payload:", payload);

    const response = await axios.post(endpoint, payload, {
      headers: { "Content-Type": "application/json" },
      withCredentials: false,
      timeout: 15000,
    });

    console.log("✅ Response received:", response.data);

    // (redundant now because 4xx throws, but harmless)
    if (!response.data.success) {
      throw new Error(response.data.message || "Authentication failed");
    }

    const {
      token,
      email: resEmail,
      role,
      firstName: resFirstName,
      lastName: resLastName,
      phone: resPhone,
      userId,
    } = response.data;

    // lift + persist …
    // (unchanged)
    navigate("/");
  } catch (err) {
    // Prefer backend message if present
    const status = err?.response?.status;
    const apiMsg = err?.response?.data?.message;

    // Optional: friendlier mapping
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

  return (
    <form
      onSubmit={onSubmitHandler}
      className="flex flex-col items-center w-[90%] sm:max-w-96 m-auto mt-14 gap-4 text-gray-800"
    >
      <div className="inline-flex items-center gap-2 mb-2 mt-10">
        <p className="prata-regular text-3xl">{currentState}</p>
        <hr className="border-none h-[1.5px] w-8 bg-gray-800" />
      </div>
      {currentState === "Sign Up" && (
        <>
          <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" required className="w-full px-3 py-2 border border-gray-800" />
          <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last Name" required className="w-full px-3 py-2 border border-gray-800" />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" required className="w-full px-3 py-2 border border-gray-800" />
        </>
      )}

      <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email" required className="w-full px-3 py-2 border border-gray-800" />
      <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" required className="w-full px-3 py-2 border border-gray-800" />

      <div className="w-full flex justify-between text-sm mt-[-8px]">
        <p className=" cursor-pointer">Forgot your password?</p>
        {currentState === "Login" ? (
          <p onClick={() => setCurrentState("Sign Up")} className=" cursor-pointer">Create account</p>
        ) : (
          <p onClick={() => setCurrentState("Login")} className=" cursor-pointer">Login Here</p>
        )}
      </div>

      <button className="bg-black text-white font-light px-8 py-2 mt-4">
        {currentState === "Login" ? "Sign In" : "Sign Up"}
      </button>
    </form>
  );
};



export default Login;

