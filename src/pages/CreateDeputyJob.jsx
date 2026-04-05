import React, { useMemo, useState } from "react";
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

      toast.success("Card saved successfully. Automatic payment is now ready for this deputy job.");

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
      <div className="mb-4">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Save client card</h2>
        <p className="mt-2 text-sm text-gray-600 leading-6">
          Enter the client’s card details below so payment can be taken automatically once a deputy is allocated.
        </p>
      </div>

      <form onSubmit={handleSaveCard} className="space-y-5">
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
            {isSaving ? "Saving card..." : "Save card details"}
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

    const endpoint = payload?.previewOnly
      ? `${deputyJobsBaseUrl}/preview`
      : deputyJobsBaseUrl;

    const res = await axios.post(endpoint, payload, {
      headers: authHeaders,
    });

    if (!res.data?.success) {
      toast.error(res.data?.message || "Failed to create deputy job.");
      return;
    }

    const createdJob = res.data.job;
    const createdJobId = createdJob?._id || createdJob?.id;

    if (payload?.previewOnly) {
      let paymentSetupPrepared = false;

      if (payload?.saveClientCard && payload?.clientEmail && createdJobId) {
        const previewPayment = res.data?.payment;

        if (previewPayment?.clientSecret) {
          const nextPaymentSetupState = {
            status: "prepared",
            deputyJobId: String(createdJobId || ""),
            setupIntentId: previewPayment?.setupIntentId || "",
            clientSecret: previewPayment?.clientSecret || "",
            stripeCustomerId: previewPayment?.stripeCustomerId || "",
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

          paymentSetupPrepared = true;
        } else {
          try {
            const paymentSetupResult = await prepareDeputyJobPaymentSetup({
              jobId: createdJobId,
              payload,
            });

            paymentSetupPrepared = Boolean(paymentSetupResult?.success);
          } catch (paymentSetupError) {
            console.error(
              "❌ Failed to prepare deputy job preview payment setup:",
              paymentSetupError
            );
            toast.warn(
              paymentSetupError?.response?.data?.message ||
                paymentSetupError?.message ||
                "Preview created, but payment setup could not be prepared yet."
            );
          }
        }
      }

      toast.success(
        paymentSetupPrepared
          ? `Preview ready. ${res.data.matchedCount || 0} musicians matched and payment setup prepared.`
          : `Preview ready. ${res.data.matchedCount || 0} musicians matched.`
      );

      if (paymentSetupPrepared) {
        setCreatedPreviewJob(createdJob);
        toast.info(
          "Preview created and card setup is ready below. Complete the Stripe card step before leaving this page."
        );
        return;
      }

      handleCreated(createdJob, { paymentSetupPrepared: false });
      return;
    }

    let paymentSetupPrepared = false;

    if (payload?.saveClientCard && payload?.clientEmail && createdJobId) {
      try {
        const paymentSetupResult = await prepareDeputyJobPaymentSetup({
          jobId: createdJobId,
          payload,
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
        ? `Deputy job created. ${res.data.notifiedCount || 0} musicians notified and payment setup prepared.`
        : `Deputy job created. ${res.data.notifiedCount || 0} musicians notified.`
    );

    if (payload?.saveClientCard && payload?.clientEmail && !paymentSetupPrepared) {
      toast.info(
        "You can still open the deputy job and start payment setup from the management view once the card form is connected."
      );
    }

    handleCreated(createdJob, { paymentSetupPrepared });
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
          <>
            <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 px-4 py-4 text-sm text-green-800">
              Deputy job payment setup has been prepared. The SetupIntent has been created and saved for job ID {paymentSetupState.deputyJobId}. Enter the client card details below to finish linking the payment method.
            </div>

            {paymentSetupState.clientSecret ? (
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
                    setPaymentSetupState((prev) => ({
                      ...prev,
                      status: "saved",
                    }));
                    handleCreated(savedJob || createdPreviewJob || { _id: paymentSetupState.deputyJobId }, {
                      paymentSetupPrepared: true,
                    });
                  }}
                />
              </Elements>
            ) : null}
          </>
        ) : null}

        <DeputyJobCreateForm
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          submitLabel="Create job"
          authHeaders={authHeaders}
        />
      </div>
    </div>
  );
};

export default CreateDeputyJob;