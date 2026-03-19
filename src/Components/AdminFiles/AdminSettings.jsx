import React from "react";
import { Bell, Lock, Settings, SlidersHorizontal } from "lucide-react";
import AdminSectionPage from "./Shared/AdminSectionPage.jsx";

const AdminSettings = () => (
  <AdminSectionPage
    title="Settings"
    eyebrow="System Setup"
    description="Manage operational defaults, notification preferences, and platform controls for the admin workspace."
    heroIcon={Settings}
    statCards={[
      { label: "Active Config Sets", value: "7", icon: SlidersHorizontal },
      { label: "Alert Rules", value: "13", tone: "text-orange-300", icon: Bell },
      { label: "Security Policies", value: "5", tone: "text-emerald-400", icon: Lock },
    ]}
    focusAreas={[
      { title: "Platform Preferences", detail: "Control operational defaults for dashboards, forms, and admin views.", icon: Settings },
      { title: "Notification Rules", detail: "Tune alert behavior for quotations, orders, fleet exceptions, and audits.", icon: Bell },
      { title: "Security Controls", detail: "Review session rules, account safeguards, and privileged admin protections.", icon: Lock },
    ]}
    actionCards={[
      { title: "Review Alert Thresholds", detail: "Update when teams should be notified about exceptions and escalations." },
      { title: "Adjust Workspace Defaults", detail: "Refine admin display, workflow, and data handling preferences." },
      { title: "Inspect Security Posture", detail: "Check policy coverage for accounts, sessions, and privileged actions." },
    ]}
  />
);

export default AdminSettings;
