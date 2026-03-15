import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  ClipboardList,
  ChevronDown,
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
  User,
} from "lucide-react";
import { useAuth } from "../Auth/AuthContext.jsx";

// Central role-to-navigation map used to render a different sidebar for each user type.
const roleLinks = {
  opsuser: [
    { label: "Dashboard", to: "/opsuser", icon: LayoutDashboard },
    { label: "My Shipments", to: "/opsuser/shipments", icon: Package },
    { label: "Tracking", to: "/opsuser/tracking", icon: MapPin },
    { label: "Preferences", to: "/opsuser/settings", icon: Sliders },
  ],
  opsmanager: [
    { label: "Dashboard", to: "/opsmanager", icon: LayoutDashboard },
    { label: "Dispatch", to: "/opsmanager/dispatch", icon: Truck },
    { label: "Warehouses", to: "/opsmanager/warehouses", icon: Warehouse },
    { label: "Customers", to: "/opsmanager/customers", icon: Users },
  ],
  accounts: [
    { label: "Dashboard", to: "/accounts", icon: LayoutDashboard },
    { label: "Invoices", to: "/accounts/invoices", icon: FileText },
    { label: "Payments", to: "/accounts/payments", icon: ClipboardList },
    { label: "Preferences", to: "/accounts/settings", icon: Sliders },
  ],
  driver: [
    { label: "Dashboard", to: "/driver", icon: LayoutDashboard },
    { label: "Assignments", to: "/driver/assignments", icon: Truck },
    { label: "Route Map", to: "/driver/routes", icon: MapPin },
    { label: "Delivery Logs", to: "/driver/deliveries", icon: ClipboardList },
  ],
  admin: [
    { label: "Dashboard", to: "/admin", icon: LayoutDashboard },
    {
      label: "Operations",
      icon: ClipboardList,
      children: [
        {
          label: "Order Management",
          icon: ClipboardList,
          children: [
            { label: "Shipment Orders", to: "/admin/orders", icon: ClipboardList },
            { label: "Pending Quotations", to: "/admin/pendingQuotation", icon: ClipboardList },
          ],
        },
        { label: "Customers Management", to: "/admin/customers", icon: User },
        { label: "Accounts", to: "/admin/account", icon: FileText },
        
        { label: "Reports", to: "/admin/reports", icon: FileText },
      ],
    },

    {
      label: "System Setup",
      icon: Settings,
      children: [
        { label: "Users Management", to: "/admin/users", icon: Users },
        { label: "Fleet Management", to: "/admin/fleet", icon: Truck },
        { label: "Drivers Management", to: "/admin/driver", icon: Users },
        { label: "Warehouse", to: "/admin/warehouse", icon: Warehouse },
        { label: "Settings", to: "/admin/settings", icon: Settings },
      ],
    },
    {
      label: "Audit",
      icon: ClipboardList,
      children: [
        { label: "Audit Trail", to: "/admin/audit", icon: ClipboardList },

      ],
    },
  ],
};

