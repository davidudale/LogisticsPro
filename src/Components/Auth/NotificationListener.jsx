import { useEffect, useMemo, useRef } from "react";
import { toast } from "react-toastify";
import { useAuth } from "./AuthContext.jsx";
import { hasNotificationBeenRead, subscribeToTargetedNotifications } from "./notificationUtils.js";

const normalizeValue = (value) => (value || "").toString().trim().toLowerCase();

const NotificationListener = () => {
  const { user } = useAuth();
  const shownNotificationsRef = useRef(new Set());

  const assignedTruckId = useMemo(
    () => normalizeValue(
      user?.profile?.truckId || user?.profile?.vehicleId || user?.profile?.assignedTruckId,
    ),
    [user?.profile],
  );

  useEffect(() => {
    if (!user?.uid) {
      shownNotificationsRef.current.clear();
      return undefined;
    }

    const unsubscribe = subscribeToTargetedNotifications({
      user,
      assignedTruckId,
      onChange: (notifications) => {
        notifications.forEach((notification) => {
          if (
            hasNotificationBeenRead(notification, user.uid)
            || shownNotificationsRef.current.has(notification.id)
          ) {
            return;
          }

          shownNotificationsRef.current.add(notification.id);
          toast.info(
            `${notification.title || "LogisticsPro Notification"}\n${notification.message || "You have a new update."}`,
          );
        });
      },
      onError: (error) => {
        console.error("Failed to subscribe to notifications:", error);
      },
    });

    return () => unsubscribe();
  }, [assignedTruckId, user?.email, user?.role, user?.uid]);

  return null;
};

export default NotificationListener;
