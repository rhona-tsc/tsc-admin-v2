import React, { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import { backendUrl } from "../App";
import CustomToast from "../components/CustomToast";
import { assets } from "../assets/assets";

const SetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const emailFromUrl = useMemo(() => (searchParams.get("email") || "").trim().toLowerCase(), [searchParams]);
  const tokenFromUrl = useMemo(() => (searchParams.get("token") || "").trim(), [searchParams]);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const canon = (s = "") => String(s).normalize("NFKC");

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!emailFromUrl || !tokenFromUrl) {
      toast(<CustomToast type="error" message="This link is missing required details. Please request a new one." />);
      return;
    }

    if (!newPassword || !confirmPassword) {
      toast(<CustomToast type="error" message="Please enter and confirm your new password." />);
      return;
    }

    if (newPassword.length < 8) {
      toast(<CustomToast type="error" message="Password must be at least 8 characters." />);
      return;
    }

    if (canon(newPassword) !== canon(confirmPassword)) {
      toast(<CustomToast type="error" message="Passwords do not match." />);
      return;
    }

    try {
      setLoading(true);

      const endpoint = `${backendUrl}/api/musician-login/set-password`;

      await axios.post(
        endpoint,
        { email: emailFromUrl, token: tokenFromUrl, newPassword },
        { headers: { "Content-Type": "application/json" }, timeout: 15000 }
      );

      toast(<CustomToast type="success" message="Password set successfully. Please sign in." />);
      navigate("/login"); // change this route if yours differs
    } catch (err) {
      const status = err?.response?.status;
      const apiMsg = err?.response?.data?.message;

      const pretty =
        apiMsg ||
        (status === 401 && "This link has expired or is invalid. Please request a new one.") ||
        err?.message ||
        "Could not set password.";

      toast(<CustomToast type="error" message={pretty} />);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex flex-col items-center mb-4">
        <img className="w-full" src={assets.hero_w_TSC_logo} alt="The Supreme Collective Logo" />
      </div>

      <form
        onSubmit={onSubmit}
        className="flex flex-col items-center w-[90%] sm:max-w-96 m-auto gap-3 text-gray-800"
      >
        <div className="inline-flex items-center gap-2 mb-2 mt-10">
          <p className="prata-regular text-3xl">Set Password</p>
          <hr className="border-none h-[1.5px] w-8 bg-gray-800" />
        </div>

        <input
          value={emailFromUrl}
          readOnly
          className="w-full px-3 py-2 border border-gray-300 bg-gray-100 text-gray-600"
        />

        <input
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          type="password"
          placeholder="New password (min 8 chars)"
          required
          className="w-full px-3 py-2 border border-gray-800"
          autoComplete="new-password"
        />

        <input
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          type="password"
          placeholder="Confirm new password"
          required
          className="w-full px-3 py-2 border border-gray-800"
          autoComplete="new-password"
        />

        <button className="bg-black text-white font-light px-8 py-2 mt-4" disabled={loading}>
          {loading ? "Setting…" : "Set password"}
        </button>

        <p className="text-sm text-gray-500 mt-2 text-center">
          After setting your password, you’ll be taken to the login page.
        </p>
      </form>
    </>
  );
};

export default SetPassword;