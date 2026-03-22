import React from "react";
import {
  BadgeCheck,
  FileCheck2,
  ShieldCheck,
  Siren,
} from "lucide-react";
import AdminSectionPage from "../AdminFiles/Shared/AdminSectionPage.jsx";

const ComplianceReview = () => (
  <AdminSectionPage
    title="Compliance Review"
    eyebrow="Auditor Workspace"
    description="Review documentation coverage, policy adherence, and readiness signals for fleet and operational compliance."
    heroIcon={ShieldCheck}
    statCards={[
      { label: "Policies Reviewed", value: "17", icon: FileCheck2 },
      { label: "Controls Passing", value: "93%", tone: "text-emerald-400", icon: BadgeCheck },
      { label: "Exceptions Pending", value: "3", tone: "text-amber-300", icon: Siren },
    ]}
    focusAreas={[
      { title: "Documentation Readiness", detail: "Confirm that mandatory permits, records, and evidence packs are complete and current.", icon: FileCheck2 },
      { title: "Control Adherence", detail: "Review whether teams are operating within the policies that govern regulated workflows.", icon: BadgeCheck },
      { title: "Exception Follow-up", detail: "Track unresolved compliance issues and make sure remediation remains visible.", icon: Siren },
    ]}
    actionCards={[
      { title: "Review Expiring Controls", detail: "Focus on time-bound requirements that may soon affect readiness or compliance status." },
      { title: "Validate Evidence Pack", detail: "Check the quality and completeness of supporting records for sensitive workflows." },
      { title: "Escalate Risk Items", detail: "Highlight gaps that need action from operations, fleet leadership, or management." },
    ]}
  />
);

export default ComplianceReview;
