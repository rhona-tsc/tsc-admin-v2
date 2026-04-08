import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import DeputyJobCreateForm from "../components/DeputyJobCreateForm";
import { backendUrl } from "../App";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "");

const DeputyJobPaymentSetupCard = ({
  paymentSetupState,
  authHeaders,
  deputyJobsBaseUrl,
  onSuccess,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveCard = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      toast.error("Stripe is still loading. Please wait a moment and try again.");
      return;
    }

    try {
      setIsSaving(true);

      const result = await stripe.confirmSetup({
        elements,
        redirect: "if_required",
      });

      if (result.error) {
        throw new Error(result.error.message || "Failed to confirm card details.");
      }

      const setupIntent = result.setupIntent;
      const paymentMethodId =
        typeof setupIntent?.payment_method === "string"
          ? setupIntent.payment_method
          : setupIntent?.payment_method?.id || "";

      const saveRes = await axios.post(
        `${deputyJobsBaseUrl}/${paymentSetupState.deputyJobId}/save-payment-method`,
        {
          setupIntentId: setupIntent?.id || paymentSetupState.setupIntentId || "",
          paymentMethodId,
        },
        { headers: authHeaders }
      );

      if (!saveRes.data?.success) {
        throw new Error(saveRes.data?.message || "Failed to save payment method.");
      }

      toast.success(
        saveRes.data?.autoSentNotifications
          ? `Card saved successfully. ${saveRes.data?.notifiedCount || 0} musicians have now been notified.`
          : "Card saved successfully. Automatic payment is now ready for this deputy job."
      );

      if (typeof onSuccess === "function") {
        onSuccess(saveRes.data?.job || null);
      }
    } catch (error) {
      console.error("❌ Failed to save deputy job payment method:", error);
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to save payment method."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm">
      <div className="mb-5">
        <div className="inline-flex items-center rounded-full bg-green-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-green-700">
          Final step
        </div>
        <h2 className="mt-3 text-xl sm:text-2xl font-semibold text-gray-900">
          Save payment card to activate this deputy job
        </h2>
        <p className="mt-3 text-sm text-gray-600 leading-7">
          Your deputy job has been created, but it is not live yet. Please enter the payer’s card details below to activate the job and notify matched musicians.
        </p>
      </div>

      <form onSubmit={handleSaveCard} className="space-y-5">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
          <p className="font-semibold">Important payment information</p>
          <div className="mt-2 space-y-2 leading-6">
            <p>No payment will be taken now.</p>
            <p>The card will only be charged automatically once you allocate the role to a deputy.</p>
            <p>
              Payment is charged securely via Stripe once a deputy is allocated. The deputy’s payment is then scheduled for release after the event, less our commission, and tracked in our payout system.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 sm:p-5">
          <PaymentElement />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-gray-500 leading-5">
            Job ID: {paymentSetupState.deputyJobId}
          </p>

          <button
            type="submit"
            disabled={!stripe || !elements || isSaving}
            className="inline-flex items-center justify-center rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? "Saving card..." : "Save card and activate job"}
          </button>
        </div>
      </form>
    </div>
  );
};

