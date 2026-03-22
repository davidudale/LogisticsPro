import React from "react";
import {
  ClipboardList,
  Eye,
  ShieldAlert,
  Waypoints,
} from "lucide-react";
import AdminSectionPage from "../AdminFiles/Shared/AdminSectionPage.jsx";

const AuditTrail = () => (
  <AdminSectionPage
    title="Audit Trail"
    eyebrow="Auditor Workspace"
    description="Trace approval activity, shipment workflow changes, and control-sensitive events across the platform."
    heroIcon={ClipboardList}
    statCards={[
      { label: "Tracked Events", value: "128", icon: Waypoints },
      { label: "Flagged Actions", value: "5", tone: "text-amber-300", icon: ShieldAlert },
      { label: "Reviewed Today", value: "23", icon: Eye },
    ]}
    focusAreas={[
      { title: "Role Action Review", detail: "Monitor who approved, edited, or escalated operational records and when they did it.", icon: Eye },
      { title: "Workflow Integrity", detail: "Verify that quotation, order, and fleet actions follow the expected sequence of control points.", icon: Waypoints },
      { title: "Exception Isolation", detail: "Spot events that need escalation because they bypassed or weakened standard controls.", icon: ShieldAlert },
    ]}
    actionCards={[
      { title: "Inspect Approval Flow", detail: "Review recent approvals and determine whether supporting evidence is complete." },
      { title: "Check Escalation Events", detail: "Focus on actions that changed status quickly or outside the expected chain." },
      { title: "Prepare Exception Notes", detail: "Capture findings and observations for downstream control reviews." },
    ]}
  />
);

export default AuditTrail;
