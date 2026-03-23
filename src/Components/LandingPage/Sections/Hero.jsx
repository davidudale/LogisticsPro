import React, { useMemo, useState } from "react";
import { ArrowRight, LoaderCircle, Search } from "lucide-react";
import { getAuth } from "firebase/auth";
import { collection, getDocs, getFirestore } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { app } from "../../Auth/firebase.js";

const db = getFirestore(app);
const auth = getAuth(app);

const COLLECTIONS = {
  orders: "customer_order",
  quotations: "Quotations",
};

const getTimestampValue = (value) => {
  if (!value) return 0;
  if (typeof value?.toDate === "function") return value.toDate().getTime();
  if (typeof value?.seconds === "number") return value.seconds * 1000;
  const parsedValue = new Date(value).getTime();
  return Number.isNaN(parsedValue) ? 0 : parsedValue;
};

const formatLocation = (location) => {
  if (!location || typeof location !== "object") return "";
  return [location.address, location.lga, location.state, location.country].filter(Boolean).join(", ");
};

const mapOrderRecord = (item) => {
  const data = item.data();
  return {
    id: item.id,
    type: "Order",
    trackingId: data.trackingId || "",
    orderNo: data.orderNo || "",
    quotationNo: data.quotationNo || "",
    customerName: data.customerName || data.customer || "",
    cargo: data.cargo || "",
    deliveryAddress: data.deliveryAddress || formatLocation(data.destination) || "",
    status: data.status || "Pending",
    updatedAt: data.updatedAt || data.createdAt || null,
  };
};

const mapQuotationRecord = (item) => {
  const data = item.data();
  return {
    id: item.id,
    type: "Quotation",
    trackingId: data.trackingId || "",
    quotationNo: data.quotationNo || "",
    orderNo: data.orderNo || "",
    customerName: data.customerName || "",
    cargo: data.cargo || "",
    deliveryAddress: formatLocation(data.destination) || "",
    status: data.status || "Pending",
    updatedAt: data.updatedAt || data.createdAt || null,
  };
};

