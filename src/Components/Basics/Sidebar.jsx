import React from "react";
import { NavLink } from "react-router-dom";
import {
  ClipboardList,
  FileText,
  LayoutDashboard,
  MapPin,
  Package,
  Settings,
  Sliders,
  Truck,
  Users,
  Warehouse,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "../Auth/AuthContext.jsx";

const roleLinks = {
  customer: [
    { label: "Dashboard", to: "/customer", icon: LayoutDashboard },
    { label: "My Shipments", to: "/customer/shipments", icon: Package },
    { label: "Tracking", to: "/customer/tracking", icon: MapPin },
    { label: "Preferences", to: "/customer/settings", icon: Sliders },
  ],
  driver: [
    { label: "Dashboard", to: "/driver", icon: LayoutDashboard },
    { label: "Assignments", to: "/driver/assignments", icon: Truck },
    { label: "Route Map", to: "/driver/routes", icon: MapPin },
    { label: "Delivery Logs", to: "/driver/deliveries", icon: ClipboardList },
  ],
  staff: [
    { label: "Dashboard", to: "/staff", icon: LayoutDashboard },
    { label: "Dispatch", to: "/staff/dispatch", icon: Truck },
    { label: "Warehouses", to: "/staff/warehouses", icon: Warehouse },
    { label: "Customers", to: "/staff/customers", icon: Users },
  ],
  admin: [
    { label: "Dashboard", to: "/admin", icon: LayoutDashboard },
    { label: "Order Management", to: "/admin/orders", icon: ClipboardList },
    { label: "Fleet Management", to: "/admin/fleet", icon: Truck },
    { label: "Warehouse", to: "/admin/warehouse", icon: Warehouse },
    { label: "Reports", to: "/admin/reports", icon: FileText },
    { label: "Users", to: "/admin/users", icon: Users },
    { label: "Settings", to: "/admin/settings", icon: Settings },
  ],
};

const Sidebar = ({ open = false, onClose }) => {
  const { user } = useAuth();
  const [isMobileExpanded, setIsMobileExpanded] = React.useState(false);
  const links = roleLinks[user?.role] || [];
  const userLabel =
    user?.displayName || user?.email?.split("@")[0] || user?.role || "User";

  React.useEffect(() => {
    if (open) {
      setIsMobileExpanded(true);
    }
  }, [open]);

  return (
    <>
      <aside
        className={`h-screen fixed border-r border-slate-800 bg-slate-900/20 transition-all duration-300 flex flex-col z-40 ${
          isMobileExpanded ? "w-64" : "w-16"
        } lg:w-64`}
      >
        <div className="p-4 lg:p-6 border-b border-slate-800/50">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsMobileExpanded((prev) => !prev);
                  onClose?.();
                }}
                className="ml-auto mb-4 relative lg:hidden p-2 rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
                aria-label="Toggle sidebar"
              >
                {isMobileExpanded ? <X size={16} /> : <Menu size={16} />}
              </button>
              <div className="w-8 h-8 lg:w-12 lg:h-12 rounded-full bg-gradient-to-br from-orange-500 to-orange-700 p-0.5 shadow-orange-500/20">
                <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center text-white font-bold text-xs lg:text-base">
                  LP
                </div>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-slate-950 rounded-full" />
            </div>
            <div
              className={`${isMobileExpanded ? "block" : "hidden"} lg:block overflow-hidden`}
            >
              <p className="text-sm font-bold text-white uppercase tracking-tight truncate">
                {userLabel}
              </p>
              <p className="text-xs text-slate-500 uppercase tracking-[0.2em]">
                {user?.role || "role"}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 bg-slate-900 overflow-y-auto py-4 px-3 space-y-1">
          {links.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl p-3 text-sm font-semibold transition-all group ${
                    isActive
                      ? "bg-orange-600/10 text-orange-500"
                      : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                  }`
                }
                onClick={onClose}
              >
                <Icon size={18} />
                <span className={`${isMobileExpanded ? "block" : "hidden"} lg:block`}>
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </nav>
      </aside>

      <div
        className={`lg:hidden fixed inset-0 z-30 transition ${
          open ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        <div
          className={`absolute inset-0 bg-black/60 transition-opacity ${
            open ? "opacity-100" : "opacity-0"
          }`}
          onClick={onClose}
        />
      </div>
    </>
  );
};

export default Sidebar;
