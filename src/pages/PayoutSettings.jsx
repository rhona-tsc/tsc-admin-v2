import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useLocation } from "react-router-dom";
import { backendUrl } from "../App";

const PayoutSettings = () => {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");
  const [payoutStatus, setPayoutStatus] = useState(null);

  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("adminToken") ||
    localStorage.getItem("musicianToken") ||
    "";

  const headers = useMemo(
    () =>
      token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {},
    [token]
  );

  const loadStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const res = await axios.get(
        `${backendUrl}/api/musician/account/stripe-connect/status`,
        {
          headers,
          withCredentials: true,
        }
      );

      const stripeConnect = res.data?.stripeConnect || null;

      setPayoutStatus(
        stripeConnect
          ? {
              status:
                stripeConnect.accountId &&
                stripeConnect.detailsSubmitted &&
                stripeConnect.payoutsEnabled
                  ? "ready"
                  : stripeConnect.accountId
                  ? "incomplete"
                  : "not_connected",
              accountId: stripeConnect.accountId || "",
              onboardingComplete: Boolean(stripeConnect.onboardingComplete),
              detailsSubmitted: Boolean(stripeConnect.detailsSubmitted),
              chargesEnabled: Boolean(stripeConnect.chargesEnabled),
              payoutsEnabled: Boolean(stripeConnect.payoutsEnabled),
            }
          : null
      );
    } catch (err) {
      console.error("❌ Failed to load payout status:", err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load payout status"
      );
    } finally {
      setLoading(false);
    }
  }, [headers]);

  const handleConnectStripe = async () => {
    try {
      setConnecting(true);
      setError("");

      const res = await axios.post(
        `${backendUrl}/api/musician/account/stripe-connect/onboarding-link`,
        {},
        {
          headers,
          withCredentials: true,
        }
      );

      const onboardingUrl = res?.data?.url || "";
      if (!onboardingUrl) {
        throw new Error("No Stripe onboarding link returned");
      }

      window.location.href = onboardingUrl;
    } catch (err) {
      console.error("❌ Failed to start Stripe onboarding:", err);
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Could not start Stripe onboarding"
      );
    } finally {
      setConnecting(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const refreshRequested =
      searchParams.get("refresh") === "1" ||
      searchParams.get("stripe") === "return" ||
      searchParams.get("stripe") === "refresh";

    if (refreshRequested) {
      loadStatus();
    }
  }, [location.search, loadStatus]);

  const status = payoutStatus?.status || "not_connected";
  const detailsSubmitted = Boolean(payoutStatus?.detailsSubmitted);
  const chargesEnabled = Boolean(payoutStatus?.chargesEnabled);
  const payoutsEnabled = Boolean(payoutStatus?.payoutsEnabled);
  const onboardingComplete = Boolean(payoutStatus?.onboardingComplete);
  const accountId = payoutStatus?.accountId || "";

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow p-6">
      <h1 className="text-2xl font-semibold mb-3">Payout settings</h1>
      <p className="text-sm text-gray-600 mb-6">
        Connect Stripe here so deputy payouts can be sent to you. Once setup is
        complete, this page will show whether your account is ready to receive
        payouts.
      </p>

      {loading ? (
        <p>Loading payout status…</p>
      ) : (
        <>
          <div className="mb-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="mb-3">
              <span className="font-medium">Current status: </span>
              <span>
                {status === "ready"
                  ? "Ready for payouts"
                  : status === "incomplete"
                  ? "Stripe setup incomplete"
                  : "Not connected"}
              </span>
            </div>

            <div className="space-y-2 text-sm text-gray-700">
              <p>
                <span className="font-medium">Stripe account ID:</span>{" "}
                {accountId || "Not created yet"}
              </p>
              <p>
                <span className="font-medium">Details submitted:</span>{" "}
                {detailsSubmitted ? "Yes" : "No"}
              </p>
              <p>
                <span className="font-medium">Charges enabled:</span>{" "}
                {chargesEnabled ? "Yes" : "No"}
              </p>
              <p>
                <span className="font-medium">Payouts enabled:</span>{" "}
                {payoutsEnabled ? "Yes" : "No"}
              </p>
              <p>
                <span className="font-medium">Onboarding complete:</span>{" "}
                {onboardingComplete ? "Yes" : "No"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleConnectStripe}
              disabled={connecting}
              className="px-4 py-2 rounded bg-black text-white hover:bg-gray-800 disabled:opacity-60"
            >
              {connecting
                ? "Opening Stripe…"
                : status === "ready"
                ? "Update Stripe details"
                : status === "incomplete"
                ? "Continue Stripe setup"
                : "Connect Stripe"}
            </button>

            <button
              type="button"
              onClick={loadStatus}
              disabled={loading}
              className="px-4 py-2 rounded border border-gray-300 bg-white text-gray-800 hover:bg-gray-50 disabled:opacity-60"
            >
              Refresh status
            </button>
          </div>
        </>
      )}

      {error && <p className="text-red-600 text-sm mt-4">{error}</p>}
    </div>
  );
};

export default PayoutSettings;