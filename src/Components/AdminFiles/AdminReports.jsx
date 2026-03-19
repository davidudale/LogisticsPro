import React from "react";
import { BarChart3, ClipboardList, PieChart, TrendingUp } from "lucide-react";
import AdminSectionPage from "./Shared/AdminSectionPage.jsx";

const AdminReports = () => (
  <AdminSectionPage
    title="Reports"
    eyebrow="Operations"
    description="Review business-wide performance across quotations, fulfillment, customer activity, and fleet execution."
    heroIcon={BarChart3}
    statCards={[
      { label: "Reports This Week", value: "21", icon: ClipboardList },
      { label: "Growth Snapshot", value: "+11%", tone: "text-emerald-400", icon: TrendingUp },
      { label: "Live Dashboards", value: "6", tone: "text-orange-300", icon: PieChart },
    ]}
    focusAreas={[
      { title: "Operational Reporting", detail: "Track throughput across quotation handling, order creation, and delivery execution.", icon: ClipboardList },
      { title: "Trend Monitoring", detail: "Compare recent performance against prior periods to catch volume shifts early.", icon: TrendingUp },
      { title: "Executive Views", detail: "Present high-level summaries for leadership without losing operational context.", icon: PieChart },
    ]}
    actionCards={[
      { title: "Build Leadership Summary", detail: "Prepare a concise report covering sales flow, service quality, and utilization." },
      { title: "Compare Regional Output", detail: "Spot which zones are driving volume growth or delivery delays." },
      { title: "Export KPI Pack", detail: "Prepare downloadable views for operations reviews and management meetings." },
    ]}
  />
);

export default AdminReports;
