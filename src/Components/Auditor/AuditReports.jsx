import React from "react";
import {
  BarChart3,
  ClipboardCheck,
  FileBarChart,
  TrendingUp,
} from "lucide-react";
import AdminSectionPage from "../AdminFiles/Shared/AdminSectionPage.jsx";

const AuditReports = () => (
  <AdminSectionPage
    title="Audit Reports"
    eyebrow="Auditor Workspace"
    description="Summarize audit findings, recurring control signals, and trend movement across monitored workflows."
    heroIcon={FileBarChart}
    statCards={[
      { label: "Reports Generated", value: "9", icon: FileBarChart },
      { label: "Open Findings", value: "7", tone: "text-amber-300", icon: ClipboardCheck },
      { label: "Trend Change", value: "+2 Risks", tone: "text-orange-300", icon: TrendingUp },
    ]}
    focusAreas={[
      { title: "Findings Overview", detail: "Consolidate exceptions, remediation progress, and ownership across review cycles.", icon: ClipboardCheck },
      { title: "Risk Trend Reporting", detail: "Compare findings over time to see whether control pressure is increasing or stabilizing.", icon: TrendingUp },
      { title: "Management Visibility", detail: "Prepare concise reporting that leadership can use to prioritize corrective action.", icon: BarChart3 },
    ]}
    actionCards={[
      { title: "Build Monthly Audit Pack", detail: "Summarize open issues, closure rate, and areas needing stronger controls." },
      { title: "Compare Review Periods", detail: "Check whether the latest cycle improved or worsened the assurance picture." },
      { title: "Share Management Summary", detail: "Prepare a short, decision-ready view of current audit risk and follow-ups." },
    ]}
  />
);

export default AuditReports;
