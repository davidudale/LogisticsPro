import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { ClipboardList } from "lucide-react";
import { toast } from "react-toastify";
import { app } from "../../Auth/firebase";
import NavBar from "../../Basics/NavBar.jsx";
import Sidebar from "../../Basics/Sidebar.jsx";

const db = getFirestore(app);

const formatLocation = (location) => {
  if (!location || typeof location !== "object") return "Not available";
  return [location.address, location.lga, location.state, location.country].filter(Boolean).join(", ");
};

const formatDimensions = (dimensions) => {
  if (!dimensions || typeof dimensions !== "object") return "Not specified";
  return [dimensions.lengthCm, dimensions.widthCm, dimensions.heightCm].every(Boolean)
    ? `${dimensions.lengthCm} x ${dimensions.widthCm} x ${dimensions.heightCm} cm`
    : "Not specified";
};

const formatCoordinates = (coordinates) => {
  if (!coordinates || typeof coordinates !== "object") return "Not captured";
  const { latitude, longitude, accuracy } = coordinates;
  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return "Not captured";
  }

  const baseCoordinates = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
  if (typeof accuracy !== "number") {
    return baseCoordinates;
  }

  return `${baseCoordinates} (${Math.round(accuracy)}m accuracy)`;
};

const roundCurrency = (value) => Math.round(Number(value || 0));

const parseNumericValue = (value) => {
  const matched = value?.toString().match(/[\d.]+/);
  return matched ? Number(matched[0]) : 0;
};

const getVolumetricWeightKg = (dimensions, quantity = 1) => {
  const length = parseNumericValue(dimensions?.lengthCm);
  const width = parseNumericValue(dimensions?.widthCm);
  const height = parseNumericValue(dimensions?.heightCm);
  if (!length || !width || !height) {
    return 0;
  }

  return ((length * width * height) / 5000) * Math.max(1, Number(quantity) || 1);
};

// Uses saved coordinates when present so the admin starts from a route-aware quotation draft.
const calculateDistanceKm = (originCoordinates, destinationCoordinates) => {
  if (
    typeof originCoordinates?.latitude !== "number"
    || typeof originCoordinates?.longitude !== "number"
    || typeof destinationCoordinates?.latitude !== "number"
    || typeof destinationCoordinates?.longitude !== "number"
  ) {
    return 0;
  }

  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const latitudeDelta = toRadians(destinationCoordinates.latitude - originCoordinates.latitude);
  const longitudeDelta = toRadians(destinationCoordinates.longitude - originCoordinates.longitude);
  const latitudeA = toRadians(originCoordinates.latitude);
  const latitudeB = toRadians(destinationCoordinates.latitude);

  const a = (
    Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(latitudeA) * Math.cos(latitudeB) * Math.sin(longitudeDelta / 2) ** 2
  );
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
};

// Pre-fills pricing inputs from the customer request so admins only adjust what is route- or market-specific.
const buildQuoteDraft = (quotation) => {
  const directDistance = calculateDistanceKm(
    quotation.origin?.coordinates,
    quotation.destination?.coordinates,
  );
  const fallbackDistance = directDistance > 0 ? Math.max(15, directDistance * 1.18) : 120;
  const actualWeightKg = parseNumericValue(quotation.weight);
  const volumetricWeightKg = getVolumetricWeightKg(quotation.dimensions, quotation.itemQuantity);
  const chargeableWeightKg = Math.max(actualWeightKg, volumetricWeightKg, 1);

  return {
    distanceKm: roundCurrency(fallbackDistance),
    vehicleCapacityKg: Math.max(1000, Math.ceil(chargeableWeightKg / 500) * 1000),
    actualWeightKg: actualWeightKg || "",
    volumetricWeightKg: roundCurrency(volumetricWeightKg),
    fuelPricePerLitre: 1250,
    fuelEfficiencyKmPerLitre: 4.5,
    tollFees: directDistance > 0 ? roundCurrency(fallbackDistance * 12) : 2500,
    routeType: directDistance > 350 ? "rural" : "urban",
    deliveryUrgency: "standard",
    handlingRequirement: "standard",
    insuranceEnabled: false,
    insuranceRatePercent: 1.25,
    shipmentValue: 0,
    driverCost: roundCurrency(fallbackDistance * 45),
    maintenanceCostPerKm: 38,
    peakAdjustmentPercent: 0,
    additionalServices: "",
    additionalServicesCost: 0,
    customsClearanceCost: 0,
    warehousingCost: 0,
    packingCost: 0,
  };
};

