import React from "react";
import {
  BarChart3,
  ClipboardCheck,
  ShieldCheck,
  Truck,
} from "lucide-react";
import AdminSectionPage from "../AdminFiles/Shared/AdminSectionPage.jsx";

const FleetManagerDashboard = () => (
  <AdminSectionPage
    title="Fleet Manager Dashboard"
    eyebrow="Fleet Operations"
    description="Coordinate vehicle readiness, monitor compliance posture, and keep fleet reporting aligned with daily operational goals."
    heroIcon={Truck}
    statCards={[
      { label: "Fleet Readiness", value: "42 Active", icon: Truck },
      { label: "Compliance Watchlist", value: "6 Due Soon", tone: "text-amber-300", icon: ShieldCheck },
      { label: "Weekly Reviews", value: "14", icon: ClipboardCheck },
    ]}
    focusAreas={[
      { title: "Vehicle Availability", detail: "Track which assets are road-ready, in service, or scheduled for inspection.", icon: Truck },
      { title: "Compliance Control", detail: "Stay ahead of expiring permits, inspection deadlines, and regulatory exceptions.", icon: ShieldCheck },
      { title: "Performance Reporting", detail: "Review operational trends that affect utilization, downtime, and delivery capacity.", icon: BarChart3 },
    ]}
    actionCards={[
      { title: "Open Fleet Board", detail: "Review active units, maintenance blockers, and allocation pressure across the fleet." },
      { title: "Check Compliance Queue", detail: "Prioritize vehicles with permits, inspections, or documentation nearing expiry." },
      { title: "Review Trend Pack", detail: "Inspect the latest analytics on utilization, service interruptions, and route output." },
    ]}
  />
);

export default FleetManagerDashboard;
