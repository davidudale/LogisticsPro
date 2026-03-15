import React, { useState } from "react";
import { addDoc, collection, getFirestore, serverTimestamp } from "firebase/firestore";
import { Activity, ClipboardList, Crosshair, LoaderCircle, MapPin, Package, Plus } from "lucide-react";
import { toast } from "react-toastify";
import { app } from "../Auth/firebase";
import { useAuth } from "../Auth/AuthContext.jsx";
import NavBar from "../Basics/NavBar.jsx";
import Sidebar from "../Basics/Sidebar.jsx";
import { nigeriaLocations, nigeriaStates } from "../../data/nigeriaLocations.js";
import { useGeolocation } from "../../hooks/useGeolocation.js";

const db = getFirestore(app);
const createQuotationNumber = () => `QT-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`;
const initialOrderForm = {
  quotationNo: "",
  customerName: "",
  originState: "",
  originLga: "",
  originAddress: "",
  destinationState: "",
  destinationLga: "",
  destinationAddress: "",
  cargo: "",
  weight: "",
  length: "",
  width: "",
  height: "",
  itemQuantity: 1,
  originCoordinates: null,
  destinationCoordinates: null,
};

const CustomersDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [activeGeoTarget, setActiveGeoTarget] = useState("");
  const [orderForm, setOrderForm] = useState(initialOrderForm);
  const { user } = useAuth();
  const {
    currentPosition,
    error: geolocationError,
    getCurrentPosition,
    isFetching: isFetchingLocation,
    isSupported: isGeolocationSupported,
    permissionState,
    resetError: resetGeolocationError,
  } = useGeolocation();
  const stats = [
    { label: "Open Orders", value: "8", icon: ClipboardList },
    { label: "In Transit", value: "5", icon: MapPin },
    { label: "Delivered", value: "37", icon: Package },
    { label: "Satisfaction", value: "4.9/5", icon: Activity },
  ];

  const handleOrderFieldChange = (name, value) => {
    setOrderForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "originState" ? { originLga: "" } : {}),
      ...(name === "destinationState" ? { destinationLga: "" } : {}),
    }));
  };

  const updateItemQuantity = (delta) => {
    setOrderForm((prev) => {
      const currentQuantity = Number.isFinite(Number(prev.itemQuantity))
        ? Number(prev.itemQuantity)
        : 1;

      return {
        ...prev,
        itemQuantity: Math.max(1, currentQuantity + delta),
      };
    });
  };

  const formatCoordinates = (coordinates) => {
    if (!coordinates?.latitude || !coordinates?.longitude) {
      return "Coordinates not captured yet.";
    }

    return `${coordinates.latitude.toFixed(6)}, ${coordinates.longitude.toFixed(6)}`;
  };

  const applyCurrentLocation = async (target) => {
    setActiveGeoTarget(target);
    resetGeolocationError();

    const position = await getCurrentPosition();
    if (!position) {
      const message = geolocationError?.message || "Unable to capture your current location.";
      toast.error(message);
      setActiveGeoTarget("");
      return;
    }

    const coordinates = {
      latitude: position.latitude,
      longitude: position.longitude,
      accuracy: position.accuracy,
      capturedAt: position.timestamp || Date.now(),
    };

    setOrderForm((prev) => ({
      ...prev,
      [target === "origin" ? "originCoordinates" : "destinationCoordinates"]: coordinates,
      [target === "origin" ? "originAddress" : "destinationAddress"]:
        prev[target === "origin" ? "originAddress" : "destinationAddress"]
        || `Current location (${position.latitude.toFixed(6)}, ${position.longitude.toFixed(6)})`,
    }));

    toast.success(
      `${target === "origin" ? "Pickup" : "Destination"} coordinates captured successfully.`,
    );
    setActiveGeoTarget("");
  };

  const handleCreateOrder = async (event) => {
    event.preventDefault();

    if (
      !orderForm.quotationNo
      || !orderForm.customerName
      || !orderForm.originState
      || !orderForm.originLga
      || !orderForm.originAddress
      || !orderForm.destinationState
      || !orderForm.destinationLga
      || !orderForm.destinationAddress
      || !orderForm.cargo
      || !orderForm.weight
      || !orderForm.length
      || !orderForm.width
      || !orderForm.height
    ) {
      toast.info("Complete all required order details before submitting.");
      return;
    }

    setIsSubmittingOrder(true);
    try {
      const quotationNo = createQuotationNumber();
      const resolvedQuotationNo = orderForm.quotationNo.trim() || quotationNo;
        await addDoc(collection(db, "Quotations"), {
          quotationNo: resolvedQuotationNo,
          customerName: orderForm.customerName.trim(),
          origin: {
            state: orderForm.originState.trim(),
            lga: orderForm.originLga.trim(),
            address: orderForm.originAddress.trim(),
            country: "Nigeria",
            coordinates: orderForm.originCoordinates,
          },
          destination: {
            state: orderForm.destinationState.trim(),
            lga: orderForm.destinationLga.trim(),
            address: orderForm.destinationAddress.trim(),
            country: "Nigeria",
            coordinates: orderForm.destinationCoordinates,
          },
        cargo: orderForm.cargo.trim(),
        weight: orderForm.weight.trim(),
        dimensions: {
          lengthCm: orderForm.length.trim(),
          widthCm: orderForm.width.trim(),
          heightCm: orderForm.height.trim(),
        },
        itemQuantity: orderForm.itemQuantity,
        deliveryAddress: [
          orderForm.destinationAddress.trim(),
          orderForm.destinationLga.trim(),
          orderForm.destinationState.trim(),
          "Nigeria",
        ].filter(Boolean).join(", "),
        status: "Pending",
        customerUid: user?.uid || "",
        customerEmail: user?.email || "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast.success(`Quotation request submitted: ${resolvedQuotationNo}`);
      setOrderForm(initialOrderForm);
      setIsCreateOrderOpen(false);
    } catch (error) {
      toast.error(error?.message || "Failed to submit quotation request.");
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const originLgas = orderForm.originState ? nigeriaLocations[orderForm.originState] || [] : [];
  const destinationLgas = orderForm.destinationState ? nigeriaLocations[orderForm.destinationState] || [] : [];

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-200">
      <NavBar
        title="Customer Dashboard"
        onToggleSidebar={() => setSidebarOpen(true)}
      />
      <div className="flex flex-1 min-h-screen">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 ml-16 lg:ml-64 p-4 lg:p-8 min-h-[calc(100vh-65px)] overflow-y-auto bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-900/50 via-slate-950 to-slate-950">
          <div className="max-w-7xl mx-auto">
            <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">Shipment Visibility</h1>
                <p className="text-slate-400 text-sm mt-1">
                  Track orders, delivery milestones, and customer service updates.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setOrderForm((prev) => ({
                    ...prev,
                    quotationNo: createQuotationNumber(),
                    customerName: prev.customerName || user?.displayName || "",
                  }));
                  setIsCreateOrderOpen(true);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-700"
              >
                <Plus size={16} />
                Get Quotation
              </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
              {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={stat.label}
                    className="group p-6 rounded-2xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900/60 transition-all"
                  >
                    <div className="p-2 w-fit bg-slate-950 rounded-lg border border-slate-800 group-hover:border-orange-500/50 transition-colors">
                      <Icon className="text-orange-500" size={18} />
                    </div>
                    <p className="text-slate-400 text-xs font-medium uppercase tracking-tight mt-4">
                      {stat.label}
                    </p>
                    <p className="text-3xl font-bold text-white mt-1">{stat.value}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </div>

      {isCreateOrderOpen ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Get Quotation</h3>
              <button
                type="button"
                onClick={() => setIsCreateOrderOpen(false)}
                className="rounded-md border border-slate-600 px-3 py-1 text-xs text-slate-200 hover:bg-slate-800"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="mt-4 grid gap-3 sm:grid-cols-2">
              <input
                value={orderForm.quotationNo}
                readOnly
                className="rounded-lg border border-slate-700 bg-slate-950/40 px-3 py-2 text-sm text-slate-300 outline-none"
                placeholder="Quotation Number"
              />
              <input
                value={orderForm.customerName}
                onChange={(event) => handleOrderFieldChange("customerName", event.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-orange-500"
                placeholder="Customer Name"
                required
              />
              <div className="sm:col-span-2 rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Origin</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Capture your current pickup coordinates to help admin verify the route faster.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => applyCurrentLocation("origin")}
                    disabled={!isGeolocationSupported || isFetchingLocation}
                    className="inline-flex items-center gap-2 self-start rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-orange-500/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isFetchingLocation && activeGeoTarget === "origin" ? (
                      <LoaderCircle size={14} className="animate-spin" />
                    ) : (
                      <Crosshair size={14} />
                    )}
                    Use current location
                  </button>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <select
                    value={orderForm.originState}
                    onChange={(event) => handleOrderFieldChange("originState", event.target.value)}
                    className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-orange-500"
                    required
                  >
                    <option value="">Select origin state</option>
                    {nigeriaStates.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                  <select
                    value={orderForm.originLga}
                    onChange={(event) => handleOrderFieldChange("originLga", event.target.value)}
                    disabled={!orderForm.originState}
                    className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-orange-500 disabled:cursor-not-allowed disabled:opacity-60"
                    required
                  >
                    <option value="">{orderForm.originState ? "Select origin LGA" : "Select state first"}</option>
                    {originLgas.map((lga) => (
                      <option key={lga} value={lga}>
                        {lga}
                      </option>
                    ))}
                  </select>
                  <input
                    value={orderForm.originAddress}
                    onChange={(event) => handleOrderFieldChange("originAddress", event.target.value)}
                    className="sm:col-span-2 rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-orange-500"
                    placeholder="Origin address"
                    required
                  />
                </div>
                <div className="mt-3 rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2 text-xs text-slate-400">
                  <p className="font-semibold uppercase tracking-[0.12em] text-slate-500">Captured pickup coordinates</p>
                  <p className="mt-1 text-slate-300">{formatCoordinates(orderForm.originCoordinates)}</p>
                </div>
              </div>
              <div className="sm:col-span-2 rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Destination</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Use this if you are requesting delivery to your present location.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => applyCurrentLocation("destination")}
                    disabled={!isGeolocationSupported || isFetchingLocation}
                    className="inline-flex items-center gap-2 self-start rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-orange-500/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isFetchingLocation && activeGeoTarget === "destination" ? (
                      <LoaderCircle size={14} className="animate-spin" />
                    ) : (
                      <Crosshair size={14} />
                    )}
                    Use current location
                  </button>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <select
                    value={orderForm.destinationState}
                    onChange={(event) => handleOrderFieldChange("destinationState", event.target.value)}
                    className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-orange-500"
                    required
                  >
                    <option value="">Select destination state</option>
                    {nigeriaStates.map((state) => (
                      <option key={state} value={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                  <select
                    value={orderForm.destinationLga}
                    onChange={(event) => handleOrderFieldChange("destinationLga", event.target.value)}
                    disabled={!orderForm.destinationState}
                    className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-orange-500 disabled:cursor-not-allowed disabled:opacity-60"
                    required
                  >
                    <option value="">{orderForm.destinationState ? "Select destination LGA" : "Select state first"}</option>
                    {destinationLgas.map((lga) => (
                      <option key={lga} value={lga}>
                        {lga}
                      </option>
                    ))}
                  </select>
                  <input
                    value={orderForm.destinationAddress}
                    onChange={(event) => handleOrderFieldChange("destinationAddress", event.target.value)}
                    className="sm:col-span-2 rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-orange-500"
                    placeholder="Destination address"
                    required
                  />
                </div>
                <div className="mt-3 rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2 text-xs text-slate-400">
                  <p className="font-semibold uppercase tracking-[0.12em] text-slate-500">Captured destination coordinates</p>
                  <p className="mt-1 text-slate-300">{formatCoordinates(orderForm.destinationCoordinates)}</p>
                </div>
              </div>
              <input
                value={orderForm.cargo}
                onChange={(event) => handleOrderFieldChange("cargo", event.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-orange-500"
                placeholder="Cargo"
                required
              />
              <input
                value={orderForm.weight}
                onChange={(event) => handleOrderFieldChange("weight", event.target.value)}
                className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-orange-500"
                placeholder="Weight"
                required
              />
              <div className="sm:col-span-2 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)_minmax(120px,160px)] lg:items-end">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-white">Item Dimensions</p>
                  <input
                    value={orderForm.length}
                    onChange={(event) => handleOrderFieldChange("length", event.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-orange-500"
                    placeholder="Length (cm)"
                    required
                  />
                </div>
                <span className="hidden pb-2 text-lg font-bold text-white lg:block">X</span>
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-transparent">Item Dimensions</p>
                  <input
                    value={orderForm.width}
                    onChange={(event) => handleOrderFieldChange("width", event.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-orange-500"
                    placeholder="Width (cm)"
                    required
                  />
                </div>
                <span className="hidden pb-2 text-lg font-bold text-white lg:block">X</span>
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-transparent">Item Dimensions</p>
                  <input
                    value={orderForm.height}
                    onChange={(event) => handleOrderFieldChange("height", event.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm outline-none focus:border-orange-500"
                    placeholder="Height (cm)"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-white">Item Quantity</p>
                  <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2">
                    <button
                      type="button"
                      onClick={() => updateItemQuantity(-1)}
                      className="text-lg font-bold text-white"
                    >
                      -
                    </button>
                    <span className="text-sm font-semibold text-white">{orderForm.itemQuantity}</span>
                    <button
                      type="button"
                      onClick={() => updateItemQuantity(1)}
                      className="text-lg font-bold text-white"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
              <button
                type="submit"
                disabled={isSubmittingOrder}
                className="sm:col-span-2 rounded-lg bg-orange-600 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-70"
              >
                {isSubmittingOrder ? "Submitting..." : "Get Quotation"}
              </button>
              {!isGeolocationSupported ? (
                <p className="sm:col-span-2 text-xs text-amber-300">
                  Geolocation is not supported in this browser, so coordinates cannot be captured automatically.
                </p>
              ) : permissionState === "denied" ? (
                <p className="sm:col-span-2 text-xs text-amber-300">
                  Location access is blocked in your browser. Enable it if you want pickup or destination coordinates attached to this quotation.
                </p>
              ) : null}
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default CustomersDashboard;
