import React from "react";
import { Boxes, Clock3, PackageCheck, Warehouse } from "lucide-react";
import AdminSectionPage from "./Shared/AdminSectionPage.jsx";

const WarehouseManagement = () => (
  <AdminSectionPage
    title="Warehouse"
    eyebrow="System Setup"
    description="Coordinate warehouse throughput, staging readiness, and dispatch handoff performance across active shipment operations."
    heroIcon={Warehouse}
    statCards={[
      { label: "Active Warehouses", value: "4", icon: Warehouse },
      { label: "Staged Loads", value: "19", tone: "text-orange-300", icon: Boxes },
      { label: "Handoff Accuracy", value: "97%", tone: "text-emerald-400", icon: PackageCheck },
    ]}
    focusAreas={[
      { title: "Dock Coordination", detail: "Keep inbound and outbound lanes organized for faster truck turnaround.", icon: Warehouse },
      { title: "Load Staging", detail: "Track orders waiting on dispatch and align them with truck availability.", icon: Boxes },
      { title: "Dispatch Readiness", detail: "Confirm inventory, paperwork, and packaging status before release.", icon: Clock3 },
    ]}
    actionCards={[
      { title: "Review Staging Queue", detail: "Inspect loads waiting longest for warehouse release." },
      { title: "Balance Dock Capacity", detail: "Spread inbound and outbound work across available bay windows." },
      { title: "Confirm Handoff Packets", detail: "Ensure shipment documents are complete before loading begins." },
    ]}
  />
);

export default WarehouseManagement;
