import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getFirestore,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { app } from "./firebase";

const db = getFirestore(app);

const normalizeValue = (value) => {
  const resolvedValue = (value || "").toString().trim();
  return resolvedValue || "";
};

export const createNotificationRecord = async ({
  title,
  message,
  targetUid = "",
  targetEmail = "",
  targetRole = "",
  targetTruckId = "",
  type = "general",
  ...rest
}) => {
  const payload = {
    title: normalizeValue(title) || "LogisticsPro Notification",
    message: normalizeValue(message) || "You have a new update.",
    targetUid: normalizeValue(targetUid),
    targetEmail: normalizeValue(targetEmail).toLowerCase(),
    targetRole: normalizeValue(targetRole).toLowerCase(),
    targetTruckId: normalizeValue(targetTruckId).toLowerCase(),
    type: normalizeValue(type) || "general",
    createdAt: serverTimestamp(),
  };

  Object.entries(rest).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      payload[key] = value;
    }
  });

  return addDoc(collection(db, "notifications"), payload);
};

export const hasNotificationBeenRead = (notification, userUid) => {
  const normalizedUid = normalizeValue(userUid);
  if (!normalizedUid) return false;

  const readBy = Array.isArray(notification?.readBy) ? notification.readBy : [];
  return readBy.some((value) => normalizeValue(value) === normalizedUid);
};

export const markNotificationsAsRead = async (notificationIds, userUid) => {
  const normalizedUid = normalizeValue(userUid);
  const idsToUpdate = [...new Set((notificationIds || []).filter(Boolean))];

  if (!normalizedUid || !idsToUpdate.length) {
    return;
  }

  await Promise.all(
    idsToUpdate.map((notificationId) =>
      updateDoc(doc(db, "notifications", notificationId), {
        readBy: arrayUnion(normalizedUid),
        updatedAt: serverTimestamp(),
      })),
  );
};

const getNotificationTimestampValue = (value) => {
  if (!value) return 0;
  if (typeof value?.toDate === "function") return value.toDate().getTime();
  if (typeof value?.seconds === "number") return value.seconds * 1000;
  const parsedValue = new Date(value).getTime();
  return Number.isNaN(parsedValue) ? 0 : parsedValue;
};

export const subscribeToTargetedNotifications = ({
  user,
  assignedTruckId = "",
  onChange,
  onError,
  maxResults = 20,
}) => {
  const normalizedUid = normalizeValue(user?.uid);
  const normalizedEmail = normalizeValue(user?.email).toLowerCase();
  const normalizedRole = normalizeValue(user?.role).toLowerCase();
  const normalizedTruckId = normalizeValue(assignedTruckId).toLowerCase();

  const targets = [
    normalizedUid ? { field: "targetUid", value: normalizedUid } : null,
    normalizedEmail ? { field: "targetEmail", value: normalizedEmail } : null,
    normalizedRole ? { field: "targetRole", value: normalizedRole } : null,
    normalizedTruckId ? { field: "targetTruckId", value: normalizedTruckId } : null,
  ].filter(Boolean);

  if (!targets.length) {
    onChange?.([]);
    return () => {};
  }

  const notificationsMap = new Map();

  const emit = () => {
    const nextNotifications = [...notificationsMap.values()]
      .sort(
        (left, right) =>
          getNotificationTimestampValue(right.createdAt || right.updatedAt)
          - getNotificationTimestampValue(left.createdAt || left.updatedAt),
      )
      .slice(0, maxResults);

    onChange?.(nextNotifications);
  };

  const unsubscribers = targets.map((target) =>
    onSnapshot(
      query(
        collection(db, "notifications"),
        where(target.field, "==", target.value),
        limit(maxResults),
      ),
      (snapshot) => {
        snapshot.docs.forEach((item) => {
          notificationsMap.set(item.id, { id: item.id, ...item.data() });
        });
        emit();
      },
      (error) => {
        onError?.(error);
      },
    ));

  return () => {
    unsubscribers.forEach((unsubscribe) => unsubscribe());
  };
};
