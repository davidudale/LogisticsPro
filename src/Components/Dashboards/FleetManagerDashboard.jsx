import React, { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  ClipboardCheck,
  MapPinned,
  ShieldCheck,
  Truck,
  Users,
  Wrench,
} from "lucide-react";
import { collection, getFirestore, onSnapshot } from "firebase/firestore";
import { app } from "../Auth/firebase.js";
import AdminSectionPage from "../AdminFiles/Shared/AdminSectionPage.jsx";

const db = getFirestore(app);

const getDaysUntilDue = (value) => {
  if (!value) return Number.POSITIVE_INFINITY;
  const dueDate = new Date(value);
  if (Number.isNaN(dueDate.getTime())) return Number.POSITIVE_INFINITY;
  return Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
};

const FleetManagerDashboard = () => {
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [routes, setRoutes] = useState([]);

  useEffect(() => {
    const unsubscribers = [
      onSnapshot(collection(db, "fleet_vehicles"), (snapshot) => {
        setVehicles(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
      }),
      onSnapshot(collection(db, "fleet_drivers"), (snapshot) => {
        setDrivers(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
      }),
      onSnapshot(collection(db, "order_shipments"), (snapshot) => {
        setAssignments(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
      }),
      onSnapshot(collection(db, "fleet_routes"), (snapshot) => {
        setRoutes(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
      }),
    ];

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, []);

  const readyVehicles = useMemo(
    () => vehicles.filter((vehicle) => (vehicle.status || "").toString().trim().toLowerCase() !== "maintenance"),
    [vehicles],
  );
  const maintenanceWatchlist = useMemo(
    () => vehicles.filter((vehicle) => getDaysUntilDue(vehicle.maintenanceDue) <= 14),
    [vehicles],
  );
  const assignedDrivers = useMemo(
    () => drivers.filter((driver) => (driver.assignedTruckId || "").toString().trim()).length,
    [drivers],
  );
  const activeAssignments = useMemo(
    () =>
      assignments.filter((assignment) => {
        const status = (assignment.status || "").toString().trim().toLowerCase();
        return status && !["delivered", "cancelled", "completed"].includes(status);
      }).length,
    [assignments],
  );

  return (
    <AdminSectionPage
      title="Fleet Manager Dashboard"
      eyebrow="Fleet Operations"
      description="Monitor live fleet readiness, assignment pressure, and compliance signals from one place before jumping into the operational tools."
      heroIcon={Truck}
      statCards={[
        { label: "Road-Ready Units", value: `${readyVehicles.length}/${vehicles.length || 0}`, icon: Truck },
        { label: "Assigned Drivers", value: `${assignedDrivers}`, icon: Users },
        { label: "Maintenance Due Soon", value: `${maintenanceWatchlist.length}`, tone: "text-amber-300", icon: Wrench },
      ]}
      focusAreas={[
        {
          title: "Vehicle Availability",
          detail: `${readyVehicles.length} units are currently usable outside maintenance, giving you a quick readiness signal before dispatch decisions.`,
          icon: Truck,
        },
        {
          title: "Compliance And Maintenance",
          detail: `${maintenanceWatchlist.length} vehicles have maintenance dates within the next 14 days and should be checked before assignment.`,
          icon: ShieldCheck,
        },
        {
          title: "Assignment And Route Load",
          detail: `${activeAssignments} shipment assignments and ${routes.length} saved routes are currently in circulation across fleet operations.`,
          icon: MapPinned,
        },
      ]}
      actionCards={[
        {
          title: "Open Fleet Board",
          detail: "Review vehicles, assigned drivers, and unit utilization.",
          to: "/fleet-manager/vehicles",
        },
        {
          title: "Check Truck Assignments",
          detail: "Review shipment allocation pressure and dispatch coverage.",
          to: "/fleet-manager/assignments",
        },
        {
          title: "Review Compliance Queue",
          detail: "Inspect compliance and maintenance signals before they block operations.",
          to: "/fleet-manager/compliance",
        },
        {
          title: "Open Reports",
          detail: "Inspect fleet analytics and trend summaries.",
          to: "/fleet-manager/reports",
        },
      ]}
    />
  );
};

export default FleetManagerDashboard;
