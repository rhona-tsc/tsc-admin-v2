import React, { useMemo, useState } from "react";
import axios from "axios";
import { backendUrl } from "../App";
import { toast } from "react-toastify";
import CustomToast from "../components/CustomToast";

const Field = ({ label, children }) => (
  <label className="block mb-4">
    <div className="mb-1 font-medium text-gray-900">{label}</div>
    {children}
  </label>
);

const Section = ({ title, subtitle, children }) => (
  <section className="bg-white border rounded p-5 sm:p-6 shadow-sm">
    <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
    {subtitle ? (
      <p className="text-sm text-gray-500 mt-1 mb-4">{subtitle}</p>
    ) : (
      <div className="h-2" />
    )}
    {children}
  </section>
);

const Security = () => {
  const token = useMemo(() => localStorage.getItem("token") || "", []);
  const storedEmail = useMemo(() => localStorage.getItem("userEmail") || "", []);
  const userRole = useMemo(() => localStorage.getItem("userRole") || "agent", []);
  const accountBase = userRole === "musician" ? "/api/musician/account" : "/api/account";

  console.log('[Security] role:', userRole, 'accountBase:', accountBase);

  // --- Update Email state ---
  const [newEmail, setNewEmail] = useState(storedEmail);
  const [confirmEmail, setConfirmEmail] = useState(storedEmail);
  const [currentPwForEmail, setCurrentPwForEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);

  // --- Update Password state ---
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  // --- Update Phone state ---
  const storedPhone = useMemo(() => localStorage.getItem("userPhone") || "", []);
  const [newPhone, setNewPhone] = useState(storedPhone);
  const [confirmPhone, setConfirmPhone] = useState(storedPhone);
  const [currentPwForPhone, setCurrentPwForPhone] = useState("");
  const [phoneLoading, setPhoneLoading] = useState(false);

  const isValidEmail = (val = "") => /.+@.+\..+/.test(val);
  const isValidPhone = (val = "") => /^\+?[0-9\s\-()]{7,20}$/.test(val.trim());

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!newEmail || !confirmEmail) {
      toast(<CustomToast type="error" message="Please enter and confirm your new email." />);
      return;
    }
    if (!isValidEmail(newEmail)) {
      toast(<CustomToast type="error" message="Please enter a valid email address." />);
      return;
    }
    if (newEmail !== confirmEmail) {
      toast(<CustomToast type="error" message="Email addresses do not match." />);
      return;
    }
    if (!currentPwForEmail) {
      toast(<CustomToast type="error" message="Please enter your current password." />);
      return;
    }

    try {
      setEmailLoading(true);
      const url = `${backendUrl}${accountBase}/change-email`;
      console.log('[Security] POST', url, { newEmail, currentPassword: '****' });
      const { data } = await axios.post(
        url,
        { newEmail, currentPassword: currentPwForEmail },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );

      if (!data?.success) throw new Error(data?.message || "Could not update email.");

      localStorage.setItem("userEmail", newEmail);
      toast(<CustomToast type="success" message="Email updated successfully." />);
    } catch (err) {
      console.log('[Security] email error', err?.response?.status, err?.response?.data || err?.message);
      toast(
        <CustomToast
          type="error"
          message={err?.response?.data?.message || err?.message || "Email update failed."}
        />
      );
    } finally {
      setEmailLoading(false);
    }
  };

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    if (!newPhone || !confirmPhone) {
      toast(<CustomToast type="error" message="Please enter and confirm your new phone number." />);
      return;
    }
    if (!isValidPhone(newPhone)) {
      toast(<CustomToast type="error" message="Please enter a valid phone number." />);
      return;
    }
    if (newPhone.trim() !== confirmPhone.trim()) {
      toast(<CustomToast type="error" message="Phone numbers do not match." />);
      return;
    }
    if (!currentPwForPhone) {
      toast(<CustomToast type="error" message="Please enter your current password." />);
      return;
    }

    try {
      setPhoneLoading(true);
      const url = `${backendUrl}${accountBase}/change-phone`;
      console.log('[Security] POST', url, { newPhone: newPhone.trim(), currentPassword: '****' });
      const { data } = await axios.post(
        url,
        { newPhone: newPhone.trim(), currentPassword: currentPwForPhone },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );

      if (!data?.success) throw new Error(data?.message || "Could not update phone number.");

      localStorage.setItem("userPhone", newPhone.trim());
      toast(<CustomToast type="success" message="Phone number updated successfully." />);
    } catch (err) {
      const status = err?.response?.status;
      console.log('[Security] phone error', status, err?.response?.data || err?.message);
      const msg = err?.response?.data?.message || err?.message || "Phone update failed.";
      toast(<CustomToast type="error" message={`(${status || 'ERR'}) ${msg}`} />);
    } finally {
      setPhoneLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast(<CustomToast type="error" message="Please fill in all password fields." />);
      return;
    }
    if (newPassword.length < 8) {
      toast(<CustomToast type="error" message="New password must be at least 8 characters." />);
      return;
    }
  // Compare with Unicode-normalized strings to avoid invisible character issues
