import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";

initializeApp();

const db = getFirestore();
const PAYSTACK_VERIFY_URL = "https://api.paystack.co/transaction/verify";
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || "";

const normalizePaymentStatus = (amountPaid, quoteTotal) => {
  if (amountPaid >= quoteTotal) return "paid";
  if (amountPaid > 0) return "partial";
  return "unpaid";
};

export const verifyPaystackPayment = onCall(async (request) => {
  try {
    if (!PAYSTACK_SECRET_KEY) {
      throw new HttpsError("failed-precondition", "PAYSTACK_SECRET_KEY is not configured.");
    }

    const orderId = request.data?.orderId?.toString().trim();
    const reference = request.data?.reference?.toString().trim();
    const customerUid = request.data?.customerUid?.toString().trim() || "";
    const customerEmail = request.data?.customerEmail?.toString().trim().toLowerCase() || "";

    if (!orderId || !reference) {
      throw new HttpsError("invalid-argument", "orderId and reference are required.");
    }

    const orderRef = db.collection("customer_order").doc(orderId);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      throw new HttpsError("not-found", "Shipment order not found.");
    }

    const order = orderSnap.data() || {};
    const orderQuoteTotal = Number(order.quoteTotal || order.quotationBreakdown?.total || 0);
    const existingReference = (order.paymentReference || "").toString().trim();

    if (existingReference && existingReference === reference && order.paymentStatus === "paid") {
      return {
        ok: true,
        verified: true,
        message: "Payment was already verified earlier.",
        orderId,
        reference,
      };
    }

    const response = await fetch(`${PAYSTACK_VERIFY_URL}/${encodeURIComponent(reference)}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      throw new HttpsError(
        "failed-precondition",
        payload?.message || `Paystack verification request failed with status ${response.status}.`,
      );
    }

    const transaction = payload?.data;

    if (!payload?.status || !transaction) {
      throw new HttpsError("failed-precondition", payload?.message || "Payment could not be verified.");
    }

    if ((transaction.status || "").toLowerCase() !== "success") {
      throw new HttpsError("failed-precondition", "Payment has not been completed successfully.");
    }

    const amountPaid = Number(transaction.amount || 0) / 100;
    if (orderQuoteTotal > 0 && amountPaid + 0.0001 < orderQuoteTotal) {
      throw new HttpsError("failed-precondition", "Verified payment amount is less than the invoice total.");
    }

    const paymentDate = transaction.paid_at || transaction.created_at || new Date().toISOString();
    const paymentStatus = normalizePaymentStatus(amountPaid, orderQuoteTotal);

    await orderRef.update({
      amountPaid,
      balanceDue: Math.max(orderQuoteTotal - amountPaid, 0),
      paymentStatus,
      paymentGateway: "paystack",
      paymentReference: reference,
      paymentDate,
      paymentVerifiedAt: FieldValue.serverTimestamp(),
      paymentSubmittedAt: FieldValue.serverTimestamp(),
      paymentSubmittedBy: customerUid || customerEmail || order.customerUid || order.customerEmail || "",
      paymentVerificationPayload: {
        gatewayResponse: transaction.gateway_response || "",
        channel: transaction.channel || "",
        paidAt: transaction.paid_at || "",
        customerEmail: transaction.customer?.email || "",
      },
      updatedAt: FieldValue.serverTimestamp(),
    });

    await db.collection("notifications").add({
      title: "Paystack payment verified",
      message: `${order.customerName || "Customer"} completed payment for ${order.orderNo || orderId}.`,
      targetRole: "accounts",
      type: "payment_verified",
      orderNo: order.orderNo || "",
      quotationNo: order.quotationNo || "",
      targetUid: "",
      targetEmail: "",
      customerUid: customerUid || order.customerUid || "",
      customerEmail: customerEmail || order.customerEmail || "",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return {
      ok: true,
      verified: true,
      orderId,
      reference,
      amountPaid,
      paymentStatus,
      paymentDate,
    };
  } catch (error) {
    if (error instanceof HttpsError) {
      throw error;
    }

    console.error("verifyPaystackPayment failed", {
      message: error?.message || "Unknown error",
      stack: error?.stack || "",
    });
    throw new HttpsError("internal", error?.message || "Payment verification failed unexpectedly.");
  }
});
