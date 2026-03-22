import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, LogOut, Menu, X } from "lucide-react";
import { collection, getFirestore, onSnapshot, orderBy, query } from "firebase/firestore";
import { app } from "../Auth/firebase.js";
import { useAuth } from "../Auth/AuthContext.jsx";
import {
  hasNotificationBeenRead,
  markNotificationsAsRead,
} from "../Auth/notificationUtils.js";
import { getDashboardPathByRole, getShipmentsPathByRole } from "../../utils/roles.js";

const db = getFirestore(app);

const normalizeValue = (value) => (value || "").toString().trim().toLowerCase();

const getTimestampValue = (value) => {
  if (!value) return 0;
  if (typeof value?.toDate === "function") return value.toDate().getTime();
  if (typeof value?.seconds === "number") return value.seconds * 1000;
  const parsedValue = new Date(value).getTime();
  return Number.isNaN(parsedValue) ? 0 : parsedValue;
};

const formatNotificationTime = (value) => {
  const timestampValue = getTimestampValue(value);
  if (!timestampValue) return "Now";
  return new Intl.DateTimeFormat("en-NG", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestampValue));
};

const buildNotificationDestination = (notification, role) => {
  const normalizedRole = normalizeValue(role);
  const normalizedType = normalizeValue(notification?.type);
  const params = new URLSearchParams();

  if (notification?.id) params.set("notification", notification.id);
  if (notification?.quotationNo) params.set("quotationNo", notification.quotationNo);
  if (notification?.orderNo) params.set("orderNo", notification.orderNo);

  if (normalizedRole === "driver") {
    return `/driver/assignments${params.toString() ? `?${params.toString()}` : ""}`;
  }

  if (normalizedRole === "admin") {
    const adminPath = normalizedType.startsWith("quotation")
      ? "/admin/pendingQuotation"
      : "/admin/orders";
    return `${adminPath}${params.toString() ? `?${params.toString()}` : ""}`;
  }

  if (normalizedRole === "customer" || normalizedRole === "opsuser") {
    const customerPath = normalizedType.includes("quotation")
      ? getShipmentsPathByRole(normalizedRole, "quotations")
      : getShipmentsPathByRole(normalizedRole, "requests");
    return `${customerPath}${params.toString() ? `?${params.toString()}` : ""}`;
  }

  if (normalizedRole === "accounts") {
    const accountsPath = normalizedType.includes("payment")
      ? "/accounts/payments"
      : "/accounts/invoices";
    return `${accountsPath}${params.toString() ? `?${params.toString()}` : ""}`;
  }

  const fallbackPath = normalizedRole ? getDashboardPathByRole(normalizedRole) : "/";
  return `${fallbackPath}${params.toString() ? `?${params.toString()}` : ""}`;
};

