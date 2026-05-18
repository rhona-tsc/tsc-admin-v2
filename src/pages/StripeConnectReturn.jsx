import { useEffect } from "react";

const StripeConnectReturn = () => {
  useEffect(() => {
    window.opener?.postMessage(
      { type: "STRIPE_CONNECT_RETURNED" },
      window.location.origin
    );

    setTimeout(() => window.close(), 500);
  }, []);

  return (
    <div className="p-6 text-center">
      <p className="font-semibold">Stripe setup complete.</p>
      <p className="text-sm text-gray-500 mt-2">
        Returning you to the form…
      </p>
    </div>
  );
};

export default StripeConnectReturn;