const Sidebar = ({ open = false, onClose }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [isMobileExpanded, setIsMobileExpanded] = React.useState(false);
  const links = roleLinks[user?.role] || [];
  const userLabel =
    user?.displayName || user?.email?.split("@")[0] || user?.role || "User";
  const roleTag = (user?.role || "role").replace(/([a-z])([A-Z])/g, "$1 $2");
  const [expandedGroups, setExpandedGroups] = React.useState({});

  React.useEffect(() => {
    // Keeps the sidebar expanded whenever the parent asks to open it on small screens.
    if (open) {
      setIsMobileExpanded(true);
    }
  }, [open]);

  React.useEffect(() => {
    const findActiveGroupChain = (items, parentKey = "root", trail = []) => {
      for (const item of items) {
        if (!item.children) {
          continue;
        }

        const itemKey = [...trail, item.label].join(">");
        const directMatch = item.children.some(
          (child) =>
            child.to &&
            (location.pathname === child.to || location.pathname.startsWith(`${child.to}/`)),
        );

        if (directMatch) {
          return [{ parentKey, itemKey }];
        }

        const nestedMatch = findActiveGroupChain(item.children, itemKey, [...trail, item.label]);
        if (nestedMatch.length) {
          return [{ parentKey, itemKey }, ...nestedMatch];
        }
      }

      return [];
    };

    const activeChain = findActiveGroupChain(links);
    if (activeChain.length) {
      setExpandedGroups((prev) => {
        const next = { ...prev };
        activeChain.forEach(({ parentKey, itemKey }) => {
          next[parentKey] = itemKey;
        });
        return next;
      });
    }
  }, [links, location.pathname]);

  const toggleGroup = (parentKey, itemKey) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [parentKey]: prev[parentKey] === itemKey ? null : itemKey,
    }));
  };

  const renderLink = (item, nested = false, depth = 0) => {
    const Icon = item.icon;
    const nestedSpacingClass = depth > 1 ? "ml-4 pl-3" : "ml-2.5 pl-3";

    return (
      <NavLink
        key={item.to}
        to={item.to}
        className={({ isActive }) =>
          `group flex items-center gap-2.5 rounded-xl border px-2.5 py-2 text-sm font-semibold tracking-[0.08em] transition-all ${
            nested ? nestedSpacingClass : ""
          } ${
            isActive
              ? "border-orange-500/40 bg-gradient-to-r from-orange-500/20 via-orange-500/8 to-transparent text-orange-100 shadow-[0_18px_40px_-28px_rgba(249,115,22,0.95)]"
              : "border-transparent text-slate-400 hover:border-slate-700/70 hover:bg-slate-800/70 hover:text-slate-100"
           }`
        }
        onClick={onClose}
      >
        {({ isActive }) => (
          <>
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-all ${
                isActive
                  ? "border-orange-400/40 bg-orange-500/15 text-orange-300"
                  : "border-slate-800 bg-slate-900/70 text-slate-500 group-hover:border-slate-700 group-hover:text-slate-200"
              }`}
            >
              <Icon size={nested ? 16 : 18} />
            </span>
            <span className={`${isMobileExpanded ? "block" : "hidden"} lg:block`}>
              {item.label}
            </span>
          </>
        )}
      </NavLink>
    );
  };

  const renderItem = (item, depth = 0, trail = [], parentKey = "root") => {
    if (!item.children) {
      return renderLink(item, depth > 0, depth);
    }

    const hasActiveChild = (entry) =>
      entry.children?.some((child) =>
        child.to
          ? location.pathname === child.to || location.pathname.startsWith(`${child.to}/`)
          : hasActiveChild(child),
      );

    const itemKey = [...trail, item.label].join(">");
    const isExpanded = expandedGroups[parentKey] === itemKey;
    const isGroupActive = hasActiveChild(item);
    const Icon = item.icon;

    return (
      <div key={item.label} className="space-y-0.5">
        <button
          type="button"
          onClick={() => toggleGroup(parentKey, itemKey)}
          className={`w-full flex items-center gap-2.5 rounded-xl border px-2.5 py-2 text-sm font-semibold tracking-[0.08em] transition-all ${
            depth > 0 ? "ml-2.5" : ""
          } ${
            isGroupActive
              ? "border-orange-500/30 bg-slate-900/95 text-white shadow-[0_18px_40px_-30px_rgba(249,115,22,0.85)]"
              : "border-transparent text-slate-400 hover:border-slate-700/70 hover:bg-slate-900/70 hover:text-white"
           }`}
        >
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-all ${
              isGroupActive
                ? "border-orange-400/40 bg-orange-500/15 text-orange-300"
                : "border-slate-800 bg-slate-900/70 text-slate-500"
            }`}
          >
            <Icon size={18} />
          </span>
          <span
            className={`${isMobileExpanded ? "block" : "hidden"} lg:block flex-1 text-left`}
          >
            {item.label}
          </span>
          <ChevronDown
            size={16}
            className={`${isMobileExpanded ? "block" : "hidden"} lg:block text-slate-500 transition-transform ${
              isExpanded ? "rotate-180" : ""
            }`}
          />
        </button>

        {isExpanded && (
          <div className="space-y-0.5 border-l border-slate-800/70 pl-1.5">
            {item.children.map((child) =>
              renderItem(child, depth + 1, [...trail, item.label], itemKey),
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <aside
        className={`fixed z-40 flex h-screen flex-col overflow-hidden border-r border-orange-500/15 bg-slate-950/95 shadow-[0_30px_80px_-45px_rgba(249,115,22,0.5)] backdrop-blur-xl transition-all duration-300 ${
          isMobileExpanded ? "w-64" : "w-16"
        } lg:w-64`}
      >
        <div className="relative overflow-hidden border-b border-slate-800/70 px-4 py-4 lg:px-6 lg:py-6">
          <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-orange-500/70 to-transparent" />
          <div className="absolute -left-8 top-6 h-20 w-20 rounded-full bg-orange-500/10 blur-2xl" />
          <div className="absolute right-0 top-10 h-24 w-24 rounded-full bg-amber-400/10 blur-3xl" />
          <div className="relative flex items-center gap-4">
            <div className="relative shrink-0">
              {/* Mobile users can collapse the sidebar to an icon rail without affecting desktop. */}
              <button
                type="button"
                onClick={() => {
                  setIsMobileExpanded((prev) => !prev);
                  onClose?.();
                }}
                className="relative mb-4 ml-auto rounded-xl border border-slate-800 bg-slate-950/80 p-2 text-slate-400 transition-colors hover:border-orange-500/30 hover:bg-slate-900 hover:text-white lg:hidden"
                aria-label="Toggle sidebar"
              >
                {isMobileExpanded ? <X size={16} /> : <Menu size={16} />}
              </button>
              <div className="h-8 w-8 rounded-2xl bg-gradient-to-br from-orange-400 via-orange-500 to-amber-600 p-[1px] shadow-[0_16px_35px_-18px_rgba(249,115,22,0.95)] lg:h-12 lg:w-12">
                <div className="flex h-full w-full items-center justify-center rounded-2xl bg-slate-950 text-xs font-black text-white lg:text-base">
                  LP
                </div>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-slate-950 bg-emerald-500" />
            </div>
            <div
              className={`${isMobileExpanded ? "block" : "hidden"} lg:block min-w-0 overflow-hidden`}
            >
              <p className="font-syncopate truncate text-sm font-bold uppercase tracking-[0.14em] text-white lg:text-[15px]">
                LogisticsPro
              </p>
              <p className="mt-2 truncate text-xs font-semibold tracking-[0.08em] text-orange-300/90">
                {userLabel}
              </p>
              <p className="mt-1 truncate text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">
                {roleTag}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto bg-[radial-gradient(circle_at_top,_rgba(249,115,22,0.08),_transparent_32%),linear-gradient(180deg,rgba(15,23,42,0.96),rgba(2,6,23,1))] px-2.5 py-4">
          <div className={`${isMobileExpanded ? "block" : "hidden"} lg:block px-2.5 pb-1.5`}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              Control Center
            </p>
          </div>
          {/* NavLink handles active-route styling so each role section stays declarative. */}
          {links.map((item) => renderItem(item))}
        </nav>
      </aside>

      <div
        className={`lg:hidden fixed inset-0 z-30 transition ${
          open ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        {/* Backdrop captures outside clicks when the mobile drawer is open. */}
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
