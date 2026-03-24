import React, { useMemo } from "react";
import { Activity, CircleDollarSign, CreditCard, FileText } from "lucide-react";
import { useOutletContext } from "react-router-dom";

const AccountsDashboard = () => {
  const { loading, invoiceOrders, formatCurrency, formatTimestamp } = useOutletContext();

  const totals = useMemo(() => {
    const totalBilled = invoiceOrders.reduce((sum, order) => sum + Number(order.quoteTotal || 0), 0);
    const totalReceived = invoiceOrders.reduce((sum, order) => sum + Number(order.amountPaid || 0), 0);
    const outstanding = Math.max(totalBilled - totalReceived, 0);
    const openInvoices = invoiceOrders.filter((order) => order.balanceDue > 0).length;
    
    return {
      totalBilled,
      totalReceived,
      outstanding,
      openInvoices,
    };
  }, [invoiceOrders]);

  const recentInvoices = useMemo(() => invoiceOrders.slice(0, 5), [invoiceOrders]);
  const agingInvoices = useMemo(
    () => invoiceOrders.filter((order) => order.balanceDue > 0).slice(0, 5),
    [invoiceOrders],
  );

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total Billed", value: formatCurrency(totals.totalBilled), icon: FileText, tone: "text-white" },
          { label: "Payments Recorded", value: formatCurrency(totals.totalReceived), icon: CreditCard, tone: "text-emerald-300" },
          { label: "Outstanding Balance", value: formatCurrency(totals.outstanding), icon: CircleDollarSign, tone: "text-orange-300" },
          { label: "Open Invoices", value: totals.openInvoices, icon: Activity, tone: "text-sky-300" },
        ].map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{label}</p>
              <Icon size={18} className="text-orange-400" />
            </div>
            <p className={`mt-3 text-3xl font-bold ${tone}`}>{value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <h2 className="text-lg font-semibold text-white">Recent Invoice Queue</h2>
          <p className="mt-1 text-sm text-slate-400">
            Latest orders that already carry billable quotation values.
          </p>

          <div className="mt-4 space-y-3">
            {loading ? (
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-400">
                Loading billing records...
              </div>
            ) : recentInvoices.length ? (
              recentInvoices.map((order) => (
                <div key={order.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-white">{order.orderNo || "Order"}</p>
                      <p className="mt-1 text-sm text-slate-400">{order.customerName || "Customer"}</p>
                      <p className="mt-1 text-xs text-slate-500">{formatTimestamp(order.updatedAt || order.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-white">{formatCurrency(order.quoteTotal)}</p>
                      <p className="mt-1 text-xs text-slate-500">{order.status || "Pending"}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-400">
                No invoice-ready orders found yet.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <h2 className="text-lg font-semibold text-white">Outstanding Follow-up</h2>
          <p className="mt-1 text-sm text-slate-400">
            Orders that still have balances waiting to be settled.
          </p>

          <div className="mt-4 space-y-3">
            {loading ? (
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-400">
                Loading balances...
              </div>
            ) : agingInvoices.length ? (
              agingInvoices.map((order) => (
                <div key={order.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                  <p className="text-sm font-semibold text-white">{order.customerName || order.orderNo || "Customer"}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.14em] text-amber-300">
                    {order.paymentStatus}
                  </p>
                  <p className="mt-2 text-sm text-slate-400">
                    Outstanding: <span className="font-semibold text-white">{formatCurrency(order.balanceDue)}</span>
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Received so far: {formatCurrency(order.amountPaid)}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-400">
                All tracked invoice balances are settled.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default AccountsDashboard;
