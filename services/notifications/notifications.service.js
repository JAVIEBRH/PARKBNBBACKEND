import Notification from '../../models/Notification.js';
import { getPaginationParams } from '../../utils/pagination.js';

export const getNotifications = async (userId, query) => {
  const { page, limit, skip, sort } = getPaginationParams(query);

  const filter = { user: userId };

  if (query.isRead !== undefined) {
    filter.isRead = query.isRead === 'true';
  }

  if (query.type) {
    filter.type = query.type;
  }

  const notifications = await Notification.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Notification.countDocuments(filter);
  const unreadCount = await Notification.countDocuments({ user: userId, isRead: false });

  return {
    notifications,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      unreadCount,
    },
  };
};

export const markAsRead = async (userId, notificationIds) => {
  if (!Array.isArray(notificationIds)) {
    notificationIds = [notificationIds];
  }

  await Notification.updateMany(
    {
      _id: { $in: notificationIds },
      user: userId,
    },
    {
      isRead: true,
      readAt: new Date(),
    }
  );

  return { success: true };
};

export const markAllAsRead = async (userId) => {
  await Notification.updateMany(
    {
      user: userId,
      isRead: false,
    },
    {
      isRead: true,
      readAt: new Date(),
    }
  );

  return { success: true };
};

export const createNotification = async (userId, data) => {
  const notification = await Notification.create({
    user: userId,
    type: data.type,
    title: data.title,
    message: data.message,
    data: data.data,
    reference: data.reference,
    actionUrl: data.actionUrl,
  });

  return notification;
};

export const savePushToken = async (userId, token, platform) => {
  // Mock: in production, save to user's push tokens
  return { success: true, token, platform };
};

export const deletePushToken = async (userId, token) => {
  // Mock: in production, remove from user's push tokens
  return { success: true };
};

