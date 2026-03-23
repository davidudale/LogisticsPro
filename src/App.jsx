import React from "react";
import "./App.css";
import { Navigate, Route, Routes } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Homepage from "./Components/LandingPage/Homepage.jsx";
import Login from "./Components/Auth/Login.jsx";
import Register from "./Components/Auth/Register.jsx";
import ProtectedRoute from "./Components/Auth/ProtectedRoute.jsx";
import CustomersDashboard from "./Components/Dashboards/CustomersDashboard.jsx";
import Drivers from "./Components/Dashboards/Drivers.jsx";
import DriverAssignments from "./Components/Drivers/DriverAssignments.jsx";
import StaffDashboard from "./Components/Dashboards/StaffDashboard.jsx";
import AdminDashboard from "./Components/Dashboards/AdminDashboard.jsx";
import FleetManagerDashboard from "./Components/Dashboards/FleetManagerDashboard.jsx";
import AuditorDashboard from "./Components/Dashboards/AuditorDashboard.jsx";
import OrderManagement from "./Components/AdminFiles/OrderManagement/OrderManagement.jsx";
import FleetManagement from "./Components/AdminFiles/FleetManagement/FleetManagement.jsx";
import FleetTruckAssignments from "./Components/AdminFiles/FleetManagement/FleetTruckAssignments.jsx";
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
import QuotationHistory from "./Components/AdminFiles/QuotationHistory.jsx";
import AccountsWorkspace from "./Components/Accounts/AccountsWorkspace.jsx";
import AccountsDashboard from "./Components/Accounts/AccountsDashboard.jsx";
import AccountsInvoices from "./Components/Accounts/AccountsInvoices.jsx";
import AccountsPayments from "./Components/Accounts/AccountsPayments.jsx";
import AccountsSettings from "./Components/Accounts/AccountsSettings.jsx";
import AuditTrail from "./Components/Auditor/AuditTrail.jsx";
import ComplianceReview from "./Components/Auditor/ComplianceReview.jsx";
import AuditReports from "./Components/Auditor/AuditReports.jsx";

const App = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/customers-onboard" element={<CustomerOnboard />} />
        <Route path="/customers-onboard/register/:accountType" element={<CustomerRegistration />} />

        <Route element={<ProtectedRoute allowedRoles={["customer"]} />}>
          <Route path="/customer" element={<CustomersDashboard />} />
          <Route path="/customer/shipments" element={<CustomersShipment />}>
            <Route index element={<Navigate to="quotations" replace />} />
            <Route path="quotations" element={<ShipmentQuotationsSection />} />
            <Route path="requests" element={<ShipmentOrdersSection />} />
          </Route>
        </Route>
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
        <Route element={<ProtectedRoute allowedRoles={["fleetmanager"]} />}>
          <Route path="/fleet-manager" element={<FleetManagerDashboard />} />
          <Route path="/fleet-manager/vehicles" element={<FleetManagement />} />
          <Route path="/fleet-manager/drivers" element={<DriverManagement />} />
          <Route path="/fleet-manager/assignments" element={<FleetTruckAssignments />} />
          <Route path="/fleet-manager/routes" element={<RouteManagement />} />
          <Route path="/fleet-manager/maintenance" element={<MaintenanceManagement />} />
          <Route path="/fleet-manager/fuel" element={<FuelManagement />} />
          <Route path="/fleet-manager/tracking" element={<TrackingMonitoring />} />
          <Route path="/fleet-manager/compliance" element={<ComplianceManagement />} />
          <Route path="/fleet-manager/reports" element={<FleetReportsAnalytics />} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={["auditor"]} />}>
          <Route path="/auditor" element={<AuditorDashboard />} />
          <Route path="/auditor/audit-trail" element={<AuditTrail />} />
          <Route path="/auditor/compliance-review" element={<ComplianceReview />} />
          <Route path="/auditor/reports" element={<AuditReports />} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={["accounts"]} />}>
          <Route path="/accounts" element={<AccountsWorkspace />}>
            <Route index element={<AccountsDashboard />} />
            <Route path="invoices" element={<AccountsInvoices />} />
            <Route path="payments" element={<AccountsPayments />} />
            <Route path="settings" element={<AccountsSettings />} />
          </Route>
        </Route>
        <Route element={<ProtectedRoute allowedRoles={["driver"]} />}>
          <Route path="/driver" element={<Drivers />} />
          <Route path="/driver/assignments" element={<DriverAssignments />} />
        </Route>
        {/*Admin Routings*/}
        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={["opsuser","opsmanager","admin"]} />}>
          <Route path="/admin/pendingQuotation" element={<PendingQuotations />} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={["opsuser","opsmanager","admin"]} />}>
          <Route path="/admin/quotationsHistory" element={<QuotationHistory />} />
        </Route>
        
        <Route element={<ProtectedRoute allowedRoles={["opsuser","opsmanager","admin"]} />}>
          <Route path="/admin/orders" element={<OrderManagement />} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route path="/admin/customers" element={<CustomerManagement />} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={[ "opsmanager","fleetmanager", "admin" ]} />}>
          <Route path="/admin/fleet" element={<FleetManagement />} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={["opsmanager","fleetmanager","admin"]} />}>
          <Route path="/admin/driver" element={<DriverManagement />} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={["opsmanager","fleetmanager","admin"]} />}>
          <Route path="/admin/fleet/routes" element={<RouteManagement />} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={["opsmanager","fleetmanager","admin"]} />}>
          <Route path="/admin/fleet/maintenance" element={<MaintenanceManagement />} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={["opsmanager","fleetmanager","admin"]} />}>
          <Route path="/admin/fleet/fuel" element={<FuelManagement />} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={["opsmanager","fleetmanager","admin"]} />}>
          <Route path="/admin/fleet/tracking" element={<TrackingMonitoring />} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={["opsmanager","fleetmanager","admin"]} />}>
          <Route path="/admin/fleet/compliance" element={<ComplianceManagement />} />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={["opsmanager","fleetmanager","admin"]} />}>
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
