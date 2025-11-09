import Thread from '../../models/Thread.js';
import Message from '../../models/Message.js';
import { NotFoundError, ForbiddenError } from '../../utils/errors.js';
import { getPaginationParams } from '../../utils/pagination.js';

export const getThreads = async (userId, query) => {
  const { page, limit, skip } = getPaginationParams(query);

  const threads = await Thread.find({
    participants: userId,
  })
    .populate('participants', 'firstName lastName avatar')
    .populate('lastMessage')
    .populate('booking', 'startDate endDate status')
    .sort({ lastMessageAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Thread.countDocuments({ participants: userId });

  return {
    threads,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const createThread = async (userId, data) => {
  // Check if thread already exists for this booking
  if (data.bookingId) {
    const existingThread = await Thread.findOne({ booking: data.bookingId });

    if (existingThread) {
      return existingThread;
    }
  }

  const participants = [userId, data.participantId];

  const thread = await Thread.create({
    participants,
    booking: data.bookingId,
  });

  return thread.populate('participants', 'firstName lastName avatar');
};

export const getThread = async (userId, threadId) => {
  const thread = await Thread.findById(threadId)
    .populate('participants', 'firstName lastName avatar')
    .populate('booking', 'startDate endDate status');

  if (!thread) {
    throw new NotFoundError('Thread no encontrado');
  }

  if (!thread.participants.some((p) => p._id.toString() === userId)) {
    throw new ForbiddenError('No tienes permiso para ver este thread');
  }

  return thread;
};

export const getMessages = async (userId, threadId, query) => {
  const { page, limit, skip } = getPaginationParams(query);

  const thread = await Thread.findById(threadId);

  if (!thread) {
    throw new NotFoundError('Thread no encontrado');
  }

  if (!thread.participants.some((p) => p.toString() === userId)) {
    throw new ForbiddenError('No tienes permiso para ver los mensajes de este thread');
  }

  const messages = await Message.find({ thread: threadId })
    .populate('sender', 'firstName lastName avatar')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Message.countDocuments({ thread: threadId });

  return {
    messages: messages.reverse(), // Oldest first
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const sendMessage = async (userId, threadId, data) => {
  const thread = await Thread.findById(threadId);

  if (!thread) {
    throw new NotFoundError('Thread no encontrado');
  }

  if (!thread.participants.some((p) => p.toString() === userId)) {
    throw new ForbiddenError('No tienes permiso para enviar mensajes a este thread');
  }

  const message = await Message.create({
    thread: threadId,
    sender: userId,
    content: data.content,
    attachments: data.attachments,
  });

  // Update thread
  thread.lastMessage = message._id;
  thread.lastMessageAt = new Date();

  // Increment unread count for other participants
  thread.participants.forEach((participantId) => {
    if (participantId.toString() !== userId) {
      const currentCount = thread.unreadCount.get(participantId.toString()) || 0;
      thread.unreadCount.set(participantId.toString(), currentCount + 1);
    }
  });

  await thread.save();

  return message.populate('sender', 'firstName lastName avatar');
};

export const markAsRead = async (userId, threadId) => {
  const thread = await Thread.findById(threadId);

  if (!thread) {
    throw new NotFoundError('Thread no encontrado');
  }

  if (!thread.participants.some((p) => p.toString() === userId)) {
    throw new ForbiddenError('No tienes permiso para marcar este thread como leído');
  }

  // Reset unread count
  thread.unreadCount.set(userId, 0);
  await thread.save();

  // Mark messages as read
  await Message.updateMany(
    {
      thread: threadId,
      sender: { $ne: userId },
      'readBy.user': { $ne: userId },
    },
    {
      $push: {
        readBy: {
          user: userId,
          readAt: new Date(),
        },
      },
    }
  );

  return { success: true };
};

