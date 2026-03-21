import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getFirestore,
  serverTimestamp,
  updateDoc,
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