// Central quotation calculator used by the confirmation modal to keep all cost drivers in one place.
const calculateQuoteBreakdown = (draft) => {
  const distanceKm = Number(draft.distanceKm) || 0;
  const chargeableWeightKg = Math.max(
    Number(draft.actualWeightKg) || 0,
    Number(draft.volumetricWeightKg) || 0,
    1,
  );
  const routeMultiplier = {
    urban: 1,
    rural: 1.12,
    international: 1.35,
  }[draft.routeType] || 1;
  const urgencyMultiplier = {
    economy: 0.92,
    standard: 1,
    express: 1.28,
  }[draft.deliveryUrgency] || 1;
  const handlingMultiplier = {
    standard: 1,
    fragile: 1.08,
    hazardous: 1.2,
    oversized: 1.14,
  }[draft.handlingRequirement] || 1;

  const baseTransport = distanceKm * 155 * routeMultiplier;
  const capacityCharge = (Number(draft.vehicleCapacityKg) || 0) * 0.12;
  const weightCharge = chargeableWeightKg * 48;
  const fuelCost = ((distanceKm / Math.max(Number(draft.fuelEfficiencyKmPerLitre) || 1, 1))
    * (Number(draft.fuelPricePerLitre) || 0));
  const tollFees = Number(draft.tollFees) || 0;
  const handlingCost = (baseTransport + weightCharge) * (handlingMultiplier - 1);
  const urgencyCost = (baseTransport + weightCharge) * (urgencyMultiplier - 1);
  const driverCost = Number(draft.driverCost) || 0;
  const maintenanceCost = distanceKm * (Number(draft.maintenanceCostPerKm) || 0);
  const insuranceCost = draft.insuranceEnabled
    ? (Number(draft.shipmentValue) || 0) * ((Number(draft.insuranceRatePercent) || 0) / 100)
    : 0;
  const extraServicesCost = (
    (Number(draft.additionalServicesCost) || 0)
    + (Number(draft.customsClearanceCost) || 0)
    + (Number(draft.warehousingCost) || 0)
    + (Number(draft.packingCost) || 0)
  );

  const subtotal = (
    baseTransport
    + capacityCharge
    + weightCharge
    + fuelCost
    + tollFees
    + handlingCost
    + urgencyCost
    + driverCost
    + maintenanceCost
    + insuranceCost
    + extraServicesCost
  );
  const peakAdjustment = subtotal * ((Number(draft.peakAdjustmentPercent) || 0) / 100);
  const total = subtotal + peakAdjustment;

  return {
    chargeableWeightKg: roundCurrency(chargeableWeightKg),
    baseTransport: roundCurrency(baseTransport),
    capacityCharge: roundCurrency(capacityCharge),
    weightCharge: roundCurrency(weightCharge),
    fuelCost: roundCurrency(fuelCost),
    tollFees: roundCurrency(tollFees),
    handlingCost: roundCurrency(handlingCost),
    urgencyCost: roundCurrency(urgencyCost),
    insuranceCost: roundCurrency(insuranceCost),
    driverCost: roundCurrency(driverCost),
    maintenanceCost: roundCurrency(maintenanceCost),
    additionalServicesCost: roundCurrency(extraServicesCost),
    peakAdjustment: roundCurrency(peakAdjustment),
    subtotal: roundCurrency(subtotal),
    total: roundCurrency(total),
  };
};