const canon = (s = "") => String(s).normalize("NFKC");
const np = canon(newPassword);
const cp = canon(confirmPassword);

if (np !== cp) {
  console.log("[Security] password mismatch", {
    newPasswordLen: newPassword.length,
    confirmPasswordLen: confirmPassword.length,
  });
  toast(<CustomToast type="error" message="New passwords do not match." />);
  return;
}

    try {
      setPwLoading(true);
      const url = `${backendUrl}${accountBase}/change-password`;
      console.log('[Security] POST', url, { currentPassword: '****', newPassword: '****' });
      const { data } = await axios.post(
        url,
        { currentPassword, newPassword },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );

      if (!data?.success) throw new Error(data?.message || "Could not update password.");

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast(<CustomToast type="success" message="Password updated successfully." />);
    } catch (err) {
      console.log('[Security] password error', err?.response?.status, err?.response?.data || err?.message);
      toast(
        <CustomToast
          type="error"
          message={err?.response?.data?.message || err?.message || "Password update failed."}
        />
      );
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Security</h1>
      <p className="text-sm text-gray-500">
        Manage your sign-in email and password. For your safety, you may be asked to enter your
        current password to confirm changes.
      </p>

      {/* Update Email */}
      <Section
        title="Change Email"
        subtitle="Update the email address you use to sign in and receive notifications."
      >
        <form onSubmit={handleEmailSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="New email">
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              autoComplete="email"
              className="w-full border rounded px-3 py-2"
              placeholder="e.g. you@example.com"
              required
            />
          </Field>
          <Field label="Confirm new email">
            <input
              type="email"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              autoComplete="email"
              className="w-full border rounded px-3 py-2"
              placeholder="Repeat new email"
              required
            />
          </Field>
          <Field label="Current password">
            <input
              type="password"
              value={currentPwForEmail}
              onChange={(e) => setCurrentPwForEmail(e.target.value)}
              autoComplete="current-password"
              className="w-full border rounded px-3 py-2"
              placeholder="Enter current password"
              required
            />
          </Field>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={emailLoading}
              className={`px-4 py-2 rounded text-white ${
                emailLoading ? "bg-gray-400 cursor-not-allowed" : "bg-black hover:bg-[#ff6667]"
              }`}
            >
              {emailLoading ? "Updating…" : "Update email"}
            </button>
          </div>
        </form>
      </Section>

      {/* Update Phone */}
      <Section
        title="Change Phone Number"
        subtitle="Update the phone number associated with your account."
      >
        <form onSubmit={handlePhoneSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="New phone number">
            <input
              type="tel"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              autoComplete="tel"
              className="w-full border rounded px-3 py-2"
              placeholder="e.g. +44 7700 900123"
              required
            />
          </Field>
          <Field label="Confirm new phone number">
            <input
              type="tel"
              value={confirmPhone}
              onChange={(e) => setConfirmPhone(e.target.value)}
              autoComplete="tel"
              className="w-full border rounded px-3 py-2"
              placeholder="Repeat new phone number"
              required
            />
          </Field>
          <Field label="Current password">
            <input
              type="password"
              value={currentPwForPhone}
              onChange={(e) => setCurrentPwForPhone(e.target.value)}
              autoComplete="current-password"
              className="w-full border rounded px-3 py-2"
              placeholder="Enter current password"
              required
            />
          </Field>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={phoneLoading}
              className={`px-4 py-2 rounded text-white ${
                phoneLoading ? "bg-gray-400 cursor-not-allowed" : "bg-black hover:bg-[#ff6667]"
              }`}
            >
              {phoneLoading ? "Updating…" : "Update phone"}
            </button>
          </div>
        </form>
      </Section>

      {/* Update Password */}
      <Section
        title="Change Password"
        subtitle="Choose a strong password you haven’t used elsewhere. Minimum 8 characters."
      >
        <form onSubmit={handlePasswordSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Current password">
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full border rounded px-3 py-2"
              placeholder="Enter current password"
              required
            />
          </Field>
          <Field label="New password">
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              className="w-full border rounded px-3 py-2"
              placeholder="Minimum 8 characters"
              required
            />
          </Field>
          <Field label="Confirm new password">
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              className="w-full border rounded px-3 py-2"
              placeholder="Repeat new password"
              required
            />
          </Field>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={pwLoading}
              className={`px-4 py-2 rounded text-white ${
                pwLoading ? "bg-gray-400 cursor-not-allowed" : "bg-black hover:bg-[#ff6667]"
              }`}
            >
              {pwLoading ? "Updating…" : "Update password"}
            </button>
          </div>
        </form>
      </Section>
    </div>
  );
};

export default Security;