const NavBar = ({ title = "Dashboard", onToggleSidebar }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notificationsPanelRef = useRef(null);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const userName =
    user?.displayName || user?.email?.split("@")[0] || user?.role || "User";

  const assignedTruckId = useMemo(
    () => normalizeValue(
      user?.profile?.truckId || user?.profile?.vehicleId || user?.profile?.assignedTruckId,
    ),
    [user?.profile],
  );

  useEffect(() => {
    if (!user?.uid) {
      setNotifications([]);
      return undefined;
    }

    const notificationsQuery = query(collection(db, "notifications"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      notificationsQuery,
      (snapshot) => {
        const nextNotifications = snapshot.docs
          .map((item) => ({ id: item.id, ...item.data() }))
          .filter((notification) => {
            const targetUid = normalizeValue(notification.targetUid);
            const targetEmail = normalizeValue(notification.targetEmail);
            const targetRole = normalizeValue(notification.targetRole);
            const targetTruckId = normalizeValue(notification.targetTruckId);

            return (
              (targetUid && targetUid === normalizeValue(user.uid))
              || (targetEmail && targetEmail === normalizeValue(user.email))
              || (targetRole && targetRole === normalizeValue(user.role))
              || (targetTruckId && assignedTruckId && targetTruckId === assignedTruckId)
            );
          })
          .sort(
            (left, right) =>
              getTimestampValue(right.createdAt || right.updatedAt)
              - getTimestampValue(left.createdAt || left.updatedAt),
          )
          .slice(0, 8);

        setNotifications(nextNotifications);
      },
      (error) => {
        console.error("Failed to load navbar notifications:", error);
      },
    );

    return () => unsubscribe();
  }, [assignedTruckId, user?.email, user?.role, user?.uid]);

  useEffect(() => {
    if (!notificationsOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (!notificationsPanelRef.current?.contains(event.target)) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [notificationsOpen]);

  const unreadNotifications = notifications.filter(
    (notification) => !hasNotificationBeenRead(notification, user?.uid),
  );
  const unreadCount = unreadNotifications.length;

  const toggleNotifications = () => {
    setNotificationsOpen((prev) => !prev);
  };

  const clearNotifications = async (notificationIds) => {
    try {
      await markNotificationsAsRead(notificationIds, user?.uid);
    } catch (error) {
      console.error("Failed to clear notifications:", error);
    }
  };

  const handleNotificationClick = async (notification) => {
    await clearNotifications([notification.id]);
    setNotificationsOpen(false);
    setIsMenuOpen(false);
    navigate(buildNotificationDestination(notification, user?.role));
  };

  const handleClearAllNotifications = async () => {
    await clearNotifications(unreadNotifications.map((notification) => notification.id));
  };

  const renderNotificationItem = (notification, compact = false) => (
    <div
      key={notification.id}
      className={`border-b border-slate-800/80 ${compact ? "px-4 py-3" : "bg-orange-500/5 px-4 py-3"}`}
    >
      <button
        type="button"
        onClick={() => void handleNotificationClick(notification)}
        className="w-full rounded-lg text-left transition hover:bg-slate-900/70 focus:outline-none focus:ring-2 focus:ring-orange-500/60"
      >
        <div className="flex items-start justify-between gap-3">
          <p className={`${compact ? "text-xs tracking-[0.12em]" : "text-sm tracking-[0.08em]"} font-semibold uppercase text-white`}>
            {notification.title || "LogisticsPro Notification"}
          </p>
          <span className="whitespace-nowrap text-[10px] uppercase tracking-[0.14em] text-slate-500">
            {formatNotificationTime(notification.createdAt || notification.updatedAt)}
          </span>
        </div>
        <p className="mt-2 text-xs leading-5 text-slate-400">
          {notification.message || "You have a new update."}
        </p>
        <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-orange-400">
          Open notification
        </p>
      </button>
      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={() => void clearNotifications([notification.id])}
          className="rounded-md border border-slate-700 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-300 transition hover:border-orange-500/50 hover:text-white"
        >
          Clear
        </button>
      </div>
    </div>
  );

  return (
    <header className="sticky top-0 w-full border-b border-slate-800 bg-slate-900/50 backdrop-blur-md z-50">
      <div className="flex items-center justify-between p-4 lg:px-8">
        <div className="flex items-center space-x-3">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 text-white"
            aria-label="Open menu"
            type="button"
          >
            <Menu />
          </button>
          <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-700 rounded-sm flex items-center justify-center transform rotate-45">
            <div className="w-3 h-3 bg-white rounded-full -rotate-45" />
          </div>
          <span className="text-xl lg:text-2xl font-syncopate font-bold tracking-tighter text-white">
            LogisticsPro<span className="text-orange-500">.</span>
          </span>
        </div>

        <div className="hidden md:flex items-center space-x-4">
          <div className="flex flex-col items-end mr-2">
            <span className="text-slate-400 text-[10px] uppercase tracking-widest font-bold">
              {title}
            </span>
            <span className="text-white text-xs font-medium">{userName}</span>
          </div>
          <div className="relative" ref={notificationsPanelRef}>
            <button
              type="button"
              onClick={toggleNotifications}
              className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-slate-700 bg-slate-950/70 text-slate-200 transition hover:border-orange-500/50 hover:bg-slate-900"
              aria-label="Open notifications"
              title="Notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 ? (
                <span className="absolute -right-1 -top-1 min-w-[1.1rem] rounded-full bg-orange-500 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              ) : null}
            </button>
            {notificationsOpen ? (
              <div className="absolute right-0 top-14 z-[90] w-[22rem] overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/95 shadow-2xl">
                <div className="border-b border-slate-800 px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Notifications</p>
                      <p className="mt-1 text-sm font-semibold text-white">
                        {unreadNotifications.length ? "Latest updates" : "No notifications yet"}
                      </p>
                    </div>
                    {unreadNotifications.length ? (
                      <button
                        type="button"
                        onClick={() => void handleClearAllNotifications()}
                        className="rounded-md border border-slate-700 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-300 transition hover:border-orange-500/50 hover:text-white"
                      >
                        Clear all
                      </button>
                    ) : null}
                  </div>
                </div>
                <div className="max-h-[24rem] overflow-y-auto">
                  {unreadNotifications.length ? (
                    unreadNotifications.map((notification) => renderNotificationItem(notification))
                  ) : (
                    <div className="px-4 py-6 text-sm text-slate-400">
                      Notifications for your account, role, or assigned truck will show here.
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-900/40 hover:bg-red-700 text-white px-4 py-1.5 rounded-sm text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>

        <button
          className="md:hidden p-2 text-white"
          onClick={() => setIsMenuOpen((prev) => !prev)}
          type="button"
          aria-label="Toggle mobile menu"
        >
          {isMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {isMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-900 p-4 space-y-4 flex flex-col">
          <button
            type="button"
            onClick={toggleNotifications}
            className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-left text-sm text-slate-200"
          >
            <span className="flex items-center gap-3">
              <Bell size={16} />
              Notifications
            </span>
            {unreadCount > 0 ? (
              <span className="rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            ) : null}
          </button>
          {notificationsOpen ? (
            <div className="max-h-[18rem] overflow-y-auto rounded-xl border border-slate-800 bg-slate-950/60">
              {unreadNotifications.length ? (
                <>
                  <div className="flex justify-end border-b border-slate-800/80 px-4 py-2">
                    <button
                      type="button"
                      onClick={() => void handleClearAllNotifications()}
                      className="rounded-md border border-slate-700 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-300 transition hover:border-orange-500/50 hover:text-white"
                    >
                      Clear all
                    </button>
                  </div>
                  {unreadNotifications.map((notification) => renderNotificationItem(notification, true))}
                </>
              ) : (
                <div className="px-4 py-5 text-sm text-slate-400">
                  Notifications for your account will appear here.
                </div>
              )}
            </div>
          ) : null}
          <div className="w-full text-left px-2 py-2 text-sm text-slate-300">
            {userName}
          </div>
          <button
            className="w-full bg-red-900 text-white p-2 rounded-sm text-xs font-bold uppercase"
            onClick={handleLogout}
            type="button"
          >
            Logout
          </button>
        </div>
      )}
    </header>
  );
};

export default NavBar;
