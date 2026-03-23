import React, { useMemo, useState } from "react";
import { Check, Plus, ReceiptText, X } from "lucide-react";
import { Link, useOutletContext } from "react-router-dom";

const visiblePricingStatuses = new Set([
  "Quotation Sent and Pending Client Review",
  "Quotation Under Negotiation",
  "Quotation Accepted",
]);
const negotiationReasons = [
  "Price is too high",
  "Need a faster delivery timeline",
  "Need to adjust pickup location",
  "Need to adjust destination details",
  "Need to change cargo details",
  "Need revised payment terms",
  "Other",
];

const getTimestampValue = (value) => {
  if (!value) return 0;
  if (typeof value?.toDate === "function") return value.toDate().getTime();
  if (typeof value?.seconds === "number") return value.seconds * 1000;
  const parsedValue = new Date(value).getTime();
  return Number.isNaN(parsedValue) ? 0 : parsedValue;
};

const formatTimestamp = (quotation) => {
  const rawValue = quotation.updatedAt || quotation.createdAt;
  const timestampValue = getTimestampValue(rawValue);
  if (!timestampValue) return "Not available";
  return new Intl.DateTimeFormat("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestampValue));
};

const formatStateName = (location) => location?.state || "Not available";

const ShipmentQuotationsSection = () => {
  const {
    loading,
    filteredQuotations,
    busyQuotationId,
    updateQuotationDecision,
    user,
    formatLocation,
    formatDimensions,
    formatCurrency,
    dashboardPath,
  } = useOutletContext();
  const [breakdownPreview, setBreakdownPreview] = useState(null);
  const [negotiationModal, setNegotiationModal] = useState(null);
  const [selectedNegotiationReason, setSelectedNegotiationReason] = useState("");
  const [negotiationReason, setNegotiationReason] = useState("");
  const sortedQuotations = useMemo(
    () => [...filteredQuotations].sort(
      (left, right) =>
        getTimestampValue(right.updatedAt || right.createdAt)
        - getTimestampValue(left.updatedAt || left.createdAt),
    ),
    [filteredQuotations],
  );

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/30 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <ReceiptText size={18} className="text-orange-400" />
          <h3 className="text-lg font-semibold text-white">My Quotations</h3>
        </div>
        <Link
          to={dashboardPath}
          state={{ openQuotationModal: true }}
          className="inline-flex items-center gap-2 self-start rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-700"
        >
          <Plus size={16} />
          Get Quotation
        </Link>
      </div>
      <p className="mt-2 text-sm text-slate-400">
        View pending and confirmed quotations, including totals and pricing breakdowns.
      </p>

      {loading ? (
        <div className="mt-4 text-sm text-slate-400">Loading your quotations...</div>
      ) : filteredQuotations.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-slate-800 bg-slate-950/30 p-6 text-center">
          <p className="text-base font-semibold text-white">No quotations found.</p>
          <p className="mt-2 text-sm text-slate-400">
            Submit a quotation request from your dashboard to see it here.
          </p>
        </div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-800">
          <div className="max-h-[58vh] overflow-auto pr-3">
            <table className="min-w-[1400px] w-full text-left text-sm">
              <thead className="bg-slate-900/80">
                <tr className="border-b border-slate-800 text-xs uppercase tracking-[0.12em] text-slate-400">
                  <th className="px-3 py-3">Quotation No</th>
                  <th className="px-3 py-3">Last Updated</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Origin</th>
                  <th className="px-3 py-3">Destination</th>
                  <th className="px-3 py-3">Cargo</th>
                  <th className="px-3 py-3">Weight</th>
                  <th className="px-3 py-3">Dimensions</th>
                  <th className="px-3 py-3">Total</th>
                  <th className="px-3 py-3">Breakdown</th>
                  <th className="px-3 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {sortedQuotations.map((quotation) => {
                  const canRespond = quotation.status === "Quotation Sent and Pending Client Review";
                  const breakdown = quotation.quotationBreakdown || {};
                  const canViewPricing = visiblePricingStatuses.has(quotation.status);
                  const hasBreakdown = Boolean(quotation.quoteTotal || breakdown.total);

                  return (
                    <tr
                      key={quotation.id}
                      className="border-b border-slate-800/80 align-top hover:bg-slate-900/30"
                    >
                      <td className="px-3 py-4">
                        <p className="font-semibold text-white">{quotation.quotationNo || "Quotation"}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {quotation.customerName || user?.displayName || "Customer"}
                        </p>
                      </td>
                      <td className="px-3 py-4 text-slate-300">
                        {formatTimestamp(quotation)}
                      </td>
                      <td className="px-3 py-4">
                        <span className="inline-flex rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-orange-300">
                          {quotation.status || "Pending"}
                        </span>
                      </td>
                      <td className="px-3 py-4 text-slate-300">{formatStateName(quotation.origin)}</td>
                      <td className="px-3 py-4 text-slate-300">{formatStateName(quotation.destination)}</td>
                      <td className="px-3 py-4 text-slate-300">{quotation.cargo || "Not specified"}</td>
                      <td className="px-3 py-4 text-slate-300">{quotation.weight || "Not specified"}</td>
                      <td className="px-3 py-4 text-slate-300">
                        {formatDimensions(quotation.dimensions)}
                        <p className="mt-1 text-xs text-slate-500">Qty: {quotation.itemQuantity || 1}</p>
                      </td>
                      <td className="px-3 py-4 font-semibold text-white">
                        {canViewPricing
                          ? formatCurrency(quotation.quoteTotal || breakdown.total)
                          : "Not available"}
                      </td>
                      <td className="px-3 py-4">
                        {!canViewPricing ? (
                          <p className="max-w-[240px] text-sm text-slate-400">
                            </p>
                        ) : quotation.status === "Pending" && !quotation.quoteTotal ? (
                          <p className="max-w-[240px] text-sm text-slate-400">Awaiting admin pricing.</p>
                        ) : hasBreakdown ? (
                          <div className="space-y-2">
                            <p className="text-sm font-semibold text-white">
                              {formatCurrency(quotation.quoteTotal || breakdown.total)}
                            </p>
                            <button
                              type="button"
                              onClick={() => setBreakdownPreview(quotation)}
                              className="rounded-md border border-slate-600 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800"
                            >
                              View
                            </button>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500">No breakdown available.</p>
                        )}
                      </td>
                      <td className="px-3 py-4">
                        {quotation.status === "SAVE" ? (
                          <Link
                            to={dashboardPath}
                            state={{ openQuotationModal: true, editQuotation: quotation }}
                            className="inline-flex rounded-lg border border-slate-600 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800"
                          >
                            Edit
                          </Link>
                        ) : canRespond ? (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              title="Accept Quote"
                              aria-label="Accept Quote"
                              onClick={() => updateQuotationDecision(quotation.id, "accept")}
                              disabled={busyQuotationId === quotation.id}
                              className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-70"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              type="button"
                              title="Reject Quote"
                              aria-label="Reject Quote"
                              onClick={() => {
                                setNegotiationModal(quotation);
                                const existingReason = quotation.customerNegotiationReason || "";
                                const matchedReason = negotiationReasons.includes(existingReason)
                                  ? existingReason
                                  : existingReason
                                    ? "Other"
                                    : "";
                                setSelectedNegotiationReason(matchedReason);
                                setNegotiationReason(
                                  matchedReason === "Other" ? existingReason : "",
                                );
                              }}
                              disabled={busyQuotationId === quotation.id}
                              className="flex h-9 w-9 items-center justify-center rounded-lg border border-rose-500/40 text-rose-300 hover:bg-rose-500/10 disabled:opacity-70"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : quotation.customerDecision ? (
                          <p className="text-xs text-slate-400">
                            {quotation.customerDecision === "accept" ? "Accepted" : "Rejected"}
                          </p>
                        ) : (
                          <p className="text-xs text-slate-400">No action</p>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {breakdownPreview ? (
        <div className="fixed inset-0 z-[145] flex items-center justify-center bg-black/70 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Quotation breakdown</p>
                <h3 className="mt-2 text-2xl font-bold text-white">
                  {breakdownPreview.quotationNo || "Quotation"}
                </h3>
                <p className="mt-1 text-sm text-slate-400">
                  Preview the pricing breakdown for this quotation.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setBreakdownPreview(null)}
                className="rounded-md border border-slate-700 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800"
              >
                Close
              </button>
            </div>

            <div className="mt-6 space-y-4 rounded-2xl border border-slate-800 bg-slate-950/50 p-5">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Quote summary</p>
                <h4 className="mt-2 text-3xl font-bold text-white">
                  {formatCurrency(
                    breakdownPreview.quoteTotal || breakdownPreview.quotationBreakdown?.total,
                  )}
                </h4>
                <p className="mt-1 text-sm text-slate-400">
                  Chargeable weight: {breakdownPreview.quotationBreakdown?.chargeableWeightKg || 0} kg
                </p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-slate-300"><span>Base transport</span><span>{formatCurrency(breakdownPreview.quotationBreakdown?.baseTransport)}</span></div>
                <div className="flex justify-between text-slate-300"><span>Vehicle capacity</span><span>{formatCurrency(breakdownPreview.quotationBreakdown?.capacityCharge)}</span></div>
                <div className="flex justify-between text-slate-300"><span>Weight / volume</span><span>{formatCurrency(breakdownPreview.quotationBreakdown?.weightCharge)}</span></div>
                <div className="flex justify-between text-slate-300"><span>Fuel</span><span>{formatCurrency(breakdownPreview.quotationBreakdown?.fuelCost)}</span></div>
                <div className="flex justify-between text-slate-300"><span>Tolls</span><span>{formatCurrency(breakdownPreview.quotationBreakdown?.tollFees)}</span></div>
                <div className="flex justify-between text-slate-300"><span>Urgency</span><span>{formatCurrency(breakdownPreview.quotationBreakdown?.urgencyCost)}</span></div>
                <div className="flex justify-between text-slate-300"><span>Handling</span><span>{formatCurrency(breakdownPreview.quotationBreakdown?.handlingCost)}</span></div>
                <div className="flex justify-between text-slate-300"><span>Insurance</span><span>{formatCurrency(breakdownPreview.quotationBreakdown?.insuranceCost)}</span></div>
                <div className="flex justify-between text-slate-300"><span>Driver</span><span>{formatCurrency(breakdownPreview.quotationBreakdown?.driverCost)}</span></div>
                <div className="flex justify-between text-slate-300"><span>Maintenance</span><span>{formatCurrency(breakdownPreview.quotationBreakdown?.maintenanceCost)}</span></div>
                <div className="flex justify-between text-slate-300"><span>Additional services</span><span>{formatCurrency(breakdownPreview.quotationBreakdown?.additionalServicesCost)}</span></div>
                <div className="flex justify-between border-t border-slate-800 pt-2 text-slate-300"><span>Subtotal</span><span>{formatCurrency(breakdownPreview.quotationBreakdown?.subtotal)}</span></div>
                <div className="flex justify-between text-slate-300"><span>Peak adjustment</span><span>{formatCurrency(breakdownPreview.quotationBreakdown?.peakAdjustment)}</span></div>
                <div className="flex justify-between border-t border-slate-800 pt-2 font-semibold text-white"><span>Total quotation</span><span>{formatCurrency(breakdownPreview.quoteTotal || breakdownPreview.quotationBreakdown?.total)}</span></div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      {negotiationModal ? (
        <div className="fixed inset-0 z-[146] flex items-center justify-center bg-black/70 p-4">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Negotiation request</p>
                <h3 className="mt-2 text-2xl font-bold text-white">
                  {negotiationModal.quotationNo || "Quotation"}
                </h3>
                <p className="mt-1 text-sm text-slate-400">
                  Tell the team why you want this quotation reviewed again.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (busyQuotationId !== negotiationModal.id) {
                    setNegotiationModal(null);
                    setNegotiationReason("");
                  }
                }}
                className="rounded-md border border-slate-700 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800"
              >
                Close
              </button>
            </div>

            <div className="mt-5 space-y-3">
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Reason for negotiation
                </span>
                <select
                  value={selectedNegotiationReason}
                  onChange={(event) => {
                    const value = event.target.value;
                    setSelectedNegotiationReason(value);
                    if (value !== "Other") {
                      setNegotiationReason("");
                    }
                  }}
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-3 text-sm text-white outline-none focus:border-orange-500"
                >
                  <option value="">Select a reason</option>
                  {negotiationReasons.map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                </select>
              </label>
              {selectedNegotiationReason ? (
                <label className="block">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                    Additional details
                  </span>
                  <textarea
                    value={negotiationReason}
                    onChange={(event) => setNegotiationReason(event.target.value)}
                    rows={5}
                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-3 text-sm text-white outline-none focus:border-orange-500"
                    placeholder="Share the concerns or changes you want on this quote..."
                  />
                </label>
              ) : null}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setNegotiationModal(null);
                    setSelectedNegotiationReason("");
                    setNegotiationReason("");
                  }}
                  disabled={busyQuotationId === negotiationModal.id}
                  className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800 disabled:opacity-70"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const resolvedReason = negotiationReason.trim()
                      ? `${selectedNegotiationReason}: ${negotiationReason.trim()}`
                      : selectedNegotiationReason.trim();

                    if (!resolvedReason) {
                      return;
                    }

                    await updateQuotationDecision(negotiationModal.id, "reject", resolvedReason);
                    setNegotiationModal(null);
                    setSelectedNegotiationReason("");
                    setNegotiationReason("");
                  }}
                  disabled={
                    busyQuotationId === negotiationModal.id
                    || !selectedNegotiationReason
                  }
                  className="rounded-lg border border-rose-500/40 px-4 py-2 text-sm font-semibold text-rose-300 hover:bg-rose-500/10 disabled:opacity-70"
                >
                  {busyQuotationId === negotiationModal.id ? "Submitting..." : "Send for Negotiation"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ShipmentQuotationsSection;
