import { db } from "./config";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  orderBy,
  limit,
  serverTimestamp,
} from "firebase/firestore";

/**
 * Create a notification for a user
 */
export const createNotification = async (userId, notificationData) => {
  try {
    await addDoc(collection(db, "notifications"), {
      userId: userId,
      type: notificationData.type,
      title: notificationData.title,
      message: notificationData.message,
      amount: notificationData.amount || null,
      read: false,
      createdAt: serverTimestamp(),
    });

    // console.log("✅ Notification created for user:", userId);

    // Request browser notification permission and show
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(notificationData.title, {
        body: notificationData.message,
        icon: "/logo192.png",
        badge: "/logo192.png",
        tag: `notification-${Date.now()}`,
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Error creating notification:", error);
    return { success: false, error };
  }
};

/**
 * Get notifications for a user
 */
export const getUserNotifications = async (userId, limitCount = 10) => {
  try {
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    const notifications = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return notifications;
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return [];
  }
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (notificationId) => {
  try {
    await updateDoc(doc(db, "notifications", notificationId), {
      read: true,
      readAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return { success: false };
  }
};

/**
 * Mark all notifications as read for a user
 */
export const markAllNotificationsAsRead = async (userId) => {
  try {
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", userId),
      where("read", "==", false)
    );

    const snapshot = await getDocs(q);

    const updatePromises = snapshot.docs.map((docSnapshot) =>
      updateDoc(doc(db, "notifications", docSnapshot.id), {
        read: true,
        readAt: serverTimestamp(),
      })
    );

    await Promise.all(updatePromises);
    return { success: true };
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return { success: false };
  }
};

/**
 * Get unread notification count
 */
export const getUnreadNotificationCount = async (userId) => {
  try {
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", userId),
      where("read", "==", false)
    );

    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error("Error getting unread count:", error);
    return 0;
  }
};

/**
 * Request browser notification permission
 */
export const requestNotificationPermission = async () => {
  if (!("Notification" in window)) {
    console.log("This browser does not support notifications");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
};
