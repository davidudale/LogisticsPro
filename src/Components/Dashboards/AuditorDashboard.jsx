import React from "react";
import {
  ClipboardList,
  FileSearch,
  Shield,
  TimerReset,
} from "lucide-react";
import AdminSectionPage from "../AdminFiles/Shared/AdminSectionPage.jsx";

const AuditorDashboard = () => (
  <AdminSectionPage
    title="Auditor Dashboard"
    eyebrow="Controls & Assurance"
    description="Review control coverage, inspect compliance evidence, and follow audit trails across operational, fleet, and customer workflows."
    heroIcon={FileSearch}
    statCards={[
      { label: "Open Audit Checks", value: "11", icon: ClipboardList },
      { label: "Exceptions Logged", value: "4", tone: "text-amber-300", icon: Shield },
      { label: "Review Cycles", value: "3 Active", icon: TimerReset },
    ]}
    focusAreas={[
      { title: "Control Verification", detail: "Validate that approvals, workflow transitions, and reporting controls are being followed.", icon: Shield },
      { title: "Evidence Review", detail: "Inspect documentation, records, and workflow traces needed for internal assurance.", icon: FileSearch },
      { title: "Exception Tracking", detail: "Monitor unresolved findings and follow up on repeat control gaps.", icon: ClipboardList },
    ]}
    actionCards={[
      { title: "Review Audit Trail", detail: "Inspect recent events, role actions, and workflow changes requiring follow-up." },
      { title: "Check Compliance Evidence", detail: "Validate regulatory readiness and documentation quality across monitored areas." },
      { title: "Prepare Assurance Summary", detail: "Compile issues, open actions, and risk notes for management review." },
    ]}
  />
);

export default AuditorDashboard;
