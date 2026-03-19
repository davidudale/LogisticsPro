import React from "react";
import { KeyRound, ShieldCheck, UserPlus, Users } from "lucide-react";
import AdminSectionPage from "./Shared/AdminSectionPage.jsx";

const UsersManagement = () => (
  <AdminSectionPage
    title="Users Management"
    eyebrow="System Setup"
    description="Administer internal users, role permissions, and access controls across customer, driver, and operations workflows."
    heroIcon={Users}
    statCards={[
      { label: "Total Users", value: "124", icon: Users },
      { label: "Pending Onboarding", value: "9", tone: "text-orange-300", icon: UserPlus },
      { label: "Access Reviews", value: "4", tone: "text-amber-400", icon: KeyRound },
    ]}
    focusAreas={[
      { title: "Role Administration", detail: "Map users to the right permissions for customer, fleet, and admin responsibilities.", icon: ShieldCheck },
      { title: "Onboarding Control", detail: "Track pending registrations and confirm account setup completion.", icon: UserPlus },
      { title: "Access Hygiene", detail: "Review stale accounts, role drift, and privileged-access coverage.", icon: KeyRound },
    ]}
    actionCards={[
      { title: "Review New Accounts", detail: "Approve or clean up pending user records before activation." },
      { title: "Audit Permissions", detail: "Check that every team role still aligns with current responsibilities." },
      { title: "Prepare Access Review", detail: "Compile account and role summaries for security and management checks." },
    ]}
  />
);

export default UsersManagement;
