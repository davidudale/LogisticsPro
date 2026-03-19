import React from "react";
import "./App.css";
import { Navigate, Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Homepage from "./Components/LandingPage/Homepage.jsx";
import Login from "./Components/Auth/Login.jsx";
import Register from "./Components/Auth/Register.jsx";
import ProtectedRoute from "./Components/Auth/ProtectedRoute.jsx";
import NotificationListener from "./Components/Auth/NotificationListener.jsx";
import CustomersDashboard from "./Components/Dashboards/CustomersDashboard.jsx";
import Drivers from "./Components/Dashboards/Drivers.jsx";
import DriverAssignments from "./Components/Drivers/DriverAssignments.jsx";
import StaffDashboard from "./Components/Dashboards/StaffDashboard.jsx";
import AdminDashboard from "./Components/Dashboards/AdminDashboard.jsx";
import OrderManagement from "./Components/AdminFiles/OrderManagement/OrderManagement.jsx";
import FleetManagement from "./Components/AdminFiles/FleetManagement/FleetManagement.jsx";
import DriverManagement from "./Components/AdminFiles/FleetManagement/DriverManagement.jsx";
import RouteManagement from "./Components/AdminFiles/FleetManagement/RouteManagement.jsx";
import MaintenanceManagement from "./Components/AdminFiles/FleetManagement/MaintenanceManagement.jsx";
import FuelManagement from "./Components/AdminFiles/FleetManagement/FuelManagement.jsx";
import TrackingMonitoring from "./Components/AdminFiles/FleetManagement/TrackingMonitoring.jsx";
import ComplianceManagement from "./Components/AdminFiles/FleetManagement/ComplianceManagement.jsx";
import FleetReportsAnalytics from "./Components/AdminFiles/FleetManagement/FleetReportsAnalytics.jsx";
import AccountsManagement from "./Components/AdminFiles/AccountsManagement.jsx";
import AdminReports from "./Components/AdminFiles/AdminReports.jsx";
import UsersManagement from "./Components/AdminFiles/UsersManagement.jsx";
import WarehouseManagement from "./Components/AdminFiles/WarehouseManagement.jsx";
import AdminSettings from "./Components/AdminFiles/AdminSettings.jsx";
import CustomerOnboard from "./Components/UsersManagement/CustomerOnboard.jsx";
import CustomerRegistration from "./Components/UsersManagement/CustomerRegistration.jsx";
import CustomerManagement from "./Components/AdminFiles/CustomerManagement/CustomerManagement.jsx";
import CustomersShipment from "./Components/Customers/CustomersShipment.jsx";
import ShipmentOrdersSection from "./Components/Customers/ShipmentOrdersSection.jsx";
import ShipmentQuotationsSection from "./Components/Customers/ShipmentQuotationsSection.jsx";
import PendingQuotations from "./Components/AdminFiles/CustomerManagement/PendingQuotations.jsx";

const App = () => {
  return (
    <>
      <NotificationListener />
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/customers-onboard" element={<CustomerOnboard />} />
        <Route path="/customers-onboard/register/:accountType" element={<CustomerRegistration />} />

        <Route element={<ProtectedRoute allowedRoles={["opsuser"]} />}>
          <Route path="/opsuser" element={<CustomersDashboard />} />
          <Route path="/opsuser/shipments" element={<CustomersShipment />}>
            <Route index element={<Navigate to="quotations" replace />} />
            <Route path="quotations" element={<ShipmentQuotationsSection />} />
            <Route path="requests" element={<ShipmentOrdersSection />} />
          </Route>
        </Route>
        <Route element={<ProtectedRoute allowedRoles={["opsmanager"]} />}>
          <Route path="/opsmanager" element={<StaffDashboard />} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={["accounts"]} />}>
          <Route path="/accounts" element={<CustomersDashboard />} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={["driver"]} />}>
          <Route path="/driver" element={<Drivers />} />
          <Route path="/driver/assignments" element={<DriverAssignments />} />
        </Route>
        {/*Admin Routings*/}
        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route path="/admin/pendingQuotation" element={<PendingQuotations />} />
        </Route>
        
        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route path="/admin/orders" element={<OrderManagement />} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route path="/admin/customers" element={<CustomerManagement />} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route path="/admin/fleet" element={<FleetManagement />} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route path="/admin/driver" element={<DriverManagement />} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route path="/admin/fleet/routes" element={<RouteManagement />} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route path="/admin/fleet/maintenance" element={<MaintenanceManagement />} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route path="/admin/fleet/fuel" element={<FuelManagement />} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route path="/admin/fleet/tracking" element={<TrackingMonitoring />} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route path="/admin/fleet/compliance" element={<ComplianceManagement />} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route path="/admin/fleet/reports" element={<FleetReportsAnalytics />} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route path="/admin/account" element={<AccountsManagement />} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route path="/admin/reports" element={<AdminReports />} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route path="/admin/users" element={<UsersManagement />} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route path="/admin/warehouse" element={<WarehouseManagement />} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route path="/admin/settings" element={<AdminSettings />} />
        </Route>
      </Routes>
      <ToastContainer
        position="top-right"
        autoClose={3500}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        draggable
        pauseOnHover
        theme="dark"
        toastClassName="inspectpro-toast"
        bodyClassName="inspectpro-toast-body"
        progressClassName="inspectpro-toast-progress"
      />
    </>
  );
};

export default App;