const Hero = () => {
  const navigate = useNavigate();
  const [trackingLookup, setTrackingLookup] = useState("");
  const [trackingResult, setTrackingResult] = useState(null);
  const [trackingError, setTrackingError] = useState("");
  const [trackingLoading, setTrackingLoading] = useState(false);

  const trackingHint = useMemo(() => {
    if (trackingResult || trackingError || trackingLoading) {
      return null;
    }

    return "Track by tracking ID, order number, or quotation number.";
  }, [trackingError, trackingLoading, trackingResult]);

  const handleTrackingLookup = async (event) => {
    event.preventDefault();

    const normalizedValue = trackingLookup.trim().toLowerCase();
    if (!normalizedValue) {
      setTrackingError("Enter a tracking ID, order number, or quotation number.");
      setTrackingResult(null);
      return;
    }

    if (!auth.currentUser) {
      setTrackingError("Sign in to track shipments and quotations.");
      setTrackingResult(null);
      navigate("/login");
      return;
    }

    setTrackingLoading(true);
    setTrackingError("");
    setTrackingResult(null);

    try {
      const [ordersSnapshot, quotationsSnapshot] = await Promise.all([
        getDocs(collection(db, COLLECTIONS.orders)),
        getDocs(collection(db, COLLECTIONS.quotations)),
      ]);

      const orders = ordersSnapshot.docs.map(mapOrderRecord);
      const quotations = quotationsSnapshot.docs.map(mapQuotationRecord);

      const matchingOrder = orders.find((order) =>
        [order.trackingId, order.orderNo, order.quotationNo]
          .filter(Boolean)
          .some((value) => value.toString().trim().toLowerCase() === normalizedValue),
      );

      if (matchingOrder) {
        setTrackingResult(matchingOrder);
        return;
      }

      const matchingQuotation = quotations.find((quotation) =>
        [quotation.trackingId, quotation.quotationNo, quotation.orderNo]
          .filter(Boolean)
          .some((value) => value.toString().trim().toLowerCase() === normalizedValue),
      );

      if (matchingQuotation) {
        setTrackingResult(matchingQuotation);
        return;
      }

      setTrackingError("No shipment or quotation matched that tracking reference yet.");
    } catch (error) {
      setTrackingError(error?.message || "Tracking lookup is unavailable right now.");
    } finally {
      setTrackingLoading(false);
    }
  };

  const resultTimestamp = trackingResult
    ? new Intl.DateTimeFormat("en-NG", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(getTimestampValue(trackingResult.updatedAt)))
    : "";

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24 pb-16 sm:pb-20">
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1695222833131-54ee679ae8e5?q=80&w=841&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt="Logistics operations center"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/40 to-slate-950" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block px-4 py-1.5 mb-6 border border-orange-500/30 bg-orange-500/10 rounded-full">
            <span className="text-orange-400 text-xs font-bold uppercase tracking-[0.2em]">
              Logistics Intellect
            </span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-6xl font-arial font-bold leading-[1.02] sm:mb-8 tracking-tight text-white">
            Orchestrate deliveries with <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-orange-600 to-amber-400">
              real-time control.
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg lg:text-xl text-slate-300 mb-9 mt-[-5px] sm:mb-10 font-light leading-relaxed">
            LogisticsPro unifies fleet tracking, dispatch, warehouse flow, and
            performance analytics into one operational command center.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <form
              className="w-full sm:w-auto flex flex-col sm:flex-row items-stretch gap-2 sm:gap-3"
              onSubmit={handleTrackingLookup}
            >
              <label className="relative">
                <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={trackingLookup}
                  onChange={(event) => setTrackingLookup(event.target.value)}
                  placeholder="Enter tracking ID"
                  aria-label="Tracking ID"
                  className="w-full sm:w-72 px-5 pl-11 py-4 sm:py-5 rounded-xl border border-slate-700 bg-white/10 backdrop-blur-sm text-white placeholder:text-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/60 focus:border-orange-500/60"
                />
              </label>
              <button
                className="w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 bg-orange-600 hover:bg-orange-700 text-white font-bold uppercase tracking-[0.16em] text-xs sm:text-sm transition-all hover:shadow-[0_0_20px_rgba(234,88,12,0.4)] rounded-xl disabled:opacity-70"
                type="submit"
                disabled={trackingLoading}
              >
                {trackingLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <LoaderCircle size={14} className="animate-spin" />
                    Searching
                  </span>
                ) : (
                  "Track"
                )}
              </button>
            </form>
            <button
              className="w-full bg-slate-800 sm:w-auto px-8 sm:px-10 py-4 sm:py-5 border border-slate-700 hover:border-slate-500 font-bold uppercase tracking-[0.16em] text-xs text-white sm:text-sm transition-all rounded-xl"
              type="button"
              onClick={() => navigate("/login")}
            >
              Request a Demo
            </button>
          </div>

          <div className="mx-auto mt-4 max-w-3xl">
            {trackingHint ? (
              <p className="text-sm text-slate-400">{trackingHint}</p>
            ) : null}

            {trackingError ? (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-700 bg-slate-950/50 px-5 py-4 text-sm text-slate-300">
                {trackingError}
              </div>
            ) : null}

            {trackingResult ? (
              <div className="mt-4 rounded-3xl border border-slate-700/80 bg-slate-950/65 p-5 text-left backdrop-blur-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Tracking Match</p>
                    <h2 className="mt-2 text-xl font-semibold text-white">
                      {trackingResult.trackingId || trackingResult.orderNo || trackingResult.quotationNo || trackingResult.id}
                    </h2>
                    <p className="mt-1 text-sm text-slate-400">
                      {trackingResult.customerName || trackingResult.cargo || `${trackingResult.type} record`}
                    </p>
                  </div>
                  <span className="inline-flex rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-orange-200">
                    {trackingResult.type}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                    <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Status</p>
                    <p className="mt-2 text-sm font-semibold text-white">{trackingResult.status}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                    <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Reference</p>
                    <p className="mt-2 text-sm font-semibold text-white">
                      {trackingResult.orderNo || trackingResult.quotationNo || "Not available"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                    <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Last Updated</p>
                    <p className="mt-2 text-sm font-semibold text-white">{resultTimestamp || "Not available"}</p>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                  <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Shipment Snapshot</p>
                  <p className="mt-2 text-sm text-slate-300">
                    {trackingResult.deliveryAddress || trackingResult.cargo || "Shipment details available after sign in."}
                  </p>
                </div>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-slate-400">
                    Sign in to see the full shipment timeline, quotation details, and updates.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-700"
                  >
                    Sign In To Continue
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-10 sm:mt-12 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 max-w-4xl mx-auto">
          {[
            { title: "On-time rate", value: "98.7%" },
            { title: "Avg. route savings", value: "21%" },
            { title: "Live dispatch", value: "24/7" },
          ].map((metric) => (
            <div
              key={metric.title}
              className="rounded-2xl border border-slate-700/70 bg-slate-950/55 backdrop-blur-sm px-4 py-4"
            >
              <p className="text-xl sm:text-2xl font-syncopate font-bold text-orange-400">{metric.value}</p>
              <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-slate-300 mt-1">{metric.title}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Hero;
