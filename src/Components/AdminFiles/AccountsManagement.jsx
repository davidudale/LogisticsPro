import React from "react";
import { CreditCard, FileText, Receipt, Wallet } from "lucide-react";
import AdminSectionPage from "./Shared/AdminSectionPage.jsx";

const AccountsManagement = () => (
  <AdminSectionPage
    title="Accounts"
    eyebrow="Operations"
    description="Track billing workflows, reconcile payment activity, and monitor account health across customer and fleet operations."
    heroIcon={Wallet}
    statCards={[
      { label: "Open Invoices", value: "26", icon: FileText },
      { label: "Payments Today", value: "N 1.2M", tone: "text-emerald-400", icon: CreditCard },
      { label: "Reconciliation Queue", value: "8", tone: "text-orange-300", icon: Receipt },
    ]}
    focusAreas={[
      { title: "Invoice Control", detail: "Keep shipment billing and quotation-linked charges aligned with active customer orders.", icon: FileText },
      { title: "Payment Tracking", detail: "Watch incoming payments, due balances, and pending account actions.", icon: CreditCard },
      { title: "Reconciliation Review", detail: "Resolve mismatches between billing records and posted settlements.", icon: Receipt },
    ]}
    actionCards={[
      { title: "Review Open Balances", detail: "Inspect customers with aging receivables and unsettled shipment invoices." },
      { title: "Match Recent Payments", detail: "Link posted receipts to the correct order and quotation records." },
      { title: "Prepare Month-End Summary", detail: "Compile billing performance and payment collection outcomes." },
    ]}
  />
);

export default AccountsManagement;
