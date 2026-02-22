import React from "react";
import "./App.css";
import { Route, Routes } from "react-router-dom";
import Homepage from "./Components/LandingPage/Homepage.jsx";
import Login from "./Components/Auth/Login.jsx";
import Register from "./Components/Auth/Register.jsx";
import ProtectedRoute from "./Components/Auth/ProtectedRoute.jsx";
import CustomersDashboard from "./Components/Dashboards/CustomersDashboard.jsx";
import Drivers from "./Components/Dashboards/Drivers.jsx";
import StaffDashboard from "./Components/Dashboards/StaffDashboard.jsx";
import AdminDashboard from "./Components/Dashboards/AdminDashboard.jsx";
import OrderManagement from "./Components/AdminFiles/OrderManagement/OrderManagement.jsx";

const App = () => {
  return (
    <Routes>
    
      <Route path="/" element={<Homepage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedRoute allowedRoles={["customer"]} />}>
        <Route path="/customer" element={<CustomersDashboard />} />
      </Route>
      <Route element={<ProtectedRoute allowedRoles={["driver"]} />}>
        <Route path="/driver" element={<Drivers />} />
      </Route>
      <Route element={<ProtectedRoute allowedRoles={["staff"]} />}>
        <Route path="/staff" element={<StaffDashboard />} />
      </Route>
      {/*Admin Routings*/} 
      <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
        <Route path="/admin" element={<AdminDashboard />} />
      </Route>
      <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
        <Route path="/admin/orders" element={<OrderManagement />} />
      </Route>
    </Routes>
  );
};

export default App;
