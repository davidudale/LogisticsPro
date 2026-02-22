import React from "react";
import { NavLink } from "react-router-dom";
import {
    Book,
  ClipboardList,
  House,
  LayoutDashboard,
  MapPin,
  Package,
  Paperclip,
  Settings,
  ShieldCheck,
  Truck,
  Users,
  Users2,
  Warehouse,
  X,
} from "lucide-react";
import { useAuth } from "../Auth/AuthContext.jsx";

const roleLinks = {
  customer: [
    { label: "Overview", to: "/customer", icon: LayoutDashboard },
    { label: "My Shipments", to: "/customer/shipments", icon: Package },
    { label: "Tracking", to: "/customer/tracking", icon: MapPin },
    { label: "Support", to: "/customer/support", icon: ClipboardList },
  ],
  driver: [
    { label: "Overview", to: "/driver", icon: LayoutDashboard },
    { label: "Assignments", to: "/driver/assignments", icon: Truck },
    { label: "Route Map", to: "/driver/routes", icon: MapPin },
    { label: "Deliveries", to: "/driver/deliveries", icon: Package },
  ],
  staff: [
    { label: "Overview", to: "/staff", icon: LayoutDashboard },
    { label: "Dispatch", to: "/staff/dispatch", icon: Truck },
    { label: "Warehouses", to: "/staff/warehouses", icon: Warehouse },
    { label: "Customers", to: "/staff/customers", icon: Users },
  ],
  admin: [
    { label: "Overview", to: "/admin", icon: LayoutDashboard },
    { label: "Order Management", to: "/admin/orders", icon: Paperclip },
    { label: "Route planning and optimization", to: "/admin/routing", icon: ClipboardList },
    { label: "Fleet Management", to: "/admin/fleet", icon: Truck },
    { label: "Warehouse management", to: "/admin/warehouse", icon: House },
    { label: "Customer management", to: "/admin/fleet", icon: Users2 },
    { label: "Reporting and analytics", to: "/admin/reports", icon: Book },
    { label: "Users", to: "/admin/users", icon: Users },
    { label: "Settings", to: "/admin/settings", icon: Settings },
  ],
};


const Sidebar = ({ open = false, onClose }) => {
  const { user } = useAuth();
  const links = roleLinks[user?.role] || [];

  return (
    <>
      <aside className="hidden min-h-screen lg:flex lg:w-72 lg:flex-col border-r border-slate-800/70 bg-slate-950/80">
        <div className="px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-amber-500/15 text-amber-400">
              <ShieldCheck size={18} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Role</p>
              <p className="text-sm font-semibold text-white capitalize">
                {user?.role || "user"}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 pb-6 space-y-1">
          {links.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    isActive
                      ? "bg-amber-500/15 text-amber-300"
                      : "text-slate-400 hover:text-white hover:bg-slate-900/60"
                  }`
                }
              >
                <Icon size={18} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
      </aside>

      <div
        className={`lg:hidden fixed inset-0 z-40 transition ${
          open ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        <div
          className={`absolute inset-0 bg-black/60 transition-opacity ${
            open ? "opacity-100" : "opacity-0"
          }`}
          onClick={onClose}
        />
        <aside
          className={`absolute left-0 top-0 h-full w-72 bg-slate-950/95 border-r border-slate-800/80 backdrop-blur transition-transform ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/70">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-amber-500/15 text-amber-400">
                <ShieldCheck size={18} />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Role</p>
                <p className="text-sm font-semibold text-white capitalize">
                  {user?.role || "user"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-full border border-slate-700 px-2 py-2 text-slate-200 hover:bg-slate-900"
              aria-label="Close menu"
              type="button"
            >
              <X size={16} />
            </button>
          </div>
          <nav className="px-4 py-6 space-y-1">
            {links.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                      isActive
                        ? "bg-amber-500/15 text-amber-300"
                        : "text-slate-400 hover:text-white hover:bg-slate-900/60"
                    }`
                  }
                >
                  <Icon size={18} />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </aside>
      </div>
    </>
  );
};

export default Sidebar;