const CreateDeputyJob = () => {
  const [paymentSetupState, setPaymentSetupState] = useState({
    status: "idle",
    deputyJobId: "",
    setupIntentId: "",
    clientSecret: "",
    stripeCustomerId: "",
  });
  const [createdPreviewJob, setCreatedPreviewJob] = useState(null);
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const authToken =
    localStorage.getItem("token") ||
    localStorage.getItem("adminToken") ||
    localStorage.getItem("musicianToken") ||
    sessionStorage.getItem("token") ||
    "";

  const authHeaders = authToken
    ? {
        Authorization: `Bearer ${authToken}`,
        token: authToken,
      }
    : {};

  const deputyJobsBaseUrl = useMemo(
    () => `${backendUrl}/api/deputy-jobs`,
    []
  );

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("deputyJobPaymentSetup");
      if (!stored) return;

      const parsed = JSON.parse(stored);
      if (
        parsed?.status === "prepared" &&
        parsed?.deputyJobId &&
        parsed?.clientSecret
      ) {
        setPaymentSetupState(parsed);
      }
    } catch (error) {
      console.error("❌ Failed to restore deputy job payment setup state:", error);
    }
  }, []);

  const prepareDeputyJobPaymentSetup = async ({ jobId, payload }) => {
    if (!payload?.saveClientCard || !payload?.clientEmail || !jobId) {
      return { success: false, skipped: true };
    }

    const setupRes = await axios.post(
      `${deputyJobsBaseUrl}/${jobId}/create-setup-intent`,
      {
        clientName: payload.clientName || "",
        clientEmail: payload.clientEmail || "",
        clientPhone: payload.clientPhone || "",
      },
      { headers: authHeaders }
    );

    if (!setupRes.data?.success) {
      throw new Error(setupRes.data?.message || "Failed to prepare payment setup");
    }

    const nextPaymentSetupState = {
      status: "prepared",
      deputyJobId: String(jobId || ""),
      setupIntentId: setupRes.data?.setupIntentId || "",
      clientSecret: setupRes.data?.clientSecret || "",
      stripeCustomerId: setupRes.data?.stripeCustomerId || "",
    };

    setPaymentSetupState(nextPaymentSetupState);

    try {
      sessionStorage.setItem(
        "deputyJobPaymentSetup",
        JSON.stringify(nextPaymentSetupState)
      );
    } catch {
      // ignore storage errors
    }

    return { success: true, ...nextPaymentSetupState };
  };

  const handleCreated = (createdJob, options = {}) => {
    const createdId = createdJob?._id || createdJob?.id;
    const params = new URLSearchParams();

    if (createdId) {
      params.set("created", createdId);
    }

    if (options?.paymentSetupPrepared) {
      params.set("paymentSetup", "prepared");
    }

    const queryString = params.toString();

    if (createdId) {
      navigate(`/deputy-jobs${queryString ? `?${queryString}` : ""}`);
      return;
    }

    navigate("/deputy-jobs");
  };

  const handleSubmit = async (payload) => {
    try {
      setIsSubmitting(true);
      setPaymentSetupState({
        status: "idle",
        deputyJobId: "",
        setupIntentId: "",
        clientSecret: "",
        stripeCustomerId: "",
      });

      try {
        sessionStorage.removeItem("deputyJobPaymentSetup");
      } catch {
        // ignore
      }

      const submitPayload = {
        ...payload,
        previewOnly: false,
      };

      const res = await axios.post(deputyJobsBaseUrl, submitPayload, {
        headers: authHeaders,
      });

      if (!res.data?.success) {
        toast.error(res.data?.message || "Failed to create deputy job.");
        return;
      }

      const createdJob = res.data?.job || null;
      const createdJobId = createdJob?._id || createdJob?.id || "";

      let paymentSetupPrepared = false;

      if (submitPayload?.saveClientCard && submitPayload?.clientEmail && createdJobId) {
        try {
          const paymentSetupResult = await prepareDeputyJobPaymentSetup({
            jobId: createdJobId,
            payload: submitPayload,
          });

          paymentSetupPrepared = Boolean(paymentSetupResult?.success);
        } catch (paymentSetupError) {
          console.error("❌ Failed to prepare deputy job payment setup:", paymentSetupError);
          toast.warn(
            paymentSetupError?.response?.data?.message ||
              paymentSetupError?.message ||
              "Deputy job created, but payment setup could not be prepared yet."
          );
        }
      }

      toast.success(
        paymentSetupPrepared
          ? "Deputy job created. Complete the card step below to activate the job and notify matched musicians."
          : `Deputy job created. ${res.data?.notifiedCount || 0} musicians notified.`
      );

      if (paymentSetupPrepared) {
        setCreatedPreviewJob(createdJob);
        toast.info(
          "Your job is not live yet. Please complete the card step below to activate it and send notifications."
        );
        return;
      }

      handleCreated(createdJob, { paymentSetupPrepared: false });
    } catch (error) {
      console.error("❌ Failed to create deputy job:", error);
      toast.error(
        error?.response?.data?.message || "Failed to create deputy job."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-sm text-gray-500 hover:text-black transition-colors"
          >
            ← Back
          </button>

          <div className="mt-4">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-gray-400">
              Deputy opportunities
            </p>
            <h1 className="mt-2 text-3xl sm:text-4xl font-semibold text-gray-900">
              Create a deputy job
            </h1>
            <p className="mt-3 text-sm sm:text-base text-gray-600 max-w-3xl leading-7">
              Post a deputy opportunity for suitable musicians to apply in one click.
              Matching members will be notified automatically.
            </p>
          </div>
        </div>

        {paymentSetupState.status === "prepared" ? (
          paymentSetupState.clientSecret ? (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret: paymentSetupState.clientSecret,
                appearance: {
                  theme: "stripe",
                },
              }}
            >
              <DeputyJobPaymentSetupCard
                paymentSetupState={paymentSetupState}
                authHeaders={authHeaders}
                deputyJobsBaseUrl={deputyJobsBaseUrl}
                onSuccess={(savedJob) => {
                  try {
                    sessionStorage.removeItem("deputyJobPaymentSetup");
                  } catch {
                    // ignore
                  }

                  setPaymentSetupState((prev) => ({
                    ...prev,
                    status: "saved",
                  }));

                  handleCreated(
                    savedJob || createdPreviewJob || { _id: paymentSetupState.deputyJobId },
                    {
                      paymentSetupPrepared: true,
                    }
                  );
                }}
              />
            </Elements>
          ) : null
        ) : (
          <DeputyJobCreateForm
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            submitLabel="Create job"
            authHeaders={authHeaders}
          />
        )}
      </div>
    </div>
  );
};

export default CreateDeputyJob;