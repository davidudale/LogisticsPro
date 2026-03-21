import { useEffect, useMemo, useRef } from "react";
import { collection, getFirestore, onSnapshot, orderBy, query } from "firebase/firestore";
import { toast } from "react-toastify";
import { app } from "./firebase";
import { useAuth } from "./AuthContext.jsx";
import { hasNotificationBeenRead } from "./notificationUtils.js";

const db = getFirestore(app);

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

    const notificationsQuery = query(collection(db, "notifications"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      notificationsQuery,
      (snapshot) => {
        snapshot.docs.forEach((item) => {
          const notification = { id: item.id, ...item.data() };
          const targetUid = normalizeValue(notification.targetUid);
          const targetEmail = normalizeValue(notification.targetEmail);
          const targetRole = normalizeValue(notification.targetRole);
          const targetTruckId = normalizeValue(notification.targetTruckId);

          const isForCurrentUser = (
            (targetUid && targetUid === normalizeValue(user.uid))
            || (targetEmail && targetEmail === normalizeValue(user.email))
            || (targetRole && targetRole === normalizeValue(user.role))
            || (targetTruckId && assignedTruckId && targetTruckId === assignedTruckId)
          );

          if (
            !isForCurrentUser
            || hasNotificationBeenRead(notification, user.uid)
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
      (error) => {
        console.error("Failed to subscribe to notifications:", error);
      },
    );

    return () => unsubscribe();
  }, [assignedTruckId, user?.email, user?.role, user?.uid]);

  return null;
};

export default NotificationListener;
