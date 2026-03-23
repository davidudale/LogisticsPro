import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "../Components/Auth/firebase.js";

const PAYSTACK_SCRIPT_URL = "https://js.paystack.co/v2/inline.js";
const functions = getFunctions(app);

let paystackScriptPromise = null;

const loadPaystackInline = () => {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Paystack can only be loaded in the browser."));
  }

  if (window.PaystackPop) {
    return Promise.resolve(window.PaystackPop);
  }

  if (!paystackScriptPromise) {
    paystackScriptPromise = new Promise((resolve, reject) => {
      const existingScript = document.querySelector(`script[src="${PAYSTACK_SCRIPT_URL}"]`);
      if (existingScript) {
        existingScript.addEventListener("load", () => resolve(window.PaystackPop));
        existingScript.addEventListener("error", () => reject(new Error("Failed to load Paystack checkout.")));
        return;
      }

      const script = document.createElement("script");
      script.src = PAYSTACK_SCRIPT_URL;
      script.async = true;
      script.onload = () => resolve(window.PaystackPop);
      script.onerror = () => reject(new Error("Failed to load Paystack checkout."));
      document.body.appendChild(script);
    });
  }

  return paystackScriptPromise;
};

const buildPaymentReference = (order) => {
  const seed = `${order?.orderNo || order?.id || "shipment"}-${Date.now()}`;
  return seed.replace(/[^a-zA-Z0-9.=/-]/g, "-");
};

const extractCallableErrorMessage = (error) => {
  if (!error) return "Payment verification failed.";
  if (typeof error?.details === "string" && error.details.trim()) return error.details;
  if (typeof error?.message === "string" && error.message.trim() && error.message.trim().toLowerCase() !== "internal") {
    return error.message;
  }
  if (typeof error?.code === "string" && error.code.trim()) {
    return `Payment verification failed (${error.code}).`;
  }
  return "Payment verification failed.";
};

export const startPaystackOrderPayment = async ({
  order,
  user,
  onVerifyStart,
  onVerifyEnd,
}) => {
  const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;

  if (!publicKey) {
    throw new Error("Missing VITE_PAYSTACK_PUBLIC_KEY.");
  }

  if (!user?.email && !order?.customerEmail) {
    throw new Error("A customer email is required to start Paystack checkout.");
  }

  const PaystackPop = await loadPaystackInline();
  const verifyPayment = httpsCallable(functions, "verifyPaystackPayment");
  const popup = new PaystackPop();
  const reference = buildPaymentReference(order);
  const amountInKobo = Math.round(Number(order?.quoteTotal || 0) * 100);

  if (!amountInKobo) {
    throw new Error("This order does not have a valid payable amount yet.");
  }

  return new Promise((resolve, reject) => {
    popup.newTransaction({
      key: publicKey,
      email: user?.email || order?.customerEmail,
      amount: amountInKobo,
      currency: "NGN",
      reference,
      metadata: {
        orderId: order?.id || "",
        orderNo: order?.orderNo || "",
        quotationNo: order?.quotationNo || "",
        customerUid: user?.uid || "",
        customerEmail: user?.email || order?.customerEmail || "",
      },
      onSuccess: async (transaction) => {
        try {
          onVerifyStart?.(transaction);
          const result = await verifyPayment({
            orderId: order?.id,
            reference: transaction?.reference || reference,
            customerUid: user?.uid || "",
            customerEmail: user?.email || order?.customerEmail || "",
          });
          resolve(result?.data || {});
        } catch (error) {
          reject(new Error(extractCallableErrorMessage(error)));
        } finally {
          onVerifyEnd?.(transaction);
        }
      },
      onCancel: () => {
        reject(new Error("Payment was cancelled."));
      },
      onError: (error) => {
        reject(error instanceof Error ? error : new Error(error?.message || "Paystack checkout failed."));
      },
    });
  });
};