const PendingQuotations = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [busyRow, setBusyRow] = useState("");
  const [editingQuotationId, setEditingQuotationId] = useState("");
  const [editQuotation, setEditQuotation] = useState(null);
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [quoteDraft, setQuoteDraft] = useState(null);

  const loadQuotations = useCallback(async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, "Quotations"));
      setQuotations(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
    } catch (error) {
      toast.error(error?.message || "Failed to load quotations.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQuotations();
  }, [loadQuotations]);

  // Mirrors the selected row into editable local state so inline edits stay isolated until saved.
  const startEditing = (quotation) => {
    setEditingQuotationId(quotation.id);
    setEditQuotation({
      quotationNo: quotation.quotationNo || "",
      customerName: quotation.customerName || "",
      customerEmail: quotation.customerEmail || "",
      referenceNo: quotation.referenceNo || "",
      cargo: quotation.cargo || "",
      weight: quotation.weight || "",
      itemQuantity: quotation.itemQuantity || 1,
      status: quotation.status || "Pending",
      originAddress: quotation.origin?.address || "",
      originLga: quotation.origin?.lga || "",
      originState: quotation.origin?.state || "",
      destinationAddress: quotation.destination?.address || "",
      destinationLga: quotation.destination?.lga || "",
      destinationState: quotation.destination?.state || "",
      lengthCm: quotation.dimensions?.lengthCm || "",
      widthCm: quotation.dimensions?.widthCm || "",
      heightCm: quotation.dimensions?.heightCm || "",
    });
  };

  const cancelEditing = () => {
    setEditingQuotationId("");
    setEditQuotation(null);
  };

  const saveQuotationEdit = async (quotationId) => {
    if (
      !editQuotation?.quotationNo
      || !editQuotation.customerName
      || !editQuotation.originAddress
      || !editQuotation.destinationAddress
      || !editQuotation.cargo
      || !editQuotation.weight
    ) {
      toast.info("Complete the required quotation fields before saving.");
      return;
    }

    setBusyRow(quotationId);
    try {
      await updateDoc(doc(db, "Quotations", quotationId), {
        quotationNo: editQuotation.quotationNo.trim(),
        customerName: editQuotation.customerName.trim(),
        customerEmail: editQuotation.customerEmail.trim().toLowerCase(),
        referenceNo: editQuotation.referenceNo.trim(),
        cargo: editQuotation.cargo.trim(),
        weight: editQuotation.weight.trim(),
        itemQuantity: Number(editQuotation.itemQuantity) || 1,
        status: editQuotation.status.trim() || "Pending",
        origin: {
          ...(quotations.find((item) => item.id === quotationId)?.origin || {}),
          address: editQuotation.originAddress.trim(),
          lga: editQuotation.originLga.trim(),
          state: editQuotation.originState.trim(),
          country: "Nigeria",
        },
        destination: {
          ...(quotations.find((item) => item.id === quotationId)?.destination || {}),
          address: editQuotation.destinationAddress.trim(),
          lga: editQuotation.destinationLga.trim(),
          state: editQuotation.destinationState.trim(),
          country: "Nigeria",
        },
        dimensions: {
          lengthCm: editQuotation.lengthCm.trim(),
          widthCm: editQuotation.widthCm.trim(),
          heightCm: editQuotation.heightCm.trim(),
        },
        deliveryAddress: [
          editQuotation.destinationAddress.trim(),
          editQuotation.destinationLga.trim(),
          editQuotation.destinationState.trim(),
          "Nigeria",
        ].filter(Boolean).join(", "),
        updatedAt: serverTimestamp(),
      });
      cancelEditing();
      await loadQuotations();
      toast.success("Quotation updated successfully.");
    } catch (error) {
      toast.error(error?.message || "Failed to update quotation.");
    } finally {
      setBusyRow("");
    }
  };

  const deleteQuotation = async (quotationId) => {
    const targetQuotation = quotations.find((item) => item.id === quotationId);
    const shouldDelete = window.confirm(
      `Delete quotation ${targetQuotation?.quotationNo || quotationId}? This action cannot be undone.`,
    );

    if (!shouldDelete) {
      return;
    }

    setBusyRow(quotationId);
    try {
      await deleteDoc(doc(db, "Quotations", quotationId));
      if (editingQuotationId === quotationId) {
        cancelEditing();
      }
      await loadQuotations();
      toast.success("Quotation deleted.");
    } catch (error) {
      toast.error(error?.message || "Failed to delete quotation.");
    } finally {
      setBusyRow("");
    }
  };

  // The confirmation flow starts with calculated defaults, then lets admins fine-tune the final commercial terms.
  const openQuoteModal = (quotation) => {
    setSelectedQuotation(quotation);
    setQuoteDraft(buildQuoteDraft(quotation));
    setQuoteModalOpen(true);
  };

  const closeQuoteModal = () => {
    if (busyRow === "confirm-quotation") {
      return;
    }
    setQuoteModalOpen(false);
    setSelectedQuotation(null);
    setQuoteDraft(null);
  };

  const quoteBreakdown = useMemo(
    () => (quoteDraft ? calculateQuoteBreakdown(quoteDraft) : null),
    [quoteDraft],
  );

  const confirmQuotation = async () => {
    if (!selectedQuotation || !quoteDraft || !quoteBreakdown) {
      return;
    }

    setBusyRow("confirm-quotation");
    try {
      await updateDoc(doc(db, "Quotations", selectedQuotation.id), {
        status: "Quoted",
        confirmedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        pricingInputs: {
          ...quoteDraft,
        },
        quotationBreakdown: quoteBreakdown,
        quoteTotal: quoteBreakdown.total,
      });
      await loadQuotations();
      closeQuoteModal();
      toast.success("Quotation confirmed and generated successfully.");
    } catch (error) {
      toast.error(error?.message || "Failed to confirm quotation.");
    } finally {
      setBusyRow("");
    }
  };

  const filteredQuotations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return quotations;
    }

    return quotations.filter((quotation) => {
      // Search spans admin-facing identifiers plus route fields so operations can find requests quickly.
      const values = [
        quotation.quotationNo,
        quotation.referenceNo,
        quotation.customerName,
        quotation.customerEmail,
        quotation.status,
        quotation.cargo,
        quotation.weight,
        quotation.origin?.address,
        quotation.origin?.lga,
        quotation.origin?.state,
        quotation.destination?.address,
        quotation.destination?.lga,
        quotation.destination?.state,
      ];

      return values.some((value) => value?.toString().toLowerCase().includes(query));
    });
  }, [quotations, searchQuery]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-200">
      <NavBar title="Pending Quotations" onToggleSidebar={() => setSidebarOpen(true)} />
      <div className="flex flex-1 min-h-screen">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 ml-16 lg:ml-64 min-h-[calc(100vh-65px)] overflow-y-auto bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-900/50 via-slate-950 to-slate-950 p-4 lg:p-8">
          <div className="mx-auto max-w-7xl space-y-6">
            <header className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Quotations</p>
              <h1 className="mt-2 text-3xl font-bold text-white">Pending Quotation Requests</h1>
              <p className="mt-2 text-sm text-slate-400">
                Review all customer quotation submissions saved in the <span className="text-orange-400">Quotations</span> collection.
              </p>
            </header>

            <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">Search quotations</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Filter by quotation number, customer, cargo, status, or route details.
                  </p>
                </div>
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-2.5 text-sm text-slate-200 outline-none transition focus:border-orange-500 sm:max-w-sm"
                  placeholder="Search quotations..."
                  type="search"
                />
              </div>
              {loading ? (
                <p className="text-sm text-slate-400">Loading quotations...</p>
              ) : quotations.length === 0 ? (
                <p className="text-sm text-slate-400">No quotation requests yet.</p>
              ) : filteredQuotations.length === 0 ? (
                <p className="text-sm text-slate-400">
                  No quotations matched <span className="text-orange-400">{searchQuery}</span>.
                </p>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/30">
                  <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/70 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <ClipboardList size={16} className="text-orange-400" />
                      <p className="text-sm font-semibold text-white">Quotation Queue</p>
                    </div>
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">
                      {filteredQuotations.length} request{filteredQuotations.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-[1320px] w-full text-left">
                      <thead className="bg-slate-900/80">
                        <tr className="border-b border-slate-800">
                          <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Quotation</th>
                          <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Customer</th>
                          <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Origin</th>
                          <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Destination</th>
                          <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Cargo</th>
                          <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Weight</th>
                          <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Dimensions</th>
                          <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Qty</th>
                          <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Status</th>
                          <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredQuotations.map((quotation) => (
                          (() => {
                            const isEditing = editingQuotationId === quotation.id;
                            return (
                          <tr
                            key={quotation.id}
                            className="border-b border-slate-800/80 align-top transition-colors hover:bg-slate-900/40"
                          >
                            <td className="px-4 py-4">
                              {isEditing ? (
                                <div className="space-y-2">
                                  <input
                                    value={editQuotation?.quotationNo || ""}
                                    onChange={(event) => setEditQuotation((prev) => ({ ...prev, quotationNo: event.target.value }))}
                                    className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1 text-sm text-white outline-none focus:border-orange-500"
                                  />
                                  <input
                                    value={editQuotation?.referenceNo || ""}
                                    onChange={(event) => setEditQuotation((prev) => ({ ...prev, referenceNo: event.target.value }))}
                                    className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1 text-xs text-slate-300 outline-none focus:border-orange-500"
                                    placeholder="Reference"
                                  />
                                </div>
                              ) : (
                                <>
                                  <p className="text-sm font-semibold text-white">
                                    {quotation.quotationNo || "Quotation"}
                                  </p>
                                  <p className="mt-1 text-xs text-slate-500">
                                    Ref: {quotation.referenceNo || "N/A"}
                                  </p>
                                </>
                              )}
                            </td>
                            <td className="px-4 py-4">
                              {isEditing ? (
                                <div className="space-y-2">
                                  <input
                                    value={editQuotation?.customerName || ""}
                                    onChange={(event) => setEditQuotation((prev) => ({ ...prev, customerName: event.target.value }))}
                                    className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1 text-sm text-white outline-none focus:border-orange-500"
                                  />
                                  <input
                                    value={editQuotation?.customerEmail || ""}
                                    onChange={(event) => setEditQuotation((prev) => ({ ...prev, customerEmail: event.target.value }))}
                                    className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1 text-xs text-slate-300 outline-none focus:border-orange-500"
                                    placeholder="Customer email"
                                  />
                                </div>
                              ) : (
                                <>
                                  <p className="text-sm text-slate-200">
                                    {quotation.customerName || "Unknown"}
                                  </p>
                                  <p className="mt-1 text-xs text-slate-500">
                                    {quotation.customerEmail || "No email"}
                                  </p>
                                </>
                              )}
                            </td>
                            <td className="px-4 py-4">
                              {isEditing ? (
                                <div className="space-y-2">
                                  <input
                                    value={editQuotation?.originAddress || ""}
                                    onChange={(event) => setEditQuotation((prev) => ({ ...prev, originAddress: event.target.value }))}
                                    className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1 text-sm text-white outline-none focus:border-orange-500"
                                    placeholder="Origin address"
                                  />
                                  <div className="grid grid-cols-2 gap-2">
                                    <input
                                      value={editQuotation?.originLga || ""}
                                      onChange={(event) => setEditQuotation((prev) => ({ ...prev, originLga: event.target.value }))}
                                      className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1 text-xs text-slate-300 outline-none focus:border-orange-500"
                                      placeholder="LGA"
                                    />
                                    <input
                                      value={editQuotation?.originState || ""}
                                      onChange={(event) => setEditQuotation((prev) => ({ ...prev, originState: event.target.value }))}
                                      className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1 text-xs text-slate-300 outline-none focus:border-orange-500"
                                      placeholder="State"
                                    />
                                  </div>
                                  <p className="text-xs text-slate-500">
                                    {formatCoordinates(quotation.origin?.coordinates)}
                                  </p>
                                </div>
                              ) : (
                                <>
                                  <p className="max-w-[220px] text-sm leading-6 text-slate-300">
                                    {formatLocation(quotation.origin)}
                                  </p>
                                  <p className="mt-2 text-xs text-slate-500">
                                    {formatCoordinates(quotation.origin?.coordinates)}
                                  </p>
                                </>
                              )}
                            </td>
                            <td className="px-4 py-4">
                              {isEditing ? (
                                <div className="space-y-2">
                                  <input
                                    value={editQuotation?.destinationAddress || ""}
                                    onChange={(event) => setEditQuotation((prev) => ({ ...prev, destinationAddress: event.target.value }))}
                                    className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1 text-sm text-white outline-none focus:border-orange-500"
                                    placeholder="Destination address"
                                  />
                                  <div className="grid grid-cols-2 gap-2">
                                    <input
                                      value={editQuotation?.destinationLga || ""}
                                      onChange={(event) => setEditQuotation((prev) => ({ ...prev, destinationLga: event.target.value }))}
                                      className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1 text-xs text-slate-300 outline-none focus:border-orange-500"
                                      placeholder="LGA"
                                    />
                                    <input
                                      value={editQuotation?.destinationState || ""}
                                      onChange={(event) => setEditQuotation((prev) => ({ ...prev, destinationState: event.target.value }))}
                                      className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1 text-xs text-slate-300 outline-none focus:border-orange-500"
                                      placeholder="State"
                                    />
                                  </div>
                                  <p className="text-xs text-slate-500">
                                    {formatCoordinates(quotation.destination?.coordinates)}
                                  </p>
                                </div>
                              ) : (
                                <>
                                  <p className="max-w-[220px] text-sm leading-6 text-slate-300">
                                    {formatLocation(quotation.destination)}
                                  </p>
                                  <p className="mt-2 text-xs text-slate-500">
                                    {formatCoordinates(quotation.destination?.coordinates)}
                                  </p>
                                </>
                              )}
                            </td>
                            <td className="px-4 py-4 text-sm text-slate-300">
                              {isEditing ? (
                                <input
                                  value={editQuotation?.cargo || ""}
                                  onChange={(event) => setEditQuotation((prev) => ({ ...prev, cargo: event.target.value }))}
                                  className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1 text-sm text-white outline-none focus:border-orange-500"
                                />
                              ) : (
                                quotation.cargo || "Not specified"
                              )}
                            </td>
                            <td className="px-4 py-4 text-sm text-slate-300">
                              {isEditing ? (
                                <input
                                  value={editQuotation?.weight || ""}
                                  onChange={(event) => setEditQuotation((prev) => ({ ...prev, weight: event.target.value }))}
                                  className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1 text-sm text-white outline-none focus:border-orange-500"
                                />
                              ) : (
                                quotation.weight || "Not specified"
                              )}
                            </td>
                            <td className="px-4 py-4 text-sm text-slate-300">
                              {isEditing ? (
                                <div className="grid grid-cols-3 gap-2">
                                  <input
                                    value={editQuotation?.lengthCm || ""}
                                    onChange={(event) => setEditQuotation((prev) => ({ ...prev, lengthCm: event.target.value }))}
                                    className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1 text-xs text-white outline-none focus:border-orange-500"
                                    placeholder="L"
                                  />
                                  <input
                                    value={editQuotation?.widthCm || ""}
                                    onChange={(event) => setEditQuotation((prev) => ({ ...prev, widthCm: event.target.value }))}
                                    className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1 text-xs text-white outline-none focus:border-orange-500"
                                    placeholder="W"
                                  />
                                  <input
                                    value={editQuotation?.heightCm || ""}
                                    onChange={(event) => setEditQuotation((prev) => ({ ...prev, heightCm: event.target.value }))}
                                    className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1 text-xs text-white outline-none focus:border-orange-500"
                                    placeholder="H"
                                  />
                                </div>
                              ) : (
                                formatDimensions(quotation.dimensions)
                              )}
                            </td>
                            <td className="px-4 py-4 text-sm text-slate-300">
                              {isEditing ? (
                                <input
                                  type="number"
                                  min="1"
                                  value={editQuotation?.itemQuantity || 1}
                                  onChange={(event) => setEditQuotation((prev) => ({ ...prev, itemQuantity: event.target.value }))}
                                  className="w-20 rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1 text-sm text-white outline-none focus:border-orange-500"
                                />
                              ) : (
                                quotation.itemQuantity || 1
                              )}
                            </td>
                            <td className="px-4 py-4">
                              {isEditing ? (
                                <input
                                  value={editQuotation?.status || ""}
                                  onChange={(event) => setEditQuotation((prev) => ({ ...prev, status: event.target.value }))}
                                  className="w-full rounded-md border border-slate-700 bg-slate-950/70 px-2 py-1 text-sm text-white outline-none focus:border-orange-500"
                                />
                              ) : (
                                <span className="inline-flex rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-orange-300">
                                  {quotation.status || "Pending"}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex flex-col gap-2">
                                {isEditing ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => saveQuotationEdit(quotation.id)}
                                      disabled={busyRow === quotation.id}
                                      className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-70"
                                    >
                                      {busyRow === quotation.id ? "Saving..." : "Save"}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={cancelEditing}
                                      disabled={busyRow === quotation.id}
                                      className="rounded-md border border-slate-600 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800 disabled:opacity-70"
                                    >
                                      Cancel
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => startEditing(quotation)}
                                      disabled={Boolean(editingQuotationId) || busyRow === quotation.id}
                                      className="rounded-md border border-slate-600 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800 disabled:opacity-60"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => openQuoteModal(quotation)}
                                      disabled={Boolean(editingQuotationId) || busyRow === quotation.id}
                                      className="rounded-md border border-orange-500/40 px-3 py-1.5 text-xs text-orange-300 hover:bg-orange-500/10 disabled:opacity-60"
                                    >
                                      Confirm Quote
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => deleteQuotation(quotation.id)}
                                      disabled={busyRow === quotation.id}
                                      className="rounded-md border border-rose-500/40 px-3 py-1.5 text-xs text-rose-300 hover:bg-rose-500/10 disabled:opacity-60"
                                    >
                                      {busyRow === quotation.id ? "Deleting..." : "Delete"}
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                            );
                          })()
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
      {quoteModalOpen && selectedQuotation && quoteDraft && quoteBreakdown ? (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/70 p-4">
          <div className="max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Confirm quotation</p>
                <h3 className="mt-2 text-2xl font-bold text-white">
                  {selectedQuotation.quotationNo || "Quotation"}
                </h3>
                <p className="mt-1 text-sm text-slate-400">
                  Generate a final quotation using route, weight, vehicle, and service pricing inputs.
                </p>
              </div>
              <button
                type="button"
                onClick={closeQuoteModal}
                className="rounded-md border border-slate-700 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800"
              >
                Close
              </button>
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Distance (km)</span>
                  <input value={quoteDraft.distanceKm} onChange={(e) => setQuoteDraft((prev) => ({ ...prev, distanceKm: e.target.value }))} className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none focus:border-orange-500" />
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Vehicle capacity (kg)</span>
                  <input value={quoteDraft.vehicleCapacityKg} onChange={(e) => setQuoteDraft((prev) => ({ ...prev, vehicleCapacityKg: e.target.value }))} className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none focus:border-orange-500" />
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Actual weight (kg)</span>
                  <input value={quoteDraft.actualWeightKg} onChange={(e) => setQuoteDraft((prev) => ({ ...prev, actualWeightKg: e.target.value }))} className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none focus:border-orange-500" />
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Volumetric weight (kg)</span>
                  <input value={quoteDraft.volumetricWeightKg} onChange={(e) => setQuoteDraft((prev) => ({ ...prev, volumetricWeightKg: e.target.value }))} className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none focus:border-orange-500" />
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Fuel price / litre</span>
                  <input value={quoteDraft.fuelPricePerLitre} onChange={(e) => setQuoteDraft((prev) => ({ ...prev, fuelPricePerLitre: e.target.value }))} className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none focus:border-orange-500" />
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Fuel efficiency (km/l)</span>
                  <input value={quoteDraft.fuelEfficiencyKmPerLitre} onChange={(e) => setQuoteDraft((prev) => ({ ...prev, fuelEfficiencyKmPerLitre: e.target.value }))} className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none focus:border-orange-500" />
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Toll fees</span>
                  <input value={quoteDraft.tollFees} onChange={(e) => setQuoteDraft((prev) => ({ ...prev, tollFees: e.target.value }))} className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none focus:border-orange-500" />
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Driver costs</span>
                  <input value={quoteDraft.driverCost} onChange={(e) => setQuoteDraft((prev) => ({ ...prev, driverCost: e.target.value }))} className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none focus:border-orange-500" />
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Route type</span>
                  <select value={quoteDraft.routeType} onChange={(e) => setQuoteDraft((prev) => ({ ...prev, routeType: e.target.value }))} className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none focus:border-orange-500">
                    <option value="urban">Urban</option>
                    <option value="rural">Rural</option>
                    <option value="international">International</option>
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Delivery urgency</span>
                  <select value={quoteDraft.deliveryUrgency} onChange={(e) => setQuoteDraft((prev) => ({ ...prev, deliveryUrgency: e.target.value }))} className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none focus:border-orange-500">
                    <option value="economy">Economy</option>
                    <option value="standard">Standard</option>
                    <option value="express">Express</option>
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Handling requirement</span>
                  <select value={quoteDraft.handlingRequirement} onChange={(e) => setQuoteDraft((prev) => ({ ...prev, handlingRequirement: e.target.value }))} className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none focus:border-orange-500">
                    <option value="standard">Standard</option>
                    <option value="fragile">Fragile</option>
                    <option value="hazardous">Hazardous</option>
                    <option value="oversized">Oversized</option>
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Maintenance cost / km</span>
                  <input value={quoteDraft.maintenanceCostPerKm} onChange={(e) => setQuoteDraft((prev) => ({ ...prev, maintenanceCostPerKm: e.target.value }))} className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none focus:border-orange-500" />
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Peak adjustment %</span>
                  <input value={quoteDraft.peakAdjustmentPercent} onChange={(e) => setQuoteDraft((prev) => ({ ...prev, peakAdjustmentPercent: e.target.value }))} className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none focus:border-orange-500" />
                </label>
                <label className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-3 text-sm text-slate-300">
                  <input type="checkbox" checked={quoteDraft.insuranceEnabled} onChange={(e) => setQuoteDraft((prev) => ({ ...prev, insuranceEnabled: e.target.checked }))} />
                  Include insurance
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Insurance rate %</span>
                  <input value={quoteDraft.insuranceRatePercent} onChange={(e) => setQuoteDraft((prev) => ({ ...prev, insuranceRatePercent: e.target.value }))} className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none focus:border-orange-500" />
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Shipment value</span>
                  <input value={quoteDraft.shipmentValue} onChange={(e) => setQuoteDraft((prev) => ({ ...prev, shipmentValue: e.target.value }))} className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none focus:border-orange-500" />
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Packing cost</span>
                  <input value={quoteDraft.packingCost} onChange={(e) => setQuoteDraft((prev) => ({ ...prev, packingCost: e.target.value }))} className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none focus:border-orange-500" />
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Warehousing cost</span>
                  <input value={quoteDraft.warehousingCost} onChange={(e) => setQuoteDraft((prev) => ({ ...prev, warehousingCost: e.target.value }))} className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none focus:border-orange-500" />
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Customs clearance</span>
                  <input value={quoteDraft.customsClearanceCost} onChange={(e) => setQuoteDraft((prev) => ({ ...prev, customsClearanceCost: e.target.value }))} className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none focus:border-orange-500" />
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Additional services cost</span>
                  <input value={quoteDraft.additionalServicesCost} onChange={(e) => setQuoteDraft((prev) => ({ ...prev, additionalServicesCost: e.target.value }))} className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none focus:border-orange-500" />
                </label>
                <label className="sm:col-span-2 space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">Additional services notes</span>
                  <input value={quoteDraft.additionalServices} onChange={(e) => setQuoteDraft((prev) => ({ ...prev, additionalServices: e.target.value }))} className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none focus:border-orange-500" placeholder="Packing, warehousing, customs, escort..." />
                </label>
              </div>

              <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-950/50 p-5">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Quote summary</p>
                  <h4 className="mt-2 text-3xl font-bold text-white">
                    NGN {quoteBreakdown.total.toLocaleString()}
                  </h4>
                  <p className="mt-1 text-sm text-slate-400">
                    Chargeable weight: {quoteBreakdown.chargeableWeightKg} kg
                  </p>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-slate-300"><span>Base transport</span><span>NGN {quoteBreakdown.baseTransport.toLocaleString()}</span></div>
                  <div className="flex justify-between text-slate-300"><span>Vehicle capacity</span><span>NGN {quoteBreakdown.capacityCharge.toLocaleString()}</span></div>
                  <div className="flex justify-between text-slate-300"><span>Weight / volume</span><span>NGN {quoteBreakdown.weightCharge.toLocaleString()}</span></div>
                  <div className="flex justify-between text-slate-300"><span>Fuel</span><span>NGN {quoteBreakdown.fuelCost.toLocaleString()}</span></div>
                  <div className="flex justify-between text-slate-300"><span>Tolls</span><span>NGN {quoteBreakdown.tollFees.toLocaleString()}</span></div>
                  <div className="flex justify-between text-slate-300"><span>Urgency</span><span>NGN {quoteBreakdown.urgencyCost.toLocaleString()}</span></div>
                  <div className="flex justify-between text-slate-300"><span>Handling</span><span>NGN {quoteBreakdown.handlingCost.toLocaleString()}</span></div>
                  <div className="flex justify-between text-slate-300"><span>Insurance</span><span>NGN {quoteBreakdown.insuranceCost.toLocaleString()}</span></div>
                  <div className="flex justify-between text-slate-300"><span>Driver cost</span><span>NGN {quoteBreakdown.driverCost.toLocaleString()}</span></div>
                  <div className="flex justify-between text-slate-300"><span>Maintenance</span><span>NGN {quoteBreakdown.maintenanceCost.toLocaleString()}</span></div>
                  <div className="flex justify-between text-slate-300"><span>Additional services</span><span>NGN {quoteBreakdown.additionalServicesCost.toLocaleString()}</span></div>
                  <div className="flex justify-between border-t border-slate-800 pt-2 text-slate-300"><span>Subtotal</span><span>NGN {quoteBreakdown.subtotal.toLocaleString()}</span></div>
                  <div className="flex justify-between text-slate-300"><span>Peak adjustment</span><span>NGN {quoteBreakdown.peakAdjustment.toLocaleString()}</span></div>
                  <div className="flex justify-between border-t border-slate-800 pt-2 font-semibold text-white"><span>Total quotation</span><span>NGN {quoteBreakdown.total.toLocaleString()}</span></div>
                </div>
                <button
                  type="button"
                  onClick={confirmQuotation}
                  disabled={busyRow === "confirm-quotation"}
                  className="w-full rounded-lg bg-orange-600 px-4 py-3 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-70"
                >
                  {busyRow === "confirm-quotation" ? "Confirming..." : "Confirm quotation"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default PendingQuotations